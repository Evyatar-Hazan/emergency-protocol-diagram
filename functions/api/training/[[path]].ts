import { empty, json } from '../../_lib/json';
import {
  authenticateTrainingActor,
  canManageTrainingGroup,
  parseCreateAssignmentInput,
  parseCreateGroupInput,
  toSafeTrainingAggregate,
  type TrainingAggregateRow,
} from '../../_lib/training';
import type { Env } from '../../_lib/types';

type Context = { request: Request; env: Env };

function pathSegments(request: Request): string[] {
  return new URL(request.url).pathname
    .replace(/^\/api\/training\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);
}

async function readGroup(env: Env, groupId: string) {
  return env.DB.prepare(
    `SELECT id, name, owner_id AS ownerId, participant_count AS participantCount,
            is_synthetic AS isSynthetic, archived_at AS archivedAt
     FROM training_groups WHERE id = ?1`,
  )
    .bind(groupId)
    .first<Record<string, string | number | null>>();
}

export async function onRequestOptions(): Promise<Response> {
  return empty();
}

export async function onRequestGet(context: Context): Promise<Response> {
  const actor = await authenticateTrainingActor(context.request, context.env);
  if (actor instanceof Response) return actor;
  const segments = pathSegments(context.request);

  if (segments.length === 1 && segments[0] === 'groups') {
    const statement = actor.role === 'training_admin'
      ? context.env.DB.prepare(
          `SELECT id, name, participant_count AS participantCount, archived_at AS archivedAt
           FROM training_groups WHERE is_synthetic = 1 ORDER BY created_at DESC`,
        )
      : context.env.DB.prepare(
          `SELECT id, name, participant_count AS participantCount, archived_at AS archivedAt
           FROM training_groups
           WHERE is_synthetic = 1 AND owner_id = ?1 ORDER BY created_at DESC`,
        ).bind(actor.user.id);
    const { results } = await statement.all<Record<string, string | number | null>>();
    return json({ groups: results });
  }

  if (segments.length === 3 && segments[0] === 'groups' && segments[2] === 'summary') {
    const group = await readGroup(context.env, segments[1]);
    if (!group) return json({ message: 'Synthetic group not found' }, { status: 404 });
    if (
      Number(group.isSynthetic) !== 1 ||
      !canManageTrainingGroup(actor.role, actor.user.id, String(group.ownerId))
    ) {
      return json({ message: 'Group access denied' }, { status: 403 });
    }

    const { results } = await context.env.DB.prepare(
      `SELECT a.id AS assignmentId,
              COALESCE(g.completed_count, 0) AS completedCount,
              COALESCE(g.needs_review_count, 0) AS needsReviewCount,
              COALESCE(g.developing_count, 0) AS developingCount,
              COALESCE(g.observed_count, 0) AS observedCount,
              COALESCE(g.unscored_count, 0) AS unscoredCount
       FROM training_assignments a
       LEFT JOIN training_assignment_aggregates g ON g.assignment_id = a.id
       WHERE a.group_id = ?1 ORDER BY a.created_at DESC`,
    )
      .bind(segments[1])
      .all<TrainingAggregateRow>();

    return json({
      group: {
        id: String(group.id),
        name: String(group.name),
        participantCount: Number(group.participantCount),
        synthetic: true,
      },
      assignments: results.map(toSafeTrainingAggregate),
    });
  }

  return json({ message: 'Route not found' }, { status: 404 });
}

export async function onRequestPost(context: Context): Promise<Response> {
  const actor = await authenticateTrainingActor(context.request, context.env);
  if (actor instanceof Response) return actor;
  const segments = pathSegments(context.request);
  const body: unknown = await context.request.json().catch(() => null);

  if (segments.length === 1 && segments[0] === 'groups') {
    const input = parseCreateGroupInput(body);
    if (!input) return json({ message: 'Valid synthetic group input required' }, { status: 400 });
    const id = crypto.randomUUID();
    await context.env.DB.prepare(
      `INSERT INTO training_groups
        (id, name, owner_id, participant_count, is_synthetic, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, 1, datetime('now'), datetime('now'))`,
    )
      .bind(id, input.name, actor.user.id, input.participantCount)
      .run();
    return json(
      { group: { id, name: input.name, participantCount: input.participantCount, synthetic: true } },
      { status: 201 },
    );
  }

  if (segments.length === 3 && segments[0] === 'groups' && segments[2] === 'assignments') {
    const group = await readGroup(context.env, segments[1]);
    if (!group) return json({ message: 'Synthetic group not found' }, { status: 404 });
    if (
      Number(group.isSynthetic) !== 1 ||
      !canManageTrainingGroup(actor.role, actor.user.id, String(group.ownerId))
    ) {
      return json({ message: 'Group access denied' }, { status: 403 });
    }
    const input = parseCreateAssignmentInput(body);
    if (!input) return json({ message: 'Approved synthetic exercise contract required' }, { status: 400 });

    const id = crypto.randomUUID();
    await context.env.DB.prepare(
      `INSERT INTO training_assignments
        (id, group_id, scenario_id, scenario_version, rubric_id, rubric_version,
         status, created_by, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'assigned', ?7, datetime('now'))`,
    )
      .bind(
        id,
        segments[1],
        input.scenarioId,
        input.scenarioVersion,
        input.rubricId,
        input.rubricVersion,
        actor.user.id,
      )
      .run();
    return json(
      {
        assignment: {
          id,
          groupId: segments[1],
          ...input,
          status: 'assigned',
          claim: 'learning_feedback_only',
        },
      },
      { status: 201 },
    );
  }

  return json({ message: 'Route not found' }, { status: 404 });
}
