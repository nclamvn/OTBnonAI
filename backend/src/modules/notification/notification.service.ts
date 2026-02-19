import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotificationItem {
  id: string;
  type: 'approval' | 'status_change' | 'pending_action';
  entityType: string;
  entityId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  createdAt: Date;
  read: boolean;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get notifications for a user by aggregating:
   * 1. Recent approvals on their submissions
   * 2. Items pending their review
   */
  async getNotifications(userId: string, limit = 20): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = [];

    // 1. Recent approval decisions on user's budgets/plans/proposals
    const recentApprovals = await this.prisma.approval.findMany({
      where: {
        decidedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // last 7 days
      },
      include: {
        decider: { select: { name: true } },
      },
      orderBy: { decidedAt: 'desc' },
      take: 50,
    });

    // Filter: only approvals on entities the user created
    for (const approval of recentApprovals) {
      let isOwner = false;
      let entityName = '';

      if (approval.entityType === 'budget') {
        const budget = await this.prisma.budget.findUnique({
          where: { id: approval.entityId },
          select: { createdById: true, budgetCode: true },
        });
        if (budget?.createdById === userId) {
          isOwner = true;
          entityName = budget.budgetCode;
        }
      } else if (approval.entityType === 'planning') {
        const plan = await this.prisma.planningVersion.findUnique({
          where: { id: approval.entityId },
          select: { createdById: true, planningCode: true },
        });
        if (plan?.createdById === userId) {
          isOwner = true;
          entityName = plan.planningCode;
        }
      } else if (approval.entityType === 'proposal') {
        const proposal = await this.prisma.proposal.findUnique({
          where: { id: approval.entityId },
          select: { createdById: true, ticketName: true },
        });
        if (proposal?.createdById === userId) {
          isOwner = true;
          entityName = proposal.ticketName;
        }
      }

      if (isOwner) {
        const isApproved = approval.action === 'APPROVED';
        notifications.push({
          id: `approval-${approval.id}`,
          type: 'approval',
          entityType: approval.entityType,
          entityId: approval.entityId,
          title: isApproved
            ? `${approval.entityType} approved`
            : `${approval.entityType} rejected`,
          message: `${approval.decider.name} ${isApproved ? 'approved' : 'rejected'} ${entityName} (L${approval.level})${approval.comment ? ': ' + approval.comment : ''}`,
          severity: isApproved ? 'success' : 'error',
          createdAt: approval.decidedAt,
          read: false,
        });
      }
    }

    // 2. Pending items awaiting user's action (items in SUBMITTED or LEVEL1_APPROVED)
    const [pendingBudgets, pendingPlans, pendingProposals] = await Promise.all([
      this.prisma.budget.count({ where: { status: { in: ['SUBMITTED', 'LEVEL1_APPROVED'] } } }),
      this.prisma.planningVersion.count({ where: { status: { in: ['SUBMITTED', 'LEVEL1_APPROVED'] } } }),
      this.prisma.proposal.count({ where: { status: { in: ['SUBMITTED', 'LEVEL1_APPROVED'] } } }),
    ]);

    const totalPending = pendingBudgets + pendingPlans + pendingProposals;
    if (totalPending > 0) {
      notifications.push({
        id: 'pending-approvals',
        type: 'pending_action',
        entityType: 'all',
        entityId: '',
        title: 'Pending approvals',
        message: `${totalPending} item(s) awaiting review: ${pendingBudgets} budget(s), ${pendingPlans} plan(s), ${pendingProposals} proposal(s)`,
        severity: 'warning',
        createdAt: new Date(),
        read: false,
      });
    }

    // Sort by date desc, limit
    return notifications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
