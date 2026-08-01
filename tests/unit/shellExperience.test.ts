import { describe, expect, it } from 'vitest';
import { resolveShellExperience } from '@/common/shellExperience';

describe('shell experience compatibility', () => {
  it('keeps existing, missing, and corrupt preferences on Classic', () => {
    expect(resolveShellExperience(undefined)).toBe('classic');
    expect(resolveShellExperience(null)).toBe('classic');
    expect(resolveShellExperience('classic')).toBe('classic');
    expect(resolveShellExperience('future-shell')).toBe('classic');
    expect(resolveShellExperience({ shell: 'cockpit' })).toBe('classic');
  });

  it('selects Cockpit only after an explicit valid preference', () => {
    expect(resolveShellExperience('cockpit')).toBe('cockpit');
  });
});
