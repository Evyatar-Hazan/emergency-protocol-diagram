CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  google_id TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  parent_comment_id TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'community_unreviewed'
    CHECK (moderation_status IN ('community_unreviewed', 'moderation_reviewed')),
  visibility_status TEXT NOT NULL DEFAULT 'visible'
    CHECK (visibility_status IN ('visible', 'hidden')),
  moderated_by TEXT,
  moderated_at TEXT,
  moderation_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_node_id ON comments(node_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX IF NOT EXISTS idx_comments_visibility_status ON comments(visibility_status);

CREATE TABLE IF NOT EXISTS comment_likes (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

CREATE TABLE IF NOT EXISTS comment_views (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  viewer_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  UNIQUE(comment_id, viewer_key)
);

CREATE INDEX IF NOT EXISTS idx_comment_views_comment_id ON comment_views(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_views_viewer_key ON comment_views(viewer_key);

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
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(comment_id, reporter_id, reason)
);

CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_expires_at ON comment_reports(expires_at);

CREATE TABLE IF NOT EXISTS comment_moderation_audit (
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

CREATE INDEX IF NOT EXISTS idx_comment_moderation_audit_comment_id
  ON comment_moderation_audit(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_moderation_audit_expires_at
  ON comment_moderation_audit(expires_at);

CREATE TRIGGER IF NOT EXISTS scrub_moderation_audit_before_comment_delete
BEFORE DELETE ON comments
BEGIN
  UPDATE comment_moderation_audit
  SET comment_id = NULL,
      actor_id = NULL,
      expires_at = datetime('now', '+90 days')
  WHERE comment_id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS scrub_moderation_audit_before_actor_delete
BEFORE DELETE ON users
BEGIN
  UPDATE comment_moderation_audit
  SET comment_id = NULL,
      actor_id = NULL,
      expires_at = datetime('now', '+90 days')
  WHERE actor_id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS community_moderation_maintenance_log (
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

CREATE INDEX IF NOT EXISTS idx_community_moderation_maintenance_log_expires_at
  ON community_moderation_maintenance_log(expires_at);
