// ═══════════════════════════════════════════════════════════════════════════
// Planning Service - Version Management + OTB Calculations
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';

export const planningService = {
  // Get all planning versions with filters
  async getAll(filters: any = {}) {
    const response: any = await api.get('/planning', { params: filters });
    return response.data;
  },

  // Get single planning version by ID
  async getOne(id: any) {
    const response: any = await api.get(`/planning/${id}`);
    return response.data.data || response.data;
  },

  // Create new planning version
  async create(data: any) {
    const response: any = await api.post('/planning', data);
    return response.data.data || response.data;
  },

  // Update planning version (DRAFT only)
  async update(id: any, data: any) {
    const response: any = await api.put(`/planning/${id}`, data);
    return response.data.data || response.data;
  },

  // Update single detail
  async updateDetail(planningId: any, detailId: any, data: any) {
    const response: any = await api.patch(`/planning/${planningId}/details/${detailId}`, data);
    return response.data.data || response.data;
  },

  // Copy existing version to new version
  async copy(id: any) {
    const response: any = await api.post(`/planning/${id}/copy`);
    return response.data.data || response.data;
  },

  // Submit for approval
  async submit(id: any) {
    const response: any = await api.post(`/planning/${id}/submit`);
    return response.data.data || response.data;
  },

  // Approve Level 1
  async approveL1(id: any, comment: string = '') {
    const response: any = await api.post(`/planning/${id}/approve/level1`, {
      action: 'APPROVED',
      comment
    });
    return response.data.data || response.data;
  },

  // Approve Level 2
  async approveL2(id: any, comment: string = '') {
    const response: any = await api.post(`/planning/${id}/approve/level2`, {
      action: 'APPROVED',
      comment
    });
    return response.data.data || response.data;
  },

  // Reject Level 1
  async rejectL1(id: any, comment: string = '') {
    const response: any = await api.post(`/planning/${id}/approve/level1`, {
      action: 'REJECTED',
      comment
    });
    return response.data.data || response.data;
  },

  // Reject Level 2
  async rejectL2(id: any, comment: string = '') {
    const response: any = await api.post(`/planning/${id}/approve/level2`, {
      action: 'REJECTED',
      comment
    });
    return response.data.data || response.data;
  },

  // Mark as final version
  async finalize(id: any) {
    const response: any = await api.post(`/planning/${id}/final`);
    return response.data.data || response.data;
  },

  // Delete planning (DRAFT only)
  async delete(id: any) {
    const response: any = await api.delete(`/planning/${id}`);
    return response.data;
  }
};

export default planningService;
