# How to Run Locally

## Prerequisites

- Docker + Docker Compose

## Start

```bash
cp .env.example .env
docker compose up
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Health check: http://localhost:8000/health

## Run Tests

**Backend (pytest):**
```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
```

**Frontend (Vitest):**
```bash
cd frontend
npm install
npm test
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/rates?base=USD&to=EUR,JPY,GBP,TWD,SGD` | Today's ECB reference rates |
| `GET /api/history?base=USD&to=EUR&days=90` | Historical daily rates (1–365 days) |
| `GET /health` | Health check |

Rates are cached in-memory per day — Frankfurter publishes once per business day at 16:00 CET.
