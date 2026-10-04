import { describe, expect, it } from 'vitest';
import { getCommentTrustCopy } from './commentTrust';

describe('community trust labels', () => {
  it('marks unreviewed user content as community content that is not approved', () => {
    expect(getCommentTrustCopy('community_unreviewed').label).toBe('תוכן קהילתי — לא מאושר');
  });

  it('keeps moderation review distinct from clinical approval', () => {
    const copy = getCommentTrustCopy('moderation_reviewed');

    expect(copy.label).toContain('לא אישור קליני');
    expect(copy.description).toContain('moderation');
    expect(copy.label).not.toBe('מאושר');
  });
});
