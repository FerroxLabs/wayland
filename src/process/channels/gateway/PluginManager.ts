/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { channel as channelBridge } from '@/common/adapter/ipcBridge';
import { getDatabase } from '@process/services/database';
import type { SessionManager } from '../core/SessionManager';
import type { BasePlugin, PluginMessageHandler, PluginConfirmHandler } from '../plugins/BasePlugin';
import { hasPluginCredentials } from '../types';
import type { IChannelPluginConfig, IChannelPluginStatus, IUnifiedIncomingMessage, PluginType } from '../types';
import { getChannelWelcomeService } from './ChannelWelcomeService';

// Plugin registry - maps plugin types to their constructors
// Will be populated when plugins are implemented
type PluginConstructor = new () => BasePlugin;
const pluginRegistry: Map<PluginType, PluginConstructor> = new Map();

/**
 * Register a plugin type
 * Called during initialization to register available plugins
 */
export function registerPlugin(type: PluginType, constructor: PluginConstructor): void {
  pluginRegistry.set(type, constructor);
}

/**
 * PluginManager - Manages lifecycle of all platform plugins
 *
 * Responsibilities:
 * - Plugin registration and discovery
 * - Plugin lifecycle management (init → start → stop)
 * - Message routing from plugins to action handlers
 * - Status monitoring and reconnection
 */
export class PluginManager {
  // Active plugin instances
  private plugins: Map<string, BasePlugin> = new Map();

  // Reference to session manager for message handling
  private sessionManager: SessionManager;

  // Message handler for incoming messages
  private messageHandler: PluginMessageHandler | null = null;

  // Confirm handler for tool confirmations
  private confirmHandler: PluginConfirmHandler | null = null;

  // Runtime error cache: pluginId -> error message
  private pluginErrors: Map<string, string> = new Map();

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Get error message for a plugin
   */
  getPluginError(pluginId: string): string | undefined {
    return this.pluginErrors.get(pluginId);
  }

  /**
   * Clear error message for a plugin
   */
  clearPluginError(pluginId: string): void {
    this.pluginErrors.delete(pluginId);
  }

  /**
   * Set the message handler for incoming messages
   * This is called by ChannelManager to wire up the action system
   */
  setMessageHandler(handler: PluginMessageHandler): void {
    this.messageHandler = handler;

    // Update handler on all active plugins
    for (const plugin of this.plugins.values()) {
      plugin.onMessage(handler);
    }
  }

  /**
   * Set the confirm handler for tool confirmations
   */
  setConfirmHandler(handler: PluginConfirmHandler): void {
    this.confirmHandler = handler;

    // Update handler on all active plugins
    for (const plugin of this.plugins.values()) {
      plugin.onConfirm(handler);
    }
  }

  /**
   * Get a plugin by ID
   */
  getPlugin(pluginId: string): BasePlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all active plugins
   */
  getAllPlugins(): BasePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Start a plugin with the given configuration
   * Records any errors that occur during startup
   */
  async startPlugin(config: IChannelPluginConfig): Promise<void> {
    const { id, type } = config;

    // Clear previous error
    this.pluginErrors.delete(id);

    // Check if plugin is already running
    if (this.plugins.has(id)) {
      // enablePlugin rewrites the DB status to 'created' before calling us (a
      // re-save of an already-registered channel). Without correcting it back
      // here the persisted status stays 'created', and the Settings card - which
      // reads the DB status - shows "Not connected" for a live channel (#548
      // part a). Persist the plugin's ACTUAL live status (not a hardcoded
      // 'running'): a channel that transitioned to 'error' at runtime (e.g.
      // WhatsApp logged-out, needs re-pair) is still in this.plugins, and
      // force-writing 'running' would falsely light its card green.
      const plugin = this.plugins.get(id)!;
      const db = await getDatabase();
      db.updateChannelPluginStatus(id, plugin.status, plugin.status === 'running' ? Date.now() : undefined);
      void this.emitStatusChange(id, plugin);
      return;
    }

    // Get plugin constructor from registry
    const Constructor = pluginRegistry.get(type);
    if (!Constructor) {
      const errorMsg = `Unknown plugin type: ${type}`;
      this.pluginErrors.set(id, errorMsg);
      throw new Error(errorMsg);
    }

    // Create plugin instance
    const plugin = new Constructor();

    try {
      // Initialize plugin
      await plugin.initialize(config);
    } catch (error) {
      const errorMsg = `Plugin initialization failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[PluginManager] ${errorMsg}`, error);
      this.pluginErrors.set(id, errorMsg);

      // Update database status to error
      const db = await getDatabase();
      db.updateChannelPluginStatus(id, 'error');

      // Emit status change event with error
      this.emitStatusChangeWithError(id, config, errorMsg);

      throw error;
    }

