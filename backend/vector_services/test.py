import pytest
from fastapi.testclient import TestClient
from main import app  # import your FastAPI app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_upsert_history():
    test_data = {
        "user_id": "test_user",
        "message": "What is the weather?",
        "response": "It’s sunny today.",
        "timestamp": "2025-07-09T12:00:00",
        "role": "user"
    }
    response = client.post("/upsert-history", json=test_data)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_similarity_search():
    search_data = {
        "query": "How is the weather?",
        "role": "user"
    }
    response = client.post("/similarity-search", json=search_data)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
