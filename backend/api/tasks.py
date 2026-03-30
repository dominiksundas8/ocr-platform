import logging
import os
from celery import shared_task
from django.db import transaction
from pymongo import MongoClient
from bson import ObjectId
from .models import Document
from .services import OCRService

logger = logging.getLogger(__name__)

def get_mongo_collection():
    """Ritorna la collezione MongoDB per il salvataggio dei risultati OCR."""
    mongo_uri = os.environ.get('MONGO_URI')
    db_name = os.environ.get('MONGO_DB_NAME')
    
    if not mongo_uri or not db_name:
        raise ValueError("ERRORE: Configurazione MongoDB (MONGO_URI o MONGO_DB_NAME) mancante nel file .env!")
    
    client = MongoClient(mongo_uri)
    db = client[db_name]
    return db['invoices']

@shared_task(bind=True, max_retries=3)
def process_document_task(self, document_id, content_type):
    """
    Task Celery per elaborare in background il documento caricato.
    - Cambia stato in PROCESSING
    - Chiama il microservizio OCR con logica di RETRY
    - Salva il JSON in MONGODB e il riferimento in POSTGRESQL
    """
    try:
        # Preleviamo il documento dal DB
        doc = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        logger.error(f"[Task] Documento ID={document_id} non trovato in DB.")
        return

    # Mettiamo in stato di esecuzione
    doc.status = 'PROCESSING'
    doc.error_message = None
    doc.save()

    logger.info(f"[Task] Iniziata elaborazione OCR per {doc.file.name} (Tentativo {self.request.retries + 1})")

    # Lanciamo il servizio OCR
    success, result_or_error, error_code = OCRService.process_document(doc, content_type)

    if success:
        try:
            # 1. Salvataggio su MONGODB
            collection = get_mongo_collection()
            # Inseriamo il risultato JSON aggiungendo anche il document_id di Postgres per rintracciabilità
            mongo_data = {
                "postgres_id": doc.id,
                "user_id": doc.user.id,
                "data": result_or_error
            }
            mongo_obj = collection.insert_one(mongo_data)
            mongo_id_str = str(mongo_obj.inserted_id)

            # 2. Aggiornamento POSTGRESQL
            doc.mongo_result_id = mongo_id_str
            doc.ocr_result = None  # Svuotiamo il campo vecchio (Migrazione Totale)
            doc.status = 'COMPLETED'
            doc.save()
            
            logger.info(f"[Task] Elaborazione completata. Risultato salvato in Mongo con ID {mongo_id_str}")
        except Exception as e:
            logger.error(f"[Task] Errore critico durante salvataggio su MongoDB: {e}")
            doc.status = 'FAILED'
            doc.error_message = f"Errore salvataggio NoSQL: {str(e)}"
            doc.save()
    else:
        # 🛡️ GESTIONE FALLIMENTI: Questo blocco DEVE essere fuori dal ramo 'if success'
        if error_code in ["CONNECTION_ERROR", "OCR_OFFLINE"] and self.request.retries < self.max_retries:
            logger.warning(f"[Task] Errore temporaneo ({error_code}). Tentativo di retry tra 20s...")
            raise self.retry(countdown=20)

        # Fallimento definitivo
        doc.status = 'FAILED'
        doc.error_message = f"[{error_code}] {result_or_error}"
        doc.save()
        logger.error(f"[Task] Elaborazione FALLITA DEFINITIVAMENTE per {doc.file.name}: {result_or_error}")
