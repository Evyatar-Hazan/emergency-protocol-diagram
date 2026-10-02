const CONTROL_CACHE = 'offline-learning-control-v1';
const CACHE_PREFIX = 'offline-learning-package-v1-';
const ACTIVE_RECORD_PATH = '/__offline-learning/active.json';
const PACKAGE_PATH = '/__offline-learning/package.json';
const OFFLINE_PAGE_PATH = '/offline-learning.html';
const MAX_PACKAGE_BYTES = 5_000_000;
const MAX_NODE_COUNT = 1_000;
const ALLOWED_CONTENT_KEYS = new Set([
  'checkMethod',
  'about',
  'whatToLookFor',
  'assessment',
  'explanation',
  'equipment',
  'questions',
  'vitals',
  'treatment',
]);

let activeInstall = null;

const encoder = new TextEncoder();
const toHex = (bytes) =>
  [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

export async function sha256(value) {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

export async function validateOfflinePackage(packageValue, now = new Date()) {
  const serialized = JSON.stringify(packageValue);
  if (
    !packageValue ||
    typeof packageValue !== 'object' ||
    !packageValue.payload ||
    packageValue.payload.schemaVersion !== '1.0.0' ||
    packageValue.payload.intendedUse !== 'learning_only' ||
    typeof packageValue.payload.packageId !== 'string' ||
    !/^[a-zA-Z0-9._-]+$/.test(packageValue.payload.packageId) ||
    typeof packageValue.payload.protocolVersion !== 'string' ||
    !/^[0-9a-f]{40}$/.test(packageValue.payload.provenanceBaseSha) ||
    serialized.length > MAX_PACKAGE_BYTES ||
    !Array.isArray(packageValue.payload.nodes) ||
    packageValue.payload.nodes.length === 0 ||
    packageValue.payload.nodes.length > MAX_NODE_COUNT ||
    packageValue.payload.nodes.length !== packageValue.payload.nodeCount ||
    !packageValue.payload.nodes.every(
      (node) =>
        typeof node.id === 'string' &&
        typeof node.title === 'string' &&
        (!node.content || (
          typeof node.content === 'object' &&
          !Array.isArray(node.content) &&
          Object.keys(node.content).every((key) => ALLOWED_CONTENT_KEYS.has(key))
        )) &&
        Array.isArray(node.sources) &&
        node.sources.length > 0 &&
        node.sources.every(
          (source) =>
            typeof source.label === 'string' &&
            typeof source.url === 'string' &&
            source.url.startsWith('https://') &&
            typeof source.versionOrDate === 'string' &&
            typeof source.approvedUse === 'string' &&
            typeof source.reviewedAt === 'string' &&
            typeof source.reviewDue === 'string',
        ),
    )
  ) {
    throw new Error('חבילת הלמידה אינה עומדת בחוזה המאומת.');
  }

  if (new Date(packageValue.payload.reviewValidUntil).getTime() < now.getTime()) {
    throw new Error('תוקף סקירת התוכן בחבילה פג.');
  }

  const expectedIntegrity = await sha256(JSON.stringify(packageValue.payload));
  if (expectedIntegrity !== packageValue.integrity) {
    throw new Error('בדיקת שלמות חבילת הלמידה נכשלה.');
  }
}

const recordUrl = (origin, path) => new URL(path, origin).toString();

export async function readActiveRecord(cacheStorage = caches, origin = self.location.origin) {
  const control = await cacheStorage.open(CONTROL_CACHE);
  const response = await control.match(recordUrl(origin, ACTIVE_RECORD_PATH));
  return response ? response.json() : null;
}

const safeShellUrls = (html, origin) => {
  const urls = new Set([new URL(OFFLINE_PAGE_PATH, origin).toString()]);
  const linkPattern = /(?:src|href)=["']([^"']+)["']/g;
  for (const match of html.matchAll(linkPattern)) {
    const url = new URL(match[1], origin);
    if (
      url.origin === origin &&
      !url.username &&
      !url.password &&
      url.pathname.startsWith('/assets/')
    ) {
      urls.add(url.toString());
    }
  }
  return [...urls];
};

const fetchRequired = async (url, fetcher, signal) => {
  const response = await fetcher(url, {
    cache: 'no-store',
    credentials: 'omit',
    signal,
  });
  if (!response.ok) throw new Error(`הורדת משאב offline נכשלה (${response.status}).`);
  return response;
};

export async function installOfflinePackageAtomic({
  packageValue,
  operationId,
  cacheStorage = caches,
  fetcher = fetch,
  origin = self.location.origin,
  signal,
  now = new Date(),
}) {
  await validateOfflinePackage(packageValue, now);
  const transactionToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cacheName = `${CACHE_PREFIX}${packageValue.payload.packageId}-${transactionToken}`;
  const cache = await cacheStorage.open(cacheName);

  try {
    const offlinePageUrl = new URL(OFFLINE_PAGE_PATH, origin).toString();
    const htmlResponse = await fetchRequired(offlinePageUrl, fetcher, signal);
    const html = await htmlResponse.clone().text();
    const shellUrls = safeShellUrls(html, origin);

    for (const url of shellUrls) {
      if (signal?.aborted) throw new DOMException('ההורדה בוטלה.', 'AbortError');
      const response = url === offlinePageUrl
        ? htmlResponse.clone()
        : await fetchRequired(url, fetcher, signal);
      await cache.put(url, response);
    }

    await cache.put(
      recordUrl(origin, PACKAGE_PATH),
      new Response(JSON.stringify(packageValue), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    );

    const activeRecord = {
      schemaVersion: '1.0.0',
      cacheName,
      operationId,
      packageId: packageValue.payload.packageId,
      protocolVersion: packageValue.payload.protocolVersion,
      provenanceBaseSha: packageValue.payload.provenanceBaseSha,
      reviewValidUntil: packageValue.payload.reviewValidUntil,
      installedAt: now.toISOString(),
      nodeCount: packageValue.payload.nodeCount,
    };

    const control = await cacheStorage.open(CONTROL_CACHE);
    await control.put(
      recordUrl(origin, ACTIVE_RECORD_PATH),
      new Response(JSON.stringify(activeRecord), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    );

    const cacheNames = await cacheStorage.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== cacheName)
        .map((name) => cacheStorage.delete(name)),
    );
    return activeRecord;
  } catch (error) {
    await cacheStorage.delete(cacheName);
    throw error;
  }
}

export async function deleteOfflinePackage(cacheStorage = caches, origin = self.location.origin) {
  const cacheNames = await cacheStorage.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith(CACHE_PREFIX))
      .map((name) => cacheStorage.delete(name)),
  );
  const control = await cacheStorage.open(CONTROL_CACHE);
  await control.delete(recordUrl(origin, ACTIVE_RECORD_PATH));
}

