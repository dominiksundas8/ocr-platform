import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
import os

client = TestClient(app)

# Carichiamo il segreto dal .env (o fallback per il test)
INTERNAL_SECRET = os.getenv("INTERNAL_API_SECRET", "test-secret")

def test_extract_endpoint_unauthorized():
    """Verifica che l'endpoint richieda il segreto corretto negli Header."""
    response = client.post(
        "/extract",
        files={"file": ("test.jpg", b"fake-data", "image/jpeg")},
        headers={"X-Internal-Secret": "wrong-secret"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Accesso non autorizzato."

@patch("main.genai.GenerativeModel")
def test_extract_endpoint_success(mock_model):
    """Verifica il successo dell'estrazione (Gemini Mockato)."""
    # Configuriamo il mock di Gemini per restituire un JSON valido
    mock_instance = mock_model.return_value
    mock_response = MagicMock()
    mock_response.text = '{"is_invoice": true, "document_type": "Fattura", "totale": 150.0, "fornitore": {"nome": "Test Srl"}}'
    mock_instance.generate_content.return_value = mock_response

    response = client.post(
        "/extract",
        files={"file": ("test.jpg", b"fake-content", "image/jpeg")},
        headers={"X-Internal-Secret": INTERNAL_SECRET}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["extracted_data"]["campi_strutturati"]["totale"] == 150.0

def test_health_check():
    """Verifica che il microservizio sia attivo."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"
