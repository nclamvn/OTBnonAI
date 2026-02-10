// ============================================================================
// FRONTEND API SERVICE LAYER
// Drop these files into src/services/ of the existing React app
// ============================================================================

// --- src/services/api.js ---
// Axios instance with JWT interceptor

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 + refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;


// --- src/services/authService.js ---

// import api from './api';

export const authService = {
  login: async (email, password) => {
    const result = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', result.data.accessToken);
    localStorage.setItem('refreshToken', result.data.refreshToken);
    return result.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getProfile: () => api.get('/auth/me'),
};


// --- src/services/masterDataService.js ---
// Replaces all hardcoded constants.js imports

// import api from './api';

export const masterDataService = {
  getBrands:      () => api.get('/master/brands'),
  getStores:      () => api.get('/master/stores'),
  getCollections: () => api.get('/master/collections'),
  getGenders:     () => api.get('/master/genders'),
  getCategories:  () => api.get('/master/categories'),
  getSeasons:     () => api.get('/master/seasons'),
  getSkuCatalog:  (params) => api.get('/master/sku-catalog', { params }),
};


// --- src/services/budgetService.js ---

// import api from './api';

export const budgetService = {
  getAll:   (params) => api.get('/budgets', { params }),
  getOne:   (id)     => api.get(`/budgets/${id}`),
  create:   (data)   => api.post('/budgets', data),
  update:   (id, data) => api.put(`/budgets/${id}`, data),
  submit:   (id)     => api.post(`/budgets/${id}/submit`),
  remove:   (id)     => api.delete(`/budgets/${id}`),
};


// --- src/services/planningService.js ---

// import api from './api';

export const planningService = {
  getAll:    (params) => api.get('/planning', { params }),
  getOne:    (id)     => api.get(`/planning/${id}`),
  create:    (data)   => api.post('/planning', data),
  update:    (id, data) => api.put(`/planning/${id}`, data),
  submit:    (id)     => api.post(`/planning/${id}/submit`),
  finalize:  (id)     => api.post(`/planning/${id}/finalize`),
  compare:   (id, otherId) => api.get(`/planning/${id}/compare/${otherId}`),
};


// --- src/services/proposalService.js ---

// import api from './api';

export const proposalService = {
  getAll:      (params) => api.get('/proposals', { params }),
  getOne:      (id)     => api.get(`/proposals/${id}`),
  create:      (data)   => api.post('/proposals', data),
  update:      (id, data) => api.put(`/proposals/${id}`, data),
  submit:      (id)     => api.post(`/proposals/${id}/submit`),
  remove:      (id)     => api.delete(`/proposals/${id}`),
  duplicate:   (id)     => api.post(`/proposals/${id}/duplicate`),
  addProduct:  (id, data) => api.post(`/proposals/${id}/products`, data),
  updateProduct: (id, productId, data) => api.put(`/proposals/${id}/products/${productId}`, data),
  removeProduct: (id, productId) => api.delete(`/proposals/${id}/products/${productId}`),
};


// --- src/services/approvalService.js ---

// import api from './api';

export const approvalService = {
  getPending: ()      => api.get('/approvals/pending'),
  approve: (entityType, entityId, comment) =>
    api.post(`/approvals/${entityType}/${entityId}/approve`, { comment }),
  reject: (entityType, entityId, comment) =>
    api.post(`/approvals/${entityType}/${entityId}/reject`, { comment }),
  getHistory: (entityType, entityId) =>
    api.get(`/approvals/${entityType}/${entityId}/history`),
};
