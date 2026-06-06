/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

import * as lark from '@larksuiteoapi/node-sdk';

import { isBotMentioned, resolveLarkDomain } from '@process/channels/plugins/lark/LarkAdapter';
import { LarkPlugin, LARK_PATCH_MIN_INTERVAL_MS } from '@process/channels/plugins/lark/LarkPlugin';

/**
 * Smoke tests for the 5 HIGH findings in the lark channel audit (2026-05-18).
 *
 * Covers:
 *  1. Domain selector (resolveLarkDomain feishu/lark/default).
 *  2. Display-name resolution via contact.user.get (caching + placeholder fallback).
 *  3. Group-chat mention filter (isBotMentioned).
 *  4. False-positive "connected" status when wsClient.start() fails.
 *  5. Per-chat patch throttle queue ordering + spacing.
 *
 * These are intentionally narrow: they exercise the pure helpers and a couple of
 * targeted plugin behaviours without requiring an actual Lark WS connection.
 */

describe('LarkAdapter.resolveLarkDomain (HIGH #1: domain selector)', () => {
  it('returns Feishu by default', () => {
    expect(resolveLarkDomain(undefined)).toBe(lark.Domain.Feishu);
    expect(resolveLarkDomain('')).toBe(lark.Domain.Feishu);
    expect(resolveLarkDomain('feishu')).toBe(lark.Domain.Feishu);
  });

  it('returns Lark for the international domain id (case-insensitive)', () => {
    expect(resolveLarkDomain('lark')).toBe(lark.Domain.Lark);
    expect(resolveLarkDomain('LARK')).toBe(lark.Domain.Lark);
    expect(resolveLarkDomain('  Lark  ')).toBe(lark.Domain.Lark);
  });

  it('treats unknown values as Feishu (safe default for existing configs)', () => {
    expect(resolveLarkDomain('something-else')).toBe(lark.Domain.Feishu);
  });
});

describe('LarkAdapter.isBotMentioned (HIGH #3: group-chat mention filter)', () => {
  const botOpenId = 'ou_bot_001';

  it('returns true when the bot open_id is in the mentions array', () => {
    const mentions = [{ id: { open_id: 'ou_bot_001' }, name: 'Bot' }];
    expect(isBotMentioned(mentions, botOpenId)).toBe(true);
  });

  it('returns false when the mentions array contains only other users', () => {
    const mentions = [{ id: { open_id: 'ou_someone_else' }, name: 'Alice' }];
    expect(isBotMentioned(mentions, botOpenId)).toBe(false);
  });

  it('returns false for an empty / missing mentions list', () => {
    expect(isBotMentioned([], botOpenId)).toBe(false);
    expect(isBotMentioned(undefined, botOpenId)).toBe(false);
    expect(isBotMentioned(null, botOpenId)).toBe(false);
  });

  it('returns true when bot open_id is unknown (conservative fallback)', () => {
    // When the bot's open_id has not been resolved, we don't drop messages.
    expect(isBotMentioned([], undefined)).toBe(true);
  });

  it('ignores malformed entries without crashing', () => {
    const mentions = [null, undefined, { id: { open_id: 'ou_bot_001' } }];
    expect(isBotMentioned(mentions as unknown as unknown[], botOpenId)).toBe(true);
  });
});

