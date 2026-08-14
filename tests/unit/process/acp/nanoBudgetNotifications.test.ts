/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Nano's cost metering rode `session/update` as `sessionUpdate: 'budget'` until
 * the ACP SDK - which schema-validates that notification before dispatching -
 * rejected every frame with `-32602`. The data never reached Desktop and every
 * turn logged an error. Nano moved it to ext notifications, which the SDK
 * routes WITHOUT validation.
 *
 * That is the trade this file exists to pay for: the SDK no longer checks the
 * shape, so the host must. And it must do it without throwing - a notification
 * has no caller to report a failure to, and throwing inside the SDK's
 * notification handler is the exact failure mode this whole change is escaping.
 *
 * Field shapes are from the published Nano contract, verified there against a
 * live stdio capture on a real Flux turn.
 */
import { describe, expect, it } from 'vitest';
import {
  formatNanoBudgetCost,
  NANO_BUDGET_CLAMP_METHOD,
  NANO_BUDGET_METHOD,
  NANO_BUDGET_WARN_METHOD,
  parseNanoBudgetNotification,
} from '@process/acp/infra/nanoBudgetNotifications';

describe('parseNanoBudgetNotification', () => {
  it('parses the budget frame Nano actually sends', () => {
    // Captured verbatim off the wire on this machine, driving
    // `wayland-nano acp-host` over stdio against a real Flux turn:
    //
    //   {"jsonrpc":"2.0","method":"_wayland/session/budget","params":{
    //     "limit":null,"microcents":0,"observed":null,"priced":false,
    //     "sessionId":"wayland-nano-session-1786695450056335000-1",
    //     "session_tokens":5958}}
    //
    // Flattened, no `update` wrapper, all six fields - matching the published
    // contract exactly. Same capture confirmed ZERO `sessionUpdate: 'budget'`
    // frames still on session/update.
    const event = parseNanoBudgetNotification(NANO_BUDGET_METHOD, {
      limit: null,
      microcents: 0,
      observed: null,
      priced: false,
      sessionId: 'wayland-nano-session-1786695450056335000-1',
      session_tokens: 5958,
    });

    expect(event).toEqual({
      kind: 'budget',
      sessionId: 'wayland-nano-session-1786695450056335000-1',
      sessionTokens: 5958,
      microcents: 0,
      priced: false,
      limit: null,
      observed: null,
    });
  });

  it('keeps null limit and observed as null, not zero', () => {
    // `limit: null` means UNLIMITED. Coercing it to 0 would read as a ceiling
    // of zero and make every turn look instantly over budget.
    const event = parseNanoBudgetNotification(NANO_BUDGET_METHOD, {
      sessionId: 's1',
      session_tokens: 5,
      microcents: 12,
      priced: true,
      limit: null,
      observed: null,
    });

    expect(event).toMatchObject({ limit: null, observed: null, priced: true, microcents: 12 });
  });

  it('treats a missing `priced` as NOT priced', () => {
    // Defaulting the other way would report a real cost of zero for a model we
    // simply have no pricing for - the difference between "free" and "unknown".
    const event = parseNanoBudgetNotification(NANO_BUDGET_METHOD, {
      sessionId: 's1',
      session_tokens: 5,
      microcents: 0,
    });

    expect(event).toMatchObject({ kind: 'budget', priced: false });
  });

  it('parses the warn frame', () => {
    expect(parseNanoBudgetNotification(NANO_BUDGET_WARN_METHOD, {
      sessionId: 's1',
      limit: 100000,
      observed: 82000,
      pct_used: 82,
    })).toEqual({ kind: 'budget_warn', sessionId: 's1', limit: 100000, observed: 82000, pctUsed: 82 });
  });

  it('parses the clamp frame', () => {
    expect(parseNanoBudgetNotification(NANO_BUDGET_CLAMP_METHOD, {
      sessionId: 's1',
      requested: 8192,
      granted: 4096,
    })).toEqual({ kind: 'budget_clamp', sessionId: 's1', requested: 8192, granted: 4096 });
  });

  it('ignores ext methods it does not own', () => {
    // Nano advertises session/list, session/review and session/steer on the
    // same channel. Claiming those would swallow them.
    expect(parseNanoBudgetNotification('_wayland/session/list', { sessionId: 's1' })).toBeNull();
    expect(parseNanoBudgetNotification('_wayland/session/review', { sessionId: 's1' })).toBeNull();
    expect(parseNanoBudgetNotification('session/update', { sessionId: 's1' })).toBeNull();
  });

  it('drops a frame with no sessionId rather than guessing one', () => {
    // An event that names no session cannot be attributed to a conversation.
    expect(parseNanoBudgetNotification(NANO_BUDGET_METHOD, { session_tokens: 10 })).toBeNull();
    expect(parseNanoBudgetNotification(NANO_BUDGET_METHOD, { sessionId: '' })).toBeNull();
  });

  it('never throws on a malformed payload', () => {
    // The whole point: no caller, no error path. Returning null is the contract.
    for (const bad of [null, undefined, 'string', 42, [], { sessionId: 5 }]) {
      expect(() => parseNanoBudgetNotification(NANO_BUDGET_METHOD, bad)).not.toThrow();
      expect(parseNanoBudgetNotification(NANO_BUDGET_METHOD, bad)).toBeNull();
    }
  });

  it('never renders an unpriced turn as $0.000 — the Nano side calls that an integration bug', () => {
    // The honesty rule, stated as a hard requirement in the Nano contract:
    // `priced: false` means the cost figure is NOT REAL. "$0.0000" would claim
    // the turn was free; the truth is that we have no pricing for the model.
    const unpriced = parseNanoBudgetNotification(NANO_BUDGET_METHOD, {
      sessionId: 's1',
      session_tokens: 10232,
      microcents: 0,
      priced: false,
    });

    expect(formatNanoBudgetCost(unpriced!)).toBe('unpriced');
    expect(formatNanoBudgetCost(unpriced!)).not.toMatch(/\$/);
  });

  it('renders a real cost when the meter says it is priced', () => {
    const priced = parseNanoBudgetNotification(NANO_BUDGET_METHOD, {
      sessionId: 's1',
      session_tokens: 10232,
      microcents: 123_400_000, // 1e8 microcents = $1
      priced: true,
    });

    expect(formatNanoBudgetCost(priced!)).toBe('$1.2340');
  });

  it('reports warn and clamp events as unpriced — they carry no cost figure', () => {
    const warn = parseNanoBudgetNotification(NANO_BUDGET_WARN_METHOD, {
      sessionId: 's1',
      limit: 100,
      observed: 82,
      pct_used: 82,
    });

    expect(formatNanoBudgetCost(warn!)).toBe('unpriced');
  });

  it('rejects non-finite numbers instead of propagating NaN', () => {
    const event = parseNanoBudgetNotification(NANO_BUDGET_METHOD, {
      sessionId: 's1',
      session_tokens: Number.NaN,
      microcents: Number.POSITIVE_INFINITY,
      priced: true,
      limit: Number.NaN,
    });

    expect(event).toMatchObject({ sessionTokens: 0, microcents: 0, limit: null });
  });
});
