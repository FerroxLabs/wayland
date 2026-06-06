/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AgentMail (https://agentmail.com) plugin - webhook-driven inbound + REST
 * outbound, modeled as a buffered text channel like SMS.
 *
 * Email has no edit / streaming / reaction / typing-indicator support, so the
 * plugin declares pure-buffered capabilities and lets `BasePlugin.editMessage`
 * fall through to its no-op default.
 *
 * Webhook delivery: WebhookReceiver verifies the AgentMail HMAC-SHA256
 * signature against the per-connection webhook secret, parses the JSON body,
 * and routes the result here via `handleWebhookPayload`. The receiver owns the
 * HTTP response; this method is pure side-effect: payload -> IUnifiedIncomingMessage -> messageHandler.
 *
 * The exact AgentMail API URL is exposed as a `const` at the top of the file
 * so a future PR can correct it without touching the plugin shape; the
 * documented base is https://api.agentmail.com/v0.
 */

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedIncomingMessage,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import {
  toAgentMailSendBody,
  toUnifiedIncomingFromAgentMail,
  type AgentMailInboundPayload,
} from './EmailAgentMailAdapter';

/**
 * Canonical AgentMail v0 REST base. Stored as a const so a future PR can fix
 * it in one place once the live API is reachable from the build environment.
 */
const AGENTMAIL_API_BASE = 'https://api.agentmail.com/v0';

/**
 * AgentMail inbox descriptor - minimal subset of the `/v0/inboxes` listing
 * response. We only need an addressable identifier to confirm credentials
 * resolve to at least one inbox.
 */
type AgentMailInbox = {
  readonly id?: string;
  readonly address?: string;
  readonly email_address?: string;
};

type AgentMailSendResponse = {
  readonly message_id?: string;
  readonly id?: string;
};

export class EmailAgentMailPlugin extends BasePlugin {
  readonly type: PluginType = 'email-agentmail';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: false,
    canTypingIndicator: false,
  };

  private apiKey: string | null = null;
  private inboxAddress: string | null = null;
  private readonly activeUsers: Set<string> = new Set();

  /**
   * Validate credentials - apiKey + inboxAddress are both required. The
   * webhook secret is verified at receive-time by the registered verifier, not
   * here.
   */
  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = config.credentials ?? {};
    const apiKey = typeof creds.apiKey === 'string' ? creds.apiKey.trim() : '';
    const inboxAddress = typeof creds.inboxAddress === 'string' ? creds.inboxAddress.trim() : '';

    if (!apiKey) throw new Error('AgentMail API key is required');
    if (!inboxAddress) throw new Error('AgentMail inbox address is required');

    this.apiKey = apiKey;
    this.inboxAddress = inboxAddress;
  }

  /**
   * Webhook-driven plugin - nothing to start. WebhookReceiver routes inbound
   * traffic via `handleWebhookPayload`.
   */
  protected async onStart(): Promise<void> {
    // No-op: AgentMail delivery is fully push-based via WebhookReceiver.
  }

  /**
   * Nothing to stop - webhook routes are owned by the receiver lifecycle,
   * not this plugin instance.
   */
  protected async onStop(): Promise<void> {
    this.apiKey = null;
    this.inboxAddress = null;
    this.activeUsers.clear();
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.inboxAddress) return null;
    return {
      id: this.inboxAddress,
      username: this.inboxAddress,
      displayName: this.inboxAddress,
    };
  }

  /**
   * Email does not support in-place edits - surface a clear error so the
   * caller does not silently believe an edit succeeded. ActionExecutor will
   * only call this if capabilities.canEdit is true, which it is not, so this
   * is a defensive guard.
   */
  async editMessage(): Promise<void> {
    throw new Error('Email does not support editing messages');
  }

  /**
   * Send an email via the AgentMail REST API. `chatId` is the recipient
   * address; `message.text` is the body; `message.subject` (optional) sets
   * the subject line; `message.replyToMessageId` becomes the In-Reply-To
   * header so replies thread in the recipient's client.
   *
   * Returns AgentMail's message id, which downstream code can use as the
   * platform-message id (even though we cannot edit it later).
   */
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.apiKey || !this.inboxAddress) {
      throw new Error('AgentMail plugin not initialized');
    }

    const body = toAgentMailSendBody(message, chatId);
    const url = `${AGENTMAIL_API_BASE}/inboxes/${encodeURIComponent(this.inboxAddress)}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await safeReadText(response);
      throw new Error(`AgentMail send failed (${response.status}): ${errText}`);
    }

    const json = (await response.json().catch(() => ({}))) as AgentMailSendResponse;
    const id = json.message_id ?? json.id;
    if (!id) {
      throw new Error('AgentMail send response missing message_id');
    }
    return id;
  }

  /**
   * Convert a verified AgentMail inbound payload into the unified format and
   * emit through the registered message handler. The receiver hands us the
   * parsed JSON object as the `payload` argument; we never parse the raw body
   * ourselves.
   */
  async handleWebhookPayload(
    payload: object,
    _headers: Record<string, string | string[] | undefined>,
    _pluginInstanceId: string
  ): Promise<void> {
    const unified = this.toUnifiedIncomingMessage(payload as AgentMailInboundPayload);
    if (!unified) {
      console.warn(
        '[email-agentmailPlugin] Dropping payload without required message_id/from fields'
      );
      return;
    }
    this.activeUsers.add(unified.user.id);
    await this.emitMessage(unified);
  }

  /**
   * Map an AgentMail webhook payload into IUnifiedIncomingMessage. Exposed
   * for unit testing - the adapter logic is pure and worth covering directly.
   */
  toUnifiedIncomingMessage(payload: AgentMailInboundPayload): IUnifiedIncomingMessage | null {
    return toUnifiedIncomingFromAgentMail(payload, this.inboxAddress ?? '');
  }

  // ==================== Static Methods ====================

  /**
   * Test connection by listing inboxes for the given API key. Returns the
   * first inbox address found so the renderer can persist it as
   * `credentials.inboxAddress`.
   */
  static async testConnection(
    apiKey: string
  ): Promise<{ success: boolean; inboxAddress?: string; error?: string }> {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      return { success: false, error: 'API key is required' };
    }

    try {
      const response = await fetch(`${AGENTMAIL_API_BASE}/inboxes`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${trimmed}`,
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await safeReadText(response);
        return {
          success: false,
          error: `AgentMail testConnection failed (${response.status}): ${errText}`,
        };
      }

      const data = (await response.json().catch((): null => null)) as
        | { readonly inboxes?: readonly AgentMailInbox[] }
        | readonly AgentMailInbox[]
        | null;

      const inboxes: readonly AgentMailInbox[] = Array.isArray(data)
        ? (data as readonly AgentMailInbox[])
        : ((data as { readonly inboxes?: readonly AgentMailInbox[] } | null)?.inboxes ?? []);
      const first = inboxes[0];
      const address = first?.address ?? first?.email_address ?? first?.id;
      if (!address) {
        return { success: false, error: 'No AgentMail inboxes found for this API key' };
      }
      return { success: true, inboxAddress: address };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '<unreadable body>';
  }
}
