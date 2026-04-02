from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Document, CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    # Tabella ottimizzata per gli ID lunghi
    list_display = ('id', 'email', 'username', 'is_staff')
    search_fields = ('email', 'username', 'id')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    # Mostra bellissime colonne tabellari invece che nomi anonimi
    list_display = ('id', 'user', 'file', 'uploaded_at')
    
    # Crea una barra laterale per filtrare rapidamente per Utente o Data
    list_filter = ('uploaded_at', 'user')
