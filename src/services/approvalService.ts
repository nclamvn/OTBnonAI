// ═══════════════════════════════════════════════════════════════════════════
// Approval Service - Pending Items + Approval History
// ═══════════════════════════════════════════════════════════════════════════
import api from './api';
import { budgetService } from './budgetService';
import { planningService } from './planningService';
import { proposalService } from './proposalService';

export const approvalService = {
  // Get all pending approvals for current user
  // NOTE: If backend doesn't have /approvals/pending endpoint,
  // we aggregate from budgets, planning, proposals with SUBMITTED/LEVEL1_APPROVED status
  async getPending() {
    // Aggregate from individual modules (direct /approvals/pending not yet implemented)
    {
      const [budgetsL1, budgetsL2, planningsL1, planningsL2, proposalsL1, proposalsL2] = await Promise.all([
        budgetService.getAll({ status: 'SUBMITTED' }).catch(() => ({ data: [] })),
        budgetService.getAll({ status: 'LEVEL1_APPROVED' }).catch(() => ({ data: [] })),
        planningService.getAll({ status: 'SUBMITTED' }).catch(() => ({ data: [] })),
        planningService.getAll({ status: 'LEVEL1_APPROVED' }).catch(() => ({ data: [] })),
        proposalService.getAll({ status: 'SUBMITTED' }).catch(() => ({ data: [] })),
        proposalService.getAll({ status: 'LEVEL1_APPROVED' }).catch(() => ({ data: [] })),
      ]);

      const pending: any[] = [];

      // Add budgets (L1 + L2)
      [...(budgetsL1.data || []), ...(budgetsL2.data || [])].forEach((b: any) => {
        pending.push({
          entityType: 'budget',
          entityId: b.id,
          level: b.status === 'SUBMITTED' ? 1 : 2,
          data: b,
          submittedAt: b.updatedAt
        });
      });

      // Add plannings (L1 + L2)
      [...(planningsL1.data || []), ...(planningsL2.data || [])].forEach((p: any) => {
        pending.push({
          entityType: 'planning',
          entityId: p.id,
          level: p.status === 'SUBMITTED' ? 1 : 2,
          data: p,
          submittedAt: p.updatedAt
        });
      });

      // Add proposals (L1 + L2)
      [...(proposalsL1.data || []), ...(proposalsL2.data || [])].forEach((p: any) => {
        pending.push({
          entityType: 'proposal',
          entityId: p.id,
          level: p.status === 'SUBMITTED' ? 1 : 2,
          data: p,
          submittedAt: p.updatedAt
        });
      });

      return pending;
    }
  },

  // Approve an item
  async approve(entityType: string, entityId: any, level: number, comment: string = '') {
    switch (entityType) {
      case 'budget':
        return level === 1
          ? budgetService.approveL1(entityId, comment)
          : budgetService.approveL2(entityId, comment);
      case 'planning':
        return level === 1
          ? planningService.approveL1(entityId, comment)
          : planningService.approveL2(entityId, comment);
      case 'proposal':
        return level === 1
          ? proposalService.approveL1(entityId, comment)
          : proposalService.approveL2(entityId, comment);
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  },

  // Reject an item
  async reject(entityType: string, entityId: any, level: number, comment: string = '') {
    switch (entityType) {
      case 'budget':
        return level === 1
          ? budgetService.rejectL1(entityId, comment)
          : budgetService.rejectL2(entityId, comment);
      case 'planning':
        return level === 1
          ? planningService.rejectL1(entityId, comment)
          : planningService.rejectL2(entityId, comment);
      case 'proposal':
        return level === 1
          ? proposalService.rejectL1(entityId, comment)
          : proposalService.rejectL2(entityId, comment);
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  },

  // Get approval history for an item
  async getHistory(entityType: string, entityId: any) {
    try {
      const response: any = await api.get(`/approvals/${entityType}/${entityId}/history`);
      return response.data.data || response.data;
    } catch (error: any) {
      // Fallback: get from the entity itself
      let entity: any;
      switch (entityType) {
        case 'budget':
          entity = await budgetService.getOne(entityId);
          break;
        case 'planning':
          entity = await planningService.getOne(entityId);
          break;
        case 'proposal':
          entity = await proposalService.getOne(entityId);
          break;
        default:
          return [];
      }
      return entity.approvals || [];
    }
  }
};

export default approvalService;