const statusFromRecord = (record) => record
  ? {
      installed: true,
      packageId: record.packageId,
      protocolVersion: record.protocolVersion,
      provenanceBaseSha: record.provenanceBaseSha,
      reviewValidUntil: record.reviewValidUntil,
      installedAt: record.installedAt,
      nodeCount: record.nodeCount,
    }
  : {
      installed: false,
      packageId: null,
      protocolVersion: null,
      provenanceBaseSha: null,
      reviewValidUntil: null,
      installedAt: null,
      nodeCount: 0,
    };

const reply = (event, response) => event.ports[0]?.postMessage(response);

const mutationAllowedFrom = (event) => {
  if (!event.source || typeof event.source.url !== 'string') return false;
  const sourceUrl = new URL(event.source.url);
  return sourceUrl.origin === self.location.origin && ['/', '/index.html'].includes(sourceUrl.pathname);
};

if (typeof self !== 'undefined' && 'addEventListener' in self) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener('message', (event) => {
    const request = event.data;
    if (!request || typeof request.type !== 'string') return;

    if (request.type === 'OFFLINE_LEARNING_CANCEL') {
      if (!mutationAllowedFrom(event)) {
        reply(event, { ok: false, error: 'מקור הבקשה אינו מורשה לשנות חבילת offline.' });
        return;
      }
      const cancelled = activeInstall?.operationId === request.operationId;
      if (cancelled) activeInstall.controller.abort();
      reply(event, { ok: true, result: { cancelled } });
      return;
    }

    const task = (async () => {
      if (request.type === 'OFFLINE_LEARNING_STATUS') {
        return statusFromRecord(await readActiveRecord());
      }
      if (request.type === 'OFFLINE_LEARNING_DELETE') {
        if (!mutationAllowedFrom(event)) throw new Error('מקור הבקשה אינו מורשה לשנות חבילת offline.');
        if (activeInstall) activeInstall.controller.abort();
        await deleteOfflinePackage();
        return statusFromRecord(null);
      }
      if (request.type === 'OFFLINE_LEARNING_INSTALL') {
        if (!mutationAllowedFrom(event)) throw new Error('מקור הבקשה אינו מורשה לשנות חבילת offline.');
        if (activeInstall) throw new Error('הורדת חבילת offline אחרת כבר מתבצעת.');
        const controller = new AbortController();
        activeInstall = { operationId: request.operationId, controller };
        try {
          const record = await installOfflinePackageAtomic({
            packageValue: request.packageValue,
            operationId: request.operationId,
            signal: controller.signal,
          });
          return statusFromRecord(record);
        } finally {
          activeInstall = null;
        }
      }
      throw new Error('בקשת Service Worker לא מוכרת.');
    })();

    event.waitUntil(
      task.then(
        (result) => reply(event, { ok: true, result }),
        (error) => reply(event, {
          ok: false,
          error: error instanceof Error ? error.message : 'פעולת offline נכשלה.',
        }),
      ),
    );
  });

  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

    event.respondWith((async () => {
      const record = await readActiveRecord();
      if (!record) return fetch(event.request);
      const cache = await caches.open(record.cacheName);
      const packageUrl = recordUrl(self.location.origin, PACKAGE_PATH);

      if (url.pathname === PACKAGE_PATH) {
        return (await cache.match(packageUrl)) ?? new Response(null, { status: 404 });
      }

      if (event.request.mode === 'navigate' && url.pathname === OFFLINE_PAGE_PATH) {
        return (await cache.match(recordUrl(self.location.origin, OFFLINE_PAGE_PATH)))
          ?? new Response('Offline learning shell is unavailable', { status: 503 });
      }

      const cached = await cache.match(event.request.url);
      return cached ?? fetch(event.request);
    })());
  });
}
