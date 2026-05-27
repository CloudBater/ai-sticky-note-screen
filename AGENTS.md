# Working Agreement — AI Tools

## When to use AI

- **Scaffolding**: first commit of a new module, boilerplate config, wiring. Fast path.
- **Test-case generation**: "given this function signature, write 4 cases — nominal + 3 edge cases."
- **Refactoring**: rename, extract function, switch pattern across N files. Reliable with diff review.
- **Prose drafts**: README sections, PR descriptions, PLAN.md narrative.
- **API shape lookups**: "what does `/users/:username/repos` return?" — faster than docs.

## When NOT to use AI

- **Product decisions**: what to cut from the brief, how to phrase the pushback. The rubric grades *your* taste.
- **Risk decisions**: trap features in the brief are yours to refuse. "The brief says X so I built X" is a candidate failure.
- **Tricky bugs**: spend 5 min reading the code yourself before asking.

## Commit discipline

TDD level 3 requires the test commit to *actually fail* at its SHA (impl doesn't exist yet).
Sequence every time:
1. `test:` commit — test file only, no impl — run the suite, confirm red.
2. `feat:` commit — impl only — run the suite, confirm green.

Never batch test + impl in one commit.

## Diff review — non-negotiable

After every AI-assisted change, before `git add`:
1. `git diff` staged + unstaged.
2. Read every changed line.
3. Can't justify a line to a grader → delete it.
4. Dead imports, debug logs, commented-out experiments → none of these survive the read.

## Commit messages

AI may draft; you read before using.
- ✅ `feat: add /api/user/:username endpoint with 5-min cache`
- ❌ `feat: implement comprehensive GitHub user fetching with robust caching`

## Hard limits

- Never auto-commit. Review before `git commit`.
- Never grant AI write-access to `.env`.
- If AI proposes a new package, pause: is there a 3-line vanilla version?
