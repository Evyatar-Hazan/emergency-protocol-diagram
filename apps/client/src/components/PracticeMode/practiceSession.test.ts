import { describe, expect, it } from 'vitest';
import { evaluateLearningAssessment } from '../../assessment/engine';
import { scn01LearningRubric } from '../../assessment/scn01Rubric';
import {
  PRACTICE_SESSION_STORAGE_KEY,
  advancePracticeSession,
  clearPracticeSession,
  createPracticeSession,
  goBackInPracticeSession,
  loadPracticeSession,
  practiceSteps,
  savePracticeSession,
  selectPracticeChoice,
} from './practiceSession';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe('practice session state', () => {
  it('requires a choice before revealing the next stage', () => {
    const initial = createPracticeSession();
    expect(advancePracticeSession(initial)).toBe(initial);

    const answered = selectPracticeChoice(initial, 'route-complete');
    expect(advancePracticeSession(answered).currentStep).toBe(1);
  });

  it('preserves a choice while navigating back', () => {
    const first = advancePracticeSession(
      selectPracticeChoice(createPracticeSession(), 'route-partial'),
    );
    const second = selectPracticeChoice(first, 'gates-complete');
    const previous = goBackInPracticeSession(second);

    expect(previous.currentStep).toBe(0);
    expect(previous.responses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ itemId: 'A60-001', choiceId: 'route-partial' }),
        expect.objectContaining({ itemId: 'A60-002', choiceId: 'gates-complete' }),
      ]),
    );
  });

  it('persists and restores identifier-only progress', () => {
    const storage = memoryStorage();
    const session = selectPracticeChoice(createPracticeSession(), 'route-complete');
    savePracticeSession(storage, session);

    expect(loadPracticeSession(storage)).toEqual(session);
    const serialized = storage.getItem(PRACTICE_SESSION_STORAGE_KEY) ?? '';
    expect(serialized).not.toContain('נתוני בדיקה');
    expect(serialized).not.toContain('patient');
    expect(serialized).not.toContain('user');
  });

  it('fails closed for malformed or expanded stored state and supports reset', () => {
    const storage = memoryStorage();
    storage.setItem(PRACTICE_SESSION_STORAGE_KEY, '{bad-json');
    expect(loadPracticeSession(storage)).toBeNull();

    storage.setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      JSON.stringify({ ...createPracticeSession(), freeText: 'not allowed' }),
    );
    expect(loadPracticeSession(storage)).toBeNull();

    savePracticeSession(storage, createPracticeSession());
    clearPracticeSession(storage);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('uses the Task 60 engine for feedback and completes all four choices', () => {
    let session = createPracticeSession();
    for (const step of practiceSteps) {
      session = selectPracticeChoice(session, step.choices[0].id);
      session = advancePracticeSession(session);
    }

    const result = evaluateLearningAssessment(scn01LearningRubric, {
      rubric_id: scn01LearningRubric.rubric_id,
      evidence: session.responses.map((response) => ({
        item_id: response.itemId,
        rating: response.rating,
        critical_error_candidate_observed: response.criticalErrorCandidateObserved,
      })),
    });

    expect(session.completed).toBe(true);
    expect(result.item_results).toHaveLength(4);
    expect(result.item_results.every((item) => item.feedback.length > 0)).toBe(true);
    expect(result.clinical_competence_determined).toBe(false);
    expect(result.certification_eligible).toBe(false);
  });
});
