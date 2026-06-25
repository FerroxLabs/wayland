import { describe, it, expect } from 'vitest';
import { getFluxCompat } from '@/common/types/acpTypes';

describe('hermes flux capability', () => {
  it('classifies hermes as setup (config-file routable)', () => {
    expect(getFluxCompat('hermes')).toBe('setup');
  });
});
