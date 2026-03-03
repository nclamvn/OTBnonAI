import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ApprovalWorkflowService } from './approval-workflow.service';

@ApiTags('approval-workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('approval-workflow')
export class ApprovalWorkflowController {
  constructor(private service: ApprovalWorkflowService) {}

  @Get()
  @RequirePermissions('approval:read')
  @ApiOperation({ summary: 'List all approval workflows' })
  @ApiQuery({ name: 'groupBrandId', required: false })
  async findAll(@Query('groupBrandId') groupBrandId?: string) {
    return { success: true, data: await this.service.findAll(groupBrandId) };
  }

  @Get(':id')
  @RequirePermissions('approval:read')
  @ApiOperation({ summary: 'Get workflow by ID with levels' })
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.service.findOne(id) };
  }

  @Get('group-brand/:groupBrandId')
  @RequirePermissions('approval:read')
  @ApiOperation({ summary: 'Get workflows for a group brand' })
  async findByGroupBrand(@Param('groupBrandId') groupBrandId: string) {
    return { success: true, data: await this.service.findByGroupBrand(groupBrandId) };
  }

  @Post()
  @RequirePermissions('approval:write')
  @ApiOperation({ summary: 'Create a new approval workflow' })
  async create(@Body() body: {
    groupBrandId: string;
    workflowName: string;
    levels?: Array<{
      levelOrder: number;
      levelName: string;
      approverUserId: string;
      isRequired: boolean;
    }>;
  }) {
    return { success: true, data: await this.service.create(body) };
  }

  @Post(':id/levels')
  @RequirePermissions('approval:write')
  @ApiOperation({ summary: 'Add a level to a workflow' })
  async addLevel(@Param('id') id: string, @Body() body: {
    levelOrder: number;
    levelName: string;
    approverUserId: string;
    isRequired: boolean;
  }) {
    return { success: true, data: await this.service.addLevel(id, body) };
  }

  @Patch('levels/:levelId')
  @RequirePermissions('approval:write')
  @ApiOperation({ summary: 'Update a workflow level' })
  async updateLevel(@Param('levelId') levelId: string, @Body() body: {
    levelOrder?: number;
    levelName?: string;
    approverUserId?: string;
    isRequired?: boolean;
  }) {
    return { success: true, data: await this.service.updateLevel(levelId, body) };
  }

  @Delete('levels/:levelId')
  @RequirePermissions('approval:write')
  @ApiOperation({ summary: 'Remove a workflow level' })
  async removeLevel(@Param('levelId') levelId: string) {
    return { success: true, ...(await this.service.removeLevel(levelId)) };
  }

  @Delete(':id')
  @RequirePermissions('approval:write')
  @ApiOperation({ summary: 'Delete a workflow' })
  async remove(@Param('id') id: string) {
    return { success: true, ...(await this.service.remove(id)) };
  }

  @Post(':id/reorder')
  @RequirePermissions('approval:write')
  @ApiOperation({ summary: 'Reorder workflow levels' })
  async reorderLevels(@Param('id') id: string, @Body('levelIds') levelIds: string[]) {
    return { success: true, data: await this.service.reorderLevels(id, levelIds) };
  }
}
