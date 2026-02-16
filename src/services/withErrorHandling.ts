// ═══════════════════════════════════════════════════════════════════════════
// Service Error Handling Wrapper
// Reduces duplicate try/catch blocks across all services
// ═══════════════════════════════════════════════════════════════════════════

export interface ServiceError {
  code: string;
  message: string;
  status?: number;
  originalError?: Error;
}

/**
 * Wrap an async service method with standardized error handling.
 *
 * Usage:
 *   getAll: withErrorHandling('budgetService.getAll', async (filters) => {
 *     const response = await api.get('/budgets', { params: filters });
 *     return extract(response);
 *   }),
 */
export function withErrorHandling<TArgs extends any[], TReturn>(
  name: string,
  fn: (...args: TArgs) => Promise<TReturn>,
  options: { fallback?: TReturn } = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      return await fn(...args);
    } catch (err: any) {
      console.error(`[${name}]`, err?.response?.status, err?.message);

      if (options.fallback !== undefined) {
        return options.fallback;
      }

      throw err;
    }
  };
}

export default withErrorHandling;
