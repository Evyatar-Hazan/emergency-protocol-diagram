import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const budgets = JSON.parse(
  await readFile(path.join(repositoryRoot, "config", "performance-budgets.json"), "utf8"),
);
const baseUrl = (process.env.PAGES_DEV_URL || "http://127.0.0.1:8788").replace(/\/$/, "");
const sampleCount = Number.parseInt(process.env.BASELINE_SAMPLES || "20", 10);

if (!Number.isInteger(sampleCount) || sampleCount < 3 || sampleCount > 200) {
  throw new Error("BASELINE_SAMPLES must be an integer from 3 through 200");
}

async function getJson(pathname) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { accept: "application/json" },
  });
  const durationMs = performance.now() - startedAt;
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();

  if (response.status !== 200) {
    throw new Error(`${pathname} returned ${response.status}: ${body.slice(0, 240)}`);
  }
  if (!contentType.includes("application/json")) {
    throw new Error(`${pathname} returned ${contentType || "no content type"}, expected JSON`);
  }

  return { durationMs, json: JSON.parse(body) };
}

function percentile(values, value) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil((value / 100) * sorted.length) - 1);
  return sorted[index];
}

async function measureEndpoint(pathname, assertPayload) {
  for (let index = 0; index < 3; index += 1) {
    assertPayload((await getJson(pathname)).json);
  }

  const samples = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const result = await getJson(pathname);
    assertPayload(result.json);
    samples.push(result.durationMs);
  }

  return {
    samples: samples.length,
    p50Ms: Number(percentile(samples, 50).toFixed(2)),
    p95Ms: Number(percentile(samples, 95).toFixed(2)),
    maxMs: Number(Math.max(...samples).toFixed(2)),
  };
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(absolutePath)));
    if (entry.isFile()) files.push(absolutePath);
  }
  return files;
}

async function measureBundle() {
  const dist = path.join(repositoryRoot, "dist");
  const files = await listFiles(dist);
  const assets = [];
  for (const absolutePath of files) {
    const buffer = await readFile(absolutePath);
    assets.push({
      path: path.relative(dist, absolutePath),
      bytes: buffer.byteLength,
      gzipBytes: gzipSync(buffer, { level: 9 }).byteLength,
      sha256: createHash("sha256").update(buffer).digest("hex"),
    });
  }

  const javascript = assets.filter((asset) => asset.path.endsWith(".js"));
  const css = assets.filter((asset) => asset.path.endsWith(".css"));
  return {
    assets,
    javascriptBytes: javascript.reduce((sum, asset) => sum + asset.bytes, 0),
    javascriptGzipBytes: javascript.reduce((sum, asset) => sum + asset.gzipBytes, 0),
    cssBytes: css.reduce((sum, asset) => sum + asset.bytes, 0),
    cssGzipBytes: css.reduce((sum, asset) => sum + asset.gzipBytes, 0),
    largestJavaScriptGzipBytes: Math.max(...javascript.map((asset) => asset.gzipBytes)),
  };
}

const health = await measureEndpoint("/api/health", (payload) => {
  if (payload.status !== "ok" || payload.database !== "ready") {
    throw new Error(`Unexpected health payload: ${JSON.stringify(payload)}`);
  }
});
const comments = await measureEndpoint("/api/comments/option19-baseline", (payload) => {
  if (!Array.isArray(payload.comments)) {
    throw new Error(`Unexpected comments payload: ${JSON.stringify(payload)}`);
  }
});
const bundle = await measureBundle();

const checks = {
  healthP95: health.p95Ms <= budgets.localApi.healthP95Ms,
  commentsP95: comments.p95Ms <= budgets.localApi.commentsP95Ms,
  javascriptGzip: bundle.javascriptGzipBytes <= budgets.bundle.javascriptGzipBytes,
  cssGzip: bundle.cssGzipBytes <= budgets.bundle.cssGzipBytes,
  largestJavaScriptGzip:
    bundle.largestJavaScriptGzipBytes <= budgets.bundle.largestJavaScriptGzipBytes,
};

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    baseUrl,
    samplesPerEndpoint: sampleCount,
    isolation: "wrangler-local-d1-only",
  },
  smoke: { health: "pass", commentsGuestRead: "pass" },
  timings: { health, comments },
  bundle,
  budgets,
  checks,
  limitations: [
    "Comments validation covers unauthenticated read against isolated local D1 only.",
    "Authenticated create/reply/like/delete requires a test identity and is intentionally not exercised.",
    "LCP and Lighthouse targets are recorded but not measured by this dependency-free runner.",
    "Local endpoint latency is a regression signal, not a production latency claim."
  ]
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (Object.values(checks).some((passed) => !passed)) process.exitCode = 1;
