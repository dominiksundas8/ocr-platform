"""
Test Suite Completa — Backend Django
=====================================
Organizzata in 4 classi:
1. AuthenticationTests     — registrazione e login
2. DocumentIsolationTests  — sicurezza: ogni utente vede solo i suoi dati
3. UploadValidationTests   — validazione file in ingresso
4. AdminPermissionTests    — controllo accessi admin
"""
import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status


# ==============================================================================
# 1. AUTENTICAZIONE
# ==============================================================================

class TestAuthentication:
    """Verifica che registrazione e login funzionino correttamente."""

    def test_registration_success(self, api_client, db):
        """Un nuovo utente può registrarsi con dati validi."""
        data = {
            'email': 'nuovo@test.com',
            'password1': 'SecurePass123!',
            'password2': 'SecurePass123!'
        }
        response = api_client.post('/auth/registration/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='nuovo@test.com').exists()

    def test_registration_password_mismatch(self, api_client, db):
        """La registrazione fallisce se le password non coincidono."""
        data = {
            'email': 'nuovo@test.com',
            'password1': 'SecurePass123!',
            'password2': 'DiversaPassword!'
        }
        response = api_client.post('/auth/registration/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_registration_duplicate_email(self, api_client, user_a):
        """La registrazione fallisce se l'email è già in uso."""
        data = {
            'email': 'utente_a@test.com',  # email già usata da user_a fixture
            'password1': 'SecurePass123!',
            'password2': 'SecurePass123!'
        }
        response = api_client.post('/auth/registration/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_success_returns_jwt(self, api_client, user_a):
        """Il login con credenziali valide restituisce un token JWT."""
        data = {'email': 'utente_a@test.com', 'password': 'TestPassword123!'}
        response = api_client.post('/auth/login/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data  # token JWT presente

    def test_login_wrong_password(self, api_client, user_a):
        """Il login con password sbagliata viene rifiutato."""
        data = {'email': 'utente_a@test.com', 'password': 'PasswordSbagliata!'}
        response = api_client.post('/auth/login/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_protected_endpoint_without_token_returns_401(self, api_client, db):
        """Un endpoint protetto risponde 401 se non si è autenticati."""
        response = api_client.get('/api/documents/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ==============================================================================
# 2. ISOLAMENTO DOCUMENTI (test di sicurezza più critici)
# ==============================================================================

class TestDocumentIsolation:
    """
    Verifica che ogni utente veda SOLO i propri documenti.
    Questo è il test di sicurezza più importante del sistema.
    """

    def test_user_sees_only_own_documents(self, auth_client_a, user_a, document_of_user_a, user_b, db):
        """L'utente A vede solo i propri documenti, non quelli di B."""
        # Creiamo un documento per l'utente B
        fake_file = SimpleUploadedFile('doc_b.jpg', b'\xff\xd8\xff' + b'\x00' * 50, content_type='image/jpeg')
        from api.models import Document
        Document.objects.create(user=user_b, file=fake_file, ocr_result={})

        response = auth_client_a.get('/api/documents/')
        assert response.status_code == status.HTTP_200_OK

        # L'utente A deve vedere solo il suo documento (document_of_user_a)
        ids_restituiti = [doc['id'] for doc in response.data['results']]
        assert document_of_user_a.id in ids_restituiti
        assert len(ids_restituiti) == 1  # Solo 1 documento, non 2

    def test_user_cannot_access_other_users_document(
        self, auth_client_a, document_of_user_a, user_b, db
    ):
        """L'utente A non può accedere al documento dell'utente B tramite ID."""
        fake_file = SimpleUploadedFile('doc_b.jpg', b'\xff\xd8\xff' + b'\x00' * 50, content_type='image/jpeg')
        from api.models import Document
        doc_b = Document.objects.create(user=user_b, file=fake_file, ocr_result={})

        # L'utente A tenta di accedere al documento di B
        response = auth_client_a.get(f'/api/documents/{doc_b.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND  # 404, non 403 (non rivela l'esistenza)

    def test_user_cannot_delete_other_users_document(
        self, auth_client_a, user_b, db
    ):
        """L'utente A non può eliminare il documento dell'utente B."""
        fake_file = SimpleUploadedFile('doc_b.jpg', b'\xff\xd8\xff' + b'\x00' * 50, content_type='image/jpeg')
        from api.models import Document
        doc_b = Document.objects.create(user=user_b, file=fake_file, ocr_result={})

        response = auth_client_a.delete(f'/api/documents/{doc_b.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # Verifichiamo che il documento esista ancora nel DB
        assert Document.objects.filter(id=doc_b.id).exists()

    def test_unauthenticated_cannot_list_documents(self, api_client, db):
        """Un utente non autenticato non può vedere la lista documenti."""
        response = api_client.get('/api/documents/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ==============================================================================
# 3. VALIDAZIONE UPLOAD
# ==============================================================================

class TestUploadValidation:
    """Verifica che l'endpoint upload validi correttamente i file in ingresso."""

    def test_upload_requires_authentication(self, api_client, db, fake_image):
        """Non si può fare upload senza essere autenticati."""
        response = api_client.post('/api/upload/', {'file': fake_image}, format='multipart')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_file_too_large(self, auth_client_a, user_a):
        """Un file che supera il limite di 5MB viene rifiutato."""
        # Creiamo un file finto da 6MB
        big_file = SimpleUploadedFile(
            name='grande.jpg',
            content=b'\xff\xd8\xff\xe0' + b'\x00' * (6 * 1024 * 1024),
            content_type='image/jpeg'
        )
        response = auth_client_a.post('/api/upload/', {'file': big_file}, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'MB' in response.data.get('error', '')

    def test_upload_wrong_file_type(self, auth_client_a, user_a):
        """Un file con tipo non ammesso (es. .txt) viene rifiutato."""
        txt_file = SimpleUploadedFile(
            name='nota.txt',
            content=b'questo non e un documento valido',
            content_type='text/plain'
        )
        response = auth_client_a.post('/api/upload/', {'file': txt_file}, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upload_no_file_returns_error(self, auth_client_a, user_a):
        """Una richiesta POST senza file restituisce un errore chiaro."""
        response = auth_client_a.post('/api/upload/', {}, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch('api.views.process_document_task.delay')
    def test_upload_valid_file_success(self, mock_process_task, auth_client_a, user_a, fake_image):
        """
        Un file valido viene preso in carico correttamente con una risposta HTTP 202.
        Il task in background viene mockato per verificare che .delay() sia chiamato.
        """
        response = auth_client_a.post('/api/upload/', {'file': fake_image}, format='multipart')
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert 'document' in response.data
        assert response.data['document']['status'] == 'PENDING'
        # Verifichiamo che la funzione Celery .delay() sia stata chiamata esattamente una volta
        mock_process_task.assert_called_once()


# ==============================================================================
# 4. PERMESSI ADMIN
# ==============================================================================

class TestAdminPermissions:
    """Verifica che gli endpoint admin siano accessibili solo dallo staff."""

    def test_normal_user_cannot_access_admin_users(self, auth_client_a, user_a):
        """Un utente normale non può vedere la lista utenti admin."""
        response = auth_client_a.get('/api/admin/users/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_normal_user_cannot_access_admin_documents(self, auth_client_a, user_a):
        """Un utente normale non può vedere tutti i documenti (endpoint admin)."""
        response = auth_client_a.get('/api/admin/documents/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_see_all_users(self, auth_client_admin, admin_user, user_a, user_b):
        """L'admin può vedere tutti gli utenti registrati."""
        response = auth_client_admin.get('/api/admin/users/')
        assert response.status_code == status.HTTP_200_OK
        # Deve vedere almeno user_a e user_b (+ se stesso = 3)
        assert response.data['count'] >= 2

    def test_admin_can_see_all_documents(
        self, auth_client_admin, admin_user, document_of_user_a
    ):
        """L'admin può vedere tutti i documenti di tutti gli utenti."""
        response = auth_client_admin.get('/api/admin/documents/')
        assert response.status_code == status.HTTP_200_OK
        ids = [doc['id'] for doc in response.data['results']]
        assert document_of_user_a.id in ids

    def test_unauthenticated_cannot_access_admin(self, api_client, db):
        """Un utente non autenticato non può accedere agli endpoint admin."""
        response = api_client.get('/api/admin/users/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ==============================================================================
# 5. TEST TASK ASINCRONI (CELERY & RESILIENZA)
# ==============================================================================

class TestCeleryTasks:
    """
    Verifica che il task Celery gestisca correttamente l'OCR e i fallimenti.
    Usiamo mock per evitare di chiamare il microservizio reale.
    """

    @patch('api.tasks.OCRService.process_document')
    def test_process_document_task_success(self, mock_ocr, user_a, document_of_user_a, db):
        """Il task completa con successo se l'OCR risponde OK."""
        from api.tasks import process_document_task
        from api.models import Document

        # Mock: risposta positiva dell'OCR
        mock_ocr.return_value = (True, {"tipo": "Fattura", "totale": 100.0}, None)

        # Eseguiamo la funzione originale slegata (__func__) passando il nostro mock
        process_document_task.run.__func__(MagicMock(), document_of_user_a.id, "image/jpeg")

        # Verifichiamo il database
        doc = Document.objects.get(id=document_of_user_a.id)
        assert doc.status == 'COMPLETED'
        assert doc.ocr_result['totale'] == 100.0
        assert doc.error_message is None

    @patch('api.tasks.OCRService.process_document')
    def test_process_document_task_retry_logic(self, mock_ocr, user_a, document_of_user_a, db):
        """
        Il task deve sollevare un'eccezione Retry se l'OCR è offline.
        Questa è la prova che la nostra logica di resilienza funziona.
        """
        from api.tasks import process_document_task
        from celery.exceptions import Retry

        # Mock: errore di connessione (OCR offline)
        mock_ocr.return_value = (False, "Service Offline", "CONNECTION_ERROR")

        # Prepariamo un mock del "self" del task Celery
        mock_task_self = MagicMock()
        mock_task_self.max_retries = 3
        mock_task_self.request.retries = 0
        # Facciamo in modo che .retry() sollevi l'eccezione Retry (comportamento reale di Celery)
        mock_task_self.retry.side_effect = Retry()

        # Eseguiamo e verifichiamo che venga lanciato Retry
        with pytest.raises(Retry):
            process_document_task.run.__func__(mock_task_self, document_of_user_a.id, "image/jpeg")

        # Verifichiamo che il retry sia stato effettivamente chiamato
        mock_task_self.retry.assert_called_once()

    @patch('api.tasks.OCRService.process_document')
    def test_process_document_task_final_failure(self, mock_ocr, user_a, document_of_user_a, db):
        """Se il documento non è valido, il task deve smettere di riprovare e segnare FAILED."""
        from api.tasks import process_document_task
        from api.models import Document

        # Mock: errore definitivo (documento non valido)
        mock_ocr.return_value = (False, "File Corrotto", "INVALID_DOCUMENT")

        process_document_task.run.__func__(MagicMock(), document_of_user_a.id, "image/jpeg")

        # Verifichiamo il database
        doc = Document.objects.get(id=document_of_user_a.id)
        assert doc.status == 'FAILED'
        assert "INVALID_DOCUMENT" in doc.error_message
