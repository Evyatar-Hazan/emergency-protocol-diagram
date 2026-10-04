#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fixture="$repo_root/sql/test-fixtures/0001-community-base.sql"
moderation_migration="$repo_root/sql/migrations/0002-community-moderation.sql"
retention_migration="$repo_root/sql/migrations/0003-community-audit-retention.sql"
purge_sql="$repo_root/sql/maintenance/purge-expired-community-audit.sql"
purge_preview_sql="$repo_root/sql/maintenance/preview-expired-community-audit.sql"
current_schema="$repo_root/sql/d1-community-schema.sql"
work_dir="$(mktemp -d "$repo_root/.tmp-community-migration.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT

db="$work_dir/community.db"
rollback_db="$work_dir/rollback.db"
retention_rollback_db="$work_dir/retention-rollback.db"
fresh_db="$work_dir/fresh.db"
purge_db="$work_dir/purge.db"

assert_eq() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL: $label (expected=$expected actual=$actual)" >&2
    exit 1
  fi
  echo "PASS: $label"
}

sqlite3 "$db" ".read $fixture"
sqlite3 "$db" "PRAGMA foreign_keys=ON; INSERT INTO users (id,email,google_id,name,is_admin) VALUES ('author','author@example.invalid','g-author','Author',0),('reporter','reporter@example.invalid','g-reporter','Reporter',0),('admin','admin@example.invalid','g-admin','Admin',1); INSERT INTO comments (id,node_id,content,author_id) VALUES ('parent','node-1','Synthetic parent','author'); INSERT INTO comments (id,node_id,content,author_id,parent_comment_id) VALUES ('child','node-1','Synthetic child','author','parent'); INSERT INTO comment_likes (id,comment_id,user_id) VALUES ('like-1','parent','reporter'); INSERT INTO comment_views (id,comment_id,viewer_key) VALUES ('view-1','parent','synthetic-viewer');"
cp "$db" "$rollback_db"

sqlite3 "$rollback_db" "PRAGMA foreign_keys=ON; BEGIN;" ".read $moderation_migration" ".read $retention_migration" "ROLLBACK;"
assert_eq "0" "$(sqlite3 "$rollback_db" "SELECT COUNT(*) FROM pragma_table_info('comments') WHERE name='moderation_status';")" "transaction rollback removes added columns"
assert_eq "0" "$(sqlite3 "$rollback_db" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('comment_reports','comment_moderation_audit');")" "transaction rollback removes added tables"
assert_eq "2" "$(sqlite3 "$rollback_db" "SELECT COUNT(*) FROM comments;")" "transaction rollback preserves synthetic comments"

sqlite3 "$db" "PRAGMA foreign_keys=ON;" ".read $moderation_migration"
sqlite3 "$db" "PRAGMA foreign_keys=ON; INSERT INTO comment_moderation_audit (id,comment_id,actor_id,action,reason,created_at) VALUES ('audit-legacy','parent','admin','hide','misleading','2026-01-01 00:00:00');"
cp "$db" "$retention_rollback_db"

sqlite3 "$retention_rollback_db" "PRAGMA foreign_keys=ON; BEGIN;" ".read $retention_migration" "ROLLBACK;"
assert_eq "0" "$(sqlite3 "$retention_rollback_db" "SELECT COUNT(*) FROM pragma_table_info('comment_moderation_audit') WHERE name='expires_at';")" "retention rollback restores prior audit shape"
assert_eq "1" "$(sqlite3 "$retention_rollback_db" "SELECT COUNT(*) FROM comment_moderation_audit WHERE id='audit-legacy' AND comment_id='parent' AND actor_id='admin';")" "retention rollback preserves prior audit rows"

