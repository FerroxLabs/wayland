// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const store: Record<string, unknown> = {};
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (k: string) => store[k]),
    set: vi.fn(async (k: string, v: unknown) => {
      store[k] = v;
    }),
  },
}));

import { useVoiceChatPrefs } from '@/renderer/hooks/voice/useVoiceChatPrefs';

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  vi.clearAllMocks();
});

describe('useVoiceChatPrefs', () => {
  it('persists an override and removes it on inherit', async () => {
    const { result } = renderHook(() => useVoiceChatPrefs());
    act(() => result.current[1]('c1', 'on'));
    await waitFor(() => expect(result.current[0].overrides.c1).toBe('on'));
    expect(store['tools.voiceChatPrefs']).toEqual({ overrides: { c1: 'on' } });
    act(() => result.current[1]('c1', 'inherit'));
    await waitFor(() => expect(result.current[0].overrides.c1).toBeUndefined());
  });
});
