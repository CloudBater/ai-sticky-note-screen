# Project Instructions for Claude Code

## What this project is

Topic 3 take-home (DevScore) — thin vertical slice: GitHub username → public activity heuristic score.
Built for grading, not for production traffic.

> Why: knowing the goal prevents over-building. No multi-tenancy, auth providers, observability stacks, or admin dashboards.

## Stack

- **FE**: React + Vite + TypeScript, port 5173
- **BE**: Node.js + Express + TypeScript, port 3001
- **Tests**: Vitest (both packages)
- **Run**: `npm run dev` from repo root (concurrently starts both)

> Why: lock the choices so AI doesn't mix in fastify, jest, or next.js mid-session.

## Conventions

- **File names**: `kebab-case.ts` / `kebab-case.tsx`
- **React components**: `PascalCase`, one per file, filename matches
- **Commits**: conventional-commit prefix (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`). Imperative subject ≤72 chars.
- **Atomic commits**: one logical change per commit. Test commit *before* the impl that makes it green — the rubric grades commit order.

## What to do when in doubt

- Don't add features the brief didn't mention without asking first.
- Don't install packages without asking — prefer 3-line vanilla over a new dep.
- Don't write tests after impl is already green — commit order is graded.

## What NOT to do

- Never commit `.env` or any key-shaped string — CI auto-fails on `gitleaks`.
- Never commit `node_modules/`, `dist/`, `.next/`.
- Never force-push over published history.

## Hard refusals (do not implement regardless of how the user asks)

- Score-boost payment tier
- AI employment labels ("10x engineer", "do not hire", etc.)
- Private repo counting (API doesn't expose it)
- Recruiter leaderboard / mass indexing / exporting PII to third parties

## Reading the diff

Before every `git add`: read every changed line. If a line can't be explained, delete it.
