import { describe, expect, it } from 'vitest';
import runtimeRubric from './scn01Rubric.runtime.json';
import { scn01LearningRubric } from './scn01Rubric';

describe('SCN-01 runtime rubric asset', () => {
  it('matches the canonical pending-review rubric without duplicating its item array', () => {
    const { review_reason_presentation: presentation, ...rubricAsset } = runtimeRubric;
    expect(Object.keys(presentation)).toEqual([
      'bookmark',
      'revisit',
      'reinforce',
      'maintain',
      'instructor_required',
    ]);
    expect({
      ...rubricAsset,
      input_contract: {
        ...rubricAsset.input_contract,
        assessment_items: rubricAsset.items,
      },
    }).toEqual(scn01LearningRubric);
  });
});
