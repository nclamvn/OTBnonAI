import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { CreateBudgetDto, UpdateBudgetDto, CreateAllocateDto, UpdateAllocateDto, ApprovalDecisionDto } from './dto/budget.dto';

@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('budgets')
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  // ─── LIST ──────────────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'List budgets with filters and pagination' })
  @ApiQuery({ name: 'fiscalYear', required: false, type: Number, example: 2025 })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @Query('fiscalYear') fiscalYear?: number,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.budgetService.findAll({
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    return { success: true, ...result };
  }

  // ─── STATISTICS ────────────────────────────────────────────────────────────

  @Get('statistics')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get budget statistics' })
  @ApiQuery({ name: 'fiscalYear', required: false, type: Number })
  async getStatistics(@Query('fiscalYear') fiscalYear?: number) {
    return {
      success: true,
      data: await this.budgetService.getStatistics(fiscalYear ? Number(fiscalYear) : undefined),
    };
  }

  // ─── GET ONE ───────────────────────────────────────────────────────────────

  @Get(':id')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get budget by ID with allocations' })
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.budgetService.findOne(id) };
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  @Post()
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Create new budget' })
  @ApiBody({ type: CreateBudgetDto })
  async create(@Body() dto: CreateBudgetDto, @Request() req: any) {
    return { success: true, data: await this.budgetService.create(dto, req.user.sub) };
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  @Put(':id')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Update draft budget' })
  @ApiBody({ type: UpdateBudgetDto })
  async update(@Param('id') id: string, @Body() dto: UpdateBudgetDto, @Request() req: any) {
    return { success: true, data: await this.budgetService.update(id, dto, req.user.sub) };
  }

  // ─── CREATE ALLOCATION HEADER ──────────────────────────────────────────────

  @Post(':id/allocations')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Create new allocation version for a budget' })
  @ApiBody({ type: CreateAllocateDto })
  async createAllocation(@Param('id') id: string, @Body() dto: CreateAllocateDto, @Request() req: any) {
    return { success: true, data: await this.budgetService.createAllocateHeader(id, dto.brandId, dto.allocations, req.user.sub, dto.isFinalVersion) };
  }

  // ─── UPDATE ALLOCATION HEADER ──────────────────────────────────────────────

  @Put('allocations/:headerId')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Update allocation header details' })
  @ApiBody({ type: UpdateAllocateDto })
  async updateAllocation(
    @Param('headerId') headerId: string,
    @Body() dto: UpdateAllocateDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.budgetService.updateAllocateHeader(headerId, dto, req.user.sub) };
  }

  // ─── SET FINAL ALLOCATE VERSION ────────────────────────────────────────────

  @Patch('allocations/:headerId/set-final')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Mark allocation version as final (unsets all others for same brand+budget)' })
  async setFinalVersion(@Param('headerId') headerId: string) {
    return { success: true, data: await this.budgetService.setFinalVersion(headerId) };
  }

  // ─── SUBMIT ────────────────────────────────────────────────────────────────

  @Post(':id/submit')
  @RequirePermissions('budget:submit')
  @ApiOperation({ summary: 'Submit budget for approval (DRAFT → SUBMITTED)' })
  async submit(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.budgetService.submit(id, req.user.sub) };
  }

  // ─── APPROVE ───────────────────────────────────────────────────────────────

  @Post(':id/approve')
  @RequirePermissions('budget:approve')
  @ApiOperation({ summary: 'Approve budget (SUBMITTED → APPROVED)' })
  async approve(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.budgetService.approve(id, req.user.sub) };
  }

  // ─── APPROVE BY LEVEL (used by approvalHelper) ────────────────────────────

  @Post(':id/approve/:level')
  @RequirePermissions('budget:approve')
  @ApiOperation({ summary: 'Approve or reject budget by level (action: APPROVED | REJECTED)' })
  async approveByLevel(
    @Param('id') id: string,
    @Param('level') level: string,
    @Body('action') action: string,
    @Body('comment') comment: string,
    @Request() req: any,
  ) {
    return { success: true, data: await this.budgetService.approveByLevel(id, level, action, comment, req.user.sub) };
  }

  // ─── REJECT ────────────────────────────────────────────────────────────────

  @Post(':id/reject')
  @RequirePermissions('budget:approve')
  @ApiOperation({ summary: 'Reject budget (SUBMITTED → REJECTED)' })
  async reject(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.budgetService.reject(id, req.user.sub) };
  }

  // ─── ARCHIVE ───────────────────────────────────────────────────────────────

  @Patch(':id/archive')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Archive approved budget (APPROVED → ARCHIVED)' })
  async archive(@Param('id') id: string) {
    return { success: true, data: await this.budgetService.archive(id) };
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────

  @Delete(':id')
  @RequirePermissions('budget:write')
  @ApiOperation({ summary: 'Delete draft budget' })
  async remove(@Param('id') id: string) {
    await this.budgetService.remove(id);
    return { success: true, message: 'Budget deleted' };
  }
}
