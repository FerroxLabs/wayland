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

import { DEFAULT_SENSITIVITY_BIAS, DEFAULT_SILENCE_MS } from '@/common/types/voiceChatPrefs';
import { useOpenVoicePrefs } from '@/renderer/hooks/voice/useOpenVoicePrefs';

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  vi.clearAllMocks();
});

describe('useOpenVoicePrefs', () => {
  it('setConversationSilence persists into tools.voiceChatPrefs.silenceOverrides and silenceMs returns the override', async () => {
    const { result } = renderHook(() => useOpenVoicePrefs());

    act(() => result.current.setConversationSilence('c1', 2400));

    await waitFor(() => expect(result.current.silenceMs('c1')).toBe(2400));

    // Allow async ConfigStorage.set to complete
    await vi.waitFor(() => {
      const stored = store['tools.voiceChatPrefs'] as { silenceOverrides?: Record<string, number> } | undefined;
      return stored?.silenceOverrides?.c1 === 2400;
    });

    const stored = store['tools.voiceChatPrefs'] as { silenceOverrides?: Record<string, number> };
    expect(stored?.silenceOverrides?.c1).toBe(2400);
  });

  it('silenceMs for an unset conversation returns the system default', async () => {
    const { result } = renderHook(() => useOpenVoicePrefs());

    act(() => result.current.setConversationSilence('c1', 2400));

    await waitFor(() => expect(result.current.silenceMs('c1')).toBe(2400));

    // 'other' has no override — should return DEFAULT_SILENCE_MS
    expect(result.current.silenceMs('other')).toBe(DEFAULT_SILENCE_MS);
  });

  it('silenceMs uses DEFAULT_SILENCE_MS when no override or system default is set', async () => {
    const { result } = renderHook(() => useOpenVoicePrefs());
    await waitFor(() => expect(result.current.silenceMs(undefined)).toBe(DEFAULT_SILENCE_MS));
  });

  it('silenceMs uses the system default from tools.voiceOpenDefaults when set', async () => {
    store['tools.voiceOpenDefaults'] = { silenceMs: 1800 };
    const { result } = renderHook(() => useOpenVoicePrefs());
    await waitFor(() => expect(result.current.silenceMs('any')).toBe(1800));
  });

  it('setConversationSensitivity persists into tools.voiceChatPrefs.sensitivityOverrides and sensitivityBias resolves it; other conv -> default', async () => {
    const { result } = renderHook(() => useOpenVoicePrefs());

    act(() => result.current.setConversationSensitivity('c1', 0.08));

    await waitFor(() => expect(result.current.sensitivityBias('c1')).toBe(0.08));

    await vi.waitFor(() => {
      const stored = store['tools.voiceChatPrefs'] as { sensitivityOverrides?: Record<string, number> } | undefined;
      return stored?.sensitivityOverrides?.c1 === 0.08;
    });

    const stored = store['tools.voiceChatPrefs'] as { sensitivityOverrides?: Record<string, number> };
    expect(stored?.sensitivityOverrides?.c1).toBe(0.08);

    // 'other' has no override — should return DEFAULT_SENSITIVITY_BIAS
    expect(result.current.sensitivityBias('other')).toBe(DEFAULT_SENSITIVITY_BIAS);
  });
});
