import type { EvidenceRating, LearningAssessmentResult, LearningProgressBand } from './types';

export const ASSESSMENT_STORAGE_KEY = 'epd.learning-assessment.v1';
const MAX_STORED_ATTEMPTS = 20;

export interface StoredAssessmentAttempt {
  schema_version: 1;
  rubric_id: string;
  rubric_version: string;
  scenario_id: string;
  claim: 'learning_feedback_only';
  score_percent: number | null;
  result_band: LearningProgressBand | 'not_scored';
  item_results: readonly {
    item_id: string;
    competency_id: string;
    outcome_id: string;
    rating: EvidenceRating;
    critical_error_candidate_observed: boolean;
  }[];
}

function toStoredAttempt(result: LearningAssessmentResult): StoredAssessmentAttempt {
  return {
    schema_version: 1,
    rubric_id: result.rubric_id,
    rubric_version: result.rubric_version,
    scenario_id: result.scenario_id,
    claim: 'learning_feedback_only',
    score_percent: result.provisional_score.percent,
    result_band: result.provisional_score.band,
    item_results: result.item_results.map((item) => ({
      item_id: item.item_id,
      competency_id: item.competency_id,
      outcome_id: item.outcome_id,
      rating: item.rating,
      critical_error_candidate_observed: item.critical_error_candidate_observed,
    })),
  };
}

function isStoredAttempt(value: unknown): value is StoredAssessmentAttempt {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const exactKeys = [
    'claim',
    'item_results',
    'result_band',
    'rubric_id',
    'rubric_version',
    'scenario_id',
    'schema_version',
    'score_percent',
  ].sort();
  const actualKeys = Object.keys(record).sort();
  const allowedBands = new Set([
    'needs_review',
    'developing',
    'practice_evidence_observed',
    'not_scored',
  ]);
  const allowedRatings = new Set([
    'not_assessed',
    'not_demonstrated',
    'partially_demonstrated',
    'demonstrated',
  ]);
  const itemResultsAreValid =
    Array.isArray(record.item_results) &&
    record.item_results.every((item) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) return false;
      const itemRecord = item as Record<string, unknown>;
      const itemKeys = [
        'competency_id',
        'critical_error_candidate_observed',
        'item_id',
        'outcome_id',
        'rating',
      ].sort();
      const actualItemKeys = Object.keys(itemRecord).sort();
      return (
        actualItemKeys.length === itemKeys.length &&
        actualItemKeys.every((key, index) => key === itemKeys[index]) &&
        typeof itemRecord.item_id === 'string' &&
        typeof itemRecord.competency_id === 'string' &&
        typeof itemRecord.outcome_id === 'string' &&
        allowedRatings.has(itemRecord.rating as EvidenceRating) &&
        typeof itemRecord.critical_error_candidate_observed === 'boolean'
      );
    });
  return (
    actualKeys.length === exactKeys.length &&
    actualKeys.every((key, index) => key === exactKeys[index]) &&
    record.schema_version === 1 &&
    record.claim === 'learning_feedback_only' &&
    typeof record.rubric_id === 'string' &&
    typeof record.rubric_version === 'string' &&
    typeof record.scenario_id === 'string' &&
    (record.score_percent === null || typeof record.score_percent === 'number') &&
    allowedBands.has(record.result_band as string) &&
    itemResultsAreValid
  );
}

export function loadAssessmentAttempts(storage: Storage): StoredAssessmentAttempt[] {
  const serialized = storage.getItem(ASSESSMENT_STORAGE_KEY);
  if (!serialized) return [];
  try {
    const parsed: unknown = JSON.parse(serialized);
    return Array.isArray(parsed) && parsed.every(isStoredAttempt) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAssessmentAttempt(
  storage: Storage,
  result: LearningAssessmentResult,
): StoredAssessmentAttempt[] {
  const attempts = [...loadAssessmentAttempts(storage), toStoredAttempt(result)].slice(
    -MAX_STORED_ATTEMPTS,
  );
  storage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(attempts));
  return attempts;
}
