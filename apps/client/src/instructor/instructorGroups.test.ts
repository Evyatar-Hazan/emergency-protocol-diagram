import { describe, expect, it } from 'vitest';
import {
  INSTRUCTOR_AGGREGATE_MINIMUM,
  SYNTHETIC_TRAINING_GROUPS,
  assignScn01,
  buildAggregateView,
} from './instructorGroups';

describe('synthetic instructor groups', () => {
  it('assigns the existing SCN-01 and assessment contracts without duplicating them', () => {
    const assigned = assignScn01(SYNTHETIC_TRAINING_GROUPS[1]);
    expect(assigned.assignment).toMatchObject({
      scenarioId: 'SCN-01',
      scenarioVersion: '1',
      rubricId: 'RUBRIC-SCN-01-DRAFT',
      rubricVersion: '0.1.0-pending-review',
    });
  });

  it('suppresses a small cohort without leaking counts', () => {
    const aggregate = buildAggregateView(SYNTHETIC_TRAINING_GROUPS[1]);
    expect(aggregate).toEqual({
      suppressed: true,
      minimumRequired: INSTRUCTOR_AGGREGATE_MINIMUM,
    });
    expect(JSON.stringify(aggregate)).not.toContain('completedCount');
  });

  it('returns only aggregate bands for a sufficiently large synthetic cohort', () => {
    const aggregate = buildAggregateView(SYNTHETIC_TRAINING_GROUPS[0]);
    expect(aggregate).toMatchObject({
      suppressed: false,
      completedCount: 12,
      completionPercent: 75,
    });
    expect(JSON.stringify(aggregate)).not.toMatch(/email|name|user|learner/i);
  });
});
