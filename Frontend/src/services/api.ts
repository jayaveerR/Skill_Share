import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface ExploreUser {
  _id: string;
  name: string;
  email: string;
  averageRating?: number;
  totalRatings?: number;
  completedCollaborations?: number;
  trustScore?: number;
  isOnline?: boolean;
  avatar?: string;
}

export interface CommunityMember {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
  email: string;
  skills: Array<{ _id: string; name: string; category: string }>;
  rating: number;
  ratingCount: number;
  isOnline: boolean;
  lastSeen?: string;
  isRecentlyActive: boolean;
}

export interface ExploreSkill {
  _id: string;
  name: string;
  category: string;
  level: string;
  description: string;
  createdAt?: string;
  createdBy: ExploreUser;
  relevanceScore?: number;
  insights?: string[];
  isTrending?: boolean;
}

export interface SkillRequest {
  _id: string;
  skillId: string | { _id: string; name: string };
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed';
  requestedBy: string | ExploreUser;
  requestedTo: string | ExploreUser;
  message?: string;
  createdAt: string;
  updatedAt: string;
  rejectedAt?: string; // Keeping this from original, as it wasn't explicitly removed in the new SkillRequest definition
}

export interface PopulatedSkillRequest extends Omit<SkillRequest, 'skillId' | 'requestedBy' | 'requestedTo'> {
  skillId: { _id: string; name: string };
  requestedBy: ExploreUser;
  requestedTo: ExploreUser;
}

// Add token to requests
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token');
    if (token) {
      try {
        // Handle cases where token might be JSON stringified (double quoted)
        const parsed = JSON.parse(token);
        if (typeof parsed === 'string') {
          token = parsed;
        }
      } catch (e) {
        // Token is likely a raw string, use as is
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');

      // Only redirect if not already on public pages
      const publicPaths = ['/login', '/signup', '/'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: async (name: string, email: string, password: string, avatar?: string) => {
    const response = await api.post('/auth/signup', { name, email, password, avatar });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData: Record<string, unknown>) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  getUserProfile: async (id: string) => {
    const response = await api.get(`/auth/profile/${id}`);
    return response.data;
  },
};

// Skills API
export const skillsAPI = {
  getAll: async (category?: string, search?: string, userId?: string): Promise<{ success: boolean, data: ExploreSkill[] }> => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    if (userId) params.append('user', userId);

    const response = await api.get(`/skills?${params.toString()}`);
    return response.data;
  },

  create: async (skillData: Record<string, unknown>) => {
    const response = await api.post('/skills', skillData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/skills/${id}`);
    return response.data;
  },

  trackView: async (id: string) => {
    const response = await api.post(`/skills/${id}/view`);
    return response.data;
  },
};

// Community API
export const communityAPI = {
  getMembers: async (role?: string, skillCategory?: string): Promise<{ success: boolean, data: CommunityMember[] }> => {
    const params = new URLSearchParams();
    if (role && role !== 'All') params.append('role', role);
    if (skillCategory && skillCategory !== 'All') params.append('skillCategory', skillCategory);

    const response = await api.get(`/community/members?${params.toString()}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/community/stats');
    return response.data;
  },

  getActivities: async () => {
    const response = await api.get('/community/activities');
    return response.data;
  },
};

export interface CommunityRoom {
  _id: string;
  roomId: string;
  name: string;
  description?: string;
  type: string;
}

export interface ChatUserShort {
  _id: string;
  name: string;
  avatar?: string;
}

export interface CommunityMessage {
  _id: string;
  roomId: string;
  senderId: ChatUserShort;
  content: string;
  createdAt: string;
}

export const communityChatAPI = {
  getRooms: async (): Promise<{ success: boolean; data: CommunityRoom[] }> => {
    const response = await api.get('/community/rooms');
    return response.data;
  },

  getMessages: async (roomId: string): Promise<{ success: boolean; data: CommunityMessage[] }> => {
    const response = await api.get(`/community/rooms/${roomId}/messages`);
    return response.data;
  },

  sendMessage: async (roomId: string, content: string): Promise<{ success: boolean; data: CommunityMessage }> => {
    const response = await api.post(`/community/rooms/${roomId}/messages`, { content });
    return response.data;
  },

  createRoom: async (data: { roomId: string; name: string; description?: string }) => {
    const response = await api.post('/community/rooms', data);
    return response.data;
  }
};

// Requests API
export const requestsAPI = {
  create: async (requestData: { skillId: string; message: string }) => {
    const response = await api.post('/requests', requestData);
    return response.data;
  },

  getAll: async (): Promise<{ success: boolean; data: { incoming: PopulatedSkillRequest[]; outgoing: PopulatedSkillRequest[] } }> => {
    const response = await api.get('/requests');
    return response.data;
  },

  updateStatus: async (id: string, status: 'Accepted' | 'Rejected' | 'Completed') => {
    const response = await api.put(`/requests/${id}`, { status });
    return response.data;
  },
};

// Ratings API
export const ratingsAPI = {
  create: async (ratingData: { requestId: string; score: number; comment?: string }) => {
    const response = await api.post('/ratings', ratingData);
    return response.data;
  },

  getForUser: async (userId: string) => {
    const response = await api.get(`/ratings/user/${userId}`);
    return response.data;
  },
};

// Chat API
// Chat API
export const chatAPI = {
  createSession: async (requestId: string) => {
    const response = await api.post('/chat/session', { requestId });
    return response.data;
  },

  getMessages: async (chatId: string) => {
    const response = await api.get(`/chat/${chatId}/messages`);
    return response.data;
  },

  sendMessage: async (chatId: string, content: string) => {
    const response = await api.post(`/chat/${chatId}/messages`, { content });
    return response.data;
  },

  deleteMessage: (messageId: string) => api.delete(`/chat/messages/${messageId}`),
  markMessagesRead: (chatId: string) => api.post(`/chat/${chatId}/read`),
  deleteChat: (chatId: string) => api.delete(`/chat/${chatId}`),
};

export default api;
