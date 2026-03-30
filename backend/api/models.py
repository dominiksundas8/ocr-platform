import io
import os
import logging
from django.db import models
from django.core.files.base import ContentFile
from django.contrib.auth.models import User
from PIL import Image

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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to=custom_user_directory_path)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    error_message = models.TextField(blank=True, null=True, help_text="Eventuale errore del task OCR")
    ocr_result = models.JSONField(blank=True, null=True, help_text="Risultato JSON OCR")
    uploaded_at = models.DateTimeField(auto_now_add=True)

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
