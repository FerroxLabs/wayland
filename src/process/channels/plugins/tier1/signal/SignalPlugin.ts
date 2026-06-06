/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * SignalPlugin - Wayland's tier-2 Signal Messenger surface.
 *
 * Transport: spawns signal-cli as a long-lived subprocess daemon and speaks
 * JSON-RPC 2.0 over the daemon's `--http` endpoint.  Outbound calls go via
 * HTTP POST to `/api/v1/rpc`; inbound messages are polled via the `receive`
 * RPC method.  Mirrors the WhatsApp bridge subprocess pattern but without a
 * Node bridge layer - we interact with signal-cli directly.
 *
 * Lifecycle: created → initializing → ready → starting → running.
 * Daemon exits trigger auto-restart with 5s → 60s backoff (max 5 attempts),
 * after which status transitions to 'error'.
 *
 * Capabilities: reactions + typing (Signal product); no edits (Signal has no
 * edit primitive on any account type).
 */

import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import { signalInboundToUnified, unifiedToSignalSend, chunkSignalText } from './SignalAdapter';
import { SignalDaemon, probeSignalCli, resolveSignalCliPath } from './SignalDaemon';
import type { SignalInboundMessage } from './SignalDaemon';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
import { execFileNoThrow } from '@/utils/execFileNoThrow';

// ── Types ─────────────────────────────────────────────────────────────────────

type SignalCreds = {
  phoneNumber: string;
  cliPath?: string;
  configDir?: string;
  httpHost?: string;
  httpPort?: number;
};

// ── Plugin ────────────────────────────────────────────────────────────────────

