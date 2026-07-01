/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';

const DEFAULT_MAX_MESSAGES = 20;
const DEFAULT_MAX_CHARS = 4000;
const DEFAULT_PER_ENTRY_CHAR_LIMIT = 500;

export type WCoreResumeReplayOptions = {
  maxMessages?: number;
  maxChars?: number;
  perEntryCharLimit?: number;
};

export type WCoreResumeReplayStats = {
  inputMessages: number;
  replayedMessages: number;
  omittedMessages: number;
  replayedToolEvents: number;
  replayedFileEvents: number;
  outputChars: number;
  truncated: boolean;
};

export type WCoreResumeReplayResult = {
  text: string;
  stats: WCoreResumeReplayStats;
};

/**
 * Build a budgeted, textual WCore resume replay block from persisted messages.
 * The returned text is intended for `WCoreAgent.injectConversationHistory`.
 */
export function buildWCoreResumeReplayContext(
  messages: TMessage[],
  options?: WCoreResumeReplayOptions
): WCoreResumeReplayResult | null {
  const maxMessages = positiveInt(options?.maxMessages, DEFAULT_MAX_MESSAGES);
  const maxChars = positiveInt(options?.maxChars, DEFAULT_MAX_CHARS);
  const perEntryCharLimit = positiveInt(options?.perEntryCharLimit, DEFAULT_PER_ENTRY_CHAR_LIMIT);

  const recent = messages.slice(-maxMessages);
  const entries = recent.map((message) => formatMessage(message, perEntryCharLimit)).filter((entry) => entry !== null);

  if (entries.length === 0) return null;

  const fitted = fitToBudget(
    entries.map((entry) => entry.line),
    maxChars
  );
  const text = wrapReplayBlock(fitted.lines);
  const replayedLines = new Set(fitted.lines);
  const replayedEntries = entries.filter((entry) => replayedLines.has(entry.line));

  return {
    text,
    stats: {
      inputMessages: messages.length,
      replayedMessages: replayedEntries.length,
      omittedMessages: messages.length - replayedEntries.length,
      replayedToolEvents: replayedEntries.reduce((total, entry) => total + entry.toolEvents, 0),
      replayedFileEvents: replayedEntries.reduce((total, entry) => total + entry.fileEvents, 0),
      outputChars: text.length,
      truncated: fitted.truncated || recent.length < messages.length,
    },
  };
}

type ReplayEntry = {
  line: string;
  toolEvents: number;
  fileEvents: number;
};

function formatMessage(message: TMessage, perEntryCharLimit: number): ReplayEntry | null {
  switch (message.type) {
    case 'text': {
      const content = clip(message.content.content, perEntryCharLimit);
      if (!content) return null;
      const role = message.position === 'right' ? 'user' : 'assistant';
      return { line: `[${role}]: ${content}`, toolEvents: 0, fileEvents: 0 };
    }

    case 'tool_group': {
      const parts = message.content.map((tool) => {
        const details = formatToolDetails(tool);
        const suffix = details ? `; ${details}` : '';
        return `[assistant tool: ${tool.name} (${tool.status})] ${tool.description}${suffix}`;
      });
      const line = clip(parts.filter(Boolean).join('\n'), perEntryCharLimit);
      if (!line) return null;
      return {
        line,
        toolEvents: message.content.length,
        fileEvents: message.content.filter((tool) => isFileTool(tool)).length,
      };
    }

    case 'tool_call': {
      const args = message.content.args ?? {};
      const argsText = clip(JSON.stringify(args), Math.min(200, perEntryCharLimit));
      const fileRefs = collectFileRefs(args);
      const details = [
        message.content.status ?? 'completed',
        argsText && argsText !== '{}' ? `args: ${argsText}` : '',
        fileRefs.length > 0 ? `files: ${fileRefs.join(', ')}` : '',
      ].filter(Boolean);
      return {
        line: `[assistant tool: ${message.content.name} (${details.join('; ')})]`,
        toolEvents: 1,
        fileEvents: fileRefs.length > 0 ? 1 : 0,
      };
    }

    case 'codex_tool_call': {
      const title = message.content.title ?? message.content.kind;
      const fileRefs = collectFileRefs(message.content);
      const details = [message.content.kind, fileRefs.length > 0 ? `files: ${fileRefs.join(', ')}` : ''].filter(
        Boolean
      );
      const suffix = details.length > 0 ? ` ${details.join('; ')}` : '';
      return {
        line: `[assistant tool: ${title} (${message.content.status})]${suffix}`,
        toolEvents: 1,
        fileEvents: fileRefs.length > 0 ? 1 : 0,
      };
    }

    default:
      return null;
  }
}

