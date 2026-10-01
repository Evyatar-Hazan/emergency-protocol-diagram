# DEV-001 dependency delta

Task 29 intentionally does not edit `package.json` or `package-lock.json` while the dependency-upgrade task owns those files.

No Wrangler dependency is integrated yet. The original `4.102.0` proposal requires Node `>=22.0.0`, while this repository and CI remain on Node 20. The Node-20-compatible `4.86.0` release was also rejected because the current npm audit reports High-severity vulnerabilities through its Miniflare dependency tree. npm's patched Wrangler recommendation is `4.146.0`, which likewise requires Node `>=22.0.0`.

```json
{
  "devDependencies": {
    "wrangler": "4.146.0"
  }
}
```

Adding the patched pin therefore requires explicit approval to move the project-scoped runtime and GitHub Actions to Node 22 and to align the server's `@types/node` with Vite 8. Do not use `--force`, `--legacy-peer-deps`, dependency overrides, or an older vulnerable Wrangler release.

The local launcher uses only `node_modules/.bin/wrangler`. It does not fall back to a globally installed CLI and does not allow `npx` to download an unpinned version at runtime.
