-- Bounded maintenance-log expiry primitive. Direct execution is fail-closed.
CREATE TEMP TABLE IF NOT EXISTS approved_community_maintenance_log_purge (
  confirmation TEXT PRIMARY KEY CHECK (confirmation = 'PURGE LOGS APPROVED')
);

DELETE FROM community_moderation_maintenance_log
WHERE id IN (
  SELECT id
  FROM community_moderation_maintenance_log
  WHERE expires_at <= datetime('now')
  ORDER BY expires_at, id
  LIMIT 500
)
AND EXISTS (
  SELECT 1
  FROM approved_community_maintenance_log_purge
  WHERE confirmation = 'PURGE LOGS APPROVED'
);

DROP TABLE approved_community_maintenance_log_purge;
