import { describe, expect, it } from 'vitest';
import unifiedFlow from '../protocols/unified-flow.json';
import runtimeManifestData from '../../public/generated/source-provenance-runtime.json';
import type { Protocol } from '../types/protocol';
import type {
  ReviewRecordReference,
  RuntimeSourceProvenanceManifest,
  SourceProvenanceLoadState,
} from '../types/sourceProvenance';
import {
  buildNodeDiff,
  createContentDraft,
  getReviewGateSummary,
  rollbackContentDraft,
  saveContentDraftRevision,
  selectDraftRevision,
  transitionContentDraft,
  validateContentDraft,
} from './contentWorkflow';

const protocol = unifiedFlow as Protocol;
const readyProvenanceState: SourceProvenanceLoadState = {
  status: 'ready',
  manifest: runtimeManifestData as RuntimeSourceProvenanceManifest,
  loadedAt: 1,
  error: null,
};
const firstDate = new Date('2026-10-02T12:00:00.000Z');
const secondDate = new Date('2026-10-02T12:01:00.000Z');

const validMetadata = {
  changeId: 'CLIN-2026-999',
  authorName: 'Synthetic author',
  intendedUse: 'learning_only' as const,
  riskTier: 'G1' as const,
  reason: 'Synthetic workflow verification only',
  semanticDiff: 'No clinical claim; synthetic description change for tests',
};

