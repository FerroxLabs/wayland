import { beforeEach, describe, expect, it } from 'vitest';

import signingExec = require('../../scripts/signingExec.js');

const { isNotaryStall, markNotaryStalled, notaryStallSeen, resetNotaryStalled, NOTARY_STALL_FRACTION } =
  signingExec as {
    isNotaryStall: (elapsedMs: number, timeoutMs: number) => boolean;
    markNotaryStalled: () => void;
    notaryStallSeen: () => boolean;
    resetNotaryStalled: () => void;
    NOTARY_STALL_FRACTION: number;
  };

const WAIT_MS = 15 * 60_000;

describe('signingExec notary-stall detection', () => {
  it('flags a near-full-window failure as a stall, not a blip', () => {
    expect(isNotaryStall(WAIT_MS, WAIT_MS)).toBe(true); // ran the whole window
    expect(isNotaryStall(WAIT_MS * NOTARY_STALL_FRACTION, WAIT_MS)).toBe(true); // at threshold
    expect(isNotaryStall(3_000, WAIT_MS)).toBe(false); // -1001 blip fails in seconds
    expect(isNotaryStall(WAIT_MS * NOTARY_STALL_FRACTION - 1, WAIT_MS)).toBe(false); // just under
  });
});

describe('signingExec cross-call stall sentinel', () => {
  beforeEach(() => resetNotaryStalled());

  it('starts unset', () => {
    expect(notaryStallSeen()).toBe(false);
  });

  it('latches once marked (so the dmg notarize can short-circuit after the app stall)', () => {
    expect(notaryStallSeen()).toBe(false);
    markNotaryStalled();
    expect(notaryStallSeen()).toBe(true);
    // idempotent
    markNotaryStalled();
    expect(notaryStallSeen()).toBe(true);
  });

  it('resets between builds', () => {
    markNotaryStalled();
    expect(notaryStallSeen()).toBe(true);
    resetNotaryStalled();
    expect(notaryStallSeen()).toBe(false);
  });
});
