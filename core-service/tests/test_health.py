from fastapi.testclient import TestClient

from app.main import app


def test_healthz_returns_ok() -> None:
    with TestClient(app) as client:
        response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_healthz_disables_cache() -> None:
    with TestClient(app) as client:
        response = client.get("/healthz")
    assert response.headers["cache-control"] == "no-store, max-age=0"


def test_api_healthz_disables_cache() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/healthz")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store, max-age=0"
