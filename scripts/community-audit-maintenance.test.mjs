import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  BACKUP_RETENTION_DAYS,
  PURGE_BATCH_LIMIT,
  RUN_LOG_RETENTION_DAYS,
  createEncryptedBackup,
  createPurgePreview,
  executeApprovedPurge,
  inspectExpiredBackups,
  pruneExpiredBackups,
} from './community-audit-maintenance.mjs';

const keyValue = Buffer.alloc(32, 7).toString('base64');
const now = '2026-10-05T12:00:00.000Z';

function createFixture() {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'community-audit-maintenance-'));
  const databasePath = path.join(directory, 'community.db');
  const backupDirectory = path.join(directory, 'backups');
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE comment_moderation_audit (
      id TEXT PRIMARY KEY,
      comment_id TEXT,
      actor_id TEXT,
      action TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE comment_reports (
      id TEXT PRIMARY KEY,
      comment_id TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT
    );
    CREATE TABLE community_moderation_maintenance_log (
      id TEXT PRIMARY KEY,
      operation TEXT NOT NULL CHECK (operation IN ('purge')),
      status TEXT NOT NULL CHECK (status IN ('completed')),
      preview_fingerprint TEXT NOT NULL,
      eligible_count INTEGER NOT NULL,
      selected_count INTEGER NOT NULL CHECK (selected_count BETWEEN 0 AND 500),
      affected_count INTEGER NOT NULL CHECK (affected_count BETWEEN 0 AND selected_count),
      backup_sha256 TEXT NOT NULL,
      executed_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);
  const insert = database.prepare(`
    INSERT INTO comment_moderation_audit
      (id, comment_id, actor_id, action, reason, created_at, expires_at)
    VALUES (?, NULL, NULL, 'hide', 'spam', '2025-01-01T00:00:00.000Z', '2025-04-01T00:00:00.000Z')
  `);
  database.exec('BEGIN');
  for (let index = 1; index <= 500; index += 1) insert.run(`raw-audit-${String(index).padStart(3, '0')}`);
  database.exec(`
    INSERT INTO comment_reports VALUES
      ('raw-report-001', 'raw-comment-001', 'raw-reporter-001', 'misleading', 'actioned',
       '2024-12-01T00:00:00.000Z', '2025-03-01T00:00:00.000Z');
    INSERT INTO comment_moderation_audit
      (id, comment_id, actor_id, action, reason, created_at, expires_at)
    VALUES ('future-audit', NULL, NULL, 'restore', 'community_guidelines',
      '2099-01-01T00:00:00.000Z', '2099-04-01T00:00:00.000Z');
    COMMIT;
  `);
  database.close();
  return { directory, databasePath, backupDirectory };
}

function countRows(databasePath, table) {
  const database = new DatabaseSync(databasePath);
  try {
    return Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count);
  } finally {
    database.close();
  }
}

