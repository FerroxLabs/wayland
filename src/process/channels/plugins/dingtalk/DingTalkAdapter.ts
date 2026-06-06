/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  IMessageAction,
  IUnifiedIncomingMessage,
  IUnifiedMessageContent,
  IUnifiedOutgoingMessage,
  IUnifiedUser,
} from '../../types';

/**
 * DingTalkAdapter - Converts between DingTalk and Unified message formats
 *
 * Handles:
 * - DingTalk Stream callback data -> UnifiedIncomingMessage
 * - UnifiedOutgoingMessage -> DingTalk send parameters
 * - User info extraction
 * - Card action handling
 */

// ==================== Constants ====================

/**
 * DingTalk message length limit (for markdown messages)
 */
export const DINGTALK_MESSAGE_LIMIT = 4000;

// ==================== Types ====================

/**
 * DingTalk Stream callback message data
 */
export interface DingTalkStreamMessage {
  conversationId?: string;
  atUsers?: Array<{
    dingtalkId?: string;
    staffId?: string;
  }>;
  chatbotCorpId?: string;
  chatbotUserId?: string;
  msgId?: string;
  senderNick?: string;
  isAdmin?: boolean;
  senderStaffId?: string;
  sessionWebhookExpiredTime?: number;
  createAt?: number;
  senderCorpId?: string;
  conversationType?: string; // '1' = private, '2' = group
  msgtype?: string;
  text?: {
    content?: string;
  };
  richText?: {
    richTextList?: Array<{
      text?: string;
      type?: string;
    }>;
  };
  picture?: {
    downloadCode?: string;
    photoURL?: string;
  };
  audio?: {
    downloadCode?: string;
    duration?: string;
    recognition?: string;
  };
  video?: {
    downloadCode?: string;
    duration?: string;
    videoType?: string;
  };
  file?: {
    downloadCode?: string;
    fileName?: string;
    fileSize?: string;
  };
  sessionWebhook?: string;
  robotCode?: string;
}

/**
 * DingTalk card action callback data
 */
export interface DingTalkCardActionData {
  outTrackId?: string;
  userId?: string;
  content?: {
    cardPrivateData?: {
      actionIds?: string[];
      params?: Record<string, string>;
    };
  };
}

// ==================== Incoming Message Conversion ====================

/**
 * Encode chatId based on conversation type
 * Private chat: user:{senderStaffId}
 * Group chat: group:{conversationId}
 */
export function encodeChatId(data: DingTalkStreamMessage): string {
  if (data.conversationType === '1') {
    // Private chat
    return `user:${data.senderStaffId || data.chatbotUserId || ''}`;
  }
  // Group chat
  return `group:${data.conversationId || ''}`;
}

/**
 * Parse encoded chatId into type and id.
 *
 * Expected formats: `user:<staffId>` or `group:<conversationId>`.
 *
 * R16 M3: bare/unprefixed chatIds previously silent-defaulted to 'user' and
 * misrouted as staffIds (a silent corruption when callers passed a malformed
 * id). The R10/R11 pass added a one-time warning; R16 promotes it to a hard
 * throw so the misroute is caught at the call site rather than swallowed.
 * Callers handling user-supplied ids must wrap with try/catch or migrate to
 * the prefixed form via `encodeChatId`.
 */
export function parseChatId(chatId: string): { type: 'user' | 'group'; id: string } {
  if (chatId.startsWith('user:')) {
    return { type: 'user', id: chatId.slice(5) };
  }
  if (chatId.startsWith('group:')) {
    return { type: 'group', id: chatId.slice(6) };
  }
  throw new Error(`parseChatId: unrecognized id format: ${chatId}`);
}

/**
 * Infer conversationType ('1' = private, '2' = group) from a stored
 * openSpaceId. AI Card spaces look like `dtv1.card//IM_ROBOT.<id>` for
 * private chats and `dtv1.card//IM_GROUP.<id>` for groups. (M4 helper.)
 */
export function inferConversationTypeFromSpace(openSpaceId: string | undefined): '1' | '2' {
  if (openSpaceId && openSpaceId.includes('IM_GROUP.')) return '2';
  return '1';
}

