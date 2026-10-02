import type { LearningAssessmentResult, LearningAssessmentRubric } from './types';

export const ADAPTIVE_REVIEW_EVENT_SCHEMA_VERSION = 1 as const;

export type ReviewSignal = 'revisit' | 'reinforce' | 'maintain' | 'instructor_required';

export interface AssessmentLearningResultRecordedEvent {
  schemaVersion: typeof ADAPTIVE_REVIEW_EVENT_SCHEMA_VERSION;
  event: 'assessment_learning_result_recorded';
  assessmentId: string;
  rubricVersion: string;
  scenarioId: string;
  claim: 'learning_feedback_only';
  outcomes: readonly {
    itemId: string;
    outcomeId: string;
    competencyId: string;
    reviewSignal: ReviewSignal;
    criticalErrorCandidateObserved: boolean;
  }[];
}

function toReviewSignal(
  rating: LearningAssessmentResult['item_results'][number]['rating'],
  scored: boolean,
): ReviewSignal {
  if (!scored || rating === 'not_assessed') return 'instructor_required';
  if (rating === 'not_demonstrated') return 'revisit';
  if (rating === 'partially_demonstrated') return 'reinforce';
  return 'maintain';
}

export function toAdaptiveReviewEvent(
  result: LearningAssessmentResult,
): AssessmentLearningResultRecordedEvent {
  return {
    schemaVersion: ADAPTIVE_REVIEW_EVENT_SCHEMA_VERSION,
    event: 'assessment_learning_result_recorded',
    assessmentId: result.rubric_id,
    rubricVersion: result.rubric_version,
    scenarioId: result.scenario_id,
    claim: 'learning_feedback_only',
    outcomes: result.item_results.map((item) => ({
      itemId: item.item_id,
      outcomeId: item.outcome_id,
      competencyId: item.competency_id,
      reviewSignal: item.critical_error_candidate_observed
        ? 'revisit'
        : toReviewSignal(item.rating, item.scored),
      criticalErrorCandidateObserved: item.critical_error_candidate_observed,
    })),
  };
}

export function isAdaptiveReviewEventForRubric(
  input: unknown,
  rubric: LearningAssessmentRubric,
): input is AssessmentLearningResultRecordedEvent {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return false;
  const event = input as Record<string, unknown>;
  const exactKeys = [
    'assessmentId',
    'claim',
    'event',
    'outcomes',
    'rubricVersion',
    'scenarioId',
    'schemaVersion',
  ].sort();
  const actualKeys = Object.keys(event).sort();
  if (
    actualKeys.length !== exactKeys.length ||
    !actualKeys.every((key, index) => key === exactKeys[index]) ||
    event.schemaVersion !== ADAPTIVE_REVIEW_EVENT_SCHEMA_VERSION ||
    event.event !== 'assessment_learning_result_recorded' ||
    event.assessmentId !== rubric.rubric_id ||
    event.rubricVersion !== rubric.rubric_version ||
    event.scenarioId !== rubric.scenario_id ||
    event.claim !== 'learning_feedback_only' ||
    !Array.isArray(event.outcomes)
  ) {
    return false;
  }

  if (event.outcomes.length !== rubric.items.length) return false;
  const rubricItems = new Map(rubric.items.map((item) => [item.item_id, item]));
  const seenItemIds = new Set<string>();
  const allowedSignals = new Set<ReviewSignal>([
    'revisit',
    'reinforce',
    'maintain',
    'instructor_required',
  ]);
  return event.outcomes.every((value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const outcome = value as Record<string, unknown>;
    const outcomeKeys = [
      'competencyId',
      'criticalErrorCandidateObserved',
      'itemId',
      'outcomeId',
      'reviewSignal',
    ].sort();
    const actualOutcomeKeys = Object.keys(outcome).sort();
    const rubricItem = typeof outcome.itemId === 'string' ? rubricItems.get(outcome.itemId) : null;
    const valid =
      actualOutcomeKeys.length === outcomeKeys.length &&
      actualOutcomeKeys.every((key, index) => key === outcomeKeys[index]) &&
      rubricItem !== undefined &&
      outcome.outcomeId === rubricItem?.outcome_id &&
      outcome.competencyId === rubricItem?.competency_id &&
      allowedSignals.has(outcome.reviewSignal as ReviewSignal) &&
      typeof outcome.criticalErrorCandidateObserved === 'boolean';
    if (!valid || typeof outcome.itemId !== 'string' || seenItemIds.has(outcome.itemId)) return false;
    seenItemIds.add(outcome.itemId);
    return true;
  });
}
