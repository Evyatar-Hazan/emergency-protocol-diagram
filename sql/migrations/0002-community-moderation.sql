ALTER TABLE comments ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'community_unreviewed'
  CHECK (moderation_status IN ('community_unreviewed', 'moderation_reviewed'));
ALTER TABLE comments ADD COLUMN visibility_status TEXT NOT NULL DEFAULT 'visible'
  CHECK (visibility_status IN ('visible', 'hidden'));
ALTER TABLE comments ADD COLUMN moderated_by TEXT
  REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE comments ADD COLUMN moderated_at TEXT;
ALTER TABLE comments ADD COLUMN moderation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX IF NOT EXISTS idx_comments_visibility_status ON comments(visibility_status);

CREATE TABLE IF NOT EXISTS comment_reports (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (
    reason IN ('potentially_unsafe', 'misleading', 'spam', 'harassment', 'other_policy')
  ),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'dismissed', 'actioned')),
  resolved_by TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(comment_id, reporter_id, reason)
);

CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON comment_reports(comment_id);

CREATE TABLE IF NOT EXISTS comment_moderation_audit (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (
    action IN ('mark_reviewed', 'hide', 'restore', 'dismiss_reports')
  ),
  reason TEXT NOT NULL CHECK (
    reason IN ('community_guidelines', 'potentially_unsafe', 'misleading', 'spam', 'harassment', 'report_unsubstantiated')
  ),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_comment_moderation_audit_comment_id
  ON comment_moderation_audit(comment_id);
