import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { BudgetAlertsService } from './budget-alerts.service';
import { OtbAllocationService } from './otb-allocation.service';
import { RiskScoringService } from './risk-scoring.service';
import { SkuRecommenderService } from './sku-recommender.service';

@Module({
  controllers: [AiController],
  providers: [AiService, BudgetAlertsService, OtbAllocationService, RiskScoringService, SkuRecommenderService],
  exports: [AiService, BudgetAlertsService, OtbAllocationService, RiskScoringService, SkuRecommenderService],
})
export class AiModule {}
