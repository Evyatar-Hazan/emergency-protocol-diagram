-- Read-only preflight for the next bounded maintenance-log retention batch.
SELECT
  COUNT(*) AS eligible_count,
  MIN(expires_at) AS oldest_expiry
FROM community_moderation_maintenance_log
WHERE expires_at <= datetime('now');

SELECT id, expires_at
FROM community_moderation_maintenance_log
WHERE expires_at <= datetime('now')
ORDER BY expires_at, id
LIMIT 500;