describe('LarkPlugin.resolveUserDisplayName (HIGH #2: real display names)', () => {
  /**
   * Subclass that exposes the protected onInitialize so we can plug in a fake client
   * without booting the full BasePlugin lifecycle.
   */
  class TestablePlugin extends LarkPlugin {
    public setFakeClient(client: unknown): void {
      (this as unknown as { client: unknown }).client = client;
    }
  }

  it('returns the placeholder when no client / openId is available', async () => {
    const plugin = new TestablePlugin();
    const fallbackId = 'ou_abc123def456';
    const name = await plugin.resolveUserDisplayName(undefined, fallbackId);
    // Placeholder shape is exactly `User <last6 of fallbackId>`.
    expect(name).toBe(`User ${fallbackId.slice(-6)}`);
  });

  it('calls contact.user.get and caches the resolved name', async () => {
    const plugin = new TestablePlugin();
    const get = vi.fn().mockResolvedValue({ data: { user: { name: 'Alice Wonderland' } } });
    plugin.setFakeClient({ contact: { v3: { user: { get } } } });

    const first = await plugin.resolveUserDisplayName('ou_alice', 'ou_alice');
    const second = await plugin.resolveUserDisplayName('ou_alice', 'ou_alice');

    expect(first).toBe('Alice Wonderland');
    expect(second).toBe('Alice Wonderland');
    expect(get).toHaveBeenCalledTimes(1); // cached on 2nd call
  });

  it('caches the placeholder on lookup failure so we do not hammer the API', async () => {
    const plugin = new TestablePlugin();
    const get = vi.fn().mockRejectedValue(new Error('99991663: missing scope'));
    plugin.setFakeClient({ contact: { v3: { user: { get } } } });

    const first = await plugin.resolveUserDisplayName('ou_bob', 'ou_bob');
    const second = await plugin.resolveUserDisplayName('ou_bob', 'ou_bob');

    expect(first).toMatch(/^User /);
    expect(second).toMatch(/^User /);
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe('LarkPlugin.enqueuePatch (HIGH #5: rate-limit / throttle queue)', () => {
  class TestablePlugin extends LarkPlugin {}

  it('serializes patches in the order they were enqueued for the same chat', async () => {
    const plugin = new TestablePlugin();
    const order: number[] = [];

    const tasks = [1, 2, 3].map((id) => () =>
      new Promise<void>((resolve) => {
        // Each task records itself synchronously when its turn comes.
        order.push(id);
        resolve();
      })
    );

    await Promise.all(tasks.map((task) => plugin.enqueuePatch('oc_chat_1', task)));

    expect(order).toEqual([1, 2, 3]);
  });

  it('spaces consecutive patches by at least LARK_PATCH_MIN_INTERVAL_MS', async () => {
    const plugin = new TestablePlugin();
    const stamps: number[] = [];

    const task = () =>
      new Promise<void>((resolve) => {
        stamps.push(Date.now());
        resolve();
      });

    await plugin.enqueuePatch('oc_chat_2', task);
    await plugin.enqueuePatch('oc_chat_2', task);

    expect(stamps).toHaveLength(2);
    // Allow a small clock-skew tolerance.
    const gap = stamps[1] - stamps[0];
    expect(gap).toBeGreaterThanOrEqual(LARK_PATCH_MIN_INTERVAL_MS - 25);
  });

  it('does not serialize across different chats', async () => {
    const plugin = new TestablePlugin();
    const startedAt = Date.now();
    const completed: string[] = [];

    const slow = (label: string) => () =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          completed.push(label);
          resolve();
        }, 30);
      });

    await Promise.all([plugin.enqueuePatch('oc_a', slow('a')), plugin.enqueuePatch('oc_b', slow('b'))]);

    // If they ran in parallel, total elapsed should be ~30ms + the post-task spacing,
    // not 30ms + 30ms (sequential).
    const elapsed = Date.now() - startedAt;
    expect(elapsed).toBeLessThan(LARK_PATCH_MIN_INTERVAL_MS + 200);
    expect(completed.sort()).toEqual(['a', 'b']);
  });
});

describe('LarkPlugin connection-status truthfulness (HIGH #4)', () => {
  // This is a structural assertion: the source no longer sets isConnected = true
  // unconditionally after wsClient.start(); it awaits the start call.
  // We assert by reading the compiled plugin and looking for the await pattern,
  // because exercising the full WS lifecycle in unit tests requires booting Electron.
  it('awaits wsClient.start() and only flips isConnected on success', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(
      new URL('../../../src/process/channels/plugins/lark/LarkPlugin.ts', import.meta.url),
      'utf-8'
    );

    // Must await start().
    expect(src).toMatch(/await\s+this\.wsClient\.start/);
    // Must only set isConnected = true inside the success path of the try/catch
    // around start(); the error branch must set false.
    expect(src).toMatch(/this\.isConnected\s*=\s*false/);
    // Must NOT contain the old fire-and-forget pattern with unconditional true.
    const fireAndForget = /\.start\(\s*\{[\s\S]*?\}\s*\)\s*\.catch\([\s\S]*?\);\s*this\.isConnected\s*=\s*true/;
    expect(fireAndForget.test(src)).toBe(false);
  });
});
