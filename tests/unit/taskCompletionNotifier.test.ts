/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #579 — task-completion notifications.
 *
 * The settings page shipped `notifications.agentFinished` / `agentError` /
 * `playSound` / `quietHours` (all defaulted ON) and NOTHING read them.
 *
 * Most of this file is about NOT notifying. `conversation.turn.completed` is a
 * TURN event, and a naive listener turns every tool approval, every workflow
 * step, every teammate and every cron tick into a banner. Each `does not notify`
 * case below is a spam bug that would have shipped.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => {
  type Handler = (payload: unknown) => void;
  const handlers: Handler[] = [];
  return {
    on: (fn: Handler) => handlers.push(fn),
    fire: (payload: unknown) => handlers.forEach((fn) => fn(payload)),
    reset: () => handlers.splice(0, handlers.length),
    showNotification: vi.fn(async () => undefined),
    configGet: vi.fn(),
  };
});

vi.mock('@/common', () => ({
  ipcBridge: { conversation: { turnCompleted: { on: (fn: (p: unknown) => void) => m.on(fn) } } },
}));
vi.mock('@process/bridge/notificationBridge', () => ({ showNotification: m.showNotification }));
vi.mock('@process/utils/initStorage', () => ({ ProcessConfig: { get: (k: string) => m.configGet(k) } }));
vi.mock('@process/utils/mainLogger', () => ({ mainWarn: vi.fn() }));
vi.mock('@process/services/i18n', () => ({
  default: { t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key) },
  i18nReady: Promise.resolve(),
}));

import {
  initTaskCompletionNotifier,
  isTaskComplete,
  isUserFacingConversation,
  isWithinQuietHours,
} from '@process/services/notifications/taskCompletionNotifier';

type Extra = Record<string, unknown>;

/** Wire the notifier. Defaults: unfocused, a plain user chat, no workflow. */
function arm(
  opts: {
    focused?: boolean;
    /** Which chat is on screen. Defaults to the completed one ('conv-1'), so a
     *  focused window means "watching this chat". Set to another id or null to
     *  exercise the multitask case. */
    foregroundConversationId?: string | null;
    extra?: Extra;
    workflowStatus?: string | null;
    source?: string;
    /** Simulate the repo returning undefined — a deleted row OR a failed read. */
    noConversation?: boolean;
  } = {}
): void {
  initTaskCompletionNotifier({
    isAppFocused: () => opts.focused ?? false,
    getForegroundConversationId: () =>
      'foregroundConversationId' in opts ? (opts.foregroundConversationId ?? null) : 'conv-1',
    getConversation: async () =>
      opts.noConversation
        ? undefined
        : ({
            id: 'conv-1',
            name: 'Refactor the parser',
            source: opts.source,
            extra: opts.extra ?? {},
          } as never),
    findWorkflowByConversationId: () => (opts.workflowStatus ? ({ status: opts.workflowStatus } as never) : null),
  });
}

function config(overrides: Record<string, unknown> = {}): void {
  m.configGet.mockImplementation(async (key: string) => overrides[key]); // undefined → notifier applies `?? true`
}

/** A completed turn: idle, nothing pending, not a cron run. */
function turn(over: Record<string, unknown> = {}): void {
  m.fire({
    sessionId: 'conv-1',
    state: 'ai_waiting_input',
    detail: '',
    model: { name: 'acp' },
    runtime: { pendingConfirmations: 0, hasTask: false },
    ...over,
  });
}

const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  m.reset();
  m.showNotification.mockClear();
  m.configGet.mockReset();
  config();
});

