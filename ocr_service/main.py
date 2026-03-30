import os
import io
import json
from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from pydantic import BaseModel, Field
import google.generativeai as genai

# Configurazione API Gemini
API_KEY = os.getenv("GEMINI_API_KEY", "")
INTERNAL_SECRET = os.getenv("INTERNAL_API_SECRET", "")

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
async def extract_identity(request: Request, file: UploadFile = File(...)):
    # Verifica segreto interno: solo Django può chiamare questo endpoint
    if INTERNAL_SECRET and request.headers.get("X-Internal-Secret") != INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="Accesso non autorizzato.")

    contents = await file.read()
    
    if not API_KEY:
        return {"status": "error", "error": "API Key mancante"}

    try:
        # Usiamo il modello rilevato dalla sonda
        model = genai.GenerativeModel(ACTIVE_MODEL)
        
        prompt = """
        Analizza con la massima precisione questa immagine di un documento commerciale (FATTURA, ORDINE, PREVENTIVO, SCONTRINO o RICEVUTA).
        Estrai i dati commerciali e finanziari richiesti e rispondi rigorosamente con un oggetto JSON valido.
        
        {
          "is_invoice": true/false, // Imposta a true se è una fattura, un ordine, una ricevuta, uno scontrino o un documento contabile simile.
          "document_type": "Fattura | Conferma d'ordine | Preventivo | Ricevuta | Scontrino",
          "fornitore": {
            "nome": "Ragione Sociale o Nome del Venditore",
            "piva": "Partita IVA o Tax ID (se visibile)",
            "indirizzo": "Indirizzo completo (se visibile)"
          },
          "dati_fattura": {
            "numero": "Numero del documento (es. Nr ordine, Nr Fattura)",
            "data": "Avalaible format: YYYY-MM-DD",
            "scadenza": "Avalaible format: YYYY-MM-DD"
          },
          "totali": {
            "imponibile": 120.50,
            "tasse": 26.51,
            "totale_da_pagare": 147.01,
            "valuta": "EUR | USD | ecc"
          },
          "righe": [
            {
              "descrizione": "Nome prodotto, servizio o denominazione",
              "quantita": 1,
              "prezzo_unitario": 120.50,
              "prezzo_totale": 120.50
            }
          ]
        }
        
        ATTENZIONE: Imposta is_invoice su FALSE **solo** se l'immagine è chiaramente una foto personale, un paesaggio o qualcosa di totalmente estraneo alla contabilità aziendale/ordini commerciali.
        I valori numerici in 'totali' e 'righe' devono essere float calcolati o trascritti e non devono contenere la valuta (euro, $, ecc).
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

        if not ai_data.get("is_invoice", True):
             return {"status": "invalid", "valid_id": False, "error": "Documento non riconosciuto come FATTURA."}

        return {
            "status": "success",
            "valid_id": True,
            "engine": ACTIVE_MODEL,
            "extracted_data": {
                "campi_strutturati": ai_data
            }
        }
    except Exception as e:
        error_msg = str(e)
        print(f"[Gemini Error]: {error_msg}")
        
        # 🛡️ Hardening: Eleviamo correttamente l'errore HTTP
        if "429" in error_msg or "ResourceExhausted" in error_msg:
             raise HTTPException(status_code=429, detail=f"Gemini Rate Limit: {error_msg}")
        
        raise HTTPException(status_code=500, detail=f"Errore AI ({ACTIVE_MODEL}): {error_msg}")

@app.get("/")
def read_root():
    return {"status": "ready", "model_active": ACTIVE_MODEL}
