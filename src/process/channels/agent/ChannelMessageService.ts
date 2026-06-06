/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { workerTaskManager } from '@process/task/workerTaskManagerSingleton';
import { getDatabase } from '@process/services/database';
import type BaseAgentManager from '@process/task/BaseAgentManager';
import type { IAgentManager } from '@process/task/IAgentManager';
import { composeMessage, transformMessage, type TMessage } from '@/common/chat/chatLib';
import { uuid } from '@/common/utils';
import { channelEventBus, type IAgentMessageEvent } from './ChannelEventBus';

/**
 * Streaming callback for progress updates
 */
export type StreamCallback = (chunk: TMessage, insert: boolean) => void;

/**
 * Message stream state
 */
interface IStreamState {
  msgId: string;
  callback: StreamCallback;
  buffer: string;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  /** Number of 'start' events received (tracks multi-turn tool-call continuations) */
  turnCount: number;
  /** Number of 'finish' events received */
  finishCount: number;
  /** Last visible message type seen in the stream */
  lastVisibleMessageType?: TMessage['type'];
  /** Whether the current stream has emitted assistant-visible answer content */
  hasAnswerMessage?: boolean;
  /** Whether the current stream has emitted only progress/tool/status content so far */
  hasNonAnswerMessage?: boolean;
  /** Timer used to wait for a continuation turn after a tool-only finish */
  finishTimer?: ReturnType<typeof setTimeout>;
}

const TOOL_CONTINUATION_WAIT_MS = 15_000;

function isNonAnswerMessage(message: TMessage): boolean {
  if (message.type === 'agent_status') {
    return message.content.status !== 'error';
  }
  return (
    message.type === 'tool_group' ||
    message.type === 'tool_call' ||
    message.type === 'acp_tool_call' ||
    message.type === 'codex_tool_call' ||
    message.type === 'plan' ||
    message.type === 'thinking'
  );
}

/**
 * ChannelMessageService - Manages message sending for Channel
 *
 * Architecture (decoupled design):
 * 1. Global event listener: listens to agent messages via ChannelEventBus
 * 2. sendMessage(): only sends messages and registers stream callbacks
 * 3. handleAgentMessage(): handles message events
 *
 * Does not interact directly with Agent Tasks; fully decoupled through the global event bus
 */
export class ChannelMessageService {
  /**
   * Active message stream cache: conversationId -> stream state
   */
  private activeStreams: Map<string, IStreamState> = new Map();

  /**
   * Global event listener cleanup function
   */
  private eventCleanup: (() => void) | null = null;

  /**
   * Whether initialized
   */
  private initialized = false;

  private messageListMap = new Map<string, TMessage[]>();

  private clearFinishTimer(stream: IStreamState): void {
    if (stream.finishTimer) {
      clearTimeout(stream.finishTimer);
      stream.finishTimer = undefined;
    }
  }

  private resolveStream(conversationId: string, stream: IStreamState): void {
    this.clearFinishTimer(stream);
    this.activeStreams.delete(conversationId);
    stream.resolve(stream.msgId);
  }

  /**
   * Initialize service, register global event listener
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Listen to global agent message events
    this.eventCleanup = channelEventBus.onAgentMessage((event) => {
      this.handleAgentMessage(event);
    });

    this.initialized = true;
  }

  /**
   * Handle agent message event
   */
  private handleAgentMessage(event: IAgentMessageEvent): void {
    const conversationId = event.conversation_id;
    const stream = this.activeStreams.get(conversationId);
    if (!stream) {
      // No active stream, ignore message
      return;
    }

    // Track 'start' events to count multi-turn continuations (e.g., tool call → model response).
    // The Gemini agent emits a new 'start' for each submitQuery turn, including continuations
    // triggered by onAllToolCallsComplete. We must wait for all turns to finish.
    if (event.type === 'start') {
      this.clearFinishTimer(stream);
      stream.turnCount++;
      return;
    }

    // Detect stream completion: only resolve when all turns have finished.
    // When turnCount is 0 (no 'start' received, e.g., error-only flows), resolve immediately.
    if (event.type === 'finish') {
      stream.finishCount++;
      if (stream.turnCount === 0 || stream.finishCount >= stream.turnCount) {
        const shouldWaitForContinuation = Boolean(stream.hasNonAnswerMessage && !stream.hasAnswerMessage);
        if (shouldWaitForContinuation) {
          this.clearFinishTimer(stream);
          stream.finishTimer = setTimeout(() => {
            if (this.activeStreams.get(conversationId) === stream) {
              this.resolveStream(conversationId, stream);
            }
          }, TOOL_CONTINUATION_WAIT_MS);
        } else {
          this.resolveStream(conversationId, stream);
        }
      }
      return;
    }

    // Transform message
    const message = transformMessage(event);
    if (!message) {
      // transformMessage returns undefined for message types that don't need processing (like thought, start)
      return;
    }

    stream.lastVisibleMessageType = message.type;
    if (isNonAnswerMessage(message)) {
      stream.hasNonAnswerMessage = true;
    } else {
      stream.hasAnswerMessage = true;
    }

    let messageList = this.messageListMap.get(conversationId);
    if (!messageList) {
      messageList = [];
    }

    messageList = composeMessage(message, messageList, (type, msg: TMessage) => {
      // insert: true means new message, false means update existing message

      const isInsert = type === 'insert';
      stream.callback(msg, isInsert);
    });
    this.messageListMap.set(conversationId, messageList.slice(-20));
  }

