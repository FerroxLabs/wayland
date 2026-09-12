import { describe, expect, it } from 'vitest';
import {
  recommendBackend,
  resolveAvailableBackends,
} from '@process/team/backends/resolveAvailableBackends';

describe('resolveAvailableBackends', () => {
  it('includes detected CLIs plus the bundled fuigo fallback', () => {
    const result = resolveAvailableBackends(['claude', 'gemini']);
    expect(result).toContain('claude');
    expect(result).toContain('gemini');
    expect(result).toContain('fuigo');
    expect(result.length).toBe(3);
  });

  it('returns just fuigo when nothing is detected', () => {
    expect(resolveAvailableBackends([])).toEqual(['fuigo']);
  });

  it('does not duplicate fuigo when it is already detected', () => {
    expect(resolveAvailableBackends(['fuigo'])).toEqual(['fuigo']);
  });
});

describe('recommendBackend', () => {
  it('returns the preset backend when it is detected', () => {
    expect(recommendBackend(['claude', 'gemini'], 'claude')).toBe('claude');
  });

  it('falls back to fuigo when the preset backend is not detected', () => {
    expect(recommendBackend(['gemini'], 'claude')).toBe('fuigo');
  });

  it('falls back to fuigo when no preset is supplied', () => {
    expect(recommendBackend([], undefined)).toBe('fuigo');
  });
});
