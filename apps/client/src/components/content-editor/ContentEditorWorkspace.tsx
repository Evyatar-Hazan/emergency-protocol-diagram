import { useEffect, useMemo, useState } from 'react';
import type { Protocol } from '../../types/protocol';
import { useSourceProvenanceRuntime } from '../../protocols/useSourceProvenanceRuntime';
import {
  buildNodeDiff,
  createContentDraft,
  getAllowedTransitions,
  getReviewGateSummary,
  parseProposedNode,
  rollbackContentDraft,
  saveContentDraftRevision,
  selectDraftRevision,
  serializeProposedNode,
  transitionContentDraft,
  validateContentDraft,
  type ContentDraftMetadata,
  type ContentDraftStatus,
  type ContentDraftWorkspace,
  type ContentRiskTier,
} from '../../content-editor/contentWorkflow';
import {
  loadContentDrafts,
  saveContentDrafts,
  upsertContentDraft,
} from '../../content-editor/contentDraftStorage';

interface ContentEditorWorkspaceProps {
  protocol: Protocol;
}

const statusLabels: Record<ContentDraftStatus, string> = {
  draft: 'טיוטה',
  evidence_ready: 'ראיות מוכנות',
  in_review: 'בסקירה',
  changes_requested: 'נדרשים שינויים',
  scope_blocked: 'חסום מחוץ להיקף',
  approved_for_stated_use: 'נבדק לשימוש המוצהר',
  release_ready: 'מוכן לשחרור',
  withdrawn: 'נמשך',
};

const transitionLabels: Partial<Record<ContentDraftStatus, string>> = {
  draft: 'החזרה לטיוטה',
  evidence_ready: 'סימון הראיות כמוכנות',
  in_review: 'העברה לסקירה',
  changes_requested: 'בקשת שינויים',
  scope_blocked: 'חסימה מחוץ להיקף',
  approved_for_stated_use: 'אישור לשימוש המוצהר',
  release_ready: 'סימון כמוכן לשחרור',
  withdrawn: 'משיכת הטיוטה',
};

const auditLabels = {
  created: 'נוצרה',
  revision: 'נשמרה',
  transition: 'סטטוס השתנה',
  rollback: 'שוחזרה',
} as const;

