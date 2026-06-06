/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * NextcloudTalkPlugin reconnect coverage: when the poll loop keeps failing,
 * the plugin must give up after RECONNECT_BACKOFF_MAX_ATTEMPTS (5) and
 * transition to status='error' with a clear reason - and stop issuing further
 * whoami/poll requests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

// ── Hoist the fetch mock (Vitest 4 hoisting rules) ────────────────────────────
const { mockFetch } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  return { mockFetch };
});

vi.stubGlobal('fetch', mockFetch);

import { NextcloudTalkPlugin } from '@process/channels/plugins/tier3/nextcloud-talk/NextcloudTalkPlugin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConfig(): IChannelPluginConfig {
  return {
    id: 'nextcloud-talk_default',
    type: 'nextcloud-talk',
    name: 'Nextcloud Talk',
    enabled: true,
    status: 'created',
    credentials: {
      serverUrl: 'https://cloud.example.com',
      username: 'bot',
      appPassword: 'xxxx-xxxx-xxxx-xxxx',
      rooms: 'roomA',
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

function makeWhoamiResponse(): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      ocs: {
        meta: { status: 'ok', statuscode: 200, message: 'OK' },
        data: { id: 'bot', displayname: 'bot' },
      },
    }),
  } as unknown as Response;
}

function makePoll500Response(): Response {
  return {
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    json: async () => ({}),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
  // whoami succeeds once at start; polls always fail with 500 → triggers
  // generic reconnect path.
  mockFetch.mockImplementation((url: string) => {
    if (String(url).includes('/cloud/user')) {
      return Promise.resolve(makeWhoamiResponse());
    }
    return Promise.resolve(makePoll500Response());
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('NextcloudTalkPlugin reconnect max-attempt give-up', () => {
  it('transitions to status=error after 5 failed reconnect attempts and stops polling', async () => {
    const plugin = new NextcloudTalkPlugin();
    await plugin.initialize(makeConfig());
    await plugin.start();

    // Drive the reconnect loop with fake timers - each cycle: poll 500 → throw
    // → scheduleReconnect (timer) → fires → startPollLoop → poll 500 → throw …
    // After 6 reconnect entries, the >MAX check sets status='error'.
    vi.useFakeTimers();

    // Let each failure + reconnect-timer cycle resolve. The backoff caps at
    // 60s, so advancing by 60s per cycle is sufficient. We also drain
    // microtasks between advances so the inner async poll resolves.
    for (let i = 0; i < 8; i += 1) {
      await vi.advanceTimersByTimeAsync(60_000);
    }

    expect(plugin.status).toBe('error');
    expect(plugin.error).toBe(
      'Nextcloud Talk disconnected after 5 reconnect attempts',
    );

    // After the error transition, no further whoami or poll requests should
    // fire - capture the count, advance further, confirm it's unchanged.
    const callsAfterError = mockFetch.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000 * 5);
    expect(mockFetch.mock.calls.length).toBe(callsAfterError);

    // No whoami call after the initial start-time one.
    const whoamiCount = mockFetch.mock.calls.filter(([url]: [string]) =>
      String(url).includes('/cloud/user'),
    ).length;
    expect(whoamiCount).toBe(1);

    vi.useRealTimers();
    await plugin.stop();
  });
});
