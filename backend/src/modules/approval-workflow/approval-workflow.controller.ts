import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApprovalWorkflowService } from './approval-workflow.service';

@UseGuards(JwtAuthGuard)
@Controller('approval-workflow')
export class ApprovalWorkflowController {
  constructor(private service: ApprovalWorkflowService) {}

  @Get()
  async findAll(@Query('brandId') brandId?: string) {
    const data = await this.service.findAll(brandId);
    return { success: true, data };
  }

  @Get('roles')
  async getAvailableRoles() {
    const data = this.service.getAvailableRoles();
    return { success: true, data };
  }

  @Get('brand/:brandId')
  async findByBrand(@Param('brandId') brandId: string) {
    const data = await this.service.findByBrand(brandId);
    return { success: true, data };
  }

  @Post()
  async create(@Body() body: {
    brandId: string;
    stepNumber: number;
    roleName: string;
    roleCode?: string;
    userId?: string;
    description?: string;
  }) {
    const data = await this.service.create(body);
    return { success: true, data, message: 'Workflow step created' };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: {
    stepNumber?: number;
    roleName?: string;
    roleCode?: string;
    userId?: string;
    description?: string;
  }) {
    const data = await this.service.update(id, body);
    return { success: true, data, message: 'Workflow step updated' };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true, message: 'Workflow step deleted' };
  }

  @Post('brand/:brandId/reorder')
  async reorderSteps(@Param('brandId') brandId: string, @Body('stepIds') stepIds: string[]) {
    const data = await this.service.reorderSteps(brandId, stepIds);
    return { success: true, data };
  }
}
