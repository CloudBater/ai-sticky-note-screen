# CLAUDE.md

## Source Of Truth

Claude Code should treat `AGENTS.md` as the canonical project instruction file.

This file is a Claude-specific handoff guide. It should reinforce `AGENTS.md`, not replace it. If these files ever disagree, follow `AGENTS.md` and update this file to match.

## Read Before Editing

Before making changes, read:

1. `README.md`
2. `GRADING.md`
3. `topics/topic-1-marketmage.md`
4. `PLAN.md`
5. `AGENTS.md`
6. `CLAUDE.md`

The user expects strict TDD and wants a suggested commit message after every completed change.

## Project Context

This is Topic 1 - MarketMage.

MarketMage is a safe FX reference and simulation dashboard built with:

- React + Vite + TypeScript frontend,
- Express + TypeScript backend,
- Vitest + Supertest tests,
- Frankfurter as the upstream FX API through the backend proxy.

Required data flow:

```txt
React FE -> Express BE `/api/...` -> Frankfurter
```

Do not bypass the backend from the frontend.

## Safety Boundaries

MarketMage must stay a reference and simulation product.

Before editing UI copy or user actions, use the `marketmage-triage` skill if it is available. If Claude Code cannot access that skill, state that clearly and continue with the safety boundaries in `PLAN.md`, `AGENTS.md`, and this file.

Do not add:

- trading actions,
- buy or sell actions,
- execute/order language,
- deposits or withdrawals,
- account-balance wording,
- leverage,
- automated rebalancing,
- AI prediction claims,
- real-time/sub-second quote claims,
- candlestick charts from Frankfurter daily reference data.

Preferred copy:

- "simulation balance"
- "hypothetical amount only"
- "simulated conversion"
- "preview simulated conversion"
- "daily reference rates"
- "historical reference only"
- "no trades are executed"

Keep trust/safety copy visible where it matters, but keep UI text concise.

## TDD Workflow

For behavior or UI contract changes:

1. Write or update the focused test first.
2. Run the targeted test and capture the failing state when practical.
3. Implement the smallest change.
4. Re-run the targeted test.
5. Run broader verification.

Useful commands in PowerShell:

```bash
npm.cmd test -- --run
npm.cmd run typecheck
npm.cmd run dev
```

Use targeted tests while iterating:

```bash
npm.cmd test -- --run tests/dashboard.test.tsx
npm.cmd test -- --run tests/historical-chart-rendering.test.tsx
```

## Frontend Taste Notes

The desired UI is a mature, clarity-first financial dashboard:

- compact header instead of a landing-page hero,
- first screen should be information-dense but calm,
- latest daily reference rates and charts should be easy to scan,
- simulation controls should feel balanced and professional,
- quick actions should not duplicate navigation,
- bottom navigation should clearly feel like navigation,
- dark and light mode must both remain readable,
- avoid visual noise, oversized copy, and cyberpunk/neon styling.

For charts:

- line charts are appropriate,
- candlesticks are not appropriate,
- show daily historical reference movement,
- use concise tooltip/details rather than dense permanent labels.

## Common Pitfalls To Check

Before handing work back, check for:

- unsafe words: account balance, trade, buy, sell, execute, deposit, withdraw, rebalance now,
- real-time or prediction claims,
- frontend calls directly to Frankfurter,
- layout changes that push dashboard content too far down,
- text overlap in compact cards or buttons,
- mojibake or replacement characters in changed files,
- tests that only check implementation details without guarding product behavior.

Good quick scans:

```bash
rg -n "account balance|Trade|Buy|Sell|Execute|Deposit|Withdraw|Rebalance Now|real-time|prediction" src tests
rg -n "\\?\\?|String.fromCharCode\\(0xfffd\\)" src tests AGENTS.md CLAUDE.md
```

Review matches in context. Some matches may be intentional safety assertions in tests.

## Commit Message Requirement

Every final response must include a suggested commit message.

Use conventional commits and keep them specific:

```bash
docs: align agent instructions for Claude Code
test: cover simulation layout behavior
fix: normalize historical chart date range text
feat: add overview daily trend chart
refactor: balance simulation dashboard layout
```

When TDD work produced separate test and implementation changes, suggest split commits:

```bash
test: cover chart date range rendering
fix: normalize historical chart date range text
```

Do not commit automatically unless the user explicitly asks.

## Final Response Checklist

After editing, report:

1. files changed,
2. summary of changes,
3. tests/typecheck run,
4. safety copy or scope impact,
5. local preview command when relevant,
6. suggested commit message.

Keep the response short, practical, and easy to continue from in either Codex or Claude Code.
