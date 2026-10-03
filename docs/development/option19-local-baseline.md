# Option 19 — isolated Pages + D1 baseline

This harness establishes a repeatable, local-only baseline on top of PR #3 (`codex/task31-integration`, `64a325516f1fa6065a169cb3aa837fb23571da04`). It does not deploy, contact a remote D1 database, or mutate production data.

## Reproduce

Use the Node version pinned by `.nvmrc`, install exactly from the lockfile in a clean checkout, and run:

```bash
npm ci
npm run baseline:local
```

The command builds with `VITE_API_URL=/api`, creates a fresh local D1 state directory per run, applies `sql/d1-community-schema.sql`, starts `wrangler pages dev` on a free loopback port, and writes evidence under `.artifacts/option19/<timestamp>/`:

Wrangler telemetry and its update-check banner are disabled for the run so that the baseline remains local-only.

- `baseline.json` — health/comments smoke, endpoint p50/p95/max, bundle raw/gzip sizes, checks, and limitations.
- `pages-dev.log` — local Wrangler startup/runtime log.
- `d1-state/` — isolated local D1 state used for that run.

The runner exits non-zero when a smoke check or a checked budget fails. `npm run baseline:check` can measure an already-running Pages process; set `PAGES_DEV_URL` when it is not on port `8788`.

## What this proves

- The production-shaped route is exercised: compiled Vite assets + Pages Functions + a `DB` D1 binding.
- `/api/health` returns JSON `200` with `status=ok` and `database=ready`.
- anonymous `GET /api/comments/option19-baseline` returns JSON `200` with a comments array.
- bundle size and local API latency are captured in machine-readable form and guarded by explicit budgets.
- each run gets a fresh local-only D1 state, so it is independent from production and other local runs.

## Deliberate limits

- The comment smoke is read-only and unauthenticated. It does not claim that Google login or create/reply/like/delete works end to end; those need a dedicated test identity and later integration testing.
- Local p95 is a regression signal for the development environment, not a production-SLO claim.
- LCP `<=2500ms` and Lighthouse Performance `>=90` are acceptance targets carried from `PERF-001`. They are not measured by this dependency-free harness. A pinned browser/Lighthouse runner should be added in the later performance task before claiming either target is met.
- Cloudflare's local runtime emulates Pages/D1 APIs but cannot prove remote platform configuration or production bindings.

## Baseline budgets

`config/performance-budgets.json` records initial guardrails:

- total JavaScript gzip: `<=270 KiB`
- total CSS gzip: `<=12 KiB`
- largest JavaScript chunk gzip: `<=125 KiB`
- local health p95: `<=100ms`
- local comments p95: `<=150ms`

The bundle ceilings are intentionally close to the PR #3 baseline, not aspirational optimization targets. Tighten them only after a measured improvement; do not raise them merely to make a regression pass.
