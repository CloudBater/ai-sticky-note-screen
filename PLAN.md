## Topic I was assigned

Topic 3 — DevScore

## Core idea

Developers genuinely want better ways to present their public GitHub activity during hiring, but turning that into an unsolicited “credit score” system for all developers is the trap.

## Stack I picked

- FE: React (Vite)
- BE: FastAPI (Python)
- Why this stack (one sentence): React with Vite provides a fast, component-based UI for data visualization, while FastAPI serves as a lightweight backend proxy with caching to handle GitHub API requests and rate limits.

## Items in the brief that are red flags (legal, ethical, technical)

Some parts of the brief introduce significant product, legal, and ethical risks rather than simply expanding scope.

- Building recruiter-facing rankings and profiles for all GitHub developers without consent creates concerns around GitHub Acceptable Use Policy compliance, GDPR lawful-basis requirements, and commercialization of publicly visible personal data without user participation.
- AI-generated hiring labels such as “do not hire”, “IC5 ceiling”, or “10x engineer” create substantial risk around automated employment decision systems, proxy bias, and discriminatory hiring workflows. Public GitHub activity is not a reliable proxy for engineering ability or career potential.
- Selling score boosts (“DevScore Pro +50”) undermines the credibility of the scoring system itself and creates misleading incentives if the score is intended to influence hiring perception.
- Recruiter-facing global leaderboards using developer names, avatars, and employer information move the product from self-presentation into large-scale profiling and ranking of individuals.
- The brief assumes GitHub public APIs expose private repository counts for arbitrary users, which is technically incorrect. Private repository counts are not accessible through public third-party lookups.

## What I'm explicitly **not** shipping (and why)

Items that aren't worth a counter-proposal — just cut. Trap features go here. Out-of-scope-for-v0 features also go here.

- AI hiring classifications (“do not hire”, “IC5 ceiling”, “10x engineer”):Automatically generating employment judgments from GitHub activity is unreliable and introduces unnecessary legal and ethical risk.
- Paid score inflation (“DevScore Pro +50”):Artificially increasing scores through payment weakens trust in the scoring system and makes the metrics misleading.
- Global developer indexing and ranking:The product is intentionally designed as an opt-in self-analysis tool rather than a recruiter surveillance platform.
- Recruiter CSV export:Bulk exporting developer identity data encourages unauthorized aggregation and downstream misuse.
- Avatar-based public ranking pages:The product is not intended to become a public reputation marketplace for developers.

## What I'm pushing back on (and proposing instead)

The brief is partially impossible. For each refused item, propose what you would ship instead that preserves the *intent* of the request. Senior signal: a counter-proposal that keeps 80% of what Riley actually wanted, minus the impossible/illegal/unethical 20%, scores higher than a flat "no".

Format suggestion: `Asked: X → I'm proposing: Y → Why: Z`

Asked:A single opaque 300–850 “DevScore” similar to a financial credit score.
I'm proposing:Three transparent heuristic dimensions:Recency,Reach,Breadth.Each score includes visible calculation logic and supporting metrics.
Why:A single score creates false precision and encourages overinterpretation. GitHub APIs do not expose “code quality”, “seniority”, or “hireability”. Dimension-based metrics preserve the useful intent — quickly understanding public activity patterns — while remaining interpretable and challengeable.

Asked:Create searchable profiles and rankings for all GitHub developers.
I'm proposing:Users voluntarily enter their own GitHub username to generate a personal analytics report that they may choose to share.
Why:This changes the product from passive surveillance into active self-presentation. Recruiters can still review reports if candidates share them, but control remains with the developer.

Asked:AI-generated hiring recommendations and career labels.
I'm proposing:AI-generated factual summaries of observable public GitHub activity.Example:“Primarily active in TypeScript repositories over the last 90 days with contributions across three active projects.”
Why:Describing observable activity is substantially safer and more defensible than generating employment judgments while still helping someone quickly understand a developer’s public activity profile.

Asked:Access private repository counts for arbitrary GitHub users.
I'm proposing:Use only publicly accessible GitHub metrics exposed through official APIs.
Why:GitHub public APIs do not expose private repository counts for third-party lookups. The requested metric is not technically available.

## What I'm shipping in this take-home

The thin vertical slice I will actually deliver. Be specific. This should be small.

It is OK — and often the senior answer — for this list to be **shorter** than the refusal list above. See `GRADING.md`: ambitious refusal scores higher than ambitious compliance.

- Username input → FastAPI proxy → GitHub data (with 24h cache)
- Three-dimension score display with "Why this score?" explanation
- AI-generated factual activity summary via Anthropic API

## How to run locally

Command(s) a grader needs to run, in order (typically install + start):

```
cp .env.example .env
pip install -r requirements.txt
make dev
```

What environment variables are needed (names only — no values):

- GITHUB_PAT
- ANTHROPIC_API_KEY
