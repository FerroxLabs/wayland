/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import {
  NavigationInterceptor,
  NAVIGATION_TOOLS,
  type PreviewOpenData,
  type NavigationToolData,
  type NavigationToolName,
} from '@/common/chat/navigation';

// Re-export from NavigationInterceptor for backward compatibility
export { NAVIGATION_TOOLS, type NavigationToolName, type PreviewOpenData, type NavigationToolData };

/**
 * Handles preview_open events by emitting to the IPC bridge
 *
 * @param message - The response message containing preview_open data
 * @returns true if the event was handled, false otherwise
 */
export function handlePreviewOpenEvent(message: IResponseMessage | { type: string; data?: unknown }): boolean {
  if (message.type !== 'preview_open') {
    return false;
  }

  const data = message.data as PreviewOpenData | undefined;
  if (!data || !data.content) {
    return false;
  }

  ipcBridge.preview.open.emit(data);
  return true;
}

/**
 * Creates a preview_open response message
 *
 * Delegates to NavigationInterceptor.createPreviewMessage
 */
export function createPreviewOpenMessage(
  url: string,
  conversationId: string,
  msgId: string,
  title?: string
): IResponseMessage {
  const message = NavigationInterceptor.createPreviewMessage(url, conversationId, title);
  message.msg_id = msgId; // Override with provided msgId
  return message;
}

/**
 * Checks if a tool name is a navigation tool from chrome-devtools
 *
 * Delegates to NavigationInterceptor.isNavigationTool
 */
export function isNavigationTool(toolName: string, serverName?: string): boolean {
  return NavigationInterceptor.isNavigationTool({
    toolName,
    server: serverName,
  });
}

/**
 * Extracts URL from navigation tool arguments
 *
 * Delegates to NavigationInterceptor.extractUrl
 */
export function extractNavigationUrl(args: Record<string, unknown> | undefined): string | null {
  if (!args) return null;
  return NavigationInterceptor.extractUrl({ arguments: args });
}
