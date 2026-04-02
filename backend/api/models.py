import io
import os
import uuid
import logging
from django.conf import settings
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.core.files.base import ContentFile
from django.contrib.auth.models import AbstractUser
from pymongo import MongoClient
from bson import ObjectId
from PIL import Image

class CustomUser(AbstractUser):
    """
    Modello Utente Personalizzato che usa UUIDv4 come Primary Key.
    Mantiene tutte le funzionalità standard di auth (password, permessi).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    def __str__(self):
        return self.email or self.username

logger = logging.getLogger(__name__)

def custom_user_directory_path(instance, filename):
    # I files andranno fisicamente in cartelle separate: media/documents/user_4/file.webp
    # Questo mantiene ordine e isolamento assoluto nel disco fisso!
    return f'documents/user_{instance.user.id}/{filename}'

class Document(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'In Coda'),
        ('PROCESSING', 'In Elaborazione'),
        ('COMPLETED', 'Completato'),
        ('FAILED', 'Fallito'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to=custom_user_directory_path)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    error_message = models.TextField(blank=True, null=True, help_text="Eventuale errore del task OCR")
    ocr_result = models.JSONField(blank=True, null=True, help_text="Risultato JSON OCR (DEPRECATO - In transizione verso MongoDB)")
    mongo_result_id = models.CharField(max_length=24, blank=True, null=True, help_text="ID del documento in MongoDB")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Campi Denormalizzati per Performance (Lista/Filtri)
    supplier_name = models.CharField(max_length=255, blank=True, null=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    invoice_date = models.DateField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # 1. Controlliamo di intercettare il file solo della "prima creazione" e non dei normali "update" a DB.
        if self.file and not self.id:
            # Peschiamo l'ultima voce del nome dopo il punto ".pdf", ".jpg", trasformata in minuscolo
            ext = os.path.splitext(self.file.name)[1].lower()
            
            # 2. SE IL FILE È UN'IMMAGINE, facciamo la magia. SE È PDF lo ignoriamo e salverà lo standard!
            if ext in ['.jpg', '.jpeg', '.png']:
                try:
                    # Apriamo in RAM l'immagine tramite Pillow
                    img = Image.open(self.file)
                    
                    # Convertiamo a RGB "solido" (questo ci salva se è un PNG con canale trasparente, che darebbe crach con WebP)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                        
                    # Togliamo via il "grasso superfluo".
                    # Se l'immagine è gigantesca (es 6000x4000) la rimpicciolisce tenendo le proporzioni.
                    # 2000x2000 pixel è il "Santo Graal" per l'OCR. Perfettamente leggibile, pesa niente.
                    img.thumbnail((2000, 2000), Image.Resampling.LANCZOS)
                    
                    # Prepariamo un buffer virtuale (non appesantiamo il disco d'appoggio)
                    buffer = io.BytesIO()
                    
                    # Esportiamo l'immagine dal programma salvandola in questo buffer col formato "WEBP" compresso all'80%.
                    img.save(buffer, format='WEBP', quality=80)
                    
                    # Sostituiamo il nome del file della foto per mettergli 'webp' alla fine.
                    new_filename = os.path.splitext(self.file.name)[0] + '.webp'
                    
                    # Passiamo l'immagine compressa (buffer) sopra alla proprietà '.file' di questo Database record,
                    # letteralmente schiacciando la foto enorme entrante dal browser e salvando solo il WEBP.
                    self.file.save(new_filename, ContentFile(buffer.getvalue()), save=False)
                    
                except Exception as e:
                    logger.error(f"[Sistema Ottimizzatore PIL] ERRORE durante compressione {self.file.name}: {e}")
                    pass

        # 3. Solo adesso attiviamo la funzione pre-installata di Django che scrive sul disco C:/ 
        # (se PDF sarà crudo, se FOTO sarà webp ridimensionata!).
        super(Document, self).save(*args, **kwargs)

    def __str__(self):
        return f"Doc {self.id} | {self.file.name}"

@receiver(post_delete, sender=Document)
def cleanup_mongo_document(sender, instance, **kwargs):
    """
    Segnale di Cleanup Professionale:
    Quando un record Document viene eliminato da PostgreSQL, 
    elimina automaticamente il relativo JSON da MongoDB se presente.
    """
    if instance.mongo_result_id:
        try:
            mongo_uri = os.environ.get('MONGO_URI')
            db_name = os.environ.get('MONGO_DB_NAME')
            if mongo_uri and db_name:
                client = MongoClient(mongo_uri)
                db = client[db_name]
                collection = db['invoices']
                
                # Cancellazione effettiva da MongoDB
                result = collection.delete_one({"_id": ObjectId(instance.mongo_result_id)})
                if result.deleted_count > 0:
                    logger.info(f"[Cleanup] Documento MongoDB {instance.mongo_result_id} eliminato dopo rimozione Postgres.")
                else:
                    logger.warning(f"[Cleanup] Tentata eliminazione di {instance.mongo_result_id} ma non trovato su MongoDB.")
        except Exception as e:
            logger.error(f"[Cleanup] Errore durante l'eliminazione da MongoDB: {e}")
