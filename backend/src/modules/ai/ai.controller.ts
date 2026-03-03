import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { BudgetAlertsService } from './budget-alerts.service';
import { OtbAllocationService } from './otb-allocation.service';
import { RiskScoringService } from './risk-scoring.service';
import { SkuRecommenderService } from './sku-recommender.service';
import {
  CalculateSizeCurveDto,
  CompareSizeCurveDto,
  GetAlertsQueryDto,
  GenerateAllocationDto,
  CompareAllocationDto,
  GenerateSkuRecommendationsDto,
  AddRecommendationsToProposalDto,
} from './dto/ai.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly budgetAlertsService: BudgetAlertsService,
    private readonly otbAllocationService: OtbAllocationService,
    private readonly riskScoringService: RiskScoringService,
    private readonly skuRecommenderService: SkuRecommenderService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════
  // SIZE CURVE OPTIMIZER
  // ═══════════════════════════════════════════════════════════════════════

  @Post('size-curve/calculate')
  @ApiOperation({ summary: 'Calculate recommended size curve for a subcategory' })
  @ApiBody({ type: CalculateSizeCurveDto })
  async calculateSizeCurve(@Body() dto: CalculateSizeCurveDto) {
    const data = await this.aiService.calculateSizeCurve(
      dto.subCategoryId,
      dto.storeId,
      dto.totalOrderQty,
    );
    return { success: true, data };
  }

  @Post('size-curve/compare')
  @ApiOperation({ summary: 'Compare user sizing vs AI recommendation' })
  @ApiBody({ type: CompareSizeCurveDto })
  async compareSizeCurve(@Body() dto: CompareSizeCurveDto) {
    const data = await this.aiService.compareSizeCurve(
      dto.subCategoryId,
      dto.storeId,
      dto.userSizing,
    );
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BUDGET ALERTS
  // ═══════════════════════════════════════════════════════════════════════

  @Get('alerts')
  @ApiOperation({ summary: 'Get budget alerts' })
  async getAlerts(@Query() query: GetAlertsQueryDto) {
    const data = await this.budgetAlertsService.getAlerts({
      budgetId: query.budgetId,
      unreadOnly: query.unreadOnly === 'true',
    });
    return { success: true, data };
  }

  @Post('alerts/check')
  @ApiOperation({ summary: 'Manually trigger budget alert check' })
  async triggerAlertCheck() {
    const data = await this.budgetAlertsService.checkAllBudgets();
    return { success: true, data, message: 'Budget alert check completed' };
  }

  @Patch('alerts/:id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  async markAlertRead(@Param('id') id: string) {
    const data = await this.budgetAlertsService.markAsRead(id);
    return { success: true, data };
  }

  @Patch('alerts/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss an alert' })
  async dismissAlert(@Param('id') id: string) {
    const data = await this.budgetAlertsService.dismissAlert(id);
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // OTB ALLOCATION
  // ═══════════════════════════════════════════════════════════════════════

  @Post('allocation/generate')
  @ApiOperation({ summary: 'Generate OTB allocation recommendations' })
  @ApiBody({ type: GenerateAllocationDto })
  async generateAllocation(@Body() dto: GenerateAllocationDto) {
    const data = await this.otbAllocationService.generateAllocation(dto);
    return { success: true, data };
  }

  @Post('allocation/compare')
  @ApiOperation({ summary: 'Compare user allocation vs AI recommendation' })
  @ApiBody({ type: CompareAllocationDto })
  async compareAllocation(@Body() dto: CompareAllocationDto) {
    const data = await this.otbAllocationService.compareAllocation(
      dto.userAllocation,
      dto.budgetAmount,
    );
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RISK SCORING
  // ═══════════════════════════════════════════════════════════════════════

  @Post('risk/assess/:headerId')
  @ApiOperation({ summary: 'Calculate risk score for a SKU Proposal Header' })
  async assessRisk(@Param('headerId') headerId: string) {
    const data = await this.riskScoringService.assessProposal(headerId);
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SKU RECOMMENDER
  // ═══════════════════════════════════════════════════════════════════════

  @Post('sku-recommend/generate')
  @ApiOperation({ summary: 'Generate SKU recommendations for a subcategory' })
  @ApiBody({ type: GenerateSkuRecommendationsDto })
  async generateSkuRecommendations(@Body() dto: GenerateSkuRecommendationsDto) {
    const data = await this.skuRecommenderService.generateRecommendations(dto);
    return { success: true, data };
  }

  @Post('sku-recommend/add-to-proposal')
  @ApiOperation({ summary: 'Add recommended products to a SKU Proposal Header' })
  @ApiBody({ type: AddRecommendationsToProposalDto })
  async addToProposal(@Body() dto: AddRecommendationsToProposalDto) {
    const count = await this.skuRecommenderService.addSelectedToProposal(dto.productIds, dto.headerId);
    return { success: true, data: { addedCount: count }, message: `${count} products added to proposal` };
  }
}
