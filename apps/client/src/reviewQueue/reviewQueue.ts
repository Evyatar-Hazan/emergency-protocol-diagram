import type {
  AssessmentLearningResultRecordedEvent,
  ReviewSignal,
} from '../assessment/adaptiveReviewEvents';
import { isAdaptiveReviewEventForRubric } from '../assessment/adaptiveReviewEvents';
import type { LearningAssessmentRubric } from '../assessment/types';

export const REVIEW_QUEUE_STORAGE_KEY = 'epd.adaptive-review.v1';
export const REVIEW_QUEUE_SCHEMA_VERSION = 2 as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewQueueReason = 'bookmark' | ReviewSignal;

export interface ReviewQueueItem {
  id: string;
  kind: 'bookmark' | 'assessment';
  sourceId: string;
  reason: ReviewQueueReason;
  dueAt: string;
  createdAt: string;
  lastReviewedAt: string | null;
  reviewCount: number;
  sourceSequence: number;
  dismissed: boolean;
}

export interface ReviewQueueState {
  schemaVersion: typeof REVIEW_QUEUE_SCHEMA_VERSION;
  consent: 'unknown' | 'granted' | 'declined';
  enabled: boolean;
  assessmentCursor: number;
  items: readonly ReviewQueueItem[];
}

export const emptyReviewQueue = (): ReviewQueueState => ({
  schemaVersion: REVIEW_QUEUE_SCHEMA_VERSION,
  consent: 'unknown',
  enabled: false,
  assessmentCursor: 0,
  items: [],
});

const initialDelayDays: Record<ReviewQueueReason, number> = {
  bookmark: 0,
  revisit: 0,
  reinforce: 1,
  maintain: 7,
  instructor_required: 0,
};

const completionIntervals: Record<Exclude<ReviewQueueReason, 'instructor_required'>, readonly number[]> = {
  bookmark: [1, 3, 7, 14, 30],
  revisit: [1, 3, 7, 14, 30],
  reinforce: [3, 7, 14, 30, 60],
  maintain: [14, 30, 60, 90],
};

function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isReviewQueueItem(value: unknown): value is ReviewQueueItem {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = [
    'createdAt',
    'dismissed',
    'dueAt',
    'id',
    'kind',
    'lastReviewedAt',
    'reason',
    'reviewCount',
    'sourceId',
    'sourceSequence',
  ].sort();
  const actualKeys = Object.keys(record).sort();
  const reasons = new Set<ReviewQueueReason>([
    'bookmark',
    'revisit',
    'reinforce',
    'maintain',
    'instructor_required',
  ]);

  return (
    actualKeys.length === keys.length &&
    actualKeys.every((key, index) => key === keys[index]) &&
    typeof record.id === 'string' &&
    (record.kind === 'bookmark' || record.kind === 'assessment') &&
    typeof record.sourceId === 'string' &&
    reasons.has(record.reason as ReviewQueueReason) &&
    isIsoDate(record.dueAt) &&
    isIsoDate(record.createdAt) &&
    (record.lastReviewedAt === null || isIsoDate(record.lastReviewedAt)) &&
    Number.isInteger(record.reviewCount) &&
    (record.reviewCount as number) >= 0 &&
    Number.isInteger(record.sourceSequence) &&
    (record.sourceSequence as number) >= 0 &&
    typeof record.dismissed === 'boolean'
  );
}

export function loadReviewQueue(storage: Storage): ReviewQueueState {
  const serialized = storage.getItem(REVIEW_QUEUE_STORAGE_KEY);
  if (!serialized) return emptyReviewQueue();

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return emptyReviewQueue();
    }
    const record = parsed as Record<string, unknown>;
    const legacyKeys = ['enabled', 'items', 'schemaVersion'].sort();
    if (
      record.schemaVersion === 1 &&
      Object.keys(record).sort().length === legacyKeys.length &&
      Object.keys(record).sort().every((key, index) => key === legacyKeys[index]) &&
      typeof record.enabled === 'boolean' &&
      Array.isArray(record.items) &&
      record.items.every(isReviewQueueItem)
    ) {
      return {
        schemaVersion: REVIEW_QUEUE_SCHEMA_VERSION,
        consent: 'unknown',
        enabled: false,
        assessmentCursor: 0,
        items: sortReviewItems(record.items),
      };
    }

    const exactKeys = ['assessmentCursor', 'consent', 'enabled', 'items', 'schemaVersion'].sort();
    const actualKeys = Object.keys(record).sort();
    const allowedConsent = new Set(['unknown', 'granted', 'declined']);
    if (
      actualKeys.length !== exactKeys.length ||
      !actualKeys.every((key, index) => key === exactKeys[index]) ||
      record.schemaVersion !== REVIEW_QUEUE_SCHEMA_VERSION ||
      !allowedConsent.has(record.consent as string) ||
      typeof record.enabled !== 'boolean' ||
      (record.enabled && record.consent !== 'granted') ||
      !Number.isInteger(record.assessmentCursor) ||
      (record.assessmentCursor as number) < 0 ||
      !Array.isArray(record.items) ||
      !record.items.every(isReviewQueueItem)
    ) {
      return emptyReviewQueue();
    }
    return {
      schemaVersion: REVIEW_QUEUE_SCHEMA_VERSION,
      consent: record.consent as ReviewQueueState['consent'],
      enabled: record.enabled,
      assessmentCursor: record.assessmentCursor as number,
      items: sortReviewItems(record.items),
    };
  } catch {
    return emptyReviewQueue();
  }
}

