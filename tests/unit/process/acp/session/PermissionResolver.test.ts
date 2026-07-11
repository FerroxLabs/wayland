// tests/unit/process/acp/session/PermissionResolver.test.ts

import { describe, it, expect, vi } from 'vitest';
import { PermissionResolver } from '@process/acp/session/PermissionResolver';
import type { RequestPermissionRequest } from '@agentclientprotocol/sdk';

function makeRequest(
  toolName = 'read_file',
  callId = 'call-1',
  overrides?: { kind?: string; rawInput?: Record<string, unknown> }
): RequestPermissionRequest {
  return {
    sessionId: 'sess-1',
    toolCall: {
      toolCallId: callId,
      title: toolName,
      kind: overrides?.kind as RequestPermissionRequest['toolCall']['kind'],
      rawInput: overrides?.rawInput,
    },
    options: [
      { optionId: 'allow', name: 'Allow', kind: 'allow_once' },
      { optionId: 'deny', name: 'Deny', kind: 'reject_once' },
      { optionId: 'always', name: 'Always', kind: 'allow_always' },
    ],
  };
}

describe('PermissionResolver', () => {
  it('auto-approves in YOLO mode', async () => {
    const resolver = new PermissionResolver({ autoApproveAll: true });
    const result = await resolver.evaluate(makeRequest(), vi.fn());
    expect(result.outcome).toEqual({ outcome: 'selected', optionId: 'allow' });
  });

  it('returns cached approval on second call with same key', async () => {
    const resolver = new PermissionResolver({ autoApproveAll: false });
    const uiCallback = vi.fn();

    // First call: resolve manually with "allow_always"
    const p1 = resolver.evaluate(makeRequest('read_file', 'c1', { kind: 'read' }), uiCallback);
    resolver.resolve('c1', 'allow_always');
    await p1;

    // Second call with same tool + kind: should hit cache
    const uiCallback2 = vi.fn();
    const result = await resolver.evaluate(makeRequest('read_file', 'c2', { kind: 'read' }), uiCallback2);
    expect(uiCallback2).not.toHaveBeenCalled();
    expect(result.outcome).toEqual({ outcome: 'selected', optionId: 'allow_always' });
  });

  it('does NOT cache-hit when kind differs', async () => {
    const resolver = new PermissionResolver({ autoApproveAll: false });

    // Approve read_file with kind=read
    const p1 = resolver.evaluate(makeRequest('read_file', 'c1', { kind: 'read' }), vi.fn());
    resolver.resolve('c1', 'allow_always');
    await p1;

    // Same title but kind=edit - should NOT hit cache
    const uiCallback = vi.fn();
    resolver.evaluate(makeRequest('read_file', 'c2', { kind: 'edit' }), uiCallback);
    expect(uiCallback).toHaveBeenCalledOnce();
  });

  it('does NOT cache-hit when rawInput.command differs', async () => {
    const resolver = new PermissionResolver({ autoApproveAll: false });

    // Approve execute with command=ls
    const p1 = resolver.evaluate(makeRequest('bash', 'c1', { kind: 'execute', rawInput: { command: 'ls' } }), vi.fn());
    resolver.resolve('c1', 'allow_always');
    await p1;

    // Same title+kind but different command - should NOT hit cache
    const uiCallback = vi.fn();
    resolver.evaluate(makeRequest('bash', 'c2', { kind: 'execute', rawInput: { command: 'rm -rf /' } }), uiCallback);
    expect(uiCallback).toHaveBeenCalledOnce();
  });

  it('cache-hits when rawInput.command matches', async () => {
    const resolver = new PermissionResolver({ autoApproveAll: false });

    // Approve execute with command=ls
    const p1 = resolver.evaluate(makeRequest('bash', 'c1', { kind: 'execute', rawInput: { command: 'ls' } }), vi.fn());
    resolver.resolve('c1', 'allow_always');
    await p1;

    // Same title+kind+command - should hit cache
    const uiCallback = vi.fn();
    const result = await resolver.evaluate(
      makeRequest('bash', 'c2', { kind: 'execute', rawInput: { command: 'ls' } }),
      uiCallback
    );
    expect(uiCallback).not.toHaveBeenCalled();
    expect(result.outcome).toEqual({ outcome: 'selected', optionId: 'allow_always' });
  });

  it('delegates to UI when no cache hit', async () => {
    const resolver = new PermissionResolver({ autoApproveAll: false });
    const uiCallback = vi.fn();
    const promise = resolver.evaluate(makeRequest('write_file', 'c1'), uiCallback);
    expect(uiCallback).toHaveBeenCalledOnce();
    resolver.resolve('c1', 'allow');
    const result = await promise;
    expect(result.outcome).toEqual({ outcome: 'selected', optionId: 'allow' });
  });

  it('passes kind, rawInput, and locations to UI callback', async () => {
    const resolver = new PermissionResolver({ autoApproveAll: false });
    const uiCallback = vi.fn();
    const request: RequestPermissionRequest = {
      sessionId: 'sess-1',
      toolCall: {
        toolCallId: 'c1',
        title: 'Execute Command',
        kind: 'execute',
        rawInput: { command: 'ls -la' },
        locations: [{ path: '/workspace/src' }],
      },
      options: [{ optionId: 'allow', name: 'Allow', kind: 'allow_once' }],
    };

    resolver.evaluate(request, uiCallback);

    const data = uiCallback.mock.calls[0][0];
    expect(data.kind).toBe('execute');
    expect(data.rawInput).toEqual({ command: 'ls -la' });
    expect(data.locations).toEqual([{ path: '/workspace/src', range: undefined }]);
  });

  it('hasPending is true during unresolved request (INV-S-10)', () => {
    const resolver = new PermissionResolver({ autoApproveAll: false });
    resolver.evaluate(makeRequest('tool', 'c1'), vi.fn());
    expect(resolver.hasPending).toBe(true);
  });

  it('rejectAll settles all pending promises (INV-X-04)', async () => {
    const resolver = new PermissionResolver({ autoApproveAll: false });
    const p1 = resolver.evaluate(makeRequest('a', 'c1'), vi.fn());
    const p2 = resolver.evaluate(makeRequest('b', 'c2'), vi.fn());
    resolver.rejectAll(new Error('disconnect'));
    await expect(p1).rejects.toThrow('disconnect');
    await expect(p2).rejects.toThrow('disconnect');
    expect(resolver.hasPending).toBe(false);
  });

  // #672: "allow always" must survive an app restart via durable persistence,
  // instead of the in-memory-only session cache re-prompting every restart.
  describe('durable persistence (#672)', () => {
    it('write-throughs an allow_always grant to persist()', async () => {
      const persisted = new Map<string, string>();
      const resolver = new PermissionResolver({ autoApproveAll: false, persist: (k, v) => persisted.set(k, v) });
      const p = resolver.evaluate(makeRequest('bash', 'c1', { kind: 'execute', rawInput: { command: 'ls' } }), vi.fn());
      resolver.resolve('c1', 'allow_always');
      await p;
      expect(persisted.size).toBe(1);
      expect([...persisted.values()]).toEqual(['allow_always']);
    });

    it('does NOT persist a one-time allow or a deny', async () => {
      const persisted = new Map<string, string>();
      const resolver = new PermissionResolver({ autoApproveAll: false, persist: (k, v) => persisted.set(k, v) });
      const p1 = resolver.evaluate(
        makeRequest('bash', 'c1', { kind: 'execute', rawInput: { command: 'ls' } }),
        vi.fn()
      );
      resolver.resolve('c1', 'allow'); // one-time
      await p1;
      const p2 = resolver.evaluate(
        makeRequest('bash', 'c2', { kind: 'execute', rawInput: { command: 'rm' } }),
        vi.fn()
      );
      resolver.resolve('c2', 'reject_once'); // deny
      await p2;
      expect(persisted.size).toBe(0);
    });

    it('rehydrates a persisted grant so a NEW resolver (restart) auto-approves without UI', async () => {
      // Session 1: user grants "allow always"; capture what gets persisted.
      const persisted = new Map<string, string>();
      const r1 = new PermissionResolver({ autoApproveAll: false, persist: (k, v) => persisted.set(k, v) });
      const p = r1.evaluate(makeRequest('bash', 'c1', { kind: 'execute', rawInput: { command: 'ls' } }), vi.fn());
      r1.resolve('c1', 'allow_always');
      await p;
      expect(persisted.size).toBe(1);

      // Session 2 (simulated app restart): fresh resolver hydrated from persistence.
      const uiCallback = vi.fn();
      const r2 = new PermissionResolver({ autoApproveAll: false, hydrate: async () => [...persisted.entries()] });
      const result = await r2.evaluate(
        makeRequest('bash', 'c2', { kind: 'execute', rawInput: { command: 'ls' } }),
        uiCallback
      );
      expect(uiCallback).not.toHaveBeenCalled();
      expect(result.outcome).toEqual({ outcome: 'selected', optionId: 'allow_always' });
    });

    it('hydrate runs at most once across many evaluations (memoized)', async () => {
      let hydrateCalls = 0;
      const resolver = new PermissionResolver({
        autoApproveAll: false,
        hydrate: async () => {
          hydrateCalls++;
          return [];
        },
      });
      // With persistence, evaluate registers the pending entry only AFTER the
      // hydration await, so wait for it before resolving (in production, resolve
      // is user-driven long after the UI callback, so this race never occurs).
      const p1 = resolver.evaluate(makeRequest('a', 'c1'), vi.fn());
      await vi.waitFor(() => expect(resolver.hasPending).toBe(true));
      resolver.resolve('c1', 'allow');
      await p1;
      const p2 = resolver.evaluate(makeRequest('b', 'c2'), vi.fn());
      await vi.waitFor(() => expect(resolver.hasPending).toBe(true));
      resolver.resolve('c2', 'allow');
      await p2;
      expect(hydrateCalls).toBe(1);
    });

    it('ignores a persisted entry whose optionId is not an allow_always grant (tamper defense)', async () => {
      // A tampered store maps a command key to a non-always decision. Hydration
      // must drop it, so the request still delegates to the UI (no silent action).
      const key = JSON.stringify({ kind: 'execute', title: 'bash', rawInput: { command: 'ls' } });
      const uiCallback = vi.fn();
      const resolver = new PermissionResolver({
        autoApproveAll: false,
        hydrate: async () => [
          [key, 'reject_once'], // not an allow_always - must be ignored
          [key, 'allow'], // one-time allow - must be ignored
        ],
      });
      const p = resolver.evaluate(
        makeRequest('bash', 'c1', { kind: 'execute', rawInput: { command: 'ls' } }),
        uiCallback
      );
      await vi.waitFor(() => expect(uiCallback).toHaveBeenCalledOnce());
      resolver.resolve('c1', 'allow');
      await p;
    });

    it('a failed hydrate does not block permission evaluation', async () => {
      const uiCallback = vi.fn();
      const resolver = new PermissionResolver({
        autoApproveAll: false,
        hydrate: async () => {
          throw new Error('config read failed');
        },
      });
      const p = resolver.evaluate(makeRequest('write_file', 'c1'), uiCallback);
      await vi.waitFor(() => expect(uiCallback).toHaveBeenCalledOnce());
      resolver.resolve('c1', 'allow');
      const result = await p;
      expect(result.outcome).toEqual({ outcome: 'selected', optionId: 'allow' });
    });
  });
});