describe('content draft workflow', () => {
  it('creates an isolated draft without changing the runtime node', () => {
    const runtimeTitle = protocol.nodes.report_departure.title;
    const workspace = createContentDraft(protocol, 'report_departure', firstDate);
    const revision = selectDraftRevision(workspace, workspace.activeRevisionId);

    revision.proposedNode.title = 'Synthetic title';

    expect(protocol.nodes.report_departure.title).toBe(runtimeTitle);
    expect(revision.baseNode.title).toBe(runtimeTitle);
    expect(revision.status).toBe('draft');
    expect(revision.version).toBe(1);
  });

  it('builds a field-level preview diff and validates graph targets', () => {
    const workspace = createContentDraft(protocol, 'report_departure', firstDate);
    const revision = selectDraftRevision(workspace, workspace.activeRevisionId);
    const proposedNode = {
      ...revision.proposedNode,
      description: 'Synthetic description',
      next: 'missing-node',
    };
    const candidate = { ...revision, ...validMetadata, proposedNode };

    expect(buildNodeDiff(revision.baseNode, proposedNode)).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'description', kind: 'changed', after: 'Synthetic description' }),
      expect.objectContaining({ path: 'next', kind: 'changed', after: 'missing-node' }),
    ]));
    expect(validateContentDraft(candidate, protocol)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'target-missing-node', level: 'error' }),
    ]));
  });

  it('moves a valid draft into review but fails closed on pending sources and unknown authority', () => {
    let workspace = createContentDraft(protocol, 'report_departure', firstDate);
    const initial = selectDraftRevision(workspace, workspace.activeRevisionId);
    workspace = saveContentDraftRevision(workspace, {
      ...validMetadata,
      proposedNode: { ...initial.proposedNode, description: 'Synthetic description' },
    }, protocol, secondDate);

    expect(validateContentDraft(selectDraftRevision(workspace, workspace.activeRevisionId), protocol)
      .filter(({ level }) => level === 'error')).toHaveLength(0);

    workspace = transitionContentDraft(
      workspace,
      'evidence_ready',
      protocol,
      readyProvenanceState,
      new Date('2026-10-02T12:02:00.000Z'),
    );
    workspace = transitionContentDraft(
      workspace,
      'in_review',
      protocol,
      readyProvenanceState,
      new Date('2026-10-02T12:03:00.000Z'),
    );

    const reviewRevision = selectDraftRevision(workspace, workspace.activeRevisionId);
    const gates = getReviewGateSummary(reviewRevision, readyProvenanceState, firstDate);
    expect(reviewRevision.status).toBe('in_review');
    expect(gates.hasPendingSource).toBe(true);
    expect(gates.hasUnknownAuthority).toBe(true);
    expect(gates.canClaimApproval).toBe(false);
    expect(() => transitionContentDraft(
      workspace,
      'approved_for_stated_use',
      protocol,
      readyProvenanceState,
      new Date('2026-10-02T12:04:00.000Z'),
    )).toThrow(/fail-closed/);
  });

  it('rolls back by adding a traceable revision instead of deleting history', () => {
    let workspace = createContentDraft(protocol, 'report_departure', firstDate);
    const firstRevisionId = workspace.activeRevisionId;
    const initial = selectDraftRevision(workspace, firstRevisionId);
    workspace = saveContentDraftRevision(workspace, {
      ...validMetadata,
      proposedNode: { ...initial.proposedNode, description: 'Synthetic description' },
    }, protocol, secondDate);
    const historyBeforeRollback = workspace.revisions.length;

    workspace = rollbackContentDraft(workspace, firstRevisionId, new Date('2026-10-02T12:05:00.000Z'));
    const rollbackRevision = selectDraftRevision(workspace, workspace.activeRevisionId);

    expect(workspace.revisions).toHaveLength(historyBeforeRollback + 1);
    expect(rollbackRevision.auditKind).toBe('rollback');
    expect(rollbackRevision.rollbackOfRevisionId).toBe(firstRevisionId);
    expect(rollbackRevision.status).toBe('draft');
    expect(rollbackRevision.proposedNode.description).toBe(initial.proposedNode.description);
  });

  it('fails closed when provenance is loading or stale', () => {
    const workspace = createContentDraft(protocol, 'report_departure', firstDate);
    const revision = { ...selectDraftRevision(workspace, workspace.activeRevisionId), ...validMetadata };
    const loadingState: SourceProvenanceLoadState = {
      status: 'loading',
      manifest: null,
      loadedAt: null,
      error: null,
    };
    const staleState: SourceProvenanceLoadState = {
      status: 'stale',
      manifest: readyProvenanceState.manifest,
      loadedAt: 1,
      error: 'refresh failed',
    };

    expect(getReviewGateSummary(revision, loadingState, firstDate)).toMatchObject({ canClaimApproval: false });
    expect(getReviewGateSummary(revision, staleState, firstDate)).toMatchObject({ canClaimApproval: false });
  });

  it('blocks a nominal approval when the only assigned second reviewer is not independent of the author', () => {
    const nodeId = 'initial_presentation_gate';
    const workspace = createContentDraft(protocol, nodeId, firstDate);
    const revision = {
      ...selectDraftRevision(workspace, workspace.activeRevisionId),
      ...validMetadata,
      riskTier: 'G2' as const,
    };
    const baseManifest = readyProvenanceState.manifest!;
    const sourceMapping = baseManifest.nodes[nodeId].sources[0];
    const sourceIdentity = baseManifest.source_catalog[sourceMapping.source_id];
    const reviewRecord: ReviewRecordReference = {
      schema_version: '1.0.0',
      change_id: 'CLIN-2026-999',
      title: 'Synthetic independence check',
      intended_use: 'learning_only',
      content_domain: 'bls',
      risk_tier: 'G2',
      review_status: 'approved_for_stated_use',
      authority_status: 'confirmed',
      source_status: 'verified',
      source: {
        publisher: 'Synthetic publisher',
        title: 'Synthetic source',
        version_or_date: 'synthetic-v1',
        stable_url_or_repo_path: sourceIdentity.url,
        page_section_anchor: 'synthetic-section',
        accessed_at: '2026-01-01',
        organizational_status: 'unknown',
      },
      affected_paths: ['synthetic/path'],
      affected_node_ids: [nodeId],
      before_exact: 'before',
      after_exact: 'after',
      semantic_diff: 'synthetic',
      review_assignments: [
        {
          role: 'author-reviewer',
          assignee_status: 'confirmed',
          assignee_name: 'Synthetic author',
          authority_basis: 'synthetic',
          scope_statement: 'synthetic',
          independent_of_author: false,
        },
        {
          role: 'second-reviewer',
          assignee_status: 'confirmed',
          assignee_name: 'Synthetic reviewer two',
          authority_basis: 'synthetic',
          scope_statement: 'synthetic',
          independent_of_author: false,
        },
      ],
      approved_use: 'synthetic-test-only',
      decided_at: '2026-01-02T00:00:00Z',
      review_due: '2027-01-01',
      review_decisions: [
        {
          role: 'author-reviewer',
          decision: 'approved',
          reviewer_name: 'Synthetic author',
          scope_statement: 'synthetic',
          notes: '',
          decided_at: '2026-01-01T00:00:00Z',
        },
        {
          role: 'second-reviewer',
          decision: 'approved',
          reviewer_name: 'Synthetic reviewer two',
          scope_statement: 'synthetic',
          notes: '',
          decided_at: '2026-01-02T00:00:00Z',
        },
      ],
    };
    const manifest: RuntimeSourceProvenanceManifest = {
      ...baseManifest,
      nodes: {
        ...baseManifest.nodes,
        [nodeId]: {
          ...baseManifest.nodes[nodeId],
          sources: [{
            ...sourceMapping,
            version_or_date: 'synthetic-v1',
            source_status: 'verified',
            review_status: 'approved_for_stated_use',
            authority_status: 'confirmed',
            approved_use: 'synthetic-test-only',
            reviewed_at: '2026-01-02T00:00:00Z',
            review_due: '2027-01-01',
            review_record_id: 'CLIN-2026-999',
          }],
        },
      },
      review_records: [reviewRecord],
    };
    const state: SourceProvenanceLoadState = { status: 'ready', manifest, loadedAt: 1, error: null };

    expect(getReviewGateSummary(revision, state, firstDate)).toMatchObject({
      approvedSourceCount: 1,
      hasIndependentReviewer: false,
      canClaimApproval: false,
    });
  });
});
