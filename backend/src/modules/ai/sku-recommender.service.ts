import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SkuRecommendationItem {
  productId: string;
  skuCode: string;
  productName: string;
  subCategory: string;
  color?: string;
  theme?: string;
  srp: number;
  recommendedQty: number;
  overallScore: number;
  reasoning: string;
}

export interface RecommendationResult {
  subCategoryId: string;
  budgetAmount: number;
  totalRecommendedValue: number;
  recommendations: SkuRecommendationItem[];
  warnings: string[];
}

@Injectable()
export class SkuRecommenderService {
  private readonly logger = new Logger(SkuRecommenderService.name);

  constructor(private prisma: PrismaService) {}

  async generateRecommendations(input: {
    subCategoryId: string;
    brandId?: string;
    budgetAmount: number;
    maxResults?: number;
  }): Promise<RecommendationResult> {
    const warnings: string[] = [];
    const maxResults = input.maxResults || 20;

    // Look up subcategory name for filtering by productType
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: input.subCategoryId },
      include: { category: { include: { gender: true } } },
    });

    const where: any = { isActive: true };
    if (input.brandId) where.brandId = input.brandId;

    // Filter by productType if subcategory found
    if (subCategory) {
      where.productType = {
        contains: subCategory.name,
        mode: 'insensitive',
      };
    }

    const products = await this.prisma.skuCatalog.findMany({
      where,
      include: { brand: true },
      orderBy: { skuCode: 'asc' },
    });

    if (products.length === 0) {
      warnings.push('No eligible products found for this subcategory.');
      return {
        subCategoryId: input.subCategoryId,
        budgetAmount: input.budgetAmount,
        totalRecommendedValue: 0,
        recommendations: [],
        warnings,
      };
    }

    this.logger.log(`Found ${products.length} eligible products`);

    const scored: SkuRecommendationItem[] = products.map(product => {
      const srp = Number(product.srp);
      let score = 50;
      const reasons: string[] = [];

      if (product.color) { score += 5; reasons.push('Has color info'); }
      if (product.theme) { score += 5; reasons.push('Has theme info'); }
      if (product.composition) { score += 5; reasons.push('Has composition'); }
      if (product.imageUrl) { score += 3; reasons.push('Has image'); }

      const avgPrice = input.budgetAmount / Math.min(products.length, maxResults);
      const priceRatio = srp / avgPrice;
      if (priceRatio >= 0.3 && priceRatio <= 2.0) {
        score += 15;
        reasons.push('Good price fit');
      } else if (priceRatio > 2.0) {
        score -= 10;
        reasons.push('Price may be high for budget');
      }

      return {
        productId: product.id,
        skuCode: product.skuCode,
        productName: product.productName,
        subCategory: subCategory?.name || product.productType,
        color: product.color || undefined,
        theme: product.theme || undefined,
        srp,
        recommendedQty: 0,
        overallScore: Math.min(100, Math.max(0, score)),
        reasoning: reasons.join('. ') + '.',
      };
    });

    scored.sort((a, b) => b.overallScore - a.overallScore);
    const selected = scored.slice(0, maxResults);

    this.assignQuantities(selected, input.budgetAmount);

    const totalRecommendedValue = selected.reduce(
      (sum, s) => sum + s.recommendedQty * s.srp, 0,
    );

    return {
      subCategoryId: input.subCategoryId,
      budgetAmount: input.budgetAmount,
      totalRecommendedValue,
      recommendations: selected,
      warnings,
    };
  }

  async addSelectedToProposal(productIds: string[], headerId: string): Promise<number> {
    const header = await this.prisma.proposal.findUnique({ where: { id: headerId } });
    if (!header) return 0;

    let added = 0;
    for (const productId of productIds) {
      const product = await this.prisma.skuCatalog.findUnique({ where: { id: productId } });
      if (!product) continue;

      // Check duplicate
      const existing = await this.prisma.proposalProduct.findFirst({
        where: { proposalId: headerId, skuId: productId },
      });
      if (existing) continue;

      await this.prisma.proposalProduct.create({
        data: {
          proposalId: headerId,
          skuId: productId,
          skuCode: product.skuCode,
          productName: product.productName,
          customerTarget: 'Regular',
          unitCost: product.costPrice || 0,
          srp: product.srp,
        },
      });
      added++;
    }

    return added;
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private assignQuantities(items: SkuRecommendationItem[], budgetAmount: number): void {
    if (items.length === 0) return;

    const totalScore = items.reduce((sum, s) => sum + s.overallScore, 0);
    if (totalScore === 0) return;

    for (const item of items) {
      const share = item.overallScore / totalScore;
      const budget = budgetAmount * share;
      if (item.srp > 0) {
        item.recommendedQty = Math.max(1, Math.round(budget / item.srp));
      } else {
        item.recommendedQty = 1;
      }
    }
  }
}
