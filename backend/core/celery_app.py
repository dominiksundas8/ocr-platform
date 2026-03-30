import os
from celery import Celery

# Imposta il modulo di configurazione di Django di default per la riga di comando 'celery'.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Usa una stringa in modo che il worker non debba serializzare
# l'oggetto di configurazione nei processi figli.
# - namespace='CELERY' significa che tutte le chiavi di configurazione
#   legate a celery nel settings.py devono iniziare con 'CELERY_'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Carica i moduli dei task da tutte le app di Django registrate.
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