export class SignalPlugin extends BasePlugin {
  readonly type: PluginType = 'signal';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    // Reactions are inbound-dropped (SignalAdapter.ts) and no outbound sendReaction
    // RPC is wired. Advertise honestly until reactions are implemented.
    // TODO: port OpenClaw's `extensions/signal/src/send-reactions.ts` +
    // `reaction-level.ts` and flip back to true.
    canReact: false,
    canTypingIndicator: true,
  };

  private daemon: SignalDaemon | null = null;
  private phoneNumber = '';
  private cliPath = 'signal-cli';
  private readonly activeUsers = new Set<string>();

  // ── BasePlugin lifecycle ──────────────────────────────────────────────────

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    const creds = (config.credentials ?? {}) as Partial<SignalCreds>;
    const phone = (typeof creds.phoneNumber === 'string' ? creds.phoneNumber : '').trim();
    if (!phone) throw new Error('Signal requires a registered phone number (E.164 format)');
    if (!/^\+\d{7,}$/.test(phone)) {
      throw new Error(`Signal phone number must be in E.164 format (e.g. +14155551234), got: ${phone}`);
    }

    this.phoneNumber = phone;
    this.cliPath = resolveSignalCliPath(
      typeof creds.cliPath === 'string' ? creds.cliPath : undefined,
    );

    this.daemon = new SignalDaemon({
      phoneNumber: phone,
      cliPath: this.cliPath,
      configDir: typeof creds.configDir === 'string' ? creds.configDir : undefined,
      httpHost: typeof creds.httpHost === 'string' ? creds.httpHost : undefined,
      httpPort: typeof creds.httpPort === 'number' ? creds.httpPort : undefined,
    });

    this.daemon.onMessage((msg: SignalInboundMessage) => this.handleInbound(msg));

    // Propagate daemon status changes to BasePlugin. Critical: when the daemon
    // exhausts its restart budget it transitions to 'error' but the parent
    // plugin must reflect that so the app stops showing the channel as
    // 'running' (audit fix HIGH7 2026-05-18).
    this.daemon.onStatusChange((daemonStatus) => {
      if (daemonStatus === 'error') {
        this.setStatus('error', 'signal-cli daemon exhausted restart attempts');
      }
    });
  }

  protected async onStart(): Promise<void> {
    if (!this.daemon) throw new Error('Signal daemon not initialised');
    await this.daemon.start();
  }

  protected async onStop(): Promise<void> {
    if (!this.daemon) return;
    await this.daemon.stop();
    this.activeUsers.clear();
  }

  // ── Outbound surface ──────────────────────────────────────────────────────

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    if (!this.daemon) throw new Error('Signal daemon not running');

    const text = message.text?.trim() ?? '';
    if (!text) throw new Error('Signal message body cannot be empty');

    // Long messages are chunked; we return the timestamp of the last chunk.
    const chunks = chunkSignalText(text);
    let lastTimestamp = '';

    for (const chunk of chunks) {
      const params = unifiedToSignalSend(chatId, { ...message, text: chunk }, this.phoneNumber);
      const result = await this.daemon.rpc('send', params as unknown as Record<string, JsonValue>) as
        | { timestamp?: number }
        | null;
      // signal-cli's `send` RPC always returns `{ timestamp: <long> }` on success;
      // a missing timestamp indicates a malformed/unhandled response - surface it
      // rather than synthesising a wall-clock id that hides transport failures.
      if (!result?.timestamp) {
        throw new Error(
          'Signal send returned malformed response (no timestamp); message may not have been delivered',
        );
      }
      lastTimestamp = String(result.timestamp);
    }

    return lastTimestamp;
  }

  // ── Plugin info ───────────────────────────────────────────────────────────

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getBotInfo(): BotInfo | null {
    if (!this.phoneNumber) return null;
    return {
      id: this.phoneNumber,
      username: this.phoneNumber,
      displayName: `Signal (${this.phoneNumber})`,
    };
  }

  // ── Inbound handling ──────────────────────────────────────────────────────

  private handleInbound(msg: SignalInboundMessage): void {
    const unified = signalInboundToUnified(msg, this.phoneNumber);
    if (!unified) return;

    this.activeUsers.add(unified.user.id);

    void this.emitMessage(unified).catch((err) =>
      console.error('[SignalPlugin] inbound handler failed:', err),
    );
  }

  // ── Static testConnection ─────────────────────────────────────────────────

  /**
   * Validate Signal credentials without starting the full daemon.
   *
   * Steps:
   *  1. Verify signal-cli binary exists / is executable.
   *  2. Check whether the account is registered by running
   *     `signal-cli --config <dir> -a <phone> listContacts --json`
   *     with a short timeout.
   *
   * Returns success:true + botUsername:phoneNumber when registered.
   * Returns success:false with a clear human-readable error otherwise.
   */
  static override async testConnection(
    tokenJson: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    type Creds = {
      phoneNumber?: string;
      cliPath?: string;
      configDir?: string;
    };

    let creds: Creds;
    try {
      creds = JSON.parse(tokenJson) as Creds;
    } catch {
      return { success: false, error: 'Invalid JSON credentials' };
    }

    const phone = (creds.phoneNumber ?? '').trim();
    if (!phone) return { success: false, error: 'phoneNumber is required' };
    if (!/^\+\d{7,}$/.test(phone)) {
      return {
        success: false,
        error: `Phone number must be E.164 format (e.g. +14155551234), got: ${phone}`,
      };
    }

    const resolved = resolveSignalCliPath(creds.cliPath);
    const version = await probeSignalCli(resolved);
    if (!version) {
      return {
        success: false,
        error:
          'signal-cli binary not found in PATH or bundled runtime.\n' +
          'Install via: brew install signal-cli  |  apt-get install signal-cli\n' +
          'Or configure the binary path in the advanced settings.',
      };
    }

    // Try to list contacts - works only for registered accounts.
    const args = [
      '--output', 'json',
      '-a', phone,
    ];
    if (creds.configDir?.trim()) {
      args.unshift('--config', creds.configDir.trim());
    }
    args.push('listContacts');

    try {
      const result = await execFileNoThrow(resolved, args, { timeoutMs: 15_000 });
      if (result.exitCode === 0) {
        return { success: true, botUsername: phone };
      }
      const stderr = result.stderr || result.stdout;
      if (/not registered/i.test(stderr)) {
        return {
          success: false,
          error: `Number ${phone} is not registered with Signal. Use the registration flow first.`,
        };
      }
      if (/pending/i.test(stderr)) {
        return {
          success: false,
          error: `Registration for ${phone} is pending SMS/call verification.`,
        };
      }
      return {
        success: false,
        error: `signal-cli error (exit ${result.exitCode}): ${stderr.slice(0, 300)}`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `signal-cli probe failed: ${msg}` };
    }
  }
}
