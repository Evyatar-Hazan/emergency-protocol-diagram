import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { commentService } from '../../services/api';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';

interface CommentFormProps {
  nodeId: string;
  parentCommentId?: string;
  onCommentAdded?: () => void;
  placeholder?: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  nodeId,
  parentCommentId,
  onCommentAdded,
  placeholder = 'Add a comment...',
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated || !user) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700 mb-3">
          👤 Sign in to add comments and participate in discussions
        </p>
        <GoogleLoginButton />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await commentService.createComment(nodeId, content, parentCommentId);
      setContent('');
      onCommentAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      console.error('Failed to add comment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        rows={parentCommentId ? 2 : 3}
        maxLength={500}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 resize-none"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition text-sm font-medium"
        >
          {isLoading ? 'Adding...' : parentCommentId ? 'Reply' : 'Comment'}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {content.length}/500
      </p>
    </form>
  );
};
