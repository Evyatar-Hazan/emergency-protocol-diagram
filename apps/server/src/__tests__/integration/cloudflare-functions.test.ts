import { describe, expect, it, vi } from 'vitest';
import { onRequestGet as healthCheck } from '../../../../../functions/api/health';
import {
  onRequestGet as handleCommentGet,
  onRequestPost as handleCommentPost,
  onRequestDelete as handleCommentDelete,
} from '../../../../../functions/api/comments/[[path]]';
import {
  onRequestGet as handleAuthGet,
  onRequestPost as handleAuthPost,
} from '../../../../../functions/api/auth/[[path]]';
import { signJwt } from '../../../../../functions/_lib/jwt';
import type { Env } from '../../../../../functions/_lib/types';

type StatementResult = {
  first?: unknown;
  all?: unknown[];
  run?: unknown;
};

function createEnv(...statementResults: StatementResult[]): Env {
  const statement = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(statementResults[0]?.first ?? { ok: 1 }),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true }),
  };

  const statements = statementResults.map((result) => ({
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(result.first ?? null),
    all: vi.fn().mockResolvedValue({ results: result.all ?? [] }),
    run: vi.fn().mockResolvedValue(result.run ?? { success: true }),
  }));

  return {
    DB: {
      prepare: vi.fn(() => statements.shift() ?? statement),
    },
    JWT_SECRET: 'test-secret',
  } as unknown as Env;
}

async function createAuthHeader(
  user: { id: string; email?: string; isAdmin?: boolean } = { id: 'user-1' }
): Promise<string> {
  const token = await signJwt(
    {
      id: user.id,
      email: user.email ?? `${user.id}@example.com`,
      name: 'Test User',
      picture: null,
      isAdmin: Boolean(user.isAdmin),
    },
    'test-secret'
  );

  return `Bearer ${token}`;
}

