import type { Node, NodeType, Protocol, ReferenceSource } from '../types/protocol';
import type { SourceProvenanceLoadState } from '../types/sourceProvenance';
import { isApprovedForDisplay } from '../protocols/sourceProvenance';
import { resolveSourceProvenance } from '../protocols/sourceProvenanceRuntime';

export type ContentRiskTier = 'G0' | 'G1' | 'G2' | 'G3' | 'unknown';

export type ContentDraftStatus =
  | 'draft'
  | 'evidence_ready'
  | 'in_review'
  | 'changes_requested'
  | 'scope_blocked'
  | 'approved_for_stated_use'
  | 'release_ready'
  | 'withdrawn';

export type DraftAuditKind = 'created' | 'revision' | 'transition' | 'rollback';

export interface ContentDraftMetadata {
  changeId: string;
  authorName: string;
  intendedUse: 'learning_only' | 'training_facilitation';
  riskTier: ContentRiskTier;
  reason: string;
  semanticDiff: string;
}

export interface ContentDraftRevision extends ContentDraftMetadata {
  revisionId: string;
  version: number;
  parentRevisionId: string | null;
  rollbackOfRevisionId: string | null;
  auditKind: DraftAuditKind;
  status: ContentDraftStatus;
  nodeId: string;
  baseProtocolVersion: string;
  baseNode: Node;
  proposedNode: Node;
  createdAt: string;
}

export interface ContentDraftWorkspace {
  draftId: string;
  protocolId: string;
  nodeId: string;
  activeRevisionId: string;
  revisions: ContentDraftRevision[];
}

export interface ValidationIssue {
  code: string;
  level: 'error' | 'warning';
  message: string;
}

export interface NodeDiffEntry {
  path: string;
  kind: 'added' | 'removed' | 'changed';
  before: string;
  after: string;
}

export interface ReviewGateSummary {
  sourceCount: number;
  approvedSourceCount: number;
  hasPendingSource: boolean;
  hasUnknownAuthority: boolean;
  hasIndependentReviewer: boolean;
  canClaimApproval: boolean;
  canEnterReleaseReady: boolean;
  reasons: string[];
}

export interface SaveDraftRevisionInput extends ContentDraftMetadata {
  proposedNode: Node;
}

const nodeTypes: readonly NodeType[] = [
  'start',
  'decision',
  'check',
  'question',
  'action',
  'diagnosis',
  'info',
  'end',
];

const allowedNodeKeys = new Set([
  'id',
  'type',
  'title',
  'description',
  'severity',
  'content',
  'next',
  'conditions',
  'options',
]);

const allowedContentKeys = new Set([
  'checkMethod',
  'about',
  'whatToLookFor',
  'assessment',
  'explanation',
  'equipment',
  'questions',
  'vitals',
  'treatment',
  'actions',
  'sources',
]);

const cloneNode = (node: Node): Node => JSON.parse(JSON.stringify(node)) as Node;

const timestampToken = (date: Date): string =>
  date.toISOString()
    .replaceAll('-', '')
    .replaceAll(':', '')
    .replaceAll('.', '')
    .replaceAll('T', '')
    .replaceAll('Z', '');

const getActiveRevision = (workspace: ContentDraftWorkspace): ContentDraftRevision => {
  const revision = workspace.revisions.find(({ revisionId }) => revisionId === workspace.activeRevisionId);
  if (!revision) throw new Error('טיוטת התוכן פגומה: הגרסה הפעילה אינה קיימת.');
  return revision;
};

export function createContentDraft(
  protocol: Protocol,
  nodeId: string,
  now = new Date(),
): ContentDraftWorkspace {
  const node = protocol.nodes[nodeId];
  if (!node) throw new Error(`הצומת ${nodeId} אינו קיים בפרוטוקול.`);

  const draftId = `draft-${nodeId}-${timestampToken(now)}`;
  const revisionId = `${draftId}-v1`;
  const revision: ContentDraftRevision = {
    revisionId,
    version: 1,
    parentRevisionId: null,
    rollbackOfRevisionId: null,
    auditKind: 'created',
    status: 'draft',
    nodeId,
    baseProtocolVersion: protocol.version,
    baseNode: cloneNode(node),
    proposedNode: cloneNode(node),
    changeId: '',
    authorName: '',
    intendedUse: 'learning_only',
    riskTier: 'unknown',
    reason: '',
    semanticDiff: '',
    createdAt: now.toISOString(),
  };

  return {
    draftId,
    protocolId: protocol.id,
    nodeId,
    activeRevisionId: revisionId,
    revisions: [revision],
  };
}

