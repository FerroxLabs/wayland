/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Google Chat inbound via Google Cloud Pub/Sub pull subscription.
 *
 * Parallels Slack Socket Mode and Telegram long-polling: the Chat app is
 * configured to publish events to a Pub/Sub topic, and this module opens a
 * streaming-pull subscription on that topic's subscription. No public HTTPS
 * endpoint is required, so it works on a desktop behind NAT with no tunnel.
 *
 * The @google-cloud/pubsub Subscription is an EventEmitter: listening for the
 * `message` event starts the streaming pull automatically, and the client
 * library handles the gRPC stream, reconnects, and ack-deadline extension
 * internally. We layer our own supervisor-style reconnect on top of the
 * `error`/`close` events so a permanently dead stream is retried with bounded
 * exponential backoff rather than silently going quiet.
 *
 * Envelope formats (mirrors the webhook path in handleWebhookPayload):
 *   - Workspace Add-ons:   {"chat": {"messagePayload": {message, space}}}
 *   - Native Chat API:     {"type": "MESSAGE", "message": {...}, "space": {...}}
 * Both are normalized to a GoogleChatEvent and run through
 * googleChatEventToUnified, exactly like the webhook path. Non-MESSAGE events
 * (membership, card clicks, etc.) are dropped and acked.
 */

import type { Message, Subscription } from '@google-cloud/pubsub';

import { googleChatEventToUnified, type GoogleChatEvent } from './GoogleChatAdapter';
import type { IUnifiedIncomingMessage } from '../../../types';

/** Subscription path: `projects/<project>/subscriptions/<sub>`. */
const SUBSCRIPTION_PATH_RE = /^projects\/[^/]+\/subscriptions\/[^/]+$/;

/** Bounded reconnect supervisor knobs. */
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY_MS = 2_000;
const RECONNECT_MAX_DELAY_MS = 120_000;

/**
 * Minimal structural type for a service-account keyfile. Only the fields the
 * Pub/Sub client's auth needs are referenced; the rest pass through untouched.
 */
export type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

/**
 * Decode a Pub/Sub message body into a GoogleChatEvent, or `null` when it is
 * not a usable MESSAGE event.
 *
 * Pure (no SDK, no network) so it is directly unit-testable. The `data`
 * argument is the raw Pub/Sub message payload (`message.data`, a Buffer in
 * production; a Buffer or string in tests).
 *
 * Two envelope shapes are accepted, matching the two ways a Chat app can be
 * wired to publish to Pub/Sub:
 *
 *   Format A - Workspace Add-ons wrapper:
 *     {"chat": {"messagePayload": {"message": {...}, "space": {...}}}}
 *
 *   Format B - Native Chat API event (also what handleWebhookPayload parses):
 *     {"type": "MESSAGE", "message": {...}, "space": {...}}
 *
 * Returns `null` for unparseable bodies and for any non-MESSAGE event so the
 * caller acks-and-drops them.
 */
export function pubsubMessageToEvent(data: Buffer | string): GoogleChatEvent | null {
  let envelope: unknown;
  try {
    const text = typeof data === 'string' ? data : data.toString('utf-8');
    envelope = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof envelope !== 'object' || envelope === null) {
    return null;
  }
  const env = envelope as Record<string, unknown>;

  // Format A: Workspace Add-ons wrapper.
  const chatBlock = env.chat;
  if (typeof chatBlock === 'object' && chatBlock !== null) {
    const payload = (chatBlock as Record<string, unknown>).messagePayload;
    if (typeof payload === 'object' && payload !== null) {
      const p = payload as Record<string, unknown>;
      const message = p.message;
      if (typeof message !== 'object' || message === null) {
        return null;
      }
      const space = p.space ?? (message as Record<string, unknown>).space;
      return {
        type: 'MESSAGE',
        space: (space as GoogleChatEvent['space']) ?? undefined,
        message: message as GoogleChatEvent['message'],
      };
    }
    // A `chat` block with no messagePayload is a membership/card event - drop.
    return null;
  }

  // Format B: native Chat API event (same shape the webhook verifier emits).
  const eventType = String(env.type ?? env.eventType ?? '').toUpperCase();
  if (eventType !== 'MESSAGE') {
    return null;
  }
  if (typeof env.message !== 'object' || env.message === null) {
    return null;
  }
  return env as GoogleChatEvent;
}

/** Validate a subscription path early so misconfig surfaces at start, not later. */
export function isValidSubscriptionPath(value: string): boolean {
  return SUBSCRIPTION_PATH_RE.test(value);
}

export type GoogleChatPubSubOptions = {
  /** Full subscription resource name: `projects/<p>/subscriptions/<s>`. */
  subscriptionName: string;
  /** Parsed service-account keyfile used to authenticate the Pub/Sub client. */
  credentials: ServiceAccountCredentials;
  /** Plugin instance id, threaded through to the unified message. */
  pluginInstanceId: string;
  /** Called with each parsed MESSAGE event. Errors are caught and logged. */
  onMessage: (message: IUnifiedIncomingMessage) => Promise<void>;
  /** Optional: invoked when the stream dies permanently (after retries). */
  onFatal?: (reason: string) => void;
};

