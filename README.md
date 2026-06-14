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

The client runs on `http://localhost:5173` and the server defaults to `http://localhost:5000`.

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
