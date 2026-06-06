/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_IMAGE_EXTENSION, MIME_TO_EXT_MAP } from '@/common/config/constants';
import type {
  CompletedToolCall,
  Config,
  GeminiClient,
  ServerGeminiStreamEvent,
  ToolCallRequestInfo,
} from '@office-ai/aioncli-core';
import { GeminiEventType as ServerGeminiEventType } from '@office-ai/aioncli-core';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - executeToolCall is not re-exported from main entry but exists in subpath
import { executeToolCall } from '@office-ai/aioncli-core/dist/src/core/nonInteractiveToolExecutor.js';
import * as fs from 'fs';
import * as path from 'path';
import { parseAndFormatApiError } from './cli/errorParsing';
import {
  DEFAULT_STREAM_RESILIENCE_CONFIG,
  globalToolCallGuard,
  StreamMonitor,
  type StreamConnectionEvent,
  type StreamResilienceConfig,
} from './cli/streamResilience';

enum StreamProcessingStatus {
  Completed,
  UserCancelled,
  Error,
  HeartbeatTimeout,
  ConnectionLost,
}

/**
 * Strip Gemini built-in code_execution tool-use blocks from content text.
 * These blocks appear when the model uses its native code execution capability
 * and look like: `code_execution {"code":"import os; print(os.getcwd())"}`.
 * They are internal tool calls not meant for end-user display.
 */
const CODE_EXECUTION_LINE_RE = /^code_execution\s+\{.*\}$/gm;
const CODE_EXECUTION_RESULT_RE = /^code_execution_result\s+\{.*\}$/gm;