    // Set message handler
    if (this.messageHandler) {
      plugin.onMessage(this.messageHandler);
    } else {
      console.warn(
        `[PluginManager] WARNING: No message handler set when starting plugin ${id}! Messages will not be processed.`
      );
    }

    // Set confirm handler
    if (this.confirmHandler) {
      plugin.onConfirm(this.confirmHandler);
    }

    // Let the plugin push async status updates (e.g. a new pairing QR) to the
    // renderer between the start/stop boundaries we already emit. Also the
    // moment a self-initiating channel learns its own address (WhatsApp/Email
    // self-target), so this is where we fire the welcome-on-connect handshake.
    // It is idempotent: the once-per-account marker skips repeats, and a null
    // self target (bot channels) is a no-op (those get welcomed on first
    // contact instead).
    plugin.onStatusChange(() => {
      void this.emitStatusChange(id, plugin);
      void this.maybeWelcomeOnConnect(plugin);
    });

    try {
      // Start plugin
      await plugin.start();
    } catch (error) {
      const errorMsg = `Plugin start failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[PluginManager] ${errorMsg}`, error);
      this.pluginErrors.set(id, errorMsg);

      // Update database status to error
      const db = await getDatabase();
      db.updateChannelPluginStatus(id, 'error');

      // Emit status change event with error
      this.emitStatusChangeWithError(id, config, errorMsg);

