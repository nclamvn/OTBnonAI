import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PlanningStatus, ApprovalAction, Prisma } from '@prisma/client';
import { CreatePlanningDto, UpdatePlanningDto, UpdateDetailDto, ApprovalDecisionDto } from './dto/planning.dto';

interface PlanningFilters {
  budgetDetailId?: string;
  budgetId?: string;
  status?: PlanningStatus;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class PlanningService {
  constructor(private prisma: PrismaService, private auditLog: AuditLogService) {}

  // ─── LIST ────────────────────────────────────────────────────────────────

  async findAll(filters: PlanningFilters, user?: { brandAccess?: string[]; permissions?: string[] }) {
    const { budgetDetailId, budgetId, status } = filters;

    // Ensure proper number conversion with defaults
    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.pageSize) || 20;

    const where: Prisma.PlanningVersionWhereInput = {};
    if (budgetDetailId) where.budgetDetailId = budgetDetailId;
    if (budgetId) {
      where.budgetDetail = { budgetId };
    }
    if (status) where.status = status;

    // SEC-04: Data scoping by brandAccess
    if (user?.brandAccess?.length && !user.permissions?.includes('*')) {
      where.budgetDetail = {
        ...where.budgetDetail as any,
        budget: { groupBrandId: { in: user.brandAccess } },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.planningVersion.findMany({
        where,
        include: {
          budgetDetail: {
            include: {
              store: true,
              budget: { include: { groupBrand: true } },
            },
          },
          createdBy: { select: { id: true, name: true, /* email removed SEC-09 */ } },
          _count: { select: { details: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ budgetDetailId: 'asc' }, { versionNumber: 'desc' }],
      }),
      this.prisma.planningVersion.count({ where }),
    ]);

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ─── GET ONE ─────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const planning = await this.prisma.planningVersion.findUnique({
      where: { id },
      include: {
        budgetDetail: {
          include: {
            store: true,
            budget: { include: { groupBrand: true } },
          },
        },
        createdBy: { select: { id: true, name: true, /* email removed SEC-09 */ } },
        details: {
          include: {
            seasonType: true,
            gender: true,
            category: true,
            subCategory: true,
          },
          orderBy: [
            { dimensionType: 'asc' },
            { seasonTypeId: 'asc' },
            { genderId: 'asc' },
            { categoryId: 'asc' },
          ],
        },
      },
    });

    if (!planning) throw new NotFoundException('Planning version not found');

    // Query approvals separately
    const approvals = await this.prisma.approval.findMany({
      where: { entityType: 'planning', entityId: id },
      include: { decider: { select: { id: true, name: true } } },
      orderBy: { decidedAt: 'desc' },
    });

    return { ...planning, approvals };
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────

  async create(dto: CreatePlanningDto, userId: string) {
    // Validate budget detail exists and budget is approved
    const budgetDetail = await this.prisma.budgetDetail.findUnique({
      where: { id: dto.budgetDetailId },
      include: { budget: true, store: true },
    });

    if (!budgetDetail) {
      throw new BadRequestException('Budget detail not found');
    }

    // R-PLN-01: Budget must be approved before planning
    if (budgetDetail.budget.status !== 'APPROVED') {
      throw new BadRequestException('Cannot create planning for non-approved budget');
    }

    // Get next version number
    const lastVersion = await this.prisma.planningVersion.findFirst({
      where: { budgetDetailId: dto.budgetDetailId },
      orderBy: { versionNumber: 'desc' },
    });
    const versionNumber = (lastVersion?.versionNumber || 0) + 1;

    // Generate planning code
    const planningCode = `PLN-${budgetDetail.budget.budgetCode}-${budgetDetail.store.code}-V${versionNumber}`;

    // R-PLN-02: Calculate OTB values based on budget and percentages
    const budgetAmount = Number(budgetDetail.budgetAmount);
    // VAL-04: variancePct = absolute difference between user buy % and reference buy %
    // Positive = user allocated more than reference; Negative = less than reference
    const detailsWithOtb = dto.details.map(d => ({
      ...d,
      otbValue: budgetAmount * d.userBuyPct,
      variancePct: d.userBuyPct - d.systemBuyPct,
    }));

    // VAL-02: Service-level percentage range validation (supplements DTO @Min/@Max)
    for (const d of dto.details) {
      if (d.userBuyPct < 0 || d.userBuyPct > 1) {
        throw new BadRequestException(`userBuyPct must be between 0 and 1. Got: ${d.userBuyPct}`);
      }
      if (d.systemBuyPct < 0 || d.systemBuyPct > 1) {
        throw new BadRequestException(`systemBuyPct must be between 0 and 1. Got: ${d.systemBuyPct}`);
      }
      if (d.lastSeasonPct < 0 || d.lastSeasonPct > 1) {
        throw new BadRequestException(`lastSeasonPct must be between 0 and 1. Got: ${d.lastSeasonPct}`);
      }
    }

    // R-PLN-03: Total userBuyPct should equal 1 (100%)
    const totalPct = dto.details.reduce((sum, d) => sum + d.userBuyPct, 0);
    if (Math.abs(totalPct - 1) > 0.001) {
      throw new BadRequestException(`Total allocation percentage must equal 100%. Current: ${(totalPct * 100).toFixed(2)}%`);
    }

    const result = await this.prisma.planningVersion.create({
      data: {
        planningCode,
        budgetDetailId: dto.budgetDetailId,
        versionNumber,
        versionName: dto.versionName || `Version ${versionNumber}`,
        createdById: userId,
        details: {
          create: detailsWithOtb.map(d => ({
            dimensionType: d.dimensionType,
            seasonTypeId: d.seasonTypeId,
            genderId: d.genderId,
            categoryId: d.categoryId,
            subCategoryId: d.subCategoryId,
            lastSeasonSales: d.lastSeasonSales,
            lastSeasonPct: d.lastSeasonPct,
            systemBuyPct: d.systemBuyPct,
            userBuyPct: d.userBuyPct,
            otbValue: d.otbValue,
            variancePct: d.variancePct,
            userComment: d.userComment,
          })),
        },
      },
      include: {
        budgetDetail: { include: { store: true, budget: true } },
        details: true,
      },
    });

    this.auditLog.log({ userId, entityType: 'planning', entityId: result.id, action: 'create', changes: { planningCode, budgetDetailId: dto.budgetDetailId, versionNumber, versionName: dto.versionName || `Version ${versionNumber}`, detailCount: detailsWithOtb.length } });

    return result;
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdatePlanningDto, userId: string) {
    const planning = await this.prisma.planningVersion.findUnique({
      where: { id },
      include: { budgetDetail: true },
    });

    if (!planning) throw new NotFoundException('Planning version not found');

    // R-PLN-04: Only DRAFT can be edited
    if (planning.status !== PlanningStatus.DRAFT) {
      throw new ForbiddenException('Only draft planning versions can be edited');
    }

    const updateData: any = {};
    if (dto.versionName) updateData.versionName = dto.versionName;

    if (dto.details) {
      // R-PLN-03: Validate total percentage
      const totalPct = dto.details.reduce((sum, d) => sum + d.userBuyPct, 0);
      if (Math.abs(totalPct - 1) > 0.001) {
        throw new BadRequestException(`Total allocation percentage must equal 100%. Current: ${(totalPct * 100).toFixed(2)}%`);
      }

      const budgetAmount = Number(planning.budgetDetail.budgetAmount);

      // Delete and recreate details
      await this.prisma.planningDetail.deleteMany({ where: { planningVersionId: id } });
      await this.prisma.planningDetail.createMany({
        data: dto.details.map(d => ({
          planningVersionId: id,
          dimensionType: d.dimensionType,
          seasonTypeId: d.seasonTypeId,
          genderId: d.genderId,
          categoryId: d.categoryId,
          subCategoryId: d.subCategoryId,
          lastSeasonSales: d.lastSeasonSales,
          lastSeasonPct: d.lastSeasonPct,
          systemBuyPct: d.systemBuyPct,
          userBuyPct: d.userBuyPct,
          otbValue: budgetAmount * d.userBuyPct,
          variancePct: d.userBuyPct - d.systemBuyPct,
          userComment: d.userComment,
        })),
      });
    }

    const result = await this.prisma.planningVersion.update({
      where: { id },
      data: updateData,
      include: {
        budgetDetail: { include: { store: true, budget: true } },
        details: true,
      },
    });

    this.auditLog.log({ userId, entityType: 'planning', entityId: id, action: 'update', changes: { versionName: dto.versionName, detailCount: dto.details?.length } });

    return result;
  }

  // ─── UPDATE SINGLE DETAIL ────────────────────────────────────────────────

  async updateDetail(planningId: string, detailId: string, dto: UpdateDetailDto, userId: string) {
    const planning = await this.prisma.planningVersion.findUnique({
      where: { id: planningId },
      include: { budgetDetail: true, details: true },
    });

    if (!planning) throw new NotFoundException('Planning version not found');

    if (planning.status !== PlanningStatus.DRAFT) {
      throw new ForbiddenException('Only draft planning versions can be edited');
    }

    const detail = planning.details.find(d => d.id === detailId);
    if (!detail) throw new NotFoundException('Planning detail not found');

    // Calculate new totals
    const otherDetails = planning.details.filter(d => d.id !== detailId);
    const otherTotal = otherDetails.reduce((sum, d) => sum + Number(d.userBuyPct), 0);
    const newTotal = otherTotal + dto.userBuyPct;

    if (Math.abs(newTotal - 1) > 0.001) {
      throw new BadRequestException(
        `Total allocation would be ${(newTotal * 100).toFixed(2)}%. Remaining available: ${((1 - otherTotal) * 100).toFixed(2)}%`
      );
    }

    const budgetAmount = Number(planning.budgetDetail.budgetAmount);

    // BIZ-09: Wrap in transaction to prevent concurrent allocation race condition
    const result = await this.prisma.$transaction(async (tx) => {
      // Re-read detail inside transaction for consistency
      const currentDetail = await tx.planningDetail.findUnique({ where: { id: detailId } });
      if (!currentDetail) throw new NotFoundException('Planning detail not found');

      return tx.planningDetail.update({
        where: { id: detailId },
        data: {
          userBuyPct: dto.userBuyPct,
          otbValue: budgetAmount * dto.userBuyPct,
          variancePct: dto.userBuyPct - Number(currentDetail.systemBuyPct),
          userComment: dto.userComment,
        },
      });
    });

    this.auditLog.log({ userId, entityType: 'planning', entityId: planningId, action: 'update_detail', changes: { detailId, userBuyPct: dto.userBuyPct, userComment: dto.userComment } });

    return result;
  }

  // ─── SUBMIT ──────────────────────────────────────────────────────────────

  async submit(id: string, userId: string) {
    const planning = await this.prisma.planningVersion.findUnique({
      where: { id },
      include: { details: true },
    });

    if (!planning) throw new NotFoundException('Planning version not found');

    if (planning.status !== PlanningStatus.DRAFT) {
      throw new BadRequestException(`Cannot submit planning with status: ${planning.status}`);
    }

    // R-PLN-05: Must have at least one detail
    if (planning.details.length === 0) {
      throw new BadRequestException('Planning must have at least one allocation detail');
    }

    // Snapshot the data on submit
    const snapshotData = {
      submittedAt: new Date().toISOString(),
      details: planning.details,
    };

    const result = await this.prisma.planningVersion.update({
      where: { id },
      data: {
        status: PlanningStatus.SUBMITTED,
        snapshotData,
      },
    });

    this.auditLog.log({ userId, entityType: 'planning', entityId: id, action: 'submit', changes: { previousStatus: planning.status, newStatus: PlanningStatus.SUBMITTED } });

    return result;
  }

  // ─── APPROVE LEVEL 1 ─────────────────────────────────────────────────────

  async approveLevel1(id: string, dto: ApprovalDecisionDto, userId: string) {
    const planning = await this.prisma.planningVersion.findUnique({ where: { id } });
    if (!planning) throw new NotFoundException('Planning version not found');

    if (planning.status !== PlanningStatus.SUBMITTED) {
      throw new BadRequestException(`Cannot approve planning with status: ${planning.status}`);
    }

    // BIZ-01: Prevent self-approval
    if (planning.createdById === userId) {
      throw new ForbiddenException('Cannot approve your own submission');
    }

    const newStatus = dto.action === 'APPROVED'
      ? PlanningStatus.LEVEL1_APPROVED
      : PlanningStatus.REJECTED;

    // BIZ-06: Atomic approval
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.planningVersion.findUnique({ where: { id } });
      if (current?.status !== PlanningStatus.SUBMITTED) {
        throw new BadRequestException('Planning already processed by another approver');
      }

      await tx.approval.create({
        data: {
          entityType: 'planning',
          entityId: id,
          level: 1,
          deciderId: userId,
          action: dto.action as ApprovalAction,
          comment: dto.comment,
        },
      });

      return tx.planningVersion.update({
        where: { id },
        data: { status: newStatus },
        include: { budgetDetail: { include: { store: true } } },
      });
    });

    this.auditLog.log({ userId, entityType: 'planning', entityId: id, action: dto.action === 'APPROVED' ? 'approve_l1' : 'reject_l1', changes: { previousStatus: PlanningStatus.SUBMITTED, newStatus, comment: dto.comment } });

    return result;
  }

