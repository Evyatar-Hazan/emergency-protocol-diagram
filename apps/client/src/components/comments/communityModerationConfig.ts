export function parseCommunityModerationFlag(value: unknown): boolean {
  return value === 'true';
}

export const communityModerationEnabled = parseCommunityModerationFlag(
  import.meta.env.VITE_ENABLE_COMMUNITY_MODERATION,
);
