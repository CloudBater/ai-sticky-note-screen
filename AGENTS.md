# AGENTS.md

## Project summary

This repository is a fullstack take-home submission for Topic 1 — MarketMage.

MarketMage must be implemented as a safe FX reference and simulation dashboard, not as an automated trading product.

The goal is to ship a small, defensible, locally runnable thin slice that:
- uses the Frankfurter public FX API through our backend,
- documents product pushback in `PLAN.md`,
- includes real tests,
- avoids regulated, misleading, or unsupported features from Riley's brief.

## Codex instructions

This file is the canonical instruction file for Codex and other AI coding agents.

Before coding, read:
1. `README.md`
2. `GRADING.md`
3. `topics/topic-1-marketmage.md`
4. `PLAN.md`

Do not use `CLAUDE.md` as a source of truth. This project uses `AGENTS.md`.

## Assigned topic

Topic 1 — MarketMage.

Follow the Topic 1 brief and use Frankfurter as the upstream FX API.

Frontend must call our backend.
Backend must proxy Frankfurter.

Correct flow:

```txt
React FE → Express BE `/api/...` → Frankfurter