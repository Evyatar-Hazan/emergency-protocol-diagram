import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const schemaPath = fileURLToPath(
  new URL('../../../../../sql/d1-community-schema.sql', import.meta.url)
);
const schema = readFileSync(schemaPath, 'utf8');
const migrationPath = fileURLToPath(
  new URL('../../../../../sql/migrations/0002-community-moderation.sql', import.meta.url)
);
const moderationMigration = readFileSync(migrationPath, 'utf8');
const retentionMigrationPath = fileURLToPath(
  new URL('../../../../../sql/migrations/0003-community-audit-retention.sql', import.meta.url)
);
const retentionMigration = readFileSync(retentionMigrationPath, 'utf8');
const auditPurgePath = fileURLToPath(
  new URL('../../../../../sql/maintenance/purge-expired-community-audit.sql', import.meta.url)
);
const auditPurge = readFileSync(auditPurgePath, 'utf8');
const auditPurgePreviewPath = fileURLToPath(
  new URL('../../../../../sql/maintenance/preview-expired-community-audit.sql', import.meta.url)
);
const auditPurgePreview = readFileSync(auditPurgePreviewPath, 'utf8');
const maintenanceLogPurgePath = fileURLToPath(
  new URL('../../../../../sql/maintenance/purge-expired-community-maintenance-log.sql', import.meta.url)
);
const maintenanceLogPurge = readFileSync(maintenanceLogPurgePath, 'utf8');
const maintenanceLogPreviewPath = fileURLToPath(
  new URL('../../../../../sql/maintenance/preview-expired-community-maintenance-log.sql', import.meta.url)
);
const maintenanceLogPreview = readFileSync(maintenanceLogPreviewPath, 'utf8');

const tableColumns = {
  users: ['id', 'email', 'google_id', 'name', 'picture', 'is_admin', 'created_at', 'updated_at'],
  comments: [
    'id',
    'node_id',
    'content',
    'author_id',
    'parent_comment_id',
    'moderation_status',
    'visibility_status',
    'moderated_by',
    'moderated_at',
    'moderation_reason',
    'created_at',
    'updated_at',
  ],
  comment_likes: ['id', 'comment_id', 'user_id', 'created_at'],
  comment_views: ['id', 'comment_id', 'viewer_key', 'created_at'],
  comment_reports: [
    'id',
    'comment_id',
    'reporter_id',
    'reason',
    'status',
    'resolved_by',
    'resolved_at',
    'expires_at',
    'created_at',
  ],
  comment_moderation_audit: [
    'id',
    'comment_id',
    'actor_id',
    'action',
    'reason',
    'created_at',
    'expires_at',
  ],
  community_moderation_maintenance_log: [
    'id',
    'operation',
    'status',
    'preview_fingerprint',
    'eligible_count',
    'selected_count',
    'affected_count',
    'backup_sha256',
    'executed_at',
    'expires_at',
  ],
} as const;

