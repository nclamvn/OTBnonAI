// ═══════════════════════════════════════════════════════════════════════════
// Notification Service - Fetches user notifications from API
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';

const extract = (response: any) => response.data?.data ?? response.data;

export interface Notification {
  id: string;
  type: 'approval' | 'status_change' | 'pending_action';
  entityType: string;
  entityId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  createdAt: string;
  read: boolean;
}

export const notificationService = {
  async getAll(limit = 20): Promise<Notification[]> {
    try {
      const response = await api.get('/notifications', { params: { limit } });
      return extract(response) || [];
    } catch (err: any) {
      console.error('[notificationService.getAll]', err?.response?.status, err?.message);
      return [];
    }
  },
};
