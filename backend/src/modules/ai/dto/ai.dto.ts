import { IsString, IsNumber, IsOptional, IsObject, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateSizeCurveDto {
  @ApiProperty({ description: 'SubCategory ID' })
  @IsString()
  subCategoryId: string;

  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId: string;

  @ApiProperty({ description: 'Total order quantity', example: 100 })
  @IsNumber()
  @Min(1)
  totalOrderQty: number;
}

export class CompareSizeCurveDto {
  @ApiProperty({ description: 'SubCategory ID' })
  @IsString()
  subCategoryId: string;

  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId: string;

  @ApiProperty({
    description: 'User sizing input — map of sizeName → quantity',
    example: { S: 10, M: 30, L: 35, XL: 25 },
  })
  @IsObject()
  userSizing: Record<string, number>;
}

export class GetAlertsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by budget ID' })
  @IsOptional()
  @IsString()
  budgetId?: string;

  @ApiPropertyOptional({ description: 'Only unread alerts', default: false })
  @IsOptional()
  unreadOnly?: string;
}

export class GenerateAllocationDto {
  @ApiProperty({ description: 'Budget amount (VND)', example: 50000000000 })
  @IsNumber()
  @Min(0)
  budgetAmount: number;

  @ApiPropertyOptional({ description: 'Store ID' })
  @IsOptional()
  @IsString()
  storeId?: string;
}

export class CompareAllocationDto {
  @ApiProperty({ description: 'Budget amount (VND)' })
  @IsNumber()
  @Min(0)
  budgetAmount: number;

  @ApiProperty({
    description: 'User allocation entries',
    type: 'array',
  })
  @IsArray()
  userAllocation: Array<{
    dimensionType: string;
    dimensionValue: string;
    pct: number;
  }>;
}

export class GenerateSkuRecommendationsDto {
  @ApiProperty({ description: 'SubCategory ID' })
  @IsString()
  subCategoryId: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiProperty({ description: 'Budget amount', example: 5000000000 })
  @IsNumber()
  @Min(0)
  budgetAmount: number;

  @ApiPropertyOptional({ description: 'Max results', example: 20 })
  @IsOptional()
  @IsNumber()
  maxResults?: number;
}

export class AddRecommendationsToProposalDto {
  @ApiProperty({ description: 'Product IDs to add', type: [String] })
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @ApiProperty({ description: 'SKU Proposal Header ID' })
  @IsString()
  headerId: string;
}
