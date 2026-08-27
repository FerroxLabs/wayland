/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1045 - a held tool call in an UNATTENDED run must expire, and it must expire
 * into a DENIAL.
 *
 * The failure this pins: `PermissionResolver` had no timeout of any kind. Level 3
 * UI delegation created a Promise, stored it in `pending`, recorded `createdAt`
 * and then never read it again. The only ways out were a user decision or
 * `rejectAll()` at teardown, so a scheduled run that hit a hold sat on it until
 * the app quit - and `CronBusyGuard` kept that conversation marked busy, blocking
 * its own later scheduled runs for up to its one-hour cleanup window.
 *
 * The direction is the security half of the fix and is asserted explicitly below:
 * an expiry DENIES. It never selects an allow option, and it is never cached or
 * persisted, because a timeout is the absence of a decision rather than a
 * permissive one. Getting that backwards would turn an unanswered prompt into a
 * silent approval on an unattended machine.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { PermissionResolver } from '@process/acp/session/PermissionResolver';
import type { RequestPermissionRequest, RequestPermissionResponse } from '@agentclientprotocol/sdk';

const FIFTEEN_MINUTES_MS = 15 * 60_000;

function makeRequest(
  toolName = 'bash',
  callId = 'call-1',
  overrides?: { kind?: string; rawInput?: Record<string, unknown>; options?: RequestPermissionRequest['options'] }
): RequestPermissionRequest {
  return {
    sessionId: 'sess-1',
    toolCall: {
      toolCallId: callId,
      title: toolName,
      kind: overrides?.kind as RequestPermissionRequest['toolCall']['kind'],
      rawInput: overrides?.rawInput,
    },
    options: overrides?.options ?? [
      { optionId: 'allow', name: 'Allow', kind: 'allow_once' },
      { optionId: 'deny', name: 'Deny', kind: 'reject_once' },
      { optionId: 'always', name: 'Always', kind: 'allow_always' },
    ],
  };
}

/** Capture a promise's settled value without ever awaiting it unconditionally. */
function watch(promise: Promise<RequestPermissionResponse>): { settled: () => RequestPermissionResponse | undefined } {
  let value: RequestPermissionResponse | undefined;
  void promise.then((v) => {
    value = v;
  });
  return { settled: () => value };
}

