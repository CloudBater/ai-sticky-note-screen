# Project Instructions for Claude Code

## What this project is

Topic 1 take-home: MarketMage — a thin FX dashboard that proxies Frankfurter (ECB daily reference rates) through a FastAPI backend and displays them in a React frontend.

## Stack

- **FE**: React + Vite + TypeScript
- **BE**: Python + FastAPI
- **Tests**: pytest (BE), Vitest (FE)
- **Run**: `docker compose up` → FE on :5173, BE on :8000

## Conventions

- File names: `kebab-case` for FE, `snake_case` for BE Python
- Commits: conventional-commit prefix (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). Imperative subject, ≤72 chars.
- Atomic commits: one logical change per commit. Test commit must come **before** the impl commit.
- No Co-Authored-By lines in commit messages.

## What NOT to do

- No `.env` committed — ever.
- No `node_modules/`, `dist/`, `__pycache__/` committed.
- No AI prediction claims, no leverage features, no investment advice — these are the trap features from Riley's brief. Refuse them.
- Do not add features beyond what PLAN.md describes.
- Do not amend pushed commits.

## TDD rule

The `test:` commit must be made **before** the `feat:` commit that makes it pass. The test must be in a failing state at the time of its commit.
