import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PlanningService } from './planning.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { CreatePlanningDto, UpdatePlanningDto, UpdateDetailDto, ApprovalDecisionDto } from './dto/planning.dto';

@ApiTags('planning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('planning')
export class PlanningController {
  constructor(private planningService: PlanningService) {}

  // ─── LIST ────────────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('planning:read')
  @ApiOperation({ summary: 'List planning versions with filters' })
  @ApiQuery({ name: 'budgetDetailId', required: false })
  @ApiQuery({ name: 'budgetId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED', 'LEVEL1_APPROVED', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @Query('budgetDetailId') budgetDetailId?: string,
    @Query('budgetId') budgetId?: string,
    @Query('status') status?: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.planningService.findAll({
      budgetDetailId, budgetId, status, page, pageSize,
    });
    return { success: true, ...result };
  }

  // ─── GET ONE ─────────────────────────────────────────────────────────────

  @Get(':id')
  @RequirePermissions('planning:read')
  @ApiOperation({ summary: 'Get planning version with details and approvals' })
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.planningService.findOne(id) };
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────

  @Post()
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Create new planning version for a budget detail' })
  @ApiBody({ type: CreatePlanningDto })
  async create(@Body() dto: CreatePlanningDto, @Request() req: any) {
    return { success: true, data: await this.planningService.create(dto, req.user.sub) };
  }

  // ─── CREATE FROM EXISTING VERSION ────────────────────────────────────────

  @Post(':id/copy')
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Create new version by copying an existing one' })
  async createFromVersion(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.planningService.createFromVersion(id, req.user.sub) };
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  @Put(':id')
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Update draft planning version' })
  @ApiBody({ type: UpdatePlanningDto })
  async update(@Param('id') id: string, @Body() dto: UpdatePlanningDto, @Request() req: any) {
    return { success: true, data: await this.planningService.update(id, dto, req.user.sub) };
  }

  // ─── UPDATE SINGLE DETAIL ────────────────────────────────────────────────

  @Patch(':id/details/:detailId')
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Update a single planning detail (userBuyPct)' })
  @ApiBody({ type: UpdateDetailDto })
  async updateDetail(
    @Param('id') id: string,
    @Param('detailId') detailId: string,
    @Body() dto: UpdateDetailDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.planningService.updateDetail(id, detailId, dto, req.user.sub) };
  }

  // ─── SUBMIT ──────────────────────────────────────────────────────────────

  @Post(':id/submit')
  @RequirePermissions('planning:submit')
  @ApiOperation({ summary: 'Submit planning for approval (DRAFT → SUBMITTED)' })
  async submit(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.planningService.submit(id, req.user.sub) };
  }

  // ─── APPROVE LEVEL 1 ─────────────────────────────────────────────────────

  @Post(':id/approve/level1')
  @RequirePermissions('planning:approve_l1')
  @ApiOperation({ summary: 'Level 1 approval (SUBMITTED → LEVEL1_APPROVED)' })
  @ApiBody({ type: ApprovalDecisionDto })
  async approveLevel1(
    @Param('id') id: string,
    @Body() dto: ApprovalDecisionDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.planningService.approveLevel1(id, dto, req.user.sub) };
  }

  // ─── APPROVE LEVEL 2 ─────────────────────────────────────────────────────

  @Post(':id/approve/level2')
  @RequirePermissions('planning:approve_l2')
  @ApiOperation({ summary: 'Level 2 approval (LEVEL1_APPROVED → APPROVED)' })
  @ApiBody({ type: ApprovalDecisionDto })
  async approveLevel2(
    @Param('id') id: string,
    @Body() dto: ApprovalDecisionDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.planningService.approveLevel2(id, dto, req.user.sub) };
  }

  // ─── MARK AS FINAL ───────────────────────────────────────────────────────

  @Post(':id/final')
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Mark approved planning as final version' })
  async markAsFinal(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.planningService.markAsFinal(id, req.user.sub) };
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────

  @Delete(':id')
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Delete draft planning (no linked proposals)' })
  async remove(@Param('id') id: string) {
    await this.planningService.remove(id);
    return { success: true, message: 'Planning version deleted' };
  }
}
