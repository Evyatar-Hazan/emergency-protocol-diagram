import React, { useCallback, useEffect, useState } from 'react';
import { commentService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';

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
  replies?: Comment[];
}

interface CommentsThreadProps {
  nodeId: string;
  title?: string;
}

export const CommentsThread: React.FC<CommentsThreadProps> = ({
  nodeId,
  title = 'דיון והערות על הצומת',
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              מקום לשאלות, חידודים מקצועיים ותובנות לימודיות סביב הצומת הנוכחי. הדיון נשאר משני למסלול, אבל תומך בלמידה עמוקה יותר.
            </p>
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

        <CommentForm nodeId={nodeId} onCommentAdded={handleCommentAdded} />

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
          <p className="text-sm font-medium text-slate-700">טוען את הדיון המקצועי...</p>
          <p className="mt-2 text-xs text-slate-500">אוסף תגובות, שאלות והערות סביב הצומת הזה.</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-soft">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
            💬
          </div>
          <h4 className="text-lg font-bold text-slate-900">עדיין אין דיון על הצומת הזה</h4>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            אפשר לפתוח את הדיון עם שאלה, הבהרה לימודית או טיפ מקצועי שיעזור למתלמדים הבאים להבין את ההיגיון הקליני.
          </p>
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
