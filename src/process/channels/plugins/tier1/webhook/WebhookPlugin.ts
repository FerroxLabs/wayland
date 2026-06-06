/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Generic inbound + outbound webhook channel plugin.
 *
 * Outbound: HTTP POST to operator-configured URL with optional HMAC-SHA256
 * signing (X-Webhook-Signature: sha256=<hex>). Uses Node's built-in fetch.
 *
 * Inbound: handled by the existing WebhookReceiver infrastructure via the
 * 'webhook' platform key in VERIFIER_REGISTRY (genericVerifier). The plugin
 * overrides handleWebhookPayload to parse the verified body and emit.
 *
 * Capabilities: text only - canEdit=false, canReact=false (universal escape
 * hatch; platforms without richer support).
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
  signOutboundBody,
  toOutboundBody,
  toUnifiedIncoming,
  type WebhookInboundPayload,
} from './WebhookAdapter';

export class WebhookPlugin extends BasePlugin {
  readonly type: PluginType = 'webhook';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: false,
    canTypingIndicator: false,
  };

  private outboundUrl: string | null = null;
  private outboundSecret: string | null = null;

  /**
   * Validate credentials - outboundUrl is required. Secret is optional. We do
   * NOT connect here; nothing to connect for a webhook-only channel.
   */
  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = config.credentials ?? {};
    const outboundUrl = typeof creds.outboundUrl === 'string' ? creds.outboundUrl.trim() : '';
    if (!outboundUrl) throw new Error('Webhook outboundUrl is required');

    // Validate URL format - throw early so the status flips to error with a clear message.
    try {
      new URL(outboundUrl);
    } catch {
      throw new Error(`Webhook outboundUrl is not a valid URL: ${outboundUrl}`);
    }

    this.outboundUrl = outboundUrl;
    this.outboundSecret =
      typeof creds.outboundSecret === 'string' ? creds.outboundSecret.trim() : null;
  }

  /**
   * Webhook-driven plugin - nothing to start. WebhookReceiver routes inbound
   * POST traffic via handleWebhookPayload using the 'webhook' platform key and
   * genericVerifier.
   */
  protected async onStart(): Promise<void> {
    // No-op: inbound is push-based via WebhookReceiver; outbound is on-demand via sendMessage.
  }

  protected async onStop(): Promise<void> {
    this.outboundUrl = null;
    this.outboundSecret = null;
  }

  getActiveUserCount(): number {
    return 0;
  }

  getBotInfo(): BotInfo | null {
    if (!this.outboundUrl) return null;
    return {
      id: 'webhook',
      displayName: 'Webhook',
      username: this.outboundUrl,
    };
  }

  /**
   * POST message to the operator-configured outbound URL. Optionally signs the
   * request with HMAC-SHA256 when outboundSecret is configured.
   *
   * Returns a synthetic message id (timestamp-based) since generic webhooks
   * typically don't return stable message ids. canEdit=false means this id is
   * never used for in-place edits.
   */
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.outboundUrl) throw new Error('WebhookPlugin not initialized');

    const body = toOutboundBody(chatId, message);
    const bodyJson = JSON.stringify(body);
    const timestampMs = Date.now();
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-webhook-timestamp': String(timestampMs),
    };

    if (this.outboundSecret) {
      const sig = signOutboundBody(bodyJson, this.outboundSecret, timestampMs);
      if (sig) headers['x-webhook-signature'] = sig;
    }

    const response = await fetch(this.outboundUrl, {
      method: 'POST',
      headers,
      body: bodyJson,
    });

    if (!response.ok) {
      const errText = await safeReadText(response);
      throw new Error(`Webhook sendMessage failed (${response.status}): ${errText}`);
    }

    // No stable platform message id - return a synthetic one.
    return `wh-msg-${body.ts}`;
  }

  /**
   * Handle an inbound webhook payload routed here by WebhookReceiver after the
   * genericVerifier has verified the signature and parsed the JSON body.
   *
   * Uses best-effort text extraction from the payload - operators may POST
   * either the structured `{id,chatId,userId,text}` shape or any JSON body
   * carrying a `text`/`message`/`content` field.
   */
  async handleWebhookPayload(
    payload: object,
    _headers: Record<string, string | string[] | undefined>,
    pluginInstanceId: string
  ): Promise<void> {
    const unified = toUnifiedIncoming(payload as WebhookInboundPayload, pluginInstanceId);
    if (!unified) {
      console.warn(
        '[webhookPlugin] Dropping inbound payload with no extractable text',
        JSON.stringify(payload).slice(0, 120)
      );
      return;
    }
    await this.emitMessage(unified);
  }

  // ==================== Static Methods ====================

  /**
   * Test connection by POSTing a { "type": "test" } ping to the outboundUrl.
   * Expects a 2xx response. JSON-encoded credentials per TRANSLATION-GUIDE §4.
   */
  static async testConnection(
    tokenJson: string
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    type Creds = {
      outboundUrl: string;
      outboundSecret?: string;
    };
    let creds: Creds;
    try {
      creds = JSON.parse(tokenJson) as Creds;
    } catch {
      return { success: false, error: 'Invalid JSON credentials' };
    }

    const outboundUrl = (creds.outboundUrl ?? '').trim();
    if (!outboundUrl) {
      return { success: false, error: 'outboundUrl is required' };
    }

    try {
      new URL(outboundUrl);
    } catch {
      return { success: false, error: `outboundUrl is not a valid URL: ${outboundUrl}` };
    }

    const pingBody = JSON.stringify({ type: 'test' });
    const timestampMs = Date.now();
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-webhook-timestamp': String(timestampMs),
    };
    if (creds.outboundSecret?.trim()) {
      const sig = signOutboundBody(pingBody, creds.outboundSecret, timestampMs);
      if (sig) headers['x-webhook-signature'] = sig;
    }

    try {
      const response = await fetch(outboundUrl, {
        method: 'POST',
        headers,
        body: pingBody,
      });
      if (!response.ok) {
        const errText = await safeReadText(response);
        return {
          success: false,
          error: `Webhook ping failed (${response.status}): ${errText}`,
        };
      }
      return { success: true, botUsername: outboundUrl };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
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
