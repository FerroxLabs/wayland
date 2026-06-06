/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Google Chat (Workspace) bot plugin - service-account JWT auth, webhook-driven
 * inbound, REST outbound via the Chat API.
 *
 * Auth flow:
 *   Operator pastes the full service-account JSON keyfile into the ConfigForm.
 *   onInitialize parses it, builds a GoogleAuth instance, and mints an access
 *   token on demand for every REST call. Tokens are cached by google-auth-library
 *   internally (~1 hour TTL).
 *
 * Inbound flow:
 *   Google Chat POSTs a Bearer-JWT-signed webhook to the Wayland WebhookReceiver.
 *   The verifier (webhook/verifiers/google-chat.ts) validates issuer + audience +
 *   exp, then routes the parsed payload here via handleWebhookPayload.
 *
 * Outbound flow:
 *   sendMessage  → POST  /v1/spaces/{space}/messages
 *   editMessage  → PATCH /v1/{messageName}?updateMask=text
 *
 * Capabilities: canEdit=true (Chat API supports PATCH), canReact=false (reactions
 * require a separate Reactions resource not wired in v1 of this plugin).
 */

import { GoogleAuth } from 'google-auth-library';
import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import {
  deriveThreadName,
  googleChatEventToUnified,
  toGoogleChatMessageBody,
  type GoogleChatEvent,
} from './GoogleChatAdapter';

const CHAT_API_BASE = 'https://chat.googleapis.com/v1';
const CHAT_SCOPE = 'https://www.googleapis.com/auth/chat.bot';

