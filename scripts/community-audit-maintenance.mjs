import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

export const PURGE_BATCH_LIMIT = 500;
export const BACKUP_RETENTION_DAYS = 7;
export const RUN_LOG_RETENTION_DAYS = 90;

const backupSuffix = '.community-audit-backup.json';
const keyEnvironmentVariable = 'COMMUNITY_AUDIT_BACKUP_KEY';

function parseIso(value, label) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.valueOf())) throw new TypeError(`${label} must be a valid ISO timestamp`);
  return date;
}

function isoAfter(date, days) {
  return new Date(date.valueOf() + days * 24 * 60 * 60 * 1000).toISOString();
}

function loadKey(value = process.env[keyEnvironmentVariable]) {
  if (!value) throw new Error(`${keyEnvironmentVariable} is required`);
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) throw new Error(`${keyEnvironmentVariable} must be a base64-encoded 32-byte key`);
  return key;
}

function domainHmac(key, domain, value) {
  return createHmac('sha256', key).update(`${domain}\0${value}`).digest('hex');
}

function canonicalRows(rows) {
  return rows.map((row) => ({
    record_kind: String(row.record_kind),
    id: String(row.id),
    comment_id: row.comment_id === null ? null : String(row.comment_id),
    actor_id: row.actor_id === null ? null : String(row.actor_id),
    action: row.action === null ? null : String(row.action),
    reason: String(row.reason),
    status: row.status === null ? null : String(row.status),
    created_at: String(row.created_at),
    expires_at: String(row.expires_at),
  }));
}

function fingerprintRows(key, rows) {
  return domainHmac(key, 'community-audit-purge-v1', JSON.stringify(canonicalRows(rows)));
}

function openDatabase(databasePath) {
  if (!databasePath || !existsSync(databasePath)) throw new Error('an existing local SQLite --db path is required');
  const database = new DatabaseSync(databasePath);
  database.exec('PRAGMA foreign_keys = ON');
  return database;
}

function eligibleRows(database, nowIso) {
  return database.prepare(`
    SELECT record_kind, id, comment_id, actor_id, action, reason, status, created_at, expires_at
    FROM (
      SELECT 'audit' AS record_kind, id, comment_id, actor_id, action, reason,
             NULL AS status, created_at, expires_at
      FROM comment_moderation_audit
      WHERE expires_at <= ?
      UNION ALL
      SELECT 'report' AS record_kind, id, comment_id, reporter_id AS actor_id,
             NULL AS action, reason, status, created_at, expires_at
      FROM comment_reports
      WHERE status IN ('dismissed', 'actioned') AND expires_at <= ?
    )
    ORDER BY expires_at, record_kind, id
    LIMIT ${PURGE_BATCH_LIMIT}
  `).all(nowIso, nowIso);
}

function eligibleCount(database, nowIso) {
  const row = database.prepare(`
    SELECT COUNT(*) AS count, MIN(expires_at) AS oldest_expiry
    FROM (
      SELECT expires_at FROM comment_moderation_audit WHERE expires_at <= ?
      UNION ALL
      SELECT expires_at FROM comment_reports
      WHERE status IN ('dismissed', 'actioned') AND expires_at <= ?
    )
  `).get(nowIso, nowIso);
  return { count: Number(row.count), oldestExpiry: row.oldest_expiry ?? null };
}

export function createPurgePreview({ databasePath, now = new Date().toISOString(), keyValue } = {}) {
  const key = loadKey(keyValue);
  const nowIso = parseIso(now, 'now').toISOString();
  const database = openDatabase(databasePath);
  try {
    const totals = eligibleCount(database, nowIso);
    const rows = eligibleRows(database, nowIso);
    return {
      generatedAt: nowIso,
      eligibleCount: totals.count,
      selectedCount: rows.length,
      oldestExpiry: totals.oldestExpiry,
      batchLimit: PURGE_BATCH_LIMIT,
      pseudonymousIds: rows.map((row) => `audit-${domainHmac(key, 'community-audit-id-v1', row.id).slice(0, 16)}`),
      approvalFingerprint: fingerprintRows(key, rows),
    };
  } finally {
    database.close();
  }
}

function backupAad(metadata) {
  return Buffer.from(JSON.stringify(metadata));
}

