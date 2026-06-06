import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/renderer/hooks/assistant/useDetectedAgents', () => ({
  useDetectedAgents: () => ({
    availableBackends: [
      { id: 'claude', name: 'Claude' },
      { id: 'gemini', name: 'Gemini' },
    ],
    refreshAgentDetection: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { useAvailableBackends } from '@/renderer/hooks/assistant/useAvailableBackends';

describe('useAvailableBackends', () => {
  it('exposes available list (detected ∪ wayland-core) and a recommend() function', () => {
    const { result } = renderHook(() => useAvailableBackends());

    expect(Array.isArray(result.current.available)).toBe(true);
    expect(result.current.available).toContain('claude');
    expect(result.current.available).toContain('gemini');
    expect(result.current.available).toContain('wayland-core');
    expect(result.current.available.length).toBe(3);

    expect(typeof result.current.recommend).toBe('function');
    expect(result.current.recommend('claude')).toBe('claude');
    expect(result.current.recommend('codex')).toBe('wayland-core');
    expect(result.current.recommend(undefined)).toBe('wayland-core');
  });
});
