"""
Pytest fixtures condivisi tra tutti i test del backend Django.
I fixtures sono funzioni riutilizzabili che preparano i dati necessari per i test.
"""
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from api.models import Document
from django.core.files.uploadedfile import SimpleUploadedFile


@pytest.fixture
def api_client():
    """Client HTTP non autenticato. Usato per testare endpoint pubblici."""
    return APIClient()


@pytest.fixture
def user_a(db):
    """Crea l'utente A — utente normale senza privileges admin."""
    user = User.objects.create_user(
        username='utente_a@test.com',
        email='utente_a@test.com',
        password='TestPassword123!'
    )
    # Crea l'EmailAddress per soddisfare i controlli di allauth
    from allauth.account.models import EmailAddress
    EmailAddress.objects.create(user=user, email=user.email, primary=True, verified=True)
    return user


@pytest.fixture
def user_b(db):
    """Crea l'utente B — utente normale senza privilegi admin."""
    return User.objects.create_user(
        username='utente_b@test.com',
        email='utente_b@test.com',
        password='TestPassword123!'
    )


@pytest.fixture
def admin_user(db):
    """Crea un utente con privilegi staff/admin."""
    return User.objects.create_user(
        username='admin@test.com',
        email='admin@test.com',
        password='AdminPassword123!',
        is_staff=True
    )


@pytest.fixture
def auth_client_a(api_client, user_a):
    """Client HTTP autenticato come utente A via JWT."""
    response = api_client.post('/auth/login/', {
        'email': 'utente_a@test.com',
        'password': 'TestPassword123!'
    }, format='json')
    token = response.data.get('access')
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.fixture
def auth_client_b(db, user_b):
    """Client HTTP autenticato come utente B via JWT."""
    client = APIClient()
    response = client.post('/auth/login/', {
        'email': 'utente_b@test.com',
        'password': 'TestPassword123!'
    }, format='json')
    token = response.data.get('access')
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client


@pytest.fixture
def auth_client_admin(db, admin_user):
    """Client HTTP autenticato come utente admin via JWT."""
    client = APIClient()
    response = client.post('/auth/login/', {
        'email': 'admin@test.com',
        'password': 'AdminPassword123!'
    }, format='json')
    token = response.data.get('access')
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client


@pytest.fixture
def fake_image():
    """Crea un file immagine JPEG finto valido per i test di upload."""
    return SimpleUploadedFile(
        name='test_fattura.jpg',
        content=b'\xff\xd8\xff\xe0' + b'\x00' * 100,  # Header JPEG minimo valido
        content_type='image/jpeg'
    )


@pytest.fixture
def document_of_user_a(db, user_a):
    """Crea un documento nel DB appartenente all'utente A (senza passare per l'upload)."""
    fake_file = SimpleUploadedFile('doc_a.jpg', b'\xff\xd8\xff\xe0' + b'\x00' * 100, content_type='image/jpeg')
    return Document.objects.create(
        user=user_a,
        file=fake_file,
        ocr_result={'document_type': 'Fattura', 'totali': {'totale': 100.0}}
    )
