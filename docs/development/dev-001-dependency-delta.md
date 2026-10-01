# DEV-001 dependency delta

Task 29 intentionally does not edit `package.json` or `package-lock.json` while the dependency-upgrade task owns those files.

For a reproducible clean checkout, merge this dependency through that owner and regenerate the lockfile with the repository's pinned Node/npm toolchain:

```json
{
  "devDependencies": {
    "wrangler": "4.102.0"
  }
}
```

Wrangler `4.102.0` declares Node `>=22.0.0`. The repository currently pins Node 20 in `.nvmrc`, and the server workspace pins `@types/node@20.10.6`, below Vite 8's `^20.19.0 || >=22.12.0` peer range. A direct `npm install wrangler@4.102.0` therefore fails with `ERESOLVE`. Integrate Wrangler together with task31's Node and `@types/node` alignment; do not use `--force` or `--legacy-peer-deps`.

The local launcher uses only `node_modules/.bin/wrangler`. It does not fall back to a globally installed CLI and does not allow `npx` to download an unpinned version at runtime.
