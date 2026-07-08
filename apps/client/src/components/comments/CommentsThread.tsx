import React, { useCallback, useEffect, useState } from 'react';
import { commentService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { getDiscussionSeeds } from './discussionSeeds';

interface Comment {
  id: string;
  nodeId: string;
  content: string;
  author: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
    isAdmin: boolean;
  };
  authorId: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt?: string;
  likesCount?: number;
  viewsCount?: number;
  viewerHasLiked?: boolean;
  replies?: Comment[];
}

interface CommentsThreadProps {
  nodeId: string;
  title?: string;
}

export const CommentsThread: React.FC<CommentsThreadProps> = ({
  nodeId,
  title = 'הערות והבהרות על הצומת',
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftSuggestion, setDraftSuggestion] = useState('');
  const [draftKind, setDraftKind] = useState<string | undefined>(undefined);
  const discussionSeeds = getDiscussionSeeds(nodeId);

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await commentService.getComments(nodeId);
      setComments(data || []);
    } catch (err) {
      setError('לא הצלחנו לטעון את הדיון כרגע. אפשר לנסות שוב בעוד רגע.');
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [nodeId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadComments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadComments]);

  const handleCommentAdded = () => {
    void loadComments();
  };

  const discussionCount = comments.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-bold tracking-[0.18em] text-clinical-muted">שכבת קהילה</div>
            <h3 className="mt-2 text-xl font-bold text-clinical-ink sm:text-2xl">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-clinical-muted">
              מקום לשאלות, חידודים מקצועיים והבהרות סביב הצומת הנוכחי. הדיון נשאר משני לפרוטוקול, ותפקידו לחדד את הביצוע בלי לשנות את הסדר.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">שאלה</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">הבהרה</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">טיפ ביצועי</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">תיקון קליני</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">מקור</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-center">
              <div className="text-xs font-bold tracking-[0.14em] text-slate-500">תגובות</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{discussionCount}</div>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-center">
              <div className="text-xs font-bold tracking-[0.14em] text-slate-500">סטטוס</div>
              <div className="mt-1 text-sm font-bold text-slate-900">
                {isAuthenticated && user ? 'מחובר לדיון' : 'קריאה פתוחה'}
              </div>
            </div>
          </div>
        </div>

        <CommentForm
          key={`${nodeId}:${draftKind ?? 'default'}:${draftSuggestion}`}
          nodeId={nodeId}
          onCommentAdded={() => {
            setDraftSuggestion('');
            setDraftKind(undefined);
            handleCommentAdded();
          }}
          initialContent={draftSuggestion}
          initialKind={draftKind}
        />

        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <p className="text-sm font-semibold text-slate-900">איך פותחים דיון טוב?</p>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            מומלץ להתמקד בשאלה אחת, ממצא אחד או טעות אחת שקל לפספס. כל כפתור כאן ממלא פתיח שאפשר לערוך.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {discussionSeeds.map((seed) => (
              <button
                key={`${seed.kind}:${seed.title}`}
                type="button"
                onClick={() => {
                  setDraftKind(seed.kind);
                  setDraftSuggestion(seed.prompt);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-clinical-blue hover:text-clinical-blue"
              >
                {seed.title}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              onClick={() => void loadComments()}
              className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              נסה שוב
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-10 text-center shadow-soft">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-[3px] border-clinical-blue/15 border-t-clinical-blue"></div>
          <p className="text-sm font-medium text-slate-700">טוען את שכבת ההבהרות...</p>
          <p className="mt-2 text-xs text-slate-500">אוסף תגובות, שאלות והערות סביב הצומת הזה.</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-soft">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
            💬
          </div>
          <h4 className="text-lg font-bold text-slate-900">עדיין אין הערות על הצומת הזה</h4>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            אפשר לפתוח כאן שאלה, הבהרה מקצועית או דגש ביצועי שיעזרו לחדד את ההחלטה בצומת הזה.
          </p>
          <div className="mx-auto mt-5 grid max-w-2xl gap-3 text-right sm:grid-cols-3">
            {discussionSeeds.slice(0, 3).map((seed) => (
              <button
                key={`empty-${seed.kind}-${seed.title}`}
                type="button"
                onClick={() => {
                  setDraftKind(seed.kind);
                  setDraftSuggestion(seed.prompt);
                }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-right transition hover:border-clinical-blue hover:bg-white"
              >
                <div className="text-sm font-bold text-slate-900">{seed.title}</div>
                <p className="mt-1 text-xs font-semibold text-clinical-blue">{seed.kind}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">{seed.prompt}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              {...comment}
              onCommentDeleted={handleCommentAdded}
              onCommentUpdated={handleCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};
