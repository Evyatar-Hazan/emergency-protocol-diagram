import React, { useState } from 'react';
import {
  commentService,
  type CommentModerationAction,
  type CommentModerationReason,
  type ModerationQueueItem,
} from '../../services/api';

const reasonLabels: Record<string, string> = {
  potentially_unsafe: 'עלול להיות לא בטוח',
  misleading: 'מטעה או לא מדויק',
  spam: 'ספאם',
  harassment: 'פוגעני',
  other_policy: 'הפרת מדיניות אחרת',
};

export const ModerationQueue: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setItems(await commentService.getModerationQueue());
    } catch (queueError) {
      setError('לא הצלחנו לטעון את תור הסקירה.');
      if (import.meta.env.DEV) console.error('Failed to load moderation queue:', queueError);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQueue = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      void loadQueue();
    }
  };

  const moderate = async (
    item: ModerationQueueItem,
    action: CommentModerationAction,
    reason: CommentModerationReason,
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      await commentService.moderateComment(item.commentId, action, reason);
      await loadQueue();
    } catch (moderationError) {
      setError('פעולת הסקירה נכשלה. לא בוצע שינוי בתגובה.');
      if (import.meta.env.DEV) console.error('Failed to moderate comment:', moderationError);
      setIsLoading(false);
    }
  };

  return (
    <div className="border-b border-amber-200 bg-amber-50/70 px-4 py-3 sm:px-6">
      <button
        type="button"
        onClick={toggleQueue}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 text-right"
      >
        <span>
          <span className="block text-sm font-bold text-amber-950">תור סקירת קהילה</span>
          <span className="mt-1 block text-xs text-amber-800">
            moderation בלבד — אינו אישור קליני או ארגוני
          </span>
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-900">
          {isOpen ? 'סגור' : 'פתח'}
        </span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {isLoading && items.length === 0 && <p className="text-sm text-amber-900">טוען תור...</p>}
          {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          {!isLoading && !error && items.length === 0 && (
            <p className="text-sm text-amber-900">אין דיווחים ממתינים.</p>
          )}
          {items.map((item) => (
            <article key={item.commentId} className="rounded-2xl border border-amber-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-500">צומת {item.nodeId}</p>
                <p className="text-xs text-amber-800">{item.reportCount} דיווחים</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-800">{item.content}</p>
              <p className="mt-2 text-xs text-slate-500">
                סיבות: {item.reportReasons.map((reason) => reasonLabels[reason] ?? reason).join(', ')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void moderate(item, 'mark_reviewed', 'community_guidelines')}
                  className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  סמן כנבדק למדיניות קהילה
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void moderate(item, 'hide', 'potentially_unsafe')}
                  className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  הסתר
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void moderate(item, 'dismiss_reports', 'report_unsubstantiated')}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50"
                >
                  דחה דיווח
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
