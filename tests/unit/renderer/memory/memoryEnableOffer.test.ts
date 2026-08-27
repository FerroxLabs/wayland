/**
 * The gate behind the one-time "turn long-term memory on" offer.
 *
 * The whole design rests on one asymmetry: NOT offering costs a user a feature
 * they can still switch on in Settings, while offering wrongly pushes someone
 * on a privacy decision they already made. Every ambiguous case must therefore
 * resolve to "stay quiet", and these tests exist to pin that direction.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The module mirrors its answer into localStorage precisely so a failed bridge
// write cannot resurrect the prompt. The node test environment has no
// localStorage, so provide a minimal one - without it the mirror silently
// no-ops and the test would be asserting nothing about the real renderer.
const localBacking = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => localBacking.get(k) ?? null,
  setItem: (k: string, v: string) => {
    localBacking.set(k, String(v));
  },
  removeItem: (k: string) => {
    localBacking.delete(k);
  },
  clear: () => localBacking.clear(),
});

const store = new Map<string, unknown>();
const getMock = vi.fn(async (key: string) => store.get(key));
const setMock = vi.fn(async (key: string, value: unknown) => {
  store.set(key, value);
});
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: (key: string) => getMock(key),
    set: (key: string, value: unknown) => setMock(key, value),
  },
}));

import {
  hasAnsweredMemoryOffer,
  markMemoryOfferAnswered,
  shouldOfferMemoryEnable,
  resetMemoryOfferForTests,
} from '@renderer/utils/memory/memoryEnableOffer';

describe('memory enable offer gate', () => {
  beforeEach(() => {
    localBacking.clear();
    store.clear();
    getMock.mockClear();
    setMock.mockClear();
    getMock.mockImplementation(async (key: string) => store.get(key));
    resetMemoryOfferForTests();
  });
  afterEach(() => {
    resetMemoryOfferForTests();
  });

  it('offers when memory is explicitly off and the user has never answered', async () => {
    expect(await shouldOfferMemoryEnable(false)).toBe(true);
  });

  it('stays silent when memory is already on', async () => {
    expect(await shouldOfferMemoryEnable(true)).toBe(false);
  });

  it('stays silent when the engine config could not be read', async () => {
    // `undefined` is "we do not know", which is NOT "memory is off". Guessing
    // here would put a misleading prompt in front of a user whose memory works.
    expect(await shouldOfferMemoryEnable(undefined)).toBe(false);
  });

  it('never asks twice, whichever way the user answered', async () => {
    expect(await shouldOfferMemoryEnable(false)).toBe(true);
    await markMemoryOfferAnswered();
    expect(await shouldOfferMemoryEnable(false)).toBe(false);
  });

  it('THE ONE THAT MATTERS: a deliberate opt-out is never re-offered', async () => {
    // Someone who switches memory OFF in Settings has answered this question by
    // definition. MemoryPane records the answer on any successful toggle, which
    // is what this simulates. If this ever regresses, the product nags a user
    // out of a privacy decision - strictly worse than the bug the offer repairs.
    await markMemoryOfferAnswered();
    expect(await shouldOfferMemoryEnable(false)).toBe(false);

    // CONTROL: without that recorded answer the very same state DOES offer, so
    // this assertion is anchored to the recording and cannot pass vacuously.
    resetMemoryOfferForTests();
    store.clear();
    expect(await shouldOfferMemoryEnable(false)).toBe(true);
  });

  it('fails safe to "already answered" when the flag cannot be read', async () => {
    resetMemoryOfferForTests();
    store.clear();
    getMock.mockImplementation(async () => {
      throw new Error('storage unavailable');
    });
    expect(await hasAnsweredMemoryOffer()).toBe(true);
    expect(await shouldOfferMemoryEnable(false)).toBe(false);
  });

  it('records the answer locally first, so a failed bridge write cannot resurrect it', async () => {
    setMock.mockImplementation(async () => {
      throw new Error('bridge down');
    });
    await expect(markMemoryOfferAnswered()).resolves.toBeUndefined();
    // The synchronous local marker carried it despite the bridge failing.
    expect(await hasAnsweredMemoryOffer()).toBe(true);
  });
});