export function createEncryptedBackup({
  databasePath,
  backupDirectory,
  approvalFingerprint,
  now = new Date().toISOString(),
  keyValue,
} = {}) {
  if (!approvalFingerprint) throw new Error('approvalFingerprint is required');
  const key = loadKey(keyValue);
  const nowDate = parseIso(now, 'now');
  const nowIso = nowDate.toISOString();
  const database = openDatabase(databasePath);
  let rows;
  try {
    rows = canonicalRows(eligibleRows(database, nowIso));
  } finally {
    database.close();
  }
  if (!rows.length) throw new Error('no eligible audit rows are available for backup');
  const currentFingerprint = fingerprintRows(key, rows);
  const expected = Buffer.from(approvalFingerprint, 'hex');
  const actual = Buffer.from(currentFingerprint, 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('the approved preview no longer matches the current purge batch');
  }

  const runId = randomBytes(16).toString('hex');
  const metadata = {
    format: 'community-audit-backup-v1',
    runId,
    createdAt: nowIso,
    expiresAt: isoAfter(nowDate, BACKUP_RETENTION_DAYS),
    selectedCount: rows.length,
    approvalFingerprint: currentFingerprint,
  };
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(backupAad(metadata));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ rows }), 'utf8'), cipher.final()]);
  const envelope = {
    metadata,
    encryption: 'AES-256-GCM',
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
  const serialized = `${JSON.stringify(envelope, null, 2)}\n`;
  const backupSha256 = createHash('sha256').update(serialized).digest('hex');
  mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  const backupPath = path.join(backupDirectory, `${runId}${backupSuffix}`);
  writeFileSync(backupPath, serialized, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  return { backupPath, backupSha256, ...metadata };
}

function readBackup(backupPath, key) {
  const serialized = readFileSync(backupPath, 'utf8');
  const envelope = JSON.parse(serialized);
  if (envelope?.metadata?.format !== 'community-audit-backup-v1' || envelope.encryption !== 'AES-256-GCM') {
    throw new Error('unsupported backup envelope');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAAD(backupAad(envelope.metadata));
  decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
    decipher.final(),
  ]);
  const payload = JSON.parse(plaintext.toString('utf8'));
  return {
    envelope,
    rows: canonicalRows(payload.rows),
    backupSha256: createHash('sha256').update(serialized).digest('hex'),
  };
}

function ensureRunLogTable(database) {
  const found = database.prepare(`
    SELECT COUNT(*) AS count
    FROM sqlite_master
    WHERE type = 'table' AND name = 'community_moderation_maintenance_log'
  `).get();
  if (Number(found.count) !== 1) throw new Error('maintenance log migration is required before purge');
}

