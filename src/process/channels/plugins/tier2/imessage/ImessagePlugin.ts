/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * ImessagePlugin - macOS-only iMessage channel plugin.
 *
 * Inbound: polls ~/Library/Messages/chat.db (read-only, better-sqlite3) on a
 * configurable interval (default 2 s). Tracks a rowid cursor so each message
 * is processed exactly once.
 *
 * Outbound: AppleScript via execFileNoThrow('osascript', ['-e', script]).
 * All user-controlled values are passed through quoteAppleScriptString before
 * interpolation. NEVER use child_process exec - Wayland's pre-commit hook
 * blocks it and execFile is used here via the execFileNoThrow helper.
 *
 * Tapbacks (reactions): sent via AppleScript `perform action` on the message.
 *
 * Requires macOS + Full Disk Access for the running process to open chat.db,
 * AND macOS Automation consent (TCC) for Messages.app to send outbound.
 *
 * Limitations (v0): text-only. Inbound attachment-only rows (image, video,
 * audio) are silently dropped; outbound `mediaUrl` is not supported.
 */

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import type {
  BotInfo,
  IChannelPluginConfig,
  IPluginCapabilities,
  IUnifiedOutgoingMessage,
  PluginType,
} from '../../../types';
import { BasePlugin } from '../../BasePlugin';
import { rowToUnifiedMessage, quoteAppleScriptString } from './ImessageAdapter';
import { execFileNoThrow } from '@/utils/execFileNoThrow';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_POLL_INTERVAL_MS = 2_000;
const MIN_POLL_INTERVAL_MS = 500;
const MAX_POLL_INTERVAL_MS = 60_000;
const CHAT_DB_RELATIVE = path.join('Library', 'Messages', 'chat.db');

/**
 * F12: hard cap on the outbound osascript queue. If the orchestrator pushes
 * sends faster than Messages.app drains, we reject rather than letting
 * unbounded promises pile up. 50 is generous for a single chat and protects
 * against runaway loops.
 */
const SEND_QUEUE_MAX = 50;

/**
 * AppleScript tapback action codes used by Messages.app.
 * 2000 = thumbs up, 2001 = thumbs down, 2002 = ha ha, 2003 = !!, 2004 = ?,
 * 2005 = heart. Negative values remove the tapback.
 */
const TAPBACK_CODES: Record<string, number> = {
  thumbsup: 2000,
  thumbsdown: 2001,
  haha: 2002,
  emphasis: 2003,
  question: 2004,
  heart: 2005,
};

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

/**
 * Fetch new inbound messages since a given rowid, joining handle for the
 * sender address and chat for the chat GUID.
 *
 * F5: `c.style = 43` is the historical group-chat constant (Big Sur → Sonoma)
 * but undocumented; Sequoia could rev it. We OR a secondary heuristic on
 * `chat.chat_identifier LIKE 'chat%'` so a future style code change degrades
 * gracefully (1:1 chat_identifiers are phone numbers or emails, groups always
 * start with the literal `chat`).
 *
 * F7: `AND m.handle_id != 0` guards against rows where the LEFT JOIN to
 * `handle` returns NULL - most commonly messages from "Me" on another Apple
 * device which would otherwise slip past the `is_from_me=0` filter.
 *
 * Columns returned match ChatDbRow in ImessageAdapter.ts.
 */
const SQL_NEW_MESSAGES = `
  SELECT
    m.rowid           AS rowid,
    m.text            AS text,
    m.attributedBody  AS attributed_body,
    m.is_from_me      AS is_from_me,
    m.date            AS date,
    c.guid            AS chat_guid,
    c.service_name    AS chat_service_name,
    h.id              AS sender_handle,
    CASE WHEN c.style = 43 OR c.chat_identifier LIKE 'chat%' THEN 1 ELSE 0 END AS is_group
  FROM message m
  LEFT JOIN handle h ON h.rowid = m.handle_id
  LEFT JOIN chat_message_join cmj ON cmj.message_id = m.rowid
  LEFT JOIN chat c ON c.rowid = cmj.chat_id
  WHERE m.rowid > ?
    AND m.is_from_me = 0
    AND m.handle_id != 0
  ORDER BY m.rowid ASC
`;

