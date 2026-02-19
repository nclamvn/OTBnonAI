import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId: string;
    entityType: string;
    entityId: string;
    action: string;
    changes?: Record<string, any>;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          changes: params.changes || undefined,
        },
      });
    } catch (err) {
      // Audit log should never block the main operation
      console.error('[AuditLog] Failed to write:', err);
    }
  }
}
