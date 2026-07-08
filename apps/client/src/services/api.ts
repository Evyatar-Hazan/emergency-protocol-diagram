import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function unwrapApiData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }

  return payload as T;
}

interface ApiUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  isAdmin: boolean;
}

interface ApiComment {
  id: string;
  nodeId: string;
  content: string;
  author: ApiUser;
  authorId: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt?: string;
  replies?: ApiComment[];
}

// Add auth token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Service
export const authService = {
  loginWithGoogle: async (idToken: string) => {
    const response = await apiClient.post('/auth/google-login', { idToken });
    const { token, user } = unwrapApiData<{
      token: string;
      user: ApiUser;
    }>(response.data);

    // Store token and user in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return unwrapApiData<{ user: ApiUser }>(response.data);
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getToken: () => localStorage.getItem('authToken'),

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Comment Service
export const commentService = {
  getComments: async (nodeId: string) => {
    const response = await apiClient.get(`/comments/${nodeId}`);
    const data = unwrapApiData<{ comments?: ApiComment[] } | ApiComment[]>(response.data);
    return Array.isArray(data) ? data : (data.comments ?? []);
  },

  createComment: async (nodeId: string, content: string, parentCommentId?: string) => {
    const response = await apiClient.post('/comments', {
      nodeId,
      content,
      parentCommentId,
    });
    const data = unwrapApiData<{ comment: ApiComment } | ApiComment>(response.data);
    return typeof data === 'object' && data && 'comment' in data ? data.comment : data;
  },

  deleteComment: async (commentId: string) => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