/**
 * Long-running Pub/Sub pull subscriber for a single Google Chat plugin
 * instance. Owns exactly one streaming-pull Subscription at a time and
 * supervises it with bounded exponential-backoff reconnect.
 *
 * Lifecycle: `start()` opens the stream; `stop()` closes it and cancels any
 * pending reconnect. Both are idempotent.
 */
export class GoogleChatPubSubSubscriber {
  private subscription: Subscription | null = null;
  // Typed as the runtime PubSub instance lazily imported in start(). Kept as
  // `unknown`-narrowed via the imported type so we never pull the heavy SDK
  // into module-eval time for plugins that use the webhook transport.
  private pubsub: { close(): Promise<void> } | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private stopped = false;

  constructor(private readonly options: GoogleChatPubSubOptions) {}

  /**
   * Authenticate the Pub/Sub client and open the streaming pull. Throws if the
   * subscription path is malformed; transient stream failures are handled by
   * the internal reconnect supervisor rather than surfacing here.
   */
  async start(): Promise<void> {
    if (!isValidSubscriptionPath(this.options.subscriptionName)) {
      throw new Error("Google Chat: subscriptionName must match 'projects/<project>/subscriptions/<sub>'");
    }
    this.stopped = false;

    // Lazy import: keeps the ~30MB gRPC/google-cloud stack out of the eval
    // path for instances that use the webhook transport.
    const { PubSub } = await import('@google-cloud/pubsub');
    const projectId = this.options.subscriptionName.split('/')[1] ?? this.options.credentials.project_id;
    this.pubsub = new PubSub({
      projectId,
      credentials: {
        client_email: this.options.credentials.client_email,
        private_key: this.options.credentials.private_key,
      },
    });
    this.openStream();
  }

  /** Open (or re-open) the streaming-pull subscription and wire its listeners. */
  private openStream(): void {
    if (this.stopped || !this.pubsub) return;
    const pubsub = this.pubsub as unknown as {
      subscription: (name: string, opts: object) => Subscription;
    };
    const subscription = pubsub.subscription(this.options.subscriptionName, {
      // One in-flight message at a time keeps ordering sane for a chat bot and
      // bounds memory; the Chat event rate per space is low.
      flowControl: { maxMessages: 1, allowExcessMessages: false },
    });
    subscription.on('message', (message: Message) => {
      void this.handleMessage(message);
    });
    subscription.on('error', (err: Error) => {
      console.warn(`[google-chatPlugin] Pub/Sub stream error: ${err.message}`);
      this.scheduleReconnect();
    });
    subscription.on('close', () => {
      if (!this.stopped) {
        console.warn('[google-chatPlugin] Pub/Sub stream closed unexpectedly');
        this.scheduleReconnect();
      }
    });
    this.subscription = subscription;
    // A successfully opened stream resets the backoff window. The library
    // emits messages without further signalling that the stream is "up", so
    // we treat reaching this point as healthy.
    this.reconnectAttempts = 0;
  }

  /**
   * Parse one Pub/Sub message, forward MESSAGE events to the handler, and ack.
   *
   * Always acks (never nacks) on a parse/drop so non-MESSAGE events and
   * malformed bodies are not redelivered forever. Handler failures are logged
   * but still acked - the agent layer owns its own retry semantics, and a
   * redelivery loop here would amplify a downstream outage.
   */
  private async handleMessage(message: Message): Promise<void> {
    try {
      const event = pubsubMessageToEvent(message.data);
      if (event === null) {
        message.ack();
        return;
      }
      const unified = googleChatEventToUnified(event, this.options.pluginInstanceId);
      if (unified === null) {
        message.ack();
        return;
      }
      await this.options.onMessage(unified);
      message.ack();
    } catch (err) {
      console.error(
        `[google-chatPlugin] Pub/Sub message handling failed: ${err instanceof Error ? err.message : String(err)}`
      );
      // Ack to avoid an infinite redelivery storm on a persistent fault.
      try {
        message.ack();
      } catch {
        // ack can throw if the message already settled; ignore.
      }
    }
  }

  /** Bounded exponential-backoff reconnect; gives up (fatal) after the cap. */
  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer !== null) return;
    this.reconnectAttempts += 1;
    if (this.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      const reason = `Pub/Sub reconnect failed ${MAX_RECONNECT_ATTEMPTS} times; giving up`;
      console.error(`[google-chatPlugin] ${reason}`);
      this.options.onFatal?.(reason);
      return;
    }
    const delay = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * 2 ** (this.reconnectAttempts - 1));
    // Full jitter to avoid thundering-herd reconnects across instances.
    const sleep = Math.random() * delay;
    void this.closeSubscriptionOnly();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openStream();
    }, sleep);
  }

  /** Close just the current subscription stream, leaving the client open. */
  private async closeSubscriptionOnly(): Promise<void> {
    const sub = this.subscription;
    this.subscription = null;
    if (sub === null) return;
    try {
      sub.removeAllListeners();
      await sub.close();
    } catch {
      // Closing a dead subscription can throw; the reconnect path re-creates it.
    }
  }

  /** Idempotent clean shutdown: cancel reconnects, close stream and client. */
  async stop(): Promise<void> {
    this.stopped = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    await this.closeSubscriptionOnly();
    const pubsub = this.pubsub;
    this.pubsub = null;
    if (pubsub !== null) {
      try {
        await pubsub.close();
      } catch {
        // Best-effort: a half-open client can throw on close.
      }
    }
  }
}
