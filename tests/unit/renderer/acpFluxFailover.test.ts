/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { routeThroughFluxAndReplay } from '@/renderer/pages/conversation/platforms/acp/acpFluxFailover';

const baseDeps = () => ({
  conversationId: 'c1',
  pendingTurn: { input: 'hello', files: ['/a.png'] },
  connectFlux: vi.fn().mockResolvedValue({ ok: true }),
  switchToFlux: vi.fn().mockResolvedValue(true),
  replay: vi.fn(),
  clearCard: vi.fn(),
  onError: vi.fn(),
});

describe('routeThroughFluxAndReplay', () => {
  it('connects, switches to flux, replays the failed turn, then clears the card', async () => {
    const d = baseDeps();
    const order: string[] = [];
    d.switchToFlux.mockImplementation(async () => {
      order.push('switch');
      return true;
    });
    d.replay.mockImplementation(() => {
      order.push('replay');
    });
    d.clearCard.mockImplementation(() => {
      order.push('clear');
    });
    const res = await routeThroughFluxAndReplay(d);
    expect(res).toBe(true);
    expect(d.connectFlux).toHaveBeenCalledOnce();
    expect(d.switchToFlux).toHaveBeenCalledWith('c1');
    expect(d.replay).toHaveBeenCalledWith({ input: 'hello', files: ['/a.png'] });
    // model switch completes, then replay, then the card clears (only on success)
    expect(order).toEqual(['switch', 'replay', 'clear']);
    expect(d.onError).not.toHaveBeenCalled();
  });

  it('keeps the card up and does nothing else when connectFlux fails', async () => {
    const d = baseDeps();
    d.connectFlux.mockResolvedValue({ ok: false });
    const res = await routeThroughFluxAndReplay(d);
    expect(res).toBe(false);
    expect(d.switchToFlux).not.toHaveBeenCalled();
    expect(d.replay).not.toHaveBeenCalled();
    expect(d.clearCard).not.toHaveBeenCalled(); // card stays up as feedback
    expect(d.onError).not.toHaveBeenCalled(); // connect flow owns its own UI
  });

  it('keeps the card up and surfaces an error when the model switch fails', async () => {
    const d = baseDeps();
    d.switchToFlux.mockResolvedValue(false);
    const res = await routeThroughFluxAndReplay(d);
    expect(res).toBe(false);
    expect(d.clearCard).not.toHaveBeenCalled(); // not stranded: card stays up
    expect(d.onError).toHaveBeenCalledWith('switch');
    expect(d.replay).not.toHaveBeenCalled();
  });

  it('clears the card without replaying when there is no captured turn', async () => {
    const d = { ...baseDeps(), pendingTurn: null };
    const res = await routeThroughFluxAndReplay(d);
    expect(res).toBe(true);
    expect(d.switchToFlux).toHaveBeenCalled();
    expect(d.replay).not.toHaveBeenCalled();
    expect(d.clearCard).toHaveBeenCalledOnce();
  });

  it('is re-entrancy guarded: a second concurrent call is a no-op while the first runs', async () => {
    const d = baseDeps();
    let resolveSwitch: (v: boolean) => void = () => {};
    d.switchToFlux.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSwitch = resolve;
        })
    );
    const first = routeThroughFluxAndReplay(d);
    const second = await routeThroughFluxAndReplay(d); // fires while first is mid-flight
    expect(second).toBe(false);
    expect(d.connectFlux).toHaveBeenCalledOnce(); // second call short-circuited
    resolveSwitch(true);
    await first;
    expect(d.replay).toHaveBeenCalledOnce();
    expect(d.clearCard).toHaveBeenCalledOnce();
  });
});
