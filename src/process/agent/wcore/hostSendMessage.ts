/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IChannelPluginStatus, IUnifiedOutgoingMessage } from '@process/channels/types';
import type { WCoreEvent } from './protocol';

/**
 * Desktop half of the #537 host-send-transport hook.
 *
 * When the engine is host-delegated it emits `host_send_message_request` for
 * every agent `send_message` call (its own channel table is empty under the
 * desktop, so it would otherwise fail with "unknown channel: email"). The
 * desktop fulfils the send through the SAME outbound channel plugin that already
 * delivers replies — `PluginManager.sendMessage(pluginId, recipient, msg)` — so
 * there is ONE send path and the engine owns no channel credentials.
 *
 * Note (deliberate): the outbound emitter is `PluginManager.sendMessage`
 * (agent-INITIATED send TO a recipient), NOT `ChannelMessageService.sendMessage`
 * — the latter feeds a message INTO the agent and streams a reply, which for an
 * agent-initiated send would loop the message back into the conversation.
 */

export type HostSendMessageRequest = Extract<WCoreEvent, { type: 'host_send_message_request' }>;

export type HostSendMessageResult = {
  ok: boolean;
  message_id?: string;
  error?: string;
};

/**
 * Injected seam so the handler is unit-testable without the live channels
 * subsystem. The default binding (see {@link defaultHostSendDeps}) resolves the
 * main-process `ChannelManager` singleton lazily.
 */
export interface HostSendDeps {
  listPluginStatuses: () => Promise<IChannelPluginStatus[]>;
  sendViaPlugin: (pluginId: string, recipient: string, message: IUnifiedOutgoingMessage) => Promise<string | null>;
}

/**
 * Resolve a `send_message` platform token (e.g. "email") to a configured plugin
 * instance id (e.g. "email-imap"). Mirrors the engine's channel-name family
 * match (issue #116): exact token first, then the `<token>-<suffix>` family, so
 * "email" resolves "email-imap"/"email-agentmail" but the `-` separator keeps
 * "email" from matching an unrelated "emailfoo". Prefers live (enabled +
 * connected) plugins; falls back to merely enabled so a transiently-down channel
 * still routes (and returns its own send error) rather than reporting "no
 * channel configured".
 *
 * When more than one plugin of the same family is configured (e.g. both
 * email-imap AND email-agentmail), the FIRST configured (by the caller's status
 * order, i.e. the DB order) wins — the agent asked for the "email" family, not a
 * specific account. Single-channel-per-family is the common case; a
 * default/primary tie-break can be layered later if multi-account demand appears.
 */
export function resolvePluginIdForPlatform(statuses: readonly IChannelPluginStatus[], platform: string): string | null {
  const token = platform.trim();
  if (token.length === 0) return null;

  const matches = (s: IChannelPluginStatus): boolean =>
    s.type === token || s.id === token || s.type.startsWith(`${token}-`) || s.id.startsWith(`${token}-`);

  const live = statuses.filter((s) => s.enabled && s.connected && matches(s));
  if (live.length > 0) return live[0].id;

  const enabled = statuses.filter((s) => s.enabled && matches(s));
  return enabled.length > 0 ? enabled[0].id : null;
}

/**
 * Fulfil a host-delegated `send_message`. Pure w.r.t. its injected deps and
 * never throws — every failure is returned as `{ ok: false, error }` so the
 * caller can always reply with a `host_send_message_result` and the engine
 * surfaces a real failure to the model instead of hanging.
 */
export async function handleHostSendMessageRequest(
  req: HostSendMessageRequest,
  deps: HostSendDeps
): Promise<HostSendMessageResult> {
  const platform = (req.platform ?? '').trim();
  if (platform.length === 0) {
    return { ok: false, error: 'send_message: missing platform' };
  }

  const recipient = (req.chat_id ?? '').trim();
  if (recipient.length === 0) {
    return {
      ok: false,
      error: `send_message: no recipient supplied for a "${platform}" send`,
    };
  }

  // We only emit a text message; an empty body is a degenerate send (e.g. email
  // rejects an empty envelope). Guard here for a clear error instead of a
  // channel-specific throw surfaced as an opaque failure. (#537 cross-audit
  // finding 2.)
  const body = req.body ?? '';
  if (body.trim().length === 0) {
    return { ok: false, error: `send_message: empty message body for a "${platform}" send` };
  }

  const statuses = await deps.listPluginStatuses().catch((): IChannelPluginStatus[] => []);
  const pluginId = resolvePluginIdForPlatform(statuses, platform);
  if (!pluginId) {
    return {
      ok: false,
      error: `send_message: no active "${platform}" channel is configured on this desktop`,
    };
  }

  const outgoing: IUnifiedOutgoingMessage = {
    type: 'text',
    text: body,
    ...(req.subject ? { subject: req.subject } : {}),
    ...(req.thread_id ? { replyToMessageId: req.thread_id } : {}),
  };

  try {
    const messageId = await deps.sendViaPlugin(pluginId, recipient, outgoing);
    if (messageId) {
      return { ok: true, message_id: messageId };
    }
    return { ok: false, error: `send_message: "${platform}" send failed (channel returned no message id)` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Default deps bound to the live main-process channels subsystem. `ChannelManager`
 * is imported dynamically so importing this module (and `WCoreAgent`) never pulls
 * the channels/plugin chain into module load.
 */
export function defaultHostSendDeps(): HostSendDeps {
  return {
    listPluginStatuses: async () => {
      const { ChannelManager } = await import('@process/channels/core/ChannelManager');
      const pm = ChannelManager.getInstance().getPluginManager();
      return pm ? pm.getPluginStatuses() : [];
    },
    sendViaPlugin: async (pluginId, recipient, message) => {
      const { ChannelManager } = await import('@process/channels/core/ChannelManager');
      const plugin = ChannelManager.getInstance().getPluginManager()?.getPlugin(pluginId);
      if (!plugin) return null;
      // Call the plugin's sendMessage DIRECTLY, not PluginManager.sendMessage:
      // the latter wraps the send in a try/catch that logs and returns `null`,
      // which would collapse a real, actionable failure (SMTP 535 auth,
      // connection refused, empty envelope) into an opaque "no message id". The
      // plugin throws on failure, so the handler's catch surfaces the true
      // reason to the model. (#537 cross-audit finding 1.)
      return plugin.sendMessage(recipient, message);
    },
  };
}
