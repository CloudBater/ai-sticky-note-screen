
---

## `.agents/skills/commit-discipline/SKILL.md`

```md
---
name: commit-discipline
description: Use this skill when planning or reviewing commits for this take-home. It enforces atomic commits, TDD order, and clean git history.
---

# Commit Discipline Skill

## Goal

Keep the git history reviewable and aligned with the grading rubric.

## Rules

Use small, atomic commits.

Prefer this order for feature work:

1. `test:` commit with a failing test.
2. `feat:` or `fix:` commit with the smallest implementation that makes the test pass.
3. Optional `refactor:` commit after tests are green.

## Good commit messages

- `docs: define MarketMage scope and refusals`
- `docs: configure Codex agent workflow`
- `chore: remove starter failing test`
- `test: specify unsupported currency handling`
- `feat: add currency support splitter`
- `test: specify simulated conversion preview`
- `feat: add conversion preview calculation`
- `test: specify latest rates proxy contract`
- `feat: add Frankfurter latest rates endpoint`
- `feat: render MarketMage dashboard`
- `docs: add local run instructions`

## Bad commit messages

- `update`
- `fix`
- `final`
- `done`
- `finish project`
- `misc changes`

## Before committing

Run the relevant checks:

```bash
npm test
npm run typecheck