# PLAN

## Topic I was assigned

Topic 1 — MarketMage (FX dashboard using Frankfurter API)

## Stack I picked

- FE: React + Vite + TypeScript
- BE: Python + FastAPI
- Run: `docker compose up`
- Why this stack: Python backend keeps the proxy logic readable; React + Vite gives a responsive SPA with minimal boilerplate.

## Items in the brief that are red flags (legal, ethical, technical)

- **50x leverage trading**: Offering leveraged FX products requires a CFTC (US) or equivalent license. Calling it "educational" does not create a legal exemption — this is a known regulatory evasion tactic that has resulted in enforcement actions (e.g. CFTC v. multiple unregistered FX dealers). Hard no.
- **"99% prediction accuracy" marketing claim**: No model achieves this on FX. Publishing this on a landing page constitutes false advertising under FTC guidelines, and in some jurisdictions qualifies as fraudulent financial promotion under securities law.
- **AI prediction engine for FX**: Providing directional FX signals to retail users without a license is regulated investment advice in the US (Investment Advisers Act), EU (MiFID II), and Taiwan (FSIA). Not shippable.
- **Unlicensed KYC via "Trevor"**: Operating an unlicensed money-services business violates FinCEN registration requirements. Outsourcing KYC to an individual instead of a regulated provider does not reduce liability.
- **"Don't worry about the SEC, my cousin is a lawyer"**: Not a legal opinion. Noted and disregarded.

## What I'm explicitly not shipping (and why)

- **Sub-second / real-time rates**: Frankfurter publishes ECB reference rates once per business day at 16:00 CET. There is no intraday feed. Labeling daily data as "real-time" is a lie.
- **AI prediction engine**: No prediction endpoint exists upstream. Any model output would be fabricated. Claiming accuracy figures without a verifiable methodology is misleading.
- **Portfolio management with leverage**: Regulated activity. Not shippable without a license.
- **Auto-rebalance ("YOLO") button**: Constitutes automated investment advice. Regulated. Cut.
- **Social / friend comparison**: Requires user accounts, auth, persistent storage. Out of scope for v0.
- **TradingView-style candlestick chart**: Frankfurter only provides one daily reference rate per currency pair — no open/high/low data. Candlesticks are technically impossible with this data source.
- **CNY in the currency set**: CNY is not in the ECB reference rate set that Frankfurter exposes. Silently passing it to the API returns no data — surfacing this mismatch explicitly is the correct behavior.

## What I'm pushing back on (and proposing instead)

- **Asked**: Sub-second real-time rates → **Proposing**: Daily ECB reference rates with a clear "Last updated: [date]" label and a note that data refreshes once per business day. Preserves the intent (users see current rates) without falsely claiming a live feed.
- **Asked**: AI prediction engine with 99% accuracy → **Proposing**: 90-day historical trend line chart for any selected currency pair. Users can observe the trend themselves — no accuracy claim, no fabricated signal, preserves the "help users understand direction" intent.
- **Asked**: Portfolio with AI rebalancing → **Proposing**: A simple conversion calculator — user inputs an amount in one currency, sees the equivalent in another. Preserves the "make it feel actionable" intent without crossing into investment advice.
- **Asked**: Candlestick chart → **Proposing**: Line chart of daily closing rates. Same information density for ECB reference data; no fabricated OHLC bars needed.

## What I'm shipping in this take-home

1. **BE (FastAPI)**: Proxy server for Frankfurter API with in-memory daily cache (data doesn't change intraday). Exposes:
   - `GET /api/rates?base=USD&to=EUR,JPY,GBP,TWD,SGD` — today's reference rates
   - `GET /api/history?base=USD&to=EUR&days=90` — historical daily rates for a pair
2. **FE (React + Vite)**: Single-page dashboard showing:
   - Rate cards for USD → EUR, JPY, GBP, TWD, SGD (with last-updated date)
   - 90-day historical line chart for a user-selected currency pair
   - Simple conversion calculator (amount in base → target)
   - Disclaimer banner: "Rates are ECB reference rates updated once per business day. Not financial advice."
3. **Tests**: pytest for BE endpoints and cache behavior; Vitest for FE calculator logic
4. **One-command run**: `docker compose up` starts BE on :8000 and FE on :5173

## How to run locally

```
cp .env.example .env
docker compose up
```

Open http://localhost:5173

What environment variables are needed (names only — no values):

- None required (Frankfurter is keyless). `.env` file is present for discipline; it is empty.
