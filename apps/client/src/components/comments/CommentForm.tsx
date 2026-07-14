import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { commentService } from '../../services/api';

interface CommentFormProps {
  nodeId: string;
  parentCommentId?: string;
  onCommentAdded?: () => void;
  placeholder?: string;
  initialContent?: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  nodeId,
  parentCommentId,
  onCommentAdded,
  placeholder = 'כתוב תגובה קצרה, ברורה ורלוונטית לצומת הזה...',
  initialContent = '',
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await commentService.createComment(nodeId, content.trim(), parentCommentId);
      setContent('');
      onCommentAdded?.();
    } catch (err) {
      setError('לא הצלחנו לפרסם את ההודעה. אפשר לנסות שוב בעוד רגע.');
      console.error('Failed to add comment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
      <div className="flex items-start gap-3">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name || user.email}
            className="mt-1 h-10 w-10 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{user.name || user.email.split('@')[0]}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {parentCommentId ? 'תגובה לשרשור' : 'תגובה לצומת הנוכחי'}
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              {content.length}/500
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            rows={parentCommentId ? 2 : 3}
            maxLength={500}
            className="mt-2 w-full resize-none border-0 bg-transparent px-0 py-0 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-100"
          />

          <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {error ? (
                <p className="text-sm font-medium text-red-700">{error}</p>
              ) : (
                <p className="text-xs text-slate-500">ניסוח קצר, חד ומקצועי.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="rounded-full bg-clinical-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-clinical-deep disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? 'מפרסם...' : parentCommentId ? 'פרסם תגובה' : 'פרסם'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
