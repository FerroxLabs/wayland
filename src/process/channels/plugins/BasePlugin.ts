/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  IPluginCapabilities,
  IChannelPluginConfig,
  IUnifiedIncomingMessage,
  IUnifiedOutgoingMessage,
  PluginType,
  PluginStatus,
} from '../types';

/**
 * Plugin event handler type
 */
export type PluginMessageHandler = (message: IUnifiedIncomingMessage) => Promise<void>;

/**
 * Tool confirmation handler type
 * @param userId - Platform user ID
 * @param platform - Platform type (telegram, etc.)
 * @param callId - Tool call ID
 * @param value - Confirmation value
 */
export type PluginConfirmHandler = (userId: string, platform: string, callId: string, value: string) => Promise<void>;

/**
 * BasePlugin - Abstract base class for all platform plugins
 *
 * Each platform plugin (Telegram, Slack, Discord) extends this class and implements:
 * - Platform-specific connection logic
 * - Message conversion (platform format <-> unified format)
 * - Platform-specific actions (pairing, OAuth, etc.)
 *
 * Lifecycle:
 * ```
 * created → initializing → ready → starting → running → stopping → stopped
 *                ↓                    ↓           ↓
 *              error ←←←←←←←←←←←←←←←←←←←←←←←←←←←←
 * ```
 */
export abstract class BasePlugin {
  /**
   * Plugin type identifier
   */
  abstract readonly type: PluginType;

  /**
   * Capability declaration. Lets ActionExecutor pick edit-driven vs buffered
   * streaming and gate optional plugin behaviors (reactions, typing).
   */
  abstract readonly capabilities: IPluginCapabilities;

  /**
   * Current plugin status
   */
  protected _status: PluginStatus = 'created';

  /**
   * Plugin configuration
   */
  protected config: IChannelPluginConfig | null = null;

  /**
   * Message handler callback (set by PluginManager)
   */
  protected messageHandler: PluginMessageHandler | null = null;

  /**
   * Tool confirmation handler callback (set by PluginManager)
   */
  protected confirmHandler: PluginConfirmHandler | null = null;

  /**
   * Error message if status is 'error'
   */
  protected errorMessage: string | null = null;

  /**
   * Get current status
   */
  get status(): PluginStatus {
    return this._status;
  }

  /**
   * Get error message
   */
  get error(): string | null {
    return this.errorMessage;
  }

  /**
   * Set status and log transition
   */
  protected setStatus(status: PluginStatus, error?: string): void {
    const oldStatus = this._status;
    this._status = status;
    this.errorMessage = error ?? null;
    console.log(`[${this.type}Plugin] Status: ${oldStatus} → ${status}${error ? ` (${error})` : ''}`);
  }

  /**
   * Set error message without changing status
   * Used for recording errors that don't require status transition
   */
  protected setError(error: string): void {
    this.errorMessage = error;
    console.warn(`[${this.type}Plugin] Error: ${error}`);
  }

  /**
   * Initialize the plugin with configuration
   * @param config Plugin configuration from database
   */
  async initialize(config: IChannelPluginConfig): Promise<void> {
    this.setStatus('initializing');
    this.config = config;

    try {
      await this.onInitialize(config);
      this.setStatus('ready');
    } catch (error: any) {
      this.setStatus('error', error.message);
      throw error;
    }
  }

  /**
   * Start the plugin (connect to platform)
   */
  async start(): Promise<void> {
    if (this._status !== 'ready' && this._status !== 'stopped') {
      throw new Error(`Cannot start plugin in status: ${this._status}`);
    }

    this.setStatus('starting');

    try {
      await this.onStart();
      this.setStatus('running');
    } catch (error: any) {
      this.setStatus('error', error.message);
      throw error;
    }
  }

  /**
   * Stop the plugin (disconnect from platform)
   */
  async stop(): Promise<void> {
    if (this._status !== 'running' && this._status !== 'error') {
      return; // Already stopped or not started
    }

    this.setStatus('stopping');

    try {
      await this.onStop();
      this.setStatus('stopped');
    } catch (error: any) {
      this.setStatus('error', error.message);
      throw error;
    }
  }

