import { beforeEach, describe, expect, it, vi } from 'vitest';
import unifiedFlow from './unified-flow.json';
import runtimeManifestData from '../../public/generated/source-provenance-runtime.json';
import { getSourceProvenancePresentation } from './sourceProvenance';
import {
  loadSourceProvenanceRuntime,
  resetSourceProvenanceRuntimeCacheForTests,
  resolveSourceProvenance,
} from './sourceProvenanceRuntime';
import type {
  RuntimeSourceProvenanceManifest,
  SourceProvenanceLoadState,
} from '../types/sourceProvenance';

const runtimeManifest = runtimeManifestData as RuntimeSourceProvenanceManifest;

const readyState: SourceProvenanceLoadState = {
  status: 'ready',
  manifest: runtimeManifest,
  loadedAt: 1,
  error: null,
};

const successfulFetch = () =>
  vi.fn(async () =>
    new Response(JSON.stringify(runtimeManifest), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  ) as unknown as typeof fetch;

describe('source provenance runtime projection', () => {
  beforeEach(() => resetSourceProvenanceRuntimeCacheForTests());

  it('covers all 205 nodes and 317 sources without duplicating source content', () => {
    expect(runtimeManifest.node_count).toBe(205);
    expect(runtimeManifest.source_count).toBe(317);
    expect(Object.keys(runtimeManifest.nodes)).toHaveLength(205);
    const mappings = Object.values(runtimeManifest.nodes).flatMap((node) => node.sources);
    expect(mappings).toHaveLength(317);

    let resolvedCount = 0;
    for (const [nodeId, node] of Object.entries(unifiedFlow.nodes)) {
      const sources = node.content?.sources ?? [];
      expect(runtimeManifest.nodes[nodeId]?.sources).toHaveLength(sources.length);
      sources.forEach((source, sourceIndex) => {
        const resolved = resolveSourceProvenance(
          readyState,
          'unified_flow',
          nodeId,
          source,
          sourceIndex,
        );
        expect(resolved).toMatchObject({
          source_index: sourceIndex,
          label: source.label,
          url: source.url,
        });
        resolvedCount += 1;
      });
    }
    expect(resolvedCount).toBe(317);
    expect(mappings.every((mapping) => !('label' in mapping) && !('url' in mapping) && !('note' in mapping))).toBe(true);
    expect(Object.values(runtimeManifest.nodes).every((node) => !('node_id' in node))).toBe(true);
  });

  it('loads a valid projection and reuses a fresh in-memory cache', async () => {
    const fetcher = successfulFetch();
    const first = await loadSourceProvenanceRuntime({ fetcher, now: 1000, maxAgeMs: 100 });
    const second = await loadSourceProvenanceRuntime({ fetcher, now: 1050, maxAgeMs: 100 });

    expect(first.status).toBe('ready');
    expect(second.status).toBe('ready');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('stays fail-closed while loading', () => {
    const presentation = getSourceProvenancePresentation(null, [], 'loading');
    expect(presentation).toMatchObject({ approved: false, reviewLabel: 'טוען נתוני עקיבות' });
  });

  it('stays fail-closed when the runtime asset cannot be loaded', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    const state = await loadSourceProvenanceRuntime({ fetcher, now: 1000 });

    expect(state).toMatchObject({ status: 'error', manifest: null, error: 'offline' });
    expect(getSourceProvenancePresentation(null, [], state.status)).toMatchObject({
      approved: false,
      reviewLabel: 'עקיבות לא זמינה',
    });
  });

  it('does not use an expired cache for approval when refresh fails', async () => {
    await loadSourceProvenanceRuntime({ fetcher: successfulFetch(), now: 1000, maxAgeMs: 100 });
    const failingFetch = vi.fn(async () => {
      throw new Error('refresh failed');
    }) as unknown as typeof fetch;
    const state = await loadSourceProvenanceRuntime({
      fetcher: failingFetch,
      now: 1101,
      maxAgeMs: 100,
    });
    const source = unifiedFlow.nodes.report_departure.content.sources[0];

    expect(state.status).toBe('stale');
    expect(state.manifest).not.toBeNull();
    expect(resolveSourceProvenance(state, 'unified_flow', 'report_departure', source, 0)).toBeNull();
    expect(getSourceProvenancePresentation(null, [], state.status)).toMatchObject({
      approved: false,
      reviewLabel: 'נתוני עקיבות דורשים רענון',
    });
  });
});
