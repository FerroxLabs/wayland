/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #457 True Continue - resume-seed transcript builder.
 *
 * When the engine process is rebuilt (`--resume`), its own history restore is
 * unreliable, so we replay recent persisted history over the `init_history`
 * channel. The previous implementation replayed ONLY the last 20 text messages
 * (4000-char cap), silently dropping every tool call and file edit - so a
 * resumed session lost the in-progress work and the model restarted from
 * scratch. This builder includes `tool_call` and `tool_group` (file-edit)
 * entries so the rebuilt session retains what was already done.
 */

import type { IMessageToolGroup, TMessage } from '@/common/chat/chatLib';

const DEFAULT_MAX_CHARS = 8000;
const DEFAULT_MAX_MESSAGES = 60;

type ToolGroupItem = IMessageToolGroup['content'][number];

/** Pull an edited file path off a tool-group item (result diff or edit confirmation). */
function extractEditedFile(item: ToolGroupItem): string | undefined {
  const rd = item.resultDisplay;
  if (rd && typeof rd === 'object' && 'fileName' in rd) return rd.fileName;
  const cd = item.confirmationDetails;
  if (cd && cd.type === 'edit') return cd.fileName;
  return undefined;
}

/** Format one persisted message as a compact transcript line, or null to skip. */
function formatSeedLine(message: TMessage): string | null {
  switch (message.type) {
    case 'text': {
      const content = typeof message.content?.content === 'string' ? message.content.content.trim() : '';
      if (!content) return null;
      return `${message.position === 'right' ? 'User' : 'Assistant'}: ${content}`;
    }
    case 'tool_call': {
      const name = message.content?.name ?? 'tool';
      const status = message.content?.status ? ` (${message.content.status})` : '';
      return `[tool ${name}${status}]`;
    }
    case 'tool_group': {
      const items = Array.isArray(message.content) ? message.content : [];
      const parts = items.map((item) => {
        const file = extractEditedFile(item);
        return `${item.name}${file ? ` -> ${file}` : ''} (${item.status})`;
      });
      return parts.length ? `[tools ${parts.join('; ')}]` : null;
    }
    default:
      return null;
  }
}

/**
 * Build the transcript text replayed over `init_history` on resume. Includes
 * tool/file-edit history so a rebuilt engine session retains in-progress work.
 * Keeps the most recent tail within the char budget.
 */
export function buildResumeSeedTranscript(
  messages: TMessage[],
  opts: { maxChars?: number; maxMessages?: number } = {}
): string {
  const maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS;
  const maxMessages = opts.maxMessages ?? DEFAULT_MAX_MESSAGES;
  const recent = messages.slice(-maxMessages);
  const lines: string[] = [];
  for (const message of recent) {
    const line = formatSeedLine(message);
    if (line) lines.push(line);
  }
  return lines.join('\n').slice(-maxChars);
}
