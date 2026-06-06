/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verifies the IMAP IDLE reconnect state machine: when idle() throws or the
 * transport fires `close`/`error`, the plugin must drop the dead ImapFlow
 * instance and construct a brand new one - not just call idle() again on the
 * corpse. Also verifies onStop() aborts a pending reconnect timer so a flapping
 * server can't resurrect the plugin after teardown.
 *
 * imapflow is hoist-mocked with a hand-rolled emitter (same pattern as
 * tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.bridge.test.ts)
 * so we never touch the real network or pino logger.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

const { ImapFlowStub, instances, sendMailSpy, transporterCloseSpy, idleQueue } = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  function makeEmitter(): {
    on: (event: string, cb: Listener) => unknown;
    off: (event: string, cb: Listener) => unknown;
    emit: (event: string, ...args: unknown[]) => boolean;
  } {
    const listeners: Record<string, Listener[]> = {};
    return {
      on(event, cb) {
        (listeners[event] ??= []).push(cb);
        return this;
      },
      off(event, cb) {
        const arr = listeners[event];
        if (!arr) return this;
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
        return this;
      },
      emit(event, ...args) {
        const arr = listeners[event];
        if (!arr || arr.length === 0) return false;
        for (const cb of arr.slice()) cb(...args);
        return true;
      },
    };
  }

  type FakeFetchResult = AsyncIterable<{ uid: number }>;
  function emptyFetch(): FakeFetchResult {
    return {
      async *[Symbol.asyncIterator]() {
        // no messages - the reconnect test doesn't care about message body
      },
    };
  }

  // idleQueue lets tests pre-load behavior for successive idle() calls:
  //   'throw' → idle() rejects on next call
  //   'hang'  → idle() never resolves (the steady-state once connected)
  const idleQueue: Array<'throw' | 'hang'> = [];

  type FakeImap = ReturnType<typeof makeEmitter> & {
    connect: () => Promise<void>;
    mailboxOpen: (name: string) => Promise<void>;
    idle: () => Promise<void>;
    logout: () => Promise<void>;
    fetch: () => FakeFetchResult;
    messageFlagsAdd: () => Promise<void>;
    serverInfo: { capability: string[] };
  };

  const instances: FakeImap[] = [];

  function makeFakeImap(): FakeImap {
    const emitter = makeEmitter();
    const fake: FakeImap = Object.assign(emitter, {
      connect: vi.fn(async () => undefined),
      mailboxOpen: vi.fn(async (_name: string) => undefined),
      idle: vi.fn(() => {
        const next = idleQueue.shift() ?? 'hang';
        if (next === 'throw') {
          return Promise.reject(new Error('idle blew up'));
        }
        // 'hang' - never resolve so the loop awaits forever (until reconnect)
        return new Promise<void>(() => undefined);
      }),
      logout: vi.fn(async () => undefined),
      fetch: vi.fn(() => emptyFetch()),
      messageFlagsAdd: vi.fn(async () => undefined),
      serverInfo: { capability: ['IDLE'] },
    });
    return fake;
  }

  // ImapFlow is called with `new` in production code. A plain vi.fn() is not
  // a constructor in all runtimes, so use a real class whose ctor returns the
  // fake emitter object - `new` honors an object return from the ctor.
  class ImapFlowStub {
    constructor(_opts: unknown) {
      const fake = makeFakeImap();
      instances.push(fake);
      return fake as unknown as ImapFlowStub;
    }
  }
  const imapFlowSpy = ImapFlowStub;

  const sendMailSpy = vi.fn(async () => ({ messageId: 'noop' }));
  const transporterCloseSpy = vi.fn();

  return { ImapFlowStub: imapFlowSpy, instances, sendMailSpy, transporterCloseSpy, idleQueue };
});

vi.mock('imapflow', () => ({
  ImapFlow: ImapFlowStub,
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: sendMailSpy,
      close: transporterCloseSpy,
    })),
  },
}));

import { EmailImapPlugin } from '@process/channels/plugins/tier1/email-imap/EmailImapPlugin';

function makeConfig(): IChannelPluginConfig {
  return {
    id: 'email_default',
    type: 'email-imap',
    name: 'Email',
    enabled: true,
    status: 'created',
    createdAt: 0,
    updatedAt: 0,
    credentials: {
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapUser: 'a@b',
      imapPassword: 'pw',
      imapTls: true,
      useSameAuth: true,
    },
  };
}

/**
 * Let microtasks drain. Used after triggering an idle rejection so the
 * reconnect machine actually fires the setTimeout we then advance with fake
 * timers.
 */
async function tick(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe('EmailImapPlugin - reconnect state machine', () => {
  beforeEach(() => {
    instances.length = 0;
    idleQueue.length = 0;
    sendMailSpy.mockClear();
    transporterCloseSpy.mockClear();
    // Disable jitter so deterministic advanceTimersByTime() steps still hit
    // the reconnect. Jitter (0-1000ms) was added per gemini MED1 2026-05-18.
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a NEW ImapFlow instance after idle() throws (not just calls idle() again on the dead one)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    try {
      // Queue: first idle() rejects → reconnect → second idle() hangs (steady state).
      idleQueue.push('throw', 'hang');

      const plugin = new EmailImapPlugin();
      await plugin.initialize(makeConfig());
      await plugin.start();

      // One ImapFlow constructed during onStart.
      expect(instances).toHaveLength(1);
      const first = instances[0]!;

      // Let the idle loop pick up the queued 'throw' and schedule reconnect.
      await tick();
      await tick();

      // Reconnect uses setTimeout - advance to its first delay (5s floor).
      await vi.advanceTimersByTimeAsync(5_000);
      // connectAndArm awaits connect + mailboxOpen + fetchUnseen.
      await tick();
      await tick();

      // A brand-new ImapFlow must have been built. The bug-before-fix behavior
      // was to keep calling idle() on `first`, so this is the regression guard.
      expect(instances).toHaveLength(2);
      const second = instances[1]!;
      expect(second).not.toBe(first);
      expect(second.connect).toHaveBeenCalledTimes(1);
      expect(second.mailboxOpen).toHaveBeenCalledWith('INBOX');

      await plugin.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('aborts the pending reconnect timer on onStop() - no new ImapFlow instances after stop', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    try {
      // First idle throws → reconnect scheduled. We stop BEFORE the timer fires.
      idleQueue.push('throw');

      const plugin = new EmailImapPlugin();
      await plugin.initialize(makeConfig());
      await plugin.start();

      expect(instances).toHaveLength(1);

      // Let idle loop reject + scheduleReconnect arm the setTimeout.
      await tick();
      await tick();

      // Stop now - the 5s reconnect timer is armed but has not fired.
      await plugin.stop();

      // Advance past any reconnect window. If scheduleReconnect leaked past
      // onStop(), this would build a second ImapFlow.
      await vi.advanceTimersByTimeAsync(120_000);
      await tick();

      expect(instances).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reconnects when the transport fires a `close` event mid-IDLE', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    try {
      // First and second idle both hang - close event is what triggers reconnect.
      idleQueue.push('hang', 'hang');

      const plugin = new EmailImapPlugin();
      await plugin.initialize(makeConfig());
      await plugin.start();

      expect(instances).toHaveLength(1);
      const first = instances[0]!;

      // Simulate transport drop.
      first.emit('close');
      await tick();

      await vi.advanceTimersByTimeAsync(5_000);
      await tick();
      await tick();

      expect(instances).toHaveLength(2);
      expect(instances[1]).not.toBe(first);

      await plugin.stop();
    } finally {
      vi.useRealTimers();
    }
  });
});
