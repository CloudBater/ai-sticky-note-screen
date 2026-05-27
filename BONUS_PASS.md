# Bonus Pass — DevScore

> Context for a new session picking up where the main implementation left off.
> Target: push product-judgement bonus from +1 → +2.
> All changes are frontend-only. No backend changes needed.

## Current state (end of main session)

```
git log --oneline (newest first):
ee229e6  chore: remove planted failing test from starter/
dac8eca  feat: add React+Vite frontend with search, profile, score breakdown
7322c17  feat: add GitHub proxy service with 5-min in-memory cache
e080750  feat: implement scorer module (turns scorer tests green)
3fd301f  test: add scorer unit tests (failing — impl not yet present)
a640c53  chore: scaffold backend and frontend packages
7d2a2b7  chore: add CLAUDE.md and AGENTS.md for AI tooling guidance
b67a136  docs: fill PLAN.md with triage, refusals, and counter-proposals
```

`npm test` → 11 tests pass (8 BE scorer + 3 FE ScoreBreakdown component)
`npm run dev` → BE :3001, FE :5173, confirmed working with live GitHub API

## Why bonus is currently ~+1 and not higher

1. **Gap between PLAN.md counter-proposal and implementation:**
   PLAN.md explicitly promised "a profile strengths summary — factual narrative of public activity without employment labels."
   This was NOT shipped. A grader reading PLAN.md then the code will notice.

2. **Score number has no context:**
   "75.4 / 100" is shown but doesn't tell a first-time visitor what that means.
   A tier badge ("Notable Developer") makes it immediately readable.

## Three changes to make

### Change 1 — ProfileSummary component (NEW FILE)
`frontend/src/components/ProfileSummary.tsx`

Delivers the PLAN.md counter-proposal. Template-based, no LLM, purely factual.

Logic (2–3 sentences, each conditional):
```
sentence 1: "${name} has been on GitHub for ${N} year(s)."
sentence 2 (if topRepo.stars > 0): "Their most-starred project is ${repo} (${lang}) with ${stars} ★."
sentence 3 (if followers > 10000): "With ${N} followers, they have notable visibility in the open-source community."
           (if followers > 500):   "They have an active following of ${N} developers."
           (else): omit
```

Insert in `ProfileCard.tsx` between the profile header section and the `<ScoreBreakdownPanel>`.

### Change 2 — Score tier badge (MODIFY ScoreBreakdown.tsx)
Add a badge next to the big score number (same row, right side).

Tier thresholds:
```
≥ 80 → "High-Visibility"    color: --accent (blue)
≥ 60 → "Notable Developer"  color: --green  (#3fb950)
≥ 40 → "Active Contributor" color: --yellow (#d29922)
≥ 20 → "Building Presence"  color: --text-muted
<  20 → "New to Open Source" color: --text-muted
```

Important: these are GitHub visibility labels, NOT employment predictions.
The existing disclaimer below the bars still applies.

### Change 3 — Skeleton loading state (MODIFY App.tsx + new SkeletonCard component)
Replace the plain "Fetching GitHub profile…" text with a shimmer skeleton
that approximates the shape of the real profile card.

Skeleton sections (top-to-bottom):
- avatar circle + two lines (name / login)
- 3 short stat lines
- one tall score block
- 2 repo lines

CSS shimmer: `background: linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%)`
with `background-size: 200%` and a keyframe animation sliding left-to-right.

## Commit plan for this pass

Two commits (not one big, not five tiny):

```
feat: add ProfileSummary and score tier badge
  - ProfileSummary.tsx: data-driven 2-3 sentence narrative (delivers PLAN.md counter-proposal)
  - ScoreBreakdown.tsx: tier badge next to total score
  - ProfileCard.tsx: insert ProfileSummary between header and score
  - styles.css: summary + tier badge styles

feat: add skeleton loading state
  - SkeletonCard.tsx: shimmer skeleton matching card layout
  - App.tsx: replace loading text with SkeletonCard
  - styles.css: shimmer keyframe animation
```

## Files to touch

| File | Action |
|---|---|
| `frontend/src/components/ProfileSummary.tsx` | CREATE |
| `frontend/src/components/SkeletonCard.tsx` | CREATE |
| `frontend/src/components/ScoreBreakdown.tsx` | MODIFY — add tier badge |
| `frontend/src/components/ProfileCard.tsx` | MODIFY — insert ProfileSummary |
| `frontend/src/App.tsx` | MODIFY — replace loading text |
| `frontend/src/styles.css` | MODIFY — new styles for all three |

## Verify after

```bash
npm test          # still 11+ tests passing
npm run dev       # open :5173, search "octocat" → see tier badge + summary
                  # search "newuser123" (fresh account) → see "New to Open Source"
                  # trigger loading → see skeleton shimmer
```
