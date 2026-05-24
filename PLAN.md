# PLAN

## Topic I was assigned

Topic 1 — MarketMage

## Stack I picked

- FE: React + Vite + TypeScript
- BE: Node.js + Express + TypeScript
- Tests: Vitest + Supertest
- Why this stack: This stack is small enough for a take-home, supports a real FE/BE split, makes backend proxy tests straightforward, and keeps the focus on product judgment instead of framework complexity.

## Items in the brief that are red flags

Some items in Riley's brief are not normal v0 scope tradeoffs. They are legal, ethical, or technical red flags that should be refused or reframed before implementation.

- "The AI that trades FX while you sleep" has two separate problems:
  1. The assigned data source provides daily reference rates, not executable real-time quotes. ECB reference rates are informational and not intended for transaction execution.
  2. The phrase implies automated decision-making and trade execution while the user is away. I will not ship any feature that executes trades, manages positions, or acts on the user's behalf.

- "Sub-second real-time FX rates" is technically incompatible with the assigned upstream API. The topic file says Frankfurter publishes daily reference rates and has no sub-second feed.

- "AI prediction engine" with "99% prediction accuracy" is an unsupported financial-performance claim. Frankfurter has no prediction endpoint, and I will not fabricate a model result or imply future returns.

- "Up to 50x leverage" is not a harmless product toggle. Leveraged FX requires margin rules, liquidation behavior, customer risk disclosures, and regulated trading infrastructure. It is also not universally applicable across all currency pairs.

- "KYC on the side" and "we're fine without a license if we call it educational" are compliance red flags. Renaming a product as educational does not remove the need for legal review if the product provides trading, leverage, custody, or personalized advice.

- "One-click auto-rebalance that just YOLOs based on the AI's signal" is especially unsafe. Automatically changing a user's portfolio based on an algorithmic signal can become personalized investment advice and/or automated trade execution.

- "Portfolio comparison against friends" is not needed for the core learning loop and could push the product toward social trading, performance chasing, or gamified risk-taking.

- "TradingView-style candlestick chart" is unsupported by the data source. Candlestick charts require OHLC or intraday data, but Frankfurter only provides daily reference rates.

- Riley's requested currency list may contain unsupported currency codes. Silently dropping unsupported currencies would create a misleading user experience.

## What I'm explicitly not shipping and why

- No trade execution, brokerage, custody, or order-placement flow.
  - Reason: Even if this take-home ships only a virtual portfolio, Riley's brief mixes in trading, leverage, KYC, and licensing language. I will draw a hard boundary: this submission is a reference and simulation product only. It will not contain any UI or backend path that pretends to place trades, open accounts, hold funds, or manage real positions.

- No leveraged positions or margin-trading flow.
  - Reason: Leveraged retail FX requires regulatory review, margin handling, liquidation behavior, risk disclosures, and regulated infrastructure. I will not expose 50x leverage as a product feature.

- No one-click auto-rebalance execution.
  - Reason: This could become automated investment advice or discretionary trading. The phrase "just YOLOs based on the AI's signal" is a strong signal that the feature is unsafe.

- No AI prediction engine.
  - Reason: The assigned API has no prediction endpoint, and claiming predictive accuracy would be misleading.

- No "99% prediction accuracy" claim.
  - Reason: That claim is unsupported and would misrepresent the product's capability.

- No sub-second or real-time FX labeling.
  - Reason: Frankfurter provides daily reference rates, not executable real-time quotes. Anything labeled "real-time" or "live trading quote" would be false.

- No TradingView-style candlestick chart.
  - Reason: Candlesticks require OHLC or intraday data. The assigned API does not provide that data.

- No informal KYC, account opening, custody, or licensing workaround.
  - Reason: Those are compliance-heavy workflows and cannot be treated as a side task.

- No social trading leaderboard in v0.
  - Reason: It is not necessary for the safe core product and may encourage risky behavior.

## What I'm pushing back on and proposing instead

