import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApprovalWorkflowService {
  constructor(private prisma: PrismaService) {}

  async findAll(brandId?: string) {
    const where: any = { isActive: true };
    if (brandId) where.brandId = brandId;

    return this.prisma.approvalWorkflowStep.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ brandId: 'asc' }, { stepNumber: 'asc' }],
    });
  }

  async findByBrand(brandId: string) {
    return this.prisma.approvalWorkflowStep.findMany({
      where: { brandId, isActive: true },
      include: {
        brand: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { stepNumber: 'asc' },
    });
  }

  async create(data: {
    brandId: string;
    stepNumber: number;
    roleName: string;
    roleCode?: string;
    userId?: string;
    description?: string;
  }) {
    const brand = await this.prisma.groupBrand.findUnique({
      where: { id: data.brandId },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    const existing = await this.prisma.approvalWorkflowStep.findUnique({
      where: { brandId_stepNumber: { brandId: data.brandId, stepNumber: data.stepNumber } },
    });
    if (existing) {
      throw new BadRequestException(`Step ${data.stepNumber} already exists for this brand`);
    }

    return this.prisma.approvalWorkflowStep.create({
      data,
      include: {
        brand: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: {
    stepNumber?: number;
    roleName?: string;
    roleCode?: string;
    userId?: string;
    description?: string;
  }) {
    const step = await this.prisma.approvalWorkflowStep.findUnique({ where: { id } });
    if (!step) throw new NotFoundException('Workflow step not found');

    if (data.stepNumber && data.stepNumber !== step.stepNumber) {
      const existing = await this.prisma.approvalWorkflowStep.findUnique({
        where: { brandId_stepNumber: { brandId: step.brandId, stepNumber: data.stepNumber } },
      });
      if (existing) {
        throw new BadRequestException(`Step ${data.stepNumber} already exists for this brand`);
      }
    }

    return this.prisma.approvalWorkflowStep.update({
      where: { id },
      data,
      include: {
        brand: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    const step = await this.prisma.approvalWorkflowStep.findUnique({ where: { id } });
    if (!step) throw new NotFoundException('Workflow step not found');

    return this.prisma.approvalWorkflowStep.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reorderSteps(brandId: string, stepIds: string[]) {
    const updates = stepIds.map((id, index) =>
      this.prisma.approvalWorkflowStep.update({
        where: { id },
        data: { stepNumber: index + 1 },
      })
    );
    await this.prisma.$transaction(updates);
    return this.findByBrand(brandId);
  }

  getAvailableRoles() {
    return [
      { code: 'BRAND_MANAGER', name: 'Brand Manager' },
      { code: 'GROUP_HEAD', name: 'Group Head' },
      { code: 'FINANCE', name: 'Finance Lead' },
      { code: 'CEO', name: 'CEO' },
      { code: 'ADMIN', name: 'Admin' },
    ];
  }
}
