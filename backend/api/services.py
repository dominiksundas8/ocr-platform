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
        ocr_url = os.environ.get('FASTAPI_OCR_URL', 'http://ocr_service:8001/extract')
        
        logger.info(f"Inizio elaborazione OCR per documento {doc_record.id}")
        
        try:
            with doc_record.file.open('rb') as f:
                files = {'file': (doc_record.file.name, f.read(), content_type)}
                # Timeout generoso per la prima esecuzione (download modelli)
                response = requests.post(ocr_url, files=files, timeout=120)
                
            if response.status_code == 200:
                data = response.json()
                
                # Validazione KYC: se non è un documento d'identità, lo scartiamo
                if not data.get('valid_id', True):
                    logger.warning(f"Documento {doc_record.id} scartato: Non è un'identità valida.")
                    doc_record.delete()
                    return None, "Documento non riconosciuto come Carta d'Identità o Passaporto.", "INVALID_IDENTITY"
                
                # Successo: salviamo il risultato
                doc_record.ocr_result = data
                doc_record.save()
                logger.info(f"OCR completato con successo per documento {doc_record.id}")
                return DocumentSerializer(doc_record).data, None, None
            
            else:
                logger.error(f"Errore FastAPI (Status {response.status_code}): {response.text}")
                doc_record.delete()
                return None, f"Motore OCR Offline: {response.status_code}", "OCR_OFFLINE"
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Errore di connessione a FastAPI: {str(e)}")
            doc_record.delete()
            return None, "Impossibile connettersi al motore OCR.", "CONNECTION_ERROR"
