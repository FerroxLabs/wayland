/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'events';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';

/**
 * Channel global event types
 */
export const ChannelEvents = {
  /** Agent message event */
  AGENT_MESSAGE: 'channel.agent.message',
} as const;

/**
 * Agent message event data
 */
export interface IAgentMessageEvent extends IResponseMessage {
  conversation_id: string;
}

/**
 * ChannelEventBus - global event bus
 *
 * Used for global dispatch of Agent messages, decoupling ChannelMessageService from Agent Task.
 *
 * Usage:
 * ```typescript
 * // Emit an event (e.g. inside GeminiAgentManager)
 * channelEventBus.emitAgentMessage(conversationId, data);
 *
 * // Listen for events (e.g. inside ChannelMessageService)
 * channelEventBus.onAgentMessage((event) => {
 *   // handle message
 * });
 * ```
 */
class ChannelEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase the listener limit to avoid warnings
    this.setMaxListeners(100);
  }

  /**
   * Emit an agent message event
   */
  emitAgentMessage(conversationId: string, data: IResponseMessage): void {
    const event: IAgentMessageEvent = {
      ...data,
      conversation_id: conversationId,
    };
    this.emit(ChannelEvents.AGENT_MESSAGE, event);
  }

  /**
   * Listen for agent message events
   */
  onAgentMessage(handler: (event: IAgentMessageEvent) => void): () => void {
    this.on(ChannelEvents.AGENT_MESSAGE, handler);
    return () => {
      this.off(ChannelEvents.AGENT_MESSAGE, handler);
    };
  }

  /**
   * Remove an agent message listener
   */
  offAgentMessage(handler: (event: IAgentMessageEvent) => void): void {
    this.off(ChannelEvents.AGENT_MESSAGE, handler);
  }
}

// Singleton instance
export const channelEventBus = new ChannelEventBus();