describe('Cloudflare Pages Functions', () => {
  it('reports D1 readiness from the production health endpoint', async () => {
    const response = await healthCheck({ env: createEnv({ first: { ok: 1 } }) });

    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      database: 'ready',
    });
    expect(response.status).toBe(200);
  });

  it('rejects a Google login request without an ID token', async () => {
    const response = await handleAuthPost({
      env: createEnv(),
      request: new Request('https://example.com/api/auth/google-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'ID token required' });
    expect(response.status).toBe(400);
  });

  it('rejects an ID token that Google does not validate', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 401 })
    );

    const response = await handleAuthPost({
      env: createEnv(),
      request: new Request('https://example.com/api/auth/google-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken: 'invalid-token' }),
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'Invalid token' });
    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockRestore();
  });

  it('creates a production session for a verified Google user', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        aud: 'client-id',
        email: 'Admin@Example.com',
        email_verified: true,
        name: 'Admin User',
        picture: 'https://example.com/admin.jpg',
        sub: 'google-admin-1',
      })
    );
    const env = createEnv({ first: null }, {});
    env.GOOGLE_CLIENT_ID = 'client-id';
    env.ADMIN_EMAIL = 'admin@example.com';

    const response = await handleAuthPost({
      env,
      request: new Request('https://example.com/api/auth/google-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken: 'verified-token' }),
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      token: expect.any(String),
      user: {
        email: 'admin@example.com',
        isAdmin: true,
        name: 'Admin User',
      },
    });
    expect(response.status).toBe(200);
    expect(env.DB.prepare).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });

  it('returns the current user from a valid production session', async () => {
    const response = await handleAuthGet({
      env: createEnv(),
      request: new Request('https://example.com/api/auth/me', {
        headers: { authorization: await createAuthHeader({ id: 'user-1' }) },
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      user: { id: 'user-1', email: 'user-1@example.com', isAdmin: false },
    });
    expect(response.status).toBe(200);
  });

  it('blocks unauthenticated comment creation before writing to D1', async () => {
    const env = createEnv();
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nodeId: 'primary', content: 'Test comment' }),
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'Access token required' });
    expect(response.status).toBe(401);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('lets a guest read comments without authentication', async () => {
    const env = createEnv({
      all: [
        {
          id: 'comment-1',
          node_id: 'primary',
          content: 'Readable comment',
          author_id: 'user-1',
          parent_comment_id: null,
          moderation_status: 'community_unreviewed',
          created_at: '2026-07-28 10:00:00',
          updated_at: '2026-07-28 10:00:00',
          author_email: 'user@example.com',
          author_name: 'Test User',
          author_picture: null,
          author_is_admin: 0,
          likes_count: 2,
          views_count: 3,
          viewer_has_liked: 0,
        },
      ],
    });
    const response = await handleCommentGet({
      env,
      request: new Request('https://example.com/api/comments/primary', {
        method: 'GET',
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      comments: [
        {
          id: 'comment-1',
          content: 'Readable comment',
          likesCount: 2,
          viewsCount: 3,
          viewerHasLiked: false,
          trustStatus: 'community_unreviewed',
        },
      ],
    });
    expect(response.status).toBe(200);
    expect(env.DB.prepare).toHaveBeenCalledTimes(1);
    expect(env.DB.prepare).toHaveBeenCalledWith(expect.stringContaining("visibility_status = 'visible'"));
  });

  it('allows a Google user to create a comment and returns the inserted row', async () => {
    const env = createEnv(
      { first: { googleId: 'google-user-1' } },
      {},
      {
        all: [
          {
            id: 'comment-1',
            nodeId: 'primary',
            content: 'Test comment',
            authorId: 'user-1',
            parentCommentId: null,
            createdAt: '2026-07-28 10:00:00',
            updatedAt: '2026-07-28 10:00:00',
            userId: 'user-1',
            email: 'user@example.com',
            name: 'Test User',
            picture: null,
            isAdmin: 0,
          },
        ],
      }
    );
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments', {
        method: 'POST',
        headers: {
          authorization: await createAuthHeader(),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ nodeId: 'primary', content: 'Test comment' }),
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      comment: {
        id: 'comment-1',
        nodeId: 'primary',
        content: 'Test comment',
        author: { id: 'user-1', isAdmin: false },
      },
    });
    expect(response.status).toBe(201);
    expect(env.DB.prepare).toHaveBeenCalledTimes(3);
  });

  it('allows a Google user to create a reply', async () => {
    const env = createEnv(
      { first: { googleId: 'google-user-1' } },
      {},
      {
        all: [
          {
            id: 'reply-1',
            nodeId: 'primary',
            content: 'Reply comment',
            authorId: 'user-1',
            parentCommentId: 'comment-1',
            createdAt: '2026-07-28 10:00:00',
            updatedAt: '2026-07-28 10:00:00',
            userId: 'user-1',
            email: 'user@example.com',
            name: 'Test User',
            picture: null,
            isAdmin: 0,
          },
        ],
      }
    );
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments', {
        method: 'POST',
        headers: {
          authorization: await createAuthHeader(),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          nodeId: 'primary',
          content: 'Reply comment',
          parentCommentId: 'comment-1',
        }),
      }),
    });

    await expect(response.json()).resolves.toMatchObject({
      comment: {
        id: 'reply-1',
        parentCommentId: 'comment-1',
        content: 'Reply comment',
      },
    });
    expect(response.status).toBe(201);
    expect(env.DB.prepare).toHaveBeenCalledTimes(3);
  });

  it('rejects comment creation from a legacy guest account', async () => {
    const env = createEnv({ first: { googleId: 'guest:user-1' } });
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments', {
        method: 'POST',
        headers: {
          authorization: await createAuthHeader(),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ nodeId: 'primary', content: 'Test comment' }),
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'Google login required' });
    expect(response.status).toBe(403);
    expect(env.DB.prepare).toHaveBeenCalledTimes(1);
  });

  it('rejects comment view tracking without a stable viewer key', async () => {
    const env = createEnv();
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments/comment-1/view', {
        method: 'POST',
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'Viewer key required' });
    expect(response.status).toBe(400);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('tracks a comment view when the viewer key is stable', async () => {
    const env = createEnv(
      { first: { id: 'comment-1' } },
      {},
      { first: { viewsCount: 1 } }
    );
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments/comment-1/view', {
        method: 'POST',
        headers: { 'x-viewer-key': 'viewer-key-123' },
      }),
    });

    await expect(response.json()).resolves.toEqual({ viewsCount: 1 });
    expect(response.status).toBe(200);
    expect(env.DB.prepare).toHaveBeenCalledTimes(3);
  });

  it('allows a Google user to like a comment', async () => {
    const env = createEnv(
      { first: { googleId: 'google-user-1' } },
      { first: { id: 'comment-1' } },
      { first: null },
      {},
      { first: { likesCount: 1 } }
    );
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments/comment-1/like', {
        method: 'POST',
        headers: { authorization: await createAuthHeader() },
      }),
    });

    await expect(response.json()).resolves.toEqual({ liked: true, likesCount: 1 });
    expect(response.status).toBe(200);
    expect(env.DB.prepare).toHaveBeenCalledTimes(5);
  });

  it('toggles off an existing like for the same Google user', async () => {
    const env = createEnv(
      { first: { googleId: 'google-user-1' } },
      { first: { id: 'comment-1' } },
      { first: { id: 'like-1' } },
      {},
      { first: { likesCount: 0 } }
    );
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments/comment-1/like', {
        method: 'POST',
        headers: { authorization: await createAuthHeader() },
      }),
    });

    await expect(response.json()).resolves.toEqual({ liked: false, likesCount: 0 });
    expect(response.status).toBe(200);
    expect(env.DB.prepare).toHaveBeenCalledTimes(5);
  });

  it('blocks unauthenticated comment deletion before reading from D1', async () => {
    const env = createEnv();
    const response = await handleCommentDelete({
      env,
      request: new Request('https://example.com/api/comments/comment-1', {
        method: 'DELETE',
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'Access token required' });
    expect(response.status).toBe(401);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('allows a regular user to delete their own comment', async () => {
    const env = createEnv({ first: { authorId: 'user-1' } }, {});
    const response = await handleCommentDelete({
      env,
      request: new Request('https://example.com/api/comments/comment-1', {
        method: 'DELETE',
        headers: { authorization: await createAuthHeader({ id: 'user-1' }) },
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'Comment deleted' });
    expect(response.status).toBe(200);
    expect(env.DB.prepare).toHaveBeenCalledTimes(2);
  });

  it('blocks a regular user from deleting another author comment', async () => {
    const env = createEnv({ first: { authorId: 'author-1' } });
    const response = await handleCommentDelete({
      env,
      request: new Request('https://example.com/api/comments/comment-1', {
        method: 'DELETE',
        headers: { authorization: await createAuthHeader({ id: 'user-1' }) },
      }),
    });

    await expect(response.json()).resolves.toEqual({
      message: 'You can only delete your own comments',
    });
    expect(response.status).toBe(403);
    expect(env.DB.prepare).toHaveBeenCalledTimes(1);
  });

  it('allows an admin to delete another author comment', async () => {
    const env = createEnv({ first: { authorId: 'author-1' } }, {});
    const response = await handleCommentDelete({
      env,
      request: new Request('https://example.com/api/comments/comment-1', {
        method: 'DELETE',
        headers: { authorization: await createAuthHeader({ id: 'admin-1', isAdmin: true }) },
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'Comment deleted' });
    expect(response.status).toBe(200);
    expect(env.DB.prepare).toHaveBeenCalledTimes(2);
  });

  it('blocks a guest from reporting a comment', async () => {
    const env = createEnv();
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments/comment-1/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason: 'potentially_unsafe' }),
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'Access token required' });
    expect(response.status).toBe(401);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('queues a fixed-reason report from a Google user without changing the comment', async () => {
    const env = createEnv(
      { first: { googleId: 'google-user-1' } },
      { first: { id: 'comment-1' } },
      {},
    );
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments/comment-1/report', {
        method: 'POST',
        headers: {
          authorization: await createAuthHeader({ id: 'user-1' }),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ reason: 'potentially_unsafe' }),
      }),
    });

    await expect(response.json()).resolves.toEqual({ status: 'queued' });
    expect(response.status).toBe(202);
    expect(env.DB.prepare).toHaveBeenCalledTimes(3);
  });

  it('rejects free text and unsupported fields in a report', async () => {
    const env = createEnv({ first: { googleId: 'google-user-1' } });
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments/comment-1/report', {
        method: 'POST',
        headers: {
          authorization: await createAuthHeader({ id: 'user-1' }),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ reason: 'misleading', details: 'synthetic free text' }),
      }),
    });

    await expect(response.json()).resolves.toEqual({
      message: 'A supported report reason is required',
    });
    expect(response.status).toBe(400);
    expect(env.DB.prepare).toHaveBeenCalledTimes(1);
  });

  it('blocks a regular user from reading the moderation queue', async () => {
    const env = createEnv();
    const response = await handleCommentGet({
      env,
      request: new Request('https://example.com/api/comments/moderation/queue', {
        headers: { authorization: await createAuthHeader({ id: 'user-1' }) },
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'Admin access required' });
    expect(response.status).toBe(403);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('allows an admin to read the synthetic moderation queue', async () => {
    const env = createEnv({
      all: [
        {
          commentId: 'comment-1',
          nodeId: 'synthetic-node',
          content: 'Synthetic community content',
          moderationStatus: 'community_unreviewed',
          visibilityStatus: 'visible',
          createdAt: '2026-10-02 12:00:00',
          reportCount: 1,
          reportReasons: 'potentially_unsafe',
        },
      ],
    });
    const response = await handleCommentGet({
      env,
      request: new Request('https://example.com/api/comments/moderation/queue', {
        headers: { authorization: await createAuthHeader({ id: 'admin-1', isAdmin: true }) },
      }),
    });

    await expect(response.json()).resolves.toEqual({
      items: [
        expect.objectContaining({
          commentId: 'comment-1',
          moderationStatus: 'community_unreviewed',
          reportReasons: ['potentially_unsafe'],
        }),
      ],
    });
    expect(response.status).toBe(200);
    expect(env.DB.prepare).toHaveBeenCalledTimes(1);
  });

  it('blocks a regular user from moderating a comment', async () => {
    const env = createEnv();
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments/comment-1/moderate', {
        method: 'POST',
        headers: {
          authorization: await createAuthHeader({ id: 'user-1' }),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'hide', reason: 'potentially_unsafe' }),
      }),
    });

    await expect(response.json()).resolves.toEqual({ message: 'Admin access required' });
    expect(response.status).toBe(403);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });

  it('lets an admin hide a synthetic comment and records an audit event', async () => {
    const env = createEnv({ first: { id: 'comment-1' } }, {}, {}, {});
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments/comment-1/moderate', {
        method: 'POST',
        headers: {
          authorization: await createAuthHeader({ id: 'admin-1', isAdmin: true }),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'hide', reason: 'potentially_unsafe' }),
      }),
    });

    await expect(response.json()).resolves.toEqual({
      status: 'moderated',
      action: 'hide',
      trustStatus: 'moderation_reviewed',
      approvalStatus: 'not_approved',
    });
    expect(response.status).toBe(200);
    expect(env.DB.prepare).toHaveBeenCalledTimes(4);
  });

  it('does not accept an approval action even from an admin', async () => {
    const env = createEnv();
    const response = await handleCommentPost({
      env,
      request: new Request('https://example.com/api/comments/comment-1/moderate', {
        method: 'POST',
        headers: {
          authorization: await createAuthHeader({ id: 'admin-1', isAdmin: true }),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve', reason: 'community_guidelines' }),
      }),
    });

    await expect(response.json()).resolves.toEqual({
      message: 'A supported moderation action and reason are required',
    });
    expect(response.status).toBe(400);
    expect(env.DB.prepare).not.toHaveBeenCalled();
  });
});
