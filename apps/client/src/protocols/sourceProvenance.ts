import type { ReferenceSource } from '../types/protocol';
import type {
  ReviewRecordReference,
  SourceProvenance,
  SourceProvenanceManifest,
} from '../types/sourceProvenance';
import manifestData from './source-provenance.json';

export const sourceProvenanceManifest = manifestData as SourceProvenanceManifest;

const reviewLabels = {
  not_requested: 'טרם התבקשה סקירה',
  pending: 'ממתין לסקירה',
  in_review: 'בסקירה',
  changes_requested: 'נדרשים שינויים',
  scope_blocked: 'חסום מחוץ להיקף',
  approved_for_stated_use: 'נבדק לשימוש המוצהר',
  rejected: 'נדחה',
  expired: 'תוקף הסקירה פג',
  withdrawn: 'נמשך',
} as const;

const authorityLabels = {
  unknown: 'סמכות לא ידועה',
  unassigned: 'לא הוקצה מאשר',
  nominated: 'מאשר הוצע',
  confirmed: 'סמכות מתועדת',
  declined: 'הסמכות נדחתה',
} as const;

export function getSourceProvenance(
  protocolId: string,
  nodeId: string,
  source: ReferenceSource,
  sourceIndex: number,
): SourceProvenance | null {
  if (protocolId !== sourceProvenanceManifest.protocol_id) {
    return null;
  }

  const entry = sourceProvenanceManifest.nodes[nodeId]?.sources.find(
    (candidate) =>
      candidate.source_index === sourceIndex &&
      candidate.label === source.label &&
      candidate.url === source.url,
  );

  return entry ?? null;
}

export function isApprovedForDisplay(
  provenance: SourceProvenance,
  reviewRecords: ReviewRecordReference[] = sourceProvenanceManifest.review_records,
  today = new Date(),
): boolean {
  if (
    provenance.review_status !== 'approved_for_stated_use' ||
    provenance.authority_status !== 'confirmed' ||
    provenance.source_status !== 'verified' ||
    !provenance.version_or_date ||
    !provenance.approved_use ||
    !provenance.reviewed_at ||
    !provenance.review_due ||
    !provenance.review_record_id
  ) {
    return false;
  }

  const reviewRecord = reviewRecords.find((record) => record.change_id === provenance.review_record_id);
  if (
    !reviewRecord ||
    reviewRecord.schema_version !== '1.0.0' ||
    !reviewRecord.title ||
    !reviewRecord.source ||
    reviewRecord.source.version_or_date !== provenance.version_or_date ||
    reviewRecord.source.stable_url_or_repo_path !== provenance.url ||
    !Array.isArray(reviewRecord.affected_paths) ||
    !Array.isArray(reviewRecord.affected_node_ids) ||
    typeof reviewRecord.before_exact !== 'string' ||
    typeof reviewRecord.after_exact !== 'string' ||
    typeof reviewRecord.semantic_diff !== 'string' ||
    !Array.isArray(reviewRecord.review_assignments) ||
    !Array.isArray(reviewRecord.review_decisions) ||
    reviewRecord.review_status !== 'approved_for_stated_use' ||
    reviewRecord.authority_status !== 'confirmed' ||
    reviewRecord.source_status !== 'verified' ||
    !reviewRecord.approved_use ||
    !reviewRecord.decided_at ||
    !reviewRecord.review_due
  ) {
    return false;
  }

  const independentApprovals = new Set(
    reviewRecord.review_decisions
      .filter(
        (decision) =>
          decision.decision === 'approved' &&
          Boolean(decision.reviewer_name) &&
          Boolean(decision.scope_statement) &&
          Boolean(decision.decided_at),
      )
      .map((decision) => decision.reviewer_name),
  );

  const endOfReviewDueDate = new Date(`${provenance.review_due}T23:59:59.999Z`);
  const recordReviewDueDate = new Date(`${reviewRecord.review_due}T23:59:59.999Z`);

  return independentApprovals.size >= 2 && endOfReviewDueDate >= today && recordReviewDueDate >= today;
}

export function getSourceProvenancePresentation(provenance: SourceProvenance | null) {
  if (!provenance) {
    return {
      approved: false,
      reviewLabel: 'עקיבות חסרה',
      authorityLabel: 'סמכות לא ידועה',
      versionLabel: 'לא תועדה',
      reviewedAtLabel: 'טרם נבדק',
    };
  }

  const approved = isApprovedForDisplay(provenance);

  return {
    approved,
    reviewLabel:
      approved
        ? reviewLabels.approved_for_stated_use
        : provenance.review_status === 'approved_for_stated_use'
          ? 'אישור חסר או לא תקף'
          : reviewLabels[provenance.review_status],
    authorityLabel: authorityLabels[provenance.authority_status],
    versionLabel: provenance.version_or_date ?? 'לא תועדה',
    reviewedAtLabel: provenance.reviewed_at
      ? new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(provenance.reviewed_at))
      : 'טרם נבדק',
  };
}
