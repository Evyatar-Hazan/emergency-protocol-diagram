import { accessSync, constants } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 12)) {
  throw new Error(`Node >=22.12.0 is required; received ${process.version}`);
}

const wranglerPath = path.join(repositoryRoot, "node_modules", "wrangler", "bin", "wrangler.js");
const npmCliPath = path.resolve(
  path.dirname(process.execPath),
  "..",
  "lib",
  "node_modules",
  "npm",
  "bin",
  "npm-cli.js",
);
for (const dependency of [wranglerPath, npmCliPath]) accessSync(dependency, constants.F_OK);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: "inherit",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForHealth(baseUrl, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Pages dev did not become healthy within ${timeoutMs}ms`);
}

const runId = new Date().toISOString().replaceAll(":", "-");
const artifactRoot = path.resolve(
  repositoryRoot,
  process.env.BASELINE_ARTIFACT_DIR || path.join(".artifacts", "option19", runId),
);
const statePath = path.join(artifactRoot, "d1-state");
const logPath = path.join(artifactRoot, "pages-dev.log");
await mkdir(statePath, { recursive: true });
const wranglerEnv = {
  ...process.env,
  CI: "1",
  DO_NOT_TRACK: "1",
  WRANGLER_HIDE_BANNER: "true",
  WRANGLER_SEND_METRICS: "false",
  WRANGLER_LOG_PATH: path.join(artifactRoot, "wrangler.log"),
};

run(process.execPath, [npmCliPath, "run", "build"], {
  env: { ...process.env, VITE_API_URL: "/api" },
});
run(process.execPath, [
  wranglerPath,
  "d1",
  "execute",
  "DB",
  "--local",
  "--persist-to",
  statePath,
  "--file",
  path.join(repositoryRoot, "sql", "d1-community-schema.sql"),
  "--yes",
], { env: wranglerEnv });

const port = Number(process.env.PAGES_DEV_PORT || (await reservePort()));
const baseUrl = `http://127.0.0.1:${port}`;
let serverLog = "";
const pages = spawn(process.execPath, [
  wranglerPath,
  "pages",
  "dev",
  "dist",
  "--persist-to",
  statePath,
  "--port",
  String(port),
  "--ip",
  "127.0.0.1",
], {
  cwd: repositoryRoot,
  env: wranglerEnv,
  stdio: ["ignore", "pipe", "pipe"],
});
for (const stream of [pages.stdout, pages.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    serverLog += chunk;
    process.stderr.write(chunk);
  });
}

let exitCode = 1;
try {
  await waitForHealth(baseUrl);
  const baseline = spawnSync(
    process.execPath,
    [path.join(repositoryRoot, "scripts", "check-local-baseline.mjs")],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: { ...process.env, PAGES_DEV_URL: baseUrl },
    },
  );
  if (baseline.error) throw baseline.error;
  await writeFile(path.join(artifactRoot, "baseline.json"), baseline.stdout);
  process.stdout.write(baseline.stdout);
  process.stderr.write(baseline.stderr);
  exitCode = baseline.status ?? 1;
} finally {
  pages.kill("SIGTERM");
  await writeFile(logPath, serverLog);
}

console.log(`Baseline artifacts: ${artifactRoot}`);
process.exit(exitCode);
