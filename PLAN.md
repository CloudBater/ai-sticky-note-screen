# PLAN

## Topic I was assigned

Topic 3 — DevScore

## Stack I picked

- FE: React + Vite + TypeScript
- BE: Node.js + Express + TypeScript
- Tests: Vitest (shared runner for both BE scorer and FE component tests)
- Why this stack: familiar, fast to scaffold, minimal footprint — right-sized for a take-home thin slice.

## Items in the brief that are red flags (legal, ethical, technical)

- **Score boost for $199/mo ("DevScore Pro")** — Selling a point boost that alters a purportedly objective ranking is fraudulent misrepresentation under FTC UDAP. It doesn't "grow" anything; it sells fake data to people who rely on it for hiring decisions. There is no counter-proposal that makes "pay to inflate your score" acceptable.

- **AI employment categorisation** ("10x engineer", "ic5 ceiling", "founder material", "do not hire") — Automated employment-decision-making is a high-risk AI system under EU AI Act Art. 6(2). NYC Local Law 144 (AEDT) requires an independent bias audit before deployment; we have neither the audit nor a use-case exemption. Title VII disparate-impact risk is real and unquantified. There is no version of labelling a developer "do not hire" via algorithm that we ship — the words "for entertainment purposes only" in a footer do not shift liability when recruiters act on the labels.

- **Private repo counting** — Technically impossible (Shape C refusal). `/users/:username/repos` does not return private repositories to anyone except the authenticated account owner. `total_private_repos` lives on `/user` (your own data only). Any field we surface for this would silently be zero or undefined. The brief is factually wrong about the API.

- **Recruiter SaaS leaderboard / selling PII without consent** — GitHub's Acceptable Use Policies prohibit using API data for "any activity designed to scrape, harvest, or otherwise gather information from GitHub for purposes outside the API's intended use." Selling a leaderboard of ranked developer profiles to third-party recruiters, without each developer's explicit consent, lacks a lawful basis under GDPR Art. 6 and CCPA § 1798.100. The fact that profile data is publicly accessible does not constitute consent to sell it.

- **"FICO-style" 300–850 branding** — FICO is a registered trademark. More importantly, the FICO range implies credit-report-grade statistical validity (regulatory oversight, dispute rights, defined methodology). Calling our heuristic "FICO for developers" manufactures a trust signal we cannot back. It would mislead recruiters about the score's reliability.

- **Mass-indexing every developer on GitHub** — The brief says "index every dev." Beyond the AUP violation above, this would exhaust 60 req/h (unauthenticated) in seconds and 5,000 req/h (PAT) in minutes at scale. There is no meaningful caching strategy that makes "index every dev" work within the GitHub rate limits for a v0 product.

- **"Code quality" as a metric** — GitHub's REST API does not expose code quality. Anything we compute is a heuristic (star count, language diversity). Labelling a heuristic as "code quality" misleads users about what it measures.

## What I'm explicitly **not** shipping (and why)

- **Score-boost payment tier** — fraudulent, see above. This feature does not exist on our roadmap.
- **AI employment labels** — high-risk automated employment tool without the required bias audit; see above.
- **Private repo stats** — API doesn't expose them; silently returning zero is worse than omitting the field.
- **Recruiter-facing leaderboard** — AUP + GDPR; no consent mechanism exists at v0.
- **CSV export for recruiter CRMs** — the leaderboard itself is cut; the export has nowhere to live.
- **Mass background indexing** — rate limits make it non-viable; user-on-demand lookup covers the real use case.

## What I'm pushing back on (and proposing instead)

**Asked:** "FICO-style DevScore 300–850 as an authoritative signal recruiters pay $50k/seat for."
→ **I'm proposing:** a transparent 0–100 heuristic score with a visible breakdown (stars, repos, followers, account age, language diversity) and an explicit disclaimer that it is a proxy for public GitHub activity, not a validated employment predictor.
→ **Why:** The underlying insight — "GitHub public data is signal-dense and LinkedIn is stale" — is genuinely true. A transparent heuristic that names its methodology is defensible and actually useful; a black-box "FICO score" without statistical validation is a liability and will be written about in *The Verge*.

**Asked:** "AI explanation that categorises the dev ('10x engineer', 'do not hire')."
→ **I'm proposing:** a "profile strengths" summary — a short narrative of what stands out in the developer's public activity (most-starred project, primary language, years active, recent activity) without employment-outcome labels.
→ **Why:** The recruiter's real need is "help me understand this person quickly." A factual summary of their public work satisfies that need without the EU AI Act / NYC LL144 exposure. The dev also sees exactly what the recruiter sees — no black box.

**Asked:** "Rate-limit ourselves to 5,000 req/h to avoid getting blocked."
→ **I'm proposing:** on-demand lookups (user types a username, BE fetches and caches) with a 5-minute TTL per user and the upstream `X-RateLimit-Remaining` surfaced in the UI so the operator can see budget in real time.
→ **Why:** The 5,000 req/h ceiling is the authenticated PAT limit, not a tunable knob. Proactive self-limiting at 5,000 req/h on a mass-indexing task would still exhaust the budget in minutes. On-demand + caching is the only architecture that keeps rate-limit spend proportional to actual user queries.

## What I'm shipping in this take-home

1. **BE**: Express + TypeScript proxy to GitHub REST API
   - `GET /api/user/:username` — returns user profile, repo list summary, and computed score
   - In-memory cache with 5-minute TTL (prevents rate-limit drain on repeated lookups)
   - `X-RateLimit-Remaining` surfaced in JSON response so the grader can see budget
   - Optional `GITHUB_TOKEN` via `.env` to lift unauthenticated 60 req/h to 5,000 req/h

2. **FE**: React + Vite + TypeScript single-page app
   - Username search form with recent-searches persistence (localStorage, max 5)
   - Profile card (avatar, name, bio, account stats)
   - **Profile activity summary**: 2–3 sentence data-driven narrative of public GitHub activity — delivers the counter-proposal above (no employment labels, no AI hallucination)
   - Score breakdown panel with **tier badge** ("Notable Developer", "Active Contributor", etc.) and per-component bar chart
   - Staleness badge (cache age) + `X-RateLimit-Remaining` display
   - Explicit methodology note: "Score is a heuristic based on public GitHub activity. It is not a validated employment predictor."
   - Friendly error states: 404 (user not found), 429 (rate-limit exhausted + `GITHUB_TOKEN` hint), 502 (upstream failure)
   - Skeleton loading state (shimmer placeholder while fetching)
   - "Search another developer →" CTA after each result (closes the discovery loop)

3. **Tests**: Vitest unit tests for the scorer module, committed *before* the scorer implementation (TDD red→green)

## How to run

### Option A — Docker (one-click, no Node.js required)

```bash
docker compose up --build   # build + start; visit http://localhost:3001
```

### Option B — Local dev

```bash
npm install          # installs root + workspaces
npm run dev          # starts BE on :3001 and FE on :5173 concurrently
```

What environment variables are needed (names only — no values):

- `GITHUB_TOKEN` — optional; lifts GitHub API rate limit from 60 req/h to 5000 req/h; add to `.env`
