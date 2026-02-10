import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ProposalService } from './proposal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import {
  CreateProposalDto,
  UpdateProposalDto,
  AddProductDto,
  BulkAddProductsDto,
  UpdateProductDto,
  ApprovalDecisionDto,
} from './dto/proposal.dto';

@ApiTags('proposals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('proposals')
export class ProposalController {
  constructor(private proposalService: ProposalService) {}

  // ─── LIST ────────────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('proposal:read')
  @ApiOperation({ summary: 'List proposals with filters' })
  @ApiQuery({ name: 'budgetId', required: false })
  @ApiQuery({ name: 'planningVersionId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED', 'LEVEL1_APPROVED', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @Query('budgetId') budgetId?: string,
    @Query('planningVersionId') planningVersionId?: string,
    @Query('status') status?: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.proposalService.findAll({
      budgetId, planningVersionId, status, page, pageSize,
    });
    return { success: true, ...result };
  }

  // ─── STATISTICS ──────────────────────────────────────────────────────────

  @Get('statistics')
  @RequirePermissions('proposal:read')
  @ApiOperation({ summary: 'Get proposal statistics' })
  @ApiQuery({ name: 'budgetId', required: false })
  async getStatistics(@Query('budgetId') budgetId?: string) {
    return { success: true, data: await this.proposalService.getStatistics(budgetId) };
  }

  // ─── GET ONE ─────────────────────────────────────────────────────────────

  @Get(':id')
  @RequirePermissions('proposal:read')
  @ApiOperation({ summary: 'Get proposal with products and approvals' })
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.proposalService.findOne(id) };
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────

  @Post()
  @RequirePermissions('proposal:write')
  @ApiOperation({ summary: 'Create new proposal for a budget' })
  @ApiBody({ type: CreateProposalDto })
  async create(@Body() dto: CreateProposalDto, @Request() req: any) {
    return { success: true, data: await this.proposalService.create(dto, req.user.sub) };
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  @Put(':id')
  @RequirePermissions('proposal:write')
  @ApiOperation({ summary: 'Update draft proposal' })
  @ApiBody({ type: UpdateProposalDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProposalDto, @Request() req: any) {
    return { success: true, data: await this.proposalService.update(id, dto, req.user.sub) };
  }

  // ─── ADD PRODUCT ─────────────────────────────────────────────────────────

  @Post(':id/products')
  @RequirePermissions('proposal:write')
  @ApiOperation({ summary: 'Add a product (SKU) to the proposal' })
  @ApiBody({ type: AddProductDto })
  async addProduct(
    @Param('id') id: string,
    @Body() dto: AddProductDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.proposalService.addProduct(id, dto, req.user.sub) };
  }

  // ─── BULK ADD PRODUCTS ───────────────────────────────────────────────────

  @Post(':id/products/bulk')
  @RequirePermissions('proposal:write')
  @ApiOperation({ summary: 'Bulk add multiple products to the proposal' })
  @ApiBody({ type: BulkAddProductsDto })
  async bulkAddProducts(
    @Param('id') id: string,
    @Body() dto: BulkAddProductsDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.proposalService.bulkAddProducts(id, dto, req.user.sub) };
  }

  // ─── UPDATE PRODUCT ──────────────────────────────────────────────────────

  @Patch(':id/products/:productId')
  @RequirePermissions('proposal:write')
  @ApiOperation({ summary: 'Update a product quantity or details in the proposal' })
  @ApiBody({ type: UpdateProductDto })
  async updateProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.proposalService.updateProduct(id, productId, dto, req.user.sub) };
  }

  // ─── REMOVE PRODUCT ──────────────────────────────────────────────────────

  @Delete(':id/products/:productId')
  @RequirePermissions('proposal:write')
  @ApiOperation({ summary: 'Remove a product from the proposal' })
  async removeProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Request() req: any,
  ) {
    return { success: true, data: await this.proposalService.removeProduct(id, productId, req.user.sub) };
  }

  // ─── SUBMIT ──────────────────────────────────────────────────────────────

  @Post(':id/submit')
  @RequirePermissions('proposal:submit')
  @ApiOperation({ summary: 'Submit proposal for approval (DRAFT → SUBMITTED)' })
  async submit(@Param('id') id: string, @Request() req: any) {
    return { success: true, data: await this.proposalService.submit(id, req.user.sub) };
  }

  // ─── APPROVE LEVEL 1 ─────────────────────────────────────────────────────

  @Post(':id/approve/level1')
  @RequirePermissions('proposal:approve_l1')
  @ApiOperation({ summary: 'Level 1 approval (SUBMITTED → LEVEL1_APPROVED)' })
  @ApiBody({ type: ApprovalDecisionDto })
  async approveLevel1(
    @Param('id') id: string,
    @Body() dto: ApprovalDecisionDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.proposalService.approveLevel1(id, dto, req.user.sub) };
  }

  // ─── APPROVE LEVEL 2 ─────────────────────────────────────────────────────

  @Post(':id/approve/level2')
  @RequirePermissions('proposal:approve_l2')
  @ApiOperation({ summary: 'Level 2 approval (LEVEL1_APPROVED → APPROVED)' })
  @ApiBody({ type: ApprovalDecisionDto })
  async approveLevel2(
    @Param('id') id: string,
    @Body() dto: ApprovalDecisionDto,
    @Request() req: any,
  ) {
    return { success: true, data: await this.proposalService.approveLevel2(id, dto, req.user.sub) };
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────

  @Delete(':id')
  @RequirePermissions('proposal:write')
  @ApiOperation({ summary: 'Delete draft proposal' })
  async remove(@Param('id') id: string) {
    await this.proposalService.remove(id);
    return { success: true, message: 'Proposal deleted' };
  }
}
