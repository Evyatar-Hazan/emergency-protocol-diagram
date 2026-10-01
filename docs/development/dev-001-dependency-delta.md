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

The local launcher uses only `node_modules/.bin/wrangler`. It does not fall back to a globally installed CLI and does not allow `npx` to download an unpinned version at runtime.
