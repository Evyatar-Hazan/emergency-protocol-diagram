import { use, useMemo, useState } from 'react';
import type { Protocol } from '../../types/protocol';
import {
  loadScn01LearningRubric,
  type RuntimeLearningRubric,
} from '../../assessment/loadScn01Rubric';
import { loadAssessmentAttempts } from '../../assessment/localStorage';
import type { LearningAssessmentRubric } from '../../assessment/types';
import { eventFromStoredAttempt } from '../../reviewQueue/assessmentHistory';
import {
  completeReview,
  dueReviewCount,
  ingestAssessmentEvent,
  loadReviewQueue,
  removeReviewItem,
  resetReviewQueue,
  saveReviewQueue,
  setReviewQueueEnabled,
  snoozeReview,
  syncBookmarks,
  type ReviewQueueItem,
  type ReviewQueueState,
} from '../../reviewQueue/reviewQueue';

interface ReviewQueuePanelProps {
  protocols: Record<string, Protocol>;
  bookmarkedNodeIds: readonly string[];
  onOpenNode: (nodeId: string) => void;
  onRemoveBookmark: (nodeId: string) => void;
  storage?: Storage;
  nowProvider?: () => Date;
}

const defaultNowProvider = () => new Date();

function hydrateFromLocalSources(
  state: ReviewQueueState,
  bookmarkedNodeIds: readonly string[],
  storage: Storage,
  now: Date,
  rubric: LearningAssessmentRubric,
): ReviewQueueState {
  if (!state.enabled) return state;
  let hydrated = syncBookmarks(state, bookmarkedNodeIds, now);
  const attempts = loadAssessmentAttempts(storage);
  const latestAttempt = attempts.at(-1);
  if (!latestAttempt) return hydrated;
  const event = eventFromStoredAttempt(latestAttempt, rubric);
  if (!event) return hydrated;
  hydrated = ingestAssessmentEvent(
    hydrated,
    event,
    rubric,
    now,
    attempts.length,
  );
  return hydrated;
}

function formatDueDate(item: ReviewQueueItem, now: Date): string {
  const due = new Date(item.dueAt);
  if (due.getTime() <= now.getTime()) return 'מוכן לחזרה עכשיו';
  return `החזרה הבאה: ${new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'short',
    year: due.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(due)}`;
}

export function ReviewQueuePanel({
  ...props
}: ReviewQueuePanelProps) {
  const scn01LearningRubric = use(loadScn01LearningRubric());
  if (!scn01LearningRubric) {
    return (
      <section className="border-b border-rose-200 bg-rose-50 p-5" role="alert">
        <h3 className="font-bold text-rose-950">תור החזרות לא נטען</h3>
        <p className="mt-2 text-sm leading-6 text-rose-900">
          המחוון הזמני לא עבר אימות. הנתונים המקומיים נשמרו ללא שינוי ולא נוצרו המלצות חדשות.
        </p>
      </section>
    );
  }
  return <LoadedReviewQueuePanel {...props} rubric={scn01LearningRubric} />;
}

