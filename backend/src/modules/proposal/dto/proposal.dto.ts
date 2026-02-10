import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

// ─── Create Proposal ─────────────────────────────────────────────────────────

export class CreateProposalDto {
  @ApiProperty({ example: 'FER-SS25-REX-Ticket-001' })
  @IsString()
  @IsNotEmpty()
  ticketName: string;

  @ApiProperty({ description: 'Budget ID to link this proposal' })
  @IsString()
  @IsNotEmpty()
  budgetId: string;

  @ApiPropertyOptional({ description: 'Optional planning version to link' })
  @IsString()
  @IsOptional()
  planningVersionId?: string;
}

// ─── Update Proposal ─────────────────────────────────────────────────────────

export class UpdateProposalDto {
  @ApiPropertyOptional({ example: 'FER-SS25-REX-Ticket-001-Updated' })
  @IsString()
  @IsOptional()
  ticketName?: string;

  @ApiPropertyOptional({ description: 'Link to a different planning version' })
  @IsString()
  @IsOptional()
  planningVersionId?: string;
}

// ─── Add Product to Proposal ─────────────────────────────────────────────────

export class AddProductDto {
  @ApiProperty({ description: 'SKU Catalog ID' })
  @IsString()
  @IsNotEmpty()
  skuId: string;

  @ApiProperty({ example: 10, description: 'Order quantity' })
  @IsNumber()
  @Min(1)
  orderQty: number;

  @ApiPropertyOptional({ enum: ['New', 'Existing', 'VIP'], description: 'Customer target segment' })
  @IsString()
  @IsOptional()
  customerTarget?: string;
}

// ─── Bulk Add Products ───────────────────────────────────────────────────────

export class BulkAddProductsDto {
  @ApiProperty({ type: [AddProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddProductDto)
  products: AddProductDto[];
}

// ─── Update Product Quantity ─────────────────────────────────────────────────

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 15, description: 'New order quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  orderQty?: number;

  @ApiPropertyOptional({ enum: ['New', 'Existing', 'VIP'] })
  @IsString()
  @IsOptional()
  customerTarget?: string;

  @ApiPropertyOptional({ description: 'Sort order for display' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

// ─── Approval Decision ───────────────────────────────────────────────────────

export class ApprovalDecisionDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  action: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Looks good, approved for ordering' })
  @IsString()
  @IsOptional()
  comment?: string;
}
