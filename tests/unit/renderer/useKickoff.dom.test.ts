/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const suggestMock = vi.fn();
const telemetryMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/common', () => ({
  ipcBridge: {
    kickoff: {
      suggest: { invoke: (...a: unknown[]) => suggestMock(...a) },
      telemetry: { invoke: (...a: unknown[]) => telemetryMock(...a) },
    },
  },
}));

import { useKickoff, __resetKickoffSessionDismissForTests } from '@/renderer/hooks/kickoff/useKickoff';

const makeSuggestion = (overrides?: Partial<Parameters<typeof Object.assign>[0]>) => ({
  cascadeLevel: 3,
  cascadeReason: 'cold-start-library',
  kickoffId: 'morning-cold',
  text: 'Want me to surface the decision?',
  prefill: 'Surface the decision.',
  alternates: [
    { kickoffId: 'alt-1', text: 'Want me to prep 1:1 agendas?', prefill: 'Prep 1:1 agendas.' },
    { kickoffId: 'alt-2', text: 'Want me to retro the week?', prefill: 'Retro the week.' },
  ],
  ...overrides,
});

beforeEach(() => {
  suggestMock.mockReset();
  telemetryMock.mockClear();
  __resetKickoffSessionDismissForTests();
});

describe('useKickoff', () => {
  it('fetches a suggestion on mount + exposes it as visible', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current.currentText).toMatch(/surface the decision/i);
    expect(suggestMock).toHaveBeenCalledWith({ assistantId: 'helm' });
  });

  it('handles notRendered by hiding the card and firing telemetry', async () => {
    suggestMock.mockResolvedValue({ notRendered: 'no-kickoffs-defined' });
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(telemetryMock).toHaveBeenCalled());
    expect(result.current.visible).toBe(false);
    expect(telemetryMock).toHaveBeenCalledWith(expect.objectContaining({ event: 'not_rendered' }));
  });

  it('accept() returns the prefill, fires accepted telemetry, and dismisses', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    let prefill: string | undefined;
    act(() => {
      prefill = result.current.accept();
    });
    expect(prefill).toBe('Surface the decision.');
    expect(telemetryMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'accepted', kickoffId: 'morning-cold' })
    );
    expect(result.current.visible).toBe(false);
  });

  it('redirect() rotates through alternates then exhausts to dismiss', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => {
      result.current.redirect();
    });
    expect(result.current.currentText).toMatch(/prep 1:1 agendas/i);
    act(() => {
      result.current.redirect();
    });
    expect(result.current.currentText).toMatch(/retro the week/i);
    act(() => {
      // Third redirect with 2 alternates → ladder exhausted, dismiss.
      result.current.redirect();
    });
    expect(result.current.visible).toBe(false);
  });

  it('accept after redirect uses the rotated alternate prefill', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => {
      result.current.redirect();
    });
    let prefill: string | undefined;
    act(() => {
      prefill = result.current.accept();
    });
    expect(prefill).toBe('Prep 1:1 agendas.');
    expect(telemetryMock).toHaveBeenCalledWith(expect.objectContaining({ event: 'accepted', kickoffId: 'alt-1' }));
  });

  it('dismissByInteraction fires dismissed telemetry and hides the card', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => {
      result.current.dismissByInteraction();
    });
    expect(result.current.visible).toBe(false);
    expect(telemetryMock).toHaveBeenCalledWith(expect.objectContaining({ event: 'dismissed' }));
  });

  it('per-session dismiss persists across remount for the same assistantId', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const first = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(first.result.current.visible).toBe(true));
    act(() => {
      first.result.current.dismissByInteraction();
    });
    first.unmount();
    suggestMock.mockClear();
    const second = renderHook(() => useKickoff('helm'));
    // Should NOT re-fetch and should NOT become visible.
    await waitFor(() => expect(second.result.current.visible).toBe(false));
    expect(suggestMock).not.toHaveBeenCalled();
  });

  it('switching assistantId triggers a fresh fetch + new suggestion', async () => {
    suggestMock
      .mockResolvedValueOnce(makeSuggestion({ kickoffId: 'helm-a', text: 'helm card' }))
      .mockResolvedValueOnce(makeSuggestion({ kickoffId: 'sales-a', text: 'sales card' }));
    const { result, rerender } = renderHook(({ id }: { id: string }) => useKickoff(id), {
      initialProps: { id: 'helm' },
    });
    await waitFor(() => expect(result.current.currentText).toBe('helm card'));
    rerender({ id: 'sales' });
    await waitFor(() => expect(result.current.currentText).toBe('sales card'));
    expect(suggestMock).toHaveBeenCalledWith({ assistantId: 'helm' });
    expect(suggestMock).toHaveBeenCalledWith({ assistantId: 'sales' });
  });

  it('undefined assistantId yields invisible state with no IPC call', async () => {
    const { result } = renderHook(() => useKickoff(undefined));
    expect(result.current.visible).toBe(false);
    expect(suggestMock).not.toHaveBeenCalled();
  });

  // -- TEST-3 ★ - dismissByTyping distinct telemetry path
  it('dismissByTyping fires dismissed telemetry with dismissReason=typing and hides the card', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => {
      result.current.dismissByTyping();
    });
    expect(result.current.visible).toBe(false);
    expect(telemetryMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'dismissed', dismissReason: 'typing' })
    );
  });

  it('dismissByTyping adds to the per-session set so remount does not re-fetch', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const first = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(first.result.current.visible).toBe(true));
    act(() => {
      first.result.current.dismissByTyping();
    });
    first.unmount();
    suggestMock.mockClear();
    const second = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(second.result.current.visible).toBe(false));
    expect(suggestMock).not.toHaveBeenCalled();
  });

  it('dismissByInteraction fires telemetry with dismissReason=interaction (distinct from typing)', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => {
      result.current.dismissByInteraction();
    });
    expect(telemetryMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'dismissed', dismissReason: 'interaction' })
    );
  });

  // -- E-M-1 - assistantId switch mid-flight: stale resolve must NOT overwrite
  it('drops a stale suggest response if assistantId switched before it resolved', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined;
    const firstResponse = new Promise<unknown>((resolve) => {
      resolveFirst = resolve;
    });
    suggestMock
      .mockImplementationOnce(() => firstResponse)
      .mockResolvedValueOnce(makeSuggestion({ kickoffId: 'sales-card', text: 'sales text' }));
    const { result, rerender } = renderHook(({ id }: { id: string }) => useKickoff(id), {
      initialProps: { id: 'helm' },
    });
    // First fetch is in-flight (unresolved). Switch to sales.
    rerender({ id: 'sales' });
    await waitFor(() => expect(result.current.currentText).toBe('sales text'));
    // Now resolve the helm response - should be ignored by the stale guard.
    act(() => {
      resolveFirst!(makeSuggestion({ kickoffId: 'helm-stale', text: 'stale helm text' }));
    });
    // Give it a tick for the resolved promise to settle.
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.currentText).toBe('sales text');
  });

  // -- E-M-2 / D-M-5 - IPC rejection branch fires ipc-error telemetry
  it('IPC rejection hides the card and fires not_rendered telemetry with reason ipc-error', async () => {
    suggestMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(telemetryMock).toHaveBeenCalled());
    expect(result.current.visible).toBe(false);
    expect(telemetryMock).toHaveBeenCalledWith({
      event: 'not_rendered',
      notRenderedReason: 'ipc-error',
    });
  });

  // -- D-M-5 - kickoffs-excluded must NOT fire telemetry (opt-out)
  it('kickoffs-excluded opt-out suppresses not_rendered telemetry', async () => {
    suggestMock.mockResolvedValue({ notRendered: 'kickoffs-excluded' });
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(false));
    // Give the microtask a chance to fire any telemetry.
    await new Promise((r) => setTimeout(r, 0));
    expect(telemetryMock).not.toHaveBeenCalled();
  });

  // -- E-M-3 - empty alternates → first redirect dismisses
  it('empty alternates array → first redirect immediately dismisses', async () => {
    suggestMock.mockResolvedValue(makeSuggestion({ alternates: [] }));
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => {
      result.current.redirect();
    });
    expect(result.current.visible).toBe(false);
  });

  // -- D-L-4 - redirect skips empty-text alternates (defense-in-depth)
  it('redirect skips alternates with empty text and lands on the next non-empty', async () => {
    suggestMock.mockResolvedValue(
      makeSuggestion({
        alternates: [
          { kickoffId: 'empty-alt', text: '', prefill: '' },
          { kickoffId: 'good-alt', text: 'good alternate text', prefill: 'good' },
        ],
      })
    );
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => {
      result.current.redirect();
    });
    // Empty alternate at index 0 was skipped; current text is the second alt.
    expect(result.current.currentText).toBe('good alternate text');
  });

  it('redirect dismisses when all remaining alternates are empty', async () => {
    suggestMock.mockResolvedValue(
      makeSuggestion({
        alternates: [
          { kickoffId: 'empty-1', text: '', prefill: '' },
          { kickoffId: 'empty-2', text: '   ', prefill: '' },
        ],
      })
    );
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => {
      result.current.redirect();
    });
    expect(result.current.visible).toBe(false);
  });

  // -- RENDERER-2 - double-fire lock on accept
  it('rapid accept(); accept() returns prefill once, undefined once; telemetry fired exactly once', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    let first: string | undefined;
    let second: string | undefined;
    act(() => {
      first = result.current.accept();
      second = result.current.accept();
    });
    expect(first).toBe('Surface the decision.');
    expect(second).toBeUndefined();
    const acceptedCalls = telemetryMock.mock.calls.filter((c) => c[0]?.event === 'accepted');
    expect(acceptedCalls).toHaveLength(1);
  });

  // -- E-M-7 - undefined assistantId: callbacks are no-ops and don't pollute the dismiss set
  it('callbacks on undefined assistantId are no-ops and do not write to the per-session set', async () => {
    const { result, unmount } = renderHook(() => useKickoff(undefined));
    act(() => {
      result.current.accept();
      result.current.redirect();
      result.current.dismissByInteraction();
      result.current.dismissByTyping();
    });
    unmount();
    // Mount again with a real id and verify the suggest IPC still fires
    // (i.e. nothing got poisoned into the dismiss set under an undefined key).
    suggestMock.mockClear();
    suggestMock.mockResolvedValue(makeSuggestion());
    const second = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(second.result.current.visible).toBe(true));
    expect(suggestMock).toHaveBeenCalledWith({ assistantId: 'helm' });
  });

  // -- E-L-10 - Lock the silent-ladder-end behavior: exactly 2 telemetry calls
  // after two successful redirects, the third one (ladder exhaustion) is silent.
  it('exhausts ladder silently - redirect telemetry called exactly twice, no dismiss telemetry on exhaustion', async () => {
    suggestMock.mockResolvedValue(makeSuggestion());
    const { result } = renderHook(() => useKickoff('helm'));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => {
      result.current.redirect();
    });
    act(() => {
      result.current.redirect();
    });
    act(() => {
      // Third redirect - exhausts the ladder (silent end).
      result.current.redirect();
    });
    const redirectCalls = telemetryMock.mock.calls.filter((c) => c[0]?.event === 'redirected');
    const dismissCalls = telemetryMock.mock.calls.filter((c) => c[0]?.event === 'dismissed');
    expect(redirectCalls).toHaveLength(2);
    expect(dismissCalls).toHaveLength(0);
    expect(result.current.visible).toBe(false);
  });
});
