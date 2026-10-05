import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { buildDailyModerationReport } from './community-moderation-daily-report.mjs';

function fixture() {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'community-daily-report-'));
  const databasePath = path.join(directory, 'community.db');
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT);
    CREATE TABLE comments (
      id TEXT PRIMARY KEY, content TEXT, moderation_status TEXT, visibility_status TEXT
    );
    CREATE TABLE comment_reports (
      id TEXT PRIMARY KEY, comment_id TEXT, reporter_id TEXT, reason TEXT, status TEXT, created_at TEXT
    );
    CREATE TABLE comment_moderation_audit (
      id TEXT PRIMARY KEY, comment_id TEXT, actor_id TEXT, action TEXT, reason TEXT,
      created_at TEXT, expires_at TEXT
    );
    CREATE TABLE community_moderation_maintenance_log (
      id TEXT PRIMARY KEY, status TEXT, affected_count INTEGER, executed_at TEXT
    );
    INSERT INTO users VALUES ('user-secret-id', 'private@example.invalid');
    INSERT INTO comments VALUES
      ('comment-secret-a', 'private community content', 'community_unreviewed', 'visible'),
      ('comment-secret-b', 'other private content', 'moderation_reviewed', 'hidden');
    INSERT INTO comment_reports VALUES
      ('report-secret-a', 'comment-secret-a', 'user-secret-id', 'spam', 'pending', '2026-10-05T10:00:00.000Z'),
      ('report-secret-b', 'comment-secret-b', 'user-secret-id', 'misleading', 'actioned', '2026-10-05T11:00:00.000Z'),
      ('report-old', 'comment-secret-a', 'user-secret-id', 'harassment', 'dismissed', '2026-10-03T11:00:00.000Z');
    INSERT INTO comment_moderation_audit VALUES
      ('audit-secret', 'comment-secret-b', 'owner-secret', 'hide', 'misleading',
       '2026-10-05T11:30:00.000Z', '2027-01-03T11:30:00.000Z');
    INSERT INTO community_moderation_maintenance_log VALUES
      ('run-secret', 'completed', 4, '2026-10-05T09:00:00.000Z');
  `);
  database.close();
  return { directory, databasePath };
}

test('daily report reads aggregates only and remains private/not configured for delivery', () => {
  const current = fixture();
  try {
    const report = buildDailyModerationReport({
      databasePath: current.databasePath,
      until: '2026-10-05T12:00:00.000Z',
    });
    assert.equal(report.scope, 'private_owner_only');
    assert.equal(report.deliveryStatus, 'not_configured');
    assert.deepEqual(report.reportCountsByStatus, { actioned: 1, pending: 1 });
    assert.deepEqual(report.reportCountsByReason, { misleading: 1, spam: 1 });
    assert.deepEqual(report.moderationActionCounts, { hide: 1 });
    assert.deepEqual(report.queue, { pendingReportCount: 1, oldestPendingHours: 2 });
    assert.deepEqual(report.maintenance, {
      completedPurgeCount: 1,
      affectedAuditRowCount: 4,
      errorCount: null,
      errorCollectionStatus: 'not_configured',
    });
    assert.deepEqual(report.privacy, {
      identifiersIncluded: false,
      contentIncluded: false,
      userTableRead: false,
    });
    assert.doesNotMatch(
      JSON.stringify(report),
      /private community content|other private content|private@example|user-secret|comment-secret|report-secret|owner-secret|audit-secret|run-secret/,
    );
  } finally {
    rmSync(current.directory, { recursive: true, force: true });
  }
});

test('daily report opens the database read-only', () => {
  const current = fixture();
  try {
    const before = new DatabaseSync(current.databasePath).prepare('SELECT total_changes() AS changes').get();
    const report = buildDailyModerationReport({
      databasePath: current.databasePath,
      until: '2026-10-05T12:00:00.000Z',
    });
    const database = new DatabaseSync(current.databasePath);
    const rows = database.prepare('SELECT COUNT(*) AS count FROM comment_reports').get();
    database.close();
    assert.equal(before.changes, 0);
    assert.equal(rows.count, 3);
    assert.equal(report.period.hours, 24);
  } finally {
    rmSync(current.directory, { recursive: true, force: true });
  }
});
