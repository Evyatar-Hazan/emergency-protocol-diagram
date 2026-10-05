-- Read-only preflight for the next bounded purge batch.
SELECT
  COUNT(*) AS eligible_count,
  MIN(expires_at) AS oldest_expiry
FROM comment_moderation_audit
WHERE expires_at <= datetime('now');

SELECT
  (SELECT COUNT(*) FROM comment_moderation_audit WHERE expires_at <= datetime('now'))
  +
  (SELECT COUNT(*) FROM comment_reports
   WHERE status IN ('dismissed', 'actioned') AND expires_at <= datetime('now'))
  AS total_eligible_count;

SELECT record_kind, id, expires_at
FROM (
  SELECT 'audit' AS record_kind, id, expires_at
  FROM comment_moderation_audit
  WHERE expires_at <= datetime('now')
  UNION ALL
  SELECT 'report' AS record_kind, id, expires_at
  FROM comment_reports
  WHERE status IN ('dismissed', 'actioned') AND expires_at <= datetime('now')
)
ORDER BY expires_at, record_kind, id
LIMIT 500;
