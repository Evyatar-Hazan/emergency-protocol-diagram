const baseUrl = (process.env.PAGES_DEV_URL || "http://127.0.0.1:8788").replace(
  /\/$/,
  "",
);

async function getJson(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const contentType = response.headers.get("content-type") || "";

  if (response.status !== 200) {
    throw new Error(`${pathname} returned ${response.status}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      `${pathname} returned ${contentType || "no content type"}, expected JSON`,
    );
  }

  return response.json();
}

const health = await getJson("/api/health");
if (health.status !== "ok" || health.database !== "ready") {
  throw new Error(
    `/api/health returned an unexpected payload: ${JSON.stringify(health)}`,
  );
}

const comments = await getJson("/api/comments/dev-001-smoke");
if (!Array.isArray(comments.comments)) {
  throw new Error(
    `/api/comments returned an unexpected payload: ${JSON.stringify(comments)}`,
  );
}

console.log("Pages + D1 smoke passed: health=200, comments=200.");
