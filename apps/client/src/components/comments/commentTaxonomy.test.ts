import { describe, expect, it } from 'vitest';
import { buildCommentPayload, parseCommentContent } from './commentTaxonomy';

describe('comment taxonomy', () => {
  it('builds and parses an allowed comment kind', () => {
    const payload = buildCommentPayload('תיקון קליני', '  נדרש דיוק  ');

    expect(payload).toBe('[תיקון קליני] נדרש דיוק');
    expect(parseCommentContent(payload)).toEqual({
      kindLabel: 'תיקון קליני',
      body: 'נדרש דיוק',
    });
  });

  it('falls back to the default kind for an unknown label', () => {
    expect(buildCommentPayload('לא קיים', 'טקסט')).toBe('[שאלה] טקסט');
  });

  it('keeps legacy or unknown tagged content intact', () => {
    expect(parseCommentContent('תגובה ישנה')).toEqual({ kindLabel: null, body: 'תגובה ישנה' });
    expect(parseCommentContent('[לא קיים] טקסט')).toEqual({
      kindLabel: null,
      body: '[לא קיים] טקסט',
    });
  });
});