describe('#579 isTaskComplete — a turn that stopped to ASK is not a finished task', () => {
  const ev = (over: Record<string, unknown>) =>
    ({ state: 'ai_waiting_input', runtime: { pendingConfirmations: 0 }, ...over }) as never;

  it('a pending tool/permission confirmation is NOT completion', () => {
    // AcpAgentManager finishes a turn with state `ai_waiting_input` while parked on
    // a tool approval. WorkflowSessionService says it plainly: the step is NOT
    // complete. Treating it as done announces "Task complete" on every approval.
    expect(isTaskComplete(ev({ runtime: { pendingConfirmations: 1 } }))).toBe(false);
    expect(isTaskComplete(ev({ runtime: { pendingConfirmations: 0 } }))).toBe(true);
  });

  it('accepts the three terminal states and rejects mid-turn ones', () => {
    expect(isTaskComplete(ev({ state: 'stopped' }))).toBe(true);
    expect(isTaskComplete(ev({ state: 'error' }))).toBe(true);
    expect(isTaskComplete(ev({ state: 'running' }))).toBe(false);
  });
});

describe('#579 isUserFacingConversation — machinery must not raise banners', () => {
  const conv = (extra: Extra) => ({ id: 'c', extra }) as never;

  it('a plain user chat is user-facing', () => {
    expect(isUserFacingConversation(conv({}), null)).toBe(true);
  });

  it('a cron conversation is NOT (CronService already notifies — this would double)', () => {
    expect(isUserFacingConversation(conv({ cronJobId: 'job-1' }), null)).toBe(false);
  });

  it('an autonomous workflow CHILD is NOT (one child per step → a banner per step)', () => {
    expect(isUserFacingConversation(conv({ autonomousDispatch: { stepN: 3 } }), null)).toBe(false);
  });

  it('a teammate slot is NOT (one conversation per slot → N banners per round)', () => {
    expect(isUserFacingConversation(conv({ teamId: 'team-1' }), null)).toBe(false);
  });

  it('a health-check conversation is NOT a task at all', () => {
    expect(isUserFacingConversation(conv({ isHealthCheck: true }), null)).toBe(false);
  });

  it('a channel-inbound conversation is NOT (the user is reading it on their phone)', () => {
    // The category that beats every other gate: channels AUTO-APPROVE tool
    // permissions, so pendingConfirmations is always 0, and the app is unfocused
    // by construction. Only the source check can catch these.
    for (const source of ['telegram', 'lark', 'dingtalk', 'weixin', 'wecom', 'imessage']) {
      expect(isUserFacingConversation({ id: 'c', source, extra: {} } as never, null), source).toBe(false);
    }
    // Allowlist, not denylist: ConversationSource is an open union, so an unknown
    // future channel must default to NOT notifying rather than opting itself in.
    expect(isUserFacingConversation({ id: 'c', source: 'some-new-channel', extra: {} } as never, null)).toBe(false);
    expect(isUserFacingConversation({ id: 'c', source: 'wayland', extra: {} } as never, null)).toBe(true);
  });

  it('a parent driven by an ACTIVE workflow is NOT (hidden directive per step)', () => {
    expect(isUserFacingConversation(conv({}), { status: 'active' } as never)).toBe(false);
  });

  it("...but once that workflow is complete the chat is the user's again", () => {
    expect(isUserFacingConversation(conv({}), { status: 'complete' } as never)).toBe(true);
  });
});

describe('#579 quiet hours — the window WRAPS midnight', () => {
  const at = (h: number, min = 0) => new Date(2026, 6, 12, h, min);

  it('the shipped 22:00-07:00 default is quiet at night and loud by day', () => {
    const q = { start: '22:00', end: '07:00' };
    // A naive `start <= now < end` inverts this: silent all day, loud all night.
    expect(isWithinQuietHours(at(23), q)).toBe(true);
    expect(isWithinQuietHours(at(3), q)).toBe(true);
    expect(isWithinQuietHours(at(6, 59), q)).toBe(true);
    expect(isWithinQuietHours(at(7), q)).toBe(false);
    expect(isWithinQuietHours(at(14), q)).toBe(false);
    expect(isWithinQuietHours(at(22), q)).toBe(true);
  });

  it('handles a same-day window that does not wrap', () => {
    const q = { start: '09:00', end: '17:00' };
    expect(isWithinQuietHours(at(12), q)).toBe(true);
    expect(isWithinQuietHours(at(8, 59), q)).toBe(false);
  });

  it('an empty, malformed, or non-string window is NOT quiet', () => {
    // Never silence a user forever because of a degenerate or corrupt value, and
    // never throw: a hand-edited config must not kill the notification.
    expect(isWithinQuietHours(at(3), { start: '22:00', end: '22:00' })).toBe(false);
    expect(isWithinQuietHours(at(3), { start: 'garbage', end: '07:00' })).toBe(false);
    expect(isWithinQuietHours(at(3), { start: '25:00', end: '07:00' })).toBe(false);
    expect(isWithinQuietHours(at(3), { start: 22 as never, end: null as never })).toBe(false);
  });
});

