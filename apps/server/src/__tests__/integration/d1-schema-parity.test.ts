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
    'created_at',
  ],
  comment_moderation_audit: ['id', 'comment_id', 'actor_id', 'action', 'reason', 'created_at'],
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
    expect(moderationMigration).toContain('CREATE TABLE IF NOT EXISTS comment_reports');
    expect(moderationMigration).toContain('CREATE TABLE IF NOT EXISTS comment_moderation_audit');
    expect(moderationMigration).not.toMatch(/^\s*(?:UPDATE|DELETE|DROP)\b/im);
  });
});
