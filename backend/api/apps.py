from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # I segnali devono essere importati solo quando l'App è "pronta".
        import api.signals
