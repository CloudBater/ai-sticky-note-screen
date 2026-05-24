# MarketMage Submission

Topic 1 implementation for the fullstack take-home.

MarketMage is a read-only FX reference dashboard. It uses Frankfurter / ECB daily reference rates and does not claim sub-second data, predict exchange rates, or offer trading recommendations.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

The frontend calls the local backend at `/api/*`; the backend proxies Frankfurter.

## Test

```bash
npm test
npm run build
```

## What Is Included

- React/Vite frontend dashboard with cross-currency comparison shortcuts.
- Express backend proxy for Frankfurter.
- In-memory cache for repeated currency/rate/history requests.
- Basic local request limiting.
- Tests for rate helper behavior and unsupported currency handling.
- Read-only simulation lab with editable starting capital.
- Hoverable chart points and recent data tables so dates and values are easier to inspect.
- Disabled leverage and auto-rebalance controls with short explanations.

## Scope Notes

- Frankfurter publishes daily ECB reference rates, so the UI says "daily" instead of "real-time".
- TWD is called out as unsupported instead of being silently dropped.
- Historical movement is shown as a line chart, not a candlestick chart, because the upstream API has no intraday OHLC data.
- No leverage, auto-rebalance, social leaderboard, or AI prediction claim is implemented.
- The signal panel is based on historical movement only. It is not an AI forecast.

## Sources I Checked

- [Frankfurter API](https://www.frankfurter.app/)
- [CFTC retail forex overview](https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/ForeignCurrencyTrading/index.htm)
- [NFA RFED registration page](https://www.nfa.futures.org/registration-membership/who-has-to-register/rfed.html)
- [ESMA CFD product intervention measures](https://www.esma.europa.eu/pl/press-news/esma-news/esma-agrees-prohibit-binary-options-and-restrict-cfds-protect-retail-investors)
