export const ASSESSMENT_SCHEMA_VERSION = '1.0.0' as const;
export const ASSESSMENT_RESULT_SCHEMA_VERSION = 1 as const;

export type ReviewStatus =
  | 'pending'
  | 'in_review'
  | 'changes_requested'
  | 'scope_blocked'
  | 'approved_for_stated_use'
  | 'rejected'
  | 'expired'
  | 'withdrawn';

export type AuthorityStatus = 'unknown' | 'unassigned' | 'nominated' | 'confirmed' | 'declined';
export type SourceStatus = 'missing' | 'pending' | 'verified' | 'rejected';
export type AssessmentDomain =
  | 'knowledge'
  | 'decision_reasoning'
  | 'communication'
  | 'practical_skill';
export type PromptType =
  | 'ordering'
  | 'branch_choice'
  | 'short_explanation'
  | 'handoff'
  | 'instructor_observation';
export type ScoringMode = 'unscored_feedback' | 'rubric_pending' | 'instructor_only';

export interface AssessmentItemContract {
  item_id: string;
  scenario_id: string;
  competency_id: string;
  outcome_id: string;
  assessment_domain: AssessmentDomain;
  prompt_type: PromptType;
  prompt: string;
  expected_evidence: string;
  performance_indicator: string;
  critical_error_candidates: readonly string[];
  scoring_mode: ScoringMode;
  review_status: ReviewStatus;
  authority_status: AuthorityStatus;
  source_status: SourceStatus;
  review_flags?: readonly string[];
  clinical_claim_allowed: false;
  certification_claim_allowed: false;
  patient_data_allowed: false;
  instructor_observation_required?: boolean;
  review_reference?: string | null;
}

export interface AssessmentDefinitionContract {
  schema_version: typeof ASSESSMENT_SCHEMA_VERSION;
  source_task_id: 58;
  map_version: string;
  intended_use: 'learning_only';
  learner_data_mode: 'anonymous_practice' | 'pseudonymous_learning_record';
  assessment_items: readonly AssessmentItemContract[];
}

export type EvidenceRating =
  | 'not_assessed'
  | 'not_demonstrated'
  | 'partially_demonstrated'
  | 'demonstrated';

export interface RubricFeedback {
  not_assessed: string;
  not_demonstrated: string;
  partially_demonstrated: string;
  demonstrated: string;
  critical_candidate: string;
}

export interface RubricItem extends AssessmentItemContract {
  max_points: 2;
  feedback: RubricFeedback;
}

export interface LearningAssessmentRubric {
  rubric_id: string;
  rubric_version: string;
  title: string;
  scenario_id: string;
  status: 'draft_pending_instructor_review';
  claim_policy: 'learning_feedback_only';
  input_contract: AssessmentDefinitionContract;
  items: readonly RubricItem[];
}

export interface AssessmentEvidence {
  item_id: string;
  rating: EvidenceRating;
  critical_error_candidate_observed?: boolean;
}

export interface AssessmentSubmission {
  rubric_id: string;
  evidence: readonly AssessmentEvidence[];
}

export type LearningProgressBand = 'needs_review' | 'developing' | 'practice_evidence_observed';

export interface ItemAssessmentResult {
  item_id: string;
  competency_id: string;
  outcome_id: string;
  rating: EvidenceRating;
  earned_points: number;
  max_points: number;
  scored: boolean;
  critical_error_candidate_observed: boolean;
  feedback: readonly string[];
}

export interface CompetencyAssessmentResult {
  competency_id: string;
  earned_points: number;
  max_points: number;
  score_percent: number | null;
  band: LearningProgressBand | 'not_scored';
}

export interface LearningAssessmentResult {
  schema_version: typeof ASSESSMENT_RESULT_SCHEMA_VERSION;
  rubric_id: string;
  rubric_version: string;
  scenario_id: string;
  claim: 'learning_feedback_only';
  provisional_score: {
    earned_points: number;
    max_points: number;
    percent: number | null;
    band: LearningProgressBand | 'not_scored';
  };
  item_results: readonly ItemAssessmentResult[];
  competency_results: readonly CompetencyAssessmentResult[];
  overall_feedback: readonly string[];
  critical_error_candidates_observed: number;
  needs_instructor_review: boolean;
  certification_eligible: false;
  clinical_competence_determined: false;
}
