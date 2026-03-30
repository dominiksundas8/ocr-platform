"""
Test Suite Completa & Blindata — Backend Django & MongoDB
========================================================
Questa suite unisce la sicurezza originale dei test PostgreSQL con 
l'integrazione NoSQL di MongoDB tramite pattern di Hydration e Cleanup.
"""
import pytest
import mongomock
import os
from unittest.mock import patch, MagicMock
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from bson import ObjectId


# ==============================================================================
# FIXTURES E UTILITY MONGODB (Indispensabili per i nuovi task)
# ==============================================================================

@pytest.fixture
def mock_mongo():
    """Fixture che intercetta get_mongo_collection e ritorna un mock locale."""
    with patch('api.tasks.get_mongo_collection') as mock_tasks_coll, \
         patch('api.serializers.get_mongo_collection') as mock_ser_coll, \
         patch('api.models.MongoClient') as mock_cleanup_client:
        
        client = mongomock.MongoClient()
        collection = client['ocr_vault']['invoices']
        
        mock_tasks_coll.return_value = collection
        mock_ser_coll.return_value = collection
        
        # Mock del client nel segnale di cleanup dei modelli
        mock_cleanup_client.return_value = client
        
        yield collection

# ==============================================================================
# 1. AUTENTICAZIONE (Originali)
# ==============================================================================