type ToolGroupItem = Extract<TMessage, { type: 'tool_group' }>['content'][number];

function formatToolDetails(tool: ToolGroupItem): string {
  const details: string[] = [];
  const confirmation = tool.confirmationDetails;

  if (confirmation?.type === 'edit') {
    details.push(`file: ${confirmation.fileName}`);
  } else if (confirmation?.type === 'exec') {
    details.push(`command: ${confirmation.rootCommand}`);
  } else if (confirmation?.type === 'mcp') {
    details.push(`mcp: ${confirmation.serverName}/${confirmation.toolName}`);
  }

  if (tool.resultDisplay && typeof tool.resultDisplay === 'object') {
    if ('fileName' in tool.resultDisplay) {
      details.push(`result file: ${tool.resultDisplay.fileName}`);
    } else if ('relative_path' in tool.resultDisplay) {
      details.push(`result file: ${tool.resultDisplay.relative_path}`);
    }
  }

  return details.join('; ');
}

function isFileTool(tool: ToolGroupItem): boolean {
  if (tool.confirmationDetails?.type === 'edit') return true;
  if (!tool.resultDisplay || typeof tool.resultDisplay !== 'object') return false;
  return 'fileName' in tool.resultDisplay || 'relative_path' in tool.resultDisplay;
}

function collectFileRefs(value: unknown): string[] {
  const refs = new Set<string>();
  collectFileRefsInto(value, refs);
  return [...refs];
}

function collectFileRefsInto(value: unknown, refs: Set<string>): void {
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) collectFileRefsInto(item, refs);
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' && isFileRefKey(key)) {
      refs.add(item);
      continue;
    }
    collectFileRefsInto(item, refs);
  }
}

function isFileRefKey(key: string): boolean {
  return ['file', 'fileName', 'filename', 'filePath', 'path', 'relative_path'].includes(key);
}

function fitToBudget(lines: string[], maxChars: number): { lines: string[]; truncated: boolean } {
  const wrapped = wrapReplayBlock(lines);
  if (wrapped.length <= maxChars) return { lines, truncated: false };

  const omittedMarker = '[... earlier replay entries omitted ...]';
  const kept: string[] = [];
  let includeMarker = false;

  for (let i = lines.length - 1; i >= 0; i--) {
    const candidate = [lines[i], ...kept];
    const candidateWithMarker = i > 0 ? [omittedMarker, ...candidate] : candidate;

    if (wrapReplayBlock(candidateWithMarker).length <= maxChars) {
      includeMarker = i > 0;
      kept.unshift(lines[i]);
      continue;
    }

    if (wrapReplayBlock(candidate).length > maxChars) break;
    includeMarker = false;
    kept.unshift(lines[i]);
  }

  return { lines: includeMarker ? [omittedMarker, ...kept] : kept, truncated: true };
}

function wrapReplayBlock(lines: string[]): string {
  return [
    '[BEGIN WCORE RESUME REPLAY - historical context only; do not repeat tool calls]',
    ...lines,
    '[END WCORE RESUME REPLAY]',
    '',
  ].join('\n');
}

function clip(value: string | undefined | null, maxChars: number): string {
  if (!value) return '';
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function positiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}