/**
 * F11 - Post-send delivery verification. After osascript exit 0 we poll
 * chat.db for the most-recent outbound row created after `sinceDateNs`:
 *   - is_delivered=1   → Apple acked delivery
 *   - error != 0       → Apple rejected (rate limit, no iMessage, etc.)
 *   - neither yet      → still pending; treat as best-effort success
 */
const SQL_DELIVERY_CHECK = `
  SELECT rowid, is_delivered, error, date_delivered
  FROM message
  WHERE is_from_me = 1
    AND date >= ?
  ORDER BY rowid DESC
  LIMIT 1
`;

/** F11 - 5 × 600 ms = 3 s ceiling on delivery polling; bounded to keep
 *  callers responsive while catching the common failure cases. */
const DELIVERY_POLL_CYCLES = 5;
const DELIVERY_POLL_INTERVAL_MS = 600;

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export class ImessagePlugin extends BasePlugin {
  readonly type: PluginType = 'imessage';

  readonly capabilities: IPluginCapabilities = {
    canEdit: false,
    canStream: false,
    canReact: true,
    canTypingIndicator: false,
  };

  private db: Database.Database | null = null;
  private stmt: Database.Statement | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pollInFlight = false;
  private lastRowId = 0;
  private pollIntervalMs = DEFAULT_POLL_INTERVAL_MS;
  private allowedHandles: Set<string> | null = null;
  private stopped = false;

  // F12: serialize osascript calls per channel + bound the queue depth.
  // sendChain is the tail of a promise chain; each new sendMessage call awaits
  // the previous one before invoking osascript. sendQueueDepth tracks the
  // number of in-flight + pending calls so we can reject past SEND_QUEUE_MAX.
  private sendChain: Promise<unknown> = Promise.resolve();
  private sendQueueDepth = 0;

  // ── lifecycle ──────────────────────────────────────────────────────────────

  protected async onInitialize(config: IChannelPluginConfig): Promise<void> {
    if (process.platform !== 'darwin') {
      throw new Error('iMessage plugin is macOS-only. Current platform: ' + process.platform);
    }

    const creds = config.credentials ?? {};

    const rawIntervalMs = typeof creds.pollIntervalMs === 'number' && creds.pollIntervalMs > 0
      ? creds.pollIntervalMs
      : DEFAULT_POLL_INTERVAL_MS;
    // Clamp to [500ms, 60s] so a misconfigured 1ms cannot DOS the main process,
    // and an unreasonably high value cannot stall delivery for >1min.
    this.pollIntervalMs = Math.min(MAX_POLL_INTERVAL_MS, Math.max(MIN_POLL_INTERVAL_MS, rawIntervalMs));

    const rawHandles = Array.isArray(creds.allowedHandles)
      ? (creds.allowedHandles as unknown[]).filter((h): h is string => typeof h === 'string' && h.trim().length > 0)
      : [];
    this.allowedHandles = rawHandles.length > 0 ? new Set(rawHandles.map((h) => h.toLowerCase())) : null;
  }

  protected async onStart(): Promise<void> {
    this.stopped = false;
    const dbPath = chatDbPath();

    // Attempt to open read-only. A permission error here means Full Disk Access
    // has not been granted; surface a clear message.
    try {
      this.db = new Database(dbPath, { readonly: true });
      this.stmt = this.db.prepare(SQL_NEW_MESSAGES);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const hint = msg.includes('EACCES') || msg.includes('permission')
        ? ' - grant Full Disk Access to this app in System Settings → Privacy & Security'
        : '';
      throw new Error(`iMessage: cannot open chat.db: ${msg}${hint}`, { cause: err });
    }

    // Seed the cursor to the current max rowid so we only deliver NEW messages.
    try {
      const seed = this.db.prepare('SELECT MAX(rowid) AS maxid FROM message').get() as { maxid: number | null } | undefined;
      this.lastRowId = seed?.maxid ?? 0;
    } catch {
      this.lastRowId = 0;
    }

    this.startPollLoop();
  }

  protected async onStop(): Promise<void> {
    this.stopped = true;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.db) {
      try {
        this.db.close();
      } catch {
        // best-effort
      }
      this.db = null;
      this.stmt = null;
    }
  }

  // ── outbound ───────────────────────────────────────────────────────────────

  async sendMessage(chatId: string, message: IUnifiedOutgoingMessage): Promise<string> {
    const text = (message.text ?? '').trim();
    if (!text) throw new Error('iMessage: cannot send empty message');

    // F12: bound the queue. A burst of sendMessage calls against a hung
    // Messages.app would otherwise pile up 15s timeouts indefinitely.
    if (this.sendQueueDepth >= SEND_QUEUE_MAX) {
      throw new Error(
        `iMessage: send queue full (${SEND_QUEUE_MAX} in flight). Messages.app may be hung; ` +
          `back off and retry.`,
      );
    }

    this.sendQueueDepth++;
    // Chain this send behind the prior one so osascript invocations serialize
    // per plugin instance - concurrent AppleScript calls against Messages.app
    // can interleave and corrupt the send queue.
    const run: Promise<string> = this.sendChain.then((): Promise<string> => this.runSend(chatId, text));
    // Update the chain tail even on failure so subsequent sends still proceed.
    this.sendChain = run.catch((): undefined => undefined);

    try {
      return await run;
    } finally {
      this.sendQueueDepth--;
    }
  }

  /**
   * Single send invocation. Extracted from sendMessage so the F12 chain wrapper
   * stays focused on queue mechanics.
   */
  private async runSend(chatId: string, text: string): Promise<string> {
    // F8: pick iMessage vs SMS based on chat.service_name. Without this an
    // SMS-relay (green-bubble) recipient queues on the iMessage service and
    // never delivers - silent failure to the orchestrator.
    const serviceName = this.lookupChatServiceName(chatId);
    const script = buildSendScript(chatId, text, serviceName);
    // F11: capture send-start in chat.db time units so the post-send poll
    // can scope to rows created by THIS call (1s pad for clock skew).
    const sendStartNs = jsTimeMsToChatDbNs(Date.now()) - 1_000_000_000;

    const result = await execFileNoThrow('osascript', ['-e', script], { timeoutMs: 15_000 });

    if (result.exitCode !== 0) {
      if (isAutomationDeniedStderr(result.stderr)) {
        throw new Error(
          'iMessage Automation access denied. Grant in System Settings → Privacy & Security → Automation → <app name> → Messages.',
        );
      }
      // F10: brand-new group chats raise AppleScript -1728 ("Can't get chat
      // id...") because Messages.app caches its chat list; surfacing the raw
      // stderr leaves the user with no idea this is a "wake the chat" issue.
      if (isMissingChatStderr(result.stderr)) {
        throw new Error(
          'iMessage: target chat not found. Open it once in Messages.app to refresh, then retry.',
        );
      }
      throw new Error(`iMessage: osascript send failed (exit ${result.exitCode}): ${result.stderr}`);
    }

    // F11: verify delivery via chat.db is_delivered / error columns. osascript
    // exit 0 only means Messages.app queued the request - not that Apple
    // delivered. Surface non-zero error codes as a thrown send-failed error.
    const delivery = await this.pollDeliveryStatus(sendStartNs);
    if (delivery && delivery.error !== 0) {
      throw new Error(
        `iMessage: send not delivered (chat.db error=${delivery.error}). Recipient may not have ` +
          `iMessage, or Apple rejected the send.`,
      );
    }

    // iMessage has no server-assigned message ID at send time. Suffix encodes
    // whether delivery was confirmed (`d`) or still-pending (`p`) so downstream
    // observability can distinguish.
    const confirmed = delivery && delivery.is_delivered === 1 ? 'd' : 'p';
    return `imessage-sent-${confirmed}-${Date.now()}`;
  }

  // ── send helpers (F8 + F11) ────────────────────────────────────────────────

  /**
   * F8 - look up `chat.service_name` ("iMessage" | "SMS") for the chatId so
   * `buildSendScript` can choose the right AppleScript service. For group
   * chats (`chat...` GUID) matches `chat.guid`; for 1:1 sends matches the
   * most-recent chat where the handle appears. Returns null if unknown -
   * caller defaults to iMessage.
   */
  private lookupChatServiceName(chatId: string): string | null {
    if (!this.db) return null;
    try {
      if (/^chat[0-9a-f]+$/i.test(chatId)) {
        const row = this.db
          .prepare('SELECT service_name FROM chat WHERE guid = ? LIMIT 1')
          .get(chatId) as { service_name: string | null } | undefined;
        return row?.service_name ?? null;
      }
      const row = this.db
        .prepare(
          `SELECT c.service_name AS service_name
           FROM chat c
           JOIN chat_handle_join chj ON chj.chat_id = c.rowid
           JOIN handle h ON h.rowid = chj.handle_id
           WHERE h.id = ?
           ORDER BY c.rowid DESC
           LIMIT 1`,
        )
        .get(chatId) as { service_name: string | null } | undefined;
      return row?.service_name ?? null;
    } catch {
      return null;
    }
  }

  /**
   * F11 - poll chat.db for the most-recent outbound row created since send.
   * Returns when is_delivered=1 OR error!=0, or null after the cycle budget.
   */
  private async pollDeliveryStatus(
    sinceDateNs: number,
  ): Promise<{ rowid: number; is_delivered: number; error: number; date_delivered: number } | null> {
    if (!this.db) return null;
    let stmt: Database.Statement;
    try {
      stmt = this.db.prepare(SQL_DELIVERY_CHECK);
    } catch {
      return null;
    }

    for (let i = 0; i < DELIVERY_POLL_CYCLES; i++) {
      await new Promise((r) => setTimeout(r, DELIVERY_POLL_INTERVAL_MS));
      try {
        const row = stmt.get(sinceDateNs) as
          | { rowid: number; is_delivered: number; error: number; date_delivered: number }
          | undefined;
        if (!row) continue;
        if (row.error !== 0) return row;
        if (row.is_delivered === 1) return row;
      } catch {
        return null;
      }
    }
    return null;
  }

  // ── reactions (tapbacks) ───────────────────────────────────────────────────

  /**
   * Send an iMessage tapback on a previously-received message.
   *
   * @param chatId   Chat GUID or phone/email handle (same as sendMessage).
   * @param msgId    Wayland message ID (== chat.db rowid as string). Looked up
   *                 in chat.db to recover the original body text, which the
   *                 AppleScript then targets by body match. If lookup fails
   *                 the tapback is aborted rather than risk targeting the
   *                 wrong message.
   * @param reaction Tapback emoji key: 'heart', 'thumbsup', 'thumbsdown',
   *                 'haha', 'emphasis', 'question'.
   */
  async reactToMessage(chatId: string, msgId: string, reaction: string): Promise<void> {
    const code = TAPBACK_CODES[reaction.toLowerCase()];
    if (code == null) {
      throw new Error(`iMessage: unknown tapback reaction '${reaction}'. Valid: ${Object.keys(TAPBACK_CODES).join(', ')}`);
    }

    // Resolve the original message body from chat.db so we can target a
    // specific message instead of "last message of targetChat".
    if (!this.db) {
      throw new Error(`iMessage tapback: plugin not started; cannot look up message id ${msgId}`);
    }
    const rowidNum = Number(msgId);
    if (!Number.isFinite(rowidNum) || rowidNum <= 0) {
      throw new Error(`iMessage tapback: could not find original message with id ${msgId}; tapback aborted to avoid wrong-target race`);
    }
    let body: string | null = null;
    try {
      const lookup = this.db
        .prepare('SELECT text FROM message WHERE rowid = ?')
        .get(rowidNum) as { text: string | null } | undefined;
      body = lookup?.text?.trim() ?? null;
    } catch {
      body = null;
    }
    if (!body) {
      throw new Error(`iMessage tapback: could not find original message with id ${msgId}; tapback aborted to avoid wrong-target race`);
    }

    const script = buildTapbackScript(chatId, code, body);
    const result = await execFileNoThrow('osascript', ['-e', script], { timeoutMs: 15_000 });

    if (result.exitCode !== 0) {
      if (isAutomationDeniedStderr(result.stderr)) {
        throw new Error(
          'iMessage Automation access denied. Grant in System Settings → Privacy & Security → Automation → <app name> → Messages.',
        );
      }
      // F10: same brand-new-chat cache miss as sendMessage.
      if (isMissingChatStderr(result.stderr)) {
        throw new Error(
          'iMessage: target chat not found. Open it once in Messages.app to refresh, then retry.',
        );
      }
      throw new Error(`iMessage: tapback failed (exit ${result.exitCode}): ${result.stderr}`);
    }
  }

  // ── introspection ──────────────────────────────────────────────────────────

  getActiveUserCount(): number {
    return 0;
  }

  getBotInfo(): BotInfo | null {
    if (this._status !== 'running') return null;
    return {
      id: 'imessage-bot',
      username: 'imessage-bot',
      displayName: 'iMessage',
    };
  }

  // ── poll loop ──────────────────────────────────────────────────────────────

  private startPollLoop(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => {
      if (this.pollInFlight) return;
      void this.poll().catch((err) => console.error('[imessagePlugin] poll error:', err));
    }, this.pollIntervalMs);
  }

  private async poll(): Promise<void> {
    if (!this.stmt || !this.db) return;
    if (this.pollInFlight) return;
    this.pollInFlight = true;

    try {
      const rows = this.stmt.all(this.lastRowId) as import('./ImessageAdapter').ChatDbRow[];

      for (const row of rows) {
        if (row.rowid > this.lastRowId) this.lastRowId = row.rowid;

        const unified = rowToUnifiedMessage(row);
        if (!unified) continue;

        // Apply allowedHandles filter if configured.
        if (this.allowedHandles && !this.allowedHandles.has(unified.user.id.toLowerCase())) {
          continue;
        }

        try {
          await this.emitMessage(unified);
        } catch (err) {
          console.error('[imessagePlugin] emitMessage error:', err);
        }
      }
    } finally {
      this.pollInFlight = false;
    }
  }

  // ── static testConnection ─────────────────────────────────────────────────

  static override async testConnection(
    tokenJson: string,
  ): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    // 1. Platform check - fail fast on non-darwin.
    if (process.platform !== 'darwin') {
      return {
        success: false,
        error: `iMessage is macOS-only. Current platform: ${process.platform}`,
      };
    }

    // 2. Parse JSON creds (may be empty object - no required credentials).
    let _creds: { pollIntervalMs?: number; allowedHandles?: string[] };
    try {
      _creds = JSON.parse(tokenJson) as typeof _creds;
    } catch {
      return { success: false, error: 'iMessage: invalid JSON credentials' };
    }

    // 3. Check chat.db exists and is readable.
    const dbPath = chatDbPath();
    if (!fs.existsSync(dbPath)) {
      return {
        success: false,
        error: `chat.db not found at ${dbPath}. Ensure iMessage is set up on this Mac.`,
      };
    }

    try {
      fs.accessSync(dbPath, fs.constants.R_OK);
    } catch {
      return {
        success: false,
        error: `chat.db is not readable. Grant Full Disk Access to this app in System Settings → Privacy & Security.`,
      };
    }

    // 4. Check osascript exists.
    const which = await execFileNoThrow('which', ['osascript'], { timeoutMs: 5_000 });
    if (which.exitCode !== 0 || !which.stdout) {
      return { success: false, error: 'osascript not found in PATH - is this a standard macOS install?' };
    }

    // 5. Trivial osascript smoke-test.
    const probe = await execFileNoThrow('osascript', ['-e', 'return "ok"'], { timeoutMs: 5_000 });
    if (probe.exitCode !== 0) {
      return { success: false, error: `osascript smoke-test failed: ${probe.stderr}` };
    }

    // 6. F2: TCC Automation probe. The smoke-test above only proves osascript
    //    runs; it does not touch Messages.app, so the user's first real send
    //    would be the moment macOS asks for Automation consent (or fails if
    //    denied). Probe Messages directly here so that prompt surfaces during
    //    Test & Enable. We swallow non-TCC errors (e.g. Messages.app not
    //    running yet) so they don't block setup - only an explicit Automation
    //    denial fails the test.
    const tccProbe = await execFileNoThrow(
      'osascript',
      ['-e', 'tell application "Messages" to return name'],
      { timeoutMs: 5_000 },
    );
    if (tccProbe.exitCode !== 0 && isAutomationDeniedStderr(tccProbe.stderr)) {
      return {
        success: false,
        error:
          'iMessage Automation access denied. Grant in System Settings → Privacy & Security → Automation → this app → Messages, then retry.',
      };
    }

    return { success: true, botUsername: 'imessage-bot' };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chatDbPath(): string {
  return path.join(os.homedir(), CHAT_DB_RELATIVE);
}

