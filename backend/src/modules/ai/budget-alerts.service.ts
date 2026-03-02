import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BudgetAlertsService {
  private readonly logger = new Logger(BudgetAlertsService.name);

  constructor(private prisma: PrismaService) {}

  async checkAllBudgets() {
    this.logger.log('Running budget alert check...');

    const budgets = await this.prisma.budget.findMany({
      where: { status: 'APPROVED' },
      include: {
        allocateHeaders: {
          include: {
            budgetAllocates: true,
          },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    const allAlerts: any[] = [];
    for (const budget of budgets) {
      const alerts = this.analyzeBudget(budget);
      allAlerts.push(...alerts);
    }

    this.logger.log(`Budget check complete: ${allAlerts.length} alert(s) across ${budgets.length} budget(s)`);
    return allAlerts;
  }

  async getAlerts(options?: { budgetId?: string; unreadOnly?: boolean }) {
    const budgets = await this.prisma.budget.findMany({
      where: {
        ...(options?.budgetId ? { id: options.budgetId } : {}),
        status: { in: ['APPROVED', 'SUBMITTED'] },
      },
      include: {
        allocateHeaders: {
          include: {
            budgetAllocates: {
              include: { store: true, seasonGroup: true },
            },
          },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    const allAlerts: any[] = [];
    for (const budget of budgets) {
      allAlerts.push(...this.analyzeBudget(budget));
    }

    return allAlerts;
  }

  async markAsRead(alertId: string) {
    return { id: alertId, isRead: true };
  }

  async dismissAlert(alertId: string) {
    return { id: alertId, isDismissed: true };
  }

  // ── private analysis ────────────────────────────────────────────────────

  private analyzeBudget(budget: any): any[] {
    const alerts: any[] = [];
    const totalBudget = Number(budget.totalBudget);
    if (totalBudget <= 0) return alerts;

    const latestHeader = budget.allocateHeaders?.[0];
    if (!latestHeader) return alerts;

    const totalAllocated = latestHeader.budgetAllocates.reduce(
      (sum: number, a: any) => sum + Number(a.budgetAmount),
      0,
    );

    const utilizationPct = (totalAllocated / totalBudget) * 100;

    if (totalAllocated > totalBudget) {
      alerts.push({
        budgetId: budget.id,
        budgetName: budget.budgetCode,
        alertType: 'over_budget',
        severity: 'critical',
        title: 'Budget Exceeded',
        message: `Allocated amount (${this.fmt(totalAllocated)}) exceeds budget (${this.fmt(totalBudget)}) by ${this.fmt(totalAllocated - totalBudget)}`,
      });
    } else if (utilizationPct >= 90) {
      alerts.push({
        budgetId: budget.id,
        budgetName: budget.budgetCode,
        alertType: 'approaching_limit',
        severity: 'warning',
        title: 'Budget Nearly Exhausted',
        message: `${utilizationPct.toFixed(1)}% of budget allocated. Only ${this.fmt(totalBudget - totalAllocated)} remaining.`,
      });
    } else if (utilizationPct < 50) {
      alerts.push({
        budgetId: budget.id,
        budgetName: budget.budgetCode,
        alertType: 'under_utilized',
        severity: 'info',
        title: 'Budget Under-utilized',
        message: `Only ${utilizationPct.toFixed(1)}% of budget allocated. Consider planning additional allocations.`,
      });
    }

    const storeAllocations = latestHeader.budgetAllocates;
    if (storeAllocations.length > 0 && totalAllocated > 0) {
      for (const alloc of storeAllocations) {
        const storePct = (Number(alloc.budgetAmount) / totalAllocated) * 100;
        if (storePct > 60) {
          alerts.push({
            budgetId: budget.id,
            budgetName: budget.budgetCode,
            alertType: 'store_concentration',
            severity: 'warning',
            title: 'Store Concentration',
            message: `Store ${alloc.store?.code || 'Unknown'} accounts for ${storePct.toFixed(0)}% of total allocation. Consider diversifying.`,
          });
        }
      }
    }

    return alerts;
  }

  private fmt(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
