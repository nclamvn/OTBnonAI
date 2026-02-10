import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  async getBrands() {
    return { success: true, data: await this.masterDataService.getBrands() };
  }

  @Get('stores')
  @ApiOperation({ summary: 'Get all active stores (replaces STORES constant)' })
  async getStores() {
    return { success: true, data: await this.masterDataService.getStores() };
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get all collections (replaces COLLECTIONS constant)' })
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
  async getCategories() {
    return { success: true, data: await this.masterDataService.getCategories() };
  }

  @Get('seasons')
  @ApiOperation({ summary: 'Get season configuration (SS/FW + Pre/Main)' })
  async getSeasons() {
    return { success: true, data: this.masterDataService.getSeasonConfig() };
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
