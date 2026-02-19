// ─── Budget Business Rules Constants ─────────────────────────────────────────

/**
 * VAL-01: Maximum percentage of total budget that a single brand (store)
 * allocation can represent. Prevents any single store from consuming
 * a disproportionate share of the budget.
 *
 * Value: 0.8 = 80%
 */
export const BRAND_BUDGET_CAP_PCT = 0.8;
