# PLAN

## Topic I was assigned

Topic 1 - MarketMage

## Stack I picked

- FE: React + Vite
- BE: Node.js + Express
- Why this stack: I wanted a small stack that I can explain and run locally without extra setup.

## Items in the brief that are red flags (legal, ethical, technical)

- 50x leveraged FX trading is not something I should build as an "educational" shortcut. I checked the [CFTC retail forex overview](https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/ForeignCurrencyTrading/index.htm), the [NFA RFED registration page](https://www.nfa.futures.org/registration-membership/who-has-to-register/rfed.html), and ESMA's [CFD product intervention measures](https://www.esma.europa.eu/pl/press-news/esma-news/esma-agrees-prohibit-binary-options-and-restrict-cfds-protect-retail-investors). I am not a lawyer, but these sources were enough for me to treat leverage as a clear product risk.
- "AI trades while you sleep" and one-click auto-rebalance look too close to automated trading or financial advice for this project.
- "99% prediction accuracy" is not supported by the data. Frankfurter has daily reference rates only and no prediction endpoint.
- Sub-second "real-time" FX updates are technically false for this API. Frankfurter publishes ECB reference rates once per business day.
- Social portfolio comparison encourages competition around simulated trading performance. I would not include it in this first version because it can push users toward risky behavior.

## What I'm explicitly **not** shipping (and why)

- No leveraged trading, virtual brokerage, or auto-rebalance. I do not think those are safe or necessary for this demo.
- No AI prediction engine or "99% accuracy" claim. The upstream API does not support this.
- No sub-second live feed or candlestick chart. Frankfurter provides daily rates, not intraday open/high/low/close data.
- No social leaderboard. It is not needed to prove the useful core of the product.
- No TWD display by default. Frankfurter's current ECB-backed currency set does not include every code in Riley's list, so the app should surface supported currencies instead of silently pretending.

## What I'm pushing back on (and proposing instead)

- Asked: "real-time" rates. I built daily reference rates with a clear "as of" date instead.
- Asked: "AI prediction engine." I built a historical trend panel instead, because the API has history but no prediction data.
- Asked: "TradingView-style candlesticks." I used a line chart, because daily reference rates do not contain OHLC candle data.
- Asked: "auto-rebalance." I kept the product read-only and only show historical movement.

## What I'm shipping in this take-home

- A backend proxy for Frankfurter with endpoints for supported currencies, latest rates, and historical rates.
- Small in-memory caching so repeated client requests do not keep hitting the upstream API.
- Basic request limiting on the backend.
- A React dashboard that compares selected currency pairs, shows the data date, and charts recent daily movement with hoverable point details and recent-rate tables.
- A read-only portfolio simulation lab with user-entered starting capital that shows historical P/L for holding one selected currency.
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
http://127.0.0.1:5173
```

What environment variables are needed (names only - no values):

- None for Topic 1