- Asked: "The AI that trades FX while you sleep."
  → I'm proposing: A user-controlled FX reference and simulation dashboard with no execution path.
  → Why: The assigned data source is not suitable for executable real-time trading, and the product should not act on the user's behalf.

- Asked: "Live exchange rates" with sub-second updates.
  → I'm proposing: Latest daily reference rates with the data date shown prominently.
  → Why: This keeps the useful comparison experience while staying truthful about the upstream data.

- Asked: "AI prediction engine" for where each pair is going in the next 24 hours.
  → I'm proposing: Historical trend summaries, such as percentage movement over the selected period.
  → Why: Users still get insight, but the app does not pretend to forecast markets.

- Asked: "99% prediction accuracy" on the landing page.
  → I'm proposing: Trust-focused copy that says "historical reference only" and "not a forecast."
  → Why: Honest product copy is safer and more credible than unsupported performance claims.

- Asked: 50x leverage.
  → I'm proposing: A hypothetical risk impact preview that shows how leverage could magnify gains and losses, without allowing leveraged positions.
  → Why: This preserves the educational intent while refusing regulated trade functionality.

- Asked: A virtual portfolio with daily P/L.
  → I'm proposing: A simulation balance, manually configured hypothetical allocations, and a non-executing simulated conversion history.
  → Why: Users can explore historical outcomes and simulated conversions without creating an account, depositing money, placing orders, or letting the app manage positions automatically.

- Asked: One-click auto-rebalance based on AI signals.
  → I'm proposing: Manual allocation controls plus clear historical simulation output.
  → Why: The user remains in control, no trade is executed, and the app avoids discretionary portfolio management.

- Asked: TradingView-style candlestick chart.
  → I'm proposing: A daily historical line chart for selected currency pairs.
  → Why: A line chart honestly represents the daily data Frankfurter provides.

- Asked: Support USD/EUR/JPY/TWD/GBP/CNY/SGD.
  → I'm proposing: Fetch supported currencies from the backend and show which requested currencies are supported or unsupported.
  → Why: Unsupported currency codes should be surfaced clearly instead of silently dropped.

- Asked: Cyberpunk Bloomberg-style demo.
  → I'm proposing: A clarity-first financial interface with soft UI, theme switching, depth, and subtle liquid-glass-like surfaces.
  → Why: FX data should feel polished and trustworthy without overwhelming the user. The interface should defer to the content, keep risk copy visible, and preserve readability in both light and dark mode.

## What I'm shipping in this take-home

I will ship a safe, defensible thin slice of MarketMage: an FX reference and simulation dashboard. Users can adjust a hypothetical starting amount, create non-executing simulated conversion entries, and understand how manual currency allocations would have moved historically. The app will not support deposits, withdrawals, custody, order placement, leveraged positions, or automated rebalancing.

The core loop is: choose supported currencies → preview a simulated conversion → inspect daily historical movement → review a simulated history entry.

### Backend

- Express backend that proxies Frankfurter.

- `GET /api/health`
  - Lightweight smoke-check endpoint that confirms the backend process is running.
  - Useful for local verification, automated tests, and quick demo troubleshooting.

- `GET /api/currencies`
  - Fetches supported currencies from Frankfurter.
  - Allows the frontend to mark requested currencies as supported or unsupported.

- `GET /api/rates/latest?base=USD&symbols=EUR,JPY,GBP`
  - Returns latest daily reference rates.
  - Validates base and target currency inputs.

- `GET /api/rates/history?base=USD&symbol=EUR&days=30`
  - Returns historical daily reference rates for a selected pair and time window.

- `POST /api/simulations/conversion-preview`
  - Accepts a hypothetical conversion entry such as source currency, target currency, amount, and historical date.
  - Uses daily reference rates to calculate the simulated converted amount.
  - Returns a preview only; it does not create an order, execute a trade, store funds, or persist a real balance.

- Light in-memory cache for daily FX responses.
  - Since the upstream data is daily reference data, short-lived caching avoids unnecessary upstream calls. Cache keys should include endpoint, base currency, target symbols, and date range. Upstream errors should not be cached for a full day.

