-- LOCAL TEST FIXTURE ONLY. All identities use the reserved .invalid domain.
INSERT OR IGNORE INTO users (id, email, google_id, name, is_admin)
VALUES ('synthetic-instructor-62', 'instructor-62@example.invalid', 'synthetic:62', 'מדריך סינתטי', 0);

INSERT OR REPLACE INTO training_roles (user_id, role, scope)
VALUES ('synthetic-instructor-62', 'instructor', 'synthetic_only');

INSERT OR REPLACE INTO training_groups
  (id, name, owner_id, participant_count, is_synthetic, created_at, updated_at)
VALUES
  ('synthetic-group-alpha', 'קבוצת תרגול אלפא', 'synthetic-instructor-62', 16, 1, datetime('now'), datetime('now')),
  ('synthetic-group-small', 'קבוצה קטנה לבדיקת חיסיון', 'synthetic-instructor-62', 6, 1, datetime('now'), datetime('now'));

INSERT OR REPLACE INTO training_assignments
  (id, group_id, scenario_id, scenario_version, rubric_id, rubric_version, status, created_by, created_at)
VALUES
  ('assignment-alpha-scn01', 'synthetic-group-alpha', 'SCN-01', '1', 'RUBRIC-SCN-01-DRAFT', '0.1.0-pending-review', 'assigned', 'synthetic-instructor-62', datetime('now')),
  ('assignment-small-scn01', 'synthetic-group-small', 'SCN-01', '1', 'RUBRIC-SCN-01-DRAFT', '0.1.0-pending-review', 'assigned', 'synthetic-instructor-62', datetime('now'));

INSERT OR REPLACE INTO training_assignment_aggregates
  (assignment_id, completed_count, needs_review_count, developing_count, observed_count, unscored_count)
VALUES
  ('assignment-alpha-scn01', 12, 2, 5, 5, 0),
  ('assignment-small-scn01', 4, 1, 2, 1, 0);
