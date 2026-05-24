import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock


MOCK_LATEST = {
    "amount": 1.0,
    "base": "USD",
    "date": "2024-08-23",
    "rates": {"EUR": 0.901, "JPY": 144.9, "GBP": 0.787, "TWD": 32.1, "SGD": 1.34},
}

MOCK_HISTORY = {
    "base": "USD",
    "rates": {
        "2024-07-01": {"EUR": 0.920},
        "2024-07-02": {"EUR": 0.918},
        "2024-08-23": {"EUR": 0.901},
    },
}


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_rates_returns_200(client):
    with patch("main.fetch_latest", new_callable=AsyncMock, return_value=MOCK_LATEST):
        resp = client.get("/api/rates?base=USD&to=EUR,JPY,GBP,TWD,SGD")
    assert resp.status_code == 200


def test_rates_response_shape(client):
    with patch("main.fetch_latest", new_callable=AsyncMock, return_value=MOCK_LATEST):
        data = client.get("/api/rates?base=USD&to=EUR,JPY,GBP,TWD,SGD").json()
    assert "base" in data
    assert "date" in data
    assert "rates" in data
    assert "EUR" in data["rates"]


def test_rates_rejects_unsupported_currency(client):
    mock_no_cny = {**MOCK_LATEST, "rates": {k: v for k, v in MOCK_LATEST["rates"].items()}}
    with patch("main.fetch_latest", new_callable=AsyncMock, return_value=mock_no_cny):
        data = client.get("/api/rates?base=USD&to=EUR,CNY").json()
    assert "CNY" not in data.get("rates", {})


def test_history_returns_200(client):
    with patch("main.fetch_history", new_callable=AsyncMock, return_value=MOCK_HISTORY):
        resp = client.get("/api/history?base=USD&to=EUR&days=90")
    assert resp.status_code == 200


def test_history_response_shape(client):
    with patch("main.fetch_history", new_callable=AsyncMock, return_value=MOCK_HISTORY):
        data = client.get("/api/history?base=USD&to=EUR&days=90").json()
    assert "base" in data
    assert "target" in data
    assert "points" in data
    assert isinstance(data["points"], list)
    assert all("date" in p and "rate" in p for p in data["points"])


def test_history_rejects_invalid_days(client):
    resp = client.get("/api/history?base=USD&to=EUR&days=0")
    assert resp.status_code == 422


def test_cache_is_used_on_second_call(client):
    call_count = 0

    async def counting_fetch(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        return MOCK_LATEST

    with patch("main.fetch_latest", side_effect=counting_fetch):
        client.get("/api/rates?base=USD&to=EUR")
        client.get("/api/rates?base=USD&to=EUR")
    assert call_count == 1