const initialMetadata: ContentDraftMetadata = {
  changeId: '',
  authorName: '',
  intendedUse: 'learning_only',
  riskTier: 'unknown',
  reason: '',
  semanticDiff: '',
};

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export function ContentEditorWorkspace({ protocol }: ContentEditorWorkspaceProps) {
  const sourceProvenanceState = useSourceProvenanceRuntime();
  const nodeIds = useMemo(() => Object.keys(protocol.nodes).sort((left, right) =>
    protocol.nodes[left].title.localeCompare(protocol.nodes[right].title, 'he'),
  ), [protocol]);
  const [drafts, setDrafts] = useState<ContentDraftWorkspace[]>(() => loadContentDrafts());
  const [selectedNodeId, setSelectedNodeId] = useState(protocol.startNode);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [editorText, setEditorText] = useState('');
  const [metadata, setMetadata] = useState<ContentDraftMetadata>(initialMetadata);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const activeWorkspace = drafts.find(({ draftId }) => draftId === activeDraftId) ?? null;
  const activeRevision = activeWorkspace
    ? selectDraftRevision(activeWorkspace, activeWorkspace.activeRevisionId)
    : null;

  useEffect(() => {
    saveContentDrafts(drafts);
  }, [drafts]);

  const parsedNode = (() => {
    try {
      return { node: parseProposedNode(editorText), error: null };
    } catch (error) {
      return { node: activeRevision?.proposedNode ?? null, error: error instanceof Error ? error.message : 'JSON לא תקין.' };
    }
  })();

  const workingRevision = activeRevision && parsedNode.node
    ? { ...activeRevision, ...metadata, proposedNode: parsedNode.node }
    : null;
  const validationIssues = workingRevision ? validateContentDraft(workingRevision, protocol) : [];
  const errors = validationIssues.filter(({ level }) => level === 'error');
  const warnings = validationIssues.filter(({ level }) => level === 'warning');
  const diff = workingRevision ? buildNodeDiff(workingRevision.baseNode, workingRevision.proposedNode) : [];
  const gates = workingRevision
    ? getReviewGateSummary(workingRevision, sourceProvenanceState)
    : null;
  const hasUnsavedChanges = Boolean(
    activeRevision && workingRevision && (
      serializeProposedNode(activeRevision.proposedNode) !== serializeProposedNode(workingRevision.proposedNode) ||
      activeRevision.changeId !== metadata.changeId ||
      activeRevision.authorName !== metadata.authorName ||
      activeRevision.intendedUse !== metadata.intendedUse ||
      activeRevision.riskTier !== metadata.riskTier ||
      activeRevision.reason !== metadata.reason ||
      activeRevision.semanticDiff !== metadata.semanticDiff
    ),
  );

  const loadWorkspaceIntoEditor = (workspace: ContentDraftWorkspace) => {
    const revision = selectDraftRevision(workspace, workspace.activeRevisionId);
    setSelectedNodeId(revision.nodeId);
    setEditorText(serializeProposedNode(revision.proposedNode));
    setMetadata({
      changeId: revision.changeId,
      authorName: revision.authorName,
      intendedUse: revision.intendedUse,
      riskTier: revision.riskTier,
      reason: revision.reason,
      semanticDiff: revision.semanticDiff,
    });
  };

  const applyWorkspace = (workspace: ContentDraftWorkspace, message: string) => {
    setDrafts((current) => upsertContentDraft(current, workspace));
    setActiveDraftId(workspace.draftId);
    loadWorkspaceIntoEditor(workspace);
    setNotice({ kind: 'success', text: message });
  };

  const openWorkspace = (workspace: ContentDraftWorkspace) => {
    setActiveDraftId(workspace.draftId);
    loadWorkspaceIntoEditor(workspace);
    setNotice(null);
  };

  const createOrOpenDraft = () => {
    const existing = [...drafts].reverse().find(({ nodeId, protocolId }) =>
      nodeId === selectedNodeId && protocolId === protocol.id,
    );
    if (existing) {
      openWorkspace(existing);
      return;
    }
    const workspace = createContentDraft(protocol, selectedNodeId);
    applyWorkspace(workspace, 'נוצרה טיוטה מקומית. תוכן ה־runtime לא השתנה.');
  };

  const saveRevision = () => {
    if (!activeWorkspace) return;
    try {
      const proposedNode = parseProposedNode(editorText);
      const workspace = saveContentDraftRevision(activeWorkspace, { ...metadata, proposedNode }, protocol);
      applyWorkspace(workspace, `גרסה ${workspace.revisions.length} נשמרה מקומית וחזרה לסטטוס טיוטה.`);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'שמירת הטיוטה נכשלה.' });
    }
  };

  const transition = (targetStatus: ContentDraftStatus) => {
    if (!activeWorkspace) return;
    if (hasUnsavedChanges) {
      setNotice({ kind: 'error', text: 'יש לשמור גרסה לפני שינוי סטטוס.' });
      return;
    }
    try {
      const workspace = transitionContentDraft(
        activeWorkspace,
        targetStatus,
        protocol,
        sourceProvenanceState,
      );
      applyWorkspace(workspace, `הטיוטה עברה לסטטוס “${statusLabels[targetStatus]}”.`);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'מעבר הסטטוס נחסם.' });
    }
  };

  const rollback = (revisionId: string) => {
    if (!activeWorkspace) return;
    try {
      const workspace = rollbackContentDraft(activeWorkspace, revisionId);
      applyWorkspace(workspace, 'נוצרה גרסת rollback חדשה. ההיסטוריה הקודמת נשמרה במלואה.');
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'השחזור נכשל.' });
    }
  };

  const allowedTransitions = activeRevision ? getAllowedTransitions(activeRevision.status) : [];

  return (
    <main className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-6 sm:py-6" aria-labelledby="content-editor-title">
      <section className="surface-card-strong clinical-panel rise-in mb-5 overflow-hidden rounded-[2rem] p-5 sm:p-7">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="clinical-kicker mb-3">סביבת עבודה מקומית • משימה 68</span>
            <h2 id="content-editor-title" className="font-display text-3xl font-extrabold text-clinical-ink sm:text-4xl">
              שולחן עריכת תוכן
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-clinical-muted sm:text-base">
              עריכת טיוטות, diff, validation ושערי סקירה — ללא כתיבה לקובץ הפרוטוקול, ללא פרסום וללא יצירת סמכות חדשה.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950">
            אין במסך פעולת Publish. כל הנתונים נשמרים רק ב־localStorage של הדפדפן הזה.
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft md:grid-cols-[1fr_auto] md:items-end">
        <label className="grid gap-2 text-sm font-bold text-clinical-ink">
          בחירת צומת לעריכה
          <select
            value={selectedNodeId}
            onChange={(event) => setSelectedNodeId(event.target.value)}
            className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-normal"
          >
            {nodeIds.map((nodeId) => (
              <option key={nodeId} value={nodeId}>
                {protocol.nodes[nodeId].title} · {nodeId}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={createOrOpenDraft}
          className="min-h-12 rounded-2xl bg-clinical-blue px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-clinical-deep"
        >
          פתיחת טיוטה מקומית
        </button>
      </section>

      {notice && (
        <div
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            notice.kind === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      {!activeRevision || !activeWorkspace ? (
        <section className="surface-card rounded-[2rem] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-clinical-blue/10 text-2xl text-clinical-blue">✎</div>
          <h3 className="font-display text-xl font-extrabold">בחרו צומת ופתחו טיוטה</h3>
          <p className="mt-2 text-sm leading-6 text-clinical-muted">הפעולה משכפלת את הצומת לזיכרון מקומי ואינה משנה את מקור האמת.</p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
          <div className="grid gap-5">
            <section className="surface-card rounded-[2rem] p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold tracking-[0.14em] text-clinical-muted">{activeRevision.nodeId}</div>
                  <h3 className="mt-1 font-display text-2xl font-extrabold">גרסה {activeRevision.version}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">{statusLabels[activeRevision.status]}</span>
                  {hasUnsavedChanges && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">שינויים לא שמורים</span>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  Change ID
                  <input
                    value={metadata.changeId}
                    onChange={(event) => setMetadata((current) => ({ ...current, changeId: event.target.value }))}
                    placeholder="CLIN-YYYY-NNN"
                    dir="ltr"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono font-normal"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  מחבר מזוהה
                  <input
                    value={metadata.authorName}
                    onChange={(event) => setMetadata((current) => ({ ...current, authorName: event.target.value }))}
                    placeholder="שם או מזהה צוותי"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-normal"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  רמת סיכון
                  <select
                    value={metadata.riskTier}
                    onChange={(event) => setMetadata((current) => ({ ...current, riskTier: event.target.value as ContentRiskTier }))}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-normal"
                  >
                    <option value="unknown">לא סווג</option>
                    <option value="G0">G0 — לא קליני</option>
                    <option value="G1">G1 — provenance / מסגור</option>
                    <option value="G2">G2 — תוכן BLS</option>
                    <option value="G3">G3 — ארגוני / מחוץ להיקף</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  שימוש מיועד
                  <select
                    value={metadata.intendedUse}
                    onChange={(event) => setMetadata((current) => ({
                      ...current,
                      intendedUse: event.target.value as ContentDraftMetadata['intendedUse'],
                    }))}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-normal"
                  >
                    <option value="learning_only">למידה בלבד</option>
                    <option value="training_facilitation">הנחיית הדרכה</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  נימוק לשינוי
                  <textarea
                    value={metadata.reason}
                    onChange={(event) => setMetadata((current) => ({ ...current, reason: event.target.value }))}
                    rows={3}
                    className="resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 font-normal leading-6"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  שינוי במשמעות
                  <textarea
                    value={metadata.semanticDiff}
                    onChange={(event) => setMetadata((current) => ({ ...current, semanticDiff: event.target.value }))}
                    rows={3}
                    className="resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 font-normal leading-6"
                  />
                </label>
              </div>

              <label className="mt-5 grid gap-2 text-sm font-bold">
                JSON של הצומת המוצע
                <textarea
                  value={editorText}
                  onChange={(event) => setEditorText(event.target.value)}
                  rows={22}
                  spellCheck={false}
                  dir="ltr"
                  aria-invalid={Boolean(parsedNode.error)}
                  className="w-full resize-y rounded-3xl border border-slate-300 bg-slate-950 px-4 py-4 font-mono text-[13px] font-normal leading-6 text-slate-100 shadow-inner"
                />
              </label>
              {parsedNode.error && <p className="mt-2 text-sm font-bold text-red-700">{parsedNode.error}</p>}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveRevision}
                  disabled={Boolean(parsedNode.error)}
                  className="rounded-2xl bg-clinical-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-clinical-deep disabled:cursor-not-allowed disabled:opacity-45"
                >
                  שמירת גרסה חדשה
                </button>
                {allowedTransitions.filter((status) => status !== 'approved_for_stated_use' && status !== 'release_ready').map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => transition(status)}
                    disabled={hasUnsavedChanges || (status === 'evidence_ready' && errors.length > 0)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-clinical-ink transition hover:border-clinical-blue disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {transitionLabels[status]}
                  </button>
                ))}
                {allowedTransitions.includes('approved_for_stated_use') && (
                  <button
                    type="button"
                    onClick={() => transition('approved_for_stated_use')}
                    disabled={!gates?.canClaimApproval || hasUnsavedChanges}
                    title={!gates?.canClaimApproval ? gates?.reasons.join(' ') : undefined}
                    className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {gates?.canClaimApproval ? 'אישור לשימוש המוצהר' : 'אישור חסום — חסרה ראיה'}
                  </button>
                )}
                {allowedTransitions.includes('release_ready') && (
                  <button
                    type="button"
                    onClick={() => transition('release_ready')}
                    disabled={!gates?.canEnterReleaseReady || hasUnsavedChanges}
                    className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    סימון כמוכן לשחרור
                  </button>
                )}
              </div>
            </section>

            <section className="surface-card rounded-[2rem] p-5 sm:p-6" aria-labelledby="diff-title">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <span className="clinical-kicker mb-2">Preview diff</span>
                  <h3 id="diff-title" className="font-display text-2xl font-extrabold">{diff.length} שדות השתנו</h3>
                </div>
              </div>
              {diff.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-clinical-muted">אין הבדל מול גרסת הבסיס.</p>
              ) : (
                <div className="grid gap-3">
                  {diff.map((entry) => (
                    <article key={entry.path} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
                        <code dir="ltr" className="text-xs font-bold text-clinical-blue">{entry.path}</code>
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">{entry.kind}</span>
                      </div>
                      <div className="grid md:grid-cols-2">
                        <div className="border-b border-red-100 bg-red-50/70 p-4 md:border-b-0 md:border-l">
                          <div className="mb-2 text-xs font-bold text-red-700">לפני</div>
                          <pre className="whitespace-pre-wrap break-words font-body text-sm leading-6 text-slate-800">{entry.before}</pre>
                        </div>
                        <div className="bg-emerald-50/70 p-4">
                          <div className="mb-2 text-xs font-bold text-emerald-700">אחרי</div>
                          <pre className="whitespace-pre-wrap break-words font-body text-sm leading-6 text-slate-800">{entry.after}</pre>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="grid content-start gap-5">
            <section className="surface-card rounded-[2rem] p-5">
              <span className="clinical-kicker mb-3">Validation</span>
              <h3 className="font-display text-xl font-extrabold">{errors.length} שגיאות · {warnings.length} אזהרות</h3>
              <div className="mt-4 grid gap-2">
                {validationIssues.length === 0 ? (
                  <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">הטיוטה תקינה מבנית.</p>
                ) : validationIssues.map((issue) => (
                  <div key={issue.code} className={`rounded-2xl border p-3 text-sm leading-6 ${
                    issue.level === 'error'
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}>
                    <strong>{issue.level === 'error' ? 'חסימה' : 'אזהרה'}:</strong> {issue.message}
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card rounded-[2rem] p-5">
              <span className="clinical-kicker mb-3">Review gates</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-2xl font-extrabold">{gates?.sourceCount ?? 0}</div>
                  <div className="text-xs font-bold text-clinical-muted">מקורות</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-2xl font-extrabold">{gates?.approvedSourceCount ?? 0}</div>
                  <div className="text-xs font-bold text-clinical-muted">עם אישור תקף</div>
                </div>
              </div>
              <div className={`mt-3 rounded-2xl border px-3 py-2 text-xs font-bold ${
                sourceProvenanceState.status === 'ready'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}>
                מצב טעינת עקיבות: {sourceProvenanceState.status}
              </div>
              <div className="mt-4 grid gap-2">
                {gates?.reasons.map((reason) => (
                  <div key={reason} className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">{reason}</div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-clinical-muted">
                `pending` ו־`unknown` הם מצבים חוסמים. בדיקות תוכנה, בעלות מוצר או תעודת BLS אינן משנות אותם אוטומטית.
              </p>
            </section>

            <section className="surface-card rounded-[2rem] p-5">
              <span className="clinical-kicker mb-3">גרסאות ועקיבות</span>
              <div className="grid gap-3">
                {[...activeWorkspace.revisions].reverse().map((revision) => (
                  <article key={revision.revisionId} className={`rounded-2xl border p-3 ${
                    revision.revisionId === activeWorkspace.activeRevisionId
                      ? 'border-clinical-blue bg-clinical-blue/5'
                      : 'border-slate-200 bg-white'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">גרסה {revision.version} · {statusLabels[revision.status]}</div>
                        <div className="mt-1 text-xs text-clinical-muted">{auditLabels[revision.auditKind]} · {formatDateTime(revision.createdAt)}</div>
                        {revision.rollbackOfRevisionId && <div className="mt-1 text-xs font-bold text-amber-800">Rollback של {revision.rollbackOfRevisionId.split('-').at(-1)}</div>}
                      </div>
                      {revision.revisionId !== activeWorkspace.activeRevisionId && (
                        <button
                          type="button"
                          onClick={() => rollback(revision.revisionId)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold hover:border-clinical-blue"
                        >
                          שחזור כגרסה חדשה
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {drafts.length > 1 && (
              <section className="surface-card rounded-[2rem] p-5">
                <h3 className="font-display text-lg font-extrabold">טיוטות מקומיות נוספות</h3>
                <div className="mt-3 grid gap-2">
                  {drafts.filter(({ draftId }) => draftId !== activeDraftId).map((draft) => (
                    <button
                      key={draft.draftId}
                      type="button"
                      onClick={() => openWorkspace(draft)}
                      className="rounded-2xl border border-slate-200 bg-white p-3 text-right text-sm font-bold hover:border-clinical-blue"
                    >
                      {protocol.nodes[draft.nodeId]?.title ?? draft.nodeId}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
