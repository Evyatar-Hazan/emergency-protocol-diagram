-- Read-only preflight for the next bounded purge batch.
SELECT
  COUNT(*) AS eligible_count,
  MIN(expires_at) AS oldest_expiry
FROM comment_moderation_audit
WHERE expires_at <= datetime('now');

SELECT id, expires_at
FROM comment_moderation_audit
WHERE expires_at <= datetime('now')
ORDER BY expires_at, id
LIMIT 500;
