import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested, Min, Max, IsNotEmpty, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

// ─── Store Detail DTO ─────────────────────────────────────────────────────────

export class BudgetDetailDto {
  @ApiProperty({ example: 'store_id_123' })
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ example: 5000000000, description: 'Budget amount in VND' })
  @IsNumber()
  @Min(1, { message: 'Budget amount must be greater than 0' })
  @Max(100_000_000_000, { message: 'Budget amount cannot exceed 100 billion VND' })
  budgetAmount: number;
}

// ─── Create Budget DTO ────────────────────────────────────────────────────────

export class CreateBudgetDto {
  @ApiProperty({ example: 'brand_id_fer', description: 'Group Brand ID' })
  @IsString()
  @IsNotEmpty()
  groupBrandId: string;

  @ApiProperty({ example: 'SS', enum: ['SS', 'FW'], description: 'Season Group' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['SS', 'FW'], { message: 'seasonGroupId must be SS or FW' })
  seasonGroupId: string;

  @ApiProperty({ example: 'pre', enum: ['pre', 'main'], description: 'Season Type' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['pre', 'main'], { message: 'seasonType must be pre or main' })
  seasonType: string;

  @ApiProperty({ example: 2025 })
  @IsNumber()
  @Min(2020, { message: 'Fiscal year must be 2020 or later' })
  @Max(2099, { message: 'Fiscal year must be before 2100' })
  fiscalYear: number;

  @ApiPropertyOptional({ example: 'Q1 budget for Ferragamo' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ type: [BudgetDetailDto], description: 'Store allocations' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetDetailDto)
  details: BudgetDetailDto[];
}

// ─── Update Budget DTO ────────────────────────────────────────────────────────

export class UpdateBudgetDto {
  @ApiPropertyOptional({ example: 'Updated comment' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ type: [BudgetDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetDetailDto)
  @IsOptional()
  details?: BudgetDetailDto[];
}

// ─── Approval DTO ─────────────────────────────────────────────────────────────

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
