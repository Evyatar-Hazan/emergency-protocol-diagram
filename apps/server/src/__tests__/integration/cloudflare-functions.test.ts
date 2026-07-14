import { onRequestGet as healthCheck } from '../../../../../functions/api/health';
import {
  onRequestPost as handleCommentPost,
  onRequestDelete as handleCommentDelete,
} from '../../../../../functions/api/comments/[[path]]';
import type { Env } from '../../../../../functions/_lib/types';

function createEnv(firstResult: unknown = { ok: 1 }): Env {
  const statement = {
    bind: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(firstResult),
    all: jest.fn().mockResolvedValue({ results: [] }),
    run: jest.fn().mockResolvedValue({ success: true }),
  };

  return {
    DB: {
      prepare: jest.fn().mockReturnValue(statement),
    },
    JWT_SECRET: 'test-secret',
  } as unknown as Env;
}

describe('Cloudflare Pages Functions', () => {
  it('reports D1 readiness from the production health endpoint', async () => {
    const response = await healthCheck({ env: createEnv({ ok: 1 }) });

    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      database: 'ready',
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
});
