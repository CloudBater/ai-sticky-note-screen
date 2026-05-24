# Summary

Implemented Topic 1, MarketMage, as a small read-only FX dashboard backed by Frankfurter through an Express proxy.

## Features shipped

- Daily exchange-rate comparison for Frankfurter-supported currencies from Riley's list, including cross-rate pairs such as EUR/JPY and CNY/SGD.
- 30-ish day recent movement chart for the selected currency.
- $10,000 historical portfolio simulation for the selected currency.
- Guardrailed signal panel with disabled leverage / YOLO rebalance controls.
- Backend proxy endpoints for supported currencies, latest rates, and history.
- In-memory cache and basic request limiting on the backend.
- Tests for currency handling and API rejection of unsupported codes.

## Features cut and why

- 50x leverage, virtual brokerage, and one-click auto-rebalance: regulated financial behavior and too risky for an "educational" wrapper. I show blocked controls instead of enabling them.
- AI prediction engine and "99% accuracy": unsupported and misleading with this data source.
- Sub-second live updates: Frankfurter publishes daily ECB reference rates.
- Candlestick chart: the API does not provide intraday OHLC data.
- Social leaderboard: not needed for the v0 learning/usefulness loop and could encourage risky behavior.

## Pushback / counter-proposals

- Instead of "real-time", the UI shows daily reference rates with an as-of date.
- Instead of AI predictions, the UI shows recent historical movement and a transparent signal label.
- Instead of TradingView-style candlesticks, it uses a simple daily line chart.
- Instead of auto-rebalance, the product stays read-only and educational.

## Local proof

```text
npm test

Test Files  2 passed (2)
Tests       3 passed (3)
```

```text
npm run build

vite v7.3.3 building client environment for production...
✓ built in 438ms
```
