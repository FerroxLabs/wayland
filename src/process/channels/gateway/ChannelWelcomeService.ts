/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatabase } from '@process/services/database';
import type { IUnifiedOutgoingMessage } from '../types';

const DEFAULT_WELCOME = "Hey, it's Wayland. I'm connected. Reply to this message any time and I'll help you out.";

/**
 * Function a caller supplies to actually deliver the welcome to a target.
 * Returns the platform message id (ignored) or throws on failure.
 */
export type WelcomeSendFn = (target: string, message: IUnifiedOutgoingMessage) => Promise<string>;

/**
 * ChannelWelcomeService - one place that owns the "Hey, it's Wayland" welcome
 * handshake across every channel, so the behaviour and the once-per-account
 * guard live in exactly one spot instead of being copy-pasted per plugin.
 *
 * Two delivery paths, picked by whether the channel can initiate a thread:
 *
 * - welcomeOnConnect: channels that know a self target (WhatsApp/iMessage/
 *   Signal self-chat, Email own address) get welcomed the moment they connect.
 * - welcomeOnFirstContact: bot channels (Telegram/Discord/Slack) have no chat
 *   id until the user messages them first, so they get welcomed when the first
 *   authorized conversation is created.
 *
 * Both paths share ONE persistent "already welcomed this account?" check keyed
 * by platform + account identity, so the welcome fires once per account rather
 * than once per app restart.
 */
export class ChannelWelcomeService {
  /**
   * Resolve the welcome body. Centralised so every channel says the same thing
   * and the copy is translated. i18n is imported lazily (dynamic import) so that
   * merely importing this service - e.g. from a plugin module under unit test -
   * does not pull the i18n module's load-time platform-service access onto the
   * import graph. Falls back to the English default if i18n is unavailable.
   */
  private async welcomeText(): Promise<string> {
    try {
      const i18n = (await import('@process/services/i18n')).default;
      return i18n.t('settings.channels.welcome.message', { defaultValue: DEFAULT_WELCOME });
    } catch {
      return DEFAULT_WELCOME;
    }
  }

  /**
   * Has this account already been welcomed? Defensive: a DB error reads as
   * "already welcomed" so a transient failure never spams the user.
   */
  async hasWelcomed(platform: string, accountId: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = db.hasChannelWelcomed(platform, accountId);
      return result.success ? !!result.data : true;
    } catch (err) {
      console.warn('[ChannelWelcomeService] hasWelcomed check failed (treating as welcomed):', err);
      return true;
    }
  }

  /**
   * Clear the welcome marker so the next connect re-sends it. Called on a
   * genuine re-pair (logged out / account change), NOT on a normal stop.
   */
  async rearm(platform: string, accountId: string): Promise<void> {
    try {
      const db = await getDatabase();
      db.clearChannelWelcome(platform, accountId);
    } catch (err) {
      console.warn('[ChannelWelcomeService] rearm failed:', err);
    }
  }

  /**
   * Welcome-on-connect for channels that can initiate a thread. Sends the
   * handshake to `target` exactly once per account; marks the account welcomed
   * only after a successful send so a failed send retries on the next connect.
   *
   * @returns true if a welcome was sent, false if skipped (already welcomed).
   */
  async welcomeOnConnect(platform: string, accountId: string, target: string, send: WelcomeSendFn): Promise<boolean> {
    if (!accountId || !target) return false;
    if (await this.hasWelcomed(platform, accountId)) return false;
    return this.deliver(platform, accountId, target, send);
  }

  /**
   * Welcome-on-first-contact for bot channels. Sends the handshake to `target`
   * (the conversation that was just created) exactly once per account. Channels
   * already welcomed on connect are skipped by the shared guard, so this never
   * double-sends.
   *
   * @returns true if a welcome was sent, false if skipped.
   */
  async welcomeOnFirstContact(
    platform: string,
    accountId: string,
    target: string,
    send: WelcomeSendFn
  ): Promise<boolean> {
    if (!accountId || !target) return false;
    if (await this.hasWelcomed(platform, accountId)) return false;
    return this.deliver(platform, accountId, target, send);
  }

  /**
   * Shared delivery: send then mark. Marking only after a successful send keeps
   * the once-per-account guard honest under transient send failures.
   */
  private async deliver(platform: string, accountId: string, target: string, send: WelcomeSendFn): Promise<boolean> {
    try {
      await send(target, { type: 'text', text: await this.welcomeText() });
    } catch (err) {
      console.warn(`[ChannelWelcomeService] welcome send failed for ${platform}/${accountId}:`, err);
      return false;
    }
    try {
      const db = await getDatabase();
      db.markChannelWelcomed(platform, accountId);
    } catch (err) {
      console.warn('[ChannelWelcomeService] markWelcomed failed:', err);
    }
    return true;
  }
}

let singleton: ChannelWelcomeService | null = null;

/** Shared singleton so PluginManager and ActionExecutor use the same guard. */
export function getChannelWelcomeService(): ChannelWelcomeService {
  singleton ??= new ChannelWelcomeService();
  return singleton;
}
