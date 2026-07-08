import { authenticate, upsertUserFromGoogle, verifyGoogleIdToken } from '../../_lib/auth';
import { empty, json } from '../../_lib/json';
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
