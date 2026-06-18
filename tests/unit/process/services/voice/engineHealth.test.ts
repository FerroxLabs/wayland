import { describe, expect, it } from 'vitest';
import { EngineHealthTracker } from '@process/services/voice/engine/engineHealth';

describe('EngineHealthTracker', () => {
  it('fresh tracker: nothing suspended; effectiveOrder returns input order unchanged', () => {
    const tracker = new EngineHealthTracker();
    expect(tracker.isSuspended('any-engine')).toBe(false);
    expect(tracker.suspensionReason('any-engine')).toBeNull();
    expect(tracker.effectiveOrder(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('quota failure suspends on the FIRST failure', () => {
    const tracker = new EngineHealthTracker();
    tracker.recordFailure('eng', 'quota', 'credits exhausted');
    expect(tracker.isSuspended('eng')).toBe(true);
    expect(tracker.suspensionReason('eng')).toContain('quota');
  });

  it('auth failure suspends on the FIRST failure', () => {
    const tracker = new EngineHealthTracker();
    tracker.recordFailure('eng', 'auth', 'invalid key');
    expect(tracker.isSuspended('eng')).toBe(true);
    expect(tracker.suspensionReason('eng')).toContain('auth');
  });

  it('transient (network) suspends only on the 3rd consecutive failure', () => {
    const tracker = new EngineHealthTracker();
    tracker.recordFailure('eng', 'network', 'timeout');
    expect(tracker.isSuspended('eng')).toBe(false);
    tracker.recordFailure('eng', 'network', 'timeout');
    expect(tracker.isSuspended('eng')).toBe(false);
    tracker.recordFailure('eng', 'network', 'timeout');
    expect(tracker.isSuspended('eng')).toBe(true);
  });

  it('undefined kind suspends only on the 3rd consecutive failure', () => {
    const tracker = new EngineHealthTracker();
    tracker.recordFailure('eng', undefined, 'unknown error');
    expect(tracker.isSuspended('eng')).toBe(false);
    tracker.recordFailure('eng', undefined, 'unknown error');
    expect(tracker.isSuspended('eng')).toBe(false);
    tracker.recordFailure('eng', undefined, 'unknown error');
    expect(tracker.isSuspended('eng')).toBe(true);
  });

  it('recordSuccess resets the consecutive counter (2 failures, success, 2 more failures → not suspended)', () => {
    const tracker = new EngineHealthTracker();
    tracker.recordFailure('eng', 'network', 'err');
    tracker.recordFailure('eng', 'network', 'err');
    tracker.recordSuccess('eng');
    tracker.recordFailure('eng', 'network', 'err');
    tracker.recordFailure('eng', 'network', 'err');
    expect(tracker.isSuspended('eng')).toBe(false);
  });

  it('suspension expires after the window passes', () => {
    let t = 0;
    const tracker = new EngineHealthTracker(() => t);
    tracker.recordFailure('eng', 'quota', 'credits exhausted');
    expect(tracker.isSuspended('eng')).toBe(true);
    // Advance past 60-minute window
    t = 60 * 60 * 1000 + 1;
    expect(tracker.isSuspended('eng')).toBe(false);
    expect(tracker.suspensionReason('eng')).toBeNull();
  });

  it('effectiveOrder: chain [a,b,c] with a suspended → [b,c,a]', () => {
    const tracker = new EngineHealthTracker();
    tracker.recordFailure('a', 'quota', 'out');
    expect(tracker.effectiveOrder(['a', 'b', 'c'])).toEqual(['b', 'c', 'a']);
  });

  it('reset(id) clears a specific engine suspension', () => {
    const tracker = new EngineHealthTracker();
    tracker.recordFailure('a', 'quota', 'out');
    tracker.recordFailure('b', 'quota', 'out');
    tracker.reset('a');
    expect(tracker.isSuspended('a')).toBe(false);
    expect(tracker.isSuspended('b')).toBe(true);
  });

  it('reset() with no args clears all suspensions', () => {
    const tracker = new EngineHealthTracker();
    tracker.recordFailure('a', 'quota', 'out');
    tracker.recordFailure('b', 'auth', 'bad key');
    tracker.reset();
    expect(tracker.isSuspended('a')).toBe(false);
    expect(tracker.isSuspended('b')).toBe(false);
  });
});
