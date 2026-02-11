// ═══════════════════════════════════════════════════════════════════════════
// Proposal Service - SKU Products + Store Allocation
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';

export const proposalService = {
  // Get all proposals with filters
  async getAll(filters: any = {}) {
    const response: any = await api.get('/proposals', { params: filters });
    return response.data;
  },

  // Get single proposal by ID
  async getOne(id: any) {
    const response: any = await api.get(`/proposals/${id}`);
    return response.data.data || response.data;
  },

  // Get proposal statistics
  async getStatistics(budgetId: any = null) {
    const params: any = budgetId ? { budgetId } : {};
    const response: any = await api.get('/proposals/statistics', { params });
    return response.data.data || response.data;
  },

  // Create new proposal
  async create(data: any) {
    const response: any = await api.post('/proposals', data);
    return response.data.data || response.data;
  },

  // Update proposal
  async update(id: any, data: any) {
    const response: any = await api.put(`/proposals/${id}`, data);
    return response.data.data || response.data;
  },

  // Add product to proposal
  async addProduct(proposalId: any, productData: any) {
    const response: any = await api.post(`/proposals/${proposalId}/products`, productData);
    return response.data.data || response.data;
  },

  // Bulk add products
  async bulkAddProducts(proposalId: any, products: any) {
    const response: any = await api.post(`/proposals/${proposalId}/products/bulk`, { products });
    return response.data.data || response.data;
  },

  // Update product in proposal
  async updateProduct(proposalId: any, productId: any, data: any) {
    const response: any = await api.patch(`/proposals/${proposalId}/products/${productId}`, data);
    return response.data.data || response.data;
  },

  // Remove product from proposal
  async removeProduct(proposalId: any, productId: any) {
    const response: any = await api.delete(`/proposals/${proposalId}/products/${productId}`);
    return response.data;
  },

  // Submit for approval
  async submit(id: any) {
    const response: any = await api.post(`/proposals/${id}/submit`);
    return response.data.data || response.data;
  },

  // Approve Level 1
  async approveL1(id: any, comment: string = '') {
    const response: any = await api.post(`/proposals/${id}/approve/level1`, {
      action: 'APPROVED',
      comment
    });
    return response.data.data || response.data;
  },

  // Approve Level 2
  async approveL2(id: any, comment: string = '') {
    const response: any = await api.post(`/proposals/${id}/approve/level2`, {
      action: 'APPROVED',
      comment
    });
    return response.data.data || response.data;
  },

  // Reject Level 1
  async rejectL1(id: any, comment: string = '') {
    const response: any = await api.post(`/proposals/${id}/approve/level1`, {
      action: 'REJECTED',
      comment
    });
    return response.data.data || response.data;
  },

  // Reject Level 2
  async rejectL2(id: any, comment: string = '') {
    const response: any = await api.post(`/proposals/${id}/approve/level2`, {
      action: 'REJECTED',
      comment
    });
    return response.data.data || response.data;
  },

  // Delete proposal (DRAFT only)
  async delete(id: any) {
    const response: any = await api.delete(`/proposals/${id}`);
    return response.data;
  }
};

export default proposalService;
