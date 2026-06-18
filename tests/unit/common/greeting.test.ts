/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { buildCallGreeting } from '@/common/voice/greeting';

describe('buildCallGreeting', () => {
  describe('time-of-day part', () => {
    it('returns Morning when hour < 12', () => {
      expect(buildCallGreeting({ hour: 0, variantSeed: 0 })).toMatch(/^Morning/);
      expect(buildCallGreeting({ hour: 7, variantSeed: 0 })).toMatch(/^Morning/);
      expect(buildCallGreeting({ hour: 11, variantSeed: 0 })).toMatch(/^Morning/);
    });

    it('returns Afternoon when 12 <= hour < 18', () => {
      expect(buildCallGreeting({ hour: 12, variantSeed: 0 })).toMatch(/^Afternoon/);
      expect(buildCallGreeting({ hour: 15, variantSeed: 0 })).toMatch(/^Afternoon/);
      expect(buildCallGreeting({ hour: 17, variantSeed: 0 })).toMatch(/^Afternoon/);
    });

    it('returns Evening when hour >= 18', () => {
      expect(buildCallGreeting({ hour: 18, variantSeed: 0 })).toMatch(/^Evening/);
      expect(buildCallGreeting({ hour: 21, variantSeed: 0 })).toMatch(/^Evening/);
      expect(buildCallGreeting({ hour: 23, variantSeed: 0 })).toMatch(/^Evening/);
    });
  });

  describe('name inclusion', () => {
    it('includes spokenName in the greeting when present', () => {
      const result = buildCallGreeting({ spokenName: 'Matt', hour: 9, variantSeed: 0 });
      expect(result).toMatch(/^Morning, Matt — /);
    });

    it('omits the name cleanly when spokenName is absent', () => {
      const result = buildCallGreeting({ hour: 9, variantSeed: 0 });
      expect(result).toMatch(/^Morning — /);
      expect(result).not.toContain(',');
    });

    it('omits the name cleanly when spokenName is empty string', () => {
      const result = buildCallGreeting({ spokenName: '', hour: 9, variantSeed: 0 });
      expect(result).toMatch(/^Morning — /);
      expect(result).not.toContain(',');
    });

    it('omits the name cleanly when spokenName is whitespace only', () => {
      const result = buildCallGreeting({ spokenName: '   ', hour: 9, variantSeed: 0 });
      expect(result).toMatch(/^Morning — /);
      expect(result).not.toContain(',');
    });
  });

  describe('variantSeed determinism', () => {
    it('same variantSeed always produces the same tail', () => {
      const a = buildCallGreeting({ hour: 10, variantSeed: 2 });
      const b = buildCallGreeting({ hour: 10, variantSeed: 2 });
      expect(a).toBe(b);
    });

    it('different variantSeeds can produce different tails', () => {
      // 4 tails exist; seeds 0–3 must all differ
      const results = [0, 1, 2, 3].map((seed) => buildCallGreeting({ hour: 10, variantSeed: seed }));
      const unique = new Set(results);
      expect(unique.size).toBe(4);
    });

    it('handles negative variantSeed via Math.abs', () => {
      const pos = buildCallGreeting({ hour: 10, variantSeed: 1 });
      const neg = buildCallGreeting({ hour: 10, variantSeed: -1 });
      expect(neg).toBe(pos);
    });
  });
});
