import React, { useState } from 'react';
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
  replies = [],
  onCommentDeleted,
  onCommentUpdated,
  level = 0,
}) => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = Boolean(user && (user.id === author.id || user.isAdmin));
  const depthClass = level === 0 ? '' : level === 1 ? 'sm:mr-6' : 'sm:mr-12';
  const parsedContent = parseCommentContent(content);

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === content) {
      setIsEditing(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await commentService.updateComment(id, editContent);
      setIsEditing(false);
      onCommentUpdated?.();
    } catch (err) {
      setError('לא הצלחנו לעדכן את התגובה. אפשר לנסות שוב.');
      console.error('Failed to update comment:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className={depthClass}>
      <article className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
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
                {level < 2 && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="text-clinical-blue transition hover:text-clinical-deep"
                  >
                    {showReplyForm ? 'סגור תגובה' : 'השב'}
                  </button>
                )}
                {canEdit && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-slate-600 transition hover:text-slate-900"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="text-red-600 transition hover:text-red-800 disabled:text-slate-300"
                    >
                      מחק
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-3 space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-clinical-blue focus:ring-2 focus:ring-clinical-blue/15"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleEdit}
                    disabled={isLoading}
                    className="rounded-2xl bg-clinical-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-clinical-deep disabled:bg-slate-300"
                  >
                    {isLoading ? 'שומר...' : 'שמור שינוי'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(content);
                    }}
                    className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{parsedContent.body}</p>
            )}

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
