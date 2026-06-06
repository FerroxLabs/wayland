import { describe, expect, it } from 'vitest';
import {
  recommendBackend,
  resolveAvailableBackends,
} from '@process/team/backends/resolveAvailableBackends';

describe('resolveAvailableBackends', () => {
  it('includes detected CLIs plus wayland-core fallback', () => {
    const result = resolveAvailableBackends(['claude', 'gemini']);
    expect(result).toContain('claude');
    expect(result).toContain('gemini');
    expect(result).toContain('wayland-core');
    expect(result.length).toBe(3);
  });

  it('returns just wayland-core when nothing is detected', () => {
    expect(resolveAvailableBackends([])).toEqual(['wayland-core']);
  });

  it('does not duplicate wayland-core when it is already detected', () => {
    expect(resolveAvailableBackends(['wayland-core'])).toEqual(['wayland-core']);
  });
});

describe('recommendBackend', () => {
  it('returns the preset backend when it is detected', () => {
    expect(recommendBackend(['claude', 'gemini'], 'claude')).toBe('claude');
  });

  it('falls back to wayland-core when the preset backend is not detected', () => {
    expect(recommendBackend(['gemini'], 'claude')).toBe('wayland-core');
  });

  it('falls back to wayland-core when no preset is supplied', () => {
    expect(recommendBackend([], undefined)).toBe('wayland-core');
  });
});