sqlite3 "$db" "PRAGMA foreign_keys=ON;" ".read $retention_migration"
sqlite3 "$fresh_db" "PRAGMA foreign_keys=ON;" ".read $current_schema"
assert_eq "5" "$(sqlite3 "$db" "SELECT COUNT(*) FROM pragma_table_info('comments') WHERE name IN ('moderation_status','visibility_status','moderated_by','moderated_at','moderation_reason');")" "migration adds all moderation columns"
assert_eq "2" "$(sqlite3 "$db" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('comment_reports','comment_moderation_audit');")" "migration adds moderation tables"
assert_eq "2" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comments WHERE moderation_status='community_unreviewed' AND visibility_status='visible';")" "existing comments receive safe defaults"
assert_eq "1" "$(sqlite3 "$db" "SELECT COUNT(*) FROM pragma_foreign_key_list('comments') WHERE \"from\"='moderated_by' AND \"table\"='users' AND on_delete='SET NULL';")" "migrated moderated_by matches fresh-schema foreign key"
assert_eq "1" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comment_moderation_audit WHERE id='audit-legacy' AND expires_at='2026-04-01 00:00:00';")" "existing audit receives a 90-day expiry without content backfill"

for table in comments comment_reports comment_moderation_audit; do
  migrated_columns="$(sqlite3 "$db" "SELECT name||'|'||type||'|'||\"notnull\"||'|'||COALESCE(dflt_value,'')||'|'||pk FROM pragma_table_info('$table') ORDER BY name;")"
  fresh_columns="$(sqlite3 "$fresh_db" "SELECT name||'|'||type||'|'||\"notnull\"||'|'||COALESCE(dflt_value,'')||'|'||pk FROM pragma_table_info('$table') ORDER BY name;")"
  assert_eq "$fresh_columns" "$migrated_columns" "$table columns match fresh schema"

  migrated_fks="$(sqlite3 "$db" "SELECT \"from\"||'->'||\"table\"||'.'||\"to\"||':'||on_delete FROM pragma_foreign_key_list('$table') ORDER BY \"from\";")"
  fresh_fks="$(sqlite3 "$fresh_db" "SELECT \"from\"||'->'||\"table\"||'.'||\"to\"||':'||on_delete FROM pragma_foreign_key_list('$table') ORDER BY \"from\";")"
  assert_eq "$fresh_fks" "$migrated_fks" "$table foreign keys and cascades match fresh schema"

  migrated_indexes="$(sqlite3 "$db" "SELECT name FROM pragma_index_list('$table') WHERE origin='c' ORDER BY name;")"
  fresh_indexes="$(sqlite3 "$fresh_db" "SELECT name FROM pragma_index_list('$table') WHERE origin='c' ORDER BY name;")"
  assert_eq "$fresh_indexes" "$migrated_indexes" "$table explicit indexes match fresh schema"
done

migrated_triggers="$(sqlite3 "$db" "SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'scrub_moderation_audit_%' ORDER BY name;")"
fresh_triggers="$(sqlite3 "$fresh_db" "SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'scrub_moderation_audit_%' ORDER BY name;")"
assert_eq "$fresh_triggers" "$migrated_triggers" "retention scrubbing triggers match fresh schema"

sqlite3 "$db" "PRAGMA foreign_keys=ON; INSERT INTO comment_reports (id,comment_id,reporter_id,reason) VALUES ('report-parent','parent','reporter','misleading'); INSERT INTO comment_moderation_audit (id,comment_id,actor_id,action,reason) VALUES ('audit-parent','parent','admin','hide','misleading'); DELETE FROM comments WHERE id='parent';"
assert_eq "0" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comments WHERE id IN ('parent','child');")" "comment deletion cascades to child comments"
assert_eq "0" "$(sqlite3 "$db" "SELECT (SELECT COUNT(*) FROM comment_likes)+(SELECT COUNT(*) FROM comment_views)+(SELECT COUNT(*) FROM comment_reports);")" "comment deletion cascades to non-audit dependent records"
assert_eq "2" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comment_moderation_audit WHERE id IN ('audit-legacy','audit-parent') AND comment_id IS NULL AND actor_id IS NULL;")" "comment deletion retains minimized audit without direct references"
assert_eq "2" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comment_moderation_audit WHERE id IN ('audit-legacy','audit-parent') AND julianday(expires_at)-julianday('now') BETWEEN 89.99 AND 90.01;")" "comment deletion starts a fresh 90-day minimized-retention window"

