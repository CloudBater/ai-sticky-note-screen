# PLAN

## Topic I was assigned

Topic 1 — MarketMage

## Stack I picked

- FE: React 18 + Vite + Tailwind CSS + Recharts
- BE: Node.js (ESM) + Express
- Why this stack: pure JS monorepo, zero ceremony, one `npm run dev` starts both servers.

## Items in the brief that are red flags (legal, ethical, technical)

- **"99% prediction accuracy" (FTC UDAP, 15 U.S.C. § 45)**: No model achieves 99%
  directional accuracy on FX pairs. Publishing that claim in marketing copy is a
  deceptive trade practice. Not a scope question — a false advertising question.

- **50x leverage + Trevor's side-KYC + "educational" framing (CFTC Regulation 5.18 /
  NFA rules)**: Offering leveraged retail FX products to the public requires registration
  as a Retail Foreign Exchange Dealer (RFED) or Futures Commission Merchant (FCM) with
  the CFTC and NFA. The "educational until $50M AUM" framing is not a recognized
  exemption — it is the exact language CFTC enforcement actions target.

- **Auto-rebalance / AI-managed portfolio (Investment Advisers Act of 1940)**: Discretionary
  portfolio management on behalf of users is investment advisory activity requiring SEC
  registration under the IAA 1940, or a valid exemption that does not apply at scale.

- **"Sub-second real-time updates" (technically impossible)**: Frankfurter publishes
  once per business day at 16:00 CET. There is no intraday feed. Labeling daily ECB data
  as "real-time" in the UI would be deceptive regardless of any disclaimer.

- **TWD pair (not in ECB reference set)**: Frankfurter covers ECB reference currencies.
  Taiwan Dollar is not in the ECB basket. Silently dropping it is a quiet failure mode;
  naming it explicitly is the correct signal.

## What I'm explicitly **not** shipping (and why)

- **AI prediction engine / 99% accuracy claim**: False advertising. No counter-proposal
  preserves this intent — the capability does not exist and the claim is legally prohibited.
- **50x leverage + unlicensed brokerage**: Requires CFTC RFED/FCM registration. The
  "educational" loophole Riley describes is not legally defensible. Cut entirely.
- **Auto-rebalance / AI-managed portfolio**: Investment advisory activity requiring SEC
  registration. Cut entirely.
- **TWD pair**: Not in Frankfurter's ECB currency set. Dropped with this note.
- **Candlestick / OHLC chart**: Frankfurter only has daily closing rates — no open, high,
  or low. A candlestick chart would require fabricated data.
- **Social portfolio comparison**: Adds regulatory surface around financial speculation.
  Out of scope for v0.
- **Trevor's KYC arrangement**: No defensible path forward. Not a counter-proposable item.

## What I'm pushing back on (and proposing instead)

- Asked: "real-time sub-second rate updates"
  → Proposing: Daily rate cards with a "last updated" timestamp and an explicit label
  "ECB reference rate, updated once daily at 16:00 CET."
  → Why: The API doesn't change intraday. Honest labeling is a trust signal; fake
  real-time is a deception that also sets unsupportable user expectations.

- Asked: "AI prediction engine — where each pair is going in the next 24h"
  → Proposing: A 5-day historical momentum indicator (▲ / ▼ / —) derived from the last
  5 daily closes. Explicitly labeled "5-day historical direction — not a prediction."
  → Why: FTC UDAP prohibits deceptive accuracy claims. A transparent trend indicator
  gives users real signal without any legal exposure.

- Asked: "TradingView-style candlestick chart"
  → Proposing: A 30-day line chart of daily closing rates (Recharts), labeled as daily
  ECB closing rates.
  → Why: No OHLC data exists in the Frankfurter API. A line chart is honest about the
  data shape and still shows the trend the investor cares about.

## What I'm shipping in this take-home

- **Rate cards** — current ECB daily rates for USD/EUR, USD/JPY, USD/GBP, USD/CNY,
  USD/SGD (5 pairs; TWD excluded — not in ECB basket). Each card shows: rate, 1-day
  delta (%), 5-day trend badge (▲/▼/—).
- **30-day line chart** — click any rate card to view 30 days of daily closing rates in a
  Recharts line chart, labeled as daily ECB data.
- **5-day trend indicator** — ▲/▼/— direction badge, derived from last 5 closing rates.
  Labeled "5-day historical direction" — never "prediction."
- **BE proxy with 6h in-memory cache** — Express server proxies Frankfurter, caches
  with a 6-hour TTL (data only changes once per business day). Sets `X-Cache: HIT/MISS`
  header so the grader can verify the cache layer.
- **Clear data-freshness labeling** throughout the UI — no "live" or "real-time" language.

## How to run locally

```
npm install
npm run dev
```

Open http://localhost:5173

Node 18+ required (`node --watch` and `fetch` are built-in).

What environment variables are needed (names only — no values):

- `PORT` — BE port (defaults to 3001 if unset; Frankfurter is keyless, no API key needed)
