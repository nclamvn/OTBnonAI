import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTicketDto } from './dto/ticket.dto';

interface TicketFilters {
  status?: string;
  budgetId?: string;
  seasonGroupId?: string;
  seasonId?: string;
  createdBy?: string;
  page?: number;
  pageSize?: number;
}

export interface ValidationStep {
  step: number;
  label: string;
  status: 'pass' | 'fail' | 'skipped';
  details: string[];
}

export interface ValidationResult {
  valid: boolean;
  steps: ValidationStep[];
}

@Injectable()
export class TicketService {
  constructor(private prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // VALIDATION — check budget readiness
  // ═══════════════════════════════════════════════════════════════════════════════

  async validateBudgetReadiness(budgetId: string): Promise<ValidationResult> {
    const steps: ValidationStep[] = [];

    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        allocateHeaders: {
          where: { isSnapshot: false },
          include: { groupBrand: true },
        },
      },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    // Derive distinct GroupBrands from allocate headers
    const brandMap = new Map<string, string>();
    for (const h of budget.allocateHeaders) {
      if (!brandMap.has(h.groupBrandId)) {
        brandMap.set(h.groupBrandId, h.groupBrand.name);
      }
    }
    const brandIds = [...brandMap.keys()];

    if (brandIds.length === 0) {
      return {
        valid: false,
        steps: [
          { step: 1, label: 'Budget Allocate Final for all Brands', status: 'fail', details: ['No Allocate Header found for this Budget'] },
          { step: 2, label: 'Planning Final for all Brands', status: 'skipped', details: ['Skipped: Step 1 not passed'] },
          { step: 3, label: 'Proposal Final for all Brands', status: 'skipped', details: ['Skipped: Step 1 not passed'] },
          { step: 4, label: 'Sizing complete for all Proposals', status: 'skipped', details: ['Skipped: Step 1 not passed'] },
        ],
      };
    }

    // Cache final AllocateHeader IDs per brand
    const finalAHMap = new Map<string, string>();

    // ──── STEP 1: Final AllocateHeader per brand ────────────────────────────────

    const step1Details: string[] = [];
    let step1Pass = true;

    for (const brandId of brandIds) {
      const finalAH = await this.prisma.allocateHeader.findFirst({
        where: {
          budgetId,
          groupBrandId: brandId,
          isFinalVersion: true,
          isSnapshot: false,
        },
      });
      if (!finalAH) {
        step1Pass = false;
        step1Details.push(`Brand "${brandMap.get(brandId)}" has no Final Allocate version`);
      } else {
        finalAHMap.set(brandId, finalAH.id);
      }
    }

    steps.push({
      step: 1,
      label: 'Budget Allocate Final for all Brands',
      status: step1Pass ? 'pass' : 'fail',
      details: step1Details,
    });

    if (!step1Pass) {
      steps.push(
        { step: 2, label: 'Planning Final for all Brands', status: 'skipped', details: ['Skipped: Step 1 not passed'] },
        { step: 3, label: 'Proposal Final for all Brands', status: 'skipped', details: ['Skipped: Step 1 not passed'] },
        { step: 4, label: 'Sizing complete for all Proposals', status: 'skipped', details: ['Skipped: Step 1 not passed'] },
      );
      return { valid: false, steps };
    }

    // ──── STEP 2: Final PlanningVersion per allocateHeader ────────────────────

    const step2Details: string[] = [];
    let step2Pass = true;

    for (const brandId of brandIds) {
      const allocateHeaderId = finalAHMap.get(brandId)!;
      const finalPV = await this.prisma.planningVersion.findFirst({
        where: {
          allocateHeaderId,
          status: 'APPROVED',
        },
      });
      if (!finalPV) {
        step2Pass = false;
        step2Details.push(`Brand "${brandMap.get(brandId)}" has no Final Planning version`);
      }
    }

    steps.push({
      step: 2,
      label: 'Planning Final for all Brands',
      status: step2Pass ? 'pass' : 'fail',
      details: step2Details,
    });

    if (!step2Pass) {
      steps.push(
        { step: 3, label: 'Proposal Final for all Brands', status: 'skipped', details: ['Skipped: Step 2 not passed'] },
        { step: 4, label: 'Sizing complete for all Proposals', status: 'skipped', details: ['Skipped: Step 2 not passed'] },
      );
      return { valid: false, steps };
    }

    // ──── STEP 3: Approved Proposal per allocateHeader ──────────────────────

    const step3Details: string[] = [];
    let step3Pass = true;
    const finalProposalMap = new Map<string, string>();

    for (const brandId of brandIds) {
      const allocateHeaderId = finalAHMap.get(brandId)!;
      const finalProposal = await this.prisma.proposal.findFirst({
        where: {
          allocateHeaderId,
          status: 'APPROVED',
        },
      });
      if (!finalProposal) {
        step3Pass = false;
        step3Details.push(`Brand "${brandMap.get(brandId)}" has no Approved Proposal`);
      } else {
        finalProposalMap.set(brandId, finalProposal.id);
      }
    }

    steps.push({
      step: 3,
      label: 'Proposal Final for all Brands',
      status: step3Pass ? 'pass' : 'fail',
      details: step3Details,
    });

    if (!step3Pass) {
      steps.push(
        { step: 4, label: 'Sizing complete for all Proposals', status: 'skipped', details: ['Skipped: Step 3 not passed'] },
      );
      return { valid: false, steps };
    }

    // ──── STEP 4: ProposalSizingHeaders exist per Proposal ──────────────

    const step4Details: string[] = [];
    let step4Pass = true;

    for (const brandId of brandIds) {
      const proposalId = finalProposalMap.get(brandId)!;
      const sizingCount = await this.prisma.proposalSizingHeader.count({
        where: { proposalId },
      });
      if (sizingCount === 0) {
        step4Pass = false;
        step4Details.push(`Brand "${brandMap.get(brandId)}" has no Sizing versions`);
      }
    }

    steps.push({
      step: 4,
      label: 'Sizing complete for all Proposals',
      status: step4Pass ? 'pass' : 'fail',
      details: step4Details,
    });

    return { valid: step1Pass && step2Pass && step3Pass && step4Pass, steps };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SNAPSHOT — duplicate Final AllocateHeaders as snapshot copies
  // ═══════════════════════════════════════════════════════════════════════════════

  private async createSnapshotCopy(
    tx: Prisma.TransactionClient,
    budgetId: string,
    ticketId: string,
    userId: string,
  ) {
    const finalHeaders = await tx.allocateHeader.findMany({
      where: {
        budgetId,
        isFinalVersion: true,
        isSnapshot: false,
      },
      include: {
        budgetAllocates: true,
      },
    });

    for (const ah of finalHeaders) {
      const newAH = await tx.allocateHeader.create({
        data: {
          budgetId: ah.budgetId,
          groupBrandId: ah.groupBrandId,
          version: ah.version,
          isFinalVersion: ah.isFinalVersion,
          isSnapshot: true,
          ticketId,
          createdById: userId,
        },
      });

      if (ah.budgetAllocates.length > 0) {
        await tx.budgetAllocate.createMany({
          data: ah.budgetAllocates.map(ba => ({
            allocateHeaderId: newAH.id,
            storeId: ba.storeId,
            seasonGroupId: ba.seasonGroupId,
            seasonId: ba.seasonId,
            budgetAmount: ba.budgetAmount,
          })),
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LIST TICKETS
  // ═══════════════════════════════════════════════════════════════════════════════

  async findAll(filters: TicketFilters) {
    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.pageSize) || 20;

    const where: Prisma.TicketWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.budgetId) where.budgetId = filters.budgetId;
    if (filters.seasonGroupId) where.seasonGroupId = filters.seasonGroupId;
    if (filters.seasonId) where.seasonId = filters.seasonId;
    if (filters.createdBy) where.createdById = filters.createdBy;

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          budget: {
            include: {
              allocateHeaders: {
                where: { isFinalVersion: true, isSnapshot: false },
                include: { groupBrand: true },
              },
            },
          },
          seasonGroup: true,
          season: true,
          creator: { select: { id: true, name: true, email: true } },
          ticketApprovalLogs: {
            include: {
              approverUser: { select: { id: true, name: true } },
              approvalWorkflowLevel: true,
            },
            orderBy: { createdAt: 'desc' as const },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' as const },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET ONE
  // ═══════════════════════════════════════════════════════════════════════════════

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        budget: true,
        seasonGroup: true,
        season: true,
        creator: { select: { id: true, name: true, email: true } },
        ticketApprovalLogs: {
          include: {
            approverUser: { select: { id: true, name: true, email: true } },
            approvalWorkflowLevel: true,
          },
          orderBy: { createdAt: 'asc' as const },
        },
        snapshotAllocateHeaders: {
          include: {
            groupBrand: true,
            budgetAllocates: {
              include: { store: true, seasonGroup: true, season: true },
            },
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CREATE TICKET
  // ═══════════════════════════════════════════════════════════════════════════════

  async create(dto: CreateTicketDto, userId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: dto.budgetId },
    });
    if (!budget) throw new BadRequestException('Budget not found');

    const seasonGroup = await this.prisma.seasonGroup.findUnique({
      where: { id: dto.seasonGroupId },
    });
    if (!seasonGroup) throw new BadRequestException('Season Group not found');

    const season = await this.prisma.season.findUnique({
      where: { id: dto.seasonId },
    });
    if (!season) throw new BadRequestException('Season not found');

    // Check for duplicate
    const existing = await this.prisma.ticket.findFirst({
      where: {
        budgetId: dto.budgetId,
        seasonGroupId: dto.seasonGroupId,
        seasonId: dto.seasonId,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Ticket already exists for this Budget + Season Group + Season combination',
      );
    }

    // Run validation
    const validation = await this.validateBudgetReadiness(dto.budgetId);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Budget is not ready for ticket creation',
        validation,
      });
    }

    // Create ticket + snapshot in transaction
    const ticket = await this.prisma.$transaction(async (tx) => {
      const newTicket = await tx.ticket.create({
        data: {
          budgetId: dto.budgetId,
          seasonGroupId: dto.seasonGroupId,
          seasonId: dto.seasonId,
          createdById: userId,
        },
      });

      await this.createSnapshotCopy(tx, dto.budgetId, newTicket.id, userId);

      return tx.ticket.findUnique({
        where: { id: newTicket.id },
        include: {
          budget: true,
          seasonGroup: true,
          season: true,
          creator: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return ticket;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // APPROVE / REJECT
  // ═══════════════════════════════════════════════════════════════════════════════

  async processApproval(
    ticketId: string,
    data: {
      approvalWorkflowLevelId: string;
      isApproved: boolean;
      comment?: string;
    },
    userId: string,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.status !== 'PENDING' && ticket.status !== 'IN_REVIEW') {
      throw new BadRequestException(`Cannot process ticket with status: ${ticket.status}`);
    }

    const level = await this.prisma.approvalWorkflowLevel.findUnique({
      where: { id: data.approvalWorkflowLevelId },
    });
    if (!level) throw new BadRequestException('Approval workflow level not found');

    if (level.approverUserId !== userId) {
      throw new BadRequestException('You are not the designated approver for this level');
    }

    const log = await this.prisma.ticketApprovalLog.create({
      data: {
        ticketId,
        approvalWorkflowLevelId: data.approvalWorkflowLevelId,
        approverUserId: userId,
        isApproved: data.isApproved,
        comment: data.comment,
        approvedAt: new Date(),
      },
      include: {
        approverUser: { select: { id: true, name: true } },
        approvalWorkflowLevel: true,
      },
    });

    let newStatus = ticket.status;
    if (!data.isApproved) {
      newStatus = 'REJECTED';
    } else {
      const workflow = await this.prisma.approvalWorkflow.findFirst({
        where: {
          levels: {
            some: { id: data.approvalWorkflowLevelId },
          },
        },
        include: {
          levels: {
            where: { isRequired: true },
            orderBy: { levelOrder: 'asc' },
          },
        },
      });

      if (workflow) {
        const allLogs = await this.prisma.ticketApprovalLog.findMany({
          where: { ticketId, isApproved: true },
        });
        const approvedLevelIds = new Set(allLogs.map(l => l.approvalWorkflowLevelId));
        const allRequiredApproved = workflow.levels.every(
          lvl => approvedLevelIds.has(lvl.id),
        );
        newStatus = allRequiredApproved ? 'APPROVED' : 'IN_REVIEW';
      } else {
        newStatus = 'APPROVED';
      }
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus },
    });

    return { log, newStatus };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // APPROVAL HISTORY
  // ═══════════════════════════════════════════════════════════════════════════════

  async getApprovalHistory(ticketId: string) {
    return this.prisma.ticketApprovalLog.findMany({
      where: { ticketId },
      include: {
        approverUser: { select: { id: true, name: true, email: true } },
        approvalWorkflowLevel: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════════════════════════════════════════

  async getStatistics() {
    const [total, byStatus] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, s) => {
          acc[s.status] = s._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
