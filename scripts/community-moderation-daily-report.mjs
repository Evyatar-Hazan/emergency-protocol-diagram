import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

const reportWindowHours = 24;

function parseIso(value, label) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.valueOf())) throw new TypeError(`${label} must be a valid ISO timestamp`);
  return date;
}

function countMap(rows, key) {
  return Object.fromEntries(rows.map((row) => [String(row[key]), Number(row.count)]));
}

function openReadOnly(databasePath) {
  if (!databasePath || !existsSync(databasePath)) throw new Error('an existing local SQLite --db path is required');
  return new DatabaseSync(databasePath, { readOnly: true });
}

export function buildDailyModerationReport({ databasePath, until = new Date().toISOString() } = {}) {
  const untilDate = parseIso(until, 'until');
  const sinceDate = new Date(untilDate.valueOf() - reportWindowHours * 60 * 60 * 1000);
  const since = sinceDate.toISOString();
  const end = untilDate.toISOString();
  const database = openReadOnly(databasePath);
  try {
    const reportsByStatus = database.prepare(`
      SELECT status, COUNT(*) AS count
      FROM comment_reports
      WHERE datetime(created_at) >= datetime(?) AND datetime(created_at) < datetime(?)
      GROUP BY status
      ORDER BY status
    `).all(since, end);
    const reportsByReason = database.prepare(`
      SELECT reason, COUNT(*) AS count
      FROM comment_reports
      WHERE datetime(created_at) >= datetime(?) AND datetime(created_at) < datetime(?)
      GROUP BY reason
      ORDER BY reason
    `).all(since, end);
    const commentLabels = database.prepare(`
      SELECT moderation_status, visibility_status, COUNT(*) AS count
      FROM comments
      GROUP BY moderation_status, visibility_status
      ORDER BY moderation_status, visibility_status
    `).all();
    const moderationActions = database.prepare(`
      SELECT action, COUNT(*) AS count
      FROM comment_moderation_audit
      WHERE datetime(created_at) >= datetime(?) AND datetime(created_at) < datetime(?)
      GROUP BY action
      ORDER BY action
    `).all(since, end);
    const pendingQueue = database.prepare(`
      SELECT
        COUNT(*) AS count,
        CASE
          WHEN MIN(created_at) IS NULL THEN NULL
          ELSE ROUND((julianday(?) - julianday(MIN(created_at))) * 24, 2)
        END AS oldest_hours
      FROM comment_reports
      WHERE status = 'pending'
    `).get(end);
    const maintenance = database.prepare(`
      SELECT COUNT(*) AS completed_count, COALESCE(SUM(affected_count), 0) AS affected_count
      FROM community_moderation_maintenance_log
      WHERE status = 'completed'
        AND datetime(executed_at) >= datetime(?)
        AND datetime(executed_at) < datetime(?)
    `).get(since, end);

    return {
      scope: 'private_owner_only',
      deliveryStatus: 'not_configured',
      period: { since, until: end, hours: reportWindowHours },
      reportCountsByStatus: countMap(reportsByStatus, 'status'),
      reportCountsByReason: countMap(reportsByReason, 'reason'),
      commentLabelCounts: commentLabels.map((row) => ({
        moderationStatus: String(row.moderation_status),
        visibilityStatus: String(row.visibility_status),
        count: Number(row.count),
      })),
      moderationActionCounts: countMap(moderationActions, 'action'),
      queue: {
        pendingReportCount: Number(pendingQueue.count),
        oldestPendingHours: pendingQueue.oldest_hours === null ? null : Number(pendingQueue.oldest_hours),
      },
      maintenance: {
        completedPurgeCount: Number(maintenance.completed_count),
        affectedAuditRowCount: Number(maintenance.affected_count),
        errorCount: null,
        errorCollectionStatus: 'not_configured',
      },
      privacy: {
        identifiersIncluded: false,
        contentIncluded: false,
        userTableRead: false,
      },
    };
  } finally {
    database.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const databaseIndex = process.argv.indexOf('--db');
  const untilIndex = process.argv.indexOf('--until');
  if (databaseIndex === -1 || !process.argv[databaseIndex + 1]) {
    throw new Error('usage: community-moderation-daily-report.mjs --db <local-sqlite-path> [--until <ISO>]');
  }
  const report = buildDailyModerationReport({
    databasePath: process.argv[databaseIndex + 1],
    until: untilIndex === -1 ? undefined : process.argv[untilIndex + 1],
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