describe('#579 the notifier end-to-end', () => {
  it('CONTROL: notifies when a real task finishes and the app is in the background', async () => {
    // Pin the clock to daytime: quiet hours now default to 22:00-07:00 even with
    // no persisted config (see the quiet-hours-default test), so silent=false is
    // only deterministic outside that window.
    const RealDate = Date;
    vi.stubGlobal(
      'Date',
      class extends RealDate {
        constructor() {
          super(2026, 6, 12, 12, 0); // 12:00, outside the default quiet window
        }
      }
    );
    arm();
    turn();
    await settle();

    expect(m.showNotification).toHaveBeenCalledTimes(1);
    const arg = m.showNotification.mock.calls[0][0];
    expect(arg.title).toContain('agentFinished');
    // The CONVERSATION title, not `model.name` — which falls back to the backend
    // string and would read "acp finished and is waiting for you".
    expect(arg.body).toContain('Refactor the parser');
    expect(arg.body).not.toContain('acp');
    expect(arg.silent).toBe(false);
    vi.unstubAllGlobals();
  });

  it('does NOT notify on a tool-approval prompt', async () => {
    arm();
    turn({ runtime: { pendingConfirmations: 1, hasTask: false } });
    await settle();
    expect(m.showNotification).not.toHaveBeenCalled();
  });

  it('does NOT notify for a cron run', async () => {
    arm();
    turn({ runtime: { pendingConfirmations: 0, hasTask: true } });
    await settle();
    expect(m.showNotification).not.toHaveBeenCalled();
  });

  it('does NOT notify for an autonomous workflow child', async () => {
    arm({ extra: { autonomousDispatch: { stepN: 2 } } });
    turn();
    await settle();
    expect(m.showNotification).not.toHaveBeenCalled();
  });

  it('does NOT notify for a teammate slot', async () => {
    arm({ extra: { teamId: 'team-1' } });
    turn();
    await settle();
    expect(m.showNotification).not.toHaveBeenCalled();
  });

  it('does NOT notify while an active workflow drives the conversation', async () => {
    arm({ workflowStatus: 'active' });
    turn();
    await settle();
    expect(m.showNotification).not.toHaveBeenCalled();
  });

  it('does NOT notify for a channel-inbound (Telegram) turn', async () => {
    arm({ source: 'telegram' });
    turn();
    await settle();
    expect(m.showNotification).not.toHaveBeenCalled();
  });

  it('FAILS CLOSED when the conversation cannot be read', async () => {
    // SqliteConversationRepository returns `undefined` for a deleted row AND for a
    // failed read — it never throws. Every machinery exclusion reads from that
    // object, so treating this as a normal user chat would drop them ALL at once
    // and restore the storm, under exactly the DB pressure a long workflow creates.
    arm({ noConversation: true });
    turn();
    await settle();
    expect(m.showNotification).not.toHaveBeenCalled();
  });

  it('stays quiet when the focused window is showing THIS chat — already watching', async () => {
    arm({ focused: true, foregroundConversationId: 'conv-1' });
    turn();
    await settle();
    expect(m.showNotification).not.toHaveBeenCalled();
  });

  it('#579 follow-up: STILL notifies when focused but on a DIFFERENT chat (multitask)', async () => {
    // The whole point of #579: you kicked off a task, switched to another chat,
    // and are no longer watching the first. An app-wide focus gate wrongly ate this.
    arm({ focused: true, foregroundConversationId: 'conv-2' });
    turn();
    await settle();
    expect(m.showNotification).toHaveBeenCalledTimes(1);
  });

  it('#579 follow-up: notifies when focused but on no chat at all (list/settings view)', async () => {
    arm({ focused: true, foregroundConversationId: null });
    turn();
    await settle();
    expect(m.showNotification).toHaveBeenCalledTimes(1);
  });

  it('respects notifications.agentFinished = false', async () => {
    config({ 'notifications.agentFinished': false });
    arm();
    turn();
    await settle();
    expect(m.showNotification).not.toHaveBeenCalled();
  });

  it('an errored turn uses agentError, and its detail is one trimmed line', async () => {
    arm();
    turn({ state: 'error', detail: '  connection\n   lost  ' });
    await settle();

    const arg = m.showNotification.mock.calls[0][0];
    expect(arg.title).toContain('agentError');
    expect(arg.body).toContain('connection lost'); // collapsed, not a raw dump
  });

  it('the two toggles are not crossed: agentError=false silences only failures', async () => {
    config({ 'notifications.agentFinished': true, 'notifications.agentError': false });
    arm();
    turn({ state: 'error' });
    await settle();
    expect(m.showNotification).not.toHaveBeenCalled();

    turn(); // a success still notifies
    await settle();
    expect(m.showNotification).toHaveBeenCalledTimes(1);
  });

  it('playSound = false shows the banner but silences it', async () => {
    config({ 'notifications.playSound': false });
    arm();
    turn();
    await settle();

    expect(m.showNotification).toHaveBeenCalledTimes(1);
    expect(m.showNotification.mock.calls[0][0].silent).toBe(true);
  });

  it('quiet hours silence the sound but still show the notification', async () => {
    const RealDate = Date;
    vi.stubGlobal(
      'Date',
      class extends RealDate {
        constructor() {
          super(2026, 6, 12, 23, 0); // 23:00, inside the 22:00-07:00 default
        }
      }
    );
    config({ 'notifications.quietHours': { start: '22:00', end: '07:00' } });
    arm();
    turn();
    await settle();

    expect(m.showNotification).toHaveBeenCalledTimes(1);
    expect(m.showNotification.mock.calls[0][0].silent).toBe(true);
    vi.unstubAllGlobals();
  });

  it('#579 follow-up: the DEFAULT quiet window applies with nothing persisted', async () => {
    // The settings page shows 22:00-07:00 by default but only wrote it on edit, so
    // a fresh install had no quietHours config and rang at 3am. The default must
    // be in effect out of the box.
    const RealDate = Date;
    vi.stubGlobal(
      'Date',
      class extends RealDate {
        constructor() {
          super(2026, 6, 12, 3, 0); // 03:00, inside the default 22:00-07:00
        }
      }
    );
    config(); // NOTHING persisted — notifications.quietHours is undefined
    arm();
    turn();
    await settle();
    expect(m.showNotification).toHaveBeenCalledTimes(1);
    expect(m.showNotification.mock.calls[0][0].silent).toBe(true); // silenced by the default window
    vi.unstubAllGlobals();
  });

  it('#579 follow-up: a secret in an engine error is redacted before it hits the banner', async () => {
    arm();
    turn({ state: 'error', detail: 'auth failed: token=sk-ant-SECRETSECRETSECRETSECRET1234567890 rejected' });
    await settle();

    const body = m.showNotification.mock.calls[0][0].body as string;
    expect(body).not.toContain('sk-ant-SECRETSECRETSECRETSECRET1234567890');
    expect(body).toContain('agentError'); // still an error banner, just redacted
  });
});
