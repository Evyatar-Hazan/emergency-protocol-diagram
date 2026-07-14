# Emergency Protocol Diagram

A full-stack emergency protocol platform for interactive medical flow diagrams, step-by-step protocol guidance, vital signs references, Google OAuth login, and comments on protocol nodes.

## Structure

```text
apps/
  client/  React + TypeScript + Vite emergency protocol UI
  server/  Express + TypeScript + Prisma API for auth and comments
```

## Local Development

```bash
npm install
npm run dev:client
npm run dev:server
```

The client runs on `http://localhost:5173` and the server defaults to `http://localhost:5050`.

## Environment

Copy the example files before running locally:

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

## Production Build

Cloudflare Pages is the production deployment target for the current checkout. It builds this repository from the repo root using:

```bash
npm run build
```

The root build compiles both workspaces and then mirrors the client output to `/dist`, which matches `wrangler.toml` and the Cloudflare Pages publish path.

Production API routes are served by Cloudflare Pages Functions under `/functions`, with D1 bound as `DB` for health checks, comments, likes, and view tracking. The Express + Prisma server remains the local API workspace and shares the same domain model, but Cloudflare Functions + D1 are the live production path.

`apps/client/netlify.toml` is retained only as a legacy Netlify configuration and is aligned to Node 20 for parity with the root `engines` field and GitHub Actions. A local Netlify project link is not required for the Cloudflare Pages deployment path.
