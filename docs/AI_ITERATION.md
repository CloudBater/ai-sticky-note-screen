# AI Iteration Log

Curated prompt-iteration notes for this submission. This is intentionally concise and focused on decisions that changed what shipped.

## 1) Scope Trap Triage Iteration

- Prompt intent: implement the full Topic 1 brief quickly.
- Rejected outputs: real-time labeling, 99%-accuracy prediction framing, leveraged/auto trading behavior.
- Final decision: ship a defensible Option B thin slice (daily reference-rate literacy + paper portfolio simulation).
- Evidence: [PLAN.md](../PLAN.md), [docs/SCOPE_RESEARCH.md](./SCOPE_RESEARCH.md), [README.md](../README.md).

## 2) Rebalance Flow Iteration

- Prompt intent: reduce friction for allocation changes.
- Rejected output: one-click/automatic rebalance behavior.
- Final decision: manual rebalance flow with preview + explicit confirm-before-save.
- Evidence: [apps/frontend/components/PortfolioDashboard.tsx](../apps/frontend/components/PortfolioDashboard.tsx), [apps/backend/app/api/routes/portfolio.py](../apps/backend/app/api/routes/portfolio.py), [PLAN.md](../PLAN.md).

## 3) Run-Path / Dev Iteration

- Prompt intent: one simple command to run and verify locally.
- Refined output: stable backend/test script wrappers and Docker path clarity.
- Final decision: documented one-command Docker run plus reliable local backend/test execution scripts.
- Evidence: [README.md](../README.md), [scripts/dev-backend.sh](../scripts/dev-backend.sh), [scripts/run-tests.sh](../scripts/run-tests.sh), [docker-compose.yml](../docker-compose.yml).