function LoadedReviewQueuePanel({
  protocols,
  bookmarkedNodeIds,
  onOpenNode,
  onRemoveBookmark,
  storage = window.localStorage,
  nowProvider = defaultNowProvider,
  rubric: scn01LearningRubric,
}: ReviewQueuePanelProps & { rubric: RuntimeLearningRubric }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [state, setState] = useState<ReviewQueueState>(() => {
    const hydrated = hydrateFromLocalSources(
      loadReviewQueue(storage),
      bookmarkedNodeIds,
      storage,
      nowProvider(),
      scn01LearningRubric,
    );
    saveReviewQueue(storage, hydrated);
    return hydrated;
  });

  const activeItems = useMemo(
    () => state.items.filter((item) => !item.dismissed),
    [state.items],
  );
  const dueCount = dueReviewCount(state, nowProvider());
  const persist = (next: ReviewQueueState, message: string) => {
    saveReviewQueue(storage, next);
    setState(next);
    setStatusMessage(message);
  };

  const resolveItem = (item: ReviewQueueItem) => {
    if (item.kind === 'bookmark') {
      const [protocolId, nodeId] = item.sourceId.split(':');
      const node = protocols[protocolId]?.nodes[nodeId];
      return {
        title: node?.title ?? 'צומת שאינו זמין בגרסה הנוכחית',
        detail: node ? item.sourceId : `מזהה חסר: ${item.sourceId}`,
        available: Boolean(node),
      };
    }
    const assessmentItem = scn01LearningRubric.items.find(
      (candidate) => candidate.item_id === item.sourceId,
    );
    return {
      title: assessmentItem?.prompt ?? 'פריט הערכה שאינו זמין בגרסה הנוכחית',
      detail: assessmentItem
        ? `${assessmentItem.competency_id} · ${assessmentItem.outcome_id}`
        : `מזהה חסר: ${item.sourceId}`,
      available: Boolean(assessmentItem),
    };
  };

  const toggleEnabled = () => {
    const enabled = !state.enabled;
    const toggled = setReviewQueueEnabled(state, enabled);
    const next = enabled
      ? hydrateFromLocalSources(toggled, bookmarkedNodeIds, storage, nowProvider(), scn01LearningRubric)
      : toggled;
    persist(next, enabled ? 'תור החזרות הופעל.' : 'תור החזרות כובה. הנתונים נשארו במכשיר.');
  };

  const handleComplete = (item: ReviewQueueItem) => {
    persist(
      completeReview(state, item.id, nowProvider()),
      'החזרה סומנה כהושלמה ונקבע מועד מקומי חדש.',
    );
  };

  const handleSnooze = (item: ReviewQueueItem) => {
    persist(snoozeReview(state, item.id, nowProvider(), 1), 'הפריט נדחה למחר.');
  };

  const handleRemove = (item: ReviewQueueItem) => {
    if (item.kind === 'bookmark') onRemoveBookmark(item.sourceId);
    persist(removeReviewItem(state, item.id), 'הפריט הוסר מהתור המקומי.');
  };

  const handleReset = () => {
    persist(resetReviewQueue(false), 'נתוני תור החזרות נמחקו והתור כובה.');
    setConfirmReset(false);
  };

  return (
    <section className="border-b border-slate-200 bg-[#fffaf3] p-4 sm:p-5" aria-labelledby="review-queue-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold tracking-[0.18em] text-clinical-muted">חזרה אישית מקומית</div>
          <h3 id="review-queue-title" className="mt-2 font-display text-xl font-extrabold text-slate-900">
            תור החזרות שלי
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            סימניות ומשוב תרגול נשמרים רק בדפדפן הזה. התור אינו מודד כשירות ואינו מספק הנחיה לאירוע חי.
          </p>
        </div>
        <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-slate-900 px-3 text-sm font-bold text-white" aria-label={`${dueCount} פריטים מוכנים לחזרה`}>
          {dueCount}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleEnabled}
          aria-pressed={state.enabled}
          className={`min-h-11 rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${
            state.enabled
              ? 'bg-clinical-teal text-white hover:bg-teal-700'
              : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
          }`}
        >
          {state.enabled ? 'התור פעיל' : 'הפעל את התור'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="min-h-11 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-800 transition-colors hover:bg-rose-50"
        >
          מחק נתוני תור
        </button>
      </div>

      {confirmReset && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3" role="alert">
          <p className="text-sm leading-6 text-rose-900">
            המחיקה תסיר את מועדי החזרה וההיסטוריה המקומית של התור ותכבה אותו. הסימניות ונתוני ההערכה נשמרים במאגרים המקומיים הנפרדים שלהם.
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={handleReset} className="min-h-11 rounded-xl bg-rose-700 px-3 py-2 text-sm font-bold text-white">
              מחק וכבה
            </button>
            <button type="button" onClick={() => setConfirmReset(false)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800">
              ביטול
            </button>
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite">{statusMessage}</p>

      {!state.enabled ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          התור כבוי. לא נוצרים מועדי חזרה חדשים עד שתפעיל אותו שוב.
        </div>
      ) : activeItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-center">
          <div className="text-3xl" aria-hidden="true">↻</div>
          <p className="mt-2 text-sm font-bold text-slate-900">התור עדיין ריק</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">הוסף סימניה, או השלם תרגול שמפיק משוב לימודי.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeItems.map((item) => {
            const presentation = scn01LearningRubric.review_reason_presentation[item.reason];
            const resolved = resolveItem(item);
            const isDue = Date.parse(item.dueAt) <= nowProvider().getTime();
            return (
              <article key={item.id} className={`rounded-3xl border bg-white p-4 shadow-sm ${isDue ? 'border-clinical-blue/40' : 'border-slate-200'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${presentation.tone}`}>
                    {presentation.label}
                  </span>
                  <span className={`text-xs font-bold ${isDue ? 'text-clinical-blue' : 'text-slate-600'}`}>
                    {formatDueDate(item, nowProvider())}
                  </span>
                </div>
                <h4 className="mt-3 text-sm font-bold leading-6 text-slate-900">{resolved.title}</h4>
                <p className="mt-1 font-mono text-[11px] text-slate-600">{resolved.detail}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{presentation.explanation}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.kind === 'bookmark' && resolved.available && (
                    <button type="button" onClick={() => onOpenNode(item.sourceId)} className="min-h-11 rounded-xl bg-clinical-blue px-3 py-2 text-xs font-bold text-white hover:bg-clinical-deep">
                      פתח צומת
                    </button>
                  )}
                  {item.reason !== 'instructor_required' && resolved.available && (
                    <button type="button" onClick={() => handleComplete(item)} className="min-h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100">
                      השלמתי חזרה
                    </button>
                  )}
                  <button type="button" onClick={() => handleSnooze(item)} className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100">
                    דחה למחר
                  </button>
                  <button type="button" onClick={() => handleRemove(item)} className="min-h-11 rounded-xl px-3 py-2 text-xs font-bold text-rose-800 hover:bg-rose-50">
                    הסר מהתור
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
