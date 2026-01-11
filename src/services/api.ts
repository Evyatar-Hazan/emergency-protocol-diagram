import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const { token, user } = response.data.data;

    // Store token and user in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
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
    return response.data.data;
  },

  createComment: async (nodeId: string, content: string, parentCommentId?: string) => {
    const response = await apiClient.post('/comments', {
      nodeId,
      content,
      parentCommentId,
    });
    return response.data.data;
  },

  updateComment: async (commentId: string, content: string) => {
    const response = await apiClient.put(`/comments/${commentId}`, { content });
    return response.data.data;
  },

  deleteComment: async (commentId: string) => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
