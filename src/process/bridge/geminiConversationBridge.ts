/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { ipcBridge } from '@/common';
import type { GeminiAgentManager } from '../task/GeminiAgentManager';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';

// Gemini confirmMessage provider (for 'input.confirm.message' channel)
// Handles MCP tool confirmation including "always allow" options
export function initGeminiConversationBridge(workerTaskManager: IWorkerTaskManager): void {
  ipcBridge.geminiConversation.confirmMessage.provider(async ({ conversation_id, msg_id, confirmKey, callId }) => {
    const task = workerTaskManager.getTask(conversation_id);
    if (!task) {
      return { success: false, msg: 'conversation not found' };
    }
    if (task.type !== 'gemini') {
      return { success: false, msg: 'only supported for gemini' };
    }

    // Call GeminiAgentManager.confirm() to send confirmation to worker.
    // #983: that returns the worker round-trip, which now rejects when the
    // child exits - so a user clicking Allow on a card whose worker has died
    // would otherwise raise an unhandled rejection (logged + reported to Sentry
    // by the handler in src/index.ts). The confirmation is moot at that point;
    // log and move on.
    void (task as GeminiAgentManager).confirm(msg_id, callId, confirmKey).catch((error: unknown) => {
      console.warn(
        `[geminiConversationBridge] confirm for callId=${callId} was not delivered:`,
        error instanceof Error ? error.message : String(error)
      );
    });
    return { success: true };
  });
}
