import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { commentService } from '../../services/api';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';
import { useAuthStore } from '../../store/authStore';

const ReplyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path
      d="M6.8 18.2c-2.1-1.3-3.3-3.3-3.3-5.6 0-4.1 3.8-7.4 8.5-7.4s8.5 3.3 8.5 7.4-3.8 7.4-8.5 7.4c-1 0-2-.2-2.9-.5l-4.1 1.2 1.8-2.5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

const ViewIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path
      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" />
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
}

const aggregateStats = (items: Comment[]) =>
  items.reduce(
    (acc, comment) => {
      acc.comments += 1;
      acc.likes += comment.likesCount ?? 0;
      acc.views += comment.viewsCount ?? 0;

      if (comment.replies?.length) {
        const replyStats = aggregateStats(comment.replies);
        acc.comments += replyStats.comments;
        acc.likes += replyStats.likes;
        acc.views += replyStats.views;
      }

      return acc;
    },
    { comments: 0, likes: 0, views: 0 }
  );

export const CommentsThread: React.FC<CommentsThreadProps> = ({ nodeId }) => {
  const { isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);

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

  const hasVisibleThread = comments.length > 0 || showComposer;

  const stats = useMemo(() => aggregateStats(comments), [comments]);

  return (
    <section className="overflow-hidden rounded-b-[22px] border border-t-0 border-slate-200/80 bg-white">
      <div className={`${hasVisibleThread ? 'border-b border-slate-200/80' : ''} px-4 py-2 sm:px-6`}>
        <div className={`grid items-center gap-1 text-slate-500 ${isAuthenticated ? 'grid-cols-4' : 'grid-cols-5'}`}>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                return;
              }
              setShowComposer((current) => !current);
            }}
            className="flex items-center justify-center gap-2 rounded-full py-2 text-sm transition hover:bg-sky-50 hover:text-sky-700"
            aria-label="תגובות"
          >
            <ReplyIcon />
            <span className="text-xs font-medium tabular-nums">{stats.comments}</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-full py-2 text-sm transition hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="שרשורים"
          >
            <ThreadsIcon />
            <span className="text-xs font-medium tabular-nums">{comments.length}</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-full py-2 text-sm transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="לייקים"
          >
            <LikeIcon />
            <span className="text-xs font-medium tabular-nums">{stats.likes}</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-full py-2 text-sm transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="צפיות"
          >
            <ViewIcon />
            <span className="text-xs font-medium tabular-nums">{stats.views}</span>
          </button>
          {!isAuthenticated && (
            <div className="flex items-center justify-center py-1">
              <GoogleLoginButton variant="icon" className="w-auto" />
            </div>
          )}
        </div>
      </div>

      {showComposer && (
        <div className="border-b border-slate-200/80 px-4 py-4 sm:px-6">
          <CommentForm nodeId={nodeId} onCommentAdded={handleCommentAdded} />

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
        </div>
      )}

      {isLoading && hasVisibleThread ? (
        <div className="px-5 py-10 text-center sm:px-6">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-[3px] border-clinical-blue/15 border-t-clinical-blue"></div>
          <p className="text-sm font-medium text-slate-700">טוען תגובות...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="bg-white">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              {...comment}
              onCommentDeleted={handleCommentAdded}
              onCommentUpdated={handleCommentAdded}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};
