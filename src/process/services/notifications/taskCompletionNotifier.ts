/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #579 — tell the user when a task finishes, without making them watch the screen.
 *
 * The Notifications settings page already shipped `notifications.agentFinished`,
 * `notifications.agentError`, `notifications.playSound` and `notifications.quietHours`,
 * all defaulted ON — but NOTHING in the main process ever read them. Flipping them
 * did nothing. This is the reader that makes those switches real.
 *
 * The reporter asked for a sound; the shipped shape is an OS-native notification
 * with sound as an option, because a sound alone can't say WHICH task finished or
 * whether it failed.
 *
 * ── THE TRAP ─────────────────────────────────────────────────────────────────
 * `conversation.turn.completed` is a TURN event, not a TASK event. Notifying on
 * every one of them is a spam cannon, and the fan-out is not obvious:
 *
 *   - `ai_waiting_input` ALSO fires when the agent is parked on a tool/permission
 *     confirmation. WorkflowSessionService already spells this out: a non-zero
 *     `pendingConfirmations` means "the step is NOT complete". Notifying there
 *     announces "Task complete" on every approval prompt — a lie, once per tool call.
 *   - The upstream dedupe in ConversationTurnCompletionService is keyed per
 *     CONVERSATION, so it does nothing against fan-out ACROSS conversations.
 *     A team round is one conversation per slot; an autonomous workflow is one
 *     child conversation per step. Both would raise a banner each.
 *   - A workflow's parent conversation is advanced by hidden directives — one
 *     turn, and so one banner, per step.
 *   - Cron turns complete like any other, and CronService ALREADY notifies for
 *     those (`system.cronNotificationEnabled`), so we would double-notify.
 *
 * So the gate is a positive one: only a conversation the USER is actually driving,
 * that has genuinely come to rest, earns a banner.
 */
import { ipcBridge } from '@/common';
import type { IConversationTurnCompletedEvent } from '@/common/adapter/ipcBridge';
import type { TChatConversation } from '@/common/config/storage';
import type { WorkflowSession } from '@/common/types/workflowTypes';
import { DEFAULT_QUIET_HOURS } from '@/common/config/notificationDefaults';
import { redactCommandSecrets } from '@/common/utils/redactCommandSecrets';
import { showNotification } from '@process/bridge/notificationBridge';
import i18n, { i18nReady } from '@process/services/i18n';
import { ProcessConfig } from '@process/utils/initStorage';
import { mainWarn } from '@process/utils/mainLogger';

export type TaskCompletionNotifierDeps = {
  /**
   * Whether ANY app window has focus — including a popped-out conversation, which
   * is its own BrowserWindow. Injected rather than importing `electron` here: this
   * module has no business being Electron-only.
   */
  isAppFocused: () => boolean;
  /**
   * The conversation the user is currently LOOKING AT (foreground window's open
   * chat), or null when no chat is in view. Lets the focus gate stay quiet only
   * about the exact conversation on screen — not every conversation while the app
   * happens to be focused on a different one.
   */
  getForegroundConversationId: () => string | null;
  getConversation: (id: string) => Promise<TChatConversation | undefined>;
  /** The workflow session driving this conversation, if any. */
  findWorkflowByConversationId: (id: string) => WorkflowSession | null;
};