function tableDefinition(tableName: string) {
  const match = schema.match(
    new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName} \\(([\\s\\S]*?)\\n\\);`, 'i')
  );

  expect(match, `missing idempotent ${tableName} table`).not.toBeNull();
  return match?.[1] ?? '';
}

describe('local D1 schema parity', () => {
  it('defines every table and column used by the Pages community API', () => {
    for (const [tableName, columns] of Object.entries(tableColumns)) {
      const definition = tableDefinition(tableName);

      for (const column of columns) {
        expect(definition, `${tableName}.${column} is missing`).toMatch(
          new RegExp(`(^|\\n)\\s*${column}\\s`, 'i')
        );
      }
    }
  });

  it('keeps comment relationships and uniqueness constraints required by the API', () => {
    expect(tableDefinition('comments')).toContain(
      'FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE'
    );
    expect(tableDefinition('comments')).toContain(
      'FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE'
    );
    expect(tableDefinition('comment_likes')).toContain('UNIQUE(comment_id, user_id)');
    expect(tableDefinition('comment_views')).toContain('UNIQUE(comment_id, viewer_key)');
    expect(tableDefinition('comment_reports')).toContain('UNIQUE(comment_id, reporter_id, reason)');
    expect(tableDefinition('comments')).toContain("DEFAULT 'community_unreviewed'");
    expect(tableDefinition('comments')).toContain("DEFAULT 'visible'");
  });

  it('uses rerunnable index declarations for automatic local setup', () => {
    const indexDeclarations = schema.match(/CREATE INDEX[^;]+;/gi) ?? [];

    expect(indexDeclarations.length).toBeGreaterThan(0);
    expect(
      indexDeclarations.every((declaration) => /CREATE INDEX IF NOT EXISTS/i.test(declaration))
    ).toBe(true);
    expect(schema).not.toMatch(/^\s*(?:DROP|ALTER|DELETE)\b/im);
  });

  it('keeps the pending moderation migration additive and leaves live content untouched', () => {
    expect(moderationMigration).toContain(
      "ALTER TABLE comments ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'community_unreviewed'"
    );
    expect(moderationMigration).toContain(
      "ALTER TABLE comments ADD COLUMN visibility_status TEXT NOT NULL DEFAULT 'visible'"
    );
    expect(moderationMigration).toMatch(
      /ALTER TABLE comments ADD COLUMN moderated_by TEXT\s+REFERENCES users\(id\) ON DELETE SET NULL;/i
    );
    expect(moderationMigration).toContain('CREATE TABLE IF NOT EXISTS comment_reports');
    expect(moderationMigration).toContain('CREATE TABLE IF NOT EXISTS comment_moderation_audit');
    expect(moderationMigration).not.toMatch(/^\s*(?:UPDATE|DELETE|DROP)\b/im);
  });

  it('retains minimized audit events for 90 days without content or required direct references', () => {
    const auditDefinition = tableDefinition('comment_moderation_audit');

    expect(auditDefinition).toContain("expires_at TEXT NOT NULL DEFAULT (datetime('now', '+90 days'))");
    expect(auditDefinition).toContain(
      'FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE SET NULL'
    );
    expect(auditDefinition).toContain(
      'FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL'
    );
    expect(auditDefinition).not.toMatch(/\b(?:content|email|name|picture)\b/i);
    expect(schema).toContain('CREATE TRIGGER IF NOT EXISTS scrub_moderation_audit_before_comment_delete');
    expect(schema).toContain('CREATE TRIGGER IF NOT EXISTS scrub_moderation_audit_before_actor_delete');

    expect(retentionMigration).toContain('INSERT INTO comment_moderation_audit');
    expect(retentionMigration).toContain('ALTER TABLE comment_reports ADD COLUMN expires_at TEXT');
    expect(retentionMigration).toContain("datetime(created_at, '+90 days')");
    expect(retentionMigration).toMatch(
      /SET comment_id = NULL,\s+actor_id = NULL,\s+expires_at = datetime\('now', '\+90 days'\)/i
    );
    expect(auditPurge).toContain('LIMIT 500');
    expect(auditPurge).toContain('DELETE FROM comment_moderation_audit');
    expect(auditPurge).toContain('DELETE FROM comment_reports');
    expect(auditPurge).toContain('approved_community_audit_purge');
    expect(auditPurgePreview).toContain('COUNT(*) AS eligible_count');
    expect(auditPurgePreview).not.toMatch(/^\s*(?:DELETE|DROP|UPDATE|ALTER)\b/im);

    const maintenanceDefinition = tableDefinition('community_moderation_maintenance_log');
    expect(maintenanceDefinition).toContain('selected_count INTEGER NOT NULL CHECK (selected_count BETWEEN 0 AND 500)');
    expect(maintenanceDefinition).toContain("expires_at TEXT NOT NULL DEFAULT (datetime('now', '+90 days'))");
    expect(maintenanceDefinition).not.toMatch(/\b(?:content|comment_id|actor_id|email|name|picture)\b/i);
    expect(retentionMigration).toContain('CREATE TABLE community_moderation_maintenance_log');
    expect(maintenanceLogPurge).toMatch(/DELETE FROM community_moderation_maintenance_log[\s\S]+LIMIT 500/i);
    expect(maintenanceLogPurge).toContain('approved_community_maintenance_log_purge');
    expect(maintenanceLogPreview).toContain('COUNT(*) AS eligible_count');
    expect(maintenanceLogPreview).not.toMatch(/^\s*(?:DELETE|DROP|UPDATE|ALTER)\b/im);
  });
});
