# Project Instructions for Claude Code

## What this project is

MarketMage — Topic 1 take-home for CloudMile. Thin fullstack FX rate dashboard.
Built to be graded, not for production traffic. Ship small, refuse traps, document reasoning.

## Stack

- **FE**: React 18 + Vite + Tailwind CSS + Recharts
- **BE**: Node.js (ESM) + Express
- **Tests**: Vitest + supertest (BE integration only)
- **Run**: `npm install && npm run dev` → FE on :5173, BE on :3001

## Conventions

- **File names**: `kebab-case`. Components: `PascalCase`, one per file.
- **Commits**: conventional prefix (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). Imperative, ≤72 chars.
- **Atomic commits**: one logical change per commit. Test commit comes *before* the impl commit.

## What to do when in doubt

- Don't add features Riley didn't ask for (especially the trap features).
- Don't add dependencies without justifying in the PR description.
- Don't write tests after impl is already green — commit order matters for the rubric.

## What NOT to do

- No `.env` files committed. No key-shaped strings anywhere in git history.
- No `node_modules/`, `dist/`, `client/dist/` committed.
- No force-pushes after opening the PR.
- No "real-time" or "live" labels in the UI — Frankfurter is daily-only.
- No AI prediction claims — the API has no prediction capability.
