# Emergency Protocol Diagram Client

This workspace contains the React + TypeScript + Vite client for the Emergency Protocol Diagram learning and review platform.

## Product Scope

The client is designed for guided BLS learning and review. It is not a clinical decision-support system for live incidents and does not replace training, organizational protocols, dispatch instructions, or professional judgment.

See [`docs/product/intended-use.md`](../../docs/product/intended-use.md) for the proposed detailed scope. That document remains `draft-for-review` and is not an approved user-facing disclaimer.

## Current Role

The client provides:

- a guided, step-by-step learning flow;
- quick-reference material for learning and review;
- a secondary full-system diagram;
- bookmarks and local navigation history;
- source links and supporting learning content;
- node-level community comments.

Protocol content is loaded from `src/protocols/`. Client state and navigation live under `src/store/` and the feature components under `src/components/`.

## Runtime Architecture

For production, the compiled client is served by Cloudflare Pages. Requests under `/api` are handled by Cloudflare Pages Functions with D1. The Express + Prisma workspace under `apps/server` is retained for local/server development and is not the production backend.

The root [`README.md`](../../README.md) is authoritative for local startup, validation, and deployment architecture.

## Local Development

From the repository root:

```bash
npm ci
npm run dev:client
```

Use the root production-parity workflow when testing the client together with Pages Functions and local D1.

## Validation

From the repository root:

```bash
npm run build:client
npm run lint:client
npm run test:client
npm run test:coverage:client
```

These commands validate software behavior only. They do not constitute clinical review or content approval.

## Documentation Map

- Product scope: [`docs/product/intended-use.md`](../../docs/product/intended-use.md), `draft-for-review`.
- Repository status and backlog: [`docs/tracking/project-tracker.md`](../../docs/tracking/project-tracker.md).
- Clinical source inventory and mappings: [`docs/source-truth/united-hatzalah-bls/`](../../docs/source-truth/united-hatzalah-bls/).
- [`APP.md`](./APP.md): historical/superseded early vision.
- [`PROTOCOL_DEVELOPMENT.md`](./PROTOCOL_DEVELOPMENT.md): historical implementation snapshot.
- [`config/README.md`](./config/README.md): legacy design note for the optional configuration layer.
