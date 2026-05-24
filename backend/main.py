from datetime import date, timedelta
from typing import Optional
import httpx
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MarketMage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

FRANKFURTER_BASE = "https://api.frankfurter.app"

# In-memory daily cache: key → (cached_date, data)
_cache: dict[str, tuple[date, dict]] = {}

SUPPORTED_CURRENCIES = {
    "EUR", "USD", "JPY", "GBP", "TWD", "SGD", "CHF", "AUD", "CAD",
    "HKD", "KRW", "SEK", "NOK", "DKK", "NZD", "MXN", "ZAR", "BRL",
    "INR", "RUB", "PLN", "CZK", "HUF", "RON", "BGN", "HRK", "ISK",
    "IDR", "MYR", "PHP", "THB", "TRY",
}


def _is_cache_fresh(cached_date: date) -> bool:
    today = date.today()
    return cached_date == today


async def fetch_latest(base: str, to: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{FRANKFURTER_BASE}/latest",
            params={"from": base, "to": to},
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json()


async def fetch_history(base: str, to: str, start: str, end: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{FRANKFURTER_BASE}/{start}..{end}",
            params={"from": base, "to": to},
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json()


@app.get("/api/rates")
async def get_rates(
    base: str = Query(default="USD", min_length=3, max_length=3),
    to: str = Query(default="EUR,JPY,GBP,TWD,SGD"),
):
    base = base.upper()
    targets = [t.strip().upper() for t in to.split(",") if t.strip()]

    # Filter out unsupported currencies and note them
    supported = [t for t in targets if t in SUPPORTED_CURRENCIES and t != base]
    unsupported = [t for t in targets if t not in SUPPORTED_CURRENCIES]

    cache_key = f"rates:{base}:{','.join(sorted(supported))}"
    today = date.today()

    if cache_key in _cache:
        cached_date, data = _cache[cache_key]
        if _is_cache_fresh(cached_date):
            if unsupported:
                data = {**data, "unsupported": unsupported}
            return data

    raw = await fetch_latest(base, ",".join(supported))
    result = {
        "base": raw.get("base", base),
        "date": raw.get("date"),
        "rates": raw.get("rates", {}),
    }
    if unsupported:
        result["unsupported"] = unsupported

    _cache[cache_key] = (today, {k: v for k, v in result.items() if k != "unsupported"})
    return result


@app.get("/api/history")
async def get_history(
    base: str = Query(default="USD", min_length=3, max_length=3),
    to: str = Query(default="EUR", min_length=3, max_length=3),
    days: int = Query(default=90, ge=1, le=365),
):
    base = base.upper()
    to = to.upper()

    if to not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"{to} is not supported by Frankfurter")

    end = date.today()
    start = end - timedelta(days=days)

    cache_key = f"history:{base}:{to}:{start}:{end}"
    if cache_key in _cache:
        cached_date, data = _cache[cache_key]
        if _is_cache_fresh(cached_date):
            return data

    raw = await fetch_history(base, to, start.isoformat(), end.isoformat())
    points = [
        {"date": d, "rate": rates[to]}
        for d, rates in sorted(raw.get("rates", {}).items())
        if to in rates
    ]
    result = {"base": base, "target": to, "points": points}
    _cache[cache_key] = (date.today(), result)
    return result


@app.get("/health")
async def health():
    return {"status": "ok"}
