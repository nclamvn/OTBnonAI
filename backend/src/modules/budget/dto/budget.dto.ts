import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsBoolean, ValidateNested, Min, IsNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

// ─── Budget Allocate Detail ──────────────────────────────────────────────────

export class BudgetAllocateDto {
  @ApiProperty({ example: 'store_id_123' })
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ example: 'season_group_id' })
  @IsString()
  @IsNotEmpty()
  seasonGroupId: string;

  @ApiProperty({ example: 'season_id' })
  @IsString()
  @IsNotEmpty()
  seasonId: string;

  @ApiProperty({ example: 5000000000, description: 'Budget amount in VND' })
  @IsNumber()
  @Min(0)
  budgetAmount: number;
}

// ─── Create Budget DTO ───────────────────────────────────────────────────────

export class CreateBudgetDto {
  @ApiProperty({ example: 'FY2024 Gucci Budget' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 50000000000, description: 'Total budget amount in VND' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 2025 })
  @IsInt()
  fiscalYear: number;

  @ApiPropertyOptional({ example: 'Q1 budget for Ferragamo' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'brand_id', description: 'Brand ID — auto-creates AllocateHeader to associate brand' })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ type: [BudgetAllocateDto], description: 'Store/season allocations (requires brandId)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetAllocateDto)
  @IsOptional()
  allocations?: BudgetAllocateDto[];
}

// ─── Update Budget DTO ───────────────────────────────────────────────────────

export class UpdateBudgetDto {
  @ApiPropertyOptional({ example: 'Updated budget name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 60000000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
}

// ─── Allocate Header + Details DTO ───────────────────────────────────────────

export class CreateAllocateDto {
  @ApiProperty({ example: 'brand_id', description: 'Brand ID' })
  @IsString()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({ type: [BudgetAllocateDto], description: 'Store/season allocations' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetAllocateDto)
  allocations: BudgetAllocateDto[];

  @ApiPropertyOptional({ example: false, description: 'Mark as final version' })
  @IsBoolean()
  @IsOptional()
  isFinalVersion?: boolean;
}

export class UpdateAllocateDto {
  @ApiProperty({ type: [BudgetAllocateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetAllocateDto)
  allocations: BudgetAllocateDto[];

  @ApiPropertyOptional({ example: false, description: 'Mark as final version' })
  @IsBoolean()
  @IsOptional()
  isFinalVersion?: boolean;
}

// ─── Approval DTO ────────────────────────────────────────────────────────────

export class ApprovalDecisionDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsString()
  @IsNotEmpty()
  action: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Approved with minor adjustments' })
  @IsString()
  @IsOptional()
  comment?: string;
}
