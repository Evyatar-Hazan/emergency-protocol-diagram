import { describe, expect, it } from 'vitest';
import unifiedFlow from './unified-flow.json';
import manifestData from './source-provenance.json';
import {
  getSourceProvenancePresentation,
  isApprovedForDisplay,
} from './sourceProvenance';
import type {
  ReviewRecordReference,
  SourceProvenance,
  SourceProvenanceManifest,
} from '../types/sourceProvenance';

const sourceProvenanceManifest = manifestData as SourceProvenanceManifest;

describe('source provenance manifest', () => {
  it('covers every unified-flow node and every declared source without changing source content', () => {
    const protocolNodes = Object.entries(unifiedFlow.nodes);

    expect(Object.keys(sourceProvenanceManifest.nodes)).toHaveLength(205);
    expect(Object.keys(sourceProvenanceManifest.nodes).sort()).toEqual(
      protocolNodes.map(([nodeId]) => nodeId).sort(),
    );

    for (const [nodeId, node] of protocolNodes) {
      const sources = node.content?.sources ?? [];
      const mappedNode = sourceProvenanceManifest.nodes[nodeId];
      const mappedSources = mappedNode?.sources ?? [];

      expect(mappedNode?.node_content_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(mappedSources).toHaveLength(sources.length);
      sources.forEach((source, sourceIndex) => {
        expect(mappedSources[sourceIndex]).toMatchObject({
          label: source.label,
          url: source.url,
          source_index: sourceIndex,
        });
      });
    }
  });

  it('seeds every existing source fail-closed without inventing a version or approval', () => {
    const mappings = Object.values(sourceProvenanceManifest.nodes).flatMap((node) => node.sources);

    expect(mappings).toHaveLength(317);
    expect(mappings.every((source) => source.version_or_date === null)).toBe(true);
    expect(mappings.every((source) => source.source_status === 'pending')).toBe(true);
    expect(mappings.every((source) => source.review_status === 'pending')).toBe(true);
    expect(mappings.every((source) => source.authority_status === 'unknown')).toBe(true);
    expect(mappings.every((source) => !isApprovedForDisplay(source))).toBe(true);
  });

  it('does not show approval without a matching, current review record and two named approvals', () => {
    const provenance: SourceProvenance = {
      ...sourceProvenanceManifest.nodes.report_departure.sources[0],
      version_or_date: 'synthetic-v1',
      source_status: 'verified',
      review_status: 'approved_for_stated_use',
      authority_status: 'confirmed',
      approved_use: 'synthetic-test-only',
      reviewed_at: '2026-01-01T00:00:00Z',
      review_due: '2027-01-01',
      review_record_id: 'CLIN-2026-999',
    };
    const incompleteReview: ReviewRecordReference = {
      schema_version: '1.0.0',
      change_id: 'CLIN-2026-999',
      title: 'Synthetic provenance review',
      intended_use: 'learning_only',
      content_domain: 'bls',
      risk_tier: 'G2',
      review_status: 'approved_for_stated_use',
      authority_status: 'confirmed',
      source_status: 'verified',
      gaps: [],
      source: {
        source_tier: 'S3_SUPPLEMENTARY',
        publisher: 'Synthetic publisher',
        title: 'Synthetic source',
        version_or_date: 'synthetic-v1',
        stable_url_or_repo_path: provenance.url,
        page_section_anchor: 'synthetic-section',
        accessed_at: '2026-01-01',
        organizational_status: 'unknown',
        version_currency: 'current_verified',
      },
      affected_paths: ['synthetic/path'],
      affected_node_ids: ['synthetic-node'],
      before_exact: 'before',
      after_exact: 'after',
      semantic_diff: 'synthetic diff',
      review_assignments: [
        {
          role: 'bls_reviewer',
          assignee_status: 'confirmed',
          assignee_name: 'Synthetic reviewer one',
          authority_basis: 'verified_certification',
          scope_statement: 'Synthetic test scope',
          independent_of_author: true,
        },
      ],
      approved_use: 'synthetic-test-only',
      decided_at: '2026-01-01T00:00:00Z',
      review_due: '2027-01-01',
      review_decisions: [
        {
          role: 'bls_reviewer',
          decision: 'approved',
          reviewer_name: 'Synthetic reviewer one',
          scope_statement: 'Synthetic test scope',
          notes: '',
          decided_at: '2026-01-01T00:00:00Z',
        },
      ],
    };

    expect(isApprovedForDisplay(provenance, [], new Date('2026-10-02T00:00:00Z'))).toBe(false);
    expect(getSourceProvenancePresentation(provenance).reviewLabel).toBe('אישור חסר או לא תקף');
    expect(isApprovedForDisplay(provenance, [incompleteReview], new Date('2026-10-02T00:00:00Z'))).toBe(false);
    expect(
      isApprovedForDisplay(
        provenance,
        [
          {
            ...incompleteReview,
            review_decisions: [
              ...incompleteReview.review_decisions!,
              {
                role: 'clinical_approver',
                decision: 'approved',
                reviewer_name: 'Synthetic reviewer two',
                scope_statement: 'Synthetic test scope',
                notes: '',
                decided_at: '2026-01-02T00:00:00Z',
              },
            ],
          },
        ],
        new Date('2026-10-02T00:00:00Z'),
      ),
    ).toBe(true);
  });

  it('uses a fail-closed presentation when provenance is absent', () => {
    expect(getSourceProvenancePresentation(null)).toEqual({
      approved: false,
      reviewLabel: 'עקיבות חסרה',
      authorityLabel: 'סמכות לא ידועה',
      versionLabel: 'לא תועדה',
      reviewedAtLabel: 'טרם נבדק',
    });
  });
});