export function executeApprovedPurge({
  databasePath,
  backupPath,
  confirmation,
  now = new Date().toISOString(),
  keyValue,
} = {}) {
  const key = loadKey(keyValue);
  const nowDate = parseIso(now, 'now');
  const nowIso = nowDate.toISOString();
  const { envelope, rows: backedUpRows, backupSha256 } = readBackup(backupPath, key);
  parseIso(envelope.metadata.createdAt, 'backup createdAt');
  if (nowDate > parseIso(envelope.metadata.expiresAt, 'backup expiresAt')) {
    throw new Error('the encrypted backup has passed its seven-day recovery window');
  }
  if (backedUpRows.length > PURGE_BATCH_LIMIT) throw new Error('backup exceeds the purge batch limit');
  if (confirmation !== `PURGE ${envelope.metadata.approvalFingerprint}`) {
    throw new Error('explicit purge confirmation does not match the approved preview');
  }

  const database = openDatabase(databasePath);
  try {
    ensureRunLogTable(database);
    const deleteAuditStatement = database.prepare(`
      DELETE FROM comment_moderation_audit
      WHERE id = ? AND expires_at <= ?
    `);
    const deleteReportStatement = database.prepare(`
      DELETE FROM comment_reports
      WHERE id = ? AND status IN ('dismissed', 'actioned') AND expires_at <= ?
    `);
    const logStatement = database.prepare(`
      INSERT INTO community_moderation_maintenance_log (
        id, operation, status, preview_fingerprint, eligible_count,
        selected_count, affected_count, backup_sha256, executed_at, expires_at
      ) VALUES (?, 'purge', 'completed', ?, ?, ?, ?, ?, ?, ?)
    `);
    database.exec('BEGIN IMMEDIATE');
    try {
      const currentRows = canonicalRows(eligibleRows(database, nowIso));
      const currentFingerprint = fingerprintRows(key, currentRows);
      if (currentFingerprint !== envelope.metadata.approvalFingerprint) {
        throw new Error('database state changed after backup; create a new preview and backup');
      }
      if (JSON.stringify(currentRows) !== JSON.stringify(backedUpRows)) {
        throw new Error('encrypted backup does not match the current purge batch');
      }

      let affectedCount = 0;
      for (const row of currentRows) {
        const statement = row.record_kind === 'audit' ? deleteAuditStatement : deleteReportStatement;
        affectedCount += Number(statement.run(row.id, nowIso).changes);
      }
      if (affectedCount !== currentRows.length) throw new Error('purge affected an unexpected number of rows');
      logStatement.run(
        envelope.metadata.runId,
        envelope.metadata.approvalFingerprint,
        eligibleCount(database, nowIso).count + affectedCount,
        currentRows.length,
        affectedCount,
        backupSha256,
        nowIso,
        isoAfter(nowDate, RUN_LOG_RETENTION_DAYS),
      );
      database.exec('COMMIT');
      return {
        runId: envelope.metadata.runId,
        affectedCount,
        batchLimit: PURGE_BATCH_LIMIT,
        backupSha256,
        logExpiresAt: isoAfter(nowDate, RUN_LOG_RETENTION_DAYS),
      };
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  } finally {
    database.close();
  }
}

export function inspectExpiredBackups({ backupDirectory, now = new Date().toISOString() } = {}) {
  const nowDate = parseIso(now, 'now');
  if (!existsSync(backupDirectory)) return [];
  return readdirSync(backupDirectory)
    .filter((name) => name.endsWith(backupSuffix))
    .flatMap((name) => {
      const backupPath = path.join(backupDirectory, name);
      try {
        const envelope = JSON.parse(readFileSync(backupPath, 'utf8'));
        return parseIso(envelope?.metadata?.expiresAt, 'backup expiresAt') <= nowDate ? [backupPath] : [];
      } catch {
        return [];
      }
    })
    .sort();
}

export function pruneExpiredBackups({ backupDirectory, confirmation, now = new Date().toISOString() } = {}) {
  const expired = inspectExpiredBackups({ backupDirectory, now });
  if (confirmation !== 'PRUNE EXPIRED COMMUNITY AUDIT BACKUPS') {
    return { expiredCount: expired.length, deletedCount: 0 };
  }
  for (const backupPath of expired) {
    if (!statSync(backupPath).isFile()) throw new Error('backup cleanup target must be a regular file');
    unlinkSync(backupPath);
  }
  return { expiredCount: expired.length, deletedCount: expired.length };
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    if (!key?.startsWith('--') || rest[index + 1] === undefined) throw new Error(`invalid argument: ${key ?? ''}`);
    options[key.slice(2)] = rest[index + 1];
  }
  return { command, options };
}

function safeBackupResult(result) {
  return {
    backupPath: result.backupPath,
    backupSha256: result.backupSha256,
    createdAt: result.createdAt,
    expiresAt: result.expiresAt,
    selectedCount: result.selectedCount,
    approvalFingerprint: result.approvalFingerprint,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { command, options } = parseArguments(process.argv.slice(2));
  let result;
  if (command === 'preview') {
    result = createPurgePreview({ databasePath: options.db, now: options.now });
  } else if (command === 'backup') {
    result = safeBackupResult(createEncryptedBackup({
      databasePath: options.db,
      backupDirectory: options['backup-dir'],
      approvalFingerprint: options.approval,
      now: options.now,
    }));
  } else if (command === 'purge') {
    result = executeApprovedPurge({
      databasePath: options.db,
      backupPath: options.backup,
      confirmation: options.confirm,
      now: options.now,
    });
  } else if (command === 'prune-backups') {
    result = pruneExpiredBackups({
      backupDirectory: options['backup-dir'],
      confirmation: options.confirm,
      now: options.now,
    });
  } else {
    throw new Error('usage: community-audit-maintenance.mjs <preview|backup|purge|prune-backups> [options]');
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
