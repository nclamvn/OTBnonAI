import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  status: 'good' | 'warning' | 'risk';
  details: string;
  recommendation?: string;
}

export interface RiskAssessmentResult {
  entityType: string;
  entityId: string;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  warnings: string[];
  recommendation: string;
}

@Injectable()
export class RiskScoringService {
  private readonly logger = new Logger(RiskScoringService.name);

  constructor(private prisma: PrismaService) {}

  async assessProposal(headerId: string): Promise<RiskAssessmentResult> {
    const header = await this.prisma.proposal.findUnique({
      where: { id: headerId },
      include: {
        products: {
          include: {
            sku: {
              include: { brand: true },
            },
            allocations: { include: { store: true } },
          },
        },
        proposalSizingHeaders: {
          include: {
            proposalSizings: {
              include: { proposalProduct: { select: { id: true, skuId: true } } },
            },
          },
        },
      },
    });

    if (!header) throw new NotFoundException(`Proposal ${headerId} not found`);

    this.logger.log(`Assessing risk for proposal ${headerId}`);

    const warnings: string[] = [];
    const products = header.products;
    const sizingHeaders = header.proposalSizingHeaders || [];

    const factors: RiskFactor[] = [
      this.assessSkuDiversity(products, warnings),
      this.assessStoreAllocation(products, warnings),
      this.assessSizingCoverage(products, sizingHeaders, warnings),
      this.assessMarginImpact(products, warnings),
      this.assessCategoryBalance(products, warnings),
    ];

    const overallScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
    const roundedScore = Math.round(overallScore * 10) / 10;
    const riskLevel = this.getRiskLevel(roundedScore);
    const recommendation = this.generateRecommendation(factors, riskLevel, warnings);

    return {
      entityType: 'proposal',
      entityId: headerId,
      overallScore: roundedScore,
      riskLevel,
      factors,
      warnings,
      recommendation,
    };
  }

  // ── Factor Assessments ────────────────────────────────────────────────

  private assessSkuDiversity(products: any[], warnings: string[]): RiskFactor {
    const count = products.length;

    if (count === 0) {
      warnings.push('No products in proposal');
      return { name: 'SKU Diversity', score: 2, weight: 0.25, status: 'risk', details: 'No products in proposal.' };
    }

    const categories = new Set(products.map(p => p.category || 'Unknown'));
    const catCount = categories.size;

    if (catCount === 1 && count < 5) {
      return { name: 'SKU Diversity', score: 4, weight: 0.25, status: 'risk', details: `Only ${count} SKUs in 1 category. High concentration.`, recommendation: 'Diversify across categories.' };
    }
    if (catCount <= 2) {
      return { name: 'SKU Diversity', score: 6, weight: 0.25, status: 'warning', details: `${count} SKUs across ${catCount} categories. Limited diversity.` };
    }

    return { name: 'SKU Diversity', score: 9, weight: 0.25, status: 'good', details: `${count} SKUs across ${catCount} categories. Good diversity.` };
  }

  private assessStoreAllocation(products: any[], warnings: string[]): RiskFactor {
    const totalAllocations = products.reduce((sum, p) => sum + (p.allocations?.length || 0), 0);
    const withAllocations = products.filter(p => p.allocations?.length > 0).length;
    const allocationRate = products.length > 0 ? (withAllocations / products.length) * 100 : 0;

    if (allocationRate === 0) {
      warnings.push('No store allocations defined');
      return { name: 'Store Allocation', score: 4, weight: 0.2, status: 'risk', details: 'No store allocations set.', recommendation: 'Define store-level allocations.' };
    }
    if (allocationRate < 50) {
      return { name: 'Store Allocation', score: 6, weight: 0.2, status: 'warning', details: `${allocationRate.toFixed(0)}% of SKUs have allocations.` };
    }

    return { name: 'Store Allocation', score: 9, weight: 0.2, status: 'good', details: `${allocationRate.toFixed(0)}% coverage with ${totalAllocations} allocations.` };
  }

