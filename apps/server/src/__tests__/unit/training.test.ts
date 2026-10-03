import { describe, expect, it, vi } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../../../functions/api/training/[[path]]';
import { signJwt } from '../../../../../functions/_lib/jwt';
import {
  TRAINING_AGGREGATE_MINIMUM,
  canManageTrainingGroup,
  parseCreateAssignmentInput,
  parseCreateGroupInput,
  toSafeTrainingAggregate,
} from '../../../../../functions/_lib/training';
import type { Env } from '../../../../../functions/_lib/types';

type StatementResult = { first?: unknown; all?: unknown[]; run?: unknown };

function createEnv(...statementResults: StatementResult[]): Env {
  const statements = statementResults.map((result) => ({
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(result.first ?? null),
    all: vi.fn().mockResolvedValue({ results: result.all ?? [] }),
    run: vi.fn().mockResolvedValue(result.run ?? { success: true }),
  }));
  return {
    DB: {
      prepare: vi.fn(() => statements.shift() ?? {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
    },
    JWT_SECRET: 'test-secret',
  } as unknown as Env;
}

async function authHeader(userId = 'instructor-1') {
  const token = await signJwt(
    {
      id: userId,
      email: `${userId}@example.invalid`,
      name: 'Synthetic Instructor',
      picture: null,
      isAdmin: false,
    },
    'test-secret',
  );
  return `Bearer ${token}`;
}

describe('training permission contract', () => {
  it('uses exact, bounded inputs and a closed exercise allowlist', () => {
    expect(parseCreateGroupInput({ labelCode: 'alpha', participantCount: 12 })).toEqual({
      labelCode: 'alpha',
      name: 'קבוצת תרגול אלפא',
      participantCount: 12,
    });
    expect(parseCreateGroupInput({ labelCode: 'alpha', participantCount: 12, email: 'x@y.z' })).toBeNull();
    expect(parseCreateGroupInput({ labelCode: 'person-name', participantCount: 12 })).toBeNull();
    expect(parseCreateAssignmentInput({
      scenarioId: 'SCN-02',
      scenarioVersion: '1',
      rubricId: 'RUBRIC-SCN-01-DRAFT',
      rubricVersion: '0.1.0-pending-review',
    })).toBeNull();
  });

  it('allows only a training admin or the owning instructor to manage a group', () => {
    expect(canManageTrainingGroup('training_admin', 'admin', 'another-owner')).toBe(true);
    expect(canManageTrainingGroup('instructor', 'owner', 'owner')).toBe(true);
    expect(canManageTrainingGroup('instructor', 'other', 'owner')).toBe(false);
  });

  it('suppresses cohorts below ten completions without returning bucket counts', () => {
    const result = toSafeTrainingAggregate({
      assignmentId: 'assignment-small',
      completedCount: TRAINING_AGGREGATE_MINIMUM - 1,
      needsReviewCount: 2,
      developingCount: 3,
      observedCount: 4,
      unscoredCount: 0,
    });
    expect(result).toEqual({
      assignmentId: 'assignment-small',
      suppressed: true,
      minimumRequired: 10,
    });
    expect(JSON.stringify(result)).not.toMatch(/needsReview|developing|observed/);
  });

  it('rejects unauthenticated group creation before querying D1', async () => {
    const env = createEnv();
    const response = await onRequestPost({
      env,
      request: new Request('https://example.com/api/training/groups', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ labelCode: 'alpha', participantCount: 12 }),
      }),
    });
    expect(response.status).toBe(401);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('rejects an authenticated user without an explicit synthetic training role', async () => {
    const env = createEnv({ first: null });
    const response = await onRequestPost({
      env,
      request: new Request('https://example.com/api/training/groups', {
        method: 'POST',
        headers: {
          authorization: await authHeader('ordinary-user'),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ labelCode: 'alpha', participantCount: 12 }),
      }),
    });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: 'Synthetic training access required' });
  });

  it('blocks cross-group assignment by another instructor', async () => {
    const env = createEnv(
      { first: { role: 'instructor' } },
      {
        first: {
          id: 'group-1',
          name: 'קבוצה',
          ownerId: 'owner-1',
          participantCount: 12,
          isSynthetic: 1,
          archivedAt: null,
        },
      },
    );
    const response = await onRequestPost({
      env,
      request: new Request('https://example.com/api/training/groups/group-1/assignments', {
        method: 'POST',
        headers: {
          authorization: await authHeader('other-instructor'),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: 'SCN-01',
          scenarioVersion: '1',
          rubricId: 'RUBRIC-SCN-01-DRAFT',
          rubricVersion: '0.1.0-pending-review',
        }),
      }),
    });
    expect(response.status).toBe(403);
    expect(env.DB.prepare).toHaveBeenCalledTimes(2);
  });

  it('allows the owning instructor to assign the existing SCN-01 contract', async () => {
    const env = createEnv(
      { first: { role: 'instructor' } },
      {
        first: {
          id: 'group-1',
          name: 'קבוצה',
          ownerId: 'instructor-1',
          participantCount: 12,
          isSynthetic: 1,
          archivedAt: null,
        },
      },
      {},
    );
    const response = await onRequestPost({
      env,
      request: new Request('https://example.com/api/training/groups/group-1/assignments', {
        method: 'POST',
        headers: {
          authorization: await authHeader(),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: 'SCN-01',
          scenarioVersion: '1',
          rubricId: 'RUBRIC-SCN-01-DRAFT',
          rubricVersion: '0.1.0-pending-review',
        }),
      }),
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      assignment: {
        groupId: 'group-1',
        scenarioId: 'SCN-01',
        claim: 'learning_feedback_only',
      },
    });
  });

  it('returns a minimized, suppressed summary to the owning instructor', async () => {
    const env = createEnv(
      { first: { role: 'instructor' } },
      {
        first: {
          id: 'group-small',
          name: 'קבוצה קטנה',
          ownerId: 'instructor-1',
          participantCount: 6,
          isSynthetic: 1,
          archivedAt: null,
        },
      },
      {
        all: [{
          assignmentId: 'assignment-small',
          completedCount: 4,
          needsReviewCount: 1,
          developingCount: 2,
          observedCount: 1,
          unscoredCount: 0,
        }],
      },
    );
    const response = await onRequestGet({
      env,
      request: new Request('https://example.com/api/training/groups/group-small/summary', {
        headers: { authorization: await authHeader() },
      }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      group: { id: 'group-small', synthetic: true },
      assignments: [{ assignmentId: 'assignment-small', suppressed: true, minimumRequired: 10 }],
    });
    expect(JSON.stringify(body)).not.toMatch(/email|learner|needsReviewCount/);
  });
});