/**
 * Build an osascript script to send a plain-text iMessage.
 *
 * For group chats the chatId is a GUID like "chat123456789abc"; for 1:1 it is
 * a phone number or email. We detect the format and use the appropriate
 * AppleScript idiom.
 *
 * Security: message text and handle are both passed through
 * quoteAppleScriptString before interpolation.
 */
function buildSendScript(chatId: string, text: string, serviceName?: string | null): string {
  const quotedText = quoteAppleScriptString(text);

  // Group chat GUIDs look like "chat" followed by hex digits.
  if (/^chat[0-9a-f]+$/i.test(chatId)) {
    const quotedGuid = quoteAppleScriptString(chatId);
    return [
      'tell application "Messages"',
      `  set targetChat to chat id ${quotedGuid}`,
      `  send ${quotedText} to targetChat`,
      'end tell',
    ].join('\n');
  }

  // 1:1 handle (phone or email). F8: respect chat.service_name so SMS-relay
  // (green-bubble) recipients route through the SMS service rather than the
  // iMessage service - otherwise the send silently queues on iMessage and
  // never delivers. Default to iMessage when serviceName is unknown.
  const quotedHandle = quoteAppleScriptString(chatId);
  const useSms = typeof serviceName === 'string' && serviceName.toUpperCase() === 'SMS';
  const serviceType = useSms ? 'SMS' : 'iMessage';
  return [
    'tell application "Messages"',
    `  set targetService to 1st service whose service type = ${serviceType}`,
    `  set targetBuddy to buddy ${quotedHandle} of targetService`,
    `  send ${quotedText} to targetBuddy`,
    'end tell',
  ].join('\n');
}

