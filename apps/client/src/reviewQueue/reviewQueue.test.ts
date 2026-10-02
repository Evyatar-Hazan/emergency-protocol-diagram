import { describe, expect, it } from 'vitest';
import { scn01LearningRubric } from '../assessment/scn01Rubric';
import type { AssessmentLearningResultRecordedEvent } from '../assessment/adaptiveReviewEvents';
import {
  REVIEW_QUEUE_STORAGE_KEY,
  completeReview,
  declineReviewQueueConsent,
  dueReviewCount,
  emptyReviewQueue,
  ingestAssessmentEvent,
  grantReviewQueueConsent,
  loadReviewQueue,
  removeReviewItem,
  resetReviewQueue,
  saveReviewQueue,
  setReviewQueueEnabled,
  snoozeReview,
  syncBookmarks,
} from './reviewQueue';
import { eventFromStoredAttempt } from './assessmentHistory';
import type { StoredAssessmentAttempt } from '../assessment/localStorage';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const now = new Date('2026-10-02T12:00:00.000Z');

function assessmentEvent(): AssessmentLearningResultRecordedEvent {
  return {
    schemaVersion: 1,
    event: 'assessment_learning_result_recorded',
    assessmentId: scn01LearningRubric.rubric_id,
    rubricVersion: scn01LearningRubric.rubric_version,
    scenarioId: scn01LearningRubric.scenario_id,
    claim: 'learning_feedback_only',
    outcomes: [
      {
        itemId: 'A60-001',
        outcomeId: 'LO-01-01',
        competencyId: 'BLS-C01',
        reviewSignal: 'revisit',
        criticalErrorCandidateObserved: false,
      },
      {
        itemId: 'A60-002',
        outcomeId: 'LO-01-01',
        competencyId: 'BLS-C02',
        reviewSignal: 'reinforce',
        criticalErrorCandidateObserved: false,
      },
      {
        itemId: 'A60-003',
        outcomeId: 'LO-01-02',
        competencyId: 'BLS-C03',
        reviewSignal: 'maintain',
        criticalErrorCandidateObserved: false,
      },
      {
        itemId: 'A60-004',
        outcomeId: 'LO-01-02',
        competencyId: 'BLS-C10',
        reviewSignal: 'instructor_required',
        criticalErrorCandidateObserved: false,
      },
    ],
  };
}

