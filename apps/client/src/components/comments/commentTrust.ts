import type { CommentTrustStatus } from '../../services/api';

export const COMMENT_TRUST_COPY: Record<
  CommentTrustStatus,
  { label: string; description: string; className: string }
> = {
  community_unreviewed: {
    label: 'תוכן קהילתי — לא מאושר',
    description: 'נכתב בידי משתמש ולא נבדק לפי מדיניות הקהילה.',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  moderation_reviewed: {
    label: 'נבדק לפי מדיניות הקהילה — לא אישור קליני',
    description: 'נבדק לצורכי moderation בלבד ואינו חלק מהפרוטוקול המאושר.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
};

export function getCommentTrustCopy(status: CommentTrustStatus) {
  return COMMENT_TRUST_COPY[status] ?? COMMENT_TRUST_COPY.community_unreviewed;
}
