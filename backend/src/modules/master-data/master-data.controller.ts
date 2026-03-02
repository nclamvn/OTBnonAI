import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MasterDataService } from './master-data.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('master-data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('master')
export class MasterDataController {
  constructor(private masterDataService: MasterDataService) {}

  @Get('brands')
  @ApiOperation({ summary: 'Get all active brands (replaces GROUP_BRANDS constant)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based). Requires limit.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page. Requires page.' })
  async getBrands(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.masterDataService.getBrands(
      page && limit ? { page, limit } : undefined,
    );
    if (page && limit) {
      return { success: true, ...(result as { data: any[]; total: number; page: number; limit: number }) };
    }
    return { success: true, data: result };
  }

  @Get('stores')
  @ApiOperation({ summary: 'Get all active stores (replaces STORES constant)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based). Requires limit.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page. Requires page.' })
  async getStores(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.masterDataService.getStores(
      page && limit ? { page, limit } : undefined,
    );
    if (page && limit) {
      return { success: true, ...(result as { data: any[]; total: number; page: number; limit: number }) };
    }
    return { success: true, data: result };
  }

  @Get('season-types')
  @ApiOperation({ summary: 'Get all season types (Carry Over, Seasonal)' })
  async getSeasonTypes() {
    return { success: true, data: await this.masterDataService.getSeasonTypes() };
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get all collections (alias for season-types, backward compat)' })
  async getCollections() {
    return { success: true, data: await this.masterDataService.getCollections() };
  }

  @Get('genders')
  @ApiOperation({ summary: 'Get all genders' })
  async getGenders() {
    return { success: true, data: await this.masterDataService.getGenders() };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get full category hierarchy: Gender → Category → SubCategory' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based). Requires limit.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page. Requires page.' })
  async getCategories(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.masterDataService.getCategories(
      page && limit ? { page, limit } : undefined,
    );
    if (page && limit) {
      return { success: true, ...(result as { data: any[]; total: number; page: number; limit: number }) };
    }
    return { success: true, data: result };
  }

  @Get('season-groups')
  @ApiOperation({ summary: 'Get season groups from DB (with seasons)' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getSeasonGroups(@Query('year') year?: number) {
    return { success: true, data: await this.masterDataService.getSeasonGroups(year) };
  }

  @Get('seasons-by-group')
  @ApiOperation({ summary: 'Get seasons by season group ID' })
  @ApiQuery({ name: 'seasonGroupId', required: true })
  async getSeasonsByGroup(@Query('seasonGroupId') seasonGroupId: string) {
    return { success: true, data: await this.masterDataService.getSeasonsByGroup(seasonGroupId) };
  }

  @Get('seasons')
  @ApiOperation({ summary: 'Get season configuration (SS/FW + Pre/Main) — static fallback' })
  async getSeasons() {
    return { success: true, data: this.masterDataService.getSeasonConfig() };
  }

  @Get('sub-categories')
  @ApiOperation({ summary: 'Get subcategories with optional category/gender filter' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'genderId', required: false })
  async getSubCategories(
    @Query('categoryId') categoryId?: string,
    @Query('genderId') genderId?: string,
  ) {
    return { success: true, data: await this.masterDataService.getSubCategoriesDirect({ categoryId, genderId }) };
  }

  @Get('subcategory-sizes/:id')
  @ApiOperation({ summary: 'Get sizes for a subcategory' })
  async getSubcategorySizes(@Param('id') id: string) {
    return { success: true, data: await this.masterDataService.getSubcategorySizes(id) };
  }

  @Get('approval-statuses')
  @ApiOperation({ summary: 'Get all approval statuses' })
  async getApprovalStatuses() {
    return { success: true, data: await this.masterDataService.getApprovalStatuses() };
  }

  @Get('fiscal-years')
  @ApiOperation({ summary: 'Get distinct fiscal years from budgets' })
  async getFiscalYears() {
    return { success: true, data: await this.masterDataService.getFiscalYears() };
  }

  @Get('sku-catalog')
  @ApiOperation({ summary: 'Search SKU catalog with filters and pagination' })
  @ApiQuery({ name: 'productType', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getSkuCatalog(
    @Query('productType') productType?: string,
    @Query('brandId') brandId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.masterDataService.getSkuCatalog({
      productType, brandId, search, page, pageSize,
    });
    return { success: true, ...result };
  }
}
