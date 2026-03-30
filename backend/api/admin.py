from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    # Mostra bellissime colonne tabellari invece che nomi anonimi
    list_display = ('id', 'user', 'file', 'uploaded_at')
    
    # Crea una barra laterale per filtrare rapidamente per Utente o Data
    list_filter = ('uploaded_at', 'user')
