import rubricAssetUrl from './scn01Rubric.runtime.json?url';
import { validateRubric } from './contract';
import type { LearningAssessmentRubric, RubricItem } from './types';

export interface RuntimeLearningRubric extends LearningAssessmentRubric {
  review_reason_presentation: Record<string, {
    label: string;
    tone: string;
    explanation: string;
  }>;
}

interface RuntimeRubricAsset extends Omit<RuntimeLearningRubric, 'input_contract' | 'items'> {
  input_contract: Omit<LearningAssessmentRubric['input_contract'], 'assessment_items'>;
  items: readonly RubricItem[];
}

let cachedRubric: Promise<RuntimeLearningRubric | null> | undefined;

export function loadScn01LearningRubric(): Promise<RuntimeLearningRubric | null> {
  cachedRubric ??= fetch(rubricAssetUrl, { credentials: 'same-origin' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Rubric request failed: ${response.status}`);
      const asset = await response.json() as RuntimeRubricAsset;
      const rubric: RuntimeLearningRubric = {
        ...asset,
        input_contract: {
          ...asset.input_contract,
          assessment_items: asset.items,
        },
        items: asset.items,
      };
      const validation = validateRubric(rubric);
      if (!validation.ok) throw new Error(`Invalid runtime rubric: ${validation.errors.join('; ')}`);
      return rubric;
    })
    .catch((error: unknown) => {
      if (import.meta.env.DEV) console.error('Failed to load the pending-review practice rubric:', error);
      return null;
    });
  return cachedRubric;
}