/**
 * Convert DingTalk Stream callback data to unified incoming message
 */
export function toUnifiedIncomingMessage(
  data: DingTalkStreamMessage,
  actionInfo?: IMessageAction
): IUnifiedIncomingMessage | null {
  // Handle card action
  if (actionInfo) {
    const userId = data.senderStaffId || '';
    const chatId = encodeChatId(data);

    return {
      id: data.msgId || Date.now().toString(),
      platform: 'dingtalk',
      chatId,
      user: {
        id: userId,
        displayName: data.senderNick || `User ${userId.slice(-6)}`,
      },
      content: {
        type: 'action',
        text: actionInfo.name,
      },
      action: actionInfo,
      timestamp: data.createAt || Date.now(),
      raw: data,
    };
  }

  // Handle regular message
  if (!data.senderStaffId && !data.chatbotUserId) return null;

  const user = toUnifiedUser(data);
  if (!user) return null;

  const content = extractMessageContent(data);
  const chatId = encodeChatId(data);

  return {
    id: data.msgId || Date.now().toString(),
    platform: 'dingtalk',
    chatId,
    user,
    content,
    timestamp: data.createAt || Date.now(),
    raw: data,
  };
}

/**
 * Convert DingTalk sender info to unified user format
 */
export function toUnifiedUser(data: DingTalkStreamMessage): IUnifiedUser | null {
  const userId = data.senderStaffId || '';
  if (!userId) return null;

  return {
    id: userId,
    displayName: data.senderNick || `User ${userId.slice(-6)}`,
  };
}

/**
 * Extract message content from DingTalk message
 */
function extractMessageContent(data: DingTalkStreamMessage): IUnifiedMessageContent {
  const msgtype = data.msgtype;

  switch (msgtype) {
    case 'text': {
      let text = data.text?.content || '';
      // Remove @bot mentions in group chats
      if (data.conversationType === '2') {
        text = text.replace(/@\S+\s*/g, '').trim();
      }
      return { type: 'text', text };
    }

    case 'richText': {
      const textParts = (data.richText?.richTextList || [])
        .filter((item) => item.type === 'text')
        .map((item) => item.text || '');
      let text = textParts.join('');
      if (data.conversationType === '2') {
        text = text.replace(/@\S+\s*/g, '').trim();
      }
      return { type: 'text', text };
    }

    case 'picture':
      return {
        type: 'photo',
        text: '',
        attachments: [
          {
            type: 'photo',
            fileId: data.picture?.downloadCode || '',
          },
        ],
      };

    case 'audio':
      return {
        type: 'audio',
        text: data.audio?.recognition || '',
        attachments: [
          {
            type: 'audio',
            fileId: data.audio?.downloadCode || '',
            duration: data.audio?.duration ? parseInt(data.audio.duration, 10) : undefined,
          },
        ],
      };

    case 'video':
      return {
        type: 'video',
        text: '',
        attachments: [
          {
            type: 'video',
            fileId: data.video?.downloadCode || '',
            duration: data.video?.duration ? parseInt(data.video.duration, 10) : undefined,
          },
        ],
      };

    case 'file':
      return {
        type: 'document',
        text: '',
        attachments: [
          {
            type: 'document',
            fileId: data.file?.downloadCode || '',
            fileName: data.file?.fileName,
            size: data.file?.fileSize ? parseInt(data.file.fileSize, 10) : undefined,
          },
        ],
      };

    default:
      return { type: 'text', text: '' };
  }
}

// ==================== Outgoing Message Conversion ====================

/**
 * DingTalk send content types
 */
export type DingTalkContentType = 'text' | 'markdown' | 'actionCard';

/**
 * Convert unified outgoing message to DingTalk send parameters
 */
