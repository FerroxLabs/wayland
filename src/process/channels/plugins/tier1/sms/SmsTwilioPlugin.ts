/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SMS (Twilio) plugin — buffered inbound via WebhookReceiver + outbound via
 * Twilio Messaging REST API.
 *
 * SMS has no edit / streaming / reaction / typing-indicator support, so the
 * plugin declares pure-buffered capabilities and lets `BasePlugin.editMessage`
 * fall through to its no-op default.
 *
 * Webhook delivery: WebhookReceiver verifies the Twilio HMAC-SHA1 signature
 * against the platform's auth token, parses the `application/x-www-form-urlencoded`
 * body into a plain string-map, and routes the result here via
 * `handleWebhookPayload`. The receiver owns the HTTP response; this method is
 * pure side-effect: payload -> IUnifiedIncomingMessage -> messageHandler.
 */

import type { Twilio } from 'twilio';
import twilio from 'twilio';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedIncomingMessage,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';

/**
 * Twilio inbound webhook payload — the subset of fields we care about.
 * Twilio sends a flat form-encoded map; the verifier parses to Record<string, string>.
 */
interface TwilioInboundParams {
  MessageSid?: string;
  From?: string;
  To?: string;
  Body?: string;
  NumMedia?: string;
  AccountSid?: string;
  [key: string]: string | undefined;
}

export class SmsTwilioPlugin extends BasePlugin {
  readonly type: PluginType = 'sms-twilio';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: false,
    canTypingIndicator: false,
  };

  private client: Twilio | null = null;
  private accountSid: string | null = null;
  private fromNumber: string | null = null;
  private messagingServiceSid: string | null = null;
  private readonly activeUsers: Set<string> = new Set();

  /**
   * Validate credentials + construct the Twilio REST client.
   */
  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = config.credentials ?? {};
    const accountSid = typeof creds.accountSid === 'string' ? creds.accountSid.trim() : '';
    const authToken = typeof creds.authToken === 'string' ? creds.authToken.trim() : '';
    const fromNumber = typeof creds.fromNumber === 'string' ? creds.fromNumber.trim() : '';
    const messagingServiceSid =
      typeof creds.messagingServiceSid === 'string' ? creds.messagingServiceSid.trim() : '';

    if (!accountSid) throw new Error('Twilio Account SID is required');
    if (!authToken) throw new Error('Twilio Auth Token is required');
    if (!fromNumber && !messagingServiceSid) {
      throw new Error('Either a From Number or Messaging Service SID is required');
    }
    if (!accountSid.startsWith('AC')) {
      throw new Error('Twilio Account SID must start with "AC"');
    }

    this.accountSid = accountSid;
    this.fromNumber = fromNumber || null;
    this.messagingServiceSid = messagingServiceSid || null;
    this.client = twilio(accountSid, authToken);
  }

  /**
   * Webhook-driven plugin — nothing to start (no polling loop, no websocket).
   * WebhookReceiver routes inbound traffic via `handleWebhookPayload`.
   */
  protected async onStart(): Promise<void> {
    // No-op: SMS delivery is fully push-based via WebhookReceiver.
  }

  /**
   * Nothing to stop — webhook routes are owned by the receiver lifecycle,
   * not this plugin instance.
   */
  protected async onStop(): Promise<void> {
    this.client = null;
    this.accountSid = null;
    this.fromNumber = null;
    this.messagingServiceSid = null;
    this.activeUsers.clear();
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.accountSid) return null;
    const displayName = this.fromNumber ?? this.messagingServiceSid ?? this.accountSid;
    return {
      id: this.accountSid,
      username: displayName,
      displayName,
    };
  }

  /**
   * Send an SMS via Twilio Programmable Messaging REST API.
   * Returns the Twilio Message SID, which downstream code can use as the
   * platform-message id (even though we cannot edit it later).
   */
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }
    const body = (message.text ?? '').trim();
    if (!body) {
      throw new Error('SMS body cannot be empty');
    }

    const params: { to: string; body: string; from?: string; messagingServiceSid?: string } = {
      to: chatId,
      body,
    };
    if (this.messagingServiceSid) {
      params.messagingServiceSid = this.messagingServiceSid;
    } else if (this.fromNumber) {
      params.from = this.fromNumber;
    } else {
      throw new Error('No fromNumber or messagingServiceSid configured');
    }

    const result = await this.client.messages.create(params);
    return result.sid;
  }

  /**
   * Convert a verified Twilio inbound payload into the unified format and
   * emit through the registered message handler.
   *
   * The receiver hands us the parsed form map as the `payload` argument; we
   * never have to parse the raw body ourselves.
   */
  async handleWebhookPayload(
    payload: object,
    _headers: Record<string, string | string[] | undefined>,
    _pluginInstanceId: string
  ): Promise<void> {
    const unified = this.toUnifiedIncomingMessage(payload as TwilioInboundParams);
    if (!unified) {
      console.warn('[sms-twilioPlugin] Dropping payload without required From/MessageSid fields');
      return;
    }
    this.activeUsers.add(unified.user.id);
    await this.emitMessage(unified);
  }

  /**
   * Map a Twilio form payload into IUnifiedIncomingMessage. Exposed for unit
   * testing — the adapter logic is pure and worth covering directly.
   */
  toUnifiedIncomingMessage(params: TwilioInboundParams): IUnifiedIncomingMessage | null {
    const from = (params.From ?? '').trim();
    const messageSid = (params.MessageSid ?? '').trim();
    if (!from || !messageSid) return null;

    const to = (params.To ?? '').trim();
    const body = params.Body ?? '';

    return {
      id: messageSid,
      platform: 'sms-twilio',
      chatId: from, // SMS conversation is keyed by the remote phone number
      user: {
        id: from,
        displayName: from,
      },
      content: {
        type: 'text',
        text: body,
      },
      timestamp: Date.now(),
      raw: { ...params, To: to },
    };
  }
}
