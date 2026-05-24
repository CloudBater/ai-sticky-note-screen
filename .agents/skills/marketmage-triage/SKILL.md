
---

## `.agents/skills/marketmage-triage/SKILL.md`

```md
---
name: marketmage-triage
description: Use this skill when modifying PLAN.md, product scope, UI copy, backend endpoints, or any MarketMage feature that may touch trading, leverage, investment advice, AI predictions, real-time FX, or Frankfurter API limitations.
---

# MarketMage Triage Skill

## Core product interpretation

MarketMage should be a safe FX reference and simulation dashboard.

It must not become:
- a real-money trading platform,
- an AI trading bot,
- a leveraged FX product,
- a robo-adviser,
- a fake real-time market data terminal.

## Red flags to refuse

Refuse or avoid implementing:

- real-money trade execution,
- order placement,
- brokerage or custody,
- deposits or withdrawals,
- 50x leverage,
- margin-trading flow,
- one-click auto-rebalance execution,
- AI-managed portfolio changes,
- AI prediction engine,
- "99% accuracy" claims,
- real-time or sub-second FX labels,
- executable quote language,
- TradingView-style candlestick charts,
- KYC handled informally,
- licensing bypass language,
- social leaderboard that encourages risky comparison.

## Safe substitutes

Use these counter-proposals:

- Real-time FX ¡÷ latest daily reference rates with visible date.
- AI prediction ¡÷ historical trend summary.
- 99% accuracy ¡÷ no forecast claim; explain historical movement only.
- 50x leverage ¡÷ hypothetical leverage-risk preview, no leveraged positions.
- One-click auto-rebalance ¡÷ manual hypothetical allocation preview.
- AI-managed portfolio ¡÷ user-controlled simulation balance and simulated conversion history.
- Candlesticks ¡÷ daily historical line chart.
- Unsupported currencies ¡÷ explicit supported/unsupported currency panel.

## Simulation language

Prefer:
- simulation balance,
- hypothetical starting amount,
- simulated conversion,
- conversion preview,
- simulation history,
- historical preview.

Avoid:
- account balance,
- wallet,
- deposit,
- withdraw,
- buy,
- sell,
- execute,
- order,
- trade,
- rebalance now.

## Required trust copy

Use visible product copy such as:

- "Daily reference rates, not real-time quotes."
- "Historical reference only."
- "Not investment advice."
- "No deposits, withdrawals, or trades."
- "No trades are executed."

Do not bury all trust copy in a footer.

## API limitation reminders

Frankfurter provides daily reference rates.

Do not fabricate:
- intraday prices,
- OHLC candles,
- prediction signals,
- executable quotes,
- unsupported currency rates.

If the upstream API cannot provide a requested feature, explain the limitation and choose a truthful alternative.