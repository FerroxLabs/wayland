/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Engine stderr → host log level mapping (#717).
//
// The wcore engine self-labels its stderr lines in the Rust `tracing` format
// (`2026-07-05T13:55:04.233881Z  INFO message`, usually ANSI-coloured). The
// host used to blanket-log all engine stderr via console.error, so routine
// INFO startup chatter was re-tagged `[error]` in the desktop log (with raw
// escape codes), drowning real errors and breaking error-rate monitoring.

export type WCoreStderrLevel = 'debug' | 'info' | 'warn' | 'error';

// CSI escape sequences (colour/formatting) the engine emits for terminals.
// Stripped so the severity token parses cleanly and the log file stays plain
// text.
// eslint-disable-next-line no-control-regex
const ANSI_CSI_RE = /\u001b\[[0-9;?]*[A-Za-z]/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_CSI_RE, '');
}

// `tracing` severities → host levels. TRACE and DEBUG both map to host debug
// (the file transport is info-level, so they stay console-only).
const LEVEL_MAP: Record<string, WCoreStderrLevel> = {
  TRACE: 'debug',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Parse the engine's own severity token from an ANSI-stripped stderr line.
 *
 * Matches the `tracing` shape: an optional leading timestamp token (starts
 * with a digit) followed by the level keyword, or the level keyword first.
 * Unlabelled lines (panics, raw prints) default to `warn`: prominent in the
 * log file without being counted as host errors. A level word appearing
 * mid-message does not count as a label.
 */
export function wcoreStderrLevel(line: string): WCoreStderrLevel {
  const match = /^\s*(?:\d\S*\s+)?(TRACE|DEBUG|INFO|WARN|ERROR)\b/.exec(line);
  return match ? LEVEL_MAP[match[1]] : 'warn';
}