export function saveContentDraftRevision(
  workspace: ContentDraftWorkspace,
  input: SaveDraftRevisionInput,
  protocol: Protocol,
  now = new Date(),
): ContentDraftWorkspace {
  const previous = getActiveRevision(workspace);
  if (!protocol.nodes[workspace.nodeId]) {
    throw new Error(`הצומת ${workspace.nodeId} אינו קיים עוד בפרוטוקול.`);
  }

  const version = Math.max(...workspace.revisions.map((revision) => revision.version)) + 1;
  const revisionId = `${workspace.draftId}-v${version}`;
  const revision: ContentDraftRevision = {
    ...input,
    proposedNode: cloneNode(input.proposedNode),
    revisionId,
    version,
    parentRevisionId: previous.revisionId,
    rollbackOfRevisionId: null,
    auditKind: 'revision',
    status: 'draft',
    nodeId: workspace.nodeId,
    baseProtocolVersion: previous.baseProtocolVersion,
    baseNode: cloneNode(previous.baseNode),
    createdAt: now.toISOString(),
  };

  return {
    ...workspace,
    activeRevisionId: revisionId,
    revisions: [...workspace.revisions, revision],
  };
}

const scalarToText = (value: unknown): string => {
  if (value === undefined) return 'לא קיים';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const flattenValue = (value: unknown, path: string, output: Map<string, string>): void => {
  if (Array.isArray(value)) {
    if (value.length === 0) output.set(path, '[]');
    value.forEach((entry, index) => flattenValue(entry, `${path}[${index}]`, output));
    return;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    if (entries.length === 0) output.set(path, '{}');
    entries.forEach(([key, entry]) => flattenValue(entry, path ? `${path}.${key}` : key, output));
    return;
  }

  output.set(path, scalarToText(value));
};

export function buildNodeDiff(before: Node, after: Node): NodeDiffEntry[] {
  const beforeValues = new Map<string, string>();
  const afterValues = new Map<string, string>();
  flattenValue(before, '', beforeValues);
  flattenValue(after, '', afterValues);

  return [...new Set([...beforeValues.keys(), ...afterValues.keys()])]
    .sort((left, right) => left.localeCompare(right))
    .flatMap((path): NodeDiffEntry[] => {
      const beforeValue = beforeValues.get(path);
      const afterValue = afterValues.get(path);
      if (beforeValue === afterValue) return [];

      return [{
        path,
        kind: beforeValue === undefined ? 'added' : afterValue === undefined ? 'removed' : 'changed',
        before: beforeValue ?? 'לא קיים',
        after: afterValue ?? 'לא קיים',
      }];
    });
}

const collectTargets = (node: Node): string[] => [
  ...(node.next ? (Array.isArray(node.next) ? node.next : [node.next]) : []),
  ...(node.conditions ?? []).map(({ target }) => target),
  ...(node.options ?? []).map(({ target }) => target),
  ...(node.content?.actions ?? []).map(({ target }) => target),
];

const validateSource = (source: ReferenceSource, index: number): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!source.label.trim()) {
    issues.push({ code: `source-${index}-label`, level: 'error', message: `למקור ${index + 1} חסרה תווית.` });
  }
  if (!source.url.trim()) {
    issues.push({ code: `source-${index}-url`, level: 'error', message: `למקור ${index + 1} חסרה כתובת.` });
  } else {
    try {
      const parsed = new URL(source.url);
      if (parsed.protocol !== 'https:') {
        issues.push({ code: `source-${index}-https`, level: 'error', message: `מקור ${index + 1} חייב להשתמש ב־HTTPS.` });
      }
    } catch {
      issues.push({ code: `source-${index}-url-invalid`, level: 'error', message: `כתובת מקור ${index + 1} אינה תקינה.` });
    }
  }
  return issues;
};

