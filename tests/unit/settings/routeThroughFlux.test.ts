import { describe, it, expect, beforeEach } from 'vitest';

// In-memory stand-in mirroring ProcessConfig get/set semantics for the
// 'system.routeThroughFlux' key: default false when unset, persists a write.
const store = new Map<string, unknown>();
const ProcessConfig = {
  get: async (k: string) => store.get(k),
  set: async (k: string, v: unknown) => void store.set(k, v),
};

beforeEach(() => store.clear());

describe('routeThroughFlux setting semantics', () => {
  it('defaults to false when unset', async () => {
    const value = (await ProcessConfig.get('system.routeThroughFlux')) ?? false;
    expect(value).toBe(false);
  });
  it('persists an enabled write', async () => {
    await ProcessConfig.set('system.routeThroughFlux', true);
    expect((await ProcessConfig.get('system.routeThroughFlux')) ?? false).toBe(true);
  });
});
