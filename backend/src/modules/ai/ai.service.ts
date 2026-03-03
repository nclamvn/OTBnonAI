import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SizeRecommendation {
  sizeName: string;
  recommendedPct: number;
  recommendedQty: number;
  confidence: number;
  reasoning: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate optimal size curve for a subcategory at a store.
   * Uses subcategory sizes and returns recommended distribution.
   */
  async calculateSizeCurve(
    subCategoryId: string,
    storeId: string,
    totalOrderQty: number,
  ): Promise<SizeRecommendation[]> {
    // Get available sizes for the subcategory
    const sizes = await this.prisma.subcategorySize.findMany({
      where: { sub_category_id: +subCategoryId },
      orderBy: { name: 'asc' },
    });

    if (sizes.length === 0) {
      return this.getDefaultCurve(totalOrderQty);
    }

    // Default bell-curve distribution for common size ranges
    const bellCurve = this.getBellCurveDistribution(sizes.length);

    return sizes.map((size, i) => {
      const pct = bellCurve[i] || (100 / sizes.length);
      const qty = Math.round(totalOrderQty * (pct / 100));

      return {
        sizeName: size.name,
        recommendedPct: Math.round(pct * 10) / 10,
        recommendedQty: qty,
        confidence: 0.7,
        reasoning: `Standard distribution for size ${size.name} based on bell-curve pattern.`,
      };
    });
  }

  /**
   * Compare user sizing input vs AI recommendation.
   */
  async compareSizeCurve(
    subCategoryId: string,
    storeId: string,
    userSizing: Record<string, number>,
  ) {
    const totalQty = Object.values(userSizing).reduce((a, b) => a + b, 0);
    if (totalQty === 0) {
      return { alignment: 'good', score: 100, deviations: [], suggestion: 'No sizing data to compare' };
    }

    const recommended = await this.calculateSizeCurve(subCategoryId, storeId, totalQty);

    const deviations = recommended.map(rec => {
      const userQty = userSizing[rec.sizeName] || 0;
      const userPct = (userQty / totalQty) * 100;
      return {
        sizeName: rec.sizeName,
        userPct: Math.round(userPct * 10) / 10,
        recommendedPct: rec.recommendedPct,
        deviation: Math.round(Math.abs(userPct - rec.recommendedPct) * 10) / 10,
      };
    });

    const avgDeviation = deviations.reduce((sum, d) => sum + d.deviation, 0) / (deviations.length || 1);
    const score = Math.max(0, Math.round(100 - avgDeviation * 2));

    let alignment: 'good' | 'warning' | 'risk';
    let suggestion: string;

    if (avgDeviation <= 5) {
      alignment = 'good';
      suggestion = 'Size allocation aligns well with recommended patterns';
    } else if (avgDeviation <= 15) {
      alignment = 'warning';
      const worst = deviations.reduce((a, b) => (a.deviation > b.deviation ? a : b));
      suggestion = `Consider adjusting size ${worst.sizeName}: you have ${worst.userPct.toFixed(0)}% vs recommended ${worst.recommendedPct.toFixed(0)}%`;
    } else {
      alignment = 'risk';
      suggestion = 'Significant deviation from recommended patterns. Review size allocation to avoid stockout/deadstock.';
    }

    return { alignment, score, deviations, suggestion };
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private getBellCurveDistribution(count: number): number[] {
    if (count <= 1) return [100];
    if (count === 2) return [50, 50];
    if (count === 3) return [25, 50, 25];
    if (count === 4) return [15, 35, 35, 15];
    if (count === 5) return [10, 20, 40, 20, 10];
    if (count === 6) return [5, 15, 30, 30, 15, 5];

    // Generic bell curve for larger counts
    const center = (count - 1) / 2;
    const sigma = count / 4;
    const raw = Array.from({ length: count }, (_, i) =>
      Math.exp(-0.5 * Math.pow((i - center) / sigma, 2)),
    );
    const total = raw.reduce((a, b) => a + b, 0);
    return raw.map(v => Math.round((v / total) * 1000) / 10);
  }

  private getDefaultCurve(totalOrderQty: number): SizeRecommendation[] {
    const sizes = ['S', 'M', 'L', 'XL'];
    const pcts = [20, 35, 30, 15];
    return sizes.map((sizeName, i) => ({
      sizeName,
      recommendedPct: pcts[i],
      recommendedQty: Math.round(totalOrderQty * (pcts[i] / 100)),
      confidence: 0.3,
      reasoning: 'No subcategory sizes found — using default S/M/L/XL distribution',
    }));
  }
}