test('preview is read-only, bounded, and exposes only pseudonymous row identifiers', () => {
  const fixture = createFixture();
  try {
    const before = countRows(fixture.databasePath, 'comment_moderation_audit');
    const preview = createPurgePreview({ databasePath: fixture.databasePath, now, keyValue });

    assert.equal(preview.eligibleCount, 501);
    assert.equal(preview.selectedCount, PURGE_BATCH_LIMIT);
    assert.equal(preview.pseudonymousIds.length, PURGE_BATCH_LIMIT);
    assert.ok(preview.pseudonymousIds.every((id) => /^audit-[a-f0-9]{16}$/.test(id)));
    assert.doesNotMatch(JSON.stringify(preview), /raw-audit|future-audit/);
    assert.equal(countRows(fixture.databasePath, 'comment_moderation_audit'), before);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('encrypted backup is restricted, seven-day limited, and bound to the approved preview', () => {
  const fixture = createFixture();
  try {
    const preview = createPurgePreview({ databasePath: fixture.databasePath, now, keyValue });
    assert.throws(
      () => createEncryptedBackup({
        databasePath: fixture.databasePath,
        backupDirectory: fixture.backupDirectory,
        approvalFingerprint: '00'.repeat(32),
        now,
        keyValue,
      }),
      /approved preview no longer matches/,
    );

    const backup = createEncryptedBackup({
      databasePath: fixture.databasePath,
      backupDirectory: fixture.backupDirectory,
      approvalFingerprint: preview.approvalFingerprint,
      now,
      keyValue,
    });
    const serialized = readFileSync(backup.backupPath, 'utf8');
    assert.equal(BACKUP_RETENTION_DAYS, 7);
    assert.equal(backup.expiresAt, '2026-10-12T12:00:00.000Z');
    assert.equal(backup.selectedCount, PURGE_BATCH_LIMIT);
    assert.equal(statSync(backup.backupPath).mode & 0o777, 0o600);
    assert.doesNotMatch(serialized, /raw-audit|raw-report|raw-comment|raw-reporter|comment_id|actor_id/);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('purge requires exact confirmation and backup, deletes at most 500, and writes a 90-day minimal log', () => {
  const fixture = createFixture();
  try {
    const preview = createPurgePreview({ databasePath: fixture.databasePath, now, keyValue });
    const backup = createEncryptedBackup({
      databasePath: fixture.databasePath,
      backupDirectory: fixture.backupDirectory,
      approvalFingerprint: preview.approvalFingerprint,
      now,
      keyValue,
    });

    assert.throws(
      () => executeApprovedPurge({
        databasePath: fixture.databasePath,
        backupPath: backup.backupPath,
        confirmation: 'PURGE wrong',
        now,
        keyValue,
      }),
      /confirmation does not match/,
    );
    assert.equal(countRows(fixture.databasePath, 'comment_moderation_audit'), 501);
    assert.equal(countRows(fixture.databasePath, 'comment_reports'), 1);

    const result = executeApprovedPurge({
      databasePath: fixture.databasePath,
      backupPath: backup.backupPath,
      confirmation: `PURGE ${preview.approvalFingerprint}`,
      now,
      keyValue,
    });
    assert.equal(result.affectedCount, PURGE_BATCH_LIMIT);
    assert.equal(result.logExpiresAt, '2027-01-03T12:00:00.000Z');
    assert.equal(RUN_LOG_RETENTION_DAYS, 90);
    assert.equal(countRows(fixture.databasePath, 'comment_moderation_audit'), 2);
    assert.equal(countRows(fixture.databasePath, 'comment_reports'), 0);

    const database = new DatabaseSync(fixture.databasePath);
    const log = database.prepare('SELECT * FROM community_moderation_maintenance_log').get();
    const remainingExpired = database.prepare(
      'SELECT COUNT(*) AS count FROM comment_moderation_audit WHERE expires_at <= ?',
    ).get(now);
    database.close();
    assert.equal(Number(remainingExpired.count), 1);
    assert.equal(log.eligible_count, 501);
    assert.equal(log.selected_count, PURGE_BATCH_LIMIT);
    assert.equal(log.affected_count, PURGE_BATCH_LIMIT);
    assert.equal(log.expires_at, '2027-01-03T12:00:00.000Z');
    assert.ok(!Object.hasOwn(log, 'content'));
    assert.ok(!Object.hasOwn(log, 'comment_id'));
    assert.ok(!Object.hasOwn(log, 'actor_id'));
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('expired backups are previewed before explicit pruning and cannot authorize a purge', () => {
  const fixture = createFixture();
  try {
    const backupNow = '2026-09-01T00:00:00.000Z';
    const preview = createPurgePreview({ databasePath: fixture.databasePath, now: backupNow, keyValue });
    const backup = createEncryptedBackup({
      databasePath: fixture.databasePath,
      backupDirectory: fixture.backupDirectory,
      approvalFingerprint: preview.approvalFingerprint,
      now: backupNow,
      keyValue,
    });
    const afterExpiry = '2026-09-09T00:00:00.000Z';
    assert.throws(
      () => executeApprovedPurge({
        databasePath: fixture.databasePath,
        backupPath: backup.backupPath,
        confirmation: `PURGE ${preview.approvalFingerprint}`,
        now: afterExpiry,
        keyValue,
      }),
      /seven-day recovery window/,
    );
    assert.deepEqual(inspectExpiredBackups({ backupDirectory: fixture.backupDirectory, now: afterExpiry }), [backup.backupPath]);
    assert.deepEqual(
      pruneExpiredBackups({ backupDirectory: fixture.backupDirectory, now: afterExpiry }),
      { expiredCount: 1, deletedCount: 0 },
    );
    assert.deepEqual(
      pruneExpiredBackups({
        backupDirectory: fixture.backupDirectory,
        confirmation: 'PRUNE EXPIRED COMMUNITY AUDIT BACKUPS',
        now: afterExpiry,
      }),
      { expiredCount: 1, deletedCount: 1 },
    );
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('database changes after backup invalidate approval without deleting or logging', () => {
  const fixture = createFixture();
  try {
    const preview = createPurgePreview({ databasePath: fixture.databasePath, now, keyValue });
    const backup = createEncryptedBackup({
      databasePath: fixture.databasePath,
      backupDirectory: fixture.backupDirectory,
      approvalFingerprint: preview.approvalFingerprint,
      now,
      keyValue,
    });
    const database = new DatabaseSync(fixture.databasePath);
    database.prepare(`
      INSERT INTO comment_moderation_audit
        (id, comment_id, actor_id, action, reason, created_at, expires_at)
      VALUES ('changed-after-backup', NULL, NULL, 'hide', 'spam',
        '2024-01-01T00:00:00.000Z', '2024-04-01T00:00:00.000Z')
    `).run();
    database.close();

    const before = countRows(fixture.databasePath, 'comment_moderation_audit');
    assert.throws(
      () => executeApprovedPurge({
        databasePath: fixture.databasePath,
        backupPath: backup.backupPath,
        confirmation: `PURGE ${preview.approvalFingerprint}`,
        now,
        keyValue,
      }),
      /database state changed after backup/,
    );
    assert.equal(countRows(fixture.databasePath, 'comment_moderation_audit'), before);
    assert.equal(countRows(fixture.databasePath, 'community_moderation_maintenance_log'), 0);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});
