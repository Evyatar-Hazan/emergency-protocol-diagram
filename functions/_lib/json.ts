export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-headers', 'authorization, content-type');
  headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export function empty(status = 204, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-headers', 'authorization, content-type');
  headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');

  return new Response(null, {
    ...init,
    status,
    headers,
  });
}
