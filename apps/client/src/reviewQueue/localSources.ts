import { loadAssessmentAttempts } from '../assessment/localStorage';
import type { LearningAssessmentRubric } from '../assessment/types';
import { eventFromStoredAttempt } from './assessmentHistory';
import {
  advanceAssessmentCursor,
  grantReviewQueueConsent,
  ingestAssessmentEvent,
  syncBookmarks,
  type ReviewQueueState,
} from './reviewQueue';

export function grantConsentWithoutBackfill(
  state: ReviewQueueState,
  storage: Storage,
): ReviewQueueState {
  const currentAttemptCount = loadAssessmentAttempts(storage).length;
  return grantReviewQueueConsent(state, currentAttemptCount);
}

export function hydrateConsentedLocalSources(
  state: ReviewQueueState,
  bookmarkedNodeIds: readonly string[],
  storage: Storage,
  now: Date,
  rubric: LearningAssessmentRubric,
): ReviewQueueState {
  if (state.consent !== 'granted' || !state.enabled) return state;

  let hydrated = syncBookmarks(state, bookmarkedNodeIds, now);
  const attempts = loadAssessmentAttempts(storage);
  if (attempts.length <= state.assessmentCursor) return hydrated;

  const latestAttempt = attempts.at(-1);
  if (!latestAttempt) return advanceAssessmentCursor(hydrated, attempts.length);
  const event = eventFromStoredAttempt(latestAttempt, rubric);
  if (event) {
    hydrated = ingestAssessmentEvent(
      hydrated,
      event,
      rubric,
      now,
      attempts.length,
    );
  }
  return advanceAssessmentCursor(hydrated, attempts.length);
}