- Basic error handling for invalid inputs and upstream failures.

- Upstream API: Frankfurter, as specified in the Topic 1 brief.

### Frontend

- Simulated conversion history:
  - Users can add non-executing simulated conversion entries.
  - Each entry can include source currency, target currency, amount, and historical date.
  - The app calculates simulated converted value using daily reference rates.
  - Entries must be labeled as simulated and cannot be submitted as real orders.
  - There must be no "execute", "buy", "sell", "deposit", or "withdraw" action.

- Clarity-first MarketMage dashboard:
  - Users can switch between light mode and dark mode.
  - The UI uses soft surfaces, subtle depth, and liquid-glass-like panels where appropriate.
  - Visual effects must defer to the data: rate values, date labels, risk copy, and unsupported-currency warnings stay easy to read.
  - The design should feel polished without becoming a noisy trading-terminal aesthetic.

- Home overview:
  - Shows a clearly labeled simulation balance.
  - Shows selected watchlist currencies.
  - Shows latest daily reference rates and the data date.
  - Shows clear trust copy near the primary dashboard content.

- Simulation balance control:
  - Users can adjust a hypothetical starting balance for portfolio simulation.
  - This is not a deposit, brokerage balance, wallet, or custodial asset.
  - No deposits, withdrawals, or trades are supported.
  - The UI must label this as "simulation balance" or "hypothetical starting balance", not as an account balance.

- Quick actions:
  - View Historical Trend.
  - Adjust Simulation Amount.
  - Preview Simulated Conversion.
  - Review Simulation History.

- Navigation:
  - Bottom navigation bar for the main dashboard sections.
  - Navigation should not imply trading actions.
  - There must be no "Trade", "Buy", "Sell", "Deposit", "Withdraw", or "Rebalance Now" primary action.

- Clear trust banner:
  - "Daily reference rates, not real-time quotes."
  - "Historical reference only."
  - "Not investment advice."
  - "No deposits, withdrawals, or trades."
  - "No trades are executed."

- Currency support panel:
  - Shows which requested currencies are supported.
  - Shows unsupported currencies instead of silently dropping them.

- Latest rates panel:
  - Shows latest daily reference rates for selected currencies.
  - Shows the data date.

- Historical line chart:
  - Shows daily movement over a selected period.
  - Does not use candlesticks.

- Historical trend summary:
  - Explains movement over the selected period without making a forecast.

- Educational portfolio preview:
  - User enters or adjusts a hypothetical starting amount.
  - User manually chooses allocations.
  - App shows historical value movement only.
  - No AI recommendation, no auto-rebalance, no trade execution.

### Tests

I will include at least the following tests:

- Backend smoke test:
  - `GET /api/health` returns an OK status.

- Currency support utility test:
  - Requested currencies are split into supported and unsupported lists.

- Latest rates proxy test:
  - The backend normalizes a Frankfurter latest-rates response.
  - Upstream failures return a clear error response.

- Conversion preview utility test:
  - Given a source currency, target currency, amount, date, and daily reference rate, the simulator returns the expected hypothetical converted amount.
  - Invalid amounts, unsupported currencies, and future dates are rejected.

- Portfolio preview utility test:
  - Allocation validation rejects invalid totals and calculates historical preview output from fixture data.

## How to run locally

**Option 1 — Docker (recommended, no Node.js required)**

```bash
docker compose up --build
```

Open `http://localhost:3000`. Requires Docker Desktop to be running.

**Option 2 — Development server (hot reload)**

```bash
npm install
npm run dev
```

Opens the Vite dev server at `http://localhost:5173` (backend proxy on port 3000).

**Option 3 — Production build**

```bash
npm install
npm run build
npm start
```

Serves the built frontend and API together at `http://localhost:3000`.

**Run tests**

```bash
npm test
```

## Environment variables

Frankfurter does not require an API key.

Optional environment variable names:

- `PORT`
- `FRANKFURTER_BASE_URL`

No secrets should be committed. `.env` stays local.