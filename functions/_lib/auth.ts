import { json } from './json';
import { signJwt, verifyJwt } from './jwt';
import type { Env, SessionUser } from './types';

interface GoogleTokenPayload {
  aud: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
  picture?: string;
  sub: string;
}

function getJwtSecret(env: Env): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return env.JWT_SECRET;
}

export async function authenticate(request: Request, env: Env): Promise<SessionUser | Response> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return json({ message: 'Access token required' }, { status: 401 });
  }

  const user = await verifyJwt(token, getJwtSecret(env));

  if (!user) {
    return json({ message: 'Invalid or expired token' }, { status: 403 });
  }

  return user;
}

export async function verifyGoogleIdToken(idToken: string, env: Env): Promise<GoogleTokenPayload | null> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GoogleTokenPayload;

  if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
    return null;
  }

  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    return null;
  }

  return payload;
}

export async function upsertUserFromGoogle(payload: GoogleTokenPayload, env: Env) {
  const email = payload.email.trim().toLowerCase();
  const isAdmin = email === (env.ADMIN_EMAIL || '').trim().toLowerCase();

  const existing = await env.DB.prepare('SELECT * FROM users WHERE email = ?1').bind(email).first<{
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
    is_admin: number;
  }>();

  const userId = existing?.id ?? crypto.randomUUID();

  await env.DB.prepare(
    `
      INSERT INTO users (id, email, google_id, name, picture, is_admin, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))
      ON CONFLICT(email) DO UPDATE SET
        google_id = excluded.google_id,
        name = excluded.name,
        picture = excluded.picture,
        is_admin = excluded.is_admin,
        updated_at = datetime('now')
    `
  )
    .bind(userId, email, payload.sub, payload.name || null, payload.picture || null, isAdmin ? 1 : 0)
    .run();

  const user: SessionUser = {
    id: userId,
    email,
    name: payload.name || null,
    picture: payload.picture || null,
    isAdmin,
  };

  const token = await signJwt(user, getJwtSecret(env));

  return { user, token };
}
