import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// SWR returns `data: undefined` until the fetch resolves - and again on an
// error with no cached data. That window is what this test pins.
vi.mock('swr', () => ({
  default: () => ({ data: undefined }),
  mutate: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: { acpConversation: { refreshCustomAgents: { invoke: vi.fn() } } },
}));

vi.mock('@/renderer/utils/model/agentTypes', () => ({
  DETECTED_AGENTS_SWR_KEY: 'detected-agents',
  fetchDetectedAgents: vi.fn(),
}));

import { useDetectedAgents } from '@/renderer/hooks/assistant/useDetectedAgents';

describe('useDetectedAgents', () => {
  /**
   * Regression: a `data: rawAgents = []` default builds a NEW array on every
   * render while SWR is unresolved. That identity churn propagated through
   * useAvailableBackends -> recommend() -> TeamLauncherPage's `initialState`
   * memo into a `setState`-in-effect feedback loop, which React kills with
   * "Maximum update depth exceeded" (#185). The app then sat in its root error
   * boundary showing "Something went wrong" until a manual reload.
   */
  it('keeps availableBackends referentially stable while detection is unresolved', () => {
    const { result, rerender } = renderHook(() => useDetectedAgents());

    const first = result.current.availableBackends;
    rerender();
    rerender();

    expect(result.current.availableBackends).toBe(first);
  });
});
