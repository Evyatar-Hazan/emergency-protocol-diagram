import type { Node, Protocol } from '../types/protocol';
import { isApprovedForDisplay } from '../protocols/sourceProvenance';
import { resolveSourceProvenance } from '../protocols/sourceProvenanceRuntime';
import type { SourceProvenanceLoadState } from '../types/sourceProvenance';

export const OFFLINE_PACKAGE_SCHEMA_VERSION = '1.0.0' as const;

export interface OfflineLearningSource {
  label: string;
  url: string;
  versionOrDate: string;
  approvedUse: string;
  reviewedAt: string;
  reviewDue: string;
}

export interface OfflineLearningNode {
  id: string;
  title: string;
  description?: string;
  severity?: Node['severity'];
  content?: Omit<NonNullable<Node['content']>, 'actions' | 'sources'>;
  sources: OfflineLearningSource[];
}

export interface OfflineLearningPayload {
  schemaVersion: typeof OFFLINE_PACKAGE_SCHEMA_VERSION;
  packageId: string;
  intendedUse: 'learning_only';
  protocolId: string;
  protocolName: string;
  protocolVersion: string;
  provenanceBaseSha: string;
  createdAt: string;
  reviewValidUntil: string;
  nodeCount: number;
  nodes: OfflineLearningNode[];
}

export interface OfflineLearningPackage {
  payload: OfflineLearningPayload;
  integrity: string;
}

export interface OfflinePackageBuildResult {
  package: OfflineLearningPackage | null;
  totalNodeCount: number;
  approvedNodeCount: number;
  excludedNodeCount: number;
  reasons: string[];
}

export type OfflinePackageFreshness = 'current' | 'stale' | 'invalid';

const encoder = new TextEncoder();

const toHex = (bytes: ArrayBuffer): string =>
  [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

export async function sha256(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

export async function verifyOfflinePackageIntegrity(
  packageValue: OfflineLearningPackage,
): Promise<boolean> {
  return (await sha256(JSON.stringify(packageValue.payload))) === packageValue.integrity;
}

const sanitizeContent = (content: Node['content']): OfflineLearningNode['content'] => {
  if (!content) return undefined;
  const readingContent = { ...content };
  delete readingContent.actions;
  delete readingContent.sources;
  return JSON.parse(JSON.stringify(readingContent)) as OfflineLearningNode['content'];
};

const packageIdPart = (value: string): string => value.replace(/[^a-zA-Z0-9._-]/g, '-');

export async function buildOfflineLearningPackage(
  protocol: Protocol,
  provenanceState: SourceProvenanceLoadState,
  now = new Date(),
): Promise<OfflinePackageBuildResult> {
  const totalNodeCount = Object.keys(protocol.nodes).length;
  if (provenanceState.status !== 'ready' || !provenanceState.manifest) {
    return {
      package: null,
      totalNodeCount,
      approvedNodeCount: 0,
      excludedNodeCount: totalNodeCount,
      reasons: ['נתוני העקיבות אינם זמינים במצב ready; יצירת חבילת offline נחסמה.'],
    };
  }

  if (provenanceState.manifest.protocol_id !== protocol.id) {
    return {
      package: null,
      totalNodeCount,
      approvedNodeCount: 0,
      excludedNodeCount: totalNodeCount,
      reasons: ['גרסת העקיבות אינה תואמת לפרוטוקול הפעיל.'],
    };
  }

  const nodes: OfflineLearningNode[] = [];
  const reviewDueDates: string[] = [];

  for (const [nodeId, node] of Object.entries(protocol.nodes).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const sources = node.content?.sources ?? [];
    if (sources.length === 0) continue;

    const approvedSources: OfflineLearningSource[] = [];
    for (const [sourceIndex, source] of sources.entries()) {
      const provenance = resolveSourceProvenance(
        provenanceState,
        protocol.id,
        nodeId,
        source,
        sourceIndex,
      );
      if (
        !provenance ||
        !isApprovedForDisplay(provenance, provenanceState.manifest.review_records, now)
      ) {
        approvedSources.length = 0;
        break;
      }

      approvedSources.push({
        label: source.label,
        url: source.url,
        versionOrDate: provenance.version_or_date!,
        approvedUse: provenance.approved_use!,
        reviewedAt: provenance.reviewed_at!,
        reviewDue: provenance.review_due!,
      });
    }

    if (approvedSources.length !== sources.length) continue;
    approvedSources.forEach(({ reviewDue }) => reviewDueDates.push(reviewDue));
    nodes.push({
      id: nodeId,
      title: node.title,
      ...(node.description ? { description: node.description } : {}),
      ...(node.severity ? { severity: node.severity } : {}),
      ...(node.content ? { content: sanitizeContent(node.content) } : {}),
      sources: approvedSources,
    });
  }

  if (nodes.length === 0) {
    return {
      package: null,
      totalNodeCount,
      approvedNodeCount: 0,
      excludedNodeCount: totalNodeCount,
      reasons: [
        'אין כרגע צמתים שכל מקורותיהם verified, סמכותם confirmed והסקירה שלהם בתוקף. תוכן pending לא נשמר ולא מוצג כמאושר.',
      ],
    };
  }

  const reviewValidUntil = [...reviewDueDates].sort()[0];
  const payload: OfflineLearningPayload = {
    schemaVersion: OFFLINE_PACKAGE_SCHEMA_VERSION,
    packageId: [
      packageIdPart(protocol.id),
      packageIdPart(protocol.version),
      packageIdPart(provenanceState.manifest.base_sha.slice(0, 12)),
    ].join('-'),
    intendedUse: 'learning_only',
    protocolId: protocol.id,
    protocolName: protocol.name,
    protocolVersion: protocol.version,
    provenanceBaseSha: provenanceState.manifest.base_sha,
    createdAt: now.toISOString(),
    reviewValidUntil: `${reviewValidUntil}T23:59:59.999Z`,
    nodeCount: nodes.length,
    nodes,
  };

  return {
    package: {
      payload,
      integrity: await sha256(JSON.stringify(payload)),
    },
    totalNodeCount,
    approvedNodeCount: nodes.length,
    excludedNodeCount: totalNodeCount - nodes.length,
    reasons: totalNodeCount === nodes.length
      ? []
      : [`${totalNodeCount - nodes.length} צמתים הושמטו משום שלא עברו את חוזה האישור.`],
  };
}

export async function getOfflinePackageFreshness(
  packageValue: OfflineLearningPackage,
  now = new Date(),
): Promise<OfflinePackageFreshness> {
  if (
    packageValue.payload.schemaVersion !== OFFLINE_PACKAGE_SCHEMA_VERSION ||
    packageValue.payload.intendedUse !== 'learning_only' ||
    packageValue.payload.nodeCount <= 0 ||
    packageValue.payload.nodes.length !== packageValue.payload.nodeCount ||
    !(await verifyOfflinePackageIntegrity(packageValue))
  ) {
    return 'invalid';
  }

  return new Date(packageValue.payload.reviewValidUntil).getTime() >= now.getTime()
    ? 'current'
    : 'stale';
}
