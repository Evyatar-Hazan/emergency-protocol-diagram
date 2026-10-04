-- Explicit bounded maintenance operation. Run the preview and create a backup
-- before using this file against any non-synthetic database. This file is not scheduled.
DELETE FROM comment_moderation_audit
WHERE id IN (
  SELECT id
  FROM comment_moderation_audit
  WHERE expires_at <= datetime('now')
  ORDER BY expires_at, id
  LIMIT 500
);
