import { describe, expect, it } from 'vitest';
import { validateAssessmentContract, validateRubric } from './contract';
import { AssessmentSubmissionError, evaluateLearningAssessment } from './engine';
import { scn01AssessmentInput, scn01LearningRubric } from './scn01Rubric';
import type { LearningAssessmentRubric } from './types';

const allEvidence = (rating: 'not_demonstrated' | 'partially_demonstrated' | 'demonstrated') =>
  scn01LearningRubric.items.map((item) => ({ item_id: item.item_id, rating }));

describe('learning assessment contract', () => {
  it('accepts the Task 58 input contract and draft rubric', () => {
    expect(validateAssessmentContract(scn01AssessmentInput)).toEqual({ ok: true, errors: [] });
    expect(validateRubric(scn01LearningRubric)).toEqual({ ok: true, errors: [] });
  });

  it('rejects prohibited clinical, certification, or patient-data claims', () => {
    const invalidRubric = {
      ...scn01LearningRubric,
      input_contract: {
        ...scn01AssessmentInput,
        assessment_items: [
          { ...scn01AssessmentInput.assessment_items[0], certification_claim_allowed: true },
        ],
      },
    } as unknown as LearningAssessmentRubric;

    expect(validateRubric(invalidRubric)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.stringContaining('prohibited claim')]),
    });
  });
});

describe('learning assessment calculation and feedback', () => {
  it('calculates a full provisional practice score without credential claims', () => {
    const result = evaluateLearningAssessment(scn01LearningRubric, {
      rubric_id: scn01LearningRubric.rubric_id,
      evidence: allEvidence('demonstrated'),
    });

    expect(result.provisional_score).toEqual({
      earned_points: 8,
      max_points: 8,
      percent: 100,
      band: 'practice_evidence_observed',
    });
    expect(result.competency_results).toHaveLength(4);
    expect(result.needs_instructor_review).toBe(true);
    expect(result.certification_eligible).toBe(false);
    expect(result.clinical_competence_determined).toBe(false);
    expect(result.overall_feedback.join(' ')).toContain('אינו הסמכה');
  });

  it('calculates partial evidence and groups results by competency', () => {
    const result = evaluateLearningAssessment(scn01LearningRubric, {
      rubric_id: scn01LearningRubric.rubric_id,
      evidence: [
        { item_id: 'A60-001', rating: 'demonstrated' },
        { item_id: 'A60-002', rating: 'partially_demonstrated' },
        { item_id: 'A60-003', rating: 'not_demonstrated' },
        { item_id: 'A60-004', rating: 'partially_demonstrated' },
      ],
    });

    expect(result.provisional_score).toEqual({
      earned_points: 4,
      max_points: 8,
      percent: 50,
      band: 'developing',
    });
    expect(result.competency_results).toEqual([
      expect.objectContaining({ competency_id: 'BLS-C01', score_percent: 100 }),
      expect.objectContaining({ competency_id: 'BLS-C02', score_percent: 50 }),
      expect.objectContaining({ competency_id: 'BLS-C03', score_percent: 0 }),
      expect.objectContaining({ competency_id: 'BLS-C10', score_percent: 50 }),
    ]);
  });

  it('treats missing evidence as not assessed and keeps the score in range', () => {
    const result = evaluateLearningAssessment(scn01LearningRubric, {
      rubric_id: scn01LearningRubric.rubric_id,
      evidence: [],
    });

    expect(result.provisional_score).toEqual({
      earned_points: 0,
      max_points: 8,
      percent: 0,
      band: 'needs_review',
    });
    expect(result.item_results.every((item) => item.rating === 'not_assessed')).toBe(true);
    expect(result.item_results.every((item) => item.feedback.length > 0)).toBe(true);
  });

  it('reports a critical-error candidate without changing the provisional score', () => {
    const baseline = evaluateLearningAssessment(scn01LearningRubric, {
      rubric_id: scn01LearningRubric.rubric_id,
      evidence: allEvidence('partially_demonstrated'),
    });
    const flagged = evaluateLearningAssessment(scn01LearningRubric, {
      rubric_id: scn01LearningRubric.rubric_id,
      evidence: [
        ...allEvidence('partially_demonstrated').slice(0, 1),
        {
          item_id: 'A60-002',
          rating: 'partially_demonstrated',
          critical_error_candidate_observed: true,
        },
        ...allEvidence('partially_demonstrated').slice(2),
      ],
    });

    expect(flagged.provisional_score).toEqual(baseline.provisional_score);
    expect(flagged.critical_error_candidates_observed).toBe(1);
    expect(flagged.item_results[1].feedback).toHaveLength(2);
    expect(flagged.overall_feedback.join(' ')).toContain('מועמדים לטעות קריטית');
  });

  it('rejects unknown and duplicate item evidence', () => {
    expect(() =>
      evaluateLearningAssessment(scn01LearningRubric, {
        rubric_id: scn01LearningRubric.rubric_id,
        evidence: [{ item_id: 'A60-999', rating: 'demonstrated' }],
      }),
    ).toThrow(AssessmentSubmissionError);

    expect(() =>
      evaluateLearningAssessment(scn01LearningRubric, {
        rubric_id: scn01LearningRubric.rubric_id,
        evidence: [
          { item_id: 'A60-001', rating: 'demonstrated' },
          { item_id: 'A60-001', rating: 'demonstrated' },
        ],
      }),
    ).toThrow('Duplicate assessment evidence');
  });

  it('does not digitally score an instructor-only practical skill', () => {
    const instructorItem = {
      ...scn01LearningRubric.items[0],
      assessment_domain: 'practical_skill' as const,
      prompt_type: 'instructor_observation' as const,
      scoring_mode: 'instructor_only' as const,
      instructor_observation_required: true,
    };
    const instructorRubric = {
      ...scn01LearningRubric,
      input_contract: {
        ...scn01AssessmentInput,
        assessment_items: [instructorItem],
      },
      items: [instructorItem],
    } satisfies LearningAssessmentRubric;

    expect(() =>
      evaluateLearningAssessment(instructorRubric, {
        rubric_id: instructorRubric.rubric_id,
        evidence: [{ item_id: instructorItem.item_id, rating: 'demonstrated' }],
      }),
    ).toThrow('requires instructor observation');

    const result = evaluateLearningAssessment(instructorRubric, {
      rubric_id: instructorRubric.rubric_id,
      evidence: [],
    });
    expect(result.provisional_score).toEqual({
      earned_points: 0,
      max_points: 0,
      percent: null,
      band: 'not_scored',
    });
  });
});
