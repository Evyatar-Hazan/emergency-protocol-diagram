import { scn01LearningRubric } from '../assessment/scn01Rubric';
import { PRACTICE_SESSION_SCHEMA_VERSION } from '../components/PracticeMode/practiceSession';

export const INSTRUCTOR_AGGREGATE_MINIMUM = 10;
export const SYNTHETIC_ASSIGNMENT_CONTRACT = {
  scenarioId: 'SCN-01',
  scenarioVersion: String(PRACTICE_SESSION_SCHEMA_VERSION),
  rubricId: scn01LearningRubric.rubric_id,
  rubricVersion: scn01LearningRubric.rubric_version,
} as const;

export interface SyntheticAggregate {
  completedCount: number;
  needsReviewCount: number;
  developingCount: number;
  observedCount: number;
  unscoredCount: number;
}

export interface SyntheticAssignment {
  id: string;
  scenarioId: 'SCN-01';
  scenarioVersion: string;
  rubricId: string;
  rubricVersion: string;
  status: 'assigned';
}

export interface SyntheticTrainingGroup {
  id: string;
  name: string;
  participantCount: number;
  synthetic: true;
  assignment: SyntheticAssignment | null;
  aggregate: SyntheticAggregate;
}

export const SYNTHETIC_TRAINING_GROUPS: readonly SyntheticTrainingGroup[] = [
  {
    id: 'synthetic-group-alpha',
    name: 'קבוצת תרגול אלפא',
    participantCount: 16,
    synthetic: true,
    assignment: {
      id: 'assignment-alpha-scn01',
      ...SYNTHETIC_ASSIGNMENT_CONTRACT,
      status: 'assigned',
    },
    aggregate: {
      completedCount: 12,
      needsReviewCount: 2,
      developingCount: 5,
      observedCount: 5,
      unscoredCount: 0,
    },
  },
  {
    id: 'synthetic-group-small',
    name: 'קבוצה קטנה לבדיקת חיסיון',
    participantCount: 6,
    synthetic: true,
    assignment: null,
    aggregate: {
      completedCount: 4,
      needsReviewCount: 1,
      developingCount: 2,
      observedCount: 1,
      unscoredCount: 0,
    },
  },
];

export function assignScn01(group: SyntheticTrainingGroup): SyntheticTrainingGroup {
  if (group.assignment) return group;
  return {
    ...group,
    assignment: {
      id: `local-${group.id}-scn01`,
      ...SYNTHETIC_ASSIGNMENT_CONTRACT,
      status: 'assigned',
    },
  };
}

export function buildAggregateView(group: SyntheticTrainingGroup) {
  if (group.aggregate.completedCount < INSTRUCTOR_AGGREGATE_MINIMUM) {
    return {
      suppressed: true as const,
      minimumRequired: INSTRUCTOR_AGGREGATE_MINIMUM,
    };
  }

  const { completedCount } = group.aggregate;
  return {
    suppressed: false as const,
    completedCount,
    completionPercent: Math.round((completedCount / group.participantCount) * 100),
    bands: [
      { id: 'needs_review', label: 'דורש חזרה', count: group.aggregate.needsReviewCount },
      { id: 'developing', label: 'בתהליך', count: group.aggregate.developingCount },
      {
        id: 'practice_evidence_observed',
        label: 'נצפתה עדות בתרגול',
        count: group.aggregate.observedCount,
      },
      { id: 'unscored', label: 'ללא ציון', count: group.aggregate.unscoredCount },
    ],
  };
}
