import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonicalPath = resolve(repoRoot, 'apps/client/src/protocols/source-provenance.json');
const runtimePath = resolve(repoRoot, 'apps/client/public/generated/source-provenance-runtime.json');
const canonical = JSON.parse(readFileSync(canonicalPath, 'utf8'));

const sourceCatalog = {};
const nodes = Object.fromEntries(
  Object.entries(canonical.nodes).map(([nodeId, node]) => [
    nodeId,
    {
      node_content_hash: node.node_content_hash,
      sources: node.sources.map(({ label, url, note: _note, ...source }) => {
        const existing = sourceCatalog[source.source_id];
        if (existing && (existing.label !== label || existing.url !== url)) {
          throw new Error(`Conflicting source identity for ${source.source_id}`);
        }
        sourceCatalog[source.source_id] = { label, url };
        return source;
      }),
    },
  ]),
);
const sourceCount = Object.values(nodes).reduce((total, node) => total + node.sources.length, 0);

const runtimeManifest = {
  schema_version: canonical.schema_version,
  protocol_id: canonical.protocol_id,
  protocol_version: canonical.protocol_version,
  generated_from: canonical.generated_from,
  base_sha: canonical.base_sha,
  node_count: Object.keys(nodes).length,
  source_count: sourceCount,
  source_catalog: sourceCatalog,
  nodes,
  review_records: canonical.review_records,
};

mkdirSync(dirname(runtimePath), { recursive: true });
writeFileSync(runtimePath, `${JSON.stringify(runtimeManifest)}\n`);

console.log(
  `Wrote ${Object.keys(nodes).length} nodes, ${sourceCount} mappings, and ${Object.keys(sourceCatalog).length} catalog entries to ${runtimePath}`,
);
