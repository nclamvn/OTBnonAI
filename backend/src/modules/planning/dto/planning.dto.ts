import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ─── Planning Detail DTO ──────────────────────────────────────────────────────

export class PlanningDetailDto {
  @ApiProperty({ enum: ['collection', 'gender', 'category', 'subCategory'] })
  @IsString()
  dimensionType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  genderId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subCategoryId?: string;

  @ApiProperty({ example: 1500000000, description: 'Last season sales value' })
  @IsNumber()
  @Min(0)
  lastSeasonSales: number;

  @ApiProperty({ example: 0.25, description: 'Last season percentage (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  lastSeasonPct: number;

  @ApiProperty({ example: 0.30, description: 'System suggested buy percentage' })
  @IsNumber()
  @Min(0)
  @Max(1)
  systemBuyPct: number;

  @ApiProperty({ example: 0.28, description: 'User adjusted buy percentage' })
  @IsNumber()
  @Min(0)
  @Max(1)
  userBuyPct: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userComment?: string;
}

// ─── Create Planning Version DTO ──────────────────────────────────────────────

export class CreatePlanningDto {
  @ApiProperty({ description: 'Budget Detail ID (budget per store)' })
  @IsString()
  @IsNotEmpty()
  budgetDetailId: string;

  @ApiPropertyOptional({ example: 'Initial Planning' })
  @IsString()
  @IsOptional()
  versionName?: string;

  @ApiProperty({ type: [PlanningDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanningDetailDto)
  details: PlanningDetailDto[];
}

// ─── Update Planning DTO ──────────────────────────────────────────────────────

export class UpdatePlanningDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  versionName?: string;

  @ApiPropertyOptional({ type: [PlanningDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanningDetailDto)
  @IsOptional()
  details?: PlanningDetailDto[];
}

// ─── Update Single Detail DTO ─────────────────────────────────────────────────

export class UpdateDetailDto {
  @ApiProperty({ example: 0.28, description: 'User adjusted buy percentage' })
  @IsNumber()
  @Min(0)
  @Max(1)
  userBuyPct: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userComment?: string;
}

// ─── Approval DTO ─────────────────────────────────────────────────────────────

export class ApprovalDecisionDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsString()
  @IsNotEmpty()
  action: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
