import { describe, expect, it } from 'vitest';
import { evaluateLearningAssessment } from './engine';
import {
  ASSESSMENT_STORAGE_KEY,
  loadAssessmentAttempts,
  saveAssessmentAttempt,
} from './localStorage';
import { scn01LearningRubric } from './scn01Rubric';

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

function result() {
  return evaluateLearningAssessment(scn01LearningRubric, {
    rubric_id: scn01LearningRubric.rubric_id,
    evidence: scn01LearningRubric.items.map((item) => ({
      item_id: item.item_id,
      rating: 'partially_demonstrated' as const,
    })),
  });
}

function nestedKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(nestedKeys);
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, nestedValue]) => [key, ...nestedKeys(nestedValue)]);
}

describe('local assessment storage', () => {
  it('stores only the allowlisted structured learning record', () => {
    const storage = memoryStorage();
    saveAssessmentAttempt(storage, result());

    const serialized = storage.getItem(ASSESSMENT_STORAGE_KEY) ?? '';
    const attempts = loadAssessmentAttempts(storage);
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      claim: 'learning_feedback_only',
      scenario_id: 'SCN-01',
      score_percent: 50,
    });
    const keys = nestedKeys(JSON.parse(serialized) as unknown);
    expect(keys).not.toContain('prompt');
    expect(keys).not.toContain('feedback');
    expect(serialized).not.toContain('patient');
    expect(serialized).not.toContain('user');
  });

  it('rejects malformed or expanded stored records', () => {
    const storage = memoryStorage();
    storage.setItem(ASSESSMENT_STORAGE_KEY, '{not-json');
    expect(loadAssessmentAttempts(storage)).toEqual([]);

    storage.setItem(
      ASSESSMENT_STORAGE_KEY,
      JSON.stringify([{ ...saveAssessmentAttempt(memoryStorage(), result())[0], free_text: 'no' }]),
    );
    expect(loadAssessmentAttempts(storage)).toEqual([]);

    const attempt = saveAssessmentAttempt(memoryStorage(), result())[0];
    storage.setItem(
      ASSESSMENT_STORAGE_KEY,
      JSON.stringify([
        {
          ...attempt,
          item_results: [{ ...attempt.item_results[0], patient_name: 'not allowed' }],
        },
      ]),
    );
    expect(loadAssessmentAttempts(storage)).toEqual([]);
  });

  it('caps local history at twenty attempts', () => {
    const storage = memoryStorage();
    for (let index = 0; index < 25; index += 1) saveAssessmentAttempt(storage, result());
    expect(loadAssessmentAttempts(storage)).toHaveLength(20);
  });
});