describe('#1045 unattended permission holds expire into a denial', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('denies a held tool call once the unattended deadline passes', async () => {
    vi.useFakeTimers();
    const resolver = new PermissionResolver({ autoApproveAll: false, holdDeadlineMs: FIFTEEN_MINUTES_MS });
    const held = watch(resolver.evaluate(makeRequest('bash', 'c1', { kind: 'execute' }), vi.fn()));

    // Just short of the deadline the run is still legitimately paused.
    await vi.advanceTimersByTimeAsync(FIFTEEN_MINUTES_MS - 1);
    expect(held.settled()).toBeUndefined();

    await vi.advanceTimersByTimeAsync(2);
    expect(held.settled()).toEqual({ outcome: { outcome: 'selected', optionId: 'deny' } });
    expect(resolver.hasPending).toBe(false);
  });

  it('fails closed when the request offered no reject option', async () => {
    vi.useFakeTimers();
    const resolver = new PermissionResolver({ autoApproveAll: false, holdDeadlineMs: 1_000 });
    const held = watch(
      resolver.evaluate(
        makeRequest('bash', 'c1', {
          kind: 'execute',
          options: [{ optionId: 'allow', name: 'Allow', kind: 'allow_once' }],
        }),
        vi.fn()
      )
    );

    await vi.advanceTimersByTimeAsync(1_001);
    // No reject option to select, so the only honest answer is "no decision",
    // never the allow option that happens to be the one on offer.
    expect(held.settled()).toEqual({ outcome: { outcome: 'cancelled' } });
  });

  it('never caches or persists an expiry, so the next identical call still prompts', async () => {
    vi.useFakeTimers();
    const persist = vi.fn();
    const resolver = new PermissionResolver({
      autoApproveAll: false,
      holdDeadlineMs: 1_000,
      persist,
    });

    const first = watch(resolver.evaluate(makeRequest('bash', 'c1', { kind: 'execute' }), vi.fn()));
    await vi.advanceTimersByTimeAsync(1_001);
    expect(first.settled()).toEqual({ outcome: { outcome: 'selected', optionId: 'deny' } });

    const secondUi = vi.fn();
    watch(resolver.evaluate(makeRequest('bash', 'c2', { kind: 'execute' }), secondUi));
    expect(secondUi).toHaveBeenCalledOnce();
    expect(persist).not.toHaveBeenCalled();
  });

  it('KNOWN POSITIVE: the same harness does observe a genuinely cached allow', async () => {
    // Proves the negative above can fail. Same resolver, same assertions, but a
    // real "allow always" decision - the cache must suppress the second prompt.
    const persist = vi.fn();
    const resolver = new PermissionResolver({ autoApproveAll: false, holdDeadlineMs: 1_000, persist });

    const first = resolver.evaluate(makeRequest('bash', 'c1', { kind: 'execute' }), vi.fn());
    resolver.resolve('c1', 'allow_always');
    await first;

    const secondUi = vi.fn();
    const second = await resolver.evaluate(makeRequest('bash', 'c2', { kind: 'execute' }), secondUi);
    expect(secondUi).not.toHaveBeenCalled();
    expect(second.outcome).toEqual({ outcome: 'selected', optionId: 'allow_always' });
    expect(persist).toHaveBeenCalledWith(expect.any(String), 'allow_always');
  });

  it('an attended run has no deadline and stays pending indefinitely', async () => {
    vi.useFakeTimers();
    const resolver = new PermissionResolver({ autoApproveAll: false });
    const held = watch(resolver.evaluate(makeRequest('bash', 'c1', { kind: 'execute' }), vi.fn()));

    await vi.advanceTimersByTimeAsync(4 * 60 * 60_000);
    expect(held.settled()).toBeUndefined();
    expect(resolver.hasPending).toBe(true);
  });

  it('a user decision before the deadline cancels the expiry', async () => {
    vi.useFakeTimers();
    const onHoldExpired = vi.fn();
    const resolver = new PermissionResolver({
      autoApproveAll: false,
      holdDeadlineMs: 1_000,
      onHoldExpired,
    });

    const held = watch(resolver.evaluate(makeRequest('bash', 'c1', { kind: 'execute' }), vi.fn()));
    await vi.advanceTimersByTimeAsync(500);
    resolver.resolve('c1', 'allow');
    // `resolve` settles the promise; the `.then` that records it is a microtask.
    await vi.advanceTimersByTimeAsync(0);
    expect(held.settled()).toEqual({ outcome: { outcome: 'selected', optionId: 'allow' } });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(onHoldExpired).not.toHaveBeenCalled();
  });

  it('reports the expiry so the run is not indistinguishable from a plain failure', async () => {
    vi.useFakeTimers();
    const onHoldExpired = vi.fn();
    const resolver = new PermissionResolver({
      autoApproveAll: false,
      holdDeadlineMs: 1_000,
      onHoldExpired,
    });

    watch(resolver.evaluate(makeRequest('rm -rf /tmp/x', 'c1', { kind: 'execute' }), vi.fn()));
    await vi.advanceTimersByTimeAsync(1_001);

    expect(onHoldExpired).toHaveBeenCalledWith({
      callId: 'c1',
      title: 'rm -rf /tmp/x',
      deadlineMs: 1_000,
    });
  });
});

/**
 * `toAgentConfig` is a hand-listed literal with no spread - its own comment says
 * so - which means a field that is not named there is silently dropped however
 * well it is typed at both ends. The deadline crosses exactly that seam.
 */
describe('#1045 the deadline survives the compat layer', () => {
  it('carries unattendedHoldDeadlineMs from extra onto the AgentConfig', async () => {
    const { toAgentConfig } = await import('@process/acp/compat/typeBridge');
    const config = toAgentConfig({
      id: 'conv-1',
      backend: 'claude',
      workingDir: '/workspace',
      extra: { backend: 'claude', workspace: '/workspace', unattendedHoldDeadlineMs: 900_000 },
      onStreamEvent: () => {},
    } as unknown as Parameters<typeof toAgentConfig>[0]);

    expect(config.unattendedHoldDeadlineMs).toBe(900_000);
  });

  it('leaves it undefined for an attended spawn, which is what keeps that prompt indefinite', async () => {
    const { toAgentConfig } = await import('@process/acp/compat/typeBridge');
    const config = toAgentConfig({
      id: 'conv-1',
      backend: 'claude',
      workingDir: '/workspace',
      extra: { backend: 'claude', workspace: '/workspace' },
      onStreamEvent: () => {},
    } as unknown as Parameters<typeof toAgentConfig>[0]);

    expect(config.unattendedHoldDeadlineMs).toBeUndefined();
  });
});
