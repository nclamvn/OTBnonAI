// ═══════════════════════════════════════════════════════════════════════════
// Proposal Service - SKU Products + Store Allocation
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';
import { approvalHelper } from './approvalHelper';
import { extract, normalizeList } from './serviceUtils';

/** Wrap an async API call with consistent extract + error logging.
 *  Silently swallows AbortError / CancelError so callers don't see noise. */
const withErrorLog = async <T>(tag: string, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
      throw err;
    }
    console.error(`[proposalService.${tag}]`, err?.response?.status, err?.message);
    throw err;
  }
};

export const proposalService = {
  // Get all proposals with filters
  async getAll(filters: any = {}) {
    try {
      const response = await api.get('/proposals', { params: filters });
      return normalizeList(extract(response));
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

  // Approval methods (delegated to approvalHelper)
  approveL1: (id: string, comment?: string) => approvalHelper.approveL1('proposal', id, comment),
  approveL2: (id: string, comment?: string) => approvalHelper.approveL2('proposal', id, comment),
  rejectL1: (id: string, comment?: string) => approvalHelper.rejectL1('proposal', id, comment),
  rejectL2: (id: string, comment?: string) => approvalHelper.rejectL2('proposal', id, comment),

  // Save full proposal (overwrite)
  saveFullProposal: (headerId: string, data: any) =>
    withErrorLog('saveFullProposal', async () => extract(await api.put(`/proposals/${headerId}/save-full`, data))),

  // Copy proposal
  copyProposal: (headerId: string) =>
    withErrorLog('copyProposal', async () => extract(await api.post(`/proposals/${headerId}/copy`))),

  // Get historical proposal data
  async getHistorical(params: { fiscalYear: number; seasonGroupName: string; seasonName: string; brandId: string }) {
    try {
      return extract(await api.get('/proposals/historical', { params }));
    } catch (err: any) {
      console.error('[proposalService.getHistorical]', err?.response?.status, err?.message);
      return null;
    }
  },

  // Create allocations
  createAllocations: (data: any) =>
    withErrorLog('createAllocations', async () => extract(await api.post('/proposals/allocations', data))),

  // Sizing headers
  getSizingHeadersByProposalHeader: (proposalHeaderId: string) =>
    withErrorLog('getSizingHeaders', async () => extract(await api.get(`/proposals/${proposalHeaderId}/sizing-headers`))),

  updateSizingHeader: (headerId: string, data: any) =>
    withErrorLog('updateSizingHeader', async () => extract(await api.patch(`/proposals/sizing-headers/${headerId}`, data))),

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
