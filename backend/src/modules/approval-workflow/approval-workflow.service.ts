import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApprovalWorkflowService {
  constructor(private prisma: PrismaService) {}

  // ─── LIST ALL WORKFLOWS ────────────────────────────────────────────────────

  async findAll(groupBrandId?: string) {
    const where: any = {};
    if (groupBrandId) where.group_brand_id = BigInt(groupBrandId);

    return this.prisma.approvalWorkflow.findMany({
      where,
      include: {
        group_brand: true,
        approval_workflow_levels: {
          include: {
            approver_user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { level_order: 'asc' },
        },
      },
      orderBy: { workflow_name: 'asc' },
    });
  }

  // ─── GET ONE WORKFLOW ──────────────────────────────────────────────────────

  async findOne(id: string | number) {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id: BigInt(id) },
      include: {
        group_brand: true,
        approval_workflow_levels: {
          include: {
            approver_user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { level_order: 'asc' },
        },
      },
    });

    if (!workflow) throw new NotFoundException('Approval workflow not found');
    return workflow;
  }

  // ─── GET WORKFLOWS BY GROUP BRAND ──────────────────────────────────────────

  async findByGroupBrand(groupBrandId: string) {
    return this.prisma.approvalWorkflow.findMany({
      where: { group_brand_id: BigInt(groupBrandId) },
      include: {
        group_brand: true,
        approval_workflow_levels: {
          include: {
            approver_user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { level_order: 'asc' },
        },
      },
    });
  }

  // ─── CREATE WORKFLOW ───────────────────────────────────────────────────────

  async create(data: {
    groupBrandId: string;
    workflowName: string;
    levels?: Array<{
      levelOrder: number;
      levelName: string;
      approverUserId: string;
      isRequired: boolean;
    }>;
  }) {
    const groupBrand = await this.prisma.groupBrand.findUnique({
      where: { id: BigInt(data.groupBrandId) },
    });
    if (!groupBrand) throw new NotFoundException('Group brand not found');

    return this.prisma.approvalWorkflow.create({
      data: {
        group_brand_id: BigInt(data.groupBrandId),
        workflow_name: data.workflowName,
        approval_workflow_levels: data.levels ? {
          create: data.levels.map(level => ({
            level_order: level.levelOrder,
            level_name: level.levelName,
            approver_user_id: BigInt(level.approverUserId),
            is_required: level.isRequired,
          })),
        } : undefined,
      },
      include: {
        group_brand: true,
        approval_workflow_levels: {
          include: {
            approver_user: { select: { id: true, name: true } },
          },
          orderBy: { level_order: 'asc' },
        },
      },
    });
  }

  // ─── ADD LEVEL TO WORKFLOW ─────────────────────────────────────────────────

  async addLevel(workflowId: string, data: {
    levelOrder: number;
    levelName: string;
    approverUserId: string;
    isRequired: boolean;
  }) {
    const workflow = await this.prisma.approvalWorkflow.findUnique({ where: { id: BigInt(workflowId) } });
    if (!workflow) throw new NotFoundException('Workflow not found');

    const user = await this.prisma.user.findUnique({ where: { id: BigInt(data.approverUserId) } });
    if (!user) throw new BadRequestException('Approver user not found');

    return this.prisma.approvalWorkflowLevel.create({
      data: {
        approval_workflow_id: BigInt(workflowId),
        level_order: data.levelOrder,
        level_name: data.levelName,
        approver_user_id: BigInt(data.approverUserId),
        is_required: data.isRequired,
      },
      include: {
        approver_user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ─── UPDATE LEVEL ──────────────────────────────────────────────────────────

  async updateLevel(levelId: string, data: {
    levelOrder?: number;
    levelName?: string;
    approverUserId?: string;
    isRequired?: boolean;
  }) {
    const level = await this.prisma.approvalWorkflowLevel.findUnique({ where: { id: BigInt(levelId) } });
    if (!level) throw new NotFoundException('Workflow level not found');

    const updateData: any = {};
    if (data.levelOrder !== undefined) updateData.level_order = data.levelOrder;
    if (data.levelName !== undefined) updateData.level_name = data.levelName;
    if (data.approverUserId !== undefined) updateData.approver_user_id = BigInt(data.approverUserId);
    if (data.isRequired !== undefined) updateData.is_required = data.isRequired;

    return this.prisma.approvalWorkflowLevel.update({
      where: { id: BigInt(levelId) },
      data: updateData,
      include: {
        approver_user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ─── REMOVE LEVEL ─────────────────────────────────────────────────────────

  async removeLevel(levelId: string) {
    const level = await this.prisma.approvalWorkflowLevel.findUnique({ where: { id: BigInt(levelId) } });
    if (!level) throw new NotFoundException('Workflow level not found');

    await this.prisma.approvalWorkflowLevel.delete({ where: { id: BigInt(levelId) } });
    return { message: 'Level removed' };
  }

  // ─── DELETE WORKFLOW ───────────────────────────────────────────────────────

  async remove(id: string) {
    const workflow = await this.prisma.approvalWorkflow.findUnique({ where: { id: BigInt(id) } });
    if (!workflow) throw new NotFoundException('Workflow not found');

    await this.prisma.approvalWorkflow.delete({ where: { id: BigInt(id) } });
    return { message: 'Workflow deleted' };
  }

  // ─── REORDER LEVELS ───────────────────────────────────────────────────────

  async reorderLevels(workflowId: string, levelIds: string[]) {
    const updates = levelIds.map((id, index) =>
      this.prisma.approvalWorkflowLevel.update({
        where: { id: BigInt(id) },
        data: { level_order: index + 1 },
      }),
    );
    await this.prisma.$transaction(updates);
    return this.findOne(workflowId);
  }
}