export function toDingTalkSendParams(message: IUnifiedOutgoingMessage): {
  contentType: DingTalkContentType;
  content: Record<string, unknown>;
  rawText?: string;
} {
  // If message has replyMarkup (card), send as actionCard
  if (message.replyMarkup) {
    return {
      contentType: 'actionCard',
      content: message.replyMarkup as Record<string, unknown>,
    };
  }

  // HIGH-5 fix: drop the buttons → actionCard path.
  // The previous implementation built `actionURL: 'dingtalk://dingtalkclient/action/openAppAction?...'`,
  // which is NOT a documented DingTalk deep link - tapping the buttons no-ops in production AND
  // never round-trips back to the bot (it's a client-side intent, not a card callback). Interactive
  // round-trip on DingTalk is only supported via AI Card `cardPrivateData` callbacks, which are
  // handled in DingTalkPlugin.handleCardCallback. Until we wire a documented action scheme,
  // render the message body as plain markdown (without buttons) so the text still reaches the user.
  // HIGH-4 fix: always run HTML through convertHtmlToDingTalkMarkdown so <b>/<a>/<i> render properly
  // on the webhook + API send paths (which previously passed rawText through unconverted).
  const text = message.text || '';
  const renderedText = convertHtmlToDingTalkMarkdown(text);
  return {
    contentType: 'markdown',
    content: {
      title: 'Message',
      text: renderedText,
    },
    rawText: renderedText,
  };
}

// (HIGH-5) buildActionCard removed - see toDingTalkSendParams comment above.
// Re-add only with a documented DingTalk action scheme and a callback round-trip path.

// ==================== Text Formatting ====================

/**
 * Convert HTML to DingTalk markdown format
 * DingTalk supports a subset of markdown
 *
 * Security measures:
 * - Decodes only safe HTML entities
 * - Does NOT decode `<`, `>`, `&` to prevent tag injection
 * - Uses protocol whitelist for links
 * - Case-insensitive matching
 */
export function convertHtmlToDingTalkMarkdown(html: string): string {
  let result = html;

  // 1. Decode safe HTML entities
  result = result
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

  // 2. Convert HTML tags to markdown (case-insensitive)
  result = result.replace(/<b>(.+?)<\/b>/gi, '**$1**');
  result = result.replace(/<strong>(.+?)<\/strong>/gi, '**$1**');
  result = result.replace(/<i>(.+?)<\/i>/gi, '*$1*');
  result = result.replace(/<em>(.+?)<\/em>/gi, '*$1*');
  result = result.replace(/<code>(.+?)<\/code>/gi, '`$1`');
  result = result.replace(/<pre><code>([\s\S]+?)<\/code><\/pre>/gi, '```\n$1\n```');

  // 3. Convert links with protocol whitelist.
  // M6: accept double/single-quoted href in any attribute order, with extra
  // attributes before or after href (class, target, rel, etc.).
  const linkPattern = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  result = result.replace(linkPattern, (_match, dq?: string, sq?: string, unq?: string, text?: string) => {
    const url = ((dq ?? sq ?? unq) || '').trim();
    const linkText = (text ?? '').replace(/<[^>]+>/g, '');
    const normalizedUrl = url.toLowerCase();
    const isSafeUrl = /^(https?:\/\/|mailto:|\/)|^[^:]*$/.test(normalizedUrl);
    if (url && isSafeUrl) {
      return `[${linkText}](${url})`;
    }
    return linkText;
  });

  // 4. Remove all remaining HTML tags (loop until stable)
  let prevResult = '';
  while (prevResult !== result) {
    prevResult = result;
    result = result.replace(/<[^>]+>/g, '');
  }

  return result;
}

/**
 * Escape special characters for DingTalk markdown
 */
