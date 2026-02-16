// ═══════════════════════════════════════════════════════════════════════════
// Proposal Service - SKU Products + Store Allocation
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';

const extract = (response: any) => response.data?.data ?? response.data;

export const proposalService = {
  // Get all proposals with filters
  async getAll(filters: any = {}) {
    try {
      const response = await api.get('/proposals', { params: filters });
      return response.data;
    } catch (err: any) {
      console.error('[proposalService.getAll]', err?.response?.status, err?.message);
      throw err;
    }
  },

  // Get single proposal by ID
  async getOne(id: string) {
    try {
      const response = await api.get(`/proposals/${id}`);
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.getOne]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Get proposal statistics
  async getStatistics(budgetId: string | null = null) {
    try {
      const params: any = budgetId ? { budgetId } : {};
      const response = await api.get('/proposals/statistics', { params });
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.getStatistics]', err?.response?.status, err?.message);
      throw err;
    }
  },

  // Create new proposal
  async create(data: any) {
    try {
      const response = await api.post('/proposals', data);
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.create]', err?.response?.status, err?.message);
      throw err;
    }
  },

  // Update proposal
  async update(id: string, data: any) {
    try {
      const response = await api.put(`/proposals/${id}`, data);
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.update]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Add product to proposal
  async addProduct(proposalId: string, productData: any) {
    try {
      const response = await api.post(`/proposals/${proposalId}/products`, productData);
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.addProduct]', proposalId, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Bulk add products
  async bulkAddProducts(proposalId: string, products: any) {
    try {
      const response = await api.post(`/proposals/${proposalId}/products/bulk`, { products });
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.bulkAddProducts]', proposalId, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Update product in proposal
  async updateProduct(proposalId: string, productId: string, data: any) {
    try {
      const response = await api.patch(`/proposals/${proposalId}/products/${productId}`, data);
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.updateProduct]', proposalId, productId, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Remove product from proposal
  async removeProduct(proposalId: string, productId: string) {
    try {
      const response = await api.delete(`/proposals/${proposalId}/products/${productId}`);
      return response.data;
    } catch (err: any) {
      console.error('[proposalService.removeProduct]', proposalId, productId, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Submit for approval
  async submit(id: string) {
    try {
      const response = await api.post(`/proposals/${id}/submit`);
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.submit]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Approve Level 1
  async approveL1(id: string, comment: string = '') {
    try {
      const response = await api.post(`/proposals/${id}/approve/level1`, { action: 'APPROVED', comment });
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.approveL1]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Approve Level 2
  async approveL2(id: string, comment: string = '') {
    try {
      const response = await api.post(`/proposals/${id}/approve/level2`, { action: 'APPROVED', comment });
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.approveL2]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Reject Level 1
  async rejectL1(id: string, comment: string = '') {
    try {
      const response = await api.post(`/proposals/${id}/approve/level1`, { action: 'REJECTED', comment });
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.rejectL1]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Reject Level 2
  async rejectL2(id: string, comment: string = '') {
    try {
      const response = await api.post(`/proposals/${id}/approve/level2`, { action: 'REJECTED', comment });
      return extract(response);
    } catch (err: any) {
      console.error('[proposalService.rejectL2]', id, err?.response?.status, err?.message);
      throw err;
    }
  },

  // Delete proposal (DRAFT only)
  async delete(id: string) {
    try {
      const response = await api.delete(`/proposals/${id}`);
      return response.data;
    } catch (err: any) {
      console.error('[proposalService.delete]', id, err?.response?.status, err?.message);
      throw err;
    }
  }
};

export default proposalService;
