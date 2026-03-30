import logging
import requests
from rest_framework import generics, serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.db.models import Count
from django.contrib.auth.models import User
from .models import Document
from .serializers import DocumentSerializer, AdminUserSerializer, CustomUserDetailsSerializer
from .services import OCRService
from .tasks import process_document_task

# Configura il logger
logger = logging.getLogger(__name__)

# Limite di 5MB in bytes
MAX_SIZE_MB = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_connection(request):
    """Semplice root test libero a tutti."""
    return Response({"status": "Backend Django OK, risponde REST!"})

class DocumentListView(generics.ListAPIView):
    """Ritorna ESCLUSIVAMENTE l'elenco dei documenti di chi fa la chiamata API"""
    serializer_class = DocumentSerializer

    def get_queryset(self):
        # Questo filtro è un lucchetto formidabile: The Request.User!
        return Document.objects.filter(user=self.request.user).order_by('-uploaded_at')

class DocumentDetailView(generics.RetrieveDestroyAPIView):
    """Ritorna uno specifico documento solo se appartiene a chi lo richiede o se l'utente è Staff"""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Se lo staff interroga, diamo tutto. Altrimenti solo i propri.
        if self.request.user.is_staff:
            return Document.objects.all()
        return Document.objects.filter(user=self.request.user)

class AdminUserListView(generics.ListAPIView):
    """
    Tira giù la rubrica clienti. Grazie ad `annotate`, calcola i totali a livello C per essere velocissimo, senza saturare la RAM Server.
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return User.objects.annotate(document_count=Count('documents')).order_by('-date_joined')

class AdminDocumentListView(generics.ListAPIView):
    """
    Ritorna tutto il data-lake mondiale oppure il caveau di un CLIENTE SINGOLO 
    passando il query parameter `?user_id=X` 
    """
    serializer_class = DocumentSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        # Database Intero Iniziale
        qs = Document.objects.all().order_by('-uploaded_at')
        
        # Estrae il filtro dinamicamente dall'indirizzo HTTP Get se presente, es. /api/admin/documents/?user_id=3
        user_id = self.request.query_params.get('user_id', None)
        if user_id is not None:
             qs = qs.filter(user_id=user_id)
        
        return qs

class AdminUserDetailView(generics.RetrieveDestroyAPIView):
    """
    Permette all'admin di visualizzare o ELIMINARE un intero account utente.
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

class UploadDocumentView(APIView):
    # Parser per accettare File dal Browser
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "Nessun file trovato nel payload"}, status=400)
            
        logger.info(f"Ricevuto upload '{file_obj.name}' da utente {request.user.email}")
        
        # VALIDAZIONE
        if file_obj.size > MAX_SIZE_BYTES:
            return Response({"error": f"Il file eccede il limite di {MAX_SIZE_MB}MB."}, status=400)
        if file_obj.content_type not in ALLOWED_TYPES:
            return Response({"error": f"Formato non ammesso. Accettiamo PDF, JPG, PNG."}, status=400)
        
        # 1. Creazione record pendente (Pillow compresserà le foto automaticamente)
        doc_record = Document.objects.create(user=request.user, file=file_obj, status='PENDING')
        
        # 2. Inoltro del job in coda asincrona (Celery Broker)
        process_document_task.delay(doc_record.id, file_obj.content_type)
        
        # 3. Ritorna istantaneamente 202 Accepted al frontend
        return Response({
            "message": "Fattura in elaborazione, attendere il completamento.",
            "document": DocumentSerializer(doc_record).data
        }, status=202)