class TestAuthentication:
    """Verifica che registrazione e login funzionino correttamente."""

    def test_registration_success(self, api_client, db):
        data = {'email': 'nuovo@test.com', 'password1': 'SecurePass123!', 'password2': 'SecurePass123!'}
        response = api_client.post('/auth/registration/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='nuovo@test.com').exists()

    def test_registration_password_mismatch(self, api_client, db):
        data = {'email': 'nuovo@test.com', 'password1': 'SecurePass123!', 'password2': 'Wrong!'}
        response = api_client.post('/auth/registration/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_registration_duplicate_email(self, api_client, user_a):
        data = {'email': 'utente_a@test.com', 'password1': 'SecurePass123!', 'password2': 'SecurePass123!'}
        response = api_client.post('/auth/registration/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_success_returns_jwt(self, api_client, user_a):
        data = {'email': 'utente_a@test.com', 'password': 'TestPassword123!'}
        response = api_client.post('/auth/login/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

    def test_login_wrong_password(self, api_client, user_a):
        data = {'email': 'utente_a@test.com', 'password': 'WrongPassword!'}
        response = api_client.post('/auth/login/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_protected_endpoint_without_token_returns_401(self, api_client, db):
        response = api_client.get('/api/documents/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

# ==============================================================================
# 2. ISOLAMENTO DOCUMENTI (Originali - Critical Hardening)
# ==============================================================================

class TestDocumentIsolation:
    """Verifica che ogni utente veda SOLO i propri documenti."""

    def test_user_sees_only_own_documents(self, auth_client_a, user_a, document_of_user_a, user_b, db):
        from api.models import Document
        fake_file = SimpleUploadedFile('doc_b.jpg', b'fake', content_type='image/jpeg')
        Document.objects.create(user=user_b, file=fake_file)
        response = auth_client_a.get('/api/documents/')
        ids = [doc['id'] for doc in response.data['results']]
        assert document_of_user_a.id in ids
        assert len(ids) == 1

    def test_user_cannot_access_other_users_document(self, auth_client_a, user_b, db):
        from api.models import Document
        doc_b = Document.objects.create(user=user_b, file=SimpleUploadedFile('b.jpg', b'f'))
        response = auth_client_a.get(f'/api/documents/{doc_b.id}/')
        # Hardening: risponde 404 per non rivelare l'esistenza di ID altrui
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_user_cannot_delete_other_users_document(self, auth_client_a, user_b, db):
        from api.models import Document
        doc_b = Document.objects.create(user=user_b, file=SimpleUploadedFile('b.jpg', b'f'))
        response = auth_client_a.delete(f'/api/documents/{doc_b.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert Document.objects.filter(id=doc_b.id).exists()

    def test_unauthenticated_cannot_list_documents(self, api_client, db):
        response = api_client.get('/api/documents/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

# ==============================================================================
# 3. VALIDAZIONE UPLOAD (Originali)
# ==============================================================================

class TestUploadValidation:
    """Verifica che l'endpoint upload validi correttamente i file."""

    def test_upload_requires_authentication(self, api_client, db, fake_image):
        response = api_client.post('/api/upload/', {'file': fake_image}, format='multipart')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_file_too_large(self, auth_client_a, user_a):
        big_file = SimpleUploadedFile('big.jpg', b'\x00' * (6 * 1024 * 1024))
        response = auth_client_a.post('/api/upload/', {'file': big_file}, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upload_wrong_file_type(self, auth_client_a, user_a):
        txt_file = SimpleUploadedFile('nota.txt', b'text', content_type='text/plain')
        response = auth_client_a.post('/api/upload/', {'file': txt_file}, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upload_no_file_returns_error(self, auth_client_a, user_a):
        response = auth_client_a.post('/api/upload/', {}, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch('api.views.process_document_task.delay')
    def test_upload_valid_file_success(self, mock_delay, auth_client_a, fake_image):
        response = auth_client_a.post('/api/upload/', {'file': fake_image}, format='multipart')
        assert response.status_code == status.HTTP_202_ACCEPTED
        mock_delay.assert_called_once()

# ==============================================================================
# 4. PERMESSI ADMIN (Originali)
# ==============================================================================

class TestAdminPermissions:
    """Verifica che gli endpoint admin siano protetti dallo staff."""

    def test_normal_user_cannot_access_admin_users(self, auth_client_a, user_a):
        response = auth_client_a.get('/api/admin/users/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_normal_user_cannot_access_admin_documents(self, auth_client_a, user_a):
        response = auth_client_a.get('/api/admin/documents/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_see_all_users(self, auth_client_admin, admin_user, user_a, user_b):
        response = auth_client_admin.get('/api/admin/users/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 2

    def test_admin_can_see_all_documents(self, auth_client_admin, admin_user, document_of_user_a):
        response = auth_client_admin.get('/api/admin/documents/')
        assert response.status_code == status.HTTP_200_OK
        ids = [doc['id'] for doc in response.data['results']]
        assert document_of_user_a.id in ids

    def test_unauthenticated_cannot_access_admin(self, api_client, db):
        response = api_client.get('/api/admin/users/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

# ==============================================================================
# 5. INTEGRATION HYBRID & TASKS (Aggiornati + Nuovi)
# ==============================================================================

class TestHybridIntegration:
    """Il nucleo dell'architettura PostgreSQL + MongoDB con Celery."""

    @patch('api.tasks.OCRService.process_document')
    def test_task_full_success_hybrid(self, mock_ocr, mock_mongo, user_a, document_of_user_a, db):
        """Il task deve salvare il JSON in Mongo e collegarlo a Postgres."""
        from api.tasks import process_document_task
        from api.models import Document
        
        mock_ocr.return_value = (True, {"totale": 1337}, None)
        process_document_task.run.__func__(MagicMock(), document_of_user_a.id, "image/jpeg")
        
        doc = Document.objects.get(id=document_of_user_a.id)
        assert doc.status == 'COMPLETED'
        assert doc.mongo_result_id is not None
        assert doc.ocr_result is None # Verifichiamo che il campo Postgres sia vuoto
        
        mongo_doc = mock_mongo.find_one({"_id": ObjectId(doc.mongo_result_id)})
        assert mongo_doc['data']['totale'] == 1337
        assert mongo_doc['user_id'] == user_a.id

    @patch('api.tasks.OCRService.process_document')
    def test_task_retry_resilience(self, mock_ocr, mock_mongo, document_of_user_a, db):
        """Il task solleva Retry se l'OCR è offline (resilienza)."""
        from api.tasks import process_document_task
        from celery.exceptions import Retry

        mock_ocr.return_value = (False, "Offline", "CONNECTION_ERROR")
        m_self = MagicMock()
        m_self.max_retries = 3
        m_self.request.retries = 0
        m_self.retry.side_effect = Retry()

        with pytest.raises(Retry):
            process_document_task.run.__func__(m_self, document_of_user_a.id, "image/jpeg")

    @patch('api.tasks.OCRService.process_document')
    def test_task_final_failure(self, mock_ocr, mock_mongo, document_of_user_a, db):
        """Se il documento è invalido, il task fallisce definitivamente."""
        from api.tasks import process_document_task
        from api.models import Document
        mock_ocr.return_value = (False, "Invalid file", "INVALID_DOCUMENT")
        process_document_task.run.__func__(MagicMock(), document_of_user_a.id, "image/jpeg")
        doc = Document.objects.get(id=document_of_user_a.id)
        assert doc.status == 'FAILED'
        assert "INVALID_DOCUMENT" in doc.error_message

    def test_serializer_hydration_and_security(self, mock_mongo, user_a, user_b, db):
        """Verifica recupero dati NoSQL e protezione da ID Guessing."""
        from api.models import Document
        from api.serializers import DocumentSerializer

        # 1. Hydration ok
        ma = mock_mongo.insert_one({"user_id": user_a.id, "data": {"val": 100}}).inserted_id
        da = Document.objects.create(user=user_a, file="f.jpg", mongo_result_id=str(ma))
        assert DocumentSerializer(da).data['ocr_result']['val'] == 100

        # 2. Protection ok (Mismatch user_id tra Mongo e Postgres)
        mb = mock_mongo.insert_one({"user_id": user_b.id, "data": {"secret": "top"}}).inserted_id
        da_hacked = Document.objects.create(user=user_a, file="f2.jpg", mongo_result_id=str(mb))
        res = DocumentSerializer(da_hacked).data['ocr_result']
        assert "error" in res and "Access denied" in res['error']

    def test_automated_cleanup_signal_mongo(self, mock_mongo, user_a, db):
        """Cancellando da Postgres, il dato sparisce da Mongo (Signal Coherence)."""
        from api.models import Document
        mid = mock_mongo.insert_one({"user_id": user_a.id, "data": {"t": 1}}).inserted_id
        doc = Document.objects.create(user=user_a, file="t.jpg", mongo_result_id=str(mid))
        assert mock_mongo.find_one({"_id": mid}) is not None
        doc.delete()
        assert mock_mongo.find_one({"_id": mid}) is None
