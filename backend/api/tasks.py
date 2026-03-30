import logging
from celery import shared_task
from django.db import transaction
from .models import Document
from .services import OCRService

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_document_task(self, document_id, content_type):
    """
    Task Celery per elaborare in background il documento caricato.
    - Cambia stato in PROCESSING
    - Chiama il microservizio OCR con logica di RETRY
    - Salva i risultati o l'errore nel database (COMPLETED / FAILED)
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
        # result_or_error contiene i 'data' JSON
        doc.ocr_result = result_or_error
        doc.status = 'COMPLETED'
        doc.save()
        logger.info(f"[Task] Elaborazione completata per {doc.file.name}")
    else:
        # Se l'errore è di connessione o il motore è offline, proviamo il RETRY di Celery
        if error_code in ["CONNECTION_ERROR", "OCR_OFFLINE"] and self.request.retries < self.max_retries:
            logger.warning(f"[Task] Errore temporaneo ({error_code}). Tentativo di retry tra 20s...")
            raise self.retry(countdown=20)

        # Fallimento definitivo dopo i retry o per errore di logica (INVALID_DOCUMENT)
        doc.status = 'FAILED'
        doc.error_message = f"[{error_code}] {result_or_error}"
        doc.save()
        logger.error(f"[Task] Elaborazione FALLITA DEFINITIVAMENTE per {doc.file.name}: {result_or_error}")
