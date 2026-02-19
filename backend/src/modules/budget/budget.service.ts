import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { BudgetStatus, ApprovalAction, Prisma } from '@prisma/client';
import { CreateBudgetDto, UpdateBudgetDto, ApprovalDecisionDto } from './dto/budget.dto';
import { BRAND_BUDGET_CAP_PCT } from './budget.constants';
import { safeSum, toNumber } from '../../common/utils/financial';

interface BudgetFilters {
  fiscalYear?: number;
  groupBrandId?: string;
  seasonGroupId?: string;
  status?: BudgetStatus;
  page?: number;
  pageSize?: number;
}

// ─── SERVICE ─────────────────────────────────────────────────────────────────

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService, private auditLog: AuditLogService) {}

  // ─── LIST ──────────────────────────────────────────────────────────────

  async findAll(filters: BudgetFilters, user?: { brandAccess?: string[]; permissions?: string[] }) {
    const { fiscalYear, groupBrandId, seasonGroupId, status, page = 1, pageSize = 20 } = filters;

    const where: Prisma.BudgetWhereInput = { deletedAt: null }; // SEC-16: Exclude soft-deleted
    if (fiscalYear) where.fiscalYear = fiscalYear;
    if (groupBrandId) where.groupBrandId = groupBrandId;
    if (seasonGroupId) where.seasonGroupId = seasonGroupId;
    if (status) where.status = status;

    // SEC-04: Data scoping by brandAccess (skip for admin wildcard)
    if (user?.brandAccess?.length && !user.permissions?.includes('*')) {
      where.groupBrandId = groupBrandId
        ? { equals: groupBrandId, in: user.brandAccess } as any
        : { in: user.brandAccess };
    }

    const [data, total] = await Promise.all([
      this.prisma.budget.findMany({
        where,
        include: {
          groupBrand: true,
          details: { include: { store: true } },
          createdBy: { select: { id: true, name: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.budget.count({ where }),
    ]);

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ─── GET ONE ───────────────────────────────────────────────────────────

  async findOne(id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, deletedAt: null }, // SEC-16: Exclude soft-deleted
      include: {
        groupBrand: true,
        details: { include: { store: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!budget) throw new NotFoundException('Budget not found');

    // Query approvals separately (polymorphic relation)
    const approvals = await this.prisma.approval.findMany({
      where: { entityType: 'budget', entityId: id },
      include: { decider: { select: { id: true, name: true } } },
      orderBy: { decidedAt: 'desc' },
    });

    return { ...budget, approvals };
  }

  // ─── CREATE ────────────────────────────────────────────────────────────

  async create(dto: CreateBudgetDto, userId: string) {
    // R-BUD-02: Must have at least 1 store allocation > 0
    const validDetails = dto.details.filter(d => d.budgetAmount > 0);
    if (validDetails.length === 0) {
      throw new BadRequestException('At least one store must have a budget amount > 0');
    }

    // BIZ-08: Check for duplicate store allocations
    const storeIds = dto.details.map(d => d.storeId);
    const uniqueStoreIds = new Set(storeIds);
    if (uniqueStoreIds.size !== storeIds.length) {
      throw new BadRequestException('Duplicate store allocations found. Each store can only appear once.');
    }

    // BIZ-08: Validate all stores exist
    const storeCount = await this.prisma.store.count({ where: { id: { in: storeIds } } });
    if (storeCount !== uniqueStoreIds.size) {
      throw new BadRequestException('One or more store IDs are invalid');
    }

    // R-BUD-01: Calculate total (BIZ-11: use safeSum for precision)
    const totalBudget = safeSum(validDetails.map(d => d.budgetAmount));

    // VAL-01: Per-brand budget cap — no single store allocation may exceed BRAND_BUDGET_CAP_PCT of total
    this.validateBrandBudgetCap(validDetails, totalBudget);

    // R-BUD-06: Generate unique budget code
    const brand = await this.prisma.groupBrand.findUnique({ where: { id: dto.groupBrandId } });
    if (!brand) throw new BadRequestException('Invalid brand');

    const budgetCode = `BUD-${brand.code}-${dto.seasonGroupId}-${dto.seasonType}-${dto.fiscalYear}`;

    // Check uniqueness (both budgetCode and compound unique)
    const existing = await this.prisma.budget.findFirst({
      where: {
        OR: [
          { budgetCode },
          {
            groupBrandId: dto.groupBrandId,
            seasonGroupId: dto.seasonGroupId,
            seasonType: dto.seasonType,
            fiscalYear: dto.fiscalYear,
          },
        ],
      },
    });
    if (existing) {
      throw new BadRequestException(`Budget already exists for this brand/season/year combination: ${existing.budgetCode}`);
    }

    const created = await this.prisma.budget.create({
      data: {
        budgetCode,
        groupBrandId: dto.groupBrandId,
        seasonGroupId: dto.seasonGroupId,
        seasonType: dto.seasonType,
        fiscalYear: dto.fiscalYear,
        totalBudget,
        comment: dto.comment,
        createdById: userId,
        details: {
          create: dto.details.map(d => ({
            storeId: d.storeId,
            budgetAmount: d.budgetAmount,
          })),
        },
      },
      include: {
        groupBrand: true,
        details: { include: { store: true } },
      },
    });

    this.auditLog.log({ userId, entityType: 'budget', entityId: created.id, action: 'create', changes: { budgetCode, totalBudget, fiscalYear: dto.fiscalYear } });
    return created;
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateBudgetDto & { version?: number }, userId: string) {
    const budget = await this.prisma.budget.findFirst({ where: { id, deletedAt: null } });
    if (!budget) throw new NotFoundException('Budget not found');

    // R-BUD-04: Only DRAFT can be edited
    if (budget.status !== BudgetStatus.DRAFT) {
      throw new ForbiddenException('Only draft budgets can be edited');
    }

    // SEC-13: Optimistic locking — reject if client version doesn't match
    if (dto.version !== undefined && dto.version !== budget.version) {
      throw new BadRequestException('This budget has been modified by another user. Please refresh and try again.');
    }

    const updateData: any = { version: { increment: 1 } }; // SEC-13: Increment version on every update
    if (dto.comment !== undefined) updateData.comment = dto.comment;

    if (dto.details) {
      // R-BUD-02: Validate
      const validDetails = dto.details.filter(d => d.budgetAmount > 0);
      if (validDetails.length === 0) {
        throw new BadRequestException('At least one store must have a budget amount > 0');
      }

      // R-BUD-01: Recalculate total (BIZ-11: use safeSum for precision)
      updateData.totalBudget = safeSum(dto.details.map(d => d.budgetAmount));

      // VAL-01: Per-brand budget cap — no single store allocation may exceed BRAND_BUDGET_CAP_PCT of total
      this.validateBrandBudgetCap(validDetails, updateData.totalBudget);

      // Upsert details
      await this.prisma.budgetDetail.deleteMany({ where: { budgetId: id } });
      await this.prisma.budgetDetail.createMany({
        data: dto.details.map(d => ({
          budgetId: id,
          storeId: d.storeId,
          budgetAmount: d.budgetAmount,
        })),
      });
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        groupBrand: true,
        details: { include: { store: true } },
      },
    });

    this.auditLog.log({ userId, entityType: 'budget', entityId: id, action: 'update', changes: updateData });
    return updated;
  }

  // ─── SUBMIT ────────────────────────────────────────────────────────────

  async submit(id: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { details: true },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    // R-BUD-03: Only DRAFT → SUBMITTED
    if (budget.status !== BudgetStatus.DRAFT) {
      throw new BadRequestException(`Cannot submit budget with status: ${budget.status}`);
    }

    const result = await this.prisma.budget.update({
      where: { id },
      data: { status: BudgetStatus.SUBMITTED },
    });

    this.auditLog.log({ userId, entityType: 'budget', entityId: id, action: 'submit', changes: { status: 'SUBMITTED' } });
    return result;
  }

  // ─── DELETE ────────────────────────────────────────────────────────────

  async remove(id: string, userId?: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, deletedAt: null },
      include: { details: { include: { planningVersions: true } } },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    // R-BUD-04: Only DRAFT can be deleted
    if (budget.status !== BudgetStatus.DRAFT) {
      throw new ForbiddenException('Only draft budgets can be deleted');
    }

    // R-BUD-07: Cannot delete if planning exists
    const hasPlanning = budget.details.some(d => d.planningVersions.length > 0);
    if (hasPlanning) {
      throw new ForbiddenException('Cannot delete budget that has linked planning versions');
    }

    // SEC-16: Soft delete — set deletedAt instead of hard delete
    const result = await this.prisma.budget.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    if (userId) this.auditLog.log({ userId, entityType: 'budget', entityId: id, action: 'soft_delete', changes: { budgetCode: budget.budgetCode } });
    return result;
  }

  // SEC-16: Restore a soft-deleted budget
  async restore(id: string, userId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!budget) throw new NotFoundException('Budget not found or not deleted');

    const result = await this.prisma.budget.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        groupBrand: true,
        details: { include: { store: true } },
      },
    });

    this.auditLog.log({ userId, entityType: 'budget', entityId: id, action: 'restore', changes: { budgetCode: budget.budgetCode } });
    return result;
  }

  // ─── APPROVE LEVEL 1 ────────────────────────────────────────────────────

  async approveLevel1(id: string, dto: ApprovalDecisionDto, userId: string, userRole?: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');

    // R-BUD-05: Only SUBMITTED can be approved at Level 1
    if (budget.status !== BudgetStatus.SUBMITTED) {
      throw new BadRequestException(`Cannot approve budget with status: ${budget.status}. Must be SUBMITTED.`);
    }

    // BIZ-01: Prevent self-approval
    if (budget.createdById === userId) {
      throw new ForbiddenException('Cannot approve your own submission');
    }

    // BIZ-12: Enforce ApprovalWorkflowStep — validate approver matches configured workflow for step 1
    await this.validateWorkflowStep(budget.groupBrandId, 1, userId, userRole);

    const newStatus = dto.action === 'APPROVED'
      ? BudgetStatus.LEVEL1_APPROVED
      : BudgetStatus.REJECTED;

    // BIZ-06: Atomic approval — transaction prevents race condition
    const result = await this.prisma.$transaction(async (tx) => {
      // Re-check status inside transaction to prevent concurrent approvals
      const current = await tx.budget.findUnique({ where: { id } });
      if (current?.status !== BudgetStatus.SUBMITTED) {
        throw new BadRequestException('Budget already processed by another approver');
      }

      await tx.approval.create({
        data: {
          entityType: 'budget',
          entityId: id,
          level: 1,
          deciderId: userId,
          action: dto.action as ApprovalAction,
          comment: dto.comment,
        },
      });

      return tx.budget.update({
        where: { id },
        data: { status: newStatus },
        include: {
          groupBrand: true,
          details: { include: { store: true } },
        },
      });
    });

    this.auditLog.log({ userId, entityType: 'budget', entityId: id, action: dto.action === 'APPROVED' ? 'approve_l1' : 'reject_l1', changes: { status: newStatus } });

    // BIZ-10: Cascade reject linked entities when budget is rejected
    if (newStatus === BudgetStatus.REJECTED) {
      await this.cascadeRejectLinkedEntities(id, userId);
    }

    return result;
  }

  // ─── APPROVE LEVEL 2 ────────────────────────────────────────────────────

  async approveLevel2(id: string, dto: ApprovalDecisionDto, userId: string, userRole?: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');

    // R-BUD-05: Only LEVEL1_APPROVED can be approved at Level 2
    if (budget.status !== BudgetStatus.LEVEL1_APPROVED) {
      throw new BadRequestException(`Cannot approve budget with status: ${budget.status}. Must be LEVEL1_APPROVED.`);
    }

    // BIZ-01: Prevent self-approval
    if (budget.createdById === userId) {
      throw new ForbiddenException('Cannot approve your own submission');
    }

    // BIZ-12: Enforce ApprovalWorkflowStep — validate approver matches configured workflow for step 2
    await this.validateWorkflowStep(budget.groupBrandId, 2, userId, userRole);

    const newStatus = dto.action === 'APPROVED'
      ? BudgetStatus.APPROVED
      : BudgetStatus.REJECTED;

    // BIZ-06: Atomic approval
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.budget.findUnique({ where: { id } });
      if (current?.status !== BudgetStatus.LEVEL1_APPROVED) {
        throw new BadRequestException('Budget already processed by another approver');
      }

      await tx.approval.create({
        data: {
          entityType: 'budget',
          entityId: id,
          level: 2,
          deciderId: userId,
          action: dto.action as ApprovalAction,
          comment: dto.comment,
        },
      });

      return tx.budget.update({
        where: { id },
        data: { status: newStatus },
        include: {
          groupBrand: true,
          details: { include: { store: true } },
        },
      });
    });

    this.auditLog.log({ userId, entityType: 'budget', entityId: id, action: dto.action === 'APPROVED' ? 'approve_l2' : 'reject_l2', changes: { status: newStatus } });

    // BIZ-10: Cascade reject linked entities when budget is rejected
    if (newStatus === BudgetStatus.REJECTED) {
      await this.cascadeRejectLinkedEntities(id, userId);
    }

    return result;
  }

  // ─── RESET TO DRAFT ────────────────────────────────────────────────────

  async resetToDraft(id: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');

    if (budget.status !== BudgetStatus.REJECTED) {
      throw new BadRequestException(`Only REJECTED budgets can be reset to draft. Current status: ${budget.status}`);
    }

    // Create an audit trail approval record for the reset
    await this.prisma.approval.create({
      data: {
        entityType: 'budget',
        entityId: id,
        level: 0,
        deciderId: userId,
        action: 'APPROVED' as ApprovalAction,
        comment: 'Reset to DRAFT for revision',
      },
    });

    const result = await this.prisma.budget.update({
      where: { id },
      data: { status: BudgetStatus.DRAFT },
      include: {
        groupBrand: true,
        details: { include: { store: true } },
      },
    });

    this.auditLog.log({ userId, entityType: 'budget', entityId: id, action: 'reset_to_draft', changes: { status: 'DRAFT' } });
    return result;
  }

  // ─── VAL-01: PER-BRAND BUDGET CAP ──────────────────────────────────────────

  private validateBrandBudgetCap(
    details: { storeId: string; budgetAmount: number }[],
    totalBudget: number,
  ) {
    if (totalBudget <= 0) return;
    const capPct = Math.round(BRAND_BUDGET_CAP_PCT * 100);

    for (const detail of details) {
      const ratio = detail.budgetAmount / totalBudget;
      if (ratio > BRAND_BUDGET_CAP_PCT) {
        const actualPct = Math.round(ratio * 100);
        throw new BadRequestException(
          `Store allocation exceeds budget cap: store ${detail.storeId} is allocated ${actualPct}% of total budget, which exceeds the maximum allowed ${capPct}%.`,
        );
      }
    }
  }

  // ─── BIZ-12: APPROVAL WORKFLOW STEP VALIDATION ─────────────────────────────

  /**
   * Validates that the approver matches the configured ApprovalWorkflowStep for the brand.
   * Soft check: if no workflow is configured for the brand/step, any authorised user can approve.
   *
   * Priority: userId match > roleCode/roleName match > no workflow (allow all)
   */
  private async validateWorkflowStep(
    groupBrandId: string,
    stepNumber: number,
    userId: string,
    userRole?: string,
  ) {
    const workflowStep = await this.prisma.approvalWorkflowStep.findFirst({
      where: {
        brandId: groupBrandId,
        stepNumber,
        isActive: true,
      },
    });

    // No workflow configured for this brand/step — backwards compatible, allow any approver
    if (!workflowStep) return;

    // If workflow step specifies a specific user, the approver must match
    if (workflowStep.userId) {
      if (workflowStep.userId !== userId) {
        throw new ForbiddenException(
          `Workflow step ${stepNumber} for this brand requires a specific approver. You are not the designated approver.`,
        );
      }
      return; // userId matched — approved
    }

    // If workflow step specifies a role (code or name), check user's role matches
    if (workflowStep.roleCode || workflowStep.roleName) {
      if (!userRole) {
        throw new ForbiddenException(
          `Workflow step ${stepNumber} for this brand requires role "${workflowStep.roleCode || workflowStep.roleName}". Unable to verify your role.`,
        );
      }

      const roleMatches =
        (workflowStep.roleCode && userRole.toUpperCase() === workflowStep.roleCode.toUpperCase()) ||
        (workflowStep.roleName && userRole.toLowerCase() === workflowStep.roleName.toLowerCase());

      if (!roleMatches) {
        throw new ForbiddenException(
          `Workflow step ${stepNumber} for this brand requires role "${workflowStep.roleCode || workflowStep.roleName}". Your role "${userRole}" does not match.`,
        );
      }
    }
  }

  // ─── BIZ-10: CASCADE REJECT ─────────────────────────────────────────────

  private async cascadeRejectLinkedEntities(budgetId: string, userId: string) {
    // Reject all non-final planning versions linked to this budget's details
    const plannings = await this.prisma.planningVersion.findMany({
      where: {
        budgetDetail: { budgetId },
        status: { in: ['DRAFT', 'SUBMITTED', 'LEVEL1_APPROVED'] },
      },
    });

    if (plannings.length > 0) {
      await this.prisma.planningVersion.updateMany({
        where: { id: { in: plannings.map(p => p.id) } },
        data: { status: 'REJECTED' },
      });
      this.auditLog.log({ userId, entityType: 'budget', entityId: budgetId, action: 'cascade_reject_planning', changes: { count: plannings.length, ids: plannings.map(p => p.id) } });
    }

    // Reject all non-final proposals linked to this budget
    const proposals = await this.prisma.proposal.findMany({
      where: {
        budgetId,
        status: { in: ['DRAFT', 'SUBMITTED', 'LEVEL1_APPROVED'] },
      },
    });

    if (proposals.length > 0) {
      await this.prisma.proposal.updateMany({
        where: { id: { in: proposals.map(p => p.id) } },
        data: { status: 'REJECTED' },
      });
      this.auditLog.log({ userId, entityType: 'budget', entityId: budgetId, action: 'cascade_reject_proposal', changes: { count: proposals.length, ids: proposals.map(p => p.id) } });
    }
  }

  // ─── ARCHIVE ─────────────────────────────────────────────────────────────

  async archive(id: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');

    // Only APPROVED budgets can be archived
    if (budget.status !== BudgetStatus.APPROVED) {
      throw new BadRequestException(`Only approved budgets can be archived. Current status: ${budget.status}`);
    }

    const result = await this.prisma.budget.update({
      where: { id },
      data: { status: BudgetStatus.ARCHIVED },
      include: {
        groupBrand: true,
        details: { include: { store: true } },
      },
    });

    this.auditLog.log({ userId, entityType: 'budget', entityId: id, action: 'archive', changes: { status: 'ARCHIVED' } });
    return result;
  }

  // ─── STATISTICS ─────────────────────────────────────────────────────────

  async getStatistics(fiscalYear?: number) {
    const where: Prisma.BudgetWhereInput = { deletedAt: null }; // SEC-16: Exclude soft-deleted
    if (fiscalYear) where.fiscalYear = fiscalYear;

    const [total, byStatus, totalAmount, brandCount, categoryCount, planCount, proposalCount] = await Promise.all([
      this.prisma.budget.count({ where }),
      this.prisma.budget.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.budget.aggregate({
        where,
        _sum: { totalBudget: true },
      }),
      this.prisma.groupBrand.count({ where: { isActive: true } }),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.planningVersion.count({
        where: { status: { in: ['DRAFT', 'SUBMITTED', 'LEVEL1_APPROVED'] } },
      }),
      this.prisma.proposal.count({
        where: { status: { in: ['DRAFT', 'SUBMITTED', 'LEVEL1_APPROVED'] } },
      }),
    ]);

    const approvedBudgets = await this.prisma.budget.aggregate({
      where: { ...where, status: BudgetStatus.APPROVED },
      _sum: { totalBudget: true },
    });

    const statusMap = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const totalAmt = toNumber(totalAmount._sum.totalBudget);
    const approvedAmt = toNumber(approvedBudgets._sum.totalBudget);
    const pendingApprovals = (statusMap['SUBMITTED'] || 0) + (statusMap['LEVEL1_APPROVED'] || 0);
    const utilization = totalAmt > 0 ? Math.round((approvedAmt / totalAmt) * 100) : 0;

    return {
      totalBudgets: total,
      totalAmount: totalAmt,
      approvedAmount: approvedAmt,
      utilization,
      brandCount,
      categoryCount,
      pendingApprovals,
      activePlans: planCount + proposalCount,
      byStatus: statusMap,
    };
  }
}
