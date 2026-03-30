from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Document

class CustomUserDetailsSerializer(UserDetailsSerializer):
    """
    Sovrascrive la risposta di User Details di DJ-Rest-Auth
    per includere il flag 'is_staff' vitale per la Dashboard Next.js.
    """
    class Meta(UserDetailsSerializer.Meta):
        fields = ('pk', 'username', 'email', 'first_name', 'last_name', 'is_staff')

class AdminUserSerializer(serializers.ModelSerializer):
    """ Impacchetta i dati del cliente estraendo anche il monte fatture grazie ad un'annotazione del DB! """
    document_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'date_joined', 'is_staff', 'document_count')

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'user', 'file', 'ocr_result', 'uploaded_at')
        read_only_fields = ('user',)
