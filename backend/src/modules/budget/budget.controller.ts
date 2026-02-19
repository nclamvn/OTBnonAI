import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { CreateBudgetDto, UpdateBudgetDto, ApprovalDecisionDto } from './dto/budget.dto';

@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('budgets')
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  // ─── LIST ────────────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'List budgets with filters and pagination' })
  @ApiQuery({ name: 'fiscalYear', required: false, type: Number, example: 2025 })
  @ApiQuery({ name: 'groupBrandId', required: false })
  @ApiQuery({ name: 'seasonGroupId', required: false, enum: ['SS', 'FW'] })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED', 'LEVEL1_APPROVED', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  async findAll(
    @Request() req: any,
    @Query('fiscalYear') fiscalYear?: number,
    @Query('groupBrandId') groupBrandId?: string,
    @Query('seasonGroupId') seasonGroupId?: string,
    @Query('status') status?: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.budgetService.findAll({
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      groupBrandId,
      seasonGroupId,
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    }, req.user);
    return { success: true, ...result };
  }

  // ─── STATISTICS ──────────────────────────────────────────────────────────

  @Get('statistics')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get budget statistics (total, by status, amounts)' })
  @ApiQuery({ name: 'fiscalYear', required: false, type: Number })
  async getStatistics(@Query('fiscalYear') fiscalYear?: number) {
    return {
      success: true,
      data: await this.budgetService.getStatistics(fiscalYear ? Number(fiscalYear) : undefined),
    };
  }

  // ─── GET ONE ─────────────────────────────────────────────────────────────

  @Get(':id')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get budget by ID with details and approval history' })
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.budgetService.findOne(id) };
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────

  @Post()
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Create new budget with store allocations' })
  @ApiBody({ type: CreateBudgetDto })
  async create(@Body() dto: CreateBudgetDto, @Request() req: any) {
    return { success: true, data: await this.budgetService.create(dto, req.user.sub) };
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  @Put(':id')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Update draft budget (only DRAFT status)' })
  @ApiBody({ type: UpdateBudgetDto })
  async update(@Param('id') id: string, @Body() dto: UpdateBudgetDto, @Request() req: any) {
    return { success: true, data: await this.budgetService.update(id, dto, req.user.sub) };
  }

  // ─── SUBMIT ──────────────────────────────────────────────────────────────

  @Post(':id/submit')
  @RequirePermissions('budget:submit')
  @ApiOperation({ summary: 'Submit budget for approval (DRAFT → SUBMITTED)' })
  async submit(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.budgetService.submit(id, req.user.sub) };
  }

  // ─── APPROVE LEVEL 1 ─────────────────────────────────────────────────────

  @Post(':id/approve/level1')
  @RequirePermissions('budget:approve_l1')
  @ApiOperation({ summary: 'Level 1 approval (SUBMITTED → LEVEL1_APPROVED or REJECTED)' })
  @ApiBody({ type: ApprovalDecisionDto })
  async approveLevel1(
    @Param('id') id: string,
    @Body() dto: ApprovalDecisionDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.budgetService.approveLevel1(id, dto, req.user.sub, req.user.role) };
  }

  // ─── APPROVE LEVEL 2 ─────────────────────────────────────────────────────

  @Post(':id/approve/level2')
  @RequirePermissions('budget:approve_l2')
  @ApiOperation({ summary: 'Level 2 approval (LEVEL1_APPROVED → APPROVED or REJECTED)' })
  @ApiBody({ type: ApprovalDecisionDto })
  async approveLevel2(
    @Param('id') id: string,
    @Body() dto: ApprovalDecisionDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.budgetService.approveLevel2(id, dto, req.user.sub, req.user.role) };
  }

  // ─── RESET TO DRAFT ──────────────────────────────────────────────────────

  @Post(':id/reset-to-draft')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Reset rejected budget back to draft for revision' })
  async resetToDraft(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.budgetService.resetToDraft(id, req.user.sub) };
  }

  // ─── ARCHIVE ─────────────────────────────────────────────────────────────

  @Patch(':id/archive')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Archive an approved budget (APPROVED → ARCHIVED)' })
  async archive(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.budgetService.archive(id, req.user.sub) };
  }

  // ─── DELETE (soft) ───────────────────────────────────────────────────────

  @Delete(':id')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Soft-delete draft budget (only if no linked planning)' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.budgetService.remove(id, req.user.sub);
    return { success: true, message: 'Budget deleted' };
  }

  // ─── RESTORE ──────────────────────────────────────────────────────────────

  @Patch(':id/restore')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Restore a soft-deleted budget' })
  async restore(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.budgetService.restore(id, req.user.sub) };
  }
}
