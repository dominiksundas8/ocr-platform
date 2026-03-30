import os
import logging
from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Document

logger = logging.getLogger(__name__)

@receiver(post_delete, sender=Document)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Rimuove il file dal disco quando il record corrispondente 
    viene eliminato dal database. Impedisce l'accumulo di file spazzatura.
    """
    if instance.file:
        if os.path.isfile(instance.file.path):
            try:
                os.remove(instance.file.path)
                logger.info(f"File fisico rimosso dal disco per Documento {instance.id}: {instance.file.path}")
            except Exception as e:
                logger.error(f"Errore nella rimozione fisica del file {instance.id}: {str(e)}")
