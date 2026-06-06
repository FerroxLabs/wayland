/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import type { PreviewContentType } from '@/common/types/preview';
import { uuid } from '@/common/utils';

/**
 * Navigation tools that should be intercepted for preview
 */
export const NAVIGATION_TOOLS = ['navigate_page', 'new_page'] as const;
export type NavigationToolName = (typeof NAVIGATION_TOOLS)[number];

/**
 * Chrome DevTools MCP server identifiers
 */
export const CHROME_DEVTOOLS_IDENTIFIERS = ['chrome-devtools', 'chrome_devtools', 'chromedevtools'] as const;

/**
 * Common MCP prefixes to strip when normalizing tool names
 */
export const MCP_PREFIXES = ['mcp__chrome-devtools__', 'chrome-devtools__', 'chrome-devtools.'] as const;

/**
 * Preview open event data structure
 */
export interface PreviewOpenData {
  content: string;
  contentType: PreviewContentType;
  metadata?: {
    title?: string;
  };
}

/**
 * Navigation tool data that can come from different agent formats
 */
export interface NavigationToolData {
  // Tool identification
  toolName?: string;
  server?: string;
  // URL sources (try in order)
  url?: string;
  arguments?: Record<string, unknown>;
  rawInput?: Record<string, unknown>;
  content?: Array<{ type?: string; content?: { type?: string; text?: string }; text?: string }>;
  title?: string;
}

/**
 * Interception result indicating what action was taken
 */
export interface InterceptionResult {
  intercepted: boolean;
  url?: string;
  previewMessage?: IResponseMessage;
}

/**
 * Unified Navigation Interceptor for all agents
 */
export class NavigationInterceptor {
  /**
   * Normalize tool name by stripping MCP prefixes and suffixes
   */
  static normalizeToolName(toolName: string): string {
    if (!toolName) return '';

    let normalized = toolName;

    // Remove known prefixes
    for (const prefix of MCP_PREFIXES) {
      if (normalized.startsWith(prefix)) {
        normalized = normalized.slice(prefix.length);
        break;
      }
    }

    // Handle double underscore format (e.g., "mcp__server__tool")
    if (normalized.includes('__')) {
      normalized = normalized.split('__').pop() || normalized;
    }

    // Remove trailing parentheses like "(chrome-devtools MCP Server)"
    normalized = normalized.replace(/\s*\([^)]*\)\s*$/, '').trim();

    return normalized.toLowerCase();
  }

  /**
   * Check if a string contains chrome-devtools identifier
   */
  static isChromeDevToolsIdentifier(str: string): boolean {
    if (!str) return false;
    const lower = str.toLowerCase();
    return CHROME_DEVTOOLS_IDENTIFIERS.some((id) => lower.includes(id));
  }

  /**
   * Check if a tool is a chrome-devtools navigation tool
   *
   * Handles various formats:
   * - "navigate_page"
   * - "mcp__chrome-devtools__navigate_page"
   * - "navigate_page (chrome-devtools MCP Server)"
   * - { server: "chrome-devtools", tool: "navigate_page" }
   */
  static isNavigationTool(data: NavigationToolData | string): boolean {
    if (typeof data === 'string') {
      // Simple string check
      const toolName = data;
      const isChromeDevTools = this.isChromeDevToolsIdentifier(toolName);
      const baseName = this.normalizeToolName(toolName);
      const isNavTool = NAVIGATION_TOOLS.includes(baseName as NavigationToolName);
      return isChromeDevTools && isNavTool;
    }

    // Object-based check
    const { toolName = '', server = '' } = data;
    const fullName = toolName || '';

    // Check server field
    const serverIsChromeDevTools = this.isChromeDevToolsIdentifier(server);
    // Check tool name for chrome-devtools reference
    const toolNameIsChromeDevTools = this.isChromeDevToolsIdentifier(fullName);

    const isChromeDevTools = serverIsChromeDevTools || toolNameIsChromeDevTools;

    // Normalize and check if it's a navigation tool
    const baseName = this.normalizeToolName(fullName);
    const isNavTool = NAVIGATION_TOOLS.includes(baseName as NavigationToolName);

    return isChromeDevTools && isNavTool;
  }

  /**
   * Extract URL from navigation tool data
   *
   * Tries multiple sources in order:
   * 1. Direct url field
   * 2. arguments.url
   * 3. rawInput.url
   * 4. URL pattern in content text
   * 5. URL pattern in title
   */
  static extractUrl(data: NavigationToolData): string | null {
    // 1. Direct url field
    if (data.url && typeof data.url === 'string') {
      return data.url;
    }

    // 2. Check arguments (common MCP format)
    if (data.arguments) {
      const url = this.extractUrlFromObject(data.arguments);
      if (url) return url;
    }

    // 3. Check rawInput (ACP format)
    if (data.rawInput) {
      const url = this.extractUrlFromObject(data.rawInput);
      if (url) return url;
    }

    // 4. Check content array for URL pattern
    if (data.content && Array.isArray(data.content)) {
      for (const item of data.content) {
        const text = item.text || item.content?.text || '';
        if (text) {
          const urlMatch = text.match(/https?:\/\/[^\s<>"]+/i);
          if (urlMatch) {
            return urlMatch[0];
          }
        }
      }
    }

    // 5. Check title for URL pattern
    if (data.title) {
      const urlMatch = data.title.match(/https?:\/\/[^\s<>"]+/i);
      if (urlMatch) {
        return urlMatch[0];
      }
    }

    return null;
  }

  /**
   * Extract URL from an object with common URL field names
   */
  private static extractUrlFromObject(obj: Record<string, unknown>): string | null {
    const urlFields = ['url', 'URL', 'uri', 'URI', 'href', 'target'];

    for (const field of urlFields) {
      const value = obj[field];
      if (value && typeof value === 'string') {
        // Validate it looks like a URL
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
      }
    }

    return null;
  }

  /**
   * Create a preview_open response message
   */
  static createPreviewMessage(url: string, conversationId: string, title?: string): IResponseMessage {
    return {
      type: 'preview_open',
      conversation_id: conversationId,
      msg_id: uuid(),
      data: {
        content: url,
        contentType: 'url' as PreviewContentType,
        metadata: {
          title: title || `Browser: ${url}`,
        },
      },
    };
  }

  /**
   * Attempt to intercept navigation tool and create preview message
   *
   * @returns InterceptionResult with intercepted status and optional preview message
   */
  static intercept(data: NavigationToolData, conversationId: string): InterceptionResult {
    if (!this.isNavigationTool(data)) {
      return { intercepted: false };
    }

    const url = this.extractUrl(data);
    if (!url) {
      return { intercepted: false };
    }

    const previewMessage = this.createPreviewMessage(url, conversationId);

    return {
      intercepted: true,
      url,
      previewMessage,
    };
  }
}

// Re-export for convenience
export { NavigationInterceptor as default };
