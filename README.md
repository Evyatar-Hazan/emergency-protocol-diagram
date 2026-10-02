# Emergency Protocol Diagram

A full-stack emergency protocol platform for interactive medical flow diagrams, step-by-step protocol guidance, vital signs references, Google OAuth login, and comments on protocol nodes.

## Structure

```text
apps/
  client/  React + TypeScript + Vite emergency protocol UI
  server/  Express + TypeScript + Prisma API for auth and comments
```

## Local Pages + D1 Development

The production-parity workflow serves the compiled client and Pages Functions together, applies the checked-in community schema to a local-only D1 database, and keeps that database under the ignored `.wrangler/` directory.

After the Wrangler dependency in [`docs/development/dev-001-dependency-delta.md`](docs/development/dev-001-dependency-delta.md) is merged, a clean checkout can start the full local stack with:

```bash
npm ci
node scripts/dev-pages-local.mjs
```

The app runs on `http://127.0.0.1:8788`. The launcher forces `VITE_API_URL=/api`, builds the app, applies `sql/d1-community-schema.sql` with `wrangler d1 execute --local`, and starts `wrangler pages dev` against the same persisted local state. It never uses remote bindings.

With the local Pages process running, verify both the binding and schema from a second terminal:

```bash
node scripts/verify-pages-local.mjs
```

For a reproducible, isolated smoke and performance baseline, run:

```bash
npm run baseline:local
```

This creates a fresh local D1 state, validates health and anonymous comment reads, records local endpoint latency and bundle sizes, and checks explicit budgets. Evidence and Wrangler logs are written below `.artifacts/option19/`; scope and limitations are documented in [`docs/development/option19-local-baseline.md`](docs/development/option19-local-baseline.md).

The smoke check requires JSON `200` responses from `/api/health` and `/api/comments/dev-001-smoke`. Finally, load the app and confirm the browser console has no Axios `Network Error` or `Failed to load comments` entry; the comments request should return JSON `200` in the Network panel.

### Vite + Express workspace development

The separate Express + PostgreSQL workspace is retained for server development, but it is not production parity. Copy the example environment files, configure a local PostgreSQL database, and run both processes:

```bash
cp apps/client/.env.example apps/client/.env
cp apps/server/.env.example apps/server/.env
npm run dev:server
npm run dev:client
```

Vite runs on `http://localhost:5173`, proxies same-origin `/api` requests to the Express server, and Express defaults to `http://localhost:5050`.

## Environment

Copy the example files only for the Vite + Express workflow:

```bash
cp apps/client/.env.example apps/client/.env
cp apps/server/.env.example apps/server/.env
```

Do not commit real `.env` files.

## Validation

```bash
npm run build
npm run lint
npm test
npm audit
```

GitHub Actions runs install, build, lint, and server tests on every push and pull request.
Use `npm audit --omit=dev` when checking production dependency exposure separately from development tooling.

## Project Tracking

The canonical expanded status and backlog live in [`docs/tracking/project-tracker.md`](docs/tracking/project-tracker.md).
Phase, redesign, and audit documents are supporting history and evidence; they must not be treated as competing open-task lists.
The AI Memory OS vault stores only a concise project summary and links back to the repository tracker.

## Production Build

Cloudflare Pages is the production deployment target for the current checkout. It builds this repository from the repo root using:

```bash
npm run build
```

The root build compiles both workspaces and then mirrors the client output to `/dist`, which matches `wrangler.toml` and the Cloudflare Pages publish path.

Production API routes are served by Cloudflare Pages Functions under `/functions`, with D1 bound as `DB` for health checks, comments, likes, and view tracking. The Express + Prisma server remains the local API workspace and shares the same domain model, but Cloudflare Functions + D1 are the live production path.

`apps/client/netlify.toml` is retained only as a legacy Netlify configuration and is aligned to Node 20 for parity with the root `engines` field and GitHub Actions. A local Netlify project link is not required for the Cloudflare Pages deployment path.
