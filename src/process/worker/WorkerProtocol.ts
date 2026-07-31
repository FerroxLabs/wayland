/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

// src/worker/WorkerProtocol.ts

/** Messages sent from main process to worker */
export type MainToWorkerMessage =
  | { type: 'start'; data: unknown }
  | { type: 'stop.stream'; data: Record<string, never> }
  | { type: 'send.message'; data: unknown };

/**
 * Events sent from worker to main process.
 * Agent-specific variants (e.g. 'gemini.message') are defined in
 * src/worker/<agent>.protocol.ts and composed there.
 */
export type WorkerToMainEvent =
  | { type: 'complete'; data: unknown }
  | { type: 'error'; data: unknown }
  | { type: string; data: unknown; pipeId?: string };
