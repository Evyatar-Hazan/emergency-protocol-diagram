import { authenticate, upsertUserFromGoogle, verifyGoogleIdToken } from '../../_lib/auth';
import { empty, json } from '../../_lib/json';
import { signJwt } from '../../_lib/jwt';
import type { Env } from '../../_lib/types';

type Context = {
  request: Request;
  env: Env;
};

export async function onRequestOptions(): Promise<Response> {
  return empty();
}

export async function onRequestPost(context: Context): Promise<Response> {
  const pathname = new URL(context.request.url).pathname;

  if (pathname.endsWith('/google-login')) {
    const body = (await context.request.json().catch(() => null)) as { idToken?: string } | null;
    const idToken = body?.idToken?.trim();

    if (!idToken) {
      return json({ message: 'ID token required' }, { status: 400 });
    }

    const payload = await verifyGoogleIdToken(idToken, context.env);

    if (!payload) {
      return json({ message: 'Invalid token' }, { status: 401 });
    }

    try {
      const { user, token } = await upsertUserFromGoogle(payload, context.env);
      return json({ token, user });
    } catch (error) {
      console.error('Google login failed', error);
      return json({ message: 'Login failed' }, { status: 500 });
    }
  }

  if (pathname.endsWith('/guest-login')) {
    const body = (await context.request.json().catch(() => null)) as { name?: string } | null;
    const name = body?.name?.trim();

    if (!name || name.length < 2) {
      return json({ message: 'Name must contain at least 2 characters' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const email = `guest-${id}@discussion.local`;

    await context.env.DB.prepare(
      `
        INSERT INTO users (id, email, google_id, name, picture, is_admin, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, NULL, 0, datetime('now'), datetime('now'))
      `
    )
      .bind(id, email, `guest:${id}`, name)
      .run();

    const secret = context.env.JWT_SECRET;

    if (!secret) {
      return json({ message: 'JWT_SECRET is not configured' }, { status: 500 });
    }

    const user = {
      id,
      email,
      name,
      picture: null,
      isAdmin: false,
    };

    const token = await signJwt(user, secret);

    return json({ token, user });
  }

  return json({ message: 'Route not found' }, { status: 404 });
}

export async function onRequestGet(context: Context): Promise<Response> {
  const pathname = new URL(context.request.url).pathname;

  if (!pathname.endsWith('/me')) {
    return json({ message: 'Route not found' }, { status: 404 });
  }

  const authResult = await authenticate(context.request, context.env);
  if (authResult instanceof Response) {
    return authResult;
  }

  return json({ user: authResult });
}