sqlite3 "$db" "PRAGMA foreign_keys=ON; INSERT INTO comments (id,node_id,content,author_id) VALUES ('reporter-case','node-2','Synthetic reporter case','author'); INSERT INTO comment_reports (id,comment_id,reporter_id,reason) VALUES ('report-reporter','reporter-case','reporter','spam'); DELETE FROM users WHERE id='reporter';"
assert_eq "0" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comment_reports WHERE id='report-reporter';")" "reporter deletion cascades to reports"
assert_eq "1" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comments WHERE id='reporter-case';")" "reporter deletion does not delete reported comment"

sqlite3 "$db" "PRAGMA foreign_keys=ON; UPDATE comments SET moderated_by='admin' WHERE id='reporter-case'; INSERT INTO comment_reports (id,comment_id,reporter_id,reason,status,resolved_by,resolved_at) VALUES ('report-admin','reporter-case','author','harassment','actioned','admin',datetime('now')); INSERT INTO comment_moderation_audit (id,comment_id,actor_id,action,reason) VALUES ('audit-admin','reporter-case','admin','mark_reviewed','community_guidelines'); DELETE FROM users WHERE id='admin';"
assert_eq "1" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comment_moderation_audit WHERE id='audit-admin' AND comment_id IS NULL AND actor_id IS NULL;")" "actor deletion retains minimized audit without direct references"
assert_eq "1" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comment_moderation_audit WHERE id='audit-admin' AND julianday(expires_at)-julianday('now') BETWEEN 89.99 AND 90.01;")" "actor deletion starts a fresh 90-day minimized-retention window"
assert_eq "2" "$(sqlite3 "$db" "SELECT (SELECT COUNT(*) FROM comments WHERE id='reporter-case' AND moderated_by IS NULL)+(SELECT COUNT(*) FROM comment_reports WHERE id='report-admin' AND resolved_by IS NULL);")" "actor deletion nulls operational moderation references"
assert_eq "90.0" "$(sqlite3 "$db" "SELECT printf('%.1f', julianday(expires_at)-julianday(created_at)) FROM comment_moderation_audit WHERE id='audit-admin';")" "new audit defaults to exactly 90 days"

cp "$db" "$purge_db"
sqlite3 "$purge_db" "WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n<501) INSERT INTO comment_moderation_audit (id,action,reason,created_at,expires_at) SELECT printf('audit-expired-%03d',n),'hide','spam','2025-01-01 00:00:00','2025-04-01 00:00:00' FROM seq; INSERT INTO comment_moderation_audit (id,action,reason,created_at,expires_at) VALUES ('audit-future','restore','community_guidelines','2099-01-01 00:00:00','2099-04-01 00:00:00');"
preview_output="$(sqlite3 "$purge_db" ".read $purge_preview_sql")"
preview_count="${preview_output%%|*}"
assert_eq "501" "$preview_count" "read-only purge preview counts all eligible synthetic audit rows"
sqlite3 "$purge_db" ".read $purge_sql"
assert_eq "1" "$(sqlite3 "$purge_db" "SELECT COUNT(*) FROM comment_moderation_audit WHERE id LIKE 'audit-expired-%';")" "bounded purge removes at most 500 eligible audit rows"
assert_eq "1" "$(sqlite3 "$purge_db" "SELECT COUNT(*) FROM comment_moderation_audit WHERE id='audit-future';")" "explicit purge preserves non-expired synthetic audit"

if sqlite3 "$db" ".read $moderation_migration" >"$work_dir/reapply.log" 2>&1; then
  echo "FAIL: direct second apply unexpectedly succeeded" >&2
  exit 1
fi
reapply_error="$(<"$work_dir/reapply.log")"
if [[ "$reapply_error" != *"duplicate column name: moderation_status"* ]]; then
  echo "FAIL: direct second apply failed for an unexpected reason: $reapply_error" >&2
  exit 1
fi
assert_eq "1" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comments WHERE id='reporter-case';")" "failed direct reapply leaves migrated data intact"
echo "PASS: direct migration reapply is rejected with duplicate moderation_status; migration runner tracking is required"

echo "Community moderation migration and retention smoke test passed."
