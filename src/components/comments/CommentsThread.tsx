import React, { useEffect, useState } from 'react';
import { commentService } from '../../services/api';
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
  title = 'Comments',
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await commentService.getComments(nodeId);
      setComments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [nodeId]);

  const handleCommentAdded = () => {
    loadComments();
  };

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {title}
          {comments.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({comments.length})
            </span>
          )}
        </h3>
      </div>

      <div className="space-y-4">
        <CommentForm nodeId={nodeId} onCommentAdded={handleCommentAdded} />

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 text-sm mt-2">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                {...comment}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentAdded}
                onCommentUpdated={handleCommentAdded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
