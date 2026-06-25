import { describe, expect, it } from 'vitest';

import notarizeDmg = require('../../scripts/notarizeDmg.js');

const { shouldRetryNotarization } = notarizeDmg as {
  shouldRetryNotarization: (p: {
    attempt: number;
    maxAttempts: number;
    elapsedMs: number;
    waitTimeoutMs: number;
  }) => boolean;
};

// notarytool runs with `--timeout 20m`; the policy keys off how much of that
// window a failed attempt actually burned.
const WAIT_MS = 20 * 60_000;

describe('notarizeDmg shouldRetryNotarization', () => {
  it('retries a FAST failure (connection blip) when attempts remain', () => {
    // A -1001 connection blip fails in seconds — cheap to retry, usually clears.
    expect(shouldRetryNotarization({ attempt: 1, maxAttempts: 3, elapsedMs: 3_000, waitTimeoutMs: WAIT_MS })).toBe(
      true
    );
  });

  it('does NOT retry when the attempt burned the full wait window (stalled queue)', () => {
    // Burning ~20m means Apple's notary queue is slow, not a blip — retrying just
    // wastes another full window. This is the fix: degrade instead of 3x20m.
    expect(shouldRetryNotarization({ attempt: 1, maxAttempts: 3, elapsedMs: WAIT_MS, waitTimeoutMs: WAIT_MS })).toBe(
      false
    );
  });

  it('does NOT retry once at/over the 80% threshold, but still retries just under it', () => {
    const threshold = WAIT_MS * 0.8;
    expect(shouldRetryNotarization({ attempt: 1, maxAttempts: 3, elapsedMs: threshold, waitTimeoutMs: WAIT_MS })).toBe(
      false
    );
    expect(
      shouldRetryNotarization({ attempt: 1, maxAttempts: 3, elapsedMs: threshold - 1, waitTimeoutMs: WAIT_MS })
    ).toBe(true);
  });

  it('never retries the final attempt, even on a fast failure', () => {
    expect(shouldRetryNotarization({ attempt: 3, maxAttempts: 3, elapsedMs: 3_000, waitTimeoutMs: WAIT_MS })).toBe(
      false
    );
  });

  it('caps total wait: a sustained stall ends after one window instead of three', () => {
    // Model three consecutive full-window failures; only the first is "live".
    const decisions = [1, 2, 3].map((attempt) =>
      shouldRetryNotarization({ attempt, maxAttempts: 3, elapsedMs: WAIT_MS, waitTimeoutMs: WAIT_MS })
    );
    // Old behavior would have retried attempts 1 and 2 (true,true,false) -> 3x20m.
    // New behavior gives up after the first full-window stall.
    expect(decisions).toEqual([false, false, false]);
  });
});
