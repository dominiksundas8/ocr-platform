# Cosi facendo, ci assicuriamo che l'app Celery venga importata sempre quando Django si avvia.
# Questo fa sì che le task abbiano accesso al modulo `@shared_task`.
from .celery_app import app as celery_app

__all__ = ('celery_app',)
