import { describe, expect, it } from 'vitest';
import type { Protocol } from '../types/protocol';
import type {
  ReviewRecordReference,
  RuntimeSourceProvenanceManifest,
  SourceProvenanceLoadState,
} from '../types/sourceProvenance';
import { protocolsData } from '../protocols';
import currentRuntimeManifest from '../../public/generated/source-provenance-runtime.json';
import {
  buildOfflineLearningPackage,
  getOfflinePackageFreshness,
  verifyOfflinePackageIntegrity,
} from './offlineLearningPackage';

const sourceUrl = 'https://example.org/approved-source';

const protocol: Protocol = {
  id: 'unified_flow',
  name: 'מסלול בדיקה',
  description: 'בדיקה בלבד',
  version: '2.0.0',
  startNode: 'approved',
  nodes: {
    approved: {
      id: 'approved',
      type: 'info',
      title: 'תוכן מאומת',
      content: {
        about: 'תוכן לימודי',
        actions: [{ label: 'המשך', target: 'pending' }],
        sources: [{ label: 'מקור מאושר', url: sourceUrl }],
      },
    },
    pending: {
      id: 'pending',
      type: 'info',
      title: 'תוכן ממתין',
      content: { sources: [{ label: 'מקור ממתין', url: 'https://example.org/pending' }] },
    },
    missing: { id: 'missing', type: 'info', title: 'ללא מקור' },
  },
};

const approvedReviewRecord: ReviewRecordReference = {
  schema_version: '1.0.0',
  change_id: 'CLIN-2026-001',
  title: 'אישור בדיקה',
  intended_use: 'learning_only',
  content_domain: 'bls',
  risk_tier: 'G2',
  review_status: 'approved_for_stated_use',
  authority_status: 'confirmed',
  source_status: 'verified',
  source: {
    publisher: 'Test publisher',
    title: 'Test source',
    version_or_date: '2026.1',
    stable_url_or_repo_path: sourceUrl,
    page_section_anchor: 'p1',
    accessed_at: '2026-09-01',
    organizational_status: 'organization_approved',
  },
  affected_paths: ['apps/client/src/protocols/unified-flow.json'],
  affected_node_ids: ['approved'],
  before_exact: 'before',
  after_exact: 'after',
  semantic_diff: 'test',
  review_assignments: [],
  approved_use: 'learning_only',
  decided_at: '2026-09-01',
  review_due: '2027-09-01',
  review_decisions: [
    {
      role: 'clinical-reviewer',
      decision: 'approved',
      reviewer_name: 'Reviewer A',
      scope_statement: 'learning_only',
      notes: 'test',
      decided_at: '2026-09-01',
    },
    {
      role: 'content-owner',
      decision: 'approved',
      reviewer_name: 'Reviewer B',
      scope_statement: 'learning_only',
      notes: 'test',
      decided_at: '2026-09-01',
    },
  ],
};

const manifest: RuntimeSourceProvenanceManifest = {
  schema_version: '1.0.0',
  protocol_id: 'unified_flow',
  protocol_version: '2.0.0',
  generated_from: 'test',
  base_sha: 'a'.repeat(40),
  node_count: 3,
  source_count: 2,
  source_catalog: {
    approved_source: { label: 'מקור מאושר', url: sourceUrl },
    pending_source: { label: 'מקור ממתין', url: 'https://example.org/pending' },
  },
  nodes: {
    approved: {
      node_content_hash: 'a'.repeat(64),
      sources: [{
        source_id: 'approved_source',
        source_index: 0,
        version_or_date: '2026.1',
        source_status: 'verified',
        review_status: 'approved_for_stated_use',
        authority_status: 'confirmed',
        approved_use: 'learning_only',
        reviewed_at: '2026-09-01',
        review_due: '2027-09-01',
        review_record_id: 'CLIN-2026-001',
      }],
    },
    pending: {
      node_content_hash: 'b'.repeat(64),
      sources: [{
        source_id: 'pending_source',
        source_index: 0,
        version_or_date: null,
        source_status: 'pending',
        review_status: 'pending',
        authority_status: 'unknown',
        approved_use: null,
        reviewed_at: null,
        review_due: null,
        review_record_id: null,
      }],
    },
    missing: { node_content_hash: 'c'.repeat(64), sources: [] },
  },
  review_records: [approvedReviewRecord],
};

const readyState: SourceProvenanceLoadState = {
  status: 'ready',
  manifest,
  loadedAt: 1,
  error: null,
};

describe('offline learning package', () => {
  it('fails closed for the current canonical dataset because all review records are still pending', async () => {
    const currentManifest = currentRuntimeManifest as RuntimeSourceProvenanceManifest;
    const result = await buildOfflineLearningPackage(
      protocolsData.protocols.unified_flow,
      { status: 'ready', manifest: currentManifest, loadedAt: 1, error: null },
      new Date('2026-10-02T12:00:00Z'),
    );

    expect(result.totalNodeCount).toBe(205);
    expect(result.approvedNodeCount).toBe(0);
    expect(result.excludedNodeCount).toBe(205);
    expect(result.package).toBeNull();
  });

  it('includes only fully approved nodes and strips navigation actions', async () => {
    const result = await buildOfflineLearningPackage(protocol, readyState, new Date('2026-10-02T12:00:00Z'));

    expect(result.approvedNodeCount).toBe(1);
    expect(result.excludedNodeCount).toBe(2);
    expect(result.package?.payload.nodes).toHaveLength(1);
    expect(result.package?.payload.nodes[0]).toMatchObject({ id: 'approved', title: 'תוכן מאומת' });
    expect(result.package?.payload.nodes[0].content).not.toHaveProperty('actions');
    expect(await verifyOfflinePackageIntegrity(result.package!)).toBe(true);
  });

  it.each(['loading', 'error', 'stale'] as const)('fails closed when provenance is %s', async (status) => {
    const result = await buildOfflineLearningPackage(protocol, {
      status,
      manifest: status === 'stale' ? manifest : null,
      loadedAt: null,
      error: status === 'loading' ? null : 'test',
    });
    expect(result.package).toBeNull();
    expect(result.approvedNodeCount).toBe(0);
  });

  it('does not create a package when every source is pending', async () => {
    const pendingManifest: RuntimeSourceProvenanceManifest = {
      ...manifest,
      nodes: {
        ...manifest.nodes,
        approved: {
          ...manifest.nodes.approved,
          sources: [{ ...manifest.nodes.approved.sources[0], review_status: 'pending' }],
        },
      },
    };
    const result = await buildOfflineLearningPackage(protocol, {
      ...readyState,
      manifest: pendingManifest,
    });
    expect(result.package).toBeNull();
    expect(result.reasons.join(' ')).toContain('pending');
  });

  it('marks expired and tampered packages unusable', async () => {
    const result = await buildOfflineLearningPackage(protocol, readyState, new Date('2026-10-02T12:00:00Z'));
    expect(await getOfflinePackageFreshness(result.package!, new Date('2027-09-02T00:00:00Z'))).toBe('stale');

    const tampered = structuredClone(result.package!);
    tampered.payload.nodes[0].title = 'שונה לאחר החתימה';
    expect(await getOfflinePackageFreshness(tampered, new Date('2026-10-02T12:00:00Z'))).toBe('invalid');
  });
});