  private assessSizingCoverage(products: any[], sizingHeaders: any[], warnings: string[]): RiskFactor {
    const productIdsWithSizing = new Set<string>();
    for (const sh of sizingHeaders) {
      for (const ps of (sh.proposalSizings || [])) {
        productIdsWithSizing.add(String(ps.proposalProduct?.id || ps.proposalProductId));
      }
    }
    const withSizings = products.filter(p => productIdsWithSizing.has(String(p.id))).length;
    const sizingRate = products.length > 0 ? (withSizings / products.length) * 100 : 0;

    if (sizingRate === 0) {
      return { name: 'Sizing Coverage', score: 5, weight: 0.2, status: 'warning', details: 'No sizing data defined.', recommendation: 'Add sizing data for better inventory planning.' };
    }
    if (sizingRate < 50) {
      return { name: 'Sizing Coverage', score: 6.5, weight: 0.2, status: 'warning', details: `${sizingRate.toFixed(0)}% of SKUs have sizing data.` };
    }

    return { name: 'Sizing Coverage', score: 9, weight: 0.2, status: 'good', details: `${sizingRate.toFixed(0)}% sizing coverage.` };
  }

  private assessMarginImpact(products: any[], warnings: string[]): RiskFactor {
    if (products.length === 0) {
      return { name: 'Margin Impact', score: 5, weight: 0.2, status: 'warning', details: 'No data.' };
    }

    let totalCost = 0;
    let totalSrp = 0;

    for (const p of products) {
      const qty = p.allocations?.reduce((s: number, a: any) => s + Number(a.quantity), 0) || 1;
      totalCost += Number(p.unitCost) * qty;
      totalSrp += Number(p.srp) * qty;
    }

    if (totalSrp === 0) {
      return { name: 'Margin Impact', score: 5, weight: 0.2, status: 'warning', details: 'No SRP data.' };
    }

    const margin = ((totalSrp - totalCost) / totalSrp) * 100;

    if (margin >= 60) return { name: 'Margin Impact', score: 9.5, weight: 0.2, status: 'good', details: `Excellent margin: ${margin.toFixed(1)}%.` };
    if (margin >= 45) return { name: 'Margin Impact', score: 8, weight: 0.2, status: 'good', details: `Healthy margin: ${margin.toFixed(1)}%.` };
    if (margin >= 30) return { name: 'Margin Impact', score: 5.5, weight: 0.2, status: 'warning', details: `Below-target margin: ${margin.toFixed(1)}%.`, recommendation: 'Review pricing.' };

    warnings.push(`Low margin: ${margin.toFixed(1)}%`);
    return { name: 'Margin Impact', score: 3, weight: 0.2, status: 'risk', details: `Critical margin: ${margin.toFixed(1)}%.`, recommendation: 'Urgently review costs and pricing.' };
  }

  private assessCategoryBalance(products: any[], warnings: string[]): RiskFactor {
    if (products.length === 0) {
      return { name: 'Category Balance', score: 5, weight: 0.15, status: 'warning', details: 'No data.' };
    }

    const catMap = new Map<string, number>();
    for (const p of products) {
      const cat = p.category || 'Unknown';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    }

    const maxPct = (Math.max(...catMap.values()) / products.length) * 100;

    if (maxPct > 70) {
      return { name: 'Category Balance', score: 4, weight: 0.15, status: 'risk', details: `Dominant category at ${maxPct.toFixed(0)}%.`, recommendation: 'Redistribute across categories.' };
    }
    if (maxPct > 50) {
      return { name: 'Category Balance', score: 7, weight: 0.15, status: 'good', details: `Top category at ${maxPct.toFixed(0)}%. Acceptable.` };
    }

    return { name: 'Category Balance', score: 9, weight: 0.15, status: 'good', details: `Well-balanced. Max category at ${maxPct.toFixed(0)}%.` };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 4) return 'critical';
    if (score < 6) return 'high';
    if (score < 8) return 'medium';
    return 'low';
  }

  private generateRecommendation(factors: RiskFactor[], riskLevel: string, warnings: string[]): string {
    const parts: string[] = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      parts.push(`This proposal carries ${riskLevel} risk and requires careful review.`);
    } else if (riskLevel === 'medium') {
      parts.push('This proposal has moderate risk. Review flagged areas.');
    } else {
      parts.push('This proposal appears low-risk and well-structured.');
    }

    const recs = factors.filter(f => f.recommendation).map(f => f.recommendation!);
    if (recs.length > 0) parts.push('Actions: ' + recs.join(' '));

    return parts.join(' ');
  }
}
