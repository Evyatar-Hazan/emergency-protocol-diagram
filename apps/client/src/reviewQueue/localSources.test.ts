import { describe, expect, it } from 'vitest';
import { ASSESSMENT_STORAGE_KEY, type StoredAssessmentAttempt } from '../assessment/localStorage';
import { scn01LearningRubric } from '../assessment/scn01Rubric';
import {
  grantConsentWithoutBackfill,
  hydrateConsentedLocalSources,
} from './localSources';
import {
  declineReviewQueueConsent,
  emptyReviewQueue,
  loadReviewQueue,
  saveReviewQueue,
} from './reviewQueue';

class TrackingStorage implements Storage {
  private readonly values = new Map<string, string>();
  assessmentReads = 0;

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    if (key === ASSESSMENT_STORAGE_KEY) this.assessmentReads += 1;
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

function storedAttempt(firstRating: 'not_demonstrated' | 'demonstrated'): StoredAssessmentAttempt {
  return {
    schema_version: 1,
    rubric_id: scn01LearningRubric.rubric_id,
    rubric_version: scn01LearningRubric.rubric_version,
    scenario_id: scn01LearningRubric.scenario_id,
    claim: 'learning_feedback_only',
    score_percent: firstRating === 'demonstrated' ? 100 : 75,
    result_band: 'practice_evidence_observed',
    item_results: scn01LearningRubric.items.map((item, index) => ({
      item_id: item.item_id,
      competency_id: item.competency_id,
      outcome_id: item.outcome_id,
      rating: index === 0 ? firstRating : 'demonstrated',
      critical_error_candidate_observed: false,
    })),
  };
}

function setAttempts(storage: Storage, attempts: readonly StoredAssessmentAttempt[]) {
  storage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(attempts));
}

describe('review queue consent boundary', () => {
  it('starts disabled with an unknown consent choice', () => {
    expect(emptyReviewQueue()).toMatchObject({
      schemaVersion: 2,
      consent: 'unknown',
      enabled: false,
      assessmentCursor: 0,
    });
  });

  it('does not read assessment history before consent', () => {
    const storage = new TrackingStorage();
    setAttempts(storage, [storedAttempt('not_demonstrated')]);

    const hydrated = hydrateConsentedLocalSources(
      emptyReviewQueue(),
      ['unified_flow:scene_assessment'],
      storage,
      now,
      scn01LearningRubric,
    );

    expect(storage.assessmentReads).toBe(0);
    expect(hydrated.items).toEqual([]);
  });

  it('does not read assessment history after an explicit decline', () => {
    const storage = new TrackingStorage();
    setAttempts(storage, [storedAttempt('not_demonstrated')]);
    const declined = declineReviewQueueConsent(emptyReviewQueue());

    hydrateConsentedLocalSources(declined, [], storage, now, scn01LearningRubric);
    expect(storage.assessmentReads).toBe(0);
  });

  it('records the current attempt count at opt-in without backfilling it', () => {
    const storage = new TrackingStorage();
    setAttempts(storage, [storedAttempt('not_demonstrated')]);

    const consented = grantConsentWithoutBackfill(emptyReviewQueue(), storage);
    const hydrated = hydrateConsentedLocalSources(
      consented,
      [],
      storage,
      now,
      scn01LearningRubric,
    );

    expect(consented).toMatchObject({ consent: 'granted', enabled: true, assessmentCursor: 1 });
    expect(hydrated.items).toEqual([]);
  });

  it('collects only a new assessment attempt created after opt-in', () => {
    const storage = new TrackingStorage();
    setAttempts(storage, [storedAttempt('demonstrated')]);
    const consented = grantConsentWithoutBackfill(emptyReviewQueue(), storage);
    setAttempts(storage, [storedAttempt('demonstrated'), storedAttempt('not_demonstrated')]);

    const hydrated = hydrateConsentedLocalSources(
      consented,
      [],
      storage,
      now,
      scn01LearningRubric,
    );

    expect(hydrated.assessmentCursor).toBe(2);
    expect(hydrated.items.find((item) => item.sourceId === 'A60-001')?.reason).toBe('revisit');
  });

  it('persists consent and does not re-import the same attempt after reload', () => {
    const storage = new TrackingStorage();
    const consented = grantConsentWithoutBackfill(emptyReviewQueue(), storage);
    setAttempts(storage, [storedAttempt('not_demonstrated')]);
    const hydrated = hydrateConsentedLocalSources(
      consented,
      [],
      storage,
      now,
      scn01LearningRubric,
    );
    saveReviewQueue(storage, hydrated);

    const reopenedAt = new Date('2026-10-05T12:00:00.000Z');
    const reopened = hydrateConsentedLocalSources(
      loadReviewQueue(storage),
      [],
      storage,
      reopenedAt,
      scn01LearningRubric,
    );

    expect(reopened).toEqual(hydrated);
  });
});
