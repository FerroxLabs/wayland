/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SMS (Twilio) plugin - buffered inbound via WebhookReceiver + outbound via
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
 *
 * Multi-agent: the rotate flow currently pins `agentId: 'default'`; per-channel
 * agent assignment is a separate roadmap item (see SmsTwilioConfigForm).
 */

import type { Twilio } from 'twilio';
import twilio from 'twilio';

import type {
  AttachmentType,
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedAttachment,
  IUnifiedIncomingMessage,
  IUnifiedMessageContent,
  IUnifiedOutgoingMessage,
  MessageContentType,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';

/**
 * Map a MIME type from Twilio's MediaContentType{i} fields to the unified
 * AttachmentType. Twilio MMS supports image/* (jpeg/png/gif), audio/* (amr,
 * mp3, mp4), video/* (mp4, 3gp), and various document types (pdf, vcard).
 * Anything not in the recognized buckets falls through to 'document'.
 */
function mimeToAttachmentType(mime: string): AttachmentType {
  const lower = mime.toLowerCase();
  if (lower.startsWith('image/')) return 'photo';
  if (lower.startsWith('audio/')) return 'audio';
  if (lower.startsWith('video/')) return 'video';
  return 'document';
}

/** E.164 phone-number format: leading `+`, country digit 1-9, then up to 14 digits. */
const E164_REGEX = /^\+[1-9]\d{1,14}$/;
/** Twilio Messaging Service SID format: `MG` followed by 32 hex chars. */
const MESSAGING_SERVICE_SID_REGEX = /^MG[0-9a-fA-F]{32}$/;
/** A2P 10DLC carrier-compliance opt-out / opt-in / help keywords. */
const OPT_OUT_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
const OPT_IN_KEYWORDS = new Set(['START', 'UNSTOP', 'YES']);
const HELP_KEYWORDS = new Set(['HELP', 'INFO']);

/** Twilio REST error codes we surface explicitly. */
const TWILIO_ERR_RECIPIENT_OPTED_OUT = 21610;
const TWILIO_ERR_PERMISSION_TO_SEND = 21408;
/** Max retry attempts for transient 429 / 5xx responses from the Twilio REST API. */
const TWILIO_MAX_RETRIES = 3;

/**
 * Typed Twilio REST error returned by `sendMessage` for the two codes the
 * action executor needs to route to operator UI rather than retry.
 */
export class TwilioRestError extends Error {
  readonly code: number;
  readonly retryable: boolean;
  constructor(message: string, code: number, retryable: boolean) {
    super(message);
    this.name = 'TwilioRestError';
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Twilio inbound webhook payload - the subset of fields we care about.
 * Twilio sends a flat form-encoded map; the verifier parses to Record<string, string>.
 *
 * `MessageStatus` / `SmsStatus` are present ONLY on status-callback POSTs (when
 * Twilio is configured to deliver delivery receipts to the same webhook URL).
 * Inbound user messages never carry these fields. See F2 fix in audit doc.
 */
interface TwilioInboundParams {
  MessageSid?: string;
  From?: string;
  To?: string;
  Body?: string;
  NumMedia?: string;
  AccountSid?: string;
  MessageStatus?: string;
  SmsStatus?: string;
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
   *
   * F7 fix: backend now enforces the same E.164 / `MG`-prefix shape the UI
   * tooltip enforces, so malformed numbers fail with a clear local error
   * rather than an opaque Twilio REST 400.
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
    if (fromNumber && !E164_REGEX.test(fromNumber)) {
      throw new Error('fromNumber must be E.164 format (e.g., +14155550123)');
    }
    if (messagingServiceSid && !MESSAGING_SERVICE_SID_REGEX.test(messagingServiceSid)) {
      throw new Error('messagingServiceSid must start with "MG" and be 34 chars');
    }

    this.accountSid = accountSid;
    this.fromNumber = fromNumber || null;
    this.messagingServiceSid = messagingServiceSid || null;
    this.client = twilio(accountSid, authToken);
  }

  /**
   * Webhook-driven plugin - nothing to start (no polling loop, no websocket).
   * WebhookReceiver routes inbound traffic via `handleWebhookPayload`.
   */
  protected async onStart(): Promise<void> {
    // No-op: SMS delivery is fully push-based via WebhookReceiver.
  }

  /**
   * Nothing to stop - webhook routes are owned by the receiver lifecycle,
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
   * Send an SMS (or MMS, when `mediaUrl` is present) via Twilio Programmable
   * Messaging REST API. Returns the Twilio Message SID, which downstream code
   * can use as the platform-message id (even though we cannot edit it later).
   *
   * F6 fix: retries 429 + 5xx with exponential backoff; surfaces typed errors
   * for 21408 (carrier permission denied) and 21610 (recipient opted-out)
   * so the action executor can route them to operator UI.
   * F4 fix: forwards optional `mediaUrl` from the unified outgoing message
   * to enable MMS sends.
   */
  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }
    const body = (message.text ?? '').trim();
    const mediaUrl = this.extractMediaUrls(message);
    if (!body && mediaUrl.length === 0) {
      throw new Error('SMS body cannot be empty');
    }

    const params: {
      to: string;
      body: string;
      from?: string;
      messagingServiceSid?: string;
      mediaUrl?: string[];
    } = { to: chatId, body };
    if (mediaUrl.length > 0) {
      params.mediaUrl = mediaUrl;
    }
    if (this.messagingServiceSid) {
      params.messagingServiceSid = this.messagingServiceSid;
    } else if (this.fromNumber) {
      params.from = this.fromNumber;
    } else {
      throw new Error('No fromNumber or messagingServiceSid configured');
    }

    return await this.sendWithRetry(params);
  }

  /**
   * Convert a verified Twilio inbound payload into the unified format and
   * emit through the registered message handler.
   *
   * The receiver hands us the parsed form map as the `payload` argument; we
   * never have to parse the raw body ourselves.
   *
   * F2 fix: drop delivery-status callbacks (they carry `MessageStatus` /
   * `SmsStatus`) so they are not re-emitted as fake inbound messages.
   *
   * F3 fix: intercept A2P 10DLC keywords (STOP, HELP, START, etc.) at the
   * webhook layer - never forward them to the agent. Replying to STOP would
   * violate carrier opt-out compliance (the agent's *attempt* to message
   * post-STOP is the violating action; the carrier blocks delivery but the
   * intent is logged).
   *
   * F4 fix: inbound MMS NumMedia / MediaUrl0..N / MediaContentType0..N now
   * convert into IUnifiedAttachment entries on the unified message; content
   * type promotes to the first attachment's category (photo/audio/video/
   * document) while Body is preserved as the caption text.
   */
  async handleWebhookPayload(
    payload: object,
    _headers: Record<string, string | string[] | undefined>,
    _pluginInstanceId: string
  ): Promise<void> {
    const params = payload as TwilioInboundParams;

    // F2: status callbacks carry MessageStatus / SmsStatus AND no Body.
    // Inbound user messages never carry either status field.
    if (this.isStatusCallback(params)) {
      const sid = (params.MessageSid ?? '').trim();
      const status = params.MessageStatus ?? params.SmsStatus ?? '';
      console.info(`[sms-twilioPlugin] Status callback for ${sid}: ${status}`);
      return;
    }

    const body = (params.Body ?? '').trim();
    const upper = body.toUpperCase();

    // F3: intercept opt-out / opt-in / help keywords. Carrier-side blocking
    // is automatic for STOP, but we MUST NOT forward the keyword to the
    // agent under A2P 10DLC.
    if (OPT_OUT_KEYWORDS.has(upper)) {
      console.info('[sms-twilioPlugin] Inbound STOP-class keyword intercepted; not forwarded');
      return;
    }
    if (OPT_IN_KEYWORDS.has(upper)) {
      console.info('[sms-twilioPlugin] Inbound START-class keyword intercepted; not forwarded');
      return;
    }
    if (HELP_KEYWORDS.has(upper)) {
      console.info('[sms-twilioPlugin] Inbound HELP keyword intercepted; not forwarded');
      return;
    }

    const unified = this.toUnifiedIncomingMessage(params);
    if (!unified) {
      console.warn('[sms-twilioPlugin] Dropping payload without required From/MessageSid fields');
      return;
    }

    this.activeUsers.add(unified.user.id);
    await this.emitMessage(unified);
  }

  /**
   * Map a Twilio form payload into IUnifiedIncomingMessage. Exposed for unit
   * testing - the adapter logic is pure and worth covering directly.
   *
   * F8: timestamp uses wall-clock receive time. Twilio does not include a
   * high-precision send timestamp on inbound form payloads (DateSent is
   * outbound-only), so this is the best signal we have and is acceptable for
   * SMS where carrier-side latency is highly variable.
   */
  toUnifiedIncomingMessage(params: TwilioInboundParams): IUnifiedIncomingMessage | null {
    const from = (params.From ?? '').trim();
    const messageSid = (params.MessageSid ?? '').trim();
    if (!from || !messageSid) return null;

    const to = (params.To ?? '').trim();
    const body = params.Body ?? '';

    const attachments = this.extractInboundAttachments(params);
    const contentType: MessageContentType =
      attachments.length > 0 ? attachments[0].type : 'text';

    const content: IUnifiedMessageContent = {
      type: contentType,
      text: body,
    };
    if (attachments.length > 0) {
      content.attachments = attachments;
    }

    return {
      id: messageSid,
      platform: 'sms-twilio',
      chatId: from, // SMS conversation is keyed by the remote phone number
      user: {
        id: from,
        displayName: from,
      },
      content,
      timestamp: Date.now(),
      raw: { ...params, To: to },
    };
  }

  /**
   * F4: convert Twilio's flat NumMedia / MediaUrl{i} / MediaContentType{i}
   * fields into IUnifiedAttachment entries. Twilio guarantees the
   * MediaContentType header exists when MediaUrl does; entries without a URL
   * are skipped defensively.
   */
  private extractInboundAttachments(params: TwilioInboundParams): IUnifiedAttachment[] {
    const numMedia = parseInt(params.NumMedia ?? '0', 10);
    if (!Number.isFinite(numMedia) || numMedia <= 0) return [];
    const out: IUnifiedAttachment[] = [];
    for (let i = 0; i < numMedia; i++) {
      const url = params[`MediaUrl${i}`];
      if (!url) continue;
      const mime = params[`MediaContentType${i}`] ?? 'application/octet-stream';
      out.push({
        type: mimeToAttachmentType(mime),
        fileId: url,
        mimeType: mime,
      });
    }
    return out;
  }

  /**
   * Twilio reuses the inbound webhook URL for delivery status callbacks when
   * StatusCallback is not separately configured. Status callbacks always
   * carry `MessageStatus` or `SmsStatus` and never carry `Body`.
   */
  private isStatusCallback(params: TwilioInboundParams): boolean {
    const status = (params.MessageStatus ?? params.SmsStatus ?? '').trim();
    const body = (params.Body ?? '').trim();
    return status.length > 0 && body.length === 0;
  }

  /** Pull `mediaUrl` strings off the unified outgoing message in a typesafe way. */
  private extractMediaUrls(message: IUnifiedOutgoingMessage): string[] {
    const raw = (message as { mediaUrl?: unknown }).mediaUrl;
    if (!raw) return [];
    if (typeof raw === 'string') return [raw];
    if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === 'string');
    return [];
  }

  /**
   * Retry policy for Twilio REST:
   *   - 429 + 5xx: retry with exponential backoff (250 ms, 500 ms, 1000 ms).
   *   - 21408 / 21610: throw typed non-retryable error for operator UI.
   *   - other 4xx: throw immediately (config / payload bug).
   */
  private async sendWithRetry(params: object): Promise<string> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < TWILIO_MAX_RETRIES; attempt++) {
      try {
        const result = await this.client!.messages.create(
          params as Parameters<Twilio['messages']['create']>[0]
        );
        return result.sid;
      } catch (err: unknown) {
        lastErr = err;
        const info = extractTwilioErrorInfo(err);
        if (info.code === TWILIO_ERR_RECIPIENT_OPTED_OUT) {
          throw new TwilioRestError(
            `Recipient has opted out (Twilio 21610): ${info.message}`,
            info.code,
            false
          );
        }
        if (info.code === TWILIO_ERR_PERMISSION_TO_SEND) {
          throw new TwilioRestError(
            `Permission to send to this number/country denied (Twilio 21408): ${info.message}`,
            info.code,
            false
          );
        }
        if (!isRetryableTwilioError(info)) {
          throw err;
        }
        if (attempt < TWILIO_MAX_RETRIES - 1) {
          await sleep(250 * 2 ** attempt);
        }
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error(`Twilio send failed after ${TWILIO_MAX_RETRIES} attempts`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type TwilioErrorInfo = { code: number | null; status: number | null; message: string };

function extractTwilioErrorInfo(err: unknown): TwilioErrorInfo {
  const e = err as { code?: unknown; status?: unknown; message?: unknown };
  const code = typeof e.code === 'number' ? e.code : null;
  const status = typeof e.status === 'number' ? e.status : null;
  const message = typeof e.message === 'string' ? e.message : String(err);
  return { code, status, message };
}

function isRetryableTwilioError(info: TwilioErrorInfo): boolean {
  if (info.status === 429) return true;
  if (info.status !== null && info.status >= 500 && info.status < 600) return true;
  // Twilio's per-account rate-limit error code; sometimes surfaces with no HTTP status.
  if (info.code === 20429) return true;
  return false;
}
