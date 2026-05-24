# PLAN

## Topic I was assigned

Topic 1 - MarketMage

## Stack I picked

- FE: React + Vite
- BE: Node.js + Express
- Why this stack: It is a small fullstack stack that is easy to run locally, easy to test, and enough for a thin API-backed dashboard.

## Items in the brief that are red flags (legal, ethical, technical)

- 50x leveraged FX trading is a regulated financial product, not something to ship as an "educational" workaround. In the US this touches CFTC / NFA / RFED registration concerns, and in the EU retail FX leverage is capped by ESMA rules.
- "AI trades while you sleep" and one-click auto-rebalance would be financial advice or automated trading behavior. A disclaimer does not make an active recommendation safe.
- "99% prediction accuracy" is an unsupported marketing claim. It would be misleading because Frankfurter has daily reference rates only and no predictive data.
- Sub-second "real-time" FX updates are technically false for this API. Frankfurter publishes ECB reference rates once per business day.
- Social portfolio comparison encourages competition around simulated trading performance. I would not include it in v0 because it can push users toward risky behavior.

## What I'm explicitly **not** shipping (and why)

- No leveraged trading, virtual brokerage, or auto-rebalance. Those are the riskiest parts of the brief and do not belong in a take-home MVP.
- No AI prediction engine or "99% accuracy" claim. The upstream API does not support this, and I should not invent confidence.
- No sub-second live feed or candlestick chart. Frankfurter provides daily rates, not intraday open/high/low/close data.
- No social leaderboard. It is not needed to prove the useful core of the product.
- No TWD display by default. Frankfurter's current ECB-backed currency set does not include every code in Riley's list, so the app should surface supported currencies instead of silently pretending.

## What I'm pushing back on (and proposing instead)

- Asked: "real-time" rates. I'm proposing: daily reference rates with a clear "as of" date. Why: it is honest about Frankfurter's update cadence and still helps users compare currencies.
- Asked: "AI prediction engine." I'm proposing: a simple historical trend panel using the last available daily rates. Why: it preserves the orientation value without pretending to forecast the future.
- Asked: "TradingView-style candlesticks." I'm proposing: a compact 30-day line chart. Why: daily reference data can support a trend chart, but not true candlesticks.
- Asked: "auto-rebalance." I'm proposing: no trade action, only a read-only rate comparison and recent movement summary. Why: it keeps the product educational and avoids financial advice.

## What I'm shipping in this take-home

- A backend proxy for Frankfurter with endpoints for supported currencies, latest rates, and historical rates.
- Small in-memory caching so repeated client requests do not hammer the upstream API.
- Basic request shaping on the backend to avoid runaway local clients.
- A React dashboard that compares selected currencies, shows the data date, and charts recent daily movement.
- A $10,000 read-only simulation lab that shows historical P/L for holding one selected currency.
- Disabled leverage / rebalance controls that explain why those actions are blocked instead of pretending they are safe.
- Tests for the rate-shaping logic and backend behavior.

## How to run locally

Command(s) a grader needs to run, in order:

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

What environment variables are needed (names only - no values):

- None for Topic 1
