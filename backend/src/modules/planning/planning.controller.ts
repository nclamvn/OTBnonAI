import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PlanningService } from './planning.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { CreatePlanningDto, UpdatePlanningDto } from './dto/planning.dto';

@ApiTags('planning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('planning')
export class PlanningController {
  constructor(private planningService: PlanningService) {}

  // ─── LIST ──────────────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('planning:read')
  @ApiOperation({ summary: 'List planning headers with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (DRAFT, SUBMITTED, APPROVED, REJECTED)' })
  @ApiQuery({ name: 'budgetId', required: false, description: 'Filter by budget ID (reserved for future FK)' })
  @ApiQuery({ name: 'brandId', required: false, description: 'Filter by brand ID (via allocate_header.brand_id)' })
  @ApiQuery({ name: 'allocateHeaderId', required: false, description: 'Filter by allocate header ID' })
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('budgetId') budgetId?: string,
    @Query('brandId') brandId?: string,
    @Query('allocateHeaderId') allocateHeaderId?: string,
  ) {
    const result = await this.planningService.findAll({ page, pageSize, status, budgetId, brandId, allocateHeaderId });
    return { success: true, ...result };
  }

  // ─── FILTER OPTIONS FOR PLANNING DETAIL (Category tab) ───────────────────

  @Get('filter-options/categories')
  @RequirePermissions('planning:read')
  @ApiOperation({ summary: 'Get Gender → Category → SubCategory hierarchy for Planning Detail filter dropdowns' })
  @ApiQuery({ name: 'genderId', required: false, description: 'Filter by gender ID (cascading)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID (cascading to sub-categories)' })
  async getCategoryFilterOptions(
    @Query('genderId') genderId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return { success: true, data: await this.planningService.getCategoryFilterOptions(genderId, categoryId) };
  }

  // ─── HISTORICAL (comparison data) ─────────────────────────────────────────

  @Get('historical')
  @RequirePermissions('planning:read')
  @ApiOperation({ summary: 'Get historical planning data for year/season/brand comparison' })
  @ApiQuery({ name: 'fiscalYear', required: true, type: Number })
  @ApiQuery({ name: 'seasonGroupName', required: true, type: String })
  @ApiQuery({ name: 'seasonName', required: true, type: String })
  @ApiQuery({ name: 'brandId', required: true, type: String })
  async findHistorical(
    @Query('fiscalYear') fiscalYear: number,
    @Query('seasonGroupName') seasonGroupName: string,
    @Query('seasonName') seasonName: string,
    @Query('brandId') brandId: string,
  ) {
    return { success: true, data: await this.planningService.findHistorical({ fiscalYear: Number(fiscalYear), seasonGroupName, seasonName, brandId }) };
  }

  // ─── GET ONE ───────────────────────────────────────────────────────────────

  @Get(':id')
  @RequirePermissions('planning:read')
  @ApiOperation({ summary: 'Get planning header with all details (collections, genders, categories)' })
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.planningService.findOne(id) };
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  @Post()
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Create new planning header with details' })
  @ApiBody({ type: CreatePlanningDto })
  async create(@Body() dto: CreatePlanningDto, @Request() req: any) {
    return { success: true, data: await this.planningService.create(dto, req.user.sub) };
  }

  // ─── COPY FROM EXISTING ────────────────────────────────────────────────────

  @Post(':id/copy')
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Create new version by copying an existing one' })
  async createFromVersion(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.planningService.createFromVersion(id, req.user.sub) };
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  @Put(':id')
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Update planning header details' })
  @ApiBody({ type: UpdatePlanningDto })
  async update(@Param('id') id: string, @Body() dto: UpdatePlanningDto, @Request() req: any) {
    return { success: true, data: await this.planningService.update(id, dto, req.user.sub) };
  }

  // ─── SUBMIT ────────────────────────────────────────────────────────────────

  @Post(':id/submit')
  @RequirePermissions('planning:submit')
  @ApiOperation({ summary: 'Submit planning for approval (DRAFT → SUBMITTED)' })
  async submit(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.planningService.submit(id, req.user.sub) };
  }

  // ─── APPROVE BY LEVEL (used by approvalHelper) ────────────────────────────

  @Post(':id/approve/:level')
  @RequirePermissions('planning:approve')
  @ApiOperation({ summary: 'Approve or reject planning by level (action: APPROVED | REJECTED)' })
  async approveByLevel(
    @Param('id') id: string,
    @Param('level') level: string,
    @Body('action') action: string,
    @Body('comment') comment: string,
    @Request() req: any,
  ) {
    return { success: true, data: await this.planningService.approveByLevel(id, level, action, comment, req.user.sub) };
  }

  // ─── FINALIZE ──────────────────────────────────────────────────────────────

  @Post(':id/final')
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Mark planning version as final' })
  async finalize(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.planningService.finalize(id, req.user.sub) };
  }

  // ─── UPDATE DETAIL ─────────────────────────────────────────────────────────

  @Patch(':id/details/:detailId')
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Update a single planning detail row' })
  async updateDetail(
    @Param('id') id: string,
    @Param('detailId') detailId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return { success: true, data: await this.planningService.updateDetail(id, detailId, dto, req.user.sub) };
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────

  @Delete(':id')
  @RequirePermissions('planning:write')
  @ApiOperation({ summary: 'Delete planning header' })
  async remove(@Param('id') id: string) {
    await this.planningService.remove(id);
    return { success: true, message: 'Planning header deleted' };
  }
}
