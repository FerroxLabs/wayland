/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const bridge = vi.hoisted(() => ({
  hold: vi.fn(async () => ({ id: 'id-1' })),
  peek: vi.fn(async () => ({ hasPending: false }) as { hasPending: boolean; id?: string }),
  take: vi.fn(
    async () =>
      null as { id: string; conversationId: string; message: string; files: string[]; createdAt: number } | null
  ),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    pendingSend: {
      hold: { invoke: bridge.hold },
      peek: { invoke: bridge.peek },
      take: { invoke: bridge.take },
    },
  },
}));

import { usePendingSendOnWake } from '@renderer/hooks/chat/usePendingSendOnWake';

beforeEach(() => {
  bridge.hold.mockClear().mockResolvedValue({ id: 'id-1' });
  bridge.peek.mockClear().mockResolvedValue({ hasPending: false });
  bridge.take.mockClear().mockResolvedValue(null);
});

describe('usePendingSendOnWake', () => {
  it('does not hold and returns false when the engine is awake', async () => {
    const execute = vi.fn(async () => {});
    const { result } = renderHook(() =>
      usePendingSendOnWake({ conversationId: 'c1', asleep: false, ready: true, execute })
    );
    let held: boolean | undefined;
    await act(async () => {
      held = await result.current.holdIfAsleep('hello', ['/a.txt']);
    });
    expect(held).toBe(false);
    expect(bridge.hold).not.toHaveBeenCalled();
  });

  it('holds the message in the main process and returns true when asleep', async () => {
    const execute = vi.fn(async () => {});
    const { result } = renderHook(() =>
      usePendingSendOnWake({ conversationId: 'c1', asleep: true, ready: false, execute })
    );
    let held: boolean | undefined;
    await act(async () => {
      held = await result.current.holdIfAsleep('hello', ['/a.txt']);
    });
    expect(held).toBe(true);
    expect(bridge.hold).toHaveBeenCalledWith({ conversationId: 'c1', message: 'hello', files: ['/a.txt'] });
  });

  it('auto-fires the held send exactly once when the engine is ready', async () => {
    bridge.peek.mockResolvedValue({ hasPending: true, id: 'id-1' });
    bridge.take.mockResolvedValue({
      id: 'id-1',
      conversationId: 'c1',
      message: 'queued',
      files: ['/b.txt'],
      createdAt: 1,
    });
    const execute = vi.fn(async () => {});
    renderHook(() => usePendingSendOnWake({ conversationId: 'c1', asleep: false, ready: true, execute }));
    await waitFor(() => expect(execute).toHaveBeenCalledWith({ input: 'queued', files: ['/b.txt'] }));
    expect(bridge.take).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('does not auto-fire when nothing is held', async () => {
    bridge.peek.mockResolvedValue({ hasPending: false });
    const execute = vi.fn(async () => {});
    renderHook(() => usePendingSendOnWake({ conversationId: 'c1', asleep: false, ready: true, execute }));
    await waitFor(() => expect(bridge.peek).toHaveBeenCalled());
    expect(bridge.take).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('never peeks or fires while the engine is still asleep', async () => {
    bridge.peek.mockResolvedValue({ hasPending: true, id: 'id-1' });
    const execute = vi.fn(async () => {});
    renderHook(() => usePendingSendOnWake({ conversationId: 'c1', asleep: true, ready: false, execute }));
    // give any (incorrect) effect a chance to run
    await new Promise((r) => setTimeout(r, 10));
    expect(bridge.peek).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
