# AGENTS.md

## Project Summary

This repository is a fullstack take-home submission for Topic 1 - MarketMage.

MarketMage is a safe FX reference and simulation dashboard. It is not an automated trading, brokerage, custody, or investment-advice product.

The goal is to ship a small, defensible, locally runnable thin slice that:

- uses the Frankfurter public FX API through our backend,
- documents product pushback in `PLAN.md`,
- includes real tests,
- avoids regulated, misleading, or unsupported features from Riley's brief,
- stays polished enough to feel like a mature financial dashboard without pretending to execute trades.

## Required Reading Before Edits

Before coding or changing product copy, read:

1. `README.md`
2. `GRADING.md`
3. `topics/topic-1-marketmage.md`
4. `PLAN.md`
5. `AGENTS.md`

If working in Claude Code, also read `CLAUDE.md`. `AGENTS.md` is the canonical cross-tool instruction file; `CLAUDE.md` should mirror and extend it for Claude-specific workflow, not contradict it.

## Assigned Topic

Topic 1 - MarketMage.

Follow the Topic 1 brief and use Frankfurter as the upstream FX API.

Frontend must call our backend. Backend must proxy Frankfurter.

Correct flow:

```txt
React FE -> Express BE `/api/...` -> Frankfurter
```

## Product Safety Boundaries

Before editing UI copy or user actions, use the `marketmage-triage` skill if it is available. If the skill is not available in the current tool environment, say so and continue by applying the safety boundaries in `PLAN.md` and this file.

Do not add or imply:

- real trading,
- order placement,
- brokerage accounts,
- custody,
- deposits or withdrawals,
- leveraged positions,
- automated rebalancing,
- AI price predictions,
- personalized financial advice,
- real-time or sub-second quote claims,
- candlestick charts based on daily reference data.

Use safe language:

- "simulation balance"
- "hypothetical amount"
- "simulated conversion"
- "preview"
- "daily reference rates"
- "historical reference only"
- "no trades are executed"

Avoid unsafe language:

- "account balance"
- "trade"
- "buy"
- "sell"
- "execute"
- "deposit"
- "withdraw"
- "rebalance now"
- "live trading quote"

Keep trust copy visible where relevant:

- "Daily reference rates, not real-time quotes."
- "Historical reference only."
- "Not investment advice."
- "No deposits, withdrawals, or trades."
- "No trades are executed."
- "Hypothetical amount only."

## Development Workflow

Use TDD for behavior changes:

1. Add or update the focused test first.
2. Run the targeted test and confirm the failing state when possible.
3. Implement the smallest change that turns it green.
4. Run the targeted test again.
5. Run broader verification before handing work back.

For UI-only layout/style changes, still prefer tests that lock in product safety copy, accessible labels, layout hooks, or critical rendering expectations.

Use `npm.cmd` in PowerShell:

```bash
npm.cmd test -- --run
npm.cmd run typecheck
npm.cmd run dev
```

Do not commit automatically. The user will decide when to commit.

## Frontend Guidance

Keep the dashboard clarity-first:

- compact app header, not a landing-page hero,
- mature financial dashboard spacing and typography,
- readable data hierarchy in light and dark mode,
- subtle surfaces and depth only where they improve scanning,
- no neon-heavy cyberpunk styling,
- no decorative UI that pushes real dashboard content too far down.

For charts:

- use simple line charts for daily historical reference data,
- do not use candlesticks,
- do not forecast,
- keep hover/focus details concise and readable,
- avoid always-visible labels that clutter dense sections.

For the Simulation page:

- top row should balance "Adjust simulation amount" and "Preview simulated conversion",
- allocation history should use a chart rather than many daily value cards,
- keep safety copy visible but not noisy.

## Git And Commit Hygiene

Every final response after code or docs changes must include a suggested commit message.

Prefer conventional commits:

```bash
test: cover simulation layout behavior
feat: add overview daily trend chart
fix: normalize historical chart date range text
docs: align agent instructions for Claude Code
refactor: balance simulation dashboard layout
```

When work is TDD-based, suggest split commits when useful:

```bash
test: cover chart date range rendering
fix: normalize historical chart date range text
```

Before suggesting a commit, remind the user to review:

- `git diff`
- `git status --short`
- test/typecheck results
- no secrets, build artifacts, or generated dependency folders
- no mojibake or replacement characters in changed files

## Handoff Expectations

When finishing a task, report:

1. files changed,
2. what changed,
3. verification commands and results,
4. safety-related copy or scope changes,
5. commands to preview locally when relevant,
6. suggested commit message.

Keep the answer concise but concrete enough that the next tool or reviewer can continue without guessing.
