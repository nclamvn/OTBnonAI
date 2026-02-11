// ═══════════════════════════════════════════════════════════════════════════
// Auth Service - Login, Logout, Profile
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';

const isBrowser = typeof window !== 'undefined';

export const authService = {
  // Login with email and password
  async login(email: string, password: string) {
    const response: any = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data.data || response.data;

    if (isBrowser) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }

    return { accessToken, refreshToken, user };
  },

  // Logout - clear tokens
  logout() {
    if (isBrowser) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Get current user profile
  async getProfile() {
    const response: any = await api.get('/auth/me');
    return response.data.data || response.data;
  },

  // Refresh token
  async refresh() {
    const refreshToken = isBrowser ? localStorage.getItem('refreshToken') : null;
    const response: any = await api.post('/auth/refresh', { refreshToken });
    const data = response.data.data || response.data;

    if (isBrowser) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }

    return data;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return isBrowser ? !!localStorage.getItem('accessToken') : false;
  },

  // Get stored access token
  getToken() {
    return isBrowser ? localStorage.getItem('accessToken') : null;
  }
};

export default authService;
