/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * MatrixPlugin - federated, decentralized messaging via matrix-js-sdk.
 *
 * Transport: long-polling /sync against the configured homeserver. We do not
 * accept inbound webhooks; matrix-js-sdk owns the sync loop and emits
 * Room.timeline events for every new m.room.message in joined rooms.
 *
 * Capabilities: text + edits (via m.replace), reactions (m.annotation), and
 * typing indicators (PUT /typing). No native streaming - large responses are
 * chunked by splitMatrixMessage.
 */

import * as sdk from 'matrix-js-sdk';

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import {
  MATRIX_MESSAGE_LIMIT,
  splitMatrixMessage,
  toUnifiedIncomingFromMatrix,
  type MatrixEventLike,
} from './MatrixAdapter';

// Matrix has no built-in typing-indicator timeout. Servers expect a millisecond
// timeout on PUT /typing; clients should poll if they want to keep typing alive
// longer than this window. 30 seconds matches Element's default.
const MATRIX_TYPING_TIMEOUT_MS = 30_000;

// Minimal sync config - a reactive bot only needs the most recent event per
// room as a sync anchor. Higher values caused sync storms for bots joined to
// many large rooms (audit finding: factual correction 2). Keep at 1.
const INITIAL_SYNC_LIMIT = 1;

// Sync-error backoff (audit Miss 4). On a Matrix sync ERROR state we stop the
// client, wait BACKOFF_INITIAL_MS, then restart. Each consecutive failure
// doubles the delay up to BACKOFF_CAP_MS. After BACKOFF_MAX_ATTEMPTS, we give
// up and transition the plugin to status='error'. The counter resets on the
// next successful PREPARED/SYNCING state.
const SYNC_BACKOFF_INITIAL_MS = 5_000;
const SYNC_BACKOFF_CAP_MS = 60_000;
const SYNC_BACKOFF_MAX_ATTEMPTS = 5;

/**
 * Subset of matrix-js-sdk MatrixClient we touch. Declared here so unit tests
 * can mock the SDK with a hand-rolled emitter without depending on the SDK's
 * internal types.
 */
type MatrixClientLike = {
  startClient: (opts: { initialSyncLimit: number }) => Promise<void>;
  stopClient: () => void;
  sendTextMessage: (roomId: string, body: string) => Promise<{ event_id: string }>;
  sendEvent: (
    roomId: string,
    eventType: string,
    content: object
  ) => Promise<{ event_id: string }>;
  sendTyping: (roomId: string, isTyping: boolean, timeoutMs: number) => Promise<unknown>;
  sendEmoteMessage?: (roomId: string, body: string) => Promise<{ event_id: string }>;
  whoami: () => Promise<{ user_id: string }>;
  getUser: (userId: string) => { displayName?: string } | null;
  fetchRoomEvent?: (roomId: string, eventId: string) => Promise<MatrixRoomEvent>;
  on: (event: string, cb: (...args: unknown[]) => void) => unknown;
  removeAllListeners: () => void;
};

type MatrixRoomEvent = {
  content?: { msgtype?: string };
};

export class MatrixPlugin extends BasePlugin {
  readonly type: PluginType = 'matrix';

  readonly capabilities: IPluginCapabilities = {
    canEdit: true,
    canStream: false,
    canReact: true,
    canTypingIndicator: true,
  };

  private client: MatrixClientLike | null = null;
  private selfUserId: string | null = null;
  private readonly activeUsers: Set<string> = new Set();
  private syncFailureCount = 0;
  private syncRetryTimer: ReturnType<typeof setTimeout> | null = null;

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = config.credentials ?? {};
    const homeserverUrl = typeof creds.homeserverUrl === 'string' ? creds.homeserverUrl.trim() : '';
    const accessToken = typeof creds.accessToken === 'string' ? creds.accessToken.trim() : '';
    const userId = typeof creds.userId === 'string' ? creds.userId.trim() : '';

    if (!homeserverUrl) throw new Error('Matrix homeserver URL is required');
    if (!accessToken) throw new Error('Matrix access token is required');
    if (!userId) throw new Error('Matrix user ID (mxid) is required');
    if (!userId.startsWith('@') || !userId.includes(':')) {
      throw new Error('Matrix user ID must be a full mxid (e.g. @bot:matrix.org)');
    }