describe('personal review queue', () => {
  it('adds bookmark items deterministically and ignores malformed bookmark ids', () => {
    const state = syncBookmarks(
      emptyReviewQueue(),
      ['unified_flow:scene_assessment', 'malformed', 'unified_flow:scene_assessment'],
      now,
    );

    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({
      id: 'bookmark:unified_flow:scene_assessment',
      dueAt: now.toISOString(),
      reason: 'bookmark',
    });
  });

  it('removes a queue item when its bookmark is removed', () => {
    const populated = syncBookmarks(emptyReviewQueue(), ['unified_flow:scene_assessment'], now);
    expect(syncBookmarks(populated, [], now).items).toEqual([]);
  });

  it('maps assessment signals to deterministic initial due dates', () => {
    const state = ingestAssessmentEvent(
      emptyReviewQueue(),
      assessmentEvent(),
      scn01LearningRubric,
      now,
      1,
    );

    expect(state.items.map((item) => [item.sourceId, item.dueAt])).toEqual([
      ['A60-004', '2026-10-02T12:00:00.000Z'],
      ['A60-001', '2026-10-02T12:00:00.000Z'],
      ['A60-002', '2026-10-03T12:00:00.000Z'],
      ['A60-003', '2026-10-09T12:00:00.000Z'],
    ]);
  });

  it('rejects an assessment event that does not match the active rubric', () => {
    const invalid = { ...assessmentEvent(), rubricVersion: 'substituted' };
    const state = ingestAssessmentEvent(emptyReviewQueue(), invalid, scn01LearningRubric, now, 1);
    expect(state).toEqual(emptyReviewQueue());
  });

  it('does not reschedule an already ingested attempt after reopening', () => {
    const initial = ingestAssessmentEvent(
      emptyReviewQueue(),
      assessmentEvent(),
      scn01LearningRubric,
      now,
      1,
    );
    const reopenedAt = new Date('2026-10-05T12:00:00.000Z');
    const reopened = ingestAssessmentEvent(
      initial,
      assessmentEvent(),
      scn01LearningRubric,
      reopenedAt,
      1,
    );
    expect(reopened).toEqual(initial);
  });

  it('reschedules when a newer assessment attempt arrives', () => {
    const initial = ingestAssessmentEvent(
      emptyReviewQueue(),
      assessmentEvent(),
      scn01LearningRubric,
      now,
      1,
    );
    const nextAttemptAt = new Date('2026-10-05T12:00:00.000Z');
    const updated = ingestAssessmentEvent(
      initial,
      assessmentEvent(),
      scn01LearningRubric,
      nextAttemptAt,
      2,
    );
    expect(updated.items.find((item) => item.sourceId === 'A60-001')).toMatchObject({
      dueAt: nextAttemptAt.toISOString(),
      sourceSequence: 2,
    });
  });

  it('advances completion intervals from an injected clock', () => {
    const bookmarked = syncBookmarks(emptyReviewQueue(), ['unified_flow:scene_assessment'], now);
    const itemId = bookmarked.items[0].id;
    const first = completeReview(bookmarked, itemId, now);
    const secondNow = new Date('2026-10-03T12:00:00.000Z');
    const second = completeReview(first, itemId, secondNow);

    expect(first.items[0]).toMatchObject({
      dueAt: '2026-10-03T12:00:00.000Z',
      reviewCount: 1,
    });
    expect(second.items[0]).toMatchObject({
      dueAt: '2026-10-06T12:00:00.000Z',
      reviewCount: 2,
    });
  });

  it('does not treat instructor-required review as digitally completed', () => {
    const state = ingestAssessmentEvent(
      emptyReviewQueue(),
      assessmentEvent(),
      scn01LearningRubric,
      now,
      1,
    );
    const item = state.items.find((candidate) => candidate.reason === 'instructor_required')!;
    expect(completeReview(state, item.id, now)).toEqual(state);
  });

  it('lets the learner snooze a review by an allowed interval', () => {
    const state = syncBookmarks(emptyReviewQueue(), ['unified_flow:scene_assessment'], now);
    const snoozed = snoozeReview(state, state.items[0].id, now, 3);
    expect(snoozed.items[0].dueAt).toBe('2026-10-05T12:00:00.000Z');
  });

  it('lets the learner remove an individual item', () => {
    const state = syncBookmarks(emptyReviewQueue(), ['unified_flow:scene_assessment'], now);
    const removed = removeReviewItem(state, state.items[0].id);
    expect(removed.items[0].dismissed).toBe(true);
    expect(dueReviewCount(removed, now)).toBe(0);
  });

  it('can disable scheduling without deleting local items', () => {
    const consented = grantReviewQueueConsent(emptyReviewQueue(), 0);
    const state = syncBookmarks(consented, ['unified_flow:scene_assessment'], now);
    const disabled = setReviewQueueEnabled(state, false);
    expect(disabled.items).toHaveLength(1);
    expect(dueReviewCount(disabled, now)).toBe(0);
  });

  it('can reset all local review data while preserving the chosen enabled state', () => {
    expect(resetReviewQueue()).toEqual({
      schemaVersion: 2,
      consent: 'unknown',
      enabled: false,
      assessmentCursor: 0,
      items: [],
    });
  });

  it('cannot enable the queue without explicit granted consent', () => {
    expect(setReviewQueueEnabled(emptyReviewQueue(), true).enabled).toBe(false);
    expect(setReviewQueueEnabled(declineReviewQueueConsent(emptyReviewQueue()), true).enabled).toBe(false);
    expect(setReviewQueueEnabled(grantReviewQueueConsent(emptyReviewQueue(), 0), true).enabled).toBe(true);
  });

  it('persists and restores the same schedule after closing', () => {
    const storage = new MemoryStorage();
    const state = completeReview(
      syncBookmarks(emptyReviewQueue(), ['unified_flow:scene_assessment'], now),
      'bookmark:unified_flow:scene_assessment',
      now,
    );
    saveReviewQueue(storage, state);
    expect(loadReviewQueue(storage)).toEqual(state);
  });

  it('fails closed to an empty queue for corrupted or extra-field data', () => {
    const storage = new MemoryStorage();
    storage.setItem(REVIEW_QUEUE_STORAGE_KEY, '{not-json');
    expect(loadReviewQueue(storage)).toEqual(emptyReviewQueue());
    storage.setItem(
      REVIEW_QUEUE_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, enabled: true, items: [], userId: 'forbidden' }),
    );
    expect(loadReviewQueue(storage)).toEqual(emptyReviewQueue());
  });

  it('preserves legacy v1 items but requires a new explicit choice', () => {
    const storage = new MemoryStorage();
    const legacyItem = syncBookmarks(
      grantReviewQueueConsent(emptyReviewQueue(), 0),
      ['unified_flow:scene_assessment'],
      now,
    ).items[0];
    storage.setItem(
      REVIEW_QUEUE_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, enabled: true, items: [legacyItem] }),
    );

    const migrated = loadReviewQueue(storage);
    expect(migrated).toMatchObject({
      schemaVersion: 2,
      consent: 'unknown',
      enabled: false,
      assessmentCursor: 0,
    });
    expect(migrated.items).toEqual([legacyItem]);
  });

  it('converts a stored assessment attempt without adding learner data', () => {
    const attempt: StoredAssessmentAttempt = {
      schema_version: 1,
      rubric_id: scn01LearningRubric.rubric_id,
      rubric_version: scn01LearningRubric.rubric_version,
      scenario_id: scn01LearningRubric.scenario_id,
      claim: 'learning_feedback_only',
      score_percent: 50,
      result_band: 'developing',
      item_results: scn01LearningRubric.items.map((item, index) => ({
        item_id: item.item_id,
        competency_id: item.competency_id,
        outcome_id: item.outcome_id,
        rating: index === 0 ? 'not_demonstrated' : 'demonstrated',
        critical_error_candidate_observed: false,
      })),
    };

    const event = eventFromStoredAttempt(attempt, scn01LearningRubric);
    expect(event?.outcomes[0].reviewSignal).toBe('revisit');
    expect(JSON.stringify(event)).not.toMatch(/user|patient|prompt|response/i);
  });

  it('ignores incomplete or mismatched stored assessment data', () => {
    const incomplete: StoredAssessmentAttempt = {
      schema_version: 1,
      rubric_id: scn01LearningRubric.rubric_id,
      rubric_version: scn01LearningRubric.rubric_version,
      scenario_id: scn01LearningRubric.scenario_id,
      claim: 'learning_feedback_only',
      score_percent: null,
      result_band: 'not_scored',
      item_results: [],
    };
    expect(eventFromStoredAttempt(incomplete, scn01LearningRubric)).toBeNull();
  });
});
