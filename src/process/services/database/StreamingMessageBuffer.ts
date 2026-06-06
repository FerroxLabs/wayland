/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';
import { getDatabase } from './index';

/**
 * Streaming message buffer manager.
 *
 * Purpose: optimize database write performance for streaming messages.
 *
 * Core strategy:
 * - Deferred updates: don't write to the database on every chunk; batch periodically instead.
 * - Batched writes: write once every 300ms or after 20 accumulated chunks.
 *
 * Performance gain:
 * - Before: 1000 UPDATEs (one per chunk).
 * - After: ~10 UPDATEs (periodic batching).
 * - Improvement: ~100x.
 */

interface StreamBuffer {
  messageId: string;
  conversationId: string;
  currentContent: string;
  chunkCount: number;
  lastDbUpdate: number;
  updateTimer?: NodeJS.Timeout;
  mode: 'accumulate' | 'replace'; // per-buffer mode to avoid concurrent conflicts
}

interface StreamingConfig {
  updateInterval?: number; // update interval (milliseconds)
  chunkBatchSize?: number; // update once every N chunks
}

export class StreamingMessageBuffer {
  private buffers = new Map<string, StreamBuffer>();

  // Default configuration
  private readonly UPDATE_INTERVAL = 300; // update once every 300ms
  private readonly CHUNK_BATCH_SIZE = 20; // or after 20 accumulated chunks

  constructor(private config?: StreamingConfig) {
    if (config?.updateInterval) {
      (this as any).UPDATE_INTERVAL = config.updateInterval;
    }
    if (config?.chunkBatchSize) {
      (this as any).CHUNK_BATCH_SIZE = config.chunkBatchSize;
    }
  }

  /**
   * Append a streaming chunk.
   *
   * @param id
   * @param messageId - merged-message unique ID
   * @param conversationId - conversation ID
   * @param chunk - text fragment
   *
   * Performance optimization: batched writes instead of one DB write per chunk.
   * @param mode
   */
  append(id: string, messageId: string, conversationId: string, chunk: string, mode: 'accumulate' | 'replace'): void {
    let buffer = this.buffers.get(messageId);

    if (!buffer) {
      // First chunk: initialize the buffer (store mode on the buffer rather than the instance)
      buffer = {
        messageId,
        conversationId,
        currentContent: chunk,
        chunkCount: 1,
        lastDbUpdate: Date.now(),
        mode, // each buffer uses its own mode to avoid concurrent-message mode conflicts
      };
      this.buffers.set(messageId, buffer);
    } else {
      // Accumulate or replace content based on the buffer's mode (uses buffer.mode rather than this.mode)
      if (buffer.mode === 'accumulate') {
        buffer.currentContent += chunk;
      } else {
        buffer.currentContent = chunk; // replace mode: overwrite directly
      }
      buffer.chunkCount++;
    }

    // Clear the old timer
    if (buffer.updateTimer) {
      clearTimeout(buffer.updateTimer);
      buffer.updateTimer = undefined;
    }

    // Decide whether to update the database (based only on count and time)
    const shouldUpdate =
      buffer.chunkCount % this.CHUNK_BATCH_SIZE === 0 || // enough chunks accumulated
      Date.now() - buffer.lastDbUpdate > this.UPDATE_INTERVAL; // time interval exceeded

    if (shouldUpdate) {
      // Update immediately
      this.flushBuffer(id, messageId, false);
    } else {
      // Schedule a deferred update (so message streams aren't interrupted)
      buffer.updateTimer = setTimeout(() => {
        this.flushBuffer(id, messageId, false);
      }, this.UPDATE_INTERVAL);
    }
  }

  /**
   * Flush the buffer to the database.
   *
   * @param id
   * @param messageId - merged-message unique message ID
   * @param clearBuffer - whether to clear the buffer (default false)
   */
  private async flushBuffer(id: string, messageId: string, clearBuffer = false): Promise<void> {
    const buffer = this.buffers.get(messageId);
    if (!buffer) return;

    const db = await getDatabase();

    try {
      const message: TMessage = {
        id: id,
        msg_id: messageId,
        conversation_id: buffer.conversationId,
        type: 'text',
        content: { content: buffer.currentContent },
        status: 'pending',
        position: 'left',
        createdAt: Date.now(),
      };

      // Check if message exists in database
      const existing = db.getMessageByMsgId(buffer.conversationId, messageId, 'text');

      if (existing.success && existing.data) {
        // Message exists - update it
        db.updateMessage(existing.data.id, message);
      } else {
        // Message doesn't exist - insert it
        db.insertMessage(message);
      }

      // Record the time of the last write
      buffer.lastDbUpdate = Date.now();

      // Clear the buffer if requested
      if (clearBuffer) {
        this.buffers.delete(messageId);
      }
    } catch (error) {
      console.error(`[StreamingBuffer] Failed to flush buffer for ${messageId}:`, error);
    }
  }
}

// Singleton instance
export const streamingBuffer = new StreamingMessageBuffer();
