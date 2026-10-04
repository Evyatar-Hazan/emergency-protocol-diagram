import { describe, expect, it } from 'vitest';
import { parseCommunityModerationFlag } from './communityModerationConfig';

describe('community moderation feature gate', () => {
  it('enables only for an explicit true value', () => {
    expect(parseCommunityModerationFlag('true')).toBe(true);
  });

  it.each([undefined, null, '', 'false', 'TRUE', '1', true])(
    'fails closed for %s',
    (value) => {
      expect(parseCommunityModerationFlag(value)).toBe(false);
    },
  );
});
