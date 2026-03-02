import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { BudgetModule } from './modules/budget/budget.module';
import { PlanningModule } from './modules/planning/planning.module';
import { ProposalModule } from './modules/proposal/proposal.module';
import { ApprovalWorkflowModule } from './modules/approval-workflow/approval-workflow.module';
import { ImportModule } from './modules/import/import.module';
import { NotificationModule } from './modules/notification/notification.module';
import { DataRetentionModule } from './modules/data-retention/data-retention.module';
import { AiModule } from './modules/ai/ai.module';
import { TicketModule } from './modules/ticket/ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    PrismaModule,
    AuthModule,
    MasterDataModule,
    BudgetModule,
    PlanningModule,
    ProposalModule,
    ApprovalWorkflowModule,
    ImportModule,
    NotificationModule,
    DataRetentionModule,
    AiModule,
    TicketModule,
  ],
})
export class AppModule {}
