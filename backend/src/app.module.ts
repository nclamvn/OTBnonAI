import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { BudgetModule } from './modules/budget/budget.module';
import { PlanningModule } from './modules/planning/planning.module';
import { ProposalModule } from './modules/proposal/proposal.module';
import { AiModule } from './modules/ai/ai.module';
import { ApprovalWorkflowModule } from './modules/approval-workflow/approval-workflow.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { ImportModule } from './modules/import/import.module';
import { NotificationModule } from './modules/notification/notification.module';
import { DataRetentionModule } from './modules/data-retention/data-retention.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    MasterDataModule,
    BudgetModule,
    PlanningModule,
    ProposalModule,
    AiModule,
    ApprovalWorkflowModule,
    TicketModule,
    ImportModule,
    NotificationModule,
    DataRetentionModule,
  ],
})
export class AppModule {}