      throw error;
    }

    // Store in registry
    this.plugins.set(id, plugin);

    // Update database status
    const db = await getDatabase();
    db.updateChannelPluginStatus(id, 'running', Date.now());

    // Emit status change event
    this.emitStatusChange(id, plugin);

    // Welcome-on-connect for channels whose self target is known synchronously
    // at start (e.g. Email, where the inbox address is fixed at config time).
    // Socket-backed channels (WhatsApp) learn their address asynchronously and
    // are welcomed via the onStatusChange path above instead. Both paths are
    // idempotent through the once-per-account marker.
    void this.maybeWelcomeOnConnect(plugin);
  }

  /**
   * Stop a plugin
   */
  async stopPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return;
    }

    // Stop plugin
    await plugin.stop();

    // Remove from registry
    this.plugins.delete(pluginId);

    // Update database status
    const db = await getDatabase();
    db.updateChannelPluginStatus(pluginId, 'stopped');

    // Emit status change event
    this.emitStatusChange(pluginId, plugin);
  }

  /**
   * Stop all plugins
   */
  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.plugins.keys()).map((id) => this.stopPlugin(id));
    await Promise.allSettled(stopPromises);
    console.log('[PluginManager] All plugins stopped');
  }

  /**
   * Get status for all plugins (for Settings UI)
   */
  async getPluginStatuses(): Promise<IChannelPluginStatus[]> {
    const db = await getDatabase();
    const result = db.getChannelPlugins();

    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map((config) => this.buildPluginStatus(config));
  }

  /**
   * Build plugin status object
   */
  private buildPluginStatus(config: IChannelPluginConfig): IChannelPluginStatus {
    const BUILTIN_TYPES = new Set(['telegram', 'lark', 'dingtalk', 'weixin', 'wecom', 'slack', 'discord']);
    const plugin = this.plugins.get(config.id);
    const botInfo = plugin?.getBotInfo();

    // Get error from plugin instance or from error cache
    const errorMessage = plugin?.error ?? this.pluginErrors.get(config.id);

    return {
      id: config.id,
      type: config.type,
      name: config.name,
      enabled: config.enabled,
      connected: plugin?.status === 'running',
      status: plugin?.status ?? config.status,
      lastConnected: config.lastConnected,
      error: errorMessage,
      activeUsers: plugin?.getActiveUserCount() ?? 0,
      botUsername: botInfo?.username,
      hasToken: hasPluginCredentials(config.type, config.credentials),
      isExtension: !BUILTIN_TYPES.has(config.type),
      qrCode: plugin?.getQrCode() ?? undefined,
      connectionState: plugin?.getConnectionState() ?? undefined,
      whatsappMode:
        config.type === 'whatsapp' ? (config.credentials?.mode === 'dedicated' ? 'dedicated' : 'personal') : undefined,
    };
  }

  /**
   * Emit status change event to renderer
   */
  private async emitStatusChange(pluginId: string, _plugin: BasePlugin): Promise<void> {
    const db = await getDatabase();
    const configResult = db.getChannelPlugin(pluginId);

    if (configResult.success && configResult.data) {
      const status = this.buildPluginStatus(configResult.data);
      channelBridge.pluginStatusChanged.emit({ pluginId, status });
    }
  }

  /**
   * Emit status change event with error (when plugin is not yet created)
   */
  private emitStatusChangeWithError(pluginId: string, config: IChannelPluginConfig, errorMessage: string): void {
    const status: IChannelPluginStatus = {
      id: config.id,
      type: config.type,
      name: config.name,
      enabled: config.enabled,
      connected: false,
      status: 'error',
      lastConnected: config.lastConnected,
      error: errorMessage,
      activeUsers: 0,
      botUsername: undefined,
      hasToken: hasPluginCredentials(config.type, config.credentials),
    };
    channelBridge.pluginStatusChanged.emit({ pluginId, status });
  }

  /**
   * Welcome-on-connect for channels that can initiate a thread. Runs on every
   * status change (cheap: skips immediately when there is no self target or the
   * account is not yet known), so by the time a self-initiating channel reports
   * its own address the welcome fires exactly once per account.
   */
  private async maybeWelcomeOnConnect(plugin: BasePlugin): Promise<void> {
    if (plugin.status !== 'running') return;
    const target = plugin.getSelfTarget();
    if (!target) return; // bot channels are welcomed on first contact instead
    const accountId = plugin.getAccountIdentity();
    if (!accountId) return; // identity not learned yet; retry on next status change
    try {
      await getChannelWelcomeService().welcomeOnConnect(plugin.type, accountId, target, (chatId, msg) =>
        plugin.sendMessage(chatId, msg)
      );
    } catch (err) {
      console.warn('[PluginManager] welcome-on-connect failed:', err);
    }
  }

  /**
   * Handle incoming message from a plugin
   * Routes to the appropriate action handler
   */
  private async handleIncomingMessage(message: IUnifiedIncomingMessage): Promise<void> {
    // Update user activity
    this.sessionManager.updateSessionActivity(message.user.id);

    // Forward to message handler (ActionRouter)
    if (this.messageHandler) {
      await this.messageHandler(message);
    }
  }

  /**
   * Send a message through a plugin
   */
  async sendMessage(
    pluginId: string,
    chatId: string,
    message: import('../types').IUnifiedOutgoingMessage
  ): Promise<string | null> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`[PluginManager] Plugin ${pluginId} not found`);
      return null;
    }

    try {
      return await plugin.sendMessage(chatId, message);
    } catch (error) {
      console.error(`[PluginManager] Failed to send message through ${pluginId}:`, error);
      return null;
    }
  }

  /**
   * Edit a message through a plugin
   */
  async editMessage(
    pluginId: string,
    chatId: string,
    messageId: string,
    message: import('../types').IUnifiedOutgoingMessage
  ): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`[PluginManager] Plugin ${pluginId} not found`);
      return false;
    }

    try {
      await plugin.editMessage(chatId, messageId, message);
      return true;
    } catch (error) {
      console.error(`[PluginManager] Failed to edit message through ${pluginId}:`, error);
      return false;
    }
  }
}
