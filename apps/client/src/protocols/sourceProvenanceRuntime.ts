import type { ReferenceSource } from '../types/protocol';
import type {
  RuntimeSourceProvenanceManifest,
  SourceProvenance,
  SourceProvenanceLoadState,
} from '../types/sourceProvenance';

export const SOURCE_PROVENANCE_RUNTIME_URL = '/generated/source-provenance-runtime.json';
export const SOURCE_PROVENANCE_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

type RuntimeCache = {
  manifest: RuntimeSourceProvenanceManifest;
  loadedAt: number;
};

type LoadOptions = {
  fetcher?: typeof fetch;
  now?: number;
  maxAgeMs?: number;
};

let cache: RuntimeCache | null = null;

function validateRuntimeManifest(value: unknown): RuntimeSourceProvenanceManifest {
  if (!value || typeof value !== 'object') throw new Error('Runtime provenance payload is not an object');
  const manifest = value as Partial<RuntimeSourceProvenanceManifest>;
  if (
    manifest.schema_version !== '1.0.0' ||
    typeof manifest.protocol_id !== 'string' ||
    !Number.isInteger(manifest.node_count) ||
    !Number.isInteger(manifest.source_count) ||
    !manifest.nodes ||
    !manifest.source_catalog ||
    !Array.isArray(manifest.review_records)
  ) {
    throw new Error('Runtime provenance payload failed validation');
  }
  const validated = manifest as RuntimeSourceProvenanceManifest;
  const nodes = Object.values(validated.nodes);
  const sources = nodes.flatMap((node) => node.sources);
  if (
    nodes.length !== validated.node_count ||
    sources.length !== validated.source_count ||
    nodes.some((node) => !/^[0-9a-f]{64}$/.test(node.node_content_hash)) ||
    sources.some(
      (source) =>
        !Number.isInteger(source.source_index) ||
        !validated.source_catalog[source.source_id],
    )
  ) {
    throw new Error('Runtime provenance coverage failed validation');
  }
  return validated;
}

export async function loadSourceProvenanceRuntime({
  fetcher = fetch,
  now = Date.now(),
  maxAgeMs = SOURCE_PROVENANCE_CACHE_MAX_AGE_MS,
}: LoadOptions = {}): Promise<SourceProvenanceLoadState> {
  if (cache && now - cache.loadedAt <= maxAgeMs) {
    return { status: 'ready', manifest: cache.manifest, loadedAt: cache.loadedAt, error: null };
  }

  const staleCache = cache;
  try {
    const response = await fetcher(SOURCE_PROVENANCE_RUNTIME_URL, {
      headers: { accept: 'application/json' },
      cache: 'no-cache',
    });
    if (!response.ok) throw new Error(`Runtime provenance returned HTTP ${response.status}`);
    const manifest = validateRuntimeManifest(await response.json());
    cache = { manifest, loadedAt: now };
    return { status: 'ready', manifest, loadedAt: now, error: null };
  } catch (error) {
    return {
      status: staleCache ? 'stale' : 'error',
      manifest: staleCache?.manifest ?? null,
      loadedAt: staleCache?.loadedAt ?? null,
      error: error instanceof Error ? error.message : 'Runtime provenance load failed',
    };
  }
}

export function resolveSourceProvenance(
  state: SourceProvenanceLoadState,
  protocolId: string,
  nodeId: string,
  source: ReferenceSource,
  sourceIndex: number,
): SourceProvenance | null {
  if (state.status !== 'ready' || !state.manifest || protocolId !== state.manifest.protocol_id) {
    return null;
  }

  const entry = state.manifest.nodes[nodeId]?.sources.find(
    (candidate) => candidate.source_index === sourceIndex,
  );
  if (!entry) return null;

  const identity = state.manifest.source_catalog[entry.source_id];
  if (!identity || identity.label !== source.label || identity.url !== source.url) return null;

  return {
    ...entry,
    label: source.label,
    url: source.url,
    ...(source.note ? { note: source.note } : {}),
  };
}

export function resetSourceProvenanceRuntimeCacheForTests() {
  cache = null;
}
