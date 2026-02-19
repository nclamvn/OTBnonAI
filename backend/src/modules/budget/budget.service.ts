import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BudgetStatus, ApprovalAction, Prisma } from '@prisma/client';
import { CreateBudgetDto, UpdateBudgetDto, ApprovalDecisionDto } from './dto/budget.dto';

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
  constructor(private prisma: PrismaService) {}

  // ─── LIST ──────────────────────────────────────────────────────────────

  async findAll(filters: BudgetFilters, user?: { brandAccess?: string[]; permissions?: string[] }) {
    const { fiscalYear, groupBrandId, seasonGroupId, status, page = 1, pageSize = 20 } = filters;

    const where: Prisma.BudgetWhereInput = {};
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
          createdBy: { select: { id: true, name: true, email: true } },
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
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        groupBrand: true,
        details: { include: { store: true } },
        createdBy: { select: { id: true, name: true, email: true } },
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

    // R-BUD-01: Calculate total
    const totalBudget = validDetails.reduce((sum, d) => sum + d.budgetAmount, 0);

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

    return this.prisma.budget.create({
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
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateBudgetDto, userId: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');

    // R-BUD-04: Only DRAFT can be edited
    if (budget.status !== BudgetStatus.DRAFT) {
      throw new ForbiddenException('Only draft budgets can be edited');
    }

    const updateData: any = {};
    if (dto.comment !== undefined) updateData.comment = dto.comment;

    if (dto.details) {
      // R-BUD-02: Validate
      const validDetails = dto.details.filter(d => d.budgetAmount > 0);
      if (validDetails.length === 0) {
        throw new BadRequestException('At least one store must have a budget amount > 0');
      }

      // R-BUD-01: Recalculate total
      updateData.totalBudget = dto.details.reduce((sum, d) => sum + d.budgetAmount, 0);

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

    return this.prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        groupBrand: true,
        details: { include: { store: true } },
      },
    });
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

    return this.prisma.budget.update({
      where: { id },
      data: { status: BudgetStatus.SUBMITTED },
    });
  }

  // ─── DELETE ────────────────────────────────────────────────────────────

  async remove(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
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

    return this.prisma.budget.delete({ where: { id } });
  }

  // ─── APPROVE LEVEL 1 ────────────────────────────────────────────────────

  async approveLevel1(id: string, dto: ApprovalDecisionDto, userId: string) {
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

    const newStatus = dto.action === 'APPROVED'
      ? BudgetStatus.LEVEL1_APPROVED
      : BudgetStatus.REJECTED;

    // BIZ-06: Atomic approval — transaction prevents race condition
    return this.prisma.$transaction(async (tx) => {
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
  }

  // ─── APPROVE LEVEL 2 ────────────────────────────────────────────────────

  async approveLevel2(id: string, dto: ApprovalDecisionDto, userId: string) {
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

    const newStatus = dto.action === 'APPROVED'
      ? BudgetStatus.APPROVED
      : BudgetStatus.REJECTED;

    // BIZ-06: Atomic approval
    return this.prisma.$transaction(async (tx) => {
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

    return this.prisma.budget.update({
      where: { id },
      data: { status: BudgetStatus.DRAFT },
      include: {
        groupBrand: true,
        details: { include: { store: true } },
      },
    });
  }

  // ─── STATISTICS ─────────────────────────────────────────────────────────

  async getStatistics(fiscalYear?: number) {
    const where: Prisma.BudgetWhereInput = {};
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

    const totalAmt = Number(totalAmount._sum.totalBudget || 0);
    const approvedAmt = Number(approvedBudgets._sum.totalBudget || 0);
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
