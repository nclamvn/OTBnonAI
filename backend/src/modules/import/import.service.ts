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

  // ─── BIZ-05: ETL APPLY — Transform imported_records into transactional tables ──

  async applyImportedData(target: ImportTargetEnum, sessionId?: string) {
    const where: any = { target: target as any };
    if (sessionId) where.sessionId = sessionId;

    const records = await this.prisma.importedRecord.findMany({ where });
    if (records.length === 0) {
      return { applied: 0, skipped: 0, errors: 0, errorDetails: [], message: 'No records to apply' };
    }

    const result = { applied: 0, skipped: 0, errors: 0, errorDetails: [] as Array<{ id: string; error: string }> };

    switch (target) {
      case ImportTargetEnum.PRODUCTS:
        for (const record of records) {
          try {
            const data = record.data as Record<string, any>;
            const skuCode = data.skuCode || data.sku_code || data.SKU || data.sku;
            if (!skuCode) { result.skipped++; continue; }

            const productName = data.productName || data.product_name || data.name || data.NAME || skuCode;
            const productType = data.productType || data.product_type || data.type || '';
            const srp = Number(data.srp || data.SRP || data.price || data.retail_price || 0);
            const costPrice = Number(data.costPrice || data.cost_price || data.cost || 0) || (srp > 0 ? Math.round(srp * 0.4) : null);

            await this.prisma.skuCatalog.upsert({
              where: { skuCode: String(skuCode) },
              update: {
                productName,
                productType,
                theme: data.theme || data.THEME || undefined,
                color: data.color || data.COLOR || undefined,
                composition: data.composition || data.COMPOSITION || undefined,
                srp: srp > 0 ? srp : undefined,
                costPrice: costPrice && costPrice > 0 ? costPrice : undefined,
                seasonGroupId: data.seasonGroupId || data.season || undefined,
                imageUrl: data.imageUrl || data.image_url || undefined,
              },
              create: {
                skuCode: String(skuCode),
                productName,
                productType,
                theme: data.theme || data.THEME || null,
                color: data.color || data.COLOR || null,
                composition: data.composition || data.COMPOSITION || null,
                srp: srp > 0 ? srp : 0,
                costPrice: costPrice && costPrice > 0 ? costPrice : null,
                seasonGroupId: data.seasonGroupId || data.season || null,
                imageUrl: data.imageUrl || data.image_url || null,
              },
            });
            result.applied++;
          } catch (err) {
            result.errors++;
            result.errorDetails.push({ id: record.id, error: err instanceof Error ? err.message : String(err) });
          }
        }
        break;

      default:
        return { applied: 0, skipped: 0, errors: 0, errorDetails: [], message: `ETL apply not yet implemented for target: ${target}` };
    }

    const msg = `Applied ${result.applied} records, skipped ${result.skipped}, errors ${result.errors}`;
    this.logger.log(`ETL apply [${target}]: ${msg}`);
    return { ...result, message: msg };
  }

  // ─── BIZ-14: WSSI SELL-THROUGH ANALYTICS ────────────────────────────────────

  async getWssiAnalytics() {
    const records = await this.prisma.importedRecord.findMany({
      where: { target: 'wssi' as any },
    });

    if (records.length === 0) {
      return {
        totalRecords: 0,
        totalReceivedQty: 0,
        totalSoldQty: 0,
        sellThroughRate: 0,
        byCategory: [],
        computedAt: new Date().toISOString(),
      };
    }

    // Accumulate totals and group by category/subcategory
    let totalReceivedQty = 0;
    let totalSoldQty = 0;

    const categoryMap = new Map<
      string,
      { category: string; subcategory: string; receivedQty: number; soldQty: number; recordCount: number }
    >();

    for (const record of records) {
      const data = record.data as Record<string, any>;

      // Extract received qty — handle multiple possible field names
      const received = Number(
        data.received_qty ?? data.receivedQty ?? data.received ?? data.RECEIVED_QTY ?? data.ReceivedQty ?? 0,
      );

      // Extract sold qty — handle multiple possible field names
      const sold = Number(
        data.sold_qty ?? data.soldQty ?? data.sold ?? data.SOLD_QTY ?? data.SoldQty ?? 0,
      );

      // Skip rows with no useful numeric data
      if (isNaN(received) && isNaN(sold)) continue;

      const safeReceived = isNaN(received) ? 0 : received;
      const safeSold = isNaN(sold) ? 0 : sold;

      totalReceivedQty += safeReceived;
      totalSoldQty += safeSold;

      // Group by category and subcategory
      const category = String(
        data.category ?? data.Category ?? data.CATEGORY ?? data.product_category ?? 'Uncategorized',
      );
      const subcategory = String(
        data.subcategory ?? data.subCategory ?? data.sub_category ?? data.SubCategory ?? data.SUB_CATEGORY ?? '',
      );

      const groupKey = `${category}||${subcategory}`;

      const existing = categoryMap.get(groupKey);
      if (existing) {
        existing.receivedQty += safeReceived;
        existing.soldQty += safeSold;
        existing.recordCount += 1;
      } else {
        categoryMap.set(groupKey, {
          category,
          subcategory: subcategory || 'N/A',
          receivedQty: safeReceived,
          soldQty: safeSold,
          recordCount: 1,
        });
      }
    }

    // Compute sell-through rate per category group
    const byCategory = Array.from(categoryMap.values()).map((group) => ({
      category: group.category,
      subcategory: group.subcategory,
      receivedQty: group.receivedQty,
      soldQty: group.soldQty,
      sellThroughRate:
        group.receivedQty > 0
          ? Math.round((group.soldQty / group.receivedQty) * 10000) / 100
          : 0,
      recordCount: group.recordCount,
    }));

    // Sort by sell-through rate descending
    byCategory.sort((a, b) => b.sellThroughRate - a.sellThroughRate);

    const overallSellThroughRate =
      totalReceivedQty > 0
        ? Math.round((totalSoldQty / totalReceivedQty) * 10000) / 100
        : 0;

    return {
      totalRecords: records.length,
      totalReceivedQty,
      totalSoldQty,
      sellThroughRate: overallSellThroughRate,
      byCategory,
      computedAt: new Date().toISOString(),
    };
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
