import { authenticate } from '../../_lib/auth';
import { getCommentsByNodeId } from '../../_lib/comments';
import { empty, json } from '../../_lib/json';
import type { Env } from '../../_lib/types';

type Context = {
  request: Request;
  env: Env;
};

async function createComment(context: Context): Promise<Response> {
  const authResult = await authenticate(context.request, context.env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const body = (await context.request.json().catch(() => null)) as
    | { nodeId?: string; content?: string; parentCommentId?: string | null }
    | null;

  const nodeId = body?.nodeId?.trim();
  const content = body?.content?.trim();
  const parentCommentId = body?.parentCommentId?.trim() || null;

  if (!nodeId || !content) {
    return json({ message: 'Node ID and content are required' }, { status: 400 });
  }

  const id = crypto.randomUUID();

  await context.env.DB.prepare(
    `
      INSERT INTO comments (id, node_id, content, author_id, parent_comment_id, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))
    `
  )
    .bind(id, nodeId, content, authResult.id, parentCommentId)
    .run();

  const { results } = await context.env.DB.prepare(
    `
      SELECT
        c.id,
        c.node_id AS nodeId,
        c.content,
        c.author_id AS authorId,
        c.parent_comment_id AS parentCommentId,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt,
        u.id AS userId,
        u.email,
        u.name,
        u.picture,
        u.is_admin AS isAdmin
      FROM comments c
      INNER JOIN users u ON u.id = c.author_id
      WHERE c.id = ?1
    `
  )
    .bind(id)
    .all<Record<string, string | number | null>>();

  const row = results[0];

  return json(
    {
      comment: {
        id: String(row.id),
        nodeId: String(row.nodeId),
        content: String(row.content),
        authorId: String(row.authorId),
        parentCommentId: row.parentCommentId ? String(row.parentCommentId) : null,
        createdAt: String(row.createdAt),
        updatedAt: String(row.updatedAt),
        author: {
          id: String(row.userId),
          email: String(row.email),
          name: row.name ? String(row.name) : null,
          picture: row.picture ? String(row.picture) : null,
          isAdmin: Boolean(row.isAdmin),
        },
      },
    },
    { status: 201 }
  );
}

async function updateComment(context: Context, commentId: string): Promise<Response> {
  const authResult = await authenticate(context.request, context.env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const body = (await context.request.json().catch(() => null)) as { content?: string } | null;
  const content = body?.content?.trim();

  if (!content) {
    return json({ message: 'Content is required' }, { status: 400 });
  }

  const existing = await context.env.DB.prepare(
    'SELECT author_id AS authorId FROM comments WHERE id = ?1'
  )
    .bind(commentId)
    .first<{ authorId: string }>();

  if (!existing) {
    return json({ message: 'Comment not found' }, { status: 404 });
  }

  if (existing.authorId !== authResult.id && !authResult.isAdmin) {
    return json({ message: 'You can only edit your own comments' }, { status: 403 });
  }

  await context.env.DB.prepare(
    'UPDATE comments SET content = ?1, updated_at = datetime(\'now\') WHERE id = ?2'
  )
    .bind(content, commentId)
    .run();

  const comments = await getCommentsByNodeId(
    context.env,
    (
      await context.env.DB.prepare('SELECT node_id AS nodeId FROM comments WHERE id = ?1')
        .bind(commentId)
        .first<{ nodeId: string }>()
    )?.nodeId || ''
  );

  const findComment = (items: typeof comments): (typeof comments)[number] | null => {
    for (const item of items) {
      if (item.id === commentId) {
        return item;
      }

      const nested = findComment(item.replies);
      if (nested) {
        return nested;
      }
    }

    return null;
  };

  return json({ comment: findComment(comments) });
}

async function deleteComment(context: Context, commentId: string): Promise<Response> {
  const authResult = await authenticate(context.request, context.env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const existing = await context.env.DB.prepare(
    'SELECT author_id AS authorId FROM comments WHERE id = ?1'
  )
    .bind(commentId)
    .first<{ authorId: string }>();

  if (!existing) {
    return json({ message: 'Comment not found' }, { status: 404 });
  }

  if (existing.authorId !== authResult.id && !authResult.isAdmin) {
    return json({ message: 'You can only delete your own comments' }, { status: 403 });
  }

  await context.env.DB.prepare('DELETE FROM comments WHERE id = ?1').bind(commentId).run();
  return json({ message: 'Comment deleted' });
}

export async function onRequestOptions(): Promise<Response> {
  return empty();
}

export async function onRequestGet(context: Context): Promise<Response> {
  const pathname = new URL(context.request.url).pathname;
  const nodeId = decodeURIComponent(pathname.replace(/^\/api\/comments\//, '')).trim();

  if (!nodeId) {
    return json({ message: 'Node ID required' }, { status: 400 });
  }

  const comments = await getCommentsByNodeId(context.env, nodeId);
  return json({ comments });
}

export async function onRequestPost(context: Context): Promise<Response> {
  return createComment(context);
}

export async function onRequestPut(context: Context): Promise<Response> {
  const pathname = new URL(context.request.url).pathname;
  const commentId = decodeURIComponent(pathname.replace(/^\/api\/comments\//, '')).trim();

  if (!commentId) {
    return json({ message: 'Comment ID required' }, { status: 400 });
  }

  return updateComment(context, commentId);
}

export async function onRequestDelete(context: Context): Promise<Response> {
  const pathname = new URL(context.request.url).pathname;
  const commentId = decodeURIComponent(pathname.replace(/^\/api\/comments\//, '')).trim();

  if (!commentId) {
    return json({ message: 'Comment ID required' }, { status: 400 });
  }

  return deleteComment(context, commentId);
}
