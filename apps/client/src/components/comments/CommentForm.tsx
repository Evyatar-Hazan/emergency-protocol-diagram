import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { commentService } from '../../services/api';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';

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
    return (
      <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900">התחבר כדי להשתתף בדיון</p>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              רק משתמש שמחובר עם Google יכול להגיב, להשיב או לעשות לייק.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <GoogleLoginButton variant="white" />
          </div>
        </div>
      </div>
    );
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
    <form onSubmit={handleSubmit} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {parentCommentId ? 'תגובה לשרשור' : 'הוספת תגובה'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            כתוב קצר, ברור ורלוונטי לצומת הנוכחי.
          </p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
          {user.name?.split(' ')[0] || user.email.split('@')[0]}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        rows={parentCommentId ? 3 : 4}
        maxLength={500}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 outline-none transition focus:border-clinical-blue focus:ring-2 focus:ring-clinical-blue/15 disabled:bg-slate-100"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {error ? (
            <p className="text-sm font-medium text-red-700">{error}</p>
          ) : (
            <p className="text-xs text-slate-500">
              שמור על ניסוח מקצועי, מכבד ורלוונטי. אין עריכה בגרסה הזו, אבל אפשר למחוק ולפרסם מחדש.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs font-medium text-slate-500">{content.length}/500</span>
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="rounded-2xl bg-clinical-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-clinical-deep disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? 'מפרסם...' : parentCommentId ? 'פרסם תגובה' : 'פרסם'}
          </button>
        </div>
      </div>
    </form>
  );
};
