import os
import io
import json
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel, Field
import google.generativeai as genai

# Configurazione API Gemini
API_KEY = os.getenv("GEMINI_API_KEY", "")

# Variabile globale che caricheremo all'avvio
ACTIVE_MODEL = "gemini-1.5-flash" 

def discover_model():
    """Interroga Google per trovare il nome esatto del modello disponibile"""
    global ACTIVE_MODEL
    if not API_KEY:
        return
    
    try:
        genai.configure(api_key=API_KEY)
        # Elenchiamo tutti i modelli supportati per questo account
        models = genai.list_models()
        available = [m.name for m in models if "generateContent" in m.supported_generation_methods]
        
        print(f"[Gemini Probe] Modelli rilevati: {available}")
        
        # Priorità invertita: puntiamo sulla stabilità di 1.5-flash per il Free Tier
        priority = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.5-flash-8b"]
        for p in priority:
            for m in available:
                if p in m:
                    ACTIVE_MODEL = m
                    print(f"[Gemini Selection] Scelto il modello: {ACTIVE_MODEL}")
                    return
        
        # Se non troviamo nulla nella priorità, prendiamo il primo disponibile
        if available:
            ACTIVE_MODEL = available[0]
            print(f"[Gemini Selection] Nessun match priorità. Scelto: {ACTIVE_MODEL}")
            
    except Exception as e:
        print(f"[Gemini Probe Error] Impossibile rilevare modelli: {e}")

# Eseguiamo la sonda all'avvio
discover_model()

app = FastAPI(title="Vision AI KYC Engine")

@app.post("/extract")
async def extract_identity(file: UploadFile = File(...)):
    contents = await file.read()
    
    if not API_KEY:
        return {"status": "error", "error": "API Key mancante"}

    try:
        # Usiamo il modello rilevato dalla sonda
        model = genai.GenerativeModel(ACTIVE_MODEL)
        
        prompt = """
        Analizza con attenzione questa immagine di un documento d'identità (Patente di Guida o Carta d'Identità Elettronica). 
        Estrai i dati richiesti e rispondi rigorosamente con un oggetto JSON valido:
        {
          "document_type": "Patente di Guida | Carta d'Identità",
          "persona_nome": "Nome/i (es: MARIO ALBERTO)",
          "persona_cognome": "Cognome (es: ROSSI)",
          "documento_numero": "Senza spazi (es: CA00000AZ o U1234567X)",
          "data_nascita": "GG/MM/AAAA",
          "luogo_nascita": "Comune o Stato (es: ROMA)",
          "sesso": "M | F",
          "scadenza": "GG/MM/AAAA",
          "rilasciato_da": "Ente (es: Comune di Milano o MIT)",
          "is_identity_document": true/false
        }
        
        Se l'immagine non è una Patente di Guida o una Carta d'Identità Elettronica (CIE) allora is_identity_document deve essere false. Il passaporto NON è un documento supportato.
        """
        
        image_parts = [
            {"mime_type": file.content_type, "data": contents}
        ]
        
        # Chiamata all'IA
        response = model.generate_content([prompt, image_parts[0]], generation_config={"response_mime_type": "application/json"})
        
        # Parsing sicuro del JSON
        try:
            ai_data = json.loads(response.text)
        except:
            # Fallback se non restituisce JSON pulito
            text = response.text.strip()
            if "```json" in text: text = text.split("```json")[1].split("```")[0].strip()
            ai_data = json.loads(text)

        if not ai_data.get("is_identity_document", True):
             return {"status": "invalid", "valid_id": False, "error": "Documento non riconosciuto dall'IA"}

        return {
            "status": "success",
            "valid_id": True,
            "engine": ACTIVE_MODEL,
            "extracted_data": {
                "campi_strutturati": ai_data
            }
        }
    except Exception as e:
        print(f"[Gemini Error]: {str(e)}")
        # Se fallisce il modello rilevato, proviamo un ultimo tentativo con quello generico
        return {"status": "error", "error": f"Errore AI ({ACTIVE_MODEL}): {str(e)}"}

@app.get("/")
def read_root():
    return {"status": "ready", "model_active": ACTIVE_MODEL}
