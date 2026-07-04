/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import log from 'electron-log';
import { cronBusyGuard } from '@process/services/cron/CronBusyGuard';
import { ProcessConfig } from '@process/utils/initStorage';

/**
 * Update-on-quiesce gate (#651/#632).
 *
 * An auto-update restart must never yank the rug out from under active work.
 * As Wayland runs autonomous agents, scheduled tasks, and standing teams it is
 * server-like — like VS Code / Slack / Chrome, it should apply an update on
 * idle/quit, never force-restart mid-task. This module wraps the install call
 * sites: if the app is busy and defer-while-busy is on, it registers a one-shot
 * install for when everything goes idle and reports 'deferred'; otherwise it
 * installs now.
 *
 * The busy signal is {@link cronBusyGuard}, which every agent manager
 * (WCore/ACP/Gemini/Remote/NanoBot/OpenClaw) already feeds — and because team
 * wakes and cron runs funnel through those managers, one registry answers "is
 * anything working right now" across chat + cron + team.
 */

/** Is any conversation / cron job / team wake actively processing right now? */
export function isAppBusy(): boolean {
  return cronBusyGuard.isAppBusy();
}

/**
 * Whether defer-while-busy is enabled. Default true. Read directly in the main
 * process (no IPC round-trip) so the gate can decide synchronously-ish at the
 * install call site. Never throws — a config read failure falls back to the
 * safe default (defer).
 */
export async function isDeferWhileBusyEnabled(): Promise<boolean> {
  try {
    const value = await ProcessConfig.get('update.deferWhileBusy');
    return value ?? true;
  } catch (error) {
    log.warn('[updateQuiesceGate] Failed to read update.deferWhileBusy; defaulting to defer:', error);
    return true;
  }
}

export type InstallOrDeferResult = 'installing' | 'deferred';

/**
 * At most one deferred install can be pending at a time. Guards against a user
 * clicking Install repeatedly while busy (each click would otherwise register
 * another onceAllIdle → multiple installs when idle).
 */
let deferPending = false;

/**
 * Route an install request through the quiesce gate.
 *
 * - If defer-while-busy is on AND the app is busy: register a one-shot install
 *   for when the app goes idle, invoke {@link onDeferred} (so the caller can
 *   broadcast the deferred UX), and return 'deferred'.
 * - Otherwise: run {@link install} now and return 'installing'.
 *
 * @param install    Performs the actual install/restart. Called exactly once.
 * @param onDeferred Optional; invoked when the install is deferred (not installed).
 */
export async function installOrDefer(install: () => void, onDeferred?: () => void): Promise<InstallOrDeferResult> {
  const deferEnabled = await isDeferWhileBusyEnabled();

  if (deferEnabled && isAppBusy()) {
    if (deferPending) {
      // Already waiting on idle — re-surface the deferred UX, don't double-register.
      onDeferred?.();
      return 'deferred';
    }
    deferPending = true;
    log.info('[updateQuiesceGate] App busy; deferring update restart until idle.');
    onDeferred?.();
    // onceAllIdle fires immediately if the app is already idle, so the check
    // above and this registration are race-free (see CronBusyGuard.onceAllIdle).
    cronBusyGuard.onceAllIdle(() => {
      deferPending = false;
      log.info('[updateQuiesceGate] App idle; applying deferred update restart.');
      install();
    });
    return 'deferred';
  }

  install();
  return 'installing';
}

/** Test-only: clear the module-level deferred-pending latch. */
export function __resetForTest(): void {
  deferPending = false;
}
