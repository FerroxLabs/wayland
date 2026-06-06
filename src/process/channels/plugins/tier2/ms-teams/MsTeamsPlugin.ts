/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Microsoft Teams plugin via Azure Bot Service / Bot Framework.
 *
 * Transport: webhook-receive (Bot Framework POSTs activities to the bot
 * endpoint) + REST send via Bot Framework Connector API.
 *
 * No botbuilder / botframework-connector peer dep - those packages pull in
 * ~120 MB of transitive deps. Instead we use raw fetch + jose for JWT
 * verification. The Connector send path is a plain POST to
 * {serviceUrl}/v3/conversations/{conversationId}/activities.
 *
 * Credentials: appId (Azure AD app registration client ID) + appPassword
 * (client secret) + optional tenantId. A Bot Framework OAuth2 token is
 * minted per-send via the client-credentials grant.
 *
 * Capabilities: text + edit + react + typing.
 *
 * Harvested from openclaw/extensions/msteams/src/{token,send,inbound}.ts -
 * credential resolution, send/edit flows, conversation ID normalisation.
 */

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import {
  splitMsTeamsMessage,
  toOutboundActivity,
  toUnifiedIncomingFromActivity,
  type BotFrameworkActivity,
} from './MsTeamsAdapter';

// Bot Framework token endpoint - client-credentials grant against the
// multi-tenant common endpoint. Bot Framework Connector accepts tokens minted
// against 'botframework.com' for both single-tenant and multi-tenant bots,
// so we do not collect tenantId from users.
const BF_TOKEN_URL = 'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token';
const BF_TOKEN_SCOPE = 'https://api.botframework.com/.default';

// Token lifetime buffer: refresh 5 min before expiry
const TOKEN_BUFFER_MS = 5 * 60 * 1000;

// Typing activity keep-alive: Teams auto-expires typing after ~8s, send every 5s
const TYPING_INTERVAL_MS = 5_000;

type MsTeamsCreds = {
  appId: string;
  appPassword: string;
};

type TokenCache = {
  accessToken: string;
  expiresAt: number; // epoch ms
};

/**
 * Mint or return a cached Bot Framework OAuth2 bearer token.
 * Exported so tests can replace it via vi.spyOn / module mock.
 */
export async function mintBotFrameworkToken(creds: MsTeamsCreds): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: creds.appId,
    client_secret: creds.appPassword,
    scope: BF_TOKEN_SCOPE,
  });

  const resp = await fetch(BF_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await safeText(resp);
    throw new Error(`Bot Framework token fetch failed (${resp.status}): ${text}`);
  }

  const json = (await resp.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error('Bot Framework token response missing access_token');
  return json.access_token;
}

