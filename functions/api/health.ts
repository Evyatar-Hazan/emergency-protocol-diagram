import { json } from '../_lib/json';
import type { Env } from '../_lib/types';

export async function onRequestGet({ env }: { env: Env }): Promise<Response> {
  const dbCheck = await env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();

  return json({
    status: 'ok',
    database: dbCheck?.ok === 1 ? 'ready' : 'unknown',
  });
}
