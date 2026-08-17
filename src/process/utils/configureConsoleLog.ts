/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

/**
 * Redirect main-process console output to electron-log so that all
 * console.log / console.warn / console.error calls are persisted to
 * daily log files on disk.
 *
 * Log file location (managed by electron-log):
 *   - macOS:   ~/Library/Logs/Wayland/YYYY-MM-DD.log
 *   - Windows: %USERPROFILE%\AppData\Roaming\Wayland\logs\YYYY-MM-DD.log
 *   - Linux:   ~/.config/Wayland/logs/YYYY-MM-DD.log
 *
 * Users can share the relevant date's file for debugging (#1157).
 *
 * Must be imported as early as possible in the main process entry point,
 * BEFORE any other module emits console output.
 */

import log from 'electron-log/main';
import { redactLogData } from './secretRedaction';

// Daily log file: e.g. 2026-03-12.log
const today = new Date().toISOString().slice(0, 10);
log.transports.file.fileName = `${today}.log`;

// Persist info-level and above to file; keep all levels in terminal stdout.
log.transports.file.level = 'info';
log.transports.console.level = 'silly';

// Cap each daily log file at 10 MB.
log.transports.file.maxSize = 10 * 1024 * 1024;

// #984: scrub known secret shapes out of anything that reaches the FILE
// transport. Untrusted subprocess output (agent/engine stderr) is logged by
// several paths, and the daily file is what a user attaches to a bug report, so
// the on-disk copy must be safe by default rather than by caller discipline.
//
// Scoped to `file` on purpose: the hook runs once per transport, so the
// terminal/DevTools console keeps full-fidelity output for live debugging and
// only the persisted copy is redacted. Cost is a handful of linear regex passes
// per info-level line - the patterns have no ambiguous quantifiers, so there is
// no backtracking risk on a long line.
log.hooks.push((message, _transport, transportName) => {
  if (transportName !== 'file') return message;
  return { ...message, data: redactLogData(message.data) };
});

// Patch global console so every console.log/warn/error from any module
// goes through electron-log (and thus to the file transport).
log.initialize();

// log.initialize() only patches the renderer via preload.
// Explicitly redirect main-process console to electron-log.
Object.assign(console, log.functions);