export class MsTeamsPlugin extends BasePlugin {
  readonly type: PluginType = 'ms-teams';

  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canStream: false,
    canReact: true,
    canTypingIndicator: true,
  };

  private creds: MsTeamsCreds | null = null;
  private tokenCache: TokenCache | null = null;
  private botId: string | null = null;
  private readonly activeUsers: Set<string> = new Set();

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const c = config.credentials ?? {};
    const appId = typeof c.appId === 'string' ? c.appId.trim() : '';
    const appPassword = typeof c.appPassword === 'string' ? c.appPassword.trim() : '';

    if (!appId) throw new Error('MS Teams: appId (Azure AD app registration ID) is required');
    if (!appPassword) throw new Error('MS Teams: appPassword (Azure AD client secret) is required');

    this.creds = { appId, appPassword };
    this.botId = appId; // Bot Framework uses appId as the recipient ID in activities
  }

  /**
   * Webhook-driven plugin - nothing to start. Bot Framework POSTs activities
   * to our registered webhook endpoint; WebhookReceiver routes them here.
   * Validate credentials by minting a token at start time (fail-fast on bad creds).
   */
  protected async onStart(): Promise<void> {
    if (!this.creds) throw new Error('MS Teams plugin not initialized');

    // Fail-fast: verify we can actually mint a token before marking running.
    // Mirror MatrixPlugin's whoami() pattern.
    try {
      await this.getToken();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`MS Teams credential check failed (cannot mint Bot Framework token): ${msg}`, { cause: error });
    }
  }

  protected async onStop(): Promise<void> {
    this.creds = null;
    this.tokenCache = null;
    this.botId = null;
    this.activeUsers.clear();
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.creds) return null;
    return {
      id: this.creds.appId,
      username: this.creds.appId,
      displayName: `Teams bot (${this.creds.appId})`,
    };
  }

  /**
   * Send a message to a Teams conversation via the Bot Framework Connector.
   *
   * `chatId` encodes "{serviceUrl}|{conversationId}" - the serviceUrl is
   * tenant-specific and required by the Connector API. We expect the renderer
   * / caller to pass it in that format after first receiving an activity.
   *
   * For simplicity, chatId may also be just a conversationId when serviceUrl
   * is already known from a stored conversation reference; in that case the
   * caller provides a stored serviceUrl via the plugin config options.
   */
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.creds) throw new Error('MS Teams plugin not initialized');

    const { serviceUrl, conversationId } = parseChatId(chatId);
    const token = await this.getToken();

    const text = message.text ?? '';
    const chunks = splitMsTeamsMessage(text);

    // Keep the Teams typing indicator alive across multi-chunk sends. Teams
    // auto-expires typing after ~8s, so we re-POST every 5s until done.
    const stopTyping = this.startTypingLoop(chatId);

    try {
      let lastActivityId = '';
      for (const chunk of chunks) {
        const activity = toOutboundActivity({ ...message, text: chunk });
        const url = `${serviceUrl}/v3/conversations/${encodeURIComponent(conversationId)}/activities`;

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(activity),
        });

        if (!resp.ok) {
          const errText = await safeText(resp);
          throw new Error(`MS Teams send failed (${resp.status}): ${errText}`);
        }

        const json = (await resp.json().catch(() => ({}))) as { id?: string };
        lastActivityId = json.id ?? lastActivityId;
      }

      return lastActivityId;
    } finally {
      stopTyping();
    }
  }

  /**
   * Edit a previously-sent activity via PUT.
   * Bot Framework edit: PUT {serviceUrl}/v3/conversations/{convId}/activities/{activityId}
   */
  async editMessage(
    chatId: string,
    messageId: string,
    message: IUnifiedOutgoingMessage,
  ): Promise<void> {
    if (!this.creds) throw new Error('MS Teams plugin not initialized');

    const { serviceUrl, conversationId } = parseChatId(chatId);
    const token = await this.getToken();

    const activity = toOutboundActivity(message);
    const url = `${serviceUrl}/v3/conversations/${encodeURIComponent(conversationId)}/activities/${encodeURIComponent(messageId)}`;

    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(activity),
    });

    if (!resp.ok) {
      const errText = await safeText(resp);
      throw new Error(`MS Teams edit failed (${resp.status}): ${errText}`);
    }
  }

  /**
   * Send a single typing indicator activity.
   * The typing activity has no response body worth reading.
   */
  async sendTypingIndicator(chatId: string): Promise<void> {
    if (!this.creds) return;
    await this.postTypingOnce(chatId);
  }

  /**
   * Start a typing keep-alive loop. Teams auto-expires typing after ~8s,
   * so we re-POST every 5s until the returned stop function is called.
   * The first typing activity fires immediately; subsequent ones every 5s.
   * Returns a stop function that clears the interval. Safe to call before
   * the first send completes; safe to call the stop function multiple times.
   */
  startTypingLoop(chatId: string): () => void {
    if (!this.creds) return () => {};

    // Fire-and-forget the first activity immediately
    void this.postTypingOnce(chatId);

    const handle = setInterval(() => {
      void this.postTypingOnce(chatId);
    }, TYPING_INTERVAL_MS);

    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      clearInterval(handle);
    };
  }

  private async postTypingOnce(chatId: string): Promise<void> {
    if (!this.creds) return;

    const { serviceUrl, conversationId } = parseChatId(chatId);
    const token = await this.getToken().catch((): string | null => null);
    if (!token) return;

    const url = `${serviceUrl}/v3/conversations/${encodeURIComponent(conversationId)}/activities`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'typing' }),
      });
    } catch (err: unknown) {
      console.warn('[MsTeamsPlugin] typing indicator failed (non-fatal):', err);
    }
  }

  /**
   * Add a reaction to a message via the Bot Framework messageReaction activity.
   *
   * Teams reactions are limited to: like, heart, laugh, surprised, sad, angry.
   * The reaction is sent as a messageReaction activity directed at the original
   * message's activityId.
   */
  async addReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    if (!this.creds) return;

    const { serviceUrl, conversationId } = parseChatId(chatId);
    const token = await this.getToken();

    const url = `${serviceUrl}/v3/conversations/${encodeURIComponent(conversationId)}/activities`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'messageReaction',
        reactionsAdded: [{ type: emoji }],
        replyToId: messageId,
      }),
    });

    if (!resp.ok) {
      const errText = await safeText(resp);
      throw new Error(`MS Teams reaction failed (${resp.status}): ${errText}`);
    }
  }

  /**
   * Handle an inbound Bot Framework activity delivered by the WebhookReceiver.
   * The verifier has already validated the JWT; we receive the parsed activity.
   */
  async handleWebhookPayload(
    payload: object,
    _headers: Record<string, string | string[] | undefined>,
    _pluginInstanceId: string,
  ): Promise<void> {
    const activity = payload as BotFrameworkActivity;
    const selfId = this.botId ?? this.creds?.appId ?? '';

    const unified = toUnifiedIncomingFromActivity(activity, selfId);
    if (!unified) {
      // Non-message activity (typing, conversationUpdate, invoke) - acknowledge but skip
      return;
    }

    this.activeUsers.add(unified.user.id);
    await this.emitMessage(unified);
  }

  // ── Token management ──────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + TOKEN_BUFFER_MS) {
      return this.tokenCache.accessToken;
    }

    if (!this.creds) throw new Error('No credentials');

    const accessToken = await mintBotFrameworkToken(this.creds);
    // Bot Framework tokens expire in 3600s; cache for 55 minutes to be safe
    this.tokenCache = {
      accessToken,
      expiresAt: Date.now() + 55 * 60 * 1000,
    };
    return accessToken;
  }

  // ── Static ────────────────────────────────────────────────────────────────

  /**
   * Test connection by minting a Bot Framework token. A successful token mint
   * proves the appId + appPassword are valid Azure AD credentials.
   *
   * Expects JSON-encoded `{ appId, appPassword }`. The multi-tenant common
   * endpoint handles single-tenant bots correctly; tenantId is intentionally
   * not collected (dropped in v0.4.1 as part of the channel cleanup wave).
   */
  static override async testConnection(
    tokenJson: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let creds: MsTeamsCreds;
    try {
      creds = JSON.parse(tokenJson) as MsTeamsCreds;
    } catch {
      return { success: false, error: 'Invalid JSON credentials' };
    }

    if (!creds.appId?.trim()) {
      return { success: false, error: 'appId is required' };
    }
    if (!creds.appPassword?.trim()) {
      return { success: false, error: 'appPassword is required' };
    }

    try {
      await mintBotFrameworkToken(creds);
      return { success: true, botUsername: creds.appId };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (/401|unauthorized|invalid_client/i.test(msg)) {
        return { success: false, error: 'Invalid appId or appPassword (Azure AD rejected credentials)' };
      }
      return { success: false, error: msg };
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse chatId format "{serviceUrl}|{conversationId}".
 * The pipe separator avoids ambiguity with the URL and with Teams conversation
 * IDs that can themselves contain colons and slashes.
 *
 * If no separator is found, treat the whole string as the conversationId and
 * fall back to a default service URL (for testing / proactive-only setups).
 */
function parseChatId(chatId: string): { serviceUrl: string; conversationId: string } {
  const sep = chatId.indexOf('|');
  if (sep === -1) {
    return {
      serviceUrl: 'https://smba.trafficmanager.net/apis',
      conversationId: chatId,
    };
  }
  return {
    serviceUrl: chatId.slice(0, sep),
    conversationId: chatId.slice(sep + 1),
  };
}

async function safeText(resp: Response): Promise<string> {
  try {
    return await resp.text();
  } catch {
    return '<unreadable body>';
  }
}

export { TYPING_INTERVAL_MS };