export function validateContentDraft(
  revision: ContentDraftRevision,
  protocol: Protocol,
): ValidationIssue[] {
  const node = revision.proposedNode;
  const issues: ValidationIssue[] = [];

  if (node.id !== revision.nodeId) {
    issues.push({ code: 'node-id-immutable', level: 'error', message: 'מזהה הצומת נעול ואינו ניתן לשינוי בטיוטה.' });
  }
  if (!nodeTypes.includes(node.type)) {
    issues.push({ code: 'node-type', level: 'error', message: 'סוג הצומת אינו ערך נתמך.' });
  }
  if (!node.title?.trim()) {
    issues.push({ code: 'title-required', level: 'error', message: 'כותרת הצומת היא שדה חובה.' });
  }

  Object.keys(node).filter((key) => !allowedNodeKeys.has(key)).forEach((key) => {
    issues.push({ code: `node-key-${key}`, level: 'error', message: `השדה הלא מוכר “${key}” אינו מותר בצומת.` });
  });
  Object.keys(node.content ?? {}).filter((key) => !allowedContentKeys.has(key)).forEach((key) => {
    issues.push({ code: `content-key-${key}`, level: 'error', message: `השדה הלא מוכר “content.${key}” אינו מותר.` });
  });

  const sources = node.content?.sources ?? [];
  if (sources.length === 0) {
    issues.push({ code: 'source-required', level: 'error', message: 'נדרש לפחות מקור גלוי אחד לפני סקירה.' });
  }
  sources.forEach((source, index) => issues.push(...validateSource(source, index)));

  collectTargets(node).forEach((target) => {
    if (!protocol.nodes[target]) {
      issues.push({ code: `target-${target}`, level: 'error', message: `יעד הניווט “${target}” אינו קיים בפרוטוקול.` });
    }
  });

  if (!/^CLIN-[0-9]{4}-[0-9]{3,}$/.test(revision.changeId)) {
    issues.push({ code: 'change-id', level: 'error', message: 'נדרש change ID מתועד בתבנית CLIN-YYYY-NNN.' });
  }
  if (!revision.authorName.trim()) {
    issues.push({ code: 'author', level: 'error', message: 'נדרש מחבר מזוהה לצורך עקיבות ומניעת אישור עצמי.' });
  }
  if (revision.riskTier === 'unknown') {
    issues.push({ code: 'risk-tier', level: 'error', message: 'יש לסווג את רמת הסיכון G0–G3 לפני סקירה.' });
  }
  if (!revision.reason.trim()) {
    issues.push({ code: 'reason', level: 'error', message: 'נדרש נימוק לשינוי.' });
  }
  if (!revision.semanticDiff.trim()) {
    issues.push({ code: 'semantic-diff', level: 'error', message: 'נדרש תיאור של השינוי במשמעות, גם אם אין שינוי משמעות.' });
  }
  if (buildNodeDiff(revision.baseNode, node).length === 0) {
    issues.push({ code: 'empty-diff', level: 'warning', message: 'הטיוטה זהה לגרסת הבסיס.' });
  }

  return issues;
}

export function getReviewGateSummary(
  revision: ContentDraftRevision,
  provenanceState: SourceProvenanceLoadState,
  today = new Date(),
): ReviewGateSummary {
  const sources = revision.proposedNode.content?.sources ?? [];
  const provenance = sources.map((source, sourceIndex) =>
    resolveSourceProvenance(provenanceState, 'unified_flow', revision.nodeId, source, sourceIndex),
  );
  const approvedSourceCount = provenance.filter(
    (entry) => entry && isApprovedForDisplay(entry, provenanceState.manifest?.review_records ?? [], today),
  ).length;
  const hasPendingSource = provenance.some((entry) => !entry || entry.source_status !== 'verified' || entry.review_status === 'pending');
  const hasUnknownAuthority = provenance.some((entry) => !entry || entry.authority_status !== 'confirmed');
  const normalizedAuthor = revision.authorName.trim().toLocaleLowerCase('he');
  const hasIndependentReviewer = provenance.length > 0 && provenance.every((entry) => {
    if (!entry?.review_record_id) return false;
    const record = provenanceState.manifest?.review_records.find(
      (candidate) => candidate.change_id === entry.review_record_id,
    );
    if (!record) return false;
    const approvals = record.review_decisions.filter((decision) =>
      decision.decision === 'approved' && Boolean(decision.reviewer_name),
    );
    const independentApprovals = approvals.filter((decision) =>
      decision.reviewer_name?.trim().toLocaleLowerCase('he') !== normalizedAuthor,
    );
    if (revision.riskTier === 'G2' || revision.riskTier === 'G3') {
      const namedReviewers = new Set(approvals.map((decision) => decision.reviewer_name));
      const independentlyAssigned = record.review_assignments.some((assignment) =>
        assignment.independent_of_author === true &&
        assignment.assignee_name?.trim().toLocaleLowerCase('he') !== normalizedAuthor,
      );
      return namedReviewers.size >= 2 && independentApprovals.length > 0 && independentlyAssigned;
    }
    return independentApprovals.length > 0;
  });
  const reasons: string[] = [];

  if (provenanceState.status !== 'ready') reasons.push(`נתוני העקיבות אינם במצב ready (${provenanceState.status}).`);
  if (sources.length === 0) reasons.push('אין מקור גלוי לצומת.');
  if (provenance.some((entry) => !entry)) reasons.push('השינוי אינו תואם manifest עקיבות קיים; שינוי מקור מאפס את הסקירה.');
  if (hasPendingSource) reasons.push('לפחות מקור אחד חסר אימות או ממתין לסקירה.');
  if (hasUnknownAuthority) reasons.push('לפחות מקור אחד נשען על סמכות unknown או לא מאומתת.');
  if (!hasIndependentReviewer) reasons.push('אין ראיית reviewer בלתי תלוי במחבר בהתאם לרמת הסיכון.');
  if (approvedSourceCount !== sources.length) reasons.push('אין אישור תחום תקף לכל המקורות ולכל תוקפם.');

  const canClaimApproval = sources.length > 0 && approvedSourceCount === sources.length && hasIndependentReviewer;
  return {
    sourceCount: sources.length,
    approvedSourceCount,
    hasPendingSource,
    hasUnknownAuthority,
    hasIndependentReviewer,
    canClaimApproval,
    canEnterReleaseReady: canClaimApproval && revision.status === 'approved_for_stated_use',
    reasons,
  };
}