  /**
   * Send a message and get streaming response
   *
   * @param _sessionId - User session ID (kept for API compatibility)
   * @param conversationId - Conversation ID for context
   * @param message - User message text
   * @param onStream - Callback for streaming updates
   * @returns Promise that resolves when streaming is complete
   */
  async sendMessage(
    _sessionId: string,
    conversationId: string,
    message: string,
    onStream: StreamCallback
  ): Promise<string> {
    // Ensure service is initialized
    this.initialize();

    // Generate message ID
    const msgId = `channel_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Get task
    let task: IAgentManager;
    try {
      // Check conversation source, enable yoloMode (auto-approve) if it's from a Channel
      const db = await getDatabase();
      const dbResult = db.getConversation(conversationId);
      const isFromChannel =
        dbResult.success &&
        (dbResult.data?.source === 'lark' ||
          dbResult.data?.source === 'telegram' ||
          dbResult.data?.source === 'dingtalk' ||
          dbResult.data?.source === 'weixin' ||
          dbResult.data?.source === 'wecom');

      task = await workerTaskManager.getOrBuildTask(conversationId, {
        yoloMode: isFromChannel,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get conversation task';
      console.error(`[ChannelMessageService] Failed to get task:`, errorMsg);
      onStream(
        {
          type: 'tips',
          id: uuid(),
          conversation_id: conversationId,
          content: {
            type: 'error',
            content: `Error: ${errorMsg}`,
          },
        },
        true
      );
      throw error;
    }

    return new Promise((resolve, reject) => {
      const existingStream = this.activeStreams.get(conversationId);
      if (existingStream) {
        this.resolveStream(conversationId, existingStream);
      }

      // Register stream state
      this.activeStreams.set(conversationId, {
        msgId,
        callback: onStream,
        buffer: '',
        resolve,
        reject,
        turnCount: 0,
        finishCount: 0,
        lastVisibleMessageType: undefined,
        hasAnswerMessage: false,
        hasNonAnswerMessage: false,
        finishTimer: undefined,
      });

      // Build payload based on agent type.
      // Gemini expects { input }; all other agents expect { content }.
      const useInputPayload = task.type === 'gemini';
      const payload: { input?: string; content?: string; msg_id: string } = useInputPayload
        ? { input: message, msg_id: msgId }
        : { content: message, msg_id: msgId };

      task.sendMessage(payload).catch((error: Error) => {
        const errorMessage = `Error: ${error.message || 'Failed to send message'}`;
        console.error(`[ChannelMessageService] Send error:`, error);
        onStream(
          {
            type: 'tips',
            id: uuid(),
            conversation_id: conversationId,
            content: { type: 'error', content: errorMessage },
          },
          true
        );
        const stream = this.activeStreams.get(conversationId);
        if (stream) {
          this.clearFinishTimer(stream);
        }
        this.activeStreams.delete(conversationId);
        reject(error);
      });
    });
  }

  /**
   * Clear conversation context for a session
   * Note: Agent cleanup is handled by WorkerManage.
   *
   */
  async clearContext(_sessionId: string): Promise<void> {
    // Agent cleanup is handled by WorkerManage
  }

  /**
   * Clear active stream for a conversation
   */
  clearStreamByConversationId(conversationId: string): void {
    const stream = this.activeStreams.get(conversationId);
    if (!stream) return;
    this.clearFinishTimer(stream);
    this.activeStreams.delete(conversationId);
    // Resolve (not reject) so the caller's post-stream cleanup runs normally
    // (e.g., ActionExecutor finalizing the card with action buttons).
    stream.resolve(stream.msgId);
  }

  /**
   * Stop streaming for a conversation
   */
  async stopStreaming(conversationId: string): Promise<void> {
    try {
      const task = workerTaskManager.getTask(conversationId);
      if (task) {
        await task.stop();
      }
    } catch (error) {
      console.warn(`[ChannelMessageService] Failed to stop streaming:`, error);
    }
    this.clearStreamByConversationId(conversationId);
  }

  /**
   * Confirm a tool call for a conversation
   * @param conversationId - Conversation ID
   * @param callId - Tool call ID
   * @param value - Confirmation value (e.g., 'proceed_once', 'cancel')
   */
  async confirm(conversationId: string, callId: string, value: string): Promise<void> {
    try {
      const task = workerTaskManager.getTask(conversationId);
      if (!task) {
        throw new Error(`Task not found for conversation ${conversationId}`);
      }

      // Call agent's confirm method
      task.confirm(conversationId, callId, value);
    } catch (error) {
      console.error(`[ChannelMessageService] Failed to confirm tool call:`, error);
      throw error;
    }
  }

  /**
   * Shutdown service
   * Called during application shutdown
   */
  async shutdown(): Promise<void> {
    // Clear all active streams
    for (const [conversationId] of this.activeStreams) {
      this.clearStreamByConversationId(conversationId);
    }
    this.activeStreams.clear();

    // Remove global event listener
    if (this.eventCleanup) {
      this.eventCleanup();
      this.eventCleanup = null;
    }

    this.initialized = false;
  }
}

// Singleton instance
let serviceInstance: ChannelMessageService | null = null;

export function getChannelMessageService(): ChannelMessageService {
  if (!serviceInstance) {
    serviceInstance = new ChannelMessageService();
  }
  return serviceInstance;
}

// Backward compatibility export
export { ChannelMessageService as ChannelGeminiService, getChannelMessageService as getChannelGeminiService };
