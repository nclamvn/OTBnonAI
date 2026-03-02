import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MasterDataService {
  constructor(private prisma: PrismaService) {}

  async getBrands(pagination?: { page?: number; limit?: number }) {
    const where = { isActive: true };
    const orderBy = { sortOrder: 'asc' as const };

    if (pagination?.page && pagination?.limit) {
      const page = Number(pagination.page);
      const limit = Number(pagination.limit);
      const [data, total] = await Promise.all([
        this.prisma.groupBrand.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.groupBrand.count({ where }),
      ]);
      return { data, total, page, limit };
    }

    return this.prisma.groupBrand.findMany({ where, orderBy });
  }

  async getStores(pagination?: { page?: number; limit?: number }) {
    const where = { isActive: true };

    if (pagination?.page && pagination?.limit) {
      const page = Number(pagination.page);
      const limit = Number(pagination.limit);
      const [data, total] = await Promise.all([
        this.prisma.store.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.store.count({ where }),
      ]);
      return { data, total, page, limit };
    }

    return this.prisma.store.findMany({ where });
  }

  async getSeasonTypes() {
    return this.prisma.seasonType.findMany({
      where: { isActive: true },
    });
  }

  // Alias for backward compat
  async getCollections() {
    return this.getSeasonTypes();
  }

  async getGenders() {
    return this.prisma.gender.findMany({
      where: { isActive: true },
    });
  }

  async getCategories(pagination?: { page?: number; limit?: number }) {
    const where = { isActive: true };
    const include = {
      categories: {
        where: { isActive: true },
        include: {
          subCategories: {
            where: { isActive: true },
          },
        },
      },
    };

    if (pagination?.page && pagination?.limit) {
      const page = Number(pagination.page);
      const limit = Number(pagination.limit);
      const [data, total] = await Promise.all([
        this.prisma.gender.findMany({
          where,
          include,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.gender.count({ where }),
      ]);
      return { data, total, page, limit };
    }

    return this.prisma.gender.findMany({ where, include });
  }

  async getSkuCatalog(filters?: {
    productType?: string;
    brandId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;

    const where: Prisma.SkuCatalogWhereInput = { isActive: true };
    if (filters?.productType) where.productType = filters.productType;
    if (filters?.brandId) where.brandId = filters.brandId;
    if (filters?.search) {
      where.OR = [
        { skuCode: { contains: filters.search, mode: 'insensitive' } },
        { productName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.skuCatalog.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { skuCode: 'asc' },
      }),
      this.prisma.skuCatalog.count({ where }),
    ]);

    return {
      data,
      meta: { page: Number(page), pageSize: Number(pageSize), total, totalPages: Math.ceil(total / Number(pageSize)) },
    };
  }

  async getSeasonGroups(year?: number) {
    const where: any = {};
    if (year) where.year = year;
    return this.prisma.seasonGroup.findMany({
      where,
      include: { seasons: true },
      orderBy: { year: 'desc' },
    });
  }

  async getSeasonsByGroup(seasonGroupId: string) {
    return this.prisma.season.findMany({
      where: { seasonGroupId },
      orderBy: { name: 'asc' },
    });
  }

  async getSubCategoriesDirect(params?: { categoryId?: string; genderId?: string }) {
    const where: any = { isActive: true };
    if (params?.categoryId) where.categoryId = params.categoryId;
    if (params?.genderId) {
      where.category = { genderId: params.genderId };
    }
    return this.prisma.subCategory.findMany({
      where,
      include: { category: { include: { gender: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getSubcategorySizes(subCategoryId: string) {
    return this.prisma.subcategorySize.findMany({
      where: { subCategoryId },
      orderBy: { name: 'asc' },
    });
  }

  async getApprovalStatuses() {
    return this.prisma.approvalStatus.findMany({
      where: { isActive: true },
    });
  }

  async getFiscalYears() {
    const budgets = await this.prisma.budget.findMany({
      where: { deletedAt: null },
      select: { fiscalYear: true },
      distinct: ['fiscalYear'],
      orderBy: { fiscalYear: 'desc' },
    });
    return budgets.map(b => b.fiscalYear);
  }

  // Season config (static fallback)
  getSeasonConfig() {
    return {
      seasonGroups: [
        { id: 'SS', name: 'Spring Summer', subSeasons: ['Pre', 'Main'] },
        { id: 'FW', name: 'Fall Winter', subSeasons: ['Pre', 'Main'] },
      ],
    };
  }
}