  // ─── APPROVE LEVEL 2 ─────────────────────────────────────────────────────

  async approveLevel2(id: string, dto: ApprovalDecisionDto, userId: string) {
    const planning = await this.prisma.planningVersion.findUnique({ where: { id } });
    if (!planning) throw new NotFoundException('Planning version not found');

    if (planning.status !== PlanningStatus.LEVEL1_APPROVED) {
      throw new BadRequestException(`Cannot approve planning with status: ${planning.status}`);
    }

    // BIZ-01: Prevent self-approval
    if (planning.createdById === userId) {
      throw new ForbiddenException('Cannot approve your own submission');
    }

    const newStatus = dto.action === 'APPROVED'
      ? PlanningStatus.APPROVED
      : PlanningStatus.REJECTED;

    // BIZ-06: Atomic approval
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.planningVersion.findUnique({ where: { id } });
      if (current?.status !== PlanningStatus.LEVEL1_APPROVED) {
        throw new BadRequestException('Planning already processed by another approver');
      }

      await tx.approval.create({
        data: {
          entityType: 'planning',
          entityId: id,
          level: 2,
          deciderId: userId,
          action: dto.action as ApprovalAction,
          comment: dto.comment,
        },
      });

      return tx.planningVersion.update({
        where: { id },
        data: { status: newStatus },
        include: { budgetDetail: { include: { store: true } } },
      });
    });

    this.auditLog.log({ userId, entityType: 'planning', entityId: id, action: dto.action === 'APPROVED' ? 'approve_l2' : 'reject_l2', changes: { previousStatus: PlanningStatus.LEVEL1_APPROVED, newStatus, comment: dto.comment } });

    return result;
  }

  // ─── RESET TO DRAFT ────────────────────────────────────────────────────

  async resetToDraft(id: string, userId: string) {
    const planning = await this.prisma.planningVersion.findUnique({ where: { id } });
    if (!planning) throw new NotFoundException('Planning version not found');

    if (planning.status !== PlanningStatus.REJECTED) {
      throw new BadRequestException(`Only REJECTED planning can be reset. Current status: ${planning.status}`);
    }

    await this.prisma.approval.create({
      data: {
        entityType: 'planning',
        entityId: id,
        level: 0,
        deciderId: userId,
        action: 'APPROVED' as ApprovalAction,
        comment: 'Reset to DRAFT for revision',
      },
    });

    const result = await this.prisma.planningVersion.update({
      where: { id },
      data: { status: PlanningStatus.DRAFT },
      include: { budgetDetail: { include: { store: true } } },
    });

    this.auditLog.log({ userId, entityType: 'planning', entityId: id, action: 'reset_to_draft', changes: { previousStatus: PlanningStatus.REJECTED, newStatus: PlanningStatus.DRAFT } });

    return result;
  }

  // ─── MARK AS FINAL ───────────────────────────────────────────────────────

  async markAsFinal(id: string, userId: string) {
    const planning = await this.prisma.planningVersion.findUnique({
      where: { id },
      include: { budgetDetail: true },
    });

    if (!planning) throw new NotFoundException('Planning version not found');

    // R-PLN-06: Only APPROVED can be marked final
    if (planning.status !== PlanningStatus.APPROVED) {
      throw new BadRequestException('Only approved planning versions can be marked as final');
    }

    // Unmark other final versions for the same budget detail
    await this.prisma.planningVersion.updateMany({
      where: {
        budgetDetailId: planning.budgetDetailId,
        isFinal: true,
      },
      data: { isFinal: false },
    });

    const result = await this.prisma.planningVersion.update({
      where: { id },
      data: { isFinal: true },
      include: { budgetDetail: { include: { store: true } } },
    });

    this.auditLog.log({ userId, entityType: 'planning', entityId: id, action: 'mark_final', changes: { budgetDetailId: planning.budgetDetailId } });

    return result;
  }

  // ─── CREATE NEW VERSION FROM EXISTING ────────────────────────────────────

  async createFromVersion(sourceId: string, userId: string) {
    const source = await this.prisma.planningVersion.findUnique({
      where: { id: sourceId },
      include: { details: true, budgetDetail: { include: { store: true, budget: true } } },
    });

    if (!source) throw new NotFoundException('Source planning version not found');

    // Get next version number
    const lastVersion = await this.prisma.planningVersion.findFirst({
      where: { budgetDetailId: source.budgetDetailId },
      orderBy: { versionNumber: 'desc' },
    });
    const versionNumber = (lastVersion?.versionNumber || 0) + 1;

    const planningCode = `PLN-${source.budgetDetail.budget.budgetCode}-${source.budgetDetail.store.code}-V${versionNumber}`;

    const result = await this.prisma.planningVersion.create({
      data: {
        planningCode,
        budgetDetailId: source.budgetDetailId,
        versionNumber,
        versionName: `Version ${versionNumber} (copy from V${source.versionNumber})`,
        createdById: userId,
        details: {
          create: source.details.map(d => ({
            dimensionType: d.dimensionType,
            seasonTypeId: d.seasonTypeId,
            genderId: d.genderId,
            categoryId: d.categoryId,
            subCategoryId: d.subCategoryId,
            lastSeasonSales: d.lastSeasonSales,
            lastSeasonPct: d.lastSeasonPct,
            systemBuyPct: d.systemBuyPct,
            userBuyPct: d.userBuyPct,
            otbValue: d.otbValue,
            variancePct: d.variancePct,
            userComment: d.userComment,
          })),
        },
      },
      include: {
        budgetDetail: { include: { store: true } },
        details: true,
      },
    });

    this.auditLog.log({ userId, entityType: 'planning', entityId: result.id, action: 'copy', changes: { sourceId, sourceVersion: source.versionNumber, newVersion: versionNumber, planningCode } });

    return result;
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────

  async remove(id: string, userId?: string) {
    const planning = await this.prisma.planningVersion.findUnique({
      where: { id },
      include: { proposals: true },
    });

    if (!planning) throw new NotFoundException('Planning version not found');

    if (planning.status !== PlanningStatus.DRAFT) {
      throw new ForbiddenException('Only draft planning versions can be deleted');
    }

    if (planning.proposals.length > 0) {
      throw new ForbiddenException('Cannot delete planning with linked proposals');
    }

    const result = await this.prisma.planningVersion.delete({ where: { id } });

    if (userId) this.auditLog.log({ userId, entityType: 'planning', entityId: id, action: 'delete', changes: { planningCode: planning.planningCode, versionNumber: planning.versionNumber } });

    return result;
  }
}
