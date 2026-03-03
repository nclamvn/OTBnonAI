import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Budget Alerts Service — in-memory alerts based on budget analysis.
 * Since BudgetAlert/BudgetSnapshot models are not in the current schema,
 * this service computes alerts on-demand from existing data.
 */
@Injectable()
export class BudgetAlertsService {
  private readonly logger = new Logger(BudgetAlertsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Analyze all approved budgets and return alerts.
   */
  async checkAllBudgets() {
    this.logger.log('Running budget alert check...');

    const budgets = await this.prisma.budget.findMany({
      where: { status: 'APPROVED' },
      include: {
        allocate_headers: {
          include: {
            budget_allocates: true,
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

  /**
   * Get alerts for a specific budget or all budgets.
   */
  async getAlerts(options?: { budgetId?: string; unreadOnly?: boolean }) {
    const budgets = await this.prisma.budget.findMany({
      where: {
        ...(options?.budgetId ? { id: +options.budgetId } : {}),
        status: { in: ['APPROVED', 'SUBMITTED'] },
      },
      include: {
        allocate_headers: {
          include: {
            budget_allocates: {
              include: { store: true, season_group: true },
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
    const totalBudget = Number(budget.amount);
    if (totalBudget <= 0) return alerts;

    const latestHeader = budget.allocate_headers?.[0];
    if (!latestHeader) return alerts;

    const totalAllocated = latestHeader.budget_allocates.reduce(
      (sum: number, a: any) => sum + Number(a.budget_amount),
      0,
    );

    const utilizationPct = (totalAllocated / totalBudget) * 100;

    // Over-allocated
    if (totalAllocated > totalBudget) {
      alerts.push({
        budgetId: budget.id,
        budgetName: budget.name,
        alertType: 'over_budget',
        severity: 'critical',
        title: 'Budget Exceeded',
        message: `Allocated amount (${this.fmt(totalAllocated)}) exceeds budget (${this.fmt(totalBudget)}) by ${this.fmt(totalAllocated - totalBudget)}`,
      });
    }
    // Approaching limit
    else if (utilizationPct >= 90) {
      alerts.push({
        budgetId: budget.id,
        budgetName: budget.name,
        alertType: 'approaching_limit',
        severity: 'warning',
        title: 'Budget Nearly Exhausted',
        message: `${utilizationPct.toFixed(1)}% of budget allocated. Only ${this.fmt(totalBudget - totalAllocated)} remaining.`,
      });
    }
    // Under-utilized
    else if (utilizationPct < 50) {
      alerts.push({
        budgetId: budget.id,
        budgetName: budget.name,
        alertType: 'under_utilized',
        severity: 'info',
        title: 'Budget Under-utilized',
        message: `Only ${utilizationPct.toFixed(1)}% of budget allocated. Consider planning additional allocations.`,
      });
    }

    // Store concentration check
    const storeAllocations = latestHeader.budget_allocates;
    if (storeAllocations.length > 0 && totalAllocated > 0) {
      for (const alloc of storeAllocations) {
        const storePct = (Number(alloc.budget_amount) / totalAllocated) * 100;
        if (storePct > 60) {
          alerts.push({
            budgetId: budget.id,
            budgetName: budget.name,
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