type ServiceAccountKey = {
  type?: string;
  project_id?: string;
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

type GoogleChatCreds = {
  serviceAccountJson: string;
  // The JWT `aud` claim the webhook verifier must match. Persisted under
  // `audience` for symmetry with the form + verifier (audit fix HIGH5
  // 2026-05-18 - previously read `projectId` while the form saved
  // `audience`, so inbound verification could never succeed).
  audience?: string;
};

type SpaceListResponse = {
  spaces?: Array<{ name?: string; displayName?: string }>;
};

type SendMessageResponse = {
  name?: string;
};

export class GoogleChatPlugin extends BasePlugin {
  readonly type: PluginType = 'google-chat';

  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canStream: false,
    canReact: false,
    canTypingIndicator: false,
  };

  private auth: GoogleAuth | null = null;
  private serviceEmail: string | null = null;
  /** JWT `aud` claim used by the webhook verifier. Falls back to service-account project_id. */
  private audience: string | null = null;

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = config.credentials ?? {};
    const saJson = typeof creds.serviceAccountJson === 'string' ? creds.serviceAccountJson.trim() : '';
    if (!saJson) throw new Error('Google Chat: serviceAccountJson is required');

    let parsed: ServiceAccountKey;
    try {
      parsed = JSON.parse(saJson) as ServiceAccountKey;
    } catch {
      throw new Error('Google Chat: serviceAccountJson is not valid JSON');
    }

    if (!parsed.private_key || !parsed.client_email) {
      throw new Error('Google Chat: serviceAccountJson must contain private_key and client_email');
    }

    const audience =
      typeof creds.audience === 'string' && creds.audience.trim()
        ? creds.audience.trim()
        : (typeof parsed.project_id === 'string' ? parsed.project_id : '');

    this.auth = new GoogleAuth({
      credentials: parsed as Record<string, unknown>,
      scopes: [CHAT_SCOPE],
    });
    this.serviceEmail = parsed.client_email;
    this.audience = audience || null;
  }

  /**
   * Webhook-driven - nothing to connect on start. WebhookReceiver routes
   * inbound traffic via handleWebhookPayload.
   */
  protected async onStart(): Promise<void> {
    // No-op: Google Chat delivery is push-based via WebhookReceiver.
  }

  protected async onStop(): Promise<void> {
    this.auth = null;
    this.serviceEmail = null;
    this.audience = null;
  }

  getActiveUserCount(): number {
    return 0;
  }

  getBotInfo(): BotInfo | null {
    if (!this.serviceEmail) return null;
    return {
      id: this.serviceEmail,
      username: this.serviceEmail,
      displayName: this.serviceEmail,
    };
  }

  /**
   * Send a text message to a Google Chat space.
   * @param chatId  Space resource name, e.g. "spaces/AAABBBCCC"
   * @returns       Google Chat message resource name (used by editMessage)
   */
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.auth) throw new Error('Google Chat plugin not initialized');
    // Preserve thread continuity: if the caller passed a reply target OR the
    // chatId already encodes a thread, post into that thread instead of
    // creating a new top-level message.
    const threadName =
      deriveThreadName(chatId, message.replyToMessageId) ?? undefined;
    const body = toGoogleChatMessageBody(message, { threadName });
    // POST target is always the space - strip any `/threads/<id>` suffix so we
    // don't double-encode the thread context.
    const spaceSegment = chatId.replace(/\/threads\/[^/]+.*$/, '');
    const url = `${CHAT_API_BASE}/${spaceSegment}/messages`;
    const token = await this.getAccessToken();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errText = await safeText(response);
      throw new Error(`Google Chat send failed (${response.status}): ${errText}`);
    }
    const json = (await response.json().catch(() => ({}))) as SendMessageResponse;
    if (!json.name) {
      throw new Error('Google Chat send response missing message name');
    }
    return json.name;
  }

  /**
   * Edit an existing message in-place.
   * @param _chatId     Unused - message name already contains the space.
   * @param messageId   Google Chat message resource name, e.g. "spaces/A/messages/B"
   */
  async editMessage(_chatId: string, messageId: string, message: IUnifiedOutgoingMessage): Promise<void> {
    if (!this.auth) throw new Error('Google Chat plugin not initialized');
    const body = toGoogleChatMessageBody(message);
    const url = `${CHAT_API_BASE}/${messageId}?updateMask=text`;
    const token = await this.getAccessToken();
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errText = await safeText(response);
      throw new Error(`Google Chat edit failed (${response.status}): ${errText}`);
    }
  }

  /**
   * Process a verified Google Chat webhook payload. Only MESSAGE events produce
   * a unified message; ADDED_TO_SPACE / REMOVED_FROM_SPACE / CARD_CLICKED are
   * logged and dropped.
   */
  async handleWebhookPayload(
    payload: object,
    _headers: Record<string, string | string[] | undefined>,
    pluginInstanceId: string,
  ): Promise<void> {
    const event = payload as GoogleChatEvent;
    const eventType = (event.type ?? event.eventType ?? '').toUpperCase();

    if (eventType !== 'MESSAGE') {
      console.log(`[google-chatPlugin] dropping non-message event: ${eventType}`);
      return;
    }

    const unified = googleChatEventToUnified(event, pluginInstanceId);
    if (!unified) {
      console.warn('[google-chatPlugin] dropping MESSAGE event with no usable text');
      return;
    }

    await this.emitMessage(unified);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async getAccessToken(): Promise<string> {
    if (!this.auth) throw new Error('Google Chat: auth not initialized');
    const client = await this.auth.getClient();
    const access = await client.getAccessToken();
    const token = typeof access === 'string' ? access : access?.token;
    if (!token) throw new Error('Google Chat: failed to obtain access token');
    return token;
  }

  // ── Static Methods ────────────────────────────────────────────────────────

  /**
   * Test connection by minting a token from the service-account JSON and
   * listing spaces (pageSize=1). Returns botUsername = service account email.
   *
   * Credentials are JSON-encoded per TRANSLATION-GUIDE §4:
   *   { serviceAccountJson: string; audience?: string }
   */
  static async testConnection(
    tokenJson: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let creds: GoogleChatCreds;
    try {
      creds = JSON.parse(tokenJson) as GoogleChatCreds;
    } catch {
      return { success: false, error: 'Invalid JSON credentials' };
    }

    const saJson = (creds.serviceAccountJson ?? '').trim();
    if (!saJson) {
      return { success: false, error: 'serviceAccountJson is required' };
    }

    let parsed: ServiceAccountKey;
    try {
      parsed = JSON.parse(saJson) as ServiceAccountKey;
    } catch {
      return { success: false, error: 'serviceAccountJson is not valid JSON' };
    }

    if (!parsed.private_key || !parsed.client_email) {
      return {
        success: false,
        error: 'serviceAccountJson must contain private_key and client_email',
      };
    }

    try {
      const auth = new GoogleAuth({
        credentials: parsed as Record<string, unknown>,
        scopes: [CHAT_SCOPE],
      });
      const client = await auth.getClient();
      const access = await client.getAccessToken();
      const token = typeof access === 'string' ? access : access?.token;
      if (!token) {
        return { success: false, error: 'Failed to obtain access token from service account' };
      }

      // Probe: list spaces to confirm the token is valid and the bot is enrolled.
      const probeUrl = `${CHAT_API_BASE}/spaces?pageSize=1`;
      const response = await fetch(probeUrl, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await safeText(response);
        return {
          success: false,
          error: `Google Chat API returned ${response.status}: ${errText}`,
        };
      }

      const data = (await response.json().catch(() => ({}))) as SpaceListResponse;
      // A bot with no spaces returns an empty list - that's still a valid cred.
      void data;

      return { success: true, botUsername: parsed.client_email };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '<unreadable body>';
  }
}
