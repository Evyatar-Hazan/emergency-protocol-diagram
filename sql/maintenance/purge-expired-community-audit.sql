-- Low-level bounded maintenance primitive. Direct execution is fail-closed: the
-- caller must create and populate the TEMP approval table in the same connection.
-- Production operation must use the encrypted-backup controller instead.
CREATE TEMP TABLE IF NOT EXISTS approved_community_audit_purge (
  confirmation TEXT PRIMARY KEY CHECK (confirmation = 'PURGE APPROVED')
);

CREATE TEMP TABLE community_moderation_purge_batch AS
SELECT record_kind, id
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

DELETE FROM comment_moderation_audit
WHERE id IN (SELECT id FROM community_moderation_purge_batch WHERE record_kind = 'audit')
AND EXISTS (
  SELECT 1
  FROM approved_community_audit_purge
  WHERE confirmation = 'PURGE APPROVED'
);

DELETE FROM comment_reports
WHERE id IN (SELECT id FROM community_moderation_purge_batch WHERE record_kind = 'report')
AND EXISTS (
  SELECT 1
  FROM approved_community_audit_purge
  WHERE confirmation = 'PURGE APPROVED'
);

DROP TABLE community_moderation_purge_batch;
DROP TABLE approved_community_audit_purge;
