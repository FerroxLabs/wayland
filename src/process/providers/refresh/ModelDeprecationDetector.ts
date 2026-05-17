import type { ProviderRepository } from '../storage/ProviderRepository';
import type { ProviderModel } from '../types';

/**
 * Non-destructive deprecation marking.
 * Call after a fresh catalog fetch to mark models removed from the live list.
 * Deprecated models are kept in the DB so ongoing conversations stay functional.
 */
export class ModelDeprecationDetector {
  constructor(private readonly repo: ProviderRepository) {}

  /**
   * Compare freshly-fetched models against the stored catalog for a provider.
   * Marks any stored model not present in the fresh list as deprecated.
   * Returns the count of newly deprecated models.
   */
  detectAndMark(catalogId: string, freshModels: ProviderModel[]): number {
    const stored = this.repo.listModels(catalogId);
    const freshIds = new Set(freshModels.map((m) => m.id));
    let count = 0;
    for (const m of stored) {
      if (!m.deprecated && !freshIds.has(m.id)) {
        this.repo.markDeprecated(catalogId, m.id);
        count++;
      }
    }
    if (count > 0) {
      console.log(`[ModelDeprecationDetector] Marked ${count} deprecated models in catalog ${catalogId}`);
    }
    return count;
  }
}
