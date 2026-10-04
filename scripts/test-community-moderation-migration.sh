#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fixture="$repo_root/sql/test-fixtures/0001-community-base.sql"
migration="$repo_root/sql/migrations/0002-community-moderation.sql"
current_schema="$repo_root/sql/d1-community-schema.sql"
work_dir="$(mktemp -d "$repo_root/.tmp-community-migration.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT

db="$work_dir/community.db"
rollback_db="$work_dir/rollback.db"
fresh_db="$work_dir/fresh.db"

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

sqlite3 "$rollback_db" "PRAGMA foreign_keys=ON; BEGIN;" ".read $migration" "ROLLBACK;"
assert_eq "0" "$(sqlite3 "$rollback_db" "SELECT COUNT(*) FROM pragma_table_info('comments') WHERE name='moderation_status';")" "transaction rollback removes added columns"
assert_eq "0" "$(sqlite3 "$rollback_db" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('comment_reports','comment_moderation_audit');")" "transaction rollback removes added tables"
assert_eq "2" "$(sqlite3 "$rollback_db" "SELECT COUNT(*) FROM comments;")" "transaction rollback preserves synthetic comments"

sqlite3 "$db" "PRAGMA foreign_keys=ON;" ".read $migration"
sqlite3 "$fresh_db" "PRAGMA foreign_keys=ON;" ".read $current_schema"
assert_eq "5" "$(sqlite3 "$db" "SELECT COUNT(*) FROM pragma_table_info('comments') WHERE name IN ('moderation_status','visibility_status','moderated_by','moderated_at','moderation_reason');")" "migration adds all moderation columns"
assert_eq "2" "$(sqlite3 "$db" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('comment_reports','comment_moderation_audit');")" "migration adds moderation tables"
assert_eq "2" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comments WHERE moderation_status='community_unreviewed' AND visibility_status='visible';")" "existing comments receive safe defaults"
assert_eq "1" "$(sqlite3 "$db" "SELECT COUNT(*) FROM pragma_foreign_key_list('comments') WHERE \"from\"='moderated_by' AND \"table\"='users' AND on_delete='SET NULL';")" "migrated moderated_by matches fresh-schema foreign key"

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

sqlite3 "$db" "PRAGMA foreign_keys=ON; INSERT INTO comment_reports (id,comment_id,reporter_id,reason) VALUES ('report-parent','parent','reporter','misleading'); INSERT INTO comment_moderation_audit (id,comment_id,actor_id,action,reason) VALUES ('audit-parent','parent','admin','hide','misleading'); DELETE FROM comments WHERE id='parent';"
assert_eq "0" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comments WHERE id IN ('parent','child');")" "comment deletion cascades to child comments"
assert_eq "0" "$(sqlite3 "$db" "SELECT (SELECT COUNT(*) FROM comment_likes)+(SELECT COUNT(*) FROM comment_views)+(SELECT COUNT(*) FROM comment_reports)+(SELECT COUNT(*) FROM comment_moderation_audit);")" "comment deletion cascades to dependent records"

sqlite3 "$db" "PRAGMA foreign_keys=ON; INSERT INTO comments (id,node_id,content,author_id) VALUES ('reporter-case','node-2','Synthetic reporter case','author'); INSERT INTO comment_reports (id,comment_id,reporter_id,reason) VALUES ('report-reporter','reporter-case','reporter','spam'); DELETE FROM users WHERE id='reporter';"
assert_eq "0" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comment_reports WHERE id='report-reporter';")" "reporter deletion cascades to reports"
assert_eq "1" "$(sqlite3 "$db" "SELECT COUNT(*) FROM comments WHERE id='reporter-case';")" "reporter deletion does not delete reported comment"

sqlite3 "$db" "PRAGMA foreign_keys=ON; UPDATE comments SET moderated_by='admin' WHERE id='reporter-case'; INSERT INTO comment_reports (id,comment_id,reporter_id,reason,status,resolved_by,resolved_at) VALUES ('report-admin','reporter-case','author','harassment','actioned','admin',datetime('now')); INSERT INTO comment_moderation_audit (id,comment_id,actor_id,action,reason) VALUES ('audit-admin','reporter-case','admin','mark_reviewed','community_guidelines');"
if sqlite3 "$db" "PRAGMA foreign_keys=ON; DELETE FROM users WHERE id='admin';" >"$work_dir/restrict.log" 2>&1; then
  echo "FAIL: audit actor deletion should be restricted" >&2
  exit 1
fi
echo "PASS: audit actor deletion is restricted"
sqlite3 "$db" "PRAGMA foreign_keys=ON; DELETE FROM comment_moderation_audit WHERE id='audit-admin'; DELETE FROM users WHERE id='admin';"
assert_eq "2" "$(sqlite3 "$db" "SELECT (SELECT COUNT(*) FROM comments WHERE id='reporter-case' AND moderated_by IS NULL)+(SELECT COUNT(*) FROM comment_reports WHERE id='report-admin' AND resolved_by IS NULL);")" "admin deletion nulls moderation references after audit removal"

if sqlite3 "$db" ".read $migration" >"$work_dir/reapply.log" 2>&1; then
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

echo "Community moderation migration smoke test passed."
