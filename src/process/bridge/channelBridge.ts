/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { channel } from '@/common/adapter/ipcBridge';
import { getChannelManager } from '@process/channels/core/ChannelManager';
import { getPairingService } from '@process/channels/pairing/PairingService';
import { ExtensionRegistry } from '@process/extensions';
import { toAssetUrl } from '@process/extensions/protocol/assetProtocol';
import * as path from 'path';
import type {
  IChannelPluginStatus,
  IChannelUser,
  IChannelPairingRequest,
  IChannelSession,
} from '@process/channels/types';
import { hasPluginCredentials } from '@process/channels/types';
import type { IChannelRepository } from '@process/services/database/IChannelRepository';

/**
 * Initialize Channel IPC Bridge
 * Handles communication between renderer (Settings UI) and main process (Channel system)
 */
export function initChannelBridge(channelRepo: IChannelRepository): void {
  console.log('[ChannelBridge] Initializing...');

  // ==================== Plugin Management ====================

  /**
   * Get status of all plugins (including extension plugin metadata)
   */
  channel.getPluginStatus.provider(async () => {
    try {
      // MUST stay in lock-step with ChannelManager.loadEnabledPlugins
      // builtinStartableTypes and the constructor's registerPlugin calls.
      // Stale entries here misclassify shipped channels as extensions and
      // hide them from Settings on restart (codex re-audit Miss 1, 2026-05-17).
      const BUILTIN_TYPES = new Set([
        'telegram',
        'lark',
        'dingtalk',
        'weixin',
        'wecom',
        // Phase 1 (W1.1) - tier-1
        'discord',
        'slack',
        'sms-twilio',
        'whatsapp',
        // Phase 2 (W1.2) - tier-2
        'email-agentmail',
        'email-imap',
        'matrix',
        // OpenClaw fork wave 1 (W2.x) - 2026-05-18
        'line',
        'webhook',
        'irc',
        // OpenClaw fork wave 2 (W2.y) - 2026-05-18
        'mattermost',
        'google-chat',
        'nextcloud-talk',
        'synology-chat',
        'nostr',
        // OpenClaw fork wave 3 (W2.z) - 2026-05-18
        'twitch',
        'bluebubbles',
        'imessage',
        // OpenClaw fork wave 4 (W2.w) - 2026-05-18
        'signal',
        'ms-teams',
      ]);

      let dbPlugins: import('@process/channels/types').IChannelPluginConfig[] = [];
      try {
        dbPlugins = await channelRepo.getChannelPlugins();
      } catch (dbError) {
        console.warn('[ChannelBridge] getChannelPlugins failed, proceeding with builtin-only list:', dbError);
      }

      // Pre-fetch extension plugin metadata (lazy, cached by registry)
      const registry = ExtensionRegistry.getInstance();

      const extensions = registry.getLoadedExtensions();
      const resolveExtensionMeta = (pluginType: string): IChannelPluginStatus['extensionMeta'] | undefined => {
        try {
          const meta = registry.getChannelPluginMeta(pluginType);
          if (!meta || typeof meta !== 'object') return undefined;
          const m = meta as Record<string, unknown>;
          const extensionMeta: NonNullable<IChannelPluginStatus['extensionMeta']> = {
            credentialFields: Array.isArray(m.credentialFields) ? m.credentialFields : undefined,
            configFields: Array.isArray(m.configFields) ? m.configFields : undefined,
            description: typeof m.description === 'string' ? m.description : undefined,
          };

          const ext = extensions.find((e) =>
            e.manifest.contributes.channelPlugins?.some((cp) => cp.type === pluginType)
          );
          if (ext) {
            extensionMeta.extensionName = ext.manifest.displayName || ext.manifest.name;
            const iconField = typeof m.icon === 'string' ? m.icon : undefined;
            if (iconField) {
              if (
                iconField.startsWith('http://') ||
                iconField.startsWith('https://') ||
                iconField.startsWith('data:') ||
                iconField.startsWith('file://') ||
                iconField.startsWith('wayland-asset://')
              ) {
                extensionMeta.icon = iconField;
              } else {
                const absPath = path.isAbsolute(iconField) ? iconField : path.resolve(ext.directory, iconField);
                extensionMeta.icon = toAssetUrl(absPath);
              }
            }
          }

          return extensionMeta;
        } catch {
          return undefined;
        }
      };

      // Build a set of channel types whose parent extension is currently enabled
      const enabledExtChannelTypes = new Set<string>();
      for (const [pluginType] of registry.getChannelPlugins()) {
        enabledExtChannelTypes.add(pluginType);
      }

      const statusMap = new Map<string, IChannelPluginStatus>();

      for (const plugin of dbPlugins) {
        const isExtension = !BUILTIN_TYPES.has(plugin.type);

        // Skip extension channels whose parent extension is not loaded/enabled
        if (isExtension && !enabledExtChannelTypes.has(plugin.type)) {
          continue;
        }

        statusMap.set(plugin.type, {
          id: plugin.id,
          type: plugin.type,
          name: plugin.name,
          enabled: plugin.enabled,
          connected: plugin.status === 'running',
          status: plugin.status,
          lastConnected: plugin.lastConnected,
          activeUsers: 0,
          hasToken: hasPluginCredentials(plugin.type, plugin.credentials),
          isExtension,
          extensionMeta: isExtension ? resolveExtensionMeta(plugin.type) : undefined,
        });
      }

      // Ensure extension-contributed channel plugins are always visible in settings
      // even before first enable (i.e. not yet persisted in DB).
      for (const [pluginType, entry] of registry.getChannelPlugins()) {
        if (statusMap.has(pluginType)) continue;
        const extensionMeta = resolveExtensionMeta(pluginType);
        const meta = entry.meta as { name?: string } | undefined;
        statusMap.set(pluginType, {
          id: pluginType,
          type: pluginType,
          name: meta?.name || pluginType,
          enabled: false,
          connected: false,
          status: 'stopped',
          activeUsers: 0,
          hasToken: false,
          isExtension: true,
          extensionMeta,
        });
      }

      // Ensure builtin channel types are always visible in settings
      // even before user configures them (i.e. not yet persisted in DB).
      const BUILTIN_NAMES: Record<string, string> = {
        telegram: 'Telegram',
        lark: 'Lark',
        dingtalk: 'DingTalk',
        slack: 'Slack',
        discord: 'Discord',
        weixin: 'WeChat',
        wecom: 'WeCom',
        // Phase 1 + 2 (added post-codex-recheck 2026-05-17)
        'sms-twilio': 'SMS (Twilio)',
        whatsapp: 'WhatsApp',
        'email-agentmail': 'Email (AgentMail)',
        'email-imap': 'Email (IMAP/SMTP)',
        matrix: 'Matrix',
        // OpenClaw fork wave 1 (W2.x) - 2026-05-18
        line: 'LINE',
        webhook: 'Webhook',
        irc: 'IRC',
        // OpenClaw fork wave 2 (W2.y) - 2026-05-18
        mattermost: 'Mattermost',
        'google-chat': 'Google Chat',
        'nextcloud-talk': 'Nextcloud Talk',
        'synology-chat': 'Synology Chat',
        nostr: 'Nostr',
        // OpenClaw fork wave 3 (W2.z) - 2026-05-18
        twitch: 'Twitch',
        bluebubbles: 'BlueBubbles (iMessage)',
        imessage: 'iMessage',
        // OpenClaw fork wave 4 (W2.w) - 2026-05-18
        signal: 'Signal',
        'ms-teams': 'Microsoft Teams',
      };
      for (const builtinType of BUILTIN_TYPES) {
        if (statusMap.has(builtinType)) continue;
        statusMap.set(builtinType, {
          id: builtinType,
          type: builtinType,
          name: BUILTIN_NAMES[builtinType] || builtinType,
          enabled: false,
          connected: false,
          status: 'stopped',
          activeUsers: 0,
          hasToken: false,
          isExtension: false,
        });
      }

      return { success: true, data: Array.from(statusMap.values()) };
    } catch (error: any) {
      console.error('[ChannelBridge] getPluginStatus error:', error);
      return { success: false, msg: error.message };
    }
  });

  /**
   * Enable a plugin
   */
  channel.enablePlugin.provider(async ({ pluginId, config }) => {
    try {
      const manager = getChannelManager();
      const result = await manager.enablePlugin(pluginId, config);

      if (!result.success) {
        return { success: false, msg: result.error };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[ChannelBridge] enablePlugin error:', error);
      return { success: false, msg: error.message };
    }
  });

  /**
   * Disable a plugin
   */
  channel.disablePlugin.provider(async ({ pluginId }) => {
    try {
      const manager = getChannelManager();
      const result = await manager.disablePlugin(pluginId);

      if (!result.success) {
        return { success: false, msg: result.error };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[ChannelBridge] disablePlugin error:', error);
      return { success: false, msg: error.message };
    }
  });

  /**
   * Test plugin connection (validate token)
   */
  channel.testPlugin.provider(async ({ pluginId, token, extraConfig }) => {
    try {
      const manager = getChannelManager();
      const result = await manager.testPlugin(pluginId, token, extraConfig);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('[ChannelBridge] testPlugin error:', error);
      return { success: false, data: { success: false, error: error.message } };
    }
  });

  // ==================== Pairing Management ====================

  /**
   * Get pending pairing requests
   */
  channel.getPendingPairings.provider(async () => {
    try {
      const data = await channelRepo.getPendingPairingRequests();
      return { success: true, data };
    } catch (error: any) {
      console.error('[ChannelBridge] getPendingPairings error:', error);
      return { success: false, msg: error.message };
    }
  });

  /**
   * Approve a pairing request
   * Delegates to PairingService to avoid duplicate logic
   */
  channel.approvePairing.provider(async ({ code }) => {
    try {
      const pairingService = getPairingService();
      const result = await pairingService.approvePairing(code);

      if (!result.success) {
        return { success: false, msg: result.error };
      }

      console.log(`[ChannelBridge] Approved pairing for code ${code}`);
      return { success: true };
    } catch (error: any) {
      console.error('[ChannelBridge] approvePairing error:', error);
      return { success: false, msg: error.message };
    }
  });

  /**
   * Reject a pairing request
   * Delegates to PairingService to avoid duplicate logic
   */
  channel.rejectPairing.provider(async ({ code }) => {
    try {
      const pairingService = getPairingService();
      const result = await pairingService.rejectPairing(code);

      if (!result.success) {
        return { success: false, msg: result.error };
      }

      console.log(`[ChannelBridge] Rejected pairing code ${code}`);
      return { success: true };
    } catch (error: any) {
      console.error('[ChannelBridge] rejectPairing error:', error);
      return { success: false, msg: error.message };
    }
  });

  // ==================== User Management ====================

  /**
   * Get all authorized users
   */
  channel.getAuthorizedUsers.provider(async () => {
    try {
      const data = await channelRepo.getChannelUsers();
      return { success: true, data };
    } catch (error: any) {
      console.error('[ChannelBridge] getAuthorizedUsers error:', error);
      return { success: false, msg: error.message };
    }
  });

  /**
   * Revoke user authorization
   */
  channel.revokeUser.provider(async ({ userId }) => {
    try {
      // Delete user (cascades to sessions)
      await channelRepo.deleteChannelUser(userId);
      console.log(`[ChannelBridge] Revoked user ${userId}`);
      return { success: true };
    } catch (error: any) {
      console.error('[ChannelBridge] revokeUser error:', error);
      return { success: false, msg: error.message };
    }
  });

  // ==================== Session Management ====================

  /**
   * Get active sessions
   */
  channel.getActiveSessions.provider(async () => {
    try {
      const data = await channelRepo.getChannelSessions();
      return { success: true, data };
    } catch (error: any) {
      console.error('[ChannelBridge] getActiveSessions error:', error);
      return { success: false, msg: error.message };
    }
  });

  // ==================== Settings Sync ====================

  /**
   * Sync channel settings after agent or model change
   */
  channel.syncChannelSettings.provider(async ({ platform, agent, model }) => {
    try {
      const manager = getChannelManager();
      const result = await manager.syncChannelSettings(platform, agent, model);
      if (!result.success) {
        return { success: false, msg: result.error };
      }
      return { success: true };
    } catch (error: any) {
      console.error('[ChannelBridge] syncChannelSettings error:', error);
      return { success: false, msg: error.message };
    }
  });

  // ==================== Webhook Token Rotation ====================

  /**
   * Rotate the webhook connection token for a (platform, plugin, agent) tuple.
   * Revokes the existing token (tombstone, audit trail preserved) and mints a
   * fresh one. Surfaces the new record back to the renderer so the UI can
   * re-display the freshly minted webhook URL.
   */
  channel.rotateWebhookToken.provider(async ({ platform, pluginInstanceId, agentId, secret }) => {
    try {
      if (!platform || !pluginInstanceId || !agentId) {
        return { success: false, msg: 'platform, pluginInstanceId and agentId are required' };
      }
      const { getTokenStore } = await import('@process/channels/webhook');
      const { ProcessConfig } = await import('@process/utils/initStorage');
      const store = getTokenStore();
      // Revoke any prior token(s) for this exact tuple so the old URL can no
      // longer be used to deliver messages.
      for (const record of store.serialize()) {
        if (
          record.revokedAt === undefined &&
          record.platform === platform &&
          record.pluginInstanceId === pluginInstanceId &&
          record.agentId === agentId
        ) {
          store.revoke(record.token);
        }
      }
      // Resolve the per-platform verifier secret from persisted credentials
      // when the caller didn't pass one explicitly. Without this, pre-existing
      // forms (generic webhook / AgentMail / WhatsApp / Twilio) that call
      // rotate without a secret would persist secret='' and inbound delivery
      // would fail with secret-not-found (audit fix NEW HIGH1 2026-05-18).
      const resolvedSecret = secret && secret.trim()
        ? secret
        : await resolvePersistedSecretForPlatform(platform, pluginInstanceId);
      const minted = store.register(platform, pluginInstanceId, agentId, resolvedSecret);
      // CRITICAL: persist the mutated store back to ProcessConfig so the new
      // URL survives restart. Without this, ChannelManager.wireWebhookDispatcher
      // hydrates from a stale snapshot and the rotated URL becomes a 404
      // (codex audit miss 4, 2026-05-17).
      try {
        await ProcessConfig.set('webhook.connectionTokens', store.serialize());
      } catch (persistErr) {
        console.error('[ChannelBridge] Failed to persist rotated webhook token:', persistErr);
        // Don't fail the rotation - the in-memory token works for this session;
        // the user can re-rotate post-restart if persistence stays broken.
      }
      return {
        success: true,
        data: { token: minted.token, platform: minted.platform, createdAt: minted.createdAt },
      };
    } catch (error: any) {
      console.error('[ChannelBridge] rotateWebhookToken error:', error);
      return { success: false, msg: error.message };
    }
  });

  console.log('[ChannelBridge] Initialized');
}

/**
 * Per-platform secret resolution for `rotateWebhookToken` callers that don't
 * pass a secret explicitly. Looks up the persisted plugin credentials and
 * picks the field each verifier expects.
 *
 * Returns '' if no credentials are persisted yet - callers will get a token
 * but inbound delivery will return secret-not-found until credentials are
 * saved. That's intentional: it preserves the existing "mint a URL before
 * saving credentials" flow without silently shipping a broken token.
 *
 * Audit fix NEW HIGH1 2026-05-18.
 */
async function resolvePersistedSecretForPlatform(
  platform: string,
  pluginInstanceId: string,
): Promise<string> {
  try {
    const cm = getChannelManager();
    // ChannelManager exposes plugin configs via the same DB the bridge uses.
    // Look up by pluginInstanceId since multiple plugins can share a type.
    const db = await import('@process/services/database').then((m) => m.getDatabase());
    const result = db.getChannelPlugins();
    if (!result.success || !result.data) return '';
    const plugin = result.data.find((p) => p.id === pluginInstanceId || p.type === platform);
    if (!plugin?.credentials) return '';
    const creds = plugin.credentials as Record<string, unknown>;

    // Field name varies by platform - pick the field the verifier uses.
    switch (platform) {
      case 'email-agentmail':
        return typeof creds.webhookSecret === 'string' ? creds.webhookSecret : '';
      case 'sms-twilio':
        return typeof creds.authToken === 'string' ? creds.authToken : '';
      case 'whatsapp': {
        // W-2: Meta requires TWO secrets - verifyToken (GET handshake) and
        // appSecret (X-Hub-Signature-256 HMAC). The WebhookVerifier contract
        // gives us one string, so we JSON-encode both. The verifier parses
        // it back; legacy single-string secrets are still accepted there.
        const verifyToken = typeof creds.verifyToken === 'string' ? creds.verifyToken : '';
        const appSecret = typeof creds.appSecret === 'string' ? creds.appSecret : '';
        if (verifyToken && appSecret) {
          return JSON.stringify({ appSecret, verifyToken });
        }
        // Fall back to whichever single value the operator provided so
        // pre-W-2 deployments don't break mid-rollout.
        if (verifyToken) return verifyToken;
        return appSecret;
      }
      case 'webhook':
        // Generic webhook: operator-provided outboundSecret doubles as inbound
        // HMAC key. If unset, fall back to '' (operator must set it before
        // inbound works).
        return typeof creds.outboundSecret === 'string' ? creds.outboundSecret : '';
      // Wave-1 OpenClaw fork channels - these forms pass secret explicitly,
      // so the lookup path is defensive only.
      case 'line':
        return typeof creds.channelSecret === 'string' ? creds.channelSecret : '';
      case 'google-chat':
        return typeof creds.audience === 'string' ? creds.audience : '';
      case 'ms-teams':
        return typeof creds.appId === 'string' ? creds.appId : '';
      case 'synology-chat':
        return typeof creds.incomingToken === 'string' ? creds.incomingToken : '';
      default:
        return '';
    }
  } catch (error) {
    console.warn('[ChannelBridge] resolvePersistedSecretForPlatform failed:', error);
    return '';
  }
}
