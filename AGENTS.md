# Working Agreement — You and Your AI Tools

> **Adapted** for MarketMage (Topic 1). This project uses Claude Code as the primary AI-CLI tool.

## When to use the AI

- **Scaffolding** — first commit of a new module, boilerplate config, dependency wiring. AI is faster than you here. Let it.
- **Writing tests for a known contract** — "given this endpoint shape, write test cases covering nominal + error cases." AI does this well.
- **Reformatting / refactoring** — rename, extract function, switch a pattern across files. AI is reliable as long as you read the diff.
- **Drafting docs** — README sections, PR descriptions, the prose part of `PLAN.md`.
- **Looking up shapes** — "what does Frankfurter's `/latest` response look like?" Faster than navigating docs.

> Why: AI is highest-leverage when the *intent* is clear and the *constraints* are mechanical.

## When to NOT use the AI

- **Product decisions.** What to cut from Riley's brief, what to push back on, how to phrase the counter-proposal in `PLAN.md`. The rubric grades *your* taste, not the model's.
- **Risk decisions.** When the brief contains a trap (50x leverage, SEC loophole, false 99% accuracy claim), the response is yours to own.
- **First-pass on a tricky bug.** Spend 5 minutes reading the code yourself before asking.
- **Anything you wouldn't sign your name to.**

> Why: The screen explicitly tests for *senior judgement*. Product and risk calls aren't AI-outsourceable.

## Reading the diff — non-negotiable

After every AI-assisted change, before `git add`:

1. `git diff` the staged + unstaged together
2. Read every changed line.
3. If a line confuses you, ask the AI to explain it, then decide if it stays.
4. If you can't justify a line to a grader, delete it.

## Commit messages

- ✅ `feat: add /api/rates endpoint proxying Frankfurter with 6h cache`
- ❌ `feat: implement comprehensive currency exchange rate fetching with robust caching`

Strip adjectives. The grader reads `git log --oneline`.

## Boundaries

- **Don't auto-commit.** Review before every `git commit`.
- **If the AI proposes a new package, pause.** Is there a 3-line vanilla version? Often yes.
