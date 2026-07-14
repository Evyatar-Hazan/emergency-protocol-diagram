import React, { useCallback, useEffect, useState } from 'react';
import { commentService } from '../../services/api';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';

const ReplyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path d="M9 7 4 12l5 5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 18v-1a5 5 0 0 0-5-5H4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path d="M7 7.5h7a4.5 4.5 0 1 1 0 9H9" strokeLinecap="round" />
    <path d="M10 4.5h2.5a7 7 0 1 1 0 14H9" strokeLinecap="round" />
  </svg>
);

const LikeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path
      d="M12 20.5s-7-4.4-7-10.1A4.4 4.4 0 0 1 9.4 6c1.3 0 2.6.6 3.4 1.7A4.3 4.3 0 0 1 16.2 6 4.4 4.4 0 0 1 20.6 10.4C20.6 16.1 12 20.5 12 20.5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <circle cx="6" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="18" cy="12" r="1.7" />
  </svg>
);

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
  title = 'תגובות על הצומת',
}) => {
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
      setError('לא הצלחנו לטעון את התגובות כרגע. אפשר לנסות שוב בעוד רגע.');
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

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white">
      <section className="border-b border-slate-200/80 px-4 py-4 sm:px-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-lg font-bold text-slate-900">{title}</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
              {comments.length}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-400">
            <button type="button" className="rounded-full p-2 transition hover:bg-sky-50 hover:text-sky-700" aria-label="תגובות">
              <ReplyIcon />
            </button>
            <button type="button" className="rounded-full p-2 transition hover:bg-emerald-50 hover:text-emerald-700" aria-label="שרשורים">
              <ThreadsIcon />
            </button>
            <button type="button" className="rounded-full p-2 transition hover:bg-rose-50 hover:text-rose-600" aria-label="לייקים">
              <LikeIcon />
            </button>
            <button type="button" className="rounded-full p-2 transition hover:bg-slate-100 hover:text-slate-700" aria-label="עוד">
              <MoreIcon />
            </button>
          </div>
        </div>

        <div>
          <CommentForm nodeId={nodeId} onCommentAdded={handleCommentAdded} />
        </div>

        {error && (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              onClick={() => void loadComments()}
              className="mt-3 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              נסה שוב
            </button>
          </div>
        )}
      </section>

      {isLoading ? (
        <div className="px-5 py-10 text-center sm:px-6">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-[3px] border-clinical-blue/15 border-t-clinical-blue"></div>
          <p className="text-sm font-medium text-slate-700">טוען תגובות...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="px-5 py-12 text-center sm:px-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
            💬
          </div>
          <h4 className="text-base font-bold text-slate-900">עדיין אין תגובות</h4>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            התגובה הראשונה תופיע כאן כתחילת השרשור.
          </p>
        </div>
      ) : (
        <div>
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
