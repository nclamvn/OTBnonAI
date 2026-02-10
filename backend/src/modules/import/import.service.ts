import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ImportTargetEnum,
  ImportMode,
  DuplicateHandling,
  ImportBatchDto,
} from './dto/import.dto';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processBatch(dto: ImportBatchDto) {
    const {
      target,
      mode = ImportMode.UPSERT,
      duplicateHandling = DuplicateHandling.SKIP,
      matchKey = [],
      rows,
      batchIndex = 0,
      totalBatches = 1,
    } = dto;

    const sessionId = dto.sessionId || `import_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const prismaTarget = target as any; // Prisma enum maps directly

    const result = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [] as Array<{ row: number; field?: string; error: string }>,
      sessionId,
      message: '',
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        const hasData = Object.values(row).some((v) => v !== null && v !== undefined && v !== '');
        if (!hasData) {
          result.skipped++;
          continue;
        }

        const matchKeyValue = matchKey.length > 0
          ? matchKey.map((k) => String(row[k] || '')).join('||')
          : null;

        const existingRecord = matchKeyValue
          ? await this.prisma.importedRecord.findFirst({
              where: { target: prismaTarget, matchKey: matchKeyValue },
            })
          : null;

        if (existingRecord) {
          if (mode === ImportMode.INSERT) {
            switch (duplicateHandling) {
              case DuplicateHandling.SKIP:
                result.skipped++;
                continue;
              case DuplicateHandling.OVERWRITE:
              case DuplicateHandling.MERGE:
                await this.prisma.importedRecord.update({
                  where: { id: existingRecord.id },
                  data: {
                    data: duplicateHandling === DuplicateHandling.MERGE
                      ? { ...(existingRecord.data as Record<string, unknown>), ...row } as Prisma.InputJsonValue
                      : row as Prisma.InputJsonValue,
                    sessionId,
                    importedAt: now,
                  },
                });
                result.updated++;
                continue;
            }
          } else if (mode === ImportMode.UPSERT || mode === ImportMode.UPDATE_ONLY) {
            await this.prisma.importedRecord.update({
              where: { id: existingRecord.id },
              data: { data: row as Prisma.InputJsonValue, sessionId, importedAt: now },
            });
            result.updated++;
            continue;
          }
        } else {
          if (mode === ImportMode.UPDATE_ONLY) {
            result.skipped++;
            continue;
          }

          await this.prisma.importedRecord.create({
            data: {
              target: prismaTarget,
              matchKey: matchKeyValue,
              data: row as Prisma.InputJsonValue,
              sessionId,
              importedAt: now,
            },
          });
          result.inserted++;
        }
      } catch (err) {
        result.errors++;
        result.errorDetails.push({
          row: i + 1,
          error: err instanceof Error ? err.message : String(err),
        });
        this.logger.error(`Import error at row ${i + 1}:`, err);
      }
    }

    result.message = `Batch ${batchIndex + 1}/${totalBatches}: +${result.inserted} inserted, ↻${result.updated} updated, ⊘${result.skipped} skipped, ✕${result.errors} errors`;
    this.logger.log(`Import batch completed: ${result.message}`);
    return result;
  }

  async queryData(query: {
    target: ImportTargetEnum;
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { target, page = 1, pageSize = 50, search, sortBy = '_importedAt', sortOrder = 'desc' } = query;
    const prismaTarget = target as any;

    const where: any = { target: prismaTarget };
    if (search) {
      where.matchKey = { contains: search, mode: 'insensitive' };
    }

    const total = await this.prisma.importedRecord.count({ where });

    const orderBy: any = {};
    if (sortBy === '_importedAt' || sortBy === 'importedAt') {
      orderBy.importedAt = sortOrder;
    } else {
      orderBy.importedAt = sortOrder;
    }

    const records = await this.prisma.importedRecord.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const transformedRecords = records.map((r) => ({
      _id: r.id,
      _importedAt: r.importedAt.toISOString(),
      _sessionId: r.sessionId,
      ...(r.data as object),
    }));

    return {
      records: transformedRecords,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getStats(target: ImportTargetEnum) {
    const prismaTarget = target as any;

    const totalRecords = await this.prisma.importedRecord.count({
      where: { target: prismaTarget },
    });

    const lastRecord = await this.prisma.importedRecord.findFirst({
      where: { target: prismaTarget },
      orderBy: { importedAt: 'desc' },
      select: { importedAt: true },
    });

    const sessions = await this.prisma.importedRecord.groupBy({
      by: ['sessionId'],
      where: { target: prismaTarget },
    });

    const sampleRecords = await this.prisma.importedRecord.findMany({
      where: { target: prismaTarget },
      take: 100,
      select: { data: true },
    });

    const fieldCounts: Record<string, number> = {};
    for (const record of sampleRecords) {
      const data = record.data as Record<string, unknown>;
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined && value !== '') {
          fieldCounts[key] = (fieldCounts[key] || 0) + 1;
        }
      }
    }

    return {
      target,
      totalRecords,
      lastImportAt: lastRecord?.importedAt?.toISOString() || null,
      sessionCount: sessions.length,
      fieldCounts,
    };
  }

  async deleteSession(target: ImportTargetEnum, sessionId: string) {
    const result = await this.prisma.importedRecord.deleteMany({
      where: { target: target as any, sessionId },
    });
    this.logger.log(`Deleted ${result.count} records from session ${sessionId}`);
    return result.count;
  }

  async clearAll(target: ImportTargetEnum) {
    const result = await this.prisma.importedRecord.deleteMany({
      where: { target: target as any },
    });
    this.logger.log(`Cleared all ${result.count} records for target ${target}`);
    return result.count;
  }

  async getAllTargetStats() {
    const targets = Object.values(ImportTargetEnum);
    const stats: Array<{ target: string; totalRecords: number; lastImportAt: string | null; sessionCount: number; fieldCounts: Record<string, number> }> = [];

    for (const target of targets) {
      const count = await this.prisma.importedRecord.count({ where: { target: target as any } });
      if (count > 0) {
        stats.push(await this.getStats(target));
      } else {
        stats.push({
          target,
          totalRecords: 0,
          lastImportAt: null,
          sessionCount: 0,
          fieldCounts: {},
        });
      }
    }

    return stats;
  }
}
