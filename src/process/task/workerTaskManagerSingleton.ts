/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

/**
 * Singleton WorkerTaskManager wired with all registered agent creators.
 * Extracted to a separate module to avoid circular dependencies with initBridge.ts.
 */

import { AgentFactory } from './AgentFactory';
import { WorkerTaskManager } from './WorkerTaskManager';
import { SqliteConversationRepository } from '@process/services/database/SqliteConversationRepository';
import { GeminiAgentManager } from './GeminiAgentManager';
import AcpAgentManager from './AcpAgentManager';
import OpenClawAgentManager from './OpenClawAgentManager';
import RemoteAgentManager from './RemoteAgentManager';

const agentFactory = new AgentFactory();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
agentFactory.register('gemini', (conv, opts) => {
  const c = conv as any;
  return new GeminiAgentManager(
    {
      ...c.extra,
      conversation_id: c.id,
      yoloMode: opts?.yoloMode,
      executionPolicy: opts?.executionPolicy,
    },
    c.model
  ) as unknown as ReturnType<typeof agentFactory.create>;
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
agentFactory.register('acp', (conv, opts) => {
  const c = conv as any;
  return new AcpAgentManager({
    ...c.extra,
    conversation_id: c.id,
    yoloMode: opts?.yoloMode,
    unattendedHoldDeadlineMs: opts?.unattendedHoldDeadlineMs,
    // Only gemini ACP conversations use conversation.model as a backend-aligned model
    // fallback. Other ACP backends persist their own CLI model IDs in extra.currentModelId.
    currentModelId: c.extra?.currentModelId ?? (c.extra?.backend === 'gemini' ? c.model?.useModel : undefined),
  }) as unknown as ReturnType<typeof agentFactory.create>;
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
agentFactory.register('openclaw-gateway', (conv, opts) => {
  const c = conv as any;
  return new OpenClawAgentManager({
    ...c.extra,
    conversation_id: c.id,
    yoloMode: opts?.yoloMode,
  }) as unknown as ReturnType<typeof agentFactory.create>;
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
agentFactory.register('remote', (conv, opts) => {
  const c = conv as any;
  return new RemoteAgentManager({
    ...c.extra,
    conversation_id: c.id,
    yoloMode: opts?.yoloMode,
  }) as unknown as ReturnType<typeof agentFactory.create>;
});

const conversationRepo = new SqliteConversationRepository();
export const workerTaskManager = new WorkerTaskManager(agentFactory, conversationRepo);
