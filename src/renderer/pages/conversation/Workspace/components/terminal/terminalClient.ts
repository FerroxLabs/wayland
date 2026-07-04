/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Task 5 — typed renderer accessor for the terminal bridge.
 *
 * Thin wrapper over `ipcBridge.terminal.*` that (a) gives TerminalPanel a clean,
 * mockable surface and (b) centralizes the per-`terminalId` self-filtering the
 * multiplexed output/exit emitters require. Every `on*` returns an unsubscribe.
 */
import { ipcBridge } from '@/common';
import type { TerminalOpenParams, TerminalOpenResult } from '@/common/types/terminal';

export const terminalClient = {
  open: (params: TerminalOpenParams): Promise<TerminalOpenResult> => ipcBridge.terminal.open.invoke(params),

  input: (terminalId: string, data: string): Promise<void> => ipcBridge.terminal.input.invoke({ terminalId, data }),

  resize: (terminalId: string, cols: number, rows: number): Promise<void> =>
    ipcBridge.terminal.resize.invoke({ terminalId, cols, rows }),

  close: (terminalId: string): Promise<void> => ipcBridge.terminal.close.invoke({ terminalId }),

  onOutput: (terminalId: string, cb: (data: string) => void): (() => void) =>
    ipcBridge.terminal.output.on((p) => {
      if (p.terminalId === terminalId) cb(p.data);
    }),

  onExit: (terminalId: string, cb: (exitCode: number) => void): (() => void) =>
    ipcBridge.terminal.exit.on((p) => {
      if (p.terminalId === terminalId) cb(p.exitCode);
    }),
};

export type TerminalClient = typeof terminalClient;
