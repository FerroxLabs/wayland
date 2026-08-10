import { describe, it, expect } from 'vitest';
import { getFluxCompat } from '@/common/types/acpTypes';

describe('hermes flux capability', () => {
  it('classifies hermes as setup (config-file routable)', () => {
    expect(getFluxCompat('hermes')).toBe('setup');
  });
});

describe('kimi flux capability', () => {
  // Verified by execution against the real binary: Kimi Code's config.toml takes
  // a generic `type = "openai"` provider, and env injection registers nothing.
  it('classifies kimi as setup (config-file routable, not vendor-locked)', () => {
    expect(getFluxCompat('kimi')).toBe('setup');
  });
});
