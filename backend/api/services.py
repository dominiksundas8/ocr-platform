import os
import requests
import logging
from .models import Document
from .serializers import DocumentSerializer

logger = logging.getLogger(__name__)

class OCRService:
    """
    Service Layer per gestire la comunicazione con il microservizio FastAPI OCR.
    Mantiene le views pulite e gestisce errori e cleanup.
    """
    
    @staticmethod
    def process_document(doc_record: Document, content_type: str):
        ocr_url = os.environ.get('FASTAPI_OCR_URL')
        internal_secret = os.environ.get('INTERNAL_API_SECRET')
        
        if not ocr_url:
            logger.error("ERRORE CRITICO: FASTAPI_OCR_URL non impostata nel .env")
            return False, "Configurazione OCR mancante.", "CONFIG_ERROR"
        
        logger.info(f"Inizio elaborazione OCR per documento {doc_record.id}")
        
        try:
            with doc_record.file.open('rb') as f:
                files = {'file': (doc_record.file.name, f.read(), content_type)}
                headers = {'X-Internal-Secret': internal_secret}
                response = requests.post(ocr_url, files=files, headers=headers, timeout=120)
                
            if response.status_code == 200:
                data = response.json()
                
                # 🛡️ Hardening: Controllo preventivo se il microservizio ha girato un errore Gemini
                if data.get('status') == 'error':
                    logger.error(f"Errore logico nell'OCR: {data.get('error')}")
                    return False, data.get('error'), "OCR_LOGIC_ERROR"

                # Validazione KYC: se non è un documento d'identità, lo scartiamo
                if not data.get('valid_id', True):
                    logger.warning(f"Documento {doc_record.id} scartato: non è una fattura valida.")
                    return False, "Documento non riconosciuto come fattura valida.", "INVALID_DOCUMENT"
                
                # Successo: ritorniamo il risultato, salvataggio delegato al chiamante
                logger.info(f"OCR completato con successo per documento {doc_record.id}")
                return True, data, None
            
            elif response.status_code == 429:
                # 🛡️ Hardening: Mappatura specifica errore di quota
                logger.warning(f"Rate Limit superato su FastAPI: {response.text}")
                return False, "Limite quota superato (Gemini).", "RATE_LIMIT"
            
            else:
                logger.error(f"Errore FastAPI (Status {response.status_code}): {response.text}")
                return False, f"Motore OCR Offline: {response.status_code}", "OCR_OFFLINE"
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Errore di connessione a FastAPI: {str(e)}")
            return False, "Impossibile connettersi al motore OCR.", "CONNECTION_ERROR"
