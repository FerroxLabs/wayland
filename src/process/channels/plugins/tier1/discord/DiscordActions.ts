/**
 * Portions of this file are derived from OpenClaw's discord extension
 *   https://github.com/openclaw/openclaw  (extensions/discord/src/actions/runtime.moderation.ts,
 *   runtime.presence.ts, runtime.guild.ts; src/voice/*)
 *   Copyright OpenClaw contributors, licensed under the MIT License.
 *
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ActivityType, Client, GuildMember, PresenceStatusData, TextBasedChannel } from 'discord.js';

/**
 * Discord moderation, presence, and voice action helpers used by
 * DiscordPlugin. These wrap discord.js client calls so the plugin and tests
 * can exercise them through a typed surface rather than touching the runtime
 * client directly.
 *
 * All helpers fail fast with a descriptive Error rather than silently
 * swallowing rejections - the caller (ActionExecutor / agent runtime) is
 * responsible for surfacing failures to the user.
 */

// ==================== Moderation ====================

export interface KickOptions {
  guildId: string;
  userId: string;
  reason?: string;
}

export async function kickMember(client: Client, options: KickOptions): Promise<void> {
  const guild = await client.guilds.fetch(options.guildId);
  const member = await guild.members.fetch(options.userId);
  await member.kick(options.reason);
}

export interface BanOptions extends KickOptions {
  /** Number of seconds of message history to purge (0-604800). */
  deleteMessageSeconds?: number;
}

export async function banMember(client: Client, options: BanOptions): Promise<void> {
  const guild = await client.guilds.fetch(options.guildId);
  await guild.members.ban(options.userId, {
    reason: options.reason,
    deleteMessageSeconds: options.deleteMessageSeconds ?? 0,
  });
}

export interface TimeoutOptions {
  guildId: string;
  userId: string;
  /** Duration in milliseconds. Discord caps at 28 days. Pass null to lift. */
  durationMs: number | null;
  reason?: string;
}

export async function timeoutMember(client: Client, options: TimeoutOptions): Promise<void> {
  const guild = await client.guilds.fetch(options.guildId);
  const member: GuildMember = await guild.members.fetch(options.userId);
  await member.timeout(options.durationMs, options.reason);
}

// ==================== Presence ====================

export interface PresenceUpdate {
  status?: PresenceStatusData;
  activity?: {
    name: string;
    type?: ActivityType;
    url?: string;
  };
}

export function setBotPresence(client: Client, update: PresenceUpdate): void {
  if (!client.user) {
    throw new Error('[DiscordActions] Cannot set presence - client.user is null (not logged in)');
  }
  client.user.setPresence({
    status: update.status,
    activities: update.activity
      ? [{ name: update.activity.name, type: update.activity.type, url: update.activity.url }]
      : undefined,
  });
}

// ==================== Typing indicator ====================

export async function sendTyping(channel: TextBasedChannel): Promise<void> {
  // discord.js v14 TextBasedChannel.sendTyping() only exists on text-writable
  // channels; we narrow at runtime to keep the public surface friendly.
  const maybe = channel as { sendTyping?: () => Promise<void> };
  if (typeof maybe.sendTyping === 'function') {
    await maybe.sendTyping();
  }
}

// ==================== Voice ====================

export interface VoiceJoinOptions {
  guildId: string;
  channelId: string;
  /** When true, leave the voice channel after the next utterance completes. */
  selfDeaf?: boolean;
  selfMute?: boolean;
}

/**
 * Join a voice channel via @discordjs/voice. We dynamically import the voice
 * package so the heavy native bindings (opusscript, sodium) are only loaded
 * when a user actually invokes a voice action - keeps cold-start cheap and
 * keeps the unit-test surface free of native dependencies.
 */
export async function joinVoiceChannelById(
  client: Client,
  options: VoiceJoinOptions,
): Promise<{ disconnect: () => void }> {
  const voice = await import('@discordjs/voice');
  const guild = await client.guilds.fetch(options.guildId);
  const connection = voice.joinVoiceChannel({
    guildId: guild.id,
    channelId: options.channelId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: options.selfDeaf ?? true,
    selfMute: options.selfMute ?? false,
  });
  return {
    disconnect: () => connection.destroy(),
  };
}
