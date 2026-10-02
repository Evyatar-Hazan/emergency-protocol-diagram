import { describe, expect, it } from 'vitest';
import {
  deleteOfflinePackage,
  installOfflinePackageAtomic,
  readActiveRecord,
  sha256,
} from './offline-learning-sw.js';

class MemoryCache {
  entries = new Map();
  async put(request, response) { this.entries.set(String(request), response.clone()); }
  async match(request) { return this.entries.get(String(request))?.clone(); }
  async delete(request) { return this.entries.delete(String(request)); }
}

class MemoryCacheStorage {
  stores = new Map();
  async open(name) {
    if (!this.stores.has(name)) this.stores.set(name, new MemoryCache());
    return this.stores.get(name);
  }
  async keys() { return [...this.stores.keys()]; }
  async delete(name) { return this.stores.delete(name); }
}

const origin = 'https://offline.test';

const createPackage = async (version = '1.0.0') => {
  const payload = {
    schemaVersion: '1.0.0',
    packageId: `flow-${version}`,
    intendedUse: 'learning_only',
    protocolId: 'flow',
    protocolName: 'בדיקה',
    protocolVersion: version,
    provenanceBaseSha: 'a'.repeat(40),
    createdAt: '2026-10-02T12:00:00.000Z',
    reviewValidUntil: '2027-10-02T23:59:59.999Z',
    nodeCount: 1,
    nodes: [{
      id: 'node',
      title: 'תוכן',
      sources: [{
        label: 'מקור',
        url: 'https://example.org/source',
        versionOrDate: '2026.1',
        approvedUse: 'learning_only',
        reviewedAt: '2026-09-01',
        reviewDue: '2027-10-02',
      }],
    }],
  };
  return { payload, integrity: await sha256(JSON.stringify(payload)) };
};

const shellFetcher = (failAsset = false) => async (url) => {
  if (url.endsWith('/offline-learning.html')) {
    return new Response('<script type="module" src="/assets/reader.js"></script><link rel="stylesheet" href="/assets/reader.css">');
  }
  if (failAsset && url.endsWith('/assets/reader.css')) return new Response('failed', { status: 503 });
  return new Response(`asset:${url}`);
};

describe('offline learning atomic cache', () => {
  it('commits a complete package and deletes the previous version only after switching', async () => {
    const cacheStorage = new MemoryCacheStorage();
    await installOfflinePackageAtomic({
      packageValue: await createPackage('1.0.0'),
      operationId: 'first',
      cacheStorage,
      fetcher: shellFetcher(),
      origin,
      now: new Date('2026-10-02T12:00:00Z'),
    });
    const first = await readActiveRecord(cacheStorage, origin);

    await installOfflinePackageAtomic({
      packageValue: await createPackage('2.0.0'),
      operationId: 'second',
      cacheStorage,
      fetcher: shellFetcher(),
      origin,
      now: new Date('2026-10-03T12:00:00Z'),
    });
    const second = await readActiveRecord(cacheStorage, origin);

    expect(first.protocolVersion).toBe('1.0.0');
    expect(second.protocolVersion).toBe('2.0.0');
    expect(second.cacheName).not.toBe(first.cacheName);
    expect(await cacheStorage.keys()).not.toContain(first.cacheName);
  });

  it('retains the old active package when a download is partial', async () => {
    const cacheStorage = new MemoryCacheStorage();
    await installOfflinePackageAtomic({
      packageValue: await createPackage('1.0.0'),
      operationId: 'first',
      cacheStorage,
      fetcher: shellFetcher(),
      origin,
      now: new Date('2026-10-02T12:00:00Z'),
    });
    const before = await readActiveRecord(cacheStorage, origin);

    await expect(installOfflinePackageAtomic({
      packageValue: await createPackage('2.0.0'),
      operationId: 'broken',
      cacheStorage,
      fetcher: shellFetcher(true),
      origin,
      now: new Date('2026-10-03T12:00:00Z'),
    })).rejects.toThrow('הורדת משאב offline נכשלה');

    expect(await readActiveRecord(cacheStorage, origin)).toEqual(before);
    expect((await cacheStorage.keys()).filter((name) => name.startsWith('offline-learning-package-v1-'))).toHaveLength(1);
  });

  it('retains the old package when an update is cancelled and supports explicit deletion', async () => {
    const cacheStorage = new MemoryCacheStorage();
    await installOfflinePackageAtomic({
      packageValue: await createPackage('1.0.0'),
      operationId: 'first',
      cacheStorage,
      fetcher: shellFetcher(),
      origin,
      now: new Date('2026-10-02T12:00:00Z'),
    });
    const before = await readActiveRecord(cacheStorage, origin);
    const controller = new AbortController();
    controller.abort();

    await expect(installOfflinePackageAtomic({
      packageValue: await createPackage('2.0.0'),
      operationId: 'cancelled',
      cacheStorage,
      fetcher: shellFetcher(),
      origin,
      signal: controller.signal,
      now: new Date('2026-10-03T12:00:00Z'),
    })).rejects.toThrow();
    expect(await readActiveRecord(cacheStorage, origin)).toEqual(before);

    await deleteOfflinePackage(cacheStorage, origin);
    expect(await readActiveRecord(cacheStorage, origin)).toBeNull();
    expect((await cacheStorage.keys()).some((name) => name.startsWith('offline-learning-package-v1-'))).toBe(false);
  });

  it('rejects expired packages before writing any cache entry', async () => {
    const cacheStorage = new MemoryCacheStorage();
    await expect(installOfflinePackageAtomic({
      packageValue: await createPackage('1.0.0'),
      operationId: 'stale',
      cacheStorage,
      fetcher: shellFetcher(),
      origin,
      now: new Date('2028-01-01T00:00:00Z'),
    })).rejects.toThrow('תוקף סקירת התוכן');
    expect(await readActiveRecord(cacheStorage, origin)).toBeNull();
  });

  it('fetches only the offline shell and hashed assets without credentials', async () => {
    const cacheStorage = new MemoryCacheStorage();
    const requests = [];
    const fetcher = async (url, options) => {
      requests.push({ url, credentials: options.credentials });
      if (url.endsWith('/offline-learning.html')) {
        return new Response([
          '<script src="/assets/reader.js"></script>',
          '<link href="/assets/reader.css">',
          '<img src="/api/comments/private">',
          '<img src="/account/private">',
          '<script src="https://attacker.invalid/x.js"></script>',
        ].join(''));
      }
      return new Response(`asset:${url}`);
    };
    await installOfflinePackageAtomic({
      packageValue: await createPackage(),
      operationId: 'allowlist',
      cacheStorage,
      fetcher,
      origin,
      now: new Date('2026-10-02T12:00:00Z'),
    });

    expect(requests.map(({ url }) => url)).toEqual([
      `${origin}/offline-learning.html`,
      `${origin}/assets/reader.js`,
      `${origin}/assets/reader.css`,
    ]);
    expect(requests.every(({ credentials }) => credentials === 'omit')).toBe(true);
  });
});
