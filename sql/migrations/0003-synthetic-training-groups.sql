-- Local/test-only schema for Jarvis #62. This migration grants no role and creates no user.
CREATE TABLE IF NOT EXISTS training_roles (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('training_admin', 'instructor')),
  scope TEXT NOT NULL CHECK (scope = 'synthetic_only'),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  owner_id TEXT NOT NULL,
  participant_count INTEGER NOT NULL CHECK (participant_count BETWEEN 1 AND 200),
  is_synthetic INTEGER NOT NULL DEFAULT 1 CHECK (is_synthetic = 1),
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_training_groups_owner ON training_groups(owner_id);

CREATE TABLE IF NOT EXISTS training_assignments (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL CHECK (scenario_id = 'SCN-01'),
  scenario_version TEXT NOT NULL CHECK (scenario_version = '1'),
  rubric_id TEXT NOT NULL CHECK (rubric_id = 'RUBRIC-SCN-01-DRAFT'),
  rubric_version TEXT NOT NULL CHECK (rubric_version = '0.1.0-pending-review'),
  status TEXT NOT NULL CHECK (status IN ('assigned', 'archived')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES training_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_training_assignments_group ON training_assignments(group_id);

-- Only aggregates are persisted. There is intentionally no learner/result table.
CREATE TABLE IF NOT EXISTS training_assignment_aggregates (
  assignment_id TEXT PRIMARY KEY,
  completed_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
  needs_review_count INTEGER NOT NULL DEFAULT 0 CHECK (needs_review_count >= 0),
  developing_count INTEGER NOT NULL DEFAULT 0 CHECK (developing_count >= 0),
  observed_count INTEGER NOT NULL DEFAULT 0 CHECK (observed_count >= 0),
  unscored_count INTEGER NOT NULL DEFAULT 0 CHECK (unscored_count >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assignment_id) REFERENCES training_assignments(id) ON DELETE CASCADE,
  CHECK (
    completed_count = needs_review_count + developing_count + observed_count + unscored_count
  )
);
