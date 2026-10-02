import type {
  AssessmentDefinitionContract,
  AssessmentItemContract,
  LearningAssessmentRubric,
} from './types';

const ITEM_ID_PATTERN = /^A60-[0-9]{3,}$/;
const SCENARIO_ID_PATTERN = /^SCN-(0[1-9]|1[0-7])$/;
const COMPETENCY_ID_PATTERN = /^BLS-C(0[1-9]|10)$/;
const OUTCOME_ID_PATTERN = /^LO-(0[1-9]|1[0-7])-[0-9]{2}$/;

export interface ContractValidationResult {
  ok: boolean;
  errors: readonly string[];
}

function validateItem(item: AssessmentItemContract): string[] {
  const errors: string[] = [];

  if (!ITEM_ID_PATTERN.test(item.item_id)) errors.push(`${item.item_id}: invalid item_id`);
  if (!SCENARIO_ID_PATTERN.test(item.scenario_id)) errors.push(`${item.item_id}: invalid scenario_id`);
  if (!COMPETENCY_ID_PATTERN.test(item.competency_id)) {
    errors.push(`${item.item_id}: invalid competency_id`);
  }
  if (!OUTCOME_ID_PATTERN.test(item.outcome_id)) errors.push(`${item.item_id}: invalid outcome_id`);
  if (!item.prompt.trim()) errors.push(`${item.item_id}: prompt is required`);
  if (!item.expected_evidence.trim()) errors.push(`${item.item_id}: expected_evidence is required`);
  if (!item.performance_indicator.trim()) {
    errors.push(`${item.item_id}: performance_indicator is required`);
  }
  if (
    item.clinical_claim_allowed !== false ||
    item.certification_claim_allowed !== false ||
    item.patient_data_allowed !== false
  ) {
    errors.push(`${item.item_id}: prohibited claim or patient-data flag`);
  }
  if (item.assessment_domain === 'practical_skill') {
    if (
      item.prompt_type !== 'instructor_observation' ||
      item.scoring_mode !== 'instructor_only' ||
      item.instructor_observation_required !== true
    ) {
      errors.push(`${item.item_id}: practical_skill must be instructor-only`);
    }
  }
  if (item.review_status === 'approved_for_stated_use') {
    if (
      item.authority_status !== 'confirmed' ||
      item.source_status !== 'verified' ||
      !item.review_reference?.trim()
    ) {
      errors.push(`${item.item_id}: approved item is missing verified review evidence`);
    }
  }

  return errors;
}

export function validateAssessmentContract(
  contract: AssessmentDefinitionContract,
): ContractValidationResult {
  const errors: string[] = [];
  if (contract.schema_version !== '1.0.0') errors.push('unsupported schema_version');
  if (contract.source_task_id !== 58) errors.push('source_task_id must be 58');
  if (!contract.map_version.trim()) errors.push('map_version is required');
  if (contract.intended_use !== 'learning_only') errors.push('intended_use must be learning_only');
  if (contract.assessment_items.length === 0) errors.push('assessment_items must not be empty');

  const itemIds = new Set<string>();
  for (const item of contract.assessment_items) {
    if (itemIds.has(item.item_id)) errors.push(`${item.item_id}: duplicate item_id`);
    itemIds.add(item.item_id);
    errors.push(...validateItem(item));
  }

  return { ok: errors.length === 0, errors };
}

export function validateRubric(rubric: LearningAssessmentRubric): ContractValidationResult {
  const contractResult = validateAssessmentContract(rubric.input_contract);
  const errors = [...contractResult.errors];
  const rubricItemsResult = validateAssessmentContract({
    ...rubric.input_contract,
    assessment_items: rubric.items,
  });
  errors.push(...rubricItemsResult.errors.map((error) => `rubric: ${error}`));
  const contractItems = new Map(
    rubric.input_contract.assessment_items.map((item) => [item.item_id, item]),
  );

  if (rubric.claim_policy !== 'learning_feedback_only') {
    errors.push('rubric claim_policy must be learning_feedback_only');
  }
  if (rubric.items.length !== rubric.input_contract.assessment_items.length) {
    errors.push('rubric item count must match the input contract');
  }
  for (const item of rubric.items) {
    const contractItem = contractItems.get(item.item_id);
    if (!contractItem) {
      errors.push(`${item.item_id}: rubric item is not in the input contract`);
    }
    if (item.scenario_id !== rubric.scenario_id) {
      errors.push(`${item.item_id}: rubric item belongs to a different scenario`);
    }
    if (
      contractItem &&
      (item.scenario_id !== contractItem.scenario_id ||
        item.competency_id !== contractItem.competency_id ||
        item.outcome_id !== contractItem.outcome_id ||
        item.scoring_mode !== contractItem.scoring_mode)
    ) {
      errors.push(`${item.item_id}: rubric mapping differs from the input contract`);
    }
  }

  return { ok: errors.length === 0, errors };
}
