import { describe, expect, it } from 'vitest';
import {
  isAdaptiveReviewEventForRubric,
  toAdaptiveReviewEvent,
} from './adaptiveReviewEvents';
import { evaluateLearningAssessment } from './engine';
import { scn01LearningRubric } from './scn01Rubric';

function assessmentResult() {
  return evaluateLearningAssessment(scn01LearningRubric, {
    rubric_id: scn01LearningRubric.rubric_id,
    evidence: [
      { item_id: 'A60-001', rating: 'not_demonstrated' },
      { item_id: 'A60-002', rating: 'partially_demonstrated' },
      { item_id: 'A60-003', rating: 'demonstrated' },
      {
        item_id: 'A60-004',
        rating: 'demonstrated',
        critical_error_candidate_observed: true,
      },
    ],
  });
}

function nestedKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(nestedKeys);
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, nestedValue]) => [key, ...nestedKeys(nestedValue)]);
}

describe('Task 61 adaptive-review event contract', () => {
  it('emits allowlisted outcome identifiers and review signals without free text or PII', () => {
    const event = toAdaptiveReviewEvent(assessmentResult());

    expect(event.outcomes.map((outcome) => outcome.reviewSignal)).toEqual([
      'revisit',
      'reinforce',
      'maintain',
      'revisit',
    ]);
    expect(isAdaptiveReviewEventForRubric(event, scn01LearningRubric)).toBe(true);
    const serialized = JSON.stringify(event);
    const keys = nestedKeys(event);
    expect(keys).not.toContain('feedback');
    expect(keys).not.toContain('prompt');
    expect(serialized).not.toContain('user');
    expect(serialized).not.toContain('patient');
  });

  it('rejects unknown items, mismatched mappings, and extra fields', () => {
    const event = toAdaptiveReviewEvent(assessmentResult());
    expect(
      isAdaptiveReviewEventForRubric(
        { ...event, freeText: 'not allowed' },
        scn01LearningRubric,
      ),
    ).toBe(false);
    expect(
      isAdaptiveReviewEventForRubric(
        {
          ...event,
          outcomes: [{ ...event.outcomes[0], competencyId: 'BLS-C10' }],
        },
        scn01LearningRubric,
      ),
    ).toBe(false);
    expect(
      isAdaptiveReviewEventForRubric(
        { ...event, outcomes: event.outcomes.slice(0, 1) },
        scn01LearningRubric,
      ),
    ).toBe(false);
  });
});
