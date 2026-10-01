import { accessSync, constants } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const executableSuffix = process.platform === "win32" ? ".cmd" : "";
const wranglerPath = path.join(
  repositoryRoot,
  "node_modules",
  ".bin",
  `wrangler${executableSuffix}`,
);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const persistencePath = path.join(repositoryRoot, ".wrangler", "state");
const port = process.env.PAGES_DEV_PORT || "8788";

try {
  accessSync(wranglerPath, constants.F_OK);
} catch {
  console.error(
    "Local Wrangler is missing. Apply docs/development/dev-001-dependency-delta.md and run npm ci first.",
  );
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(npmCommand, ["run", "build"], {
  env: {
    ...process.env,
    VITE_API_URL: "/api",
  },
});

run(wranglerPath, [
  "d1",
  "execute",
  "DB",
  "--local",
  "--persist-to",
  persistencePath,
  "--file",
  path.join(repositoryRoot, "sql", "d1-community-schema.sql"),
  "--yes",
]);

const child = spawn(
  wranglerPath,
  ["pages", "dev", "dist", "--persist-to", persistencePath, "--port", port],
  {
    cwd: repositoryRoot,
    stdio: "inherit",
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 0 : 1));
});
