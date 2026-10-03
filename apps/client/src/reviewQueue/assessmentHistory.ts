import type { StoredAssessmentAttempt } from '../assessment/localStorage';
import type { AssessmentLearningResultRecordedEvent, ReviewSignal } from '../assessment/adaptiveReviewEvents';
import type { LearningAssessmentRubric } from '../assessment/types';

function signalForStoredRating(
  rating: StoredAssessmentAttempt['item_results'][number]['rating'],
  scored: boolean,
  criticalErrorCandidateObserved: boolean,
): ReviewSignal {
  if (criticalErrorCandidateObserved) return 'revisit';
  if (!scored || rating === 'not_assessed') return 'instructor_required';
  if (rating === 'not_demonstrated') return 'revisit';
  if (rating === 'partially_demonstrated') return 'reinforce';
  return 'maintain';
}

export function eventFromStoredAttempt(
  attempt: StoredAssessmentAttempt,
  rubric: LearningAssessmentRubric,
): AssessmentLearningResultRecordedEvent | null {
  if (
    attempt.rubric_id !== rubric.rubric_id ||
    attempt.rubric_version !== rubric.rubric_version ||
    attempt.scenario_id !== rubric.scenario_id
  ) {
    return null;
  }

  const storedById = new Map(attempt.item_results.map((item) => [item.item_id, item]));
  if (storedById.size !== rubric.items.length) return null;

  const outcomes = rubric.items.map((rubricItem) => {
    const stored = storedById.get(rubricItem.item_id);
    if (
      !stored ||
      stored.competency_id !== rubricItem.competency_id ||
      stored.outcome_id !== rubricItem.outcome_id
    ) {
      return null;
    }
    return {
      itemId: stored.item_id,
      outcomeId: stored.outcome_id,
      competencyId: stored.competency_id,
      reviewSignal: signalForStoredRating(
        stored.rating,
        rubricItem.scoring_mode === 'rubric_pending',
        stored.critical_error_candidate_observed,
      ),
      criticalErrorCandidateObserved: stored.critical_error_candidate_observed,
    };
  });

  if (outcomes.some((outcome) => outcome === null)) return null;
  return {
    schemaVersion: 1,
    event: 'assessment_learning_result_recorded',
    assessmentId: rubric.rubric_id,
    rubricVersion: rubric.rubric_version,
    scenarioId: rubric.scenario_id,
    claim: 'learning_feedback_only',
    outcomes: outcomes as AssessmentLearningResultRecordedEvent['outcomes'],
  };
}
