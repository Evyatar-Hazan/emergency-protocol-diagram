export type ReviewStatus =
  | 'not_requested'
  | 'pending'
  | 'in_review'
  | 'changes_requested'
  | 'scope_blocked'
  | 'approved_for_stated_use'
  | 'rejected'
  | 'expired'
  | 'withdrawn';

export type AuthorityStatus = 'unknown' | 'unassigned' | 'nominated' | 'confirmed' | 'declined';

export type SourceStatus = 'missing' | 'pending' | 'verified' | 'rejected';

export interface SourceProvenance {
  source_id: string;
  source_index: number;
  label: string;
  url: string;
  note?: string;
  version_or_date: string | null;
  source_status: SourceStatus;
  review_status: ReviewStatus;
  authority_status: AuthorityStatus;
  approved_use: string | null;
  reviewed_at: string | null;
  review_due: string | null;
  review_record_id: string | null;
}

export interface NodeSourceProvenance {
  node_id: string;
  node_content_hash: string;
  sources: SourceProvenance[];
}

export interface ReviewRecordReference {
  schema_version: '1.0.0';
  change_id: string;
  title: string;
  intended_use: 'learning_only' | 'training_facilitation' | 'unknown';
  content_domain:
    | 'non_clinical'
    | 'product_scope'
    | 'bls'
    | 'als'
    | 'organizational_policy'
    | 'legal'
    | 'unknown';
  risk_tier: 'G0' | 'G1' | 'G2' | 'G3' | 'unknown';
  review_status: ReviewStatus;
  authority_status: AuthorityStatus;
  source_status: SourceStatus;
  gaps: Array<{
    domain: 'source' | 'content_alignment' | 'ui_design' | 'none' | 'unknown';
    type: string;
    status: 'open' | 'pending' | 'resolved' | 'accepted' | 'unknown';
    evidence_paths: string[];
    owner_role: string;
  }>;
  source: {
    source_tier:
      | 'S1'
      | 'S1_DERIVED'
      | 'S2_CANDIDATE'
      | 'S3_SUPPLEMENTARY'
      | 'RUNTIME'
      | 'COMMUNITY'
      | 'unknown';
    publisher: string;
    title: string;
    version_or_date: string;
    stable_url_or_repo_path: string;
    page_section_anchor: string;
    accessed_at: string;
    organizational_status: 'public' | 'organization_approved' | 'unknown';
    version_currency: 'as_received' | 'current_verified' | 'superseded' | 'conflicting' | 'unknown';
  } | null;
  affected_paths: string[];
  affected_node_ids: string[];
  before_exact: string;
  after_exact: string;
  semantic_diff: string;
  review_assignments: Array<{
    role: string;
    assignee_status: AuthorityStatus;
    assignee_name: string | null;
    authority_basis: string;
    scope_statement: string | null;
    independent_of_author?: boolean | null;
  }>;
  approved_use: string | null;
  decided_at: string | null;
  review_due: string | null;
  review_decisions: Array<{
    role: string;
    decision: string;
    reviewer_name: string | null;
    scope_statement: string | null;
    notes: string;
    decided_at?: string | null;
  }>;
}

export interface SourceProvenanceManifest {
  schema_version: '1.0.0';
  protocol_id: string;
  protocol_version: string;
  generated_from: string;
  base_sha: string;
  nodes: Record<string, NodeSourceProvenance>;
  review_records: ReviewRecordReference[];
}

export type RuntimeSourceProvenance = Omit<SourceProvenance, 'label' | 'url' | 'note'>;

export interface RuntimeNodeSourceProvenance {
  node_content_hash: string;
  sources: RuntimeSourceProvenance[];
}

export interface RuntimeSourceCatalogEntry {
  label: string;
  url: string;
}

export interface RuntimeSourceProvenanceManifest {
  schema_version: '1.0.0';
  protocol_id: string;
  protocol_version: string;
  generated_from: string;
  base_sha: string;
  node_count: number;
  source_count: number;
  source_catalog: Record<string, RuntimeSourceCatalogEntry>;
  nodes: Record<string, RuntimeNodeSourceProvenance>;
  review_records: ReviewRecordReference[];
}

export type SourceProvenanceLoadStatus = 'loading' | 'ready' | 'error' | 'stale';

export interface SourceProvenanceLoadState {
  status: SourceProvenanceLoadStatus;
  manifest: RuntimeSourceProvenanceManifest | null;
  loadedAt: number | null;
  error: string | null;
}
