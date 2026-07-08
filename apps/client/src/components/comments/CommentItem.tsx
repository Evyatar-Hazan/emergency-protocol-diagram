import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { commentService } from '../../services/api';
import { CommentForm } from './CommentForm';
import { parseCommentContent } from './commentTaxonomy';

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
  updatedAt,
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
  const articleRef = useRef<HTMLElement | null>(null);

  const canDelete = Boolean(user && (user.id === author.id || user.isAdmin));
  const depthClass = level === 0 ? '' : level === 1 ? 'sm:mr-6' : 'sm:mr-12';
  const parsedContent = parseCommentContent(content);

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
      await commentService.toggleLike(id);
      onCommentUpdated?.();
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
        void commentService.trackView(id).then(() => {
          onCommentUpdated?.();
        }).catch((err) => {
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
      <article ref={articleRef} className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {author.name || author.email.split('@')[0]}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    author.isAdmin
                      ? 'bg-clinical-blue/10 text-clinical-blue'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {author.isAdmin ? 'מנהל/ת מערכת' : 'לומד/ת'}
                  </span>
                  {updatedAt && updatedAt !== createdAt && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                      נערך
                    </span>
                  )}
                  {parsedContent.kindLabel && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      {parsedContent.kindLabel}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">{formatRelativeTime(createdAt)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <button
                  onClick={handleLike}
                  disabled={isLikeLoading}
                  className={`transition disabled:text-slate-300 ${
                    viewerHasLiked ? 'text-amber-700 hover:text-amber-800' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isLikeLoading ? 'מעדכן...' : `לייק${likesCount > 0 ? ` (${likesCount})` : ''}`}
                </button>
                {level < 2 && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="text-clinical-blue transition hover:text-clinical-deep"
                  >
                    {showReplyForm ? 'סגור תגובה' : 'השב'}
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="text-red-600 transition hover:text-red-800 disabled:text-slate-300"
                  >
                    מחק
                  </button>
                )}
              </div>
            </div>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{parsedContent.body}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400">
              <span>{formatRelativeTime(createdAt)}</span>
              <span>לייקים {likesCount}</span>
              <span>צפיות {viewsCount}</span>
            </div>

            {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}

            {showReplyForm && (
              <div className="mt-4 border-t border-slate-200 pt-4">
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
        <div className="mt-3 space-y-3 border-r border-slate-200 pr-3 sm:pr-5">
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
