import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const protocolPath = resolve(repoRoot, 'apps/client/src/protocols/unified-flow.json');
const manifestPath = resolve(repoRoot, 'apps/client/src/protocols/source-provenance.json');

const protocol = JSON.parse(readFileSync(protocolPath, 'utf8'));
const previousManifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : { nodes: {}, review_records: [] };

const sourceId = (source) =>
  `src_${createHash('sha256').update(`${source.url}\0${source.label}`).digest('hex').slice(0, 16)}`;

const nodeContentHash = (node) => createHash('sha256').update(JSON.stringify(node)).digest('hex');

const pendingRecord = (source, sourceIndex) => ({
  source_id: sourceId(source),
  source_index: sourceIndex,
  label: source.label,
  url: source.url,
  ...(source.note ? { note: source.note } : {}),
  version_or_date: null,
  source_status: 'pending',
  review_status: 'pending',
  authority_status: 'unknown',
  approved_use: null,
  reviewed_at: null,
  review_due: null,
  review_record_id: null,
});

const nodes = Object.fromEntries(
  Object.entries(protocol.nodes).map(([nodeId, node]) => {
    const sources = node.content?.sources ?? [];
    const previousNode = previousManifest.nodes?.[nodeId];
    const contentHash = nodeContentHash(node);
    const previousSources = previousNode?.node_content_hash === contentHash ? previousNode.sources : [];

    return [
      nodeId,
      {
        node_id: nodeId,
        node_content_hash: contentHash,
        sources: sources.map((source, sourceIndex) => {
          const previous = previousSources.find(
            (entry) =>
              entry.source_index === sourceIndex &&
              entry.label === source.label &&
              entry.url === source.url,
          );

          return previous ?? pendingRecord(source, sourceIndex);
        }),
      },
    ];
  }),
);

const manifest = {
  schema_version: '1.0.0',
  protocol_id: protocol.id,
  protocol_version: protocol.version,
  generated_from: 'apps/client/src/protocols/unified-flow.json',
  base_sha: '64a325516f1fa6065a169cb3aa837fb23571da04',
  nodes,
  review_records: previousManifest.review_records ?? [],
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const sourceCount = Object.values(nodes).reduce((total, node) => total + node.sources.length, 0);
console.log(`Wrote ${Object.keys(nodes).length} nodes and ${sourceCount} source mappings to ${manifestPath}`);
