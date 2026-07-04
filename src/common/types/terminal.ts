/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Terminal mode — shared IPC types (renderer + main).
 */

/** Why a `terminal.open` was refused (renderer maps each to a localized line). */
export type TerminalOpenFailure =
  | 'disabled' // feature flag off (backend guard)
  | 'unsupported' // agent has no native-TUI mapping
  | 'missing-cli' // mapped CLI not installed / not on PATH
  | 'at-capacity' // concurrent-PTY cap reached
  | 'not-found'; // conversation id did not resolve

export type TerminalOpenResult = { ok: true } | { ok: false; reason: TerminalOpenFailure };

export type TerminalOpenParams = {
  /** Renderer-generated id that keys this PTY across input/output/resize/close. */
  terminalId: string;
  /** Chat/session id — the main process resolves the agent command from this. */
  sessionId: string;
  cols?: number;
  rows?: number;
};

export type TerminalOutputPayload = { terminalId: string; data: string };
export type TerminalExitPayload = { terminalId: string; exitCode: number };
