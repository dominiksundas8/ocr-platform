import os
from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework import serializers
from django.contrib.auth.models import User
from pymongo import MongoClient
from bson import ObjectId
from .models import Document

def get_mongo_collection():
    """Utility per l'accesso a MongoDB."""
    mongo_uri = os.environ.get('MONGO_URI')
    db_name = os.environ.get('MONGO_DB_NAME')

    if not mongo_uri or not db_name:
        raise ValueError("ERRORE: Configurazione MongoDB (MONGO_URI o MONGO_DB_NAME) mancante nel file .env!")
    
    client = MongoClient(mongo_uri)
    db = client[db_name]
    return db['invoices']

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
    # Trasformiamo ocr_result in un campo calcolato (HYDRATION)
    ocr_result = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ('id', 'user', 'file', 'status', 'error_message', 'ocr_result', 'mongo_result_id', 'uploaded_at')
        read_only_fields = ('user', 'status', 'error_message', 'ocr_result', 'mongo_result_id')

    def get_ocr_result(self, obj):
        """
        Logica di Hydration:
        Se il dato è su MongoDB (tramite mongo_result_id), lo recupera in tempo reale.
        Altrimenti restituisce il campo locale ocr_result (per i vecchi documenti).
        """
        if obj.mongo_result_id:
            try:
                collection = get_mongo_collection()
                # Cerchiamo su mongo usando l'Object_ID salvato in Postgres
                mongo_doc = collection.find_one({"_id": ObjectId(obj.mongo_result_id)})
                if mongo_doc:
                    # 🛡️ CROSS-CHECK DI SICUREZZA: Verifica che il dato appartenga all'utente proprietario
                    if str(mongo_doc.get('user_id')) != str(obj.user.id):
                        return {"error": "Access denied: Data ownership mismatch."}
                    
                    # Ritorna il campo 'data' che contiene il JSON dell'OCR
                    return mongo_doc.get('data')
            except Exception:
                # Fallback silenzioso in caso di errore DB NoSQL
                return {"error": "NoSQL persistence layer unreachable"}
        
        # Fallback per documenti legacy ancora su Postgres
        return obj.ocr_result