  /**
   * Register message handler
   * Called by PluginManager to set the callback for incoming messages
   */
  onMessage(handler: PluginMessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Register tool confirmation handler
   * Called by PluginManager to set the callback for tool confirmations
   */
  onConfirm(handler: PluginConfirmHandler): void {
    this.confirmHandler = handler;
  }

  /**
   * Emit an incoming message to the handler
   * Called by subclass when a message is received from the platform
   */
  protected async emitMessage(message: IUnifiedIncomingMessage): Promise<void> {
    if (this.messageHandler) {
      await this.messageHandler(message);
    } else {
      console.warn(`[${this.type}Plugin] No message handler registered, dropping message`);
    }
  }

  // ==================== Abstract Methods (implement in subclass) ====================

  /**
   * Platform-specific initialization
   * Validate config, setup clients, etc.
   */
  protected abstract onInitialize(config: IChannelPluginConfig): Promise<void>;

  /**
   * Platform-specific start logic
   * Connect to platform, start polling/webhook, etc.
   */
  protected abstract onStart(): Promise<void>;

  /**
   * Platform-specific stop logic
   * Disconnect, cleanup resources, etc.
   */
  protected abstract onStop(): Promise<void>;

  /**
   * Send a message to a user on the platform
   * @param chatId Platform-specific chat/channel ID
   * @param message Unified outgoing message
   * @returns Platform-specific message ID (for editing later)
   */
  abstract sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string>;

  /**
   * Edit an existing message (for streaming updates).
   *
   * Default is a no-op. Concrete plugins with `capabilities.canEdit === true`
   * MUST override; the ActionExecutor only calls this when capabilities permit.
   * Plugins without edit support (e.g. SMS, email) can rely on the default.
   *
   * @param chatId Platform-specific chat/channel ID
   * @param messageId Message ID returned from sendMessage
   * @param message Updated message content
   */
  async editMessage(_chatId: string, _messageId: string, _message: IUnifiedOutgoingMessage): Promise<void> {
    // Default no-op for plugins that don't support edits (SMS, email).
    // Concrete plugins with canEdit=true MUST override this.
  }

  /**
   * Handle an inbound webhook payload that the WebhookReceiver has already
   * signature-verified, deduplicated against replays, and routed via the
   * plugin's connection token.
   *
   * Default implementation throws - plugins that register with
   * `registerWebhookDispatcher` MUST override. Plugins that do not accept
   * webhooks (Telegram polling, Slack Socket Mode, Discord Gateway) can rely
   * on the default.
   *
   * The receiver owns the HTTP response. This method is pure side-effect:
   * convert payload → IUnifiedIncomingMessage → call `this.messageHandler`.
   * Throwing from here triggers the receiver's audit-log reject path but
   * always returns a stable 202 / 200 to the caller - never leak handler
   * state to the platform.
   *
   * @param payload Parsed JSON body the verifier already validated
   * @param headers Original request headers (lowercased keys)
   * @param pluginInstanceId The connection-token-resolved plugin instance id
   *   that should process this payload. Useful for multi-account debugging.
   */
  async handleWebhookPayload(
    _payload: object,
    _headers: Record<string, string | string[] | undefined>,
    _pluginInstanceId: string,
  ): Promise<void> {
    throw new Error(
      `[${this.type}Plugin] handleWebhookPayload not implemented - plugin does not accept webhook deliveries`,
    );
  }

  /**
   * Get the number of active users connected through this plugin
   */
  abstract getActiveUserCount(): number;

  /**
   * Get bot information (username, etc.)
   * May return null if not connected
   */
  abstract getBotInfo(): { username?: string; displayName?: string } | null;

  // ==================== Static Methods ====================

  /**
   * Test connection with the given token
   * Used to validate configuration before saving
   */
  static async testConnection(_token: string): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    return { success: false, error: 'Not implemented' };
  }
}