/** `HH:MM` → minutes since midnight, or null if it is not a valid clock time. */
function toMinutes(hhmm: unknown): number | null {
  // Guarded: a hand-edited or half-migrated config can put a non-string here, and
  // a TypeError thrown from the quiet-hours check would kill the notification.
  if (typeof hhmm !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Is `now` inside the quiet window? Exported for test.
 *
 * The window WRAPS midnight in the common case (the shipped default is 22:00–07:00),
 * so a naive `start <= now && now < end` is wrong for every default user — it would
 * be false all night and true all day, i.e. exactly inverted. When start > end the
 * window is the union of [start, midnight) and [midnight, end).
 *
 * start === end is treated as an EMPTY window, not a 24h one: a user who sets both
 * ends the same has not asked to be silenced forever.
 */
export function isWithinQuietHours(now: Date, quiet: { start: string; end: string }): boolean {
  const start = toMinutes(quiet.start);
  const end = toMinutes(quiet.end);
  if (start === null || end === null || start === end) return false;

  const cur = now.getHours() * 60 + now.getMinutes();
  return start < end ? cur >= start && cur < end : cur >= start || cur < end;
}

/**
 * Has this turn actually come to rest?
 *
 * `pendingConfirmations > 0` means the agent stopped to ASK — a tool call or a
 * permission prompt. That is the opposite of finished, and it is the single most
 * common way to end a turn. Exported so the reason it exists stays testable.
 */
export function isTaskComplete(event: IConversationTurnCompletedEvent): boolean {
  const terminal = event.state === 'ai_waiting_input' || event.state === 'stopped' || event.state === 'error';
  if (!terminal) return false;
  return (event.runtime?.pendingConfirmations ?? 0) === 0;
}

/**
 * Is this a conversation the USER is driving at the desk, as opposed to machinery?
 *
 * Everything excluded here is a conversation the user did not personally start at
 * the keyboard and is not personally waiting on — each of which fans out to many
 * turns. Note the caller must have a REAL conversation to pass: every check below
 * reads from it, so a missing one would drop them all at once.
 */
export function isUserFacingConversation(conversation: TChatConversation, workflow: WorkflowSession | null): boolean {
  // An ACTIVE workflow advances its parent conversation with a hidden directive
  // per step. Those are control messages, not the user's task. (The workflow's own
  // completion deserves its own notification one day — it is not this turn event.)
  if (workflow && workflow.status === 'active') return false;

  // A channel-inbound turn (Telegram / Lark / DingTalk / WeChat / iMessage …) was
  // not started at the desk and is already answered in the channel the user is
  // actually reading. This is an ALLOWLIST on purpose: ConversationSource is an
  // open `(string & {})` union, so a new channel must not silently opt itself in.
  //
  // It is also the one category none of the other gates can catch: channel sources
  // AUTO-APPROVE tool permissions (isAutoApproveChannelSource — "no interactive
  // human in the loop"), so pendingConfirmations is always 0, and the app is
  // unfocused by construction because the user is on their phone.
  if (conversation.source && conversation.source !== 'wayland') return false;

  const extra = (conversation.extra ?? {}) as Record<string, unknown>;
  if (extra.cronJobId) return false; // CronService already notifies for these.
  if (extra.autonomousDispatch) return false; // A workflow step's child worker.
  if (extra.teamId) return false; // One conversation per teammate slot.
  if (extra.isHealthCheck) return false; // Not a task at all.
  return true;
}

/** Whether the notification should ring, honouring playSound + quiet hours. */
async function resolveSilent(now: Date): Promise<boolean> {
  const playSound = (await ProcessConfig.get('notifications.playSound')) ?? true;
  if (!playSound) return true;

  // Fall back to the DEFAULT window when nothing is persisted. Quiet hours has no
  // on/off toggle, and the settings page shows this same default — so it must be
  // in effect on a fresh install, not silently inert until the user happens to
  // edit a field (#579 follow-up: it was, so a fresh install rang at 3am).
  const quiet = (await ProcessConfig.get('notifications.quietHours')) ?? DEFAULT_QUIET_HOURS;
  // Quiet hours suppress the SOUND, not the notification — the settings copy
  // promises exactly that ("Suppress sound between these times"). NB Electron
  // honours `silent` on macOS/Windows; on Linux it is up to the notification daemon.
  return isWithinQuietHours(now, quiet);
}

async function handleTurnCompleted(
  event: IConversationTurnCompletedEvent,
  deps: TaskCompletionNotifierDeps
): Promise<void> {
  if (!isTaskComplete(event)) return;
  if (event.runtime?.hasTask) return; // cron-driven; CronService owns that banner.

  // Only stay quiet when the user is looking right AT THIS conversation: the app
  // is focused AND the foreground chat is the one that just finished. App-focused
  // but on a different chat (the multitask "switched to another chat" case #579
  // is for) — or on a non-conversation view — still earns a banner.
  if (deps.isAppFocused() && deps.getForegroundConversationId() === event.sessionId) return;

  const conversation = await deps.getConversation(event.sessionId);
  if (!conversation) {
    // FAIL CLOSED. SqliteConversationRepository returns `undefined` for BOTH "no
    // such row" AND "the read failed" — it never throws. Every machinery exclusion
    // below reads from this object, so treating a failed read as "a normal user
    // chat" would drop all of them AT ONCE and restore the exact fan-out this gate
    // exists to prevent — under DB pressure, which is precisely what a long
    // workflow creates. A missed banner is a nuisance; a banner storm is the bug.
    mainWarn('[taskCompletionNotifier]', 'No conversation for the completed turn; not notifying', event.sessionId);
    return;
  }
  if (!isUserFacingConversation(conversation, deps.findWorkflowByConversationId(event.sessionId))) return;

  const errored = event.state === 'error';
  const enabled =
    (await ProcessConfig.get(errored ? 'notifications.agentError' : 'notifications.agentFinished')) ?? true;
  if (!enabled) return;

  await i18nReady;

  // The conversation's own title, not the model id. `event.model.name` falls back
  // to the backend string, so it routinely reads "acp" — which tells the user nothing.
  const title = conversation.name?.trim() || i18n.t('conversation.notification.untitled');
  // The engine error string is third-party output that lands verbatim in a
  // system banner (persisted by the OS notification centre) — redact secret
  // shapes first, same leak class as the child-stderr logging (#714/#721).
  const detail = redactCommandSecrets((event.detail ?? '').trim());

  // `showNotification` still applies the master switch (system.notificationEnabled).
  await showNotification({
    title: errored
      ? i18n.t('conversation.notification.agentError.title')
      : i18n.t('conversation.notification.agentFinished.title'),
    body: errored
      ? i18n.t('conversation.notification.agentError.body', { title, detail: truncate(detail) })
      : i18n.t('conversation.notification.agentFinished.body', { title }),
    conversationId: event.sessionId,
    silent: await resolveSilent(new Date()),
  });
}

/** Error detail is a raw engine string; keep it to one readable line. */
function truncate(detail: string, max = 120): string {
  const oneLine = detail.replace(/\s+/g, ' ').trim();
  if (!oneLine) return '';
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

/**
 * Subscribe to turn completions.
 *
 * Same subscription the autonomous workflow driver uses (initBridge.ts). Repeat
 * completions for one conversation are already collapsed upstream by
 * ConversationTurnCompletionService's 1s window — that dedupe is per-conversation,
 * which is why the cross-conversation fan-out is gated above instead.
 */
export function initTaskCompletionNotifier(deps: TaskCompletionNotifierDeps): void {
  ipcBridge.conversation.turnCompleted.on((event: IConversationTurnCompletedEvent) => {
    handleTurnCompleted(event, deps).catch((err) => {
      mainWarn('[taskCompletionNotifier]', 'Failed to raise the completion notification', err);
    });
  });
}