/**
 * Convert a JS millisecond timestamp to chat.db's `date` column unit
 * (nanoseconds since 2001-01-01 UTC, Apple's CoreData epoch). Used by F11
 * to scope post-send delivery polls to rows created by THIS sendMessage call.
 */
function jsTimeMsToChatDbNs(jsMs: number): number {
  const APPLE_EPOCH_OFFSET_S = 978_307_200;
  return (jsMs - APPLE_EPOCH_OFFSET_S * 1000) * 1_000_000;
}

/**
 * Build an osascript script to send a tapback on the message in `chatId`
 * whose body matches `bodyText`. AppleScript's Messages.app dictionary cannot
 * address messages by rowid/guid, so we match by body - exact equality on the
 * iMessage body text. The orchestrator MUST resolve `bodyText` from chat.db
 * via the Wayland message id before calling this; do not pass arbitrary text.
 *
 * F9 (known limitation): if two messages in the same chat share identical
 * body text the tapback lands on the FIRST match (exit repeat). If `m.text`
 * (chat.db) and `text of m` (AppleScript view) diverge for an edited or rich
 * message the loop finds nothing. Documented in the setup help copy so users
 * understand tapbacks are best-effort.
 */
function buildTapbackScript(chatId: string, actionCode: number, bodyText: string): string {
  const quotedChat = quoteAppleScriptString(chatId);
  const quotedBody = quoteAppleScriptString(bodyText);
  return [
    'tell application "Messages"',
    `  set targetChat to chat id ${quotedChat}`,
    `  set targetBody to ${quotedBody}`,
    `  set targetMsg to missing value`,
    `  repeat with m in (messages of targetChat)`,
    `    if (text of m) is targetBody then`,
    `      set targetMsg to m`,
    `      exit repeat`,
    `    end if`,
    `  end repeat`,
    `  if targetMsg is missing value then error "iMessage tapback: matching message not found in target chat"`,
    `  perform action ${actionCode} on targetMsg`,
    'end tell',
  ].join('\n');
}

/**
 * Detect macOS Automation (TCC) denial in osascript stderr. Apple does not
 * use a stable code, but these substrings reliably appear in the localized
 * error message when the user denies "control Messages" consent.
 */
function isAutomationDeniedStderr(stderr: string | undefined): boolean {
  if (!stderr) return false;
  return (
    stderr.includes('not allowed to send Apple events') ||
    stderr.includes('-1743') ||
    stderr.includes('AppleScript')
  );
}

/**
 * F10: detect AppleScript -1728 "Can't get chat id ..." which Messages.app
 * throws when the target chat exists in chat.db but is missing from the live
 * AppleScript chat list cache (common for brand-new groups, merged threads,
 * or renamed chats). Mapped to a friendlier "open it once in Messages.app"
 * error rather than the raw osascript stderr.
 */
function isMissingChatStderr(stderr: string | undefined): boolean {
  if (!stderr) return false;
  return stderr.includes('-1728') || stderr.includes("Can't get chat id");
}
