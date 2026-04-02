import os
import django
import uuid
import time
import threading
from django.core.files.base import ContentFile

# 1. SETUP DI PROGETTO
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import CustomUser, Document
from api.tasks import process_document_task

# 🏁 CONFIGURAZIONE TEST
NUM_USERS = 100
DOCS_PER_USER = 1000
TEMPLATE_IMG = 'media/documents/user_e50a4a33-4fb8-48e3-bf7d-fe06ba338c6d/image.png'
TEMPLATE_PDF = 'media/documents/user_e50a4a33-4fb8-48e3-bf7d-fe06ba338c6d/Estratto_Conto_Capitale_Trimestrale-1.pdf'

def run_user_uploads(user_name):
    print(f"🚀 [Thread-{user_name}] Avvio simulazione utente...")
    
    # Creazione Utente
    email = f"{user_name.lower()}@stress-test.ai"
    user, created = CustomUser.objects.get_or_create(username=user_name, defaults={'email': email})
    if created:
        user.set_password('stress_test_pass_2026')
        user.save()
        print(f"👤 [Thread-{user_name}] Creato nuovo utente: {user.id}")
    else:
        print(f"👤 [Thread-{user_name}] Utilizzo utente esistente: {user.id}")

    # Caricamento Documenti
    for i in range(DOCS_PER_USER):
        is_pdf = (i == 0) # Il primo è sempre un PDF per testare il mix
        source = TEMPLATE_PDF if is_pdf else TEMPLATE_IMG
        ext = 'pdf' if is_pdf else 'png'
        
        with open(source, 'rb') as f:
            content = f.read()
            
        doc_name = f"stress_test_{user_name}_{i}.{ext}"
        
        # Creazione Record Postgres
        doc = Document.objects.create(
            user=user,
            status='PENDING'
        )
        # Salvataggio file (triggera ottimizzazione WEBP se immagine)
        doc.file.save(doc_name, ContentFile(content))
        
        print(f"📄 [Thread-{user_name}] Documento creato: {doc.id} ({doc_name})")
        
        # 🛰️ LANCIO TASK CELERY (ASINCRONO)
        content_type = 'application/pdf' if is_pdf else 'image/png'
        process_document_task.delay(doc.id, content_type)
        print(f"🛰️ [Thread-{user_name}] Task Celery inviato per {doc.id} ({content_type})")

def main():
    print("🔥 AVVIO MEGA STRESS TEST CONCORRENZA 🔥")
    start_time = time.time()
    
    threads = []
    
    for i in range(NUM_USERS):
        name = f"StressTest_User_{i+1}"
        t = threading.Thread(target=run_user_uploads, args=(name,))
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()
        
    end_time = time.time()
    total_docs = NUM_USERS * DOCS_PER_USER
    print(f"\n✅ SIMULAZIONE COMPLETATA in {end_time - start_time:.2f} secondi!")
    print(f"{total_docs} Task inviati correttamente al cluster Celery.")
    print("Vai sulla Dashboard Admin per monitorare l'estrazione in tempo reale!")

if __name__ == "__main__":
    main()
