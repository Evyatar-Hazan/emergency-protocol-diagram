# DEV-001 dependency delta

Task 29 initially left `package.json` and `package-lock.json` to the dependency-upgrade task. After explicit approval, the integration candidate now includes the local Wrangler runtime.

Wrangler is pinned exactly to `4.146.0`, npm's patched recommendation. The project runtime and GitHub Actions are pinned to Node `22.23.2`; the package engine floor is `>=22.12.0` to satisfy Vite 8. The server's `@types/node` is aligned to Node 22.

```json
{
  "devDependencies": {
    "wrangler": "4.146.0"
  }
}
```

The Node-20-compatible Wrangler `4.86.0` was rejected because the current npm audit reports High-severity vulnerabilities through its Miniflare dependency tree. Do not use `--force`, `--legacy-peer-deps`, dependency overrides, or an older vulnerable Wrangler release.

The local launcher uses only `node_modules/.bin/wrangler`. It does not fall back to a globally installed CLI and does not allow `npx` to download an unpinned version at runtime.
