// ═══════════════════════════════════════════════════════════════════════════
// Budget Service - CRUD + Approval Workflow
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';

const extract = (response: any) => response.data?.data ?? response.data;

export const budgetService = {
  // Get all budgets with filters
  async getAll(filters: any = {}) {
    try {
      const response = await api.get('/budgets', { params: filters });
      return response.data;
    } catch (err: any) {
      console.error('[budgetService.getAll]', err?.response?.status, err?.message);
      throw err;
    }
  },

  // Get single budget by ID
  async getOne(id: string) {
    try {
      const response = await api.get(`/budgets/${id}`);
      return extract(response);
    } catch (err: any) {
      console.error('[budgetService.getOne]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Get budget statistics
  async getStatistics() {
    try {
      const response = await api.get('/budgets/statistics');
      return extract(response);
    } catch (err: any) {
      console.error('[budgetService.getStatistics]', err?.response?.status, err?.message);
      throw err;
    }
  },

  // Create new budget
  async create(data: any) {
    try {
      const response = await api.post('/budgets', data);
      return extract(response);
    } catch (err: any) {
      console.error('[budgetService.create]', err?.response?.status, err?.message);
      throw err;
    }
  },

  // Update budget (DRAFT only)
  async update(id: string, data: any) {
    try {
      const response = await api.put(`/budgets/${id}`, data);
      return extract(response);
    } catch (err: any) {
      console.error('[budgetService.update]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Submit budget for approval
  async submit(id: string) {
    try {
      const response = await api.post(`/budgets/${id}/submit`);
      return extract(response);
    } catch (err: any) {
      console.error('[budgetService.submit]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Approve Level 1
  async approveL1(id: string, comment: string = '') {
    try {
      const response = await api.post(`/budgets/${id}/approve/level1`, { action: 'APPROVED', comment });
      return extract(response);
    } catch (err: any) {
      console.error('[budgetService.approveL1]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Approve Level 2
  async approveL2(id: string, comment: string = '') {
    try {
      const response = await api.post(`/budgets/${id}/approve/level2`, { action: 'APPROVED', comment });
      return extract(response);
    } catch (err: any) {
      console.error('[budgetService.approveL2]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Reject Level 1
  async rejectL1(id: string, comment: string = '') {
    try {
      const response = await api.post(`/budgets/${id}/approve/level1`, { action: 'REJECTED', comment });
      return extract(response);
    } catch (err: any) {
      console.error('[budgetService.rejectL1]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Reject Level 2
  async rejectL2(id: string, comment: string = '') {
    try {
      const response = await api.post(`/budgets/${id}/approve/level2`, { action: 'REJECTED', comment });
      return extract(response);
    } catch (err: any) {
      console.error('[budgetService.rejectL2]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Delete budget (DRAFT only, no linked planning)
  async delete(id: string) {
    try {
      const response = await api.delete(`/budgets/${id}`);
      return response.data;
    } catch (err: any) {
      console.error('[budgetService.delete]', id, err?.response?.status, err?.message);
      throw err;
    }
  }
};

export default budgetService;
