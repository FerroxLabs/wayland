import type { DetectionResult } from '../types';
import { SORTED_PATTERNS, SK_BARE_CANDIDATES } from './providerKeyPatterns';

/**
 * Pure-function provider detection from a raw API key string.
 * No I/O - structural/prefix matching only.
 * Bare sk- keys return `ambiguous-sk`; caller must invoke SkRaceResolver.
 */
export class ProviderDetector {
  detect(key: string): DetectionResult {
    const trimmed = key.trim();
    if (!trimmed) return { kind: 'unknown' };

    for (const rule of SORTED_PATTERNS) {
      if (!rule.test(trimmed)) continue;

      if (rule.match === 'unique') {
        return { kind: 'unique', provider: rule.provider, confidence: 'high' };
      }
      if (rule.match === 'multi-field') {
        return {
          kind: 'multi-field',
          provider: rule.provider,
          requiredFields: rule.requiredFields ?? [],
        };
      }
      if (rule.match === 'structural') {
        return { kind: 'structural', provider: rule.provider, confidence: 'medium' };
      }
    }

    // Bare sk- (no specific sub-prefix matched above)
    if (trimmed.startsWith('sk-')) {
      return { kind: 'ambiguous-sk', candidates: SK_BARE_CANDIDATES };
    }

    return { kind: 'unknown' };
  }
}