    this.selfUserId = userId;
    // matrix-js-sdk's createClient is synchronous - it only constructs the
    // client; no network IO until startClient(). Cast through the SDK module's
    // shape so the unit tests can swap it with a vi.hoisted mock.
    const createClient = (sdk as unknown as {
      createClient: (opts: { baseUrl: string; accessToken: string; userId: string }) => MatrixClientLike;
    }).createClient;
    this.client = createClient({
      baseUrl: homeserverUrl,
      accessToken,
      userId,
    });
  }

  protected async onStart(): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');
    // Resolve the bot's true mxid from the homeserver BEFORE handlers attach,
    // so toUnifiedIncomingFromMatrix filters echoes against the actual identity
    // (audit Miss 3). If whoami() disagrees with the configured credentials,
    // warn loudly but trust the server - the access token is bound to the
    // server-side mxid, not the one the operator pasted in.
    // Fail-fast on whoami() failure (codex re-audit Miss H3-partial). If we
    // can't confirm the server-side mxid we can't trust the echo filter, so
    // refuse to start rather than silently risking the bot replying to itself.
    // The "happy path warn-and-adopt" still handles configured-vs-actual
    // mismatch when whoami() succeeds.
    try {
      const me = await this.client.whoami();
      if (!me.user_id) {
        throw new Error('whoami() returned no user_id');
      }
      if (me.user_id !== this.selfUserId) {
        console.warn(
          `[MatrixPlugin] whoami() returned ${me.user_id} but credentials said ${this.selfUserId}; adopting server value`,
        );
        this.selfUserId = me.user_id;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Matrix whoami() failed; refusing to start without confirmed identity (echo-filter safety): ${message}`, { cause: error },
      );
    }
    this.setupHandlers();
    await this.client.startClient({ initialSyncLimit: INITIAL_SYNC_LIMIT });
  }

  protected async onStop(): Promise<void> {
    if (this.syncRetryTimer) {
      clearTimeout(this.syncRetryTimer);
      this.syncRetryTimer = null;
    }
    this.syncFailureCount = 0;
    if (!this.client) return;
    try {
      this.client.stopClient();
      this.client.removeAllListeners();
    } catch (error) {
      console.warn('[MatrixPlugin] Error during stopClient (ignored):', error);
    } finally {
      this.client = null;
      this.selfUserId = null;
      this.activeUsers.clear();
    }
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.selfUserId) return null;
    const user = this.client?.getUser(this.selfUserId);
    return {
      id: this.selfUserId,
      username: this.selfUserId,
      displayName: user?.displayName ?? this.selfUserId,
    };
  }

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.client) throw new Error('Matrix client not initialized');
    const body = message.text ?? '';
    if (!body.trim()) return '';

    const chunks = splitMatrixMessage(body, MATRIX_MESSAGE_LIMIT);
    let lastEventId = '';
    for (const chunk of chunks) {
      const resp = await this.client.sendTextMessage(chatId, chunk);
      lastEventId = resp.event_id;
    }
    return lastEventId;
  }

  /**
   * Edit a previously-sent message via the m.replace relation. Per MSC2676,
   * the wire format requires:
   *   - top-level body = " * <new>" (fallback for clients that don't render edits)
   *   - m.new_content = the canonical replacement content
   *   - m.relates_to = { rel_type: 'm.replace', event_id }
   */
  async editMessage(
    chatId: string,
    messageId: string,
    message: IUnifiedOutgoingMessage
  ): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');
    const body = message.text ?? '';
    if (!body.trim()) return;

    // Guard against silently converting media messages to text on edit. The
    // MSC2676 m.replace contract requires the new_content msgtype to match the
    // original - sending m.text over an m.image would lose the media. Probe
    // the original event when the SDK exposes fetchRoomEvent; if it doesn't,
    // we keep the legacy text-only path but throw on any non-text original.
    // Audit: "claimed but broken" 2.
    if (typeof this.client.fetchRoomEvent === 'function') {
      const original = await this.client.fetchRoomEvent(chatId, messageId);
      const originalType = original?.content?.msgtype;
      if (originalType && originalType !== 'm.text') {
        throw new Error(
          'Matrix editing media messages is not supported; only text edits work',
        );
      }
    }

    await this.client.sendEvent(chatId, 'm.room.message', {
      msgtype: 'm.text',
      body: ` * ${body}`,
      'm.new_content': { msgtype: 'm.text', body },
      'm.relates_to': { rel_type: 'm.replace', event_id: messageId },
    });
  }

  /**
   * Add a reaction via the m.annotation relation (MSC2677). Matrix reactions
   * are first-class events; passing a unicode emoji as the key is canonical.
   */
  async addReaction(chatId: string, messageId: string, emoji: string): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');
    await this.client.sendEvent(chatId, 'm.reaction', {
      'm.relates_to': {
        rel_type: 'm.annotation',
        event_id: messageId,
        key: emoji,
      },
    });
  }

  /**
   * Send a typing indicator. Matrix expects a millisecond timeout the server
   * uses to auto-expire the indicator; pass a 30s default matching Element so
   * the indicator stays visible for the duration of a typical agent response.
   */
  async sendTypingIndicator(chatId: string): Promise<void> {
    if (!this.client) return;
    await this.client.sendTyping(chatId, true, MATRIX_TYPING_TIMEOUT_MS);
  }

  /**
   * Matrix is sync-driven, not webhook-driven. Override the base error message
   * with a specific, actionable explanation so an operator who points an HTTP
   * receiver at this plugin sees why nothing happens.
   */
  async handleWebhookPayload(): Promise<void> {
    throw new Error('Matrix uses sync (long-polling), not webhooks');
  }

  // ==================== Internal ====================

  private setupHandlers(): void {
    if (!this.client || !this.selfUserId) return;

    this.client.on('Room.timeline', (...args: unknown[]) => {
      const event = args[0] as MatrixEventLike | undefined;
      if (!event || typeof event.getType !== 'function') return;

      const unified = toUnifiedIncomingFromMatrix(event, this.selfUserId!);
      if (!unified) return;

      this.activeUsers.add(unified.user.id);
      void this.emitMessage(unified).catch((err) =>
        console.error('[MatrixPlugin] Room.timeline handler failed:', err)
      );
    });

    this.client.on('sync', (...args: unknown[]) => {
      const state = args[0] as string;
      if (state === 'PREPARED' || state === 'SYNCING') {
        // Healthy sync - clear any pending retry and reset the backoff counter.
        if (this.syncRetryTimer) {
          clearTimeout(this.syncRetryTimer);
          this.syncRetryTimer = null;
        }
        this.syncFailureCount = 0;
        return;
      }
      if (state === 'ERROR') {
        this.handleSyncError();
      }
    });
  }

  /**
   * Stop the spinning client and schedule a restart with exponential backoff.
   * After SYNC_BACKOFF_MAX_ATTEMPTS consecutive failures we give up and
   * surface a hard error to the plugin status so the supervisor can decide
   * what to do. Audit Miss 4.
   */
  private handleSyncError(): void {
    if (!this.client) return;
    if (this.syncRetryTimer) return; // restart already scheduled

    this.syncFailureCount += 1;
    if (this.syncFailureCount > SYNC_BACKOFF_MAX_ATTEMPTS) {
      const reason = `Matrix sync ERROR after ${SYNC_BACKOFF_MAX_ATTEMPTS} retries`;
      console.error(`[MatrixPlugin] ${reason}; giving up`);
      try {
        this.client.stopClient();
      } catch (error) {
        console.warn('[MatrixPlugin] stopClient during give-up failed:', error);
      }
      this.setStatus('error', reason);
      return;
    }

    const delay = Math.min(
      SYNC_BACKOFF_INITIAL_MS * 2 ** (this.syncFailureCount - 1),
      SYNC_BACKOFF_CAP_MS,
    );
    console.warn(
      `[MatrixPlugin] sync ERROR (attempt ${this.syncFailureCount}/${SYNC_BACKOFF_MAX_ATTEMPTS}); restarting in ${delay}ms`,
    );
    try {
      this.client.stopClient();
    } catch (error) {
      console.warn('[MatrixPlugin] stopClient during backoff failed:', error);
    }
    this.setError(`Matrix sync ERROR; retrying in ${delay}ms`);

    this.syncRetryTimer = setTimeout(() => {
      this.syncRetryTimer = null;
      if (!this.client) return;
      this.client
        .startClient({ initialSyncLimit: INITIAL_SYNC_LIMIT })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          console.error('[MatrixPlugin] startClient during backoff failed:', message);
          // Treat a failed restart like another sync ERROR so the next attempt
          // schedules with the doubled delay.
          this.handleSyncError();
        });
    }, delay);
  }

  // ==================== Static ====================

  /**
   * Validate credentials by calling /_matrix/client/r0/account/whoami. The
   * homeserver echoes back the user_id bound to the access token.
   *
   * Signature mirrors BasePlugin.testConnection (single `token` string) so
   * the static side stays assignment-compatible - see WhatsAppPlugin for the
   * same pattern. The form JSON-encodes `{homeserverUrl, accessToken}` as the
   * token. Returns success with `botUsername` set to the resolved user_id so
   * the renderer can persist it as credentials.userId.
   */
  static override async testConnection(
    token: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    let parsed: { homeserverUrl?: string; accessToken?: string };
    try {
      parsed = JSON.parse(token) as typeof parsed;
    } catch {
      return { success: false, error: 'Invalid testConnection token (expected JSON)' };
    }
    const baseUrl = parsed.homeserverUrl?.trim() ?? '';
    const accessToken = parsed.accessToken?.trim() ?? '';
    if (!baseUrl) return { success: false, error: 'Homeserver URL is required' };
    if (!accessToken) return { success: false, error: 'Access token is required' };

    try {
      const createClient = (sdk as unknown as {
        createClient: (opts: { baseUrl: string; accessToken: string }) => MatrixClientLike;
      }).createClient;
      const probe = createClient({ baseUrl, accessToken });
      const me = await probe.whoami();
      // whoami() returns user_id on success; matrix-js-sdk does not require a
      // running sync for this REST call, so no startClient/stopClient pair.
      return { success: true, botUsername: me.user_id };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (/m\.unknown_token|invalid token|401/i.test(message)) {
        return { success: false, error: 'Invalid Matrix access token' };
      }
      return { success: false, error: message };
    }
  }
}
