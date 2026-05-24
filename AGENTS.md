# Working Agreement — AI Tools

## When to use AI

- Scaffolding boilerplate (routes, components, test stubs)
- Writing test cases for a known function signature
- Drafting commit messages and PR descriptions
- Looking up API response shapes

## When NOT to use AI

- Product decisions: what to cut from Riley's brief, what to push back on
- Risk decisions: the leverage / prediction / KYC traps are mine to refuse — not the model's call
- Anything I wouldn't sign my name to

## Commit discipline

After every AI-assisted change, before `git add`:
1. Read every changed line
2. If a line can't be explained, delete it
3. AI-generated dead code (unused imports, debug logs) must not survive the diff review

## Boundaries

- Do not auto-commit. Always review before `git commit`.
- If the AI proposes installing a new package, pause and ask: is there a simpler alternative?
- No force-push over published history.
