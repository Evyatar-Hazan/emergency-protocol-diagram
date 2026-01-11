import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { commentService } from '../../services/api';
import { CommentForm } from './CommentForm';

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

  const canEdit = user && (user.id === author.id || user.isAdmin);

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
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      setIsLoading(true);
      setError(null);
      await commentService.deleteComment(id);
      onCommentDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    } finally {
      setIsLoading(false);
    }
  };

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const marginClass = level > 0 ? `ml-${Math.min(level * 4, 12)}` : '';

  return (
    <div className={`${marginClass} border-l-2 border-gray-200 pl-4 py-3`}>
      <div className="flex items-start gap-3">
        {author.picture && (
          <img
            src={author.picture}
            alt={author.name || author.email}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-800">
              {author.name || author.email.split('@')[0]}
            </span>
            {author.isAdmin && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                Admin
              </span>
            )}
            <span className="text-xs text-gray-500">
              {timeAgo(createdAt)}
              {updatedAt && updatedAt !== createdAt && ' (edited)'}
            </span>
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded transition"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-700 text-sm mt-2 break-words">{content}</p>

              {error && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
              )}

              <div className="flex gap-3 mt-2">
                {level < 2 && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showReplyForm ? 'Cancel' : 'Reply'}
                  </button>
                )}
                {canEdit && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="text-xs text-red-600 hover:text-red-800 font-medium disabled:text-gray-400"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {showReplyForm && (
            <div className="mt-4">
              <CommentForm
                nodeId={nodeId}
                parentCommentId={id}
                onCommentAdded={() => {
                  setShowReplyForm(false);
                  onCommentUpdated?.();
                }}
                placeholder="Write a reply..."
              />
            </div>
          )}
        </div>
      </div>

      {replies && replies.length > 0 && (
        <div className="mt-4 space-y-3">
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
