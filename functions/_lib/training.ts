import { authenticate } from './auth';
import { json } from './json';
import type { Env, SessionUser } from './types';

export const TRAINING_AGGREGATE_MINIMUM = 10;
export const TRAINING_SCENARIO = {
  scenarioId: 'SCN-01',
  scenarioVersion: '1',
  rubricId: 'RUBRIC-SCN-01-DRAFT',
  rubricVersion: '0.1.0-pending-review',
} as const;

export type TrainingRole = 'training_admin' | 'instructor';

export interface TrainingActor {
  user: SessionUser;
  role: TrainingRole;
}

export interface TrainingAggregateRow {
  assignmentId: string;
  completedCount: number;
  needsReviewCount: number;
  developingCount: number;
  observedCount: number;
  unscoredCount: number;
}

type CreateGroupInput = {
  labelCode: keyof typeof SYNTHETIC_GROUP_LABELS;
  name: string;
  participantCount: number;
};

type CreateAssignmentInput = typeof TRAINING_SCENARIO;

const SYNTHETIC_GROUP_LABELS = {
  alpha: 'קבוצת תרגול אלפא',
  beta: 'קבוצת תרגול בטא',
  gamma: 'קבוצת תרגול גמא',
  'privacy-small': 'קבוצה קטנה לבדיקת חיסיון',
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function parseCreateGroupInput(value: unknown): CreateGroupInput | null {
  if (!isRecord(value) || !hasExactKeys(value, ['labelCode', 'participantCount'])) return null;
  const labelCode = value.labelCode;
  const participantCount = value.participantCount;
  if (
    typeof labelCode !== 'string' ||
    !(labelCode in SYNTHETIC_GROUP_LABELS) ||
    typeof participantCount !== 'number' ||
    !Number.isInteger(participantCount) ||
    participantCount < 1 ||
    participantCount > 200
  ) {
    return null;
  }
  const safeLabelCode = labelCode as keyof typeof SYNTHETIC_GROUP_LABELS;
  return { labelCode: safeLabelCode, name: SYNTHETIC_GROUP_LABELS[safeLabelCode], participantCount };
}

export function parseCreateAssignmentInput(value: unknown): CreateAssignmentInput | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['scenarioId', 'scenarioVersion', 'rubricId', 'rubricVersion'])
  ) {
    return null;
  }

  return Object.entries(TRAINING_SCENARIO).every(([key, expected]) => value[key] === expected)
    ? TRAINING_SCENARIO
    : null;
}

export function canManageTrainingGroup(
  role: TrainingRole,
  userId: string,
  ownerId: string,
): boolean {
  return role === 'training_admin' || (role === 'instructor' && userId === ownerId);
}

export function toSafeTrainingAggregate(row: TrainingAggregateRow) {
  const completedCount = Math.max(0, Number(row.completedCount) || 0);
  if (completedCount < TRAINING_AGGREGATE_MINIMUM) {
    return {
      assignmentId: row.assignmentId,
      suppressed: true as const,
      minimumRequired: TRAINING_AGGREGATE_MINIMUM,
    };
  }

  const counts = {
    needsReview: Math.max(0, Number(row.needsReviewCount) || 0),
    developing: Math.max(0, Number(row.developingCount) || 0),
    practiceEvidenceObserved: Math.max(0, Number(row.observedCount) || 0),
    unscored: Math.max(0, Number(row.unscoredCount) || 0),
  };
  const counted = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return {
    assignmentId: row.assignmentId,
    suppressed: false as const,
    completedCount,
    counts,
    completionBreakdownAvailable: counted === completedCount,
  };
}

export async function authenticateTrainingActor(
  request: Request,
  env: Env,
): Promise<TrainingActor | Response> {
  const authResult = await authenticate(request, env);
  if (authResult instanceof Response) return authResult;

  const roleRow = await env.DB.prepare(
    `SELECT role FROM training_roles
     WHERE user_id = ?1 AND scope = 'synthetic_only'`,
  )
    .bind(authResult.id)
    .first<{ role: TrainingRole }>();

  if (!roleRow || (roleRow.role !== 'training_admin' && roleRow.role !== 'instructor')) {
    return json({ message: 'Synthetic training access required' }, { status: 403 });
  }

  return { user: authResult, role: roleRow.role };
}