export function saveReviewQueue(storage: Storage, state: ReviewQueueState): void {
  storage.setItem(
    REVIEW_QUEUE_STORAGE_KEY,
    JSON.stringify({
      schemaVersion: REVIEW_QUEUE_SCHEMA_VERSION,
      consent: state.consent,
      enabled: state.enabled,
      assessmentCursor: state.assessmentCursor,
      items: sortReviewItems(state.items),
    }),
  );
}

export function sortReviewItems(items: readonly ReviewQueueItem[]): ReviewQueueItem[] {
  return [...items].sort((left, right) => {
    const dueDifference = Date.parse(left.dueAt) - Date.parse(right.dueAt);
    if (dueDifference !== 0) return dueDifference;
    const priority: Record<ReviewQueueReason, number> = {
      instructor_required: 0,
      revisit: 1,
      reinforce: 2,
      bookmark: 3,
      maintain: 4,
    };
    return priority[left.reason] - priority[right.reason] || left.id.localeCompare(right.id);
  });
}

export function syncBookmarks(
  state: ReviewQueueState,
  bookmarkIds: readonly string[],
  now: Date,
): ReviewQueueState {
  const activeBookmarks = new Set(bookmarkIds.filter((id) => id.includes(':')));
  const retained = state.items.filter(
    (item) => item.kind !== 'bookmark' || activeBookmarks.has(item.sourceId),
  );
  const existingIds = new Set(retained.map((item) => item.id));

  for (const nodeId of [...activeBookmarks].sort()) {
    const id = `bookmark:${nodeId}`;
    if (!existingIds.has(id)) {
      retained.push({
        id,
        kind: 'bookmark',
        sourceId: nodeId,
        reason: 'bookmark',
        dueAt: addDays(now, initialDelayDays.bookmark),
        createdAt: now.toISOString(),
        lastReviewedAt: null,
        reviewCount: 0,
      sourceSequence: 0,
      dismissed: false,
      });
    }
  }

  return { ...state, items: sortReviewItems(retained) };
}

export function ingestAssessmentEvent(
  state: ReviewQueueState,
  event: AssessmentLearningResultRecordedEvent,
  rubric: LearningAssessmentRubric,
  now: Date,
  sourceSequence: number,
): ReviewQueueState {
  if (!isAdaptiveReviewEventForRubric(event, rubric)) return state;

  const items = [...state.items];
  for (const outcome of event.outcomes) {
    const id = `assessment:${event.assessmentId}:${outcome.itemId}`;
    const existingIndex = items.findIndex((item) => item.id === id);
    const existing = existingIndex >= 0 ? items[existingIndex] : null;
    if (existing && existing.sourceSequence >= sourceSequence) continue;

    const next: ReviewQueueItem = {
      id,
      kind: 'assessment',
      sourceId: outcome.itemId,
      reason: outcome.reviewSignal,
      dueAt: addDays(now, initialDelayDays[outcome.reviewSignal]),
      createdAt: existing?.createdAt ?? now.toISOString(),
      lastReviewedAt: existing?.lastReviewedAt ?? null,
      reviewCount: existing?.reviewCount ?? 0,
      sourceSequence,
      dismissed: false,
    };

    if (existingIndex >= 0) items[existingIndex] = next;
    else items.push(next);
  }

  return { ...state, items: sortReviewItems(items) };
}

export function completeReview(
  state: ReviewQueueState,
  itemId: string,
  now: Date,
): ReviewQueueState {
  const items = state.items.map((item) => {
    if (item.id !== itemId || item.reason === 'instructor_required') return item;
    const schedule = completionIntervals[item.reason];
    const interval = schedule[Math.min(item.reviewCount, schedule.length - 1)];
    return {
      ...item,
      dueAt: addDays(now, interval),
      lastReviewedAt: now.toISOString(),
      reviewCount: item.reviewCount + 1,
    };
  });
  return { ...state, items: sortReviewItems(items) };
}

export function snoozeReview(
  state: ReviewQueueState,
  itemId: string,
  now: Date,
  days: 1 | 3 | 7,
): ReviewQueueState {
  const items = state.items.map((item) =>
    item.id === itemId ? { ...item, dueAt: addDays(now, days) } : item,
  );
  return { ...state, items: sortReviewItems(items) };
}

export function removeReviewItem(state: ReviewQueueState, itemId: string): ReviewQueueState {
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === itemId ? { ...item, dismissed: true } : item,
    ),
  };
}

export function setReviewQueueEnabled(
  state: ReviewQueueState,
  enabled: boolean,
): ReviewQueueState {
  return { ...state, enabled: enabled && state.consent === 'granted' };
}

export function grantReviewQueueConsent(
  state: ReviewQueueState,
  assessmentBaseline: number,
): ReviewQueueState {
  return {
    ...state,
    consent: 'granted',
    enabled: true,
    assessmentCursor: Math.max(0, assessmentBaseline),
  };
}

export function declineReviewQueueConsent(state: ReviewQueueState): ReviewQueueState {
  return { ...state, consent: 'declined', enabled: false };
}

export function advanceAssessmentCursor(
  state: ReviewQueueState,
  assessmentCursor: number,
): ReviewQueueState {
  return { ...state, assessmentCursor: Math.max(state.assessmentCursor, assessmentCursor) };
}

export function resetReviewQueue(): ReviewQueueState {
  return emptyReviewQueue();
}

export function dueReviewCount(state: ReviewQueueState, now: Date): number {
  if (!state.enabled) return 0;
  return state.items.filter(
    (item) => !item.dismissed && Date.parse(item.dueAt) <= now.getTime(),
  ).length;
}
