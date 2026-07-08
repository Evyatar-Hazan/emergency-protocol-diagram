import type { Env } from './types';

interface CommentRow {
  id: string;
  node_id: string;
  content: string;
  author_id: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  author_email: string;
  author_name: string | null;
  author_picture: string | null;
  author_is_admin: number;
  likes_count: number;
  views_count: number;
  viewer_has_liked: number;
}

interface CommentRecord {
  id: string;
  nodeId: string;
  content: string;
  authorId: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    email: string;
    name?: string | null;
    picture?: string | null;
    isAdmin: boolean;
  };
  likesCount: number;
  viewsCount: number;
  viewerHasLiked: boolean;
  replies: CommentRecord[];
}

function toComment(row: CommentRow): CommentRecord {
  return {
    id: row.id,
    nodeId: row.node_id,
    content: row.content,
    authorId: row.author_id,
    parentCommentId: row.parent_comment_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_id,
      email: row.author_email,
      name: row.author_name,
      picture: row.author_picture,
      isAdmin: Boolean(row.author_is_admin),
    },
    likesCount: Number(row.likes_count || 0),
    viewsCount: Number(row.views_count || 0),
    viewerHasLiked: Boolean(row.viewer_has_liked),
    replies: [],
  };
}

export async function getCommentsByNodeId(
  env: Env,
  nodeId: string,
  viewerId?: string | null
): Promise<CommentRecord[]> {
  const { results } = await env.DB.prepare(
    `
      SELECT
        c.id,
        c.node_id,
        c.content,
        c.author_id,
        c.parent_comment_id,
        c.created_at,
        c.updated_at,
        u.email AS author_email,
        u.name AS author_name,
        u.picture AS author_picture,
        u.is_admin AS author_is_admin,
        (
          SELECT COUNT(*)
          FROM comment_likes cl
          WHERE cl.comment_id = c.id
        ) AS likes_count,
        (
          SELECT COUNT(*)
          FROM comment_views cv
          WHERE cv.comment_id = c.id
        ) AS views_count,
        ${
          viewerId
            ? `
        EXISTS(
          SELECT 1
          FROM comment_likes clv
          WHERE clv.comment_id = c.id AND clv.user_id = ?2
        ) AS viewer_has_liked
        `
            : '0 AS viewer_has_liked'
        }
      FROM comments c
      INNER JOIN users u ON u.id = c.author_id
      WHERE c.node_id = ?1
      ORDER BY c.created_at DESC
    `
  )
    .bind(...(viewerId ? [nodeId, viewerId] : [nodeId]))
    .all<CommentRow>();

  const map = new Map<string, CommentRecord>();
  const roots: CommentRecord[] = [];

  for (const row of results) {
    map.set(row.id, toComment(row));
  }

  for (const comment of map.values()) {
    if (comment.parentCommentId && map.has(comment.parentCommentId)) {
      map.get(comment.parentCommentId)?.replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}