export function stripCodeExecutionBlocks(text: string): string {
  return text
    .replace(CODE_EXECUTION_LINE_RE, '')
    .replace(CODE_EXECUTION_RESULT_RE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Stream monitor configuration
export interface StreamMonitorOptions {
  config?: Partial<StreamResilienceConfig>;
  onConnectionEvent?: (event: StreamConnectionEvent) => void;
}

/**
 * Get file extension from MIME type (e.g., 'image/png' -> '.png')
 */
function getExtensionFromMimeType(mimeType: string): string {
  // Extract subtype from MIME type (e.g., 'image/png' -> 'png')
  const subtype = mimeType.split('/')[1]?.toLowerCase();
  if (subtype && MIME_TO_EXT_MAP[subtype]) {
    return MIME_TO_EXT_MAP[subtype];
  }
  return DEFAULT_IMAGE_EXTENSION;
}

/**
 * Save inline image data to a file and return the file path
 */
async function saveInlineImage(mimeType: string, base64Data: string, workingDir: string): Promise<string> {
  const ext = getExtensionFromMimeType(mimeType);
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = `gemini-img-${uniqueSuffix}${ext}`;
  const filePath = path.join(workingDir, fileName);

  const imageBuffer = Buffer.from(base64Data, 'base64');
  await fs.promises.writeFile(filePath, imageBuffer);

  return filePath;
}

/**
 * Process Gemini stream events with resilience monitoring
 *
 * @param stream - original stream
 * @param config - config object
 * @param onStreamEvent - event callback
 * @param monitorOptions - stream monitor options (optional)
 */
export const processGeminiStreamEvents = async (
  stream: AsyncIterable<ServerGeminiStreamEvent>,
  config: Config,
  onStreamEvent: (event: { type: ServerGeminiStreamEvent['type']; data: unknown }) => void,
  monitorOptions?: StreamMonitorOptions
): Promise<StreamProcessingStatus> => {
  // Create the stream monitor
  const monitorConfig = { ...DEFAULT_STREAM_RESILIENCE_CONFIG, ...monitorOptions?.config };
  const monitor = new StreamMonitor(monitorConfig, (event) => {
    // Handle connection-state changes
    if (event.type === 'state_change') {
      console.debug(`[StreamMonitor] State changed to: ${event.state}`, event.reason || '');
    } else if (event.type === 'heartbeat_timeout') {
      console.warn(`[StreamMonitor] Heartbeat timeout detected, last event: ${event.lastEventTime}`);
    }
    // Forward to the external listener
    monitorOptions?.onConnectionEvent?.(event);
  });

  monitor.start();

  try {
    for await (const event of stream) {
      // Record received event and update heartbeat time
      monitor.recordEvent();

      // Check whether the heartbeat has timed out (no data for a long time)
      if (monitor.isHeartbeatTimeout()) {
        console.warn('[StreamMonitor] Stream heartbeat timeout, connection may be stale');
        // Do not interrupt immediately; let the upper layer decide
      }

      switch (event.type) {
        case ServerGeminiEventType.Thought:
          onStreamEvent({ type: event.type, data: (event as unknown as { value: unknown }).value });
          break;
        case ServerGeminiEventType.Content:
          {
            // Extract content value
            const contentValue = (event as unknown as { value: unknown }).value;
            const contentText = typeof contentValue === 'string' ? contentValue : '';

            // Check if content contains <think> or <thinking> tags (common in proxy services like newapi)
            // Also detect orphaned closing tags from models like MiniMax M2.5 that omit opening <think>
            const thinkTagRegex = /<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>/gi;
            const hasThinkTags = /<\/?think(?:ing)?>/i.test(contentText);

            let processedContent = contentText;

            if (hasThinkTags) {
              // Extract thinking content from complete blocks and emit as thought events
              const thinkMatches = contentText.matchAll(thinkTagRegex);
              for (const match of thinkMatches) {
                const thinkContent = match[1]?.trim();
                if (thinkContent) {
                  onStreamEvent({
                    type: ServerGeminiEventType.Thought,
                    data: thinkContent,
                  });
                }
              }

              // Remove complete think blocks from content, but preserve orphaned </think> tags.
              // In streaming mode, thinking content from earlier chunks (without tags) is already
              // accumulated in the frontend. Only the chunk containing </think> has the tag.
              // By preserving it, the frontend can detect </think> in the accumulated content
              // and strip all preceding thinking content via stripThinkTags.
              processedContent = contentText
                .replace(/<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>/gi, '')
                // Keep orphaned </think> for frontend accumulated content filtering
                // Also remove unclosed opening tags at the end
                .replace(/<think(?:ing)?>[\s\S]*$/gi, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            }

            // Strip Gemini built-in code_execution tool-use blocks from content.
            // These appear as lines like: code_execution {"code":"import os; ..."}
            // They are internal tool calls and should not be shown to end users,
            // especially in channel adapters (WeChat, DingTalk, etc.).
            if (processedContent.includes('code_execution')) {
              processedContent = stripCodeExecutionBlocks(processedContent);
            }

            if (processedContent) {
              onStreamEvent({ type: event.type, data: processedContent });
            }
          }
          break;
        // InlineData: Handle inline image data from image generation models (e.g., gemini-3-pro-image)
        // (using a string literal to remain compatible with older versions of aioncli-core)
        case 'inline_data' as ServerGeminiEventType:
          {
            const inlineData = (event as unknown as { value: { mimeType: string; data: string } }).value;
            if (inlineData?.mimeType && inlineData?.data) {
              try {
                const workingDir = config.getWorkingDir();
                const imagePath = await saveInlineImage(inlineData.mimeType, inlineData.data, workingDir);
                const relativePath = path.relative(workingDir, imagePath);
                // Emit as content with markdown image format for display
                onStreamEvent({
                  type: ServerGeminiEventType.Content,
                  data: `![Generated Image](${relativePath})`,
                });
              } catch (error) {
                console.error('[InlineData] Failed to save image:', error);
                onStreamEvent({
                  type: ServerGeminiEventType.Error,
                  data: `Failed to save generated image: ${error instanceof Error ? error.message : String(error)}`,
                });
              }
            }
          }
          break;
        case ServerGeminiEventType.ToolCallRequest:
          onStreamEvent({ type: event.type, data: (event as unknown as { value: unknown }).value });
          break;

        case ServerGeminiEventType.Error:
          {
            // Safely extract error value - event.value may be string, object with .error, or undefined
            const errorEvent = event as unknown as { value?: { error?: unknown } | unknown };
            const errorValue =
              (errorEvent.value as { error?: unknown })?.error ?? errorEvent.value ?? 'Unknown error occurred';
            onStreamEvent({
              type: event.type,
              data: parseAndFormatApiError(errorValue, config.getContentGeneratorConfig().authType),
            });
          }
          break;
        case ServerGeminiEventType.Finished:
          {
            // Forward the Finished event including token usage stats
            onStreamEvent({ type: event.type, data: (event as unknown as { value: unknown }).value });
          }
          break;
        case ServerGeminiEventType.ContextWindowWillOverflow:
          {
            // Handle context window overflow - extract token counts for user-friendly message
            const overflowEvent = event as {
              type: string;
              value: { estimatedRequestTokenCount: number; remainingTokenCount: number };
            };
            const estimated = overflowEvent.value?.estimatedRequestTokenCount || 0;
            const remaining = overflowEvent.value?.remainingTokenCount || 0;
            const estimatedK = Math.round(estimated / 1000);
            const remainingK = Math.round(remaining / 1000);

            onStreamEvent({
              type: ServerGeminiEventType.Error,
              data: `Context window overflow: Request size (${estimatedK}K tokens) exceeds model capacity (${remainingK}K tokens). Try: 1) Start a new conversation, 2) Reduce workspace files, 3) Clear conversation history, or 4) Use smaller files.`,
            });
          }
          break;
        case ServerGeminiEventType.AgentExecutionStopped: {
          const reason = (event as { value?: { reason?: string } }).value?.reason;
          onStreamEvent({
            type: ServerGeminiEventType.Error,
            data: `Agent execution stopped${reason ? `: ${reason}` : ''}.`,
          });
          break;
        }
        case ServerGeminiEventType.AgentExecutionBlocked: {
          const reason = (event as { value?: { reason?: string } }).value?.reason;
          onStreamEvent({
            type: ServerGeminiEventType.Error,
            data: `Agent execution blocked${reason ? `: ${reason}` : ''}.`,
          });
          break;
        }
        case ServerGeminiEventType.Retry:
          // Library-internal retry signal (aioncli-core decides to re-issue the request).
          // The retry happens transparently inside @office-ai/aioncli-core - by the time
          // this event reaches us, the second attempt is already in flight. Surfacing it
          // to the renderer as an error misled users into thinking the request had failed;
          // it had not. Log for diagnostics, do not propagate.
          console.log('[GeminiStream] aioncli-core retrying (transient)');
          break;
        case ServerGeminiEventType.InvalidStream:
          // Same situation as Retry: aioncli-core's `streamWithRetries` + client.js
          // "Please continue." mechanism handles invalid-stream recovery internally
          // (validated at @office-ai/aioncli-core/dist/src/core/client.js:486-528).
          // We previously re-emitted this as a `type: 'error'` event, which surfaced
          // a scary red "Invalid response stream detected. Retrying..." warning even
          // though the library was successfully recovering on its own. If retries are
          // ultimately exhausted, the final turn will fail through the normal error
          // path; we don't need to flag the intermediate retries.
          console.log('[GeminiStream] aioncli-core invalid-stream (internal retry will run)');
          break;
        case ServerGeminiEventType.ChatCompressed:
        case ServerGeminiEventType.UserCancelled:
        case ServerGeminiEventType.ToolCallConfirmation:
        case ServerGeminiEventType.ToolCallResponse:
        case ServerGeminiEventType.MaxSessionTurns:
        case ServerGeminiEventType.LoopDetected:
        case ServerGeminiEventType.ModelInfo:
          // These event types are handled silently or are informational only
          // ModelInfo: Contains the model name being used (e.g., 'gemini-3-pro-image')
          break;
        default: {
          // Some event types may not be handled yet
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const _unhandled: any = event;
          console.warn('Unhandled event type:', _unhandled);
          break;
        }
      }
    }

    // Stream ended normally
    monitor.stop();
    return StreamProcessingStatus.Completed;
  } catch (error) {
    // Stream processing failed
    const errorMessage = error instanceof Error ? error.message : String(error);
    monitor.markFailed(errorMessage);

    // Check whether this is a connection-related error
    if (
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('socket hang up')
    ) {
      console.error('[StreamMonitor] Connection error detected:', errorMessage);
      return StreamProcessingStatus.ConnectionLost;
    }

    // Re-throw all other errors
    throw error;
  } finally {
    // Make sure the monitor is stopped
    monitor.stop();
  }
};

/**
 * Normalize tool parameter names - some models may return different param names
 * that must be mapped to the standard names expected by the tool.
 */
const normalizeToolParams = (toolName: string, args: Record<string, unknown>): Record<string, unknown> => {
  const normalized = { ...args };

  // Strip leading "@" for file references (users often write @file.ext)
  if (typeof normalized.file_path === 'string' && normalized.file_path.startsWith('@')) {
    normalized.file_path = normalized.file_path.slice(1);
  }
  if (typeof normalized.path === 'string' && normalized.path.startsWith('@')) {
    normalized.path = normalized.path.slice(1);
  }

  // File operation tools: map 'path' to 'file_path'
  const fileTools = ['ReadFileTool', 'WriteFileTool', 'EditTool', 'read_file', 'write_file', 'edit'];
  if (fileTools.includes(toolName) && 'path' in normalized && !('file_path' in normalized)) {
    normalized.file_path = normalized.path;
    delete normalized.path;
  }

  // Directory-related tools: normalize legacy keys (path/directory) to dir_path
  const dirPathTools = ['list_directory', 'glob', 'search_file_content', 'run_shell_command'];
  if (dirPathTools.includes(toolName)) {
    const dirLikeKeys = ['dir_path', 'path', 'directory_path', 'directory', 'dir', 'folder_path', 'folder'];
    for (const key of dirLikeKeys) {
      if (key in normalized && typeof normalized[key] === 'string' && normalized[key]) {
        if (!('dir_path' in normalized) && key !== 'dir_path') {
          normalized.dir_path = normalized[key];
        }
        if (key !== 'dir_path') {
          delete normalized[key];
        }
      }
    }

    // aioncli-core now requires dir_path; default to workspace root when missing
    if (
      toolName === 'list_directory' &&
      (typeof normalized.dir_path !== 'string' || normalized.dir_path.length === 0)
    ) {
      normalized.dir_path = '.';
    }
  }

  return normalized;
};

export const processGeminiFunctionCalls = async (
  config: Config,
  functionCalls: ToolCallRequestInfo[],
  onProgress: (event: {
    type: 'tool_call_request' | 'tool_call_response' | 'tool_call_error' | 'tool_call_finish';
    data: unknown;
  }) => Promise<void>
) => {
  const toolResponseParts = [];

  for (const fc of functionCalls) {
    const callId = fc.callId ?? `${fc.name}-${Date.now()}`;
    // Normalize parameter names
    const normalizedArgs = normalizeToolParams(fc.name, fc.args ?? {});
    const requestInfo = {
      callId,
      name: fc.name,
      args: normalizedArgs,
      isClientInitiated: false,
      prompt_id: fc.prompt_id,
    };
    await onProgress({
      type: 'tool_call_request',
      data: requestInfo,
    });
    const abortController = new AbortController();

    const toolResponse = await executeToolCall(config, requestInfo, abortController.signal);
    if (toolResponse?.response?.error) {
      await onProgress({
        type: 'tool_call_error',
        data: Object.assign({}, requestInfo, {
          status: 'error',
          error: `Error executing tool ${fc.name}: ${toolResponse.response.resultDisplay || toolResponse.response.error.message}`,
        }),
      });
      return;
    }
    await onProgress({
      type: 'tool_call_finish',
      data: Object.assign({}, requestInfo, {
        status: 'success',
      }),
    });

    if (toolResponse.response?.responseParts) {
      const parts = Array.isArray(toolResponse.response.responseParts)
        ? toolResponse.response.responseParts
        : [toolResponse.response.responseParts];
      for (const part of parts) {
        if (typeof part === 'string') {
          toolResponseParts.push({ text: part });
        } else if (part) {
          toolResponseParts.push(part);
        }
      }
    }
  }
  await onProgress({
    type: 'tool_call_finish',
    data: toolResponseParts,
  });
};

/**
 * Handle completed tool calls with protection mechanism
 *
 * Notes:
 * 1. Uses globalToolCallGuard to protect tool calls that are still executing
 * 2. Protected tool calls will not be misclassified as cancelled
 * 3. Protection is removed automatically once the tool completes
 */
export const handleCompletedTools = (
  completedToolCallsFromScheduler: CompletedToolCall[],
  geminiClient: GeminiClient | null,
  performMemoryRefresh: () => void
) => {
  const completedAndReadyToSubmitTools = completedToolCallsFromScheduler.filter((tc) => {
    const isTerminalState = tc.status === 'success' || tc.status === 'error' || tc.status === 'cancelled';
    if (isTerminalState) {
      const completedOrCancelledCall = tc;
      // Mark tool as complete, remove protection
      if (tc.status === 'success' || tc.status === 'error') {
        globalToolCallGuard.complete(tc.request.callId);
      }
      return completedOrCancelledCall.response?.responseParts !== undefined;
    }
    return false;
  });
  // Finalize any client-initiated tools as soon as they are done.
  const clientTools = completedAndReadyToSubmitTools.filter((t) => t.request.isClientInitiated);
  if (clientTools.length > 0) {
    // markToolsAsSubmitted(clientTools.map((t) => t.request.callId)); responseSubmittedToGemini=true
  }
  // Identify new, successful save_memory calls that we haven't processed yet.
  const newSuccessfulMemorySaves = completedAndReadyToSubmitTools.filter(
    (t) => t.request.name === 'save_memory' && t.status === 'success'
    // !processedMemoryToolsRef.current.has(t.request.callId)
  );
  if (newSuccessfulMemorySaves.length > 0) {
    // Perform the refresh only if there are new ones.
    void performMemoryRefresh();
    // Mark them as processed so we don't do this again on the next render.
    // newSuccessfulMemorySaves.forEach((t) =>
    //   processedMemoryToolsRef.current.add(t.request.callId)
    // );
  }
  const geminiTools = completedAndReadyToSubmitTools.filter((t) => !t.request.isClientInitiated);
  if (geminiTools.length === 0) {
    return;
  }

  // Check if all tools were cancelled (excluding protected tools)
  const allToolsCancelled = geminiTools.every((tc) => {
    // If tool is still protected, don't consider it cancelled
    if (globalToolCallGuard.isProtected(tc.request.callId)) {
      console.debug(`[ToolCallGuard] Tool ${tc.request.callId} is protected, not treating as cancelled`);
      return false;
    }
    return tc.status === 'cancelled';
  });
  if (allToolsCancelled) {
    if (geminiClient) {
      // We need to manually add the function responses to the history
      // so the model knows the tools were cancelled.
      const responsesToAdd = geminiTools.flatMap((toolCall) => toolCall.response.responseParts);
      for (const response of responsesToAdd) {
        let parts;
        if (Array.isArray(response)) {
          parts = response;
        } else if (typeof response === 'string') {
          parts = [{ text: response }];
        } else {
          parts = [response];
        }
        void geminiClient.addHistory({
          role: 'user',
          parts,
        });
      }
    }
    // const callIdsToMarkAsSubmitted = geminiTools.map(
    //   (toolCall) => toolCall.request.callId
    // );
    // markToolsAsSubmitted(callIdsToMarkAsSubmitted);
    return;
  }
  const responsesToSend = geminiTools.map((toolCall) => toolCall.response.responseParts);
  // const callIdsToMarkAsSubmitted = geminiTools.map(
  //   (toolCall) => toolCall.request.callId
  // );
  // markToolsAsSubmitted(callIdsToMarkAsSubmitted);

  function mergePartListUnions(list: unknown[]): unknown[] {
    const resultParts: unknown[] = [];
    for (const item of list) {
      if (Array.isArray(item)) {
        resultParts.push(...item);
      } else {
        resultParts.push(item);
      }
    }
    return resultParts;
  }
  return mergePartListUnions(responsesToSend);
};

// Maximum character length for a single functionResponse text part kept in history.
// Responses exceeding this will be truncated to reduce context window usage.
const COMPACT_TEXT_THRESHOLD = 10000;
// How many characters to keep when truncating a large functionResponse text.
const COMPACT_TEXT_KEEP = 2000;

/**
 * Compact large tool call responses (functionResponse) already stored in
 * the chat history to prevent context window overflow.
 *
 * After the agentic loop finishes (model has responded with text, no more
 * pending tool calls), we walk through the history and:
 *   1. Replace inlineData (base64 images/audio/pdf) with a lightweight
 *      text placeholder - the binary blob is the main source of bloat.
 *   2. Truncate very long text functionResponse parts, keeping only the
 *      head so the model still has partial context.
 *
 * The functionCall ↔ functionResponse pairing is preserved so the Gemini
 * API will not reject the history.
 */
export function compactToolResponsesInHistory(geminiClient: GeminiClient): void {
  if (!geminiClient.isInitialized()) return;

  const history = geminiClient.getHistory();
  let modified = false;

  for (const content of history) {
    if (content.role !== 'user' || !content.parts) continue;

    for (let i = 0; i < content.parts.length; i++) {
      const part = content.parts[i] as Record<string, unknown>;
      if (!('functionResponse' in part) || !part.functionResponse) continue;

      const fnResp = part.functionResponse as Record<string, unknown>;
      const resp = fnResp.response as Record<string, unknown> | string | undefined;
      if (!resp) continue;

      // Case 1: response itself contains inlineData (image/pdf/audio base64)
      if (typeof resp === 'object' && resp !== null) {
        if ('inlineData' in resp) {
          const inlineData = resp.inlineData as { mimeType?: string };
          const mimeType = inlineData?.mimeType || 'unknown';
          fnResp.response = {
            output: `[File content was read: ${mimeType}. Binary data removed from history to save context. Use read_file tool to re-read if needed.]`,
          };
          modified = true;
          continue;
        }

        // Case 2: response.output is a very long string
        if ('output' in resp && typeof resp.output === 'string' && resp.output.length > COMPACT_TEXT_THRESHOLD) {
          resp.output =
            resp.output.slice(0, COMPACT_TEXT_KEEP) +
            `\n\n... [${resp.output.length - COMPACT_TEXT_KEEP} characters truncated from history. Use read_file tool to re-read if needed.]`;
          modified = true;
          continue;
        }
      }

      // Case 3: response is a raw string (some tool results)
      if (typeof resp === 'string' && resp.length > COMPACT_TEXT_THRESHOLD) {
        fnResp.response = {
          output:
            resp.slice(0, COMPACT_TEXT_KEEP) +
            `\n\n... [${resp.length - COMPACT_TEXT_KEEP} characters truncated from history. Use read_file tool to re-read if needed.]`,
        };
        modified = true;
        continue;
      }

      // Case 4: response contains an array (llmContent from read_many_files etc.)
      // Walk nested parts looking for inlineData or long strings
      if (typeof resp === 'object' && resp !== null) {
        for (const [key, value] of Object.entries(resp)) {
          if (Array.isArray(value)) {
            for (let j = 0; j < value.length; j++) {
              const item = value[j];
              // Nested inlineData
              if (item && typeof item === 'object' && 'inlineData' in item) {
                const mimeType = (item.inlineData as { mimeType?: string })?.mimeType || 'unknown';
                value[j] = {
                  text: `[File content was read: ${mimeType}. Binary data removed from history to save context.]`,
                };
                modified = true;
              }
              // Nested long string
              if (typeof item === 'string' && item.length > COMPACT_TEXT_THRESHOLD) {
                value[j] =
                  item.slice(0, COMPACT_TEXT_KEEP) +
                  `\n\n... [${item.length - COMPACT_TEXT_KEEP} characters truncated from history.]`;
                modified = true;
              }
            }
            // Also check if the array-valued field itself is a large string
          } else if (typeof value === 'string' && value.length > COMPACT_TEXT_THRESHOLD) {
            (resp as Record<string, unknown>)[key] =
              value.slice(0, COMPACT_TEXT_KEEP) +
              `\n\n... [${value.length - COMPACT_TEXT_KEEP} characters truncated from history.]`;
            modified = true;
          }
        }
      }
    }
  }

  if (modified) {
    geminiClient.setHistory(history);
    console.log('[GeminiAgent] Compacted large tool responses in history to reduce context window usage');
  }
}

let promptCount = 0;

export const startNewPrompt = () => {
  promptCount++;
};

export const getPromptCount = () => {
  return promptCount;
};