export function escapeDingTalkMarkdown(text: string): string {
  return text.replace(/[\\*_`[\]()~]/g, '\\$&');
}

// ==================== Message Length Utilities ====================

/**
 * Split long text into chunks that fit DingTalk's message limit.
 *
 * Prefers newline > space. M7: when neither boundary exists in the search
 * window, falls back to a hard split at `maxLength` and emits a single
 * warning so operators notice mid-token splits.
 */
export function splitMessage(text: string, maxLength: number = DINGTALK_MESSAGE_LIMIT): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;
  let hardSplitWarned = false;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    let splitIndex = maxLength;
    let usedBoundary = false;
    const newlineSearchStart = Math.floor(maxLength * 0.8);
    const lastNewline = remaining.lastIndexOf('\n', maxLength);
    if (lastNewline > newlineSearchStart) {
      splitIndex = lastNewline + 1;
      usedBoundary = true;
    } else {
      const lastSpace = remaining.lastIndexOf(' ', maxLength);
      if (lastSpace > newlineSearchStart) {
        splitIndex = lastSpace + 1;
        usedBoundary = true;
      }
    }

    if (!usedBoundary && !hardSplitWarned) {
      console.warn(
        '[DingTalkAdapter] splitMessage: no whitespace boundary found, falling back to hard split at maxLength'
      );
      hardSplitWarned = true;
    }

    chunks.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  return chunks;
}

// ==================== Card Action Utilities ====================

/**
 * Build card action value object
 */
export function buildCardActionValue(action: string, params?: Record<string, string>): Record<string, string> {
  return {
    action,
    ...params,
  };
}

/**
 * Map action prefix to valid ActionCategory
 */
function mapToActionCategory(prefix: string): 'platform' | 'system' | 'chat' {
  if (prefix === 'pairing') return 'platform';
  if (prefix === 'chat') return 'chat';
  return 'system';
}

/**
 * Extract action info from DingTalk card callback.
 *
 * Accepted formats for the `action` field:
 *   1. JSON: `{"name":"category.action","params":{"key":"val=with=eq"}}`
 *      (preferred - survives values containing `=`, `,`, `:`. L4.)
 *   2. Legacy DSL: `category.action` or `category.action:key1=val1,key2=val2`
 *      Values containing `=` should use the JSON form.
 *
 * Sibling params in the callback `params` map are merged in unconditionally,
 * matching prior behavior.
 */
export function extractCardAction(params: Record<string, string>): IMessageAction | null {
  const actionName = params.action || '';
  if (!actionName) return null;

  let prefix = 'system';
  let name = actionName;
  const actionParams: Record<string, string> = {};
  const trimmed = actionName.trim();
  let parsedAsJson = false;

  // Preferred JSON form.
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { name?: string; params?: Record<string, unknown> };
      const fullName = (parsed.name || '').toString();
      if (fullName.includes('.')) {
        const idx = fullName.indexOf('.');
        prefix = fullName.slice(0, idx);
        name = fullName.slice(idx + 1);
      } else if (fullName) {
        name = fullName;
      }
      if (parsed.params && typeof parsed.params === 'object') {
        for (const [k, v] of Object.entries(parsed.params)) {
          if (typeof v === 'string') actionParams[k] = v;
          else if (v != null) actionParams[k] = String(v);
        }
      }
      parsedAsJson = true;
    } catch {
      // Fall through to DSL parsing
    }
  }

  // Legacy DSL fallback.
  if (!parsedAsJson) {
    const colonIdx = actionName.indexOf(':');
    const fullAction = colonIdx >= 0 ? actionName.slice(0, colonIdx) : actionName;
    const paramsStr = colonIdx >= 0 ? actionName.slice(colonIdx + 1) : '';
    if (fullAction.includes('.')) {
      const dotIdx = fullAction.indexOf('.');
      prefix = fullAction.slice(0, dotIdx);
      name = fullAction.slice(dotIdx + 1);
    } else {
      name = fullAction;
    }
    if (paramsStr) {
      paramsStr.split(',').forEach((param) => {
        const eqIdx = param.indexOf('=');
        if (eqIdx > 0) {
          // Split only on the FIRST `=` so JWT / signed-value tokens survive.
          const key = param.slice(0, eqIdx).trim();
          const val = param.slice(eqIdx + 1);
          if (key) actionParams[key] = val;
        }
      });
    }
  }

  // Merge with other action values (sibling params from callback).
  Object.entries(params).forEach(([key, val]) => {
    if (key !== 'action' && typeof val === 'string') {
      actionParams[key] = val;
    }
  });

  return {
    type: mapToActionCategory(prefix),
    name: `${prefix}.${name}`,
    params: actionParams,
  };
}
