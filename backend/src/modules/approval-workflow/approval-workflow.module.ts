import { Module } from '@nestjs/common';
import { ApprovalWorkflowController } from './approval-workflow.controller';
import { ApprovalWorkflowService } from './approval-workflow.service';

@Module({
  controllers: [ApprovalWorkflowController],
  providers: [ApprovalWorkflowService],
  exports: [ApprovalWorkflowService],
})
export class ApprovalWorkflowModule {}
