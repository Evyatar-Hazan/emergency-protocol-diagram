import type { Env } from './types';

export function isCommunityModerationEnabled(
  env: Pick<Env, 'COMMUNITY_MODERATION_ENABLED'>
): boolean {
  return env.COMMUNITY_MODERATION_ENABLED === 'true';
}
