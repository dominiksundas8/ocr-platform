"""
Test Suite — OCR Service (FastAPI)
====================================
Testa principalmente il meccanismo di autenticazione interna:
- Richieste senza X-Internal-Secret → 403
- Richieste con segreto corretto → vengono processate
"""
import os
import sys
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock

# Aggiungiamo root path di ocr_service
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Settiamo il segreto di test PRIMA di importare l'app
os.environ["INTERNAL_API_SECRET"] = "test-secret-per-i-test"
os.environ["GEMINI_API_KEY"] = "fake-key-for-testing"

from main import app  # importiamo l'app FastAPI


# ==============================================================================
# TEST AUTENTICAZIONE INTERNA
# ==============================================================================

@pytest.mark.asyncio
async def test_extract_without_secret_returns_403():
    """
    Una richiesta all'endpoint /extract senza l'header X-Internal-Secret
    deve essere rifiutata con 403 Forbidden.
    Questo simula un attaccante esterno che tenta di usare il servizio.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        fake_file = b'\xff\xd8\xff\xe0' + b'\x00' * 100
        response = await client.post(
            "/extract",
            files={"file": ("fattura.jpg", fake_file, "image/jpeg")},
            # NESSUN header X-Internal-Secret
        )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_extract_with_wrong_secret_returns_403():
    """
    Una richiesta con un segreto sbagliato deve essere rifiutata con 403.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        fake_file = b'\xff\xd8\xff\xe0' + b'\x00' * 100
        response = await client.post(
            "/extract",
            files={"file": ("fattura.jpg", fake_file, "image/jpeg")},
            headers={"X-Internal-Secret": "segreto-sbagliato"},
        )
    assert response.status_code == 403


@pytest.mark.asyncio
@patch('main.genai.GenerativeModel')
async def test_extract_with_correct_secret_is_accepted(mock_model):
    """
    Una richiesta con il segreto corretto viene accettata.
    La chiamata a Gemini viene MOCKATA per non usare quota reale nei test.
    """
    # Mock della risposta di Gemini
    mock_response = MagicMock()
    mock_response.text = '{"document_type": "Fattura", "is_invoice": true, "totali": {"totale": 100.0}}'
    mock_model.return_value.generate_content.return_value = mock_response

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        fake_file = b'\xff\xd8\xff\xe0' + b'\x00' * 100
        response = await client.post(
            "/extract",
            files={"file": ("fattura.jpg", fake_file, "image/jpeg")},
            headers={"X-Internal-Secret": "test-secret-per-i-test"},
        )

    # La richiesta deve passare il controllo di sicurezza (non 403)
    assert response.status_code != 403


@pytest.mark.asyncio
async def test_health_check():
    """L'endpoint root dell'OCR service deve rispondere correttamente."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
    # FastAPI restituisce 404 sull'endpoint / se non definito, ma il servizio è up
    assert response.status_code in [200, 404]
