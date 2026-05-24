# Summary

Implemented Topic 1, MarketMage, as a small read-only FX dashboard backed by Frankfurter through an Express proxy.

## Features shipped

- Daily exchange-rate comparison for Frankfurter-supported currencies from Riley's list, including cross-rate pairs such as EUR/JPY and CNY/SGD.
- 30-ish day recent movement chart for the selected currency, with hoverable point details and a recent-rate table.
- Historical portfolio simulation for the selected currency with editable starting capital.
- Historical signal panel with disabled leverage / YOLO rebalance controls.
- Backend proxy endpoints for supported currencies, latest rates, and history.
- In-memory cache and basic request limiting on the backend.
- Tests for currency handling and API rejection of unsupported codes.

## Features cut and why

- 50x leverage, virtual brokerage, and one-click auto-rebalance: I checked CFTC/NFA retail forex materials and ESMA's CFD leverage limits, and this looked like the wrong direction for a take-home demo. I show disabled controls instead of enabling them.
- AI prediction engine and "99% accuracy": unsupported and misleading with this data source.
- Sub-second live updates: Frankfurter publishes daily ECB reference rates.
- Candlestick chart: the API does not provide intraday OHLC data.
- Social leaderboard: not needed for this first version and could encourage risky behavior.

## Pushback / counter-proposals

- Instead of "real-time", the UI shows daily reference rates with an as-of date.
- Instead of AI predictions, the UI shows recent historical movement.
- Instead of TradingView-style candlesticks, it uses a simple daily line chart.
- Instead of auto-rebalance, the product stays read-only and educational.

## Sources checked

- CFTC retail forex overview: https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/ForeignCurrencyTrading/index.htm
- NFA RFED registration page: https://www.nfa.futures.org/registration-membership/who-has-to-register/rfed.html
- ESMA CFD product intervention measures: https://www.esma.europa.eu/pl/press-news/esma-news/esma-agrees-prohibit-binary-options-and-restrict-cfds-protect-retail-investors

## Local proof

```text
npm test

Test Files  3 passed (3)
Tests       6 passed (6)
```

```text
npm run build

vite v7.3.3 building client environment for production...
built successfully
```
