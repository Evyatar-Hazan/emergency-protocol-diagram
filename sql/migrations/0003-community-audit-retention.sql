DROP INDEX IF EXISTS idx_comment_moderation_audit_comment_id;
ALTER TABLE comment_reports ADD COLUMN expires_at TEXT;
CREATE INDEX idx_comment_reports_expires_at ON comment_reports(expires_at);

ALTER TABLE comment_moderation_audit RENAME TO comment_moderation_audit_legacy;

CREATE TABLE comment_moderation_audit (
  id TEXT PRIMARY KEY,
  comment_id TEXT,
  actor_id TEXT,
  action TEXT NOT NULL CHECK (
    action IN ('mark_reviewed', 'hide', 'restore', 'dismiss_reports')
  ),
  reason TEXT NOT NULL CHECK (
    reason IN ('community_guidelines', 'potentially_unsafe', 'misleading', 'spam', 'harassment', 'report_unsubstantiated')
  ),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL DEFAULT (datetime('now', '+90 days')),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE SET NULL,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO comment_moderation_audit
  (id, comment_id, actor_id, action, reason, created_at, expires_at)
SELECT
  id, comment_id, actor_id, action, reason, created_at,
  datetime(created_at, '+90 days')
FROM comment_moderation_audit_legacy;

DROP TABLE comment_moderation_audit_legacy;

CREATE INDEX idx_comment_moderation_audit_comment_id
  ON comment_moderation_audit(comment_id);
CREATE INDEX idx_comment_moderation_audit_expires_at
  ON comment_moderation_audit(expires_at);

CREATE TRIGGER scrub_moderation_audit_before_comment_delete
BEFORE DELETE ON comments
BEGIN
  UPDATE comment_moderation_audit
  SET comment_id = NULL,
      actor_id = NULL,
      expires_at = datetime('now', '+90 days')
  WHERE comment_id = OLD.id;
END;

CREATE TRIGGER scrub_moderation_audit_before_actor_delete
BEFORE DELETE ON users
BEGIN
  UPDATE comment_moderation_audit
  SET comment_id = NULL,
      actor_id = NULL,
      expires_at = datetime('now', '+90 days')
  WHERE actor_id = OLD.id;
END;

CREATE TABLE community_moderation_maintenance_log (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL CHECK (operation IN ('purge')),
  status TEXT NOT NULL CHECK (status IN ('completed')),
  preview_fingerprint TEXT NOT NULL,
  eligible_count INTEGER NOT NULL CHECK (eligible_count >= 0),
  selected_count INTEGER NOT NULL CHECK (selected_count BETWEEN 0 AND 500),
  affected_count INTEGER NOT NULL CHECK (affected_count BETWEEN 0 AND selected_count),
  backup_sha256 TEXT NOT NULL,
  executed_at TEXT NOT NULL,
  expires_at TEXT NOT NULL DEFAULT (datetime('now', '+90 days'))
);

CREATE INDEX idx_community_moderation_maintenance_log_expires_at
  ON community_moderation_maintenance_log(expires_at);