const transitionMap: Record<ContentDraftStatus, readonly ContentDraftStatus[]> = {
  draft: ['evidence_ready', 'withdrawn'],
  evidence_ready: ['draft', 'in_review', 'withdrawn'],
  in_review: ['changes_requested', 'scope_blocked', 'approved_for_stated_use', 'withdrawn'],
  changes_requested: ['draft', 'withdrawn'],
  scope_blocked: ['draft', 'withdrawn'],
  approved_for_stated_use: ['draft', 'release_ready', 'withdrawn'],
  release_ready: ['draft', 'withdrawn'],
  withdrawn: ['draft'],
};

export function getAllowedTransitions(status: ContentDraftStatus): readonly ContentDraftStatus[] {
  return transitionMap[status];
}

export function transitionContentDraft(
  workspace: ContentDraftWorkspace,
  targetStatus: ContentDraftStatus,
  protocol: Protocol,
  provenanceState: SourceProvenanceLoadState,
  now = new Date(),
): ContentDraftWorkspace {
  const current = getActiveRevision(workspace);
  if (!transitionMap[current.status].includes(targetStatus)) {
    throw new Error(`המעבר ${current.status} → ${targetStatus} אינו מותר.`);
  }

  if (targetStatus === 'evidence_ready' || targetStatus === 'in_review') {
    const errors = validateContentDraft(current, protocol).filter(({ level }) => level === 'error');
    if (errors.length > 0) throw new Error(`לא ניתן להתקדם: ${errors[0].message}`);
  }

  if (targetStatus === 'approved_for_stated_use' || targetStatus === 'release_ready') {
    const gates = getReviewGateSummary(current, provenanceState, now);
    if (!gates.canClaimApproval) {
      throw new Error(`השער נכשל במצב fail-closed: ${gates.reasons[0] ?? 'חסרה ראיית אישור.'}`);
    }
    if (targetStatus === 'release_ready' && current.status !== 'approved_for_stated_use') {
      throw new Error('release-ready דורש גרסה שאושרה לשימוש המוצהר.');
    }
  }

  const version = Math.max(...workspace.revisions.map((revision) => revision.version)) + 1;
  const revisionId = `${workspace.draftId}-v${version}`;
  const revision: ContentDraftRevision = {
    ...current,
    proposedNode: cloneNode(current.proposedNode),
    revisionId,
    version,
    parentRevisionId: current.revisionId,
    rollbackOfRevisionId: null,
    auditKind: 'transition',
    status: targetStatus,
    createdAt: now.toISOString(),
  };

  return { ...workspace, activeRevisionId: revisionId, revisions: [...workspace.revisions, revision] };
}

export function rollbackContentDraft(
  workspace: ContentDraftWorkspace,
  targetRevisionId: string,
  now = new Date(),
): ContentDraftWorkspace {
  const current = getActiveRevision(workspace);
  const target = workspace.revisions.find(({ revisionId }) => revisionId === targetRevisionId);
  if (!target) throw new Error('גרסת ה־rollback המבוקשת אינה קיימת.');

  const version = Math.max(...workspace.revisions.map((revision) => revision.version)) + 1;
  const revisionId = `${workspace.draftId}-v${version}`;
  const revision: ContentDraftRevision = {
    ...target,
    proposedNode: cloneNode(target.proposedNode),
    revisionId,
    version,
    parentRevisionId: current.revisionId,
    rollbackOfRevisionId: target.revisionId,
    auditKind: 'rollback',
    status: 'draft',
    createdAt: now.toISOString(),
  };

  return { ...workspace, activeRevisionId: revisionId, revisions: [...workspace.revisions, revision] };
}

export function selectDraftRevision(
  workspace: ContentDraftWorkspace,
  revisionId: string,
): ContentDraftRevision {
  const revision = workspace.revisions.find((candidate) => candidate.revisionId === revisionId);
  if (!revision) throw new Error('גרסת הטיוטה המבוקשת אינה קיימת.');
  return revision;
}

export function parseProposedNode(json: string): Node {
  const parsed = JSON.parse(json) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('ה־JSON חייב לתאר אובייקט צומת יחיד.');
  }
  return parsed as Node;
}

export function serializeProposedNode(node: Node): string {
  return JSON.stringify(node, null, 2);
}
