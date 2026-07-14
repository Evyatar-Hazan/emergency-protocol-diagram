import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { commentService } from '../../services/api';
import { CommentForm } from './CommentForm';
import { parseCommentContent } from './commentTaxonomy';

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path
      d="M6.8 18.2c-2.1-1.3-3.3-3.3-3.3-5.6 0-4.1 3.8-7.4 8.5-7.4s8.5 3.3 8.5 7.4-3.8 7.4-8.5 7.4c-1 0-2-.2-2.9-.5l-4.1 1.2 1.8-2.5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LikeIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={`h-4 w-4 ${filled ? 'fill-current stroke-current' : 'fill-none stroke-current'} stroke-[1.8]`}
  >
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

const ReplyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path d="M9 7 4 12l5 5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 18v-1a5 5 0 0 0-5-5H4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
    <path d="M4 7h16" strokeLinecap="round" />
    <path d="M9.5 4h5l1 2h-7l1-2Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 7v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 10.5v5M14 10.5v5" strokeLinecap="round" />
  </svg>
);

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <circle cx="6" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="18" cy="12" r="1.7" />
  </svg>
);

interface CommentItemProps {
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
  createdAt: string;
  updatedAt?: string;
  likesCount?: number;
  viewsCount?: number;
  viewerHasLiked?: boolean;
  replies?: CommentItemProps[];
  onCommentDeleted?: () => void;
  onCommentUpdated?: () => void;
  level?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  id,
  nodeId,
  content,
  author,
  createdAt,
  likesCount = 0,
  viewsCount = 0,
  viewerHasLiked = false,
  replies = [],
  onCommentDeleted,
  onCommentUpdated,
  level = 0,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [likeOverride, setLikeOverride] = useState<number | null>(null);
  const [viewOverride, setViewOverride] = useState<number | null>(null);
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);

  const canDelete = Boolean(user && (user.id === author.id || user.isAdmin));
  const depthClass = level === 0 ? '' : level === 1 ? 'mr-3 sm:mr-7' : 'mr-6 sm:mr-12';
  const parsedContent = parseCommentContent(content);
  const displayLikesCount = likeOverride ?? likesCount;
  const displayViewsCount = viewOverride ?? viewsCount;
  const displayViewerHasLiked = likedOverride ?? viewerHasLiked;
  const authorHandle = `@${(author.email.split('@')[0] || 'user').replace(/\s+/g, '').toLowerCase()}`;

  const handleDelete = async () => {
    if (!window.confirm('למחוק את התגובה הזו?')) return;

    try {
      setIsLoading(true);
      setError(null);
      await commentService.deleteComment(id);
      onCommentDeleted?.();
    } catch (err) {
      setError('לא הצלחנו למחוק את התגובה. אפשר לנסות שוב.');
      console.error('Failed to delete comment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !user) {
      setError('צריך להתחבר עם Google כדי לעשות לייק.');
      return;
    }

    try {
      setIsLikeLoading(true);
      setError(null);
      const result = await commentService.toggleLike(id);
      setLikeOverride(result.likesCount);
      setLikedOverride(result.liked);
    } catch (err) {
      setError('לא הצלחנו לעדכן את הלייק. אפשר לנסות שוב.');
      console.error('Failed to toggle like:', err);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return 'הרגע';
    if (seconds < 3600) return `לפני ${Math.floor(seconds / 60)} דק׳`;
    if (seconds < 86400) return `לפני ${Math.floor(seconds / 3600)} שעות`;
    if (seconds < 172800) return 'אתמול';
    return `לפני ${Math.floor(seconds / 86400)} ימים`;
  };

  useEffect(() => {
    const element = articleRef.current;

    if (!element || hasTrackedView) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry?.isIntersecting) {
          return;
        }

        setHasTrackedView(true);
        observer.disconnect();
        void commentService
          .trackView(id)
          .then((result) => {
            setViewOverride(result.viewsCount);
          })
          .catch((err) => {
            console.error('Failed to track comment view:', err);
          });
      },
      { threshold: 0.6 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasTrackedView, id, onCommentUpdated]);

  return (
    <div className={depthClass}>
      <article
        ref={articleRef}
        className="border-b border-slate-200/80 bg-white px-4 py-4 transition hover:bg-slate-50/50 sm:px-5"
      >
        <div className="flex items-start gap-3">
          {author.picture ? (
            <img
              src={author.picture}
              alt={author.name || author.email}
              className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
              {(author.name || author.email).charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-bold text-slate-900">
                    {author.name || author.email.split('@')[0]}
                  </span>
                  <span className="text-xs text-slate-400">{authorHandle}</span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{formatRelativeTime(createdAt)}</span>
                  {author.isAdmin && (
                    <span className="rounded-full bg-clinical-blue/10 px-2.5 py-1 text-[11px] font-bold text-clinical-blue">
                      מנהל
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="פעולות נוספות"
              >
                <MoreIcon />
              </button>
            </div>

            <p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-slate-800">{parsedContent.body}</p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="inline-flex min-w-[72px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 transition hover:bg-sky-50 hover:text-sky-700"
              >
                <CommentIcon />
                <span>{replies.length}</span>
              </button>
              <button
                type="button"
                onClick={handleLike}
                disabled={isLikeLoading}
                className={`inline-flex min-w-[72px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 transition disabled:text-slate-300 ${
                  displayViewerHasLiked
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'hover:bg-rose-50 hover:text-rose-600'
                }`}
              >
                <LikeIcon filled={displayViewerHasLiked} />
                <span>{isLikeLoading ? '...' : displayLikesCount}</span>
              </button>
              <span className="inline-flex min-w-[72px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5">
                <ViewIcon />
                <span>{displayViewsCount}</span>
              </span>
              {level < 2 && (
                <button
                  type="button"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="inline-flex min-w-[86px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 transition hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <ReplyIcon />
                  <span>{showReplyForm ? 'סגור' : 'השב'}</span>
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="inline-flex min-w-[86px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 disabled:text-slate-300"
                >
                  <DeleteIcon />
                  <span>מחק</span>
                </button>
              )}
              </div>
              {displayViewerHasLiked && <span className="text-[11px] text-rose-500">אהבת</span>}
            </div>

            {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}

            {showReplyForm && (
              <div className="mt-4 rounded-2xl bg-slate-50/70 p-3">
                <CommentForm
                  nodeId={nodeId}
                  parentCommentId={id}
                  onCommentAdded={() => {
                    setShowReplyForm(false);
                    onCommentUpdated?.();
                  }}
                  placeholder="כתוב תגובה קצרה שמחדדת ביצוע, החלטה או דגש מקצועי..."
                />
              </div>
            )}
          </div>
        </div>
      </article>

      {replies.length > 0 && (
        <div className="mr-4 border-r border-slate-200/70 pr-2 sm:mr-5 sm:pr-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              {...reply}
              level={level + 1}
              onCommentDeleted={onCommentDeleted}
              onCommentUpdated={onCommentUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
};
