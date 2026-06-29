/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMessageText } from '@/common/chat/chatLib';
import { WAYLAND_FILES_MARKER } from '@/common/config/constants';
import { useConversationContextSafe } from '@/renderer/hooks/context/ConversationContext';
import { Alert, Button, Input, Message } from '@arco-design/web-react';
import MessageActions, {
  CHAT_RETRY_EVENT,
  EDIT_AND_RERUN_EVENT,
  type ActionsDisplay,
  type ChatEditRerunDetail,
  type ChatRetryDetail,
} from './MessageActions';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copyText } from '@/renderer/utils/ui/clipboard';
import CollapsibleContent from '@renderer/components/chat/CollapsibleContent';
import FilePreview from '@renderer/components/media/FilePreview';
import HorizontalFileList from '@renderer/components/media/HorizontalFileList';
import MarkdownView from '@renderer/components/Markdown';
import { stripThinkTags, hasThinkTags } from '@renderer/utils/chat/thinkTagFilter';
import { stripSkillSuggest, hasSkillSuggest } from '@renderer/utils/chat/skillSuggestParser';
import { WorkflowMessageBody } from './WorkflowMessageBody';

// SPEC §7.2 / §14: per-turn WORKFLOW_STEP_CONTEXT is prepended to user input by
// conversationBridge so the static system prompt stays cache-stable. The
// envelope MUST ride the user channel for cache safety, but rendering it
// visibly in the chat tape looks awful and confuses users. Strip it on the
// renderer side for workflow conversations. Mirrors composeStepContext.ts's
// open/close tag format.
//
// Also strips the [workflow_answer ask_id=… step_n=…]<answer>…</answer>
// [/workflow_answer] envelope WorkflowSurface wraps Ask responses in so the
// user sees their actual answer text, not the machine-readable wrapper.
const WORKFLOW_STEP_CONTEXT_RE = /\[workflow_step_context [^\]]*\][\s\S]*?\[\/workflow_step_context\]\s*/g;
const WORKFLOW_ANSWER_RE = /\[workflow_answer [^\]]*\]\s*<answer>([\s\S]*?)<\/answer>\s*\[\/workflow_answer\]\s*/g;

const stripWorkflowEnvelopes = (text: string): string => {
  if (!text) return text;
  let out = text.replace(WORKFLOW_STEP_CONTEXT_RE, '');
  out = out.replace(WORKFLOW_ANSWER_RE, (_match, answer: string) => answer);
  return out.trimStart();
};

// The hidden begin message WorkflowSurface fires to kick the agent.
// After stripping the WORKFLOW_STEP_CONTEXT envelope, what remains is a
// literal `begin <workflow-slug>` line. That looks ugly + cheesy in the
// chat tape ("begin create-marketing-campaign" with hyphens + lowercase).
// We hide the user-message bubble entirely when the cleaned text matches
// this pattern - the agent's response is the meaningful surface, not the
// machine-readable kickoff command.
const BEGIN_COMMAND_RE = /^begin\s+[a-z0-9][a-z0-9-]*\s*$/i;
const isWorkflowBeginCommand = (text: string): boolean => BEGIN_COMMAND_RE.test(text.trim());

/**
 * Format a timestamp for message display.
 * Today: "HH:mm", older: "MM-DD HH:mm".
 */
export const formatMessageTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;

  if (
    date.getFullYear() !== now.getFullYear() ||
    date.getMonth() !== now.getMonth() ||
    date.getDate() !== now.getDate()
  ) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}-${day} ${time}`;
  }
  return time;
};
import MessageCronBadge from './MessageCronBadge';
import { getAgentLogo } from '@/renderer/utils/model/agentLogo';
import TeammateMessageAvatar from './TeammateMessageAvatar';

const CODE_STYLE = { marginTop: 4, marginBlock: 4 };

const parseFileMarker = (content: string) => {
  const markerIndex = content.indexOf(WAYLAND_FILES_MARKER);
  if (markerIndex === -1) {
    return { text: content, files: [] as string[] };
  }
  const text = content.slice(0, markerIndex).trimEnd();
  const afterMarker = content.slice(markerIndex + WAYLAND_FILES_MARKER.length).trim();
  const files = afterMarker
    ? afterMarker
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
  return { text, files };
};

const isAbsoluteMessageFilePath = (filePath: string): boolean =>
  filePath.startsWith('/') || /^[A-Za-z]:/.test(filePath);

export const resolveMessageFilePath = (filePath: string, workspace?: string): string => {
  if (!filePath || isAbsoluteMessageFilePath(filePath) || !workspace) {
    return filePath;
  }

  const normalizedWorkspace = workspace.replace(/[\\/]+$/, '').replace(/\\/g, '/');
  const normalizedFilePath = filePath.replace(/^\.?[\\/]+/, '').replace(/\\/g, '/');
  return `${normalizedWorkspace}/${normalizedFilePath}`.replace(/\/+/g, '/');
};

const useFormatContent = (content: string) => {
  return useMemo(() => {
    try {
      const json = JSON.parse(content);
      const isJson = typeof json === 'object';
      return {
        json: isJson,
        data: isJson ? json : content,
      };
    } catch {
      return { data: content };
    }
  }, [content]);
};

const MessageText: React.FC<{ message: IMessageText; toolbarMode?: ActionsDisplay; retryText?: string }> = ({
  message,
  toolbarMode = 'hover',
  retryText,
}) => {
  // Filter think tags from content before rendering
  const contentToRender = useMemo(() => {
    let content = message.content.content;
    if (typeof content === 'string') {
      if (hasThinkTags(content)) {
        content = stripThinkTags(content);
      }
      // Strip any inline [SKILL_SUGGEST] blocks (now handled via separate skill_suggest message type)
      if (hasSkillSuggest(content)) {
        content = stripSkillSuggest(content);
      }
      return content;
    }
    return content;
  }, [message.content.content]);

  const { text, files } = parseFileMarker(contentToRender);
  const { data, json } = useFormatContent(text);
  const { t } = useTranslation();
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const isUserMessage = message.position === 'right';
  const isTeammateMessage = message.position === 'left' && message.content.teammateMessage === true;
  const isTruncated = message.content.truncatedDueToBudget === true;
  const shouldRenderPlainText = isUserMessage;
  const conversationContext = useConversationContextSafe();
  const resolvedFiles = useMemo(
    () => files.map((filePath) => resolveMessageFilePath(filePath, conversationContext?.workspace)),
    [conversationContext?.workspace, files]
  );

  const workflowSessionId = conversationContext?.workflowSessionId;
  const conversationId = conversationContext?.conversationId;

  // #422: one-click recovery on the truncation banner. Re-sends the turn's
  // prompt through the existing retry plumbing (CHAT_RETRY_EVENT). Combined
  // with the reasoning-tier budget floor in defaultMaxTokensForModel, the
  // resend runs with the higher output budget instead of the low default.
  const handleContinueWithHeadroom = useCallback(() => {
    if (!retryText) return;
    window.dispatchEvent(
      new CustomEvent<ChatRetryDetail>(CHAT_RETRY_EVENT, { detail: { conversationId, text: retryText } })
    );
  }, [retryText, conversationId]);

  // Inline edit state — user messages only.
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleEditStart = useCallback(() => {
    setEditValue(text);
    setEditing(true);
  }, [text]);

  const handleEditSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (!trimmed || !conversationId || !message.createdAt) return;
    window.dispatchEvent(
      new CustomEvent<ChatEditRerunDetail>(EDIT_AND_RERUN_EVENT, {
        // Truncate from the edited message INCLUSIVE (delete is `created_at > ?`),
        // so the resend REPLACES the original instead of appending a duplicate.
        detail: { conversationId, afterTimestamp: message.createdAt - 1, text: trimmed },
      })
    );
    setEditing(false);
  }, [editValue, conversationId, message.createdAt]);

  const handleEditCancel = useCallback(() => {
    setEditing(false);
  }, []);

  const hasVisibleContent =
    !!message.content.content && (typeof message.content.content !== 'string' || !!message.content.content.trim());

  // Filter empty content to avoid rendering empty DOM (truncation warning is the exception - render the
  // banner even when content is empty, e.g. Gemini Pro reasoning-token bug.)
  if (!hasVisibleContent && !isTruncated) {
    return null;
  }

  // For workflow conversations: if a user message is the hidden begin command
  // (after stripping the WORKFLOW_STEP_CONTEXT envelope), hide the entire
  // bubble. The chat tape should look like an agent monologue, not show the
  // raw "begin foo-bar-baz" kickoff command.
  if (workflowSessionId && isUserMessage) {
    const cleanedForGate = stripWorkflowEnvelopes(text);
    if (isWorkflowBeginCommand(cleanedForGate)) {
      return null;
    }
  }

  const handleCopy = () => {
    const baseText = shouldRenderPlainText ? text : json ? JSON.stringify(data, null, 2) : text;
    const fileList = files.length ? `Files:\n${files.map((path) => `- ${path}`).join('\n')}\n\n` : '';
    const textToCopy = fileList + baseText;
    copyText(textToCopy)
      .then(() => {
        setShowCopyAlert(true);
        setTimeout(() => setShowCopyAlert(false), 2000);
      })
      .catch(() => {
        Message.error(t('common.copyFailed'));
      });
  };

  const actionRow = (
    <MessageActions
      onCopy={handleCopy}
      messageId={message.id}
      readText={text}
      isUser={isUserMessage}
      display={toolbarMode}
      retryText={!isUserMessage ? retryText : undefined}
      conversationId={conversationId}
      onEdit={isUserMessage && message.createdAt && conversationId ? handleEditStart : undefined}
    />
  );

  const cronMeta = message.content.cronMeta;
  const senderName = message.content.senderName;
  const senderAgentType = message.content.senderAgentType;
  const senderConversationId = message.content.senderConversationId;
  const fallbackBackendLogo = senderAgentType ? getAgentLogo(senderAgentType) : null;

  return (
    <>
      <div className={classNames('min-w-0 flex flex-col group', isUserMessage ? 'items-end' : 'items-start')}>
        {cronMeta && <MessageCronBadge meta={cronMeta} />}
        {isTeammateMessage && senderName && (
          <div className='flex items-center gap-6px mb-4px'>
            <TeammateMessageAvatar
              senderName={senderName}
              senderConversationId={senderConversationId}
              backendLogo={fallbackBackendLogo}
            />
            <span className='text-12px text-t-secondary'>{senderName}</span>
          </div>
        )}
        {files.length > 0 && (
          <div className={classNames('mt-6px', { 'self-end': isUserMessage })}>
            {resolvedFiles.length === 1 ? (
              <div className='flex items-center'>
                <FilePreview path={resolvedFiles[0]} onRemove={() => undefined} readonly />
              </div>
            ) : (
              <HorizontalFileList>
                {resolvedFiles.map((path) => (
                  <FilePreview key={path} path={path} onRemove={() => undefined} readonly />
                ))}
              </HorizontalFileList>
            )}
          </div>
        )}
        <div
          className={classNames('min-w-0 [&>p:first-child]:mt-0px [&>p:last-child]:mb-0px md:max-w-780px', {
            'p-8px': isUserMessage || cronMeta,
            'bg-3 p-8px': isTeammateMessage,
            'w-full': !(isUserMessage || cronMeta || isTeammateMessage),
          })}
          style={{
            ...(isUserMessage || cronMeta
              ? {
                  borderRadius: '8px 0 8px 8px',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-tint, var(--aou-2))',
                  border: '1px solid var(--brand-soft-border, rgba(255, 107, 53, 0.22))',
                }
              : isTeammateMessage
                ? { borderRadius: '0 8px 8px 8px' }
                : undefined),
          }}
        >
          {/* Inline edit mode for user messages */}
          {editing && (
            <div className='flex flex-col gap-8px'>
              <Input.TextArea
                value={editValue}
                onChange={setEditValue}
                autoSize={{ minRows: 2, maxRows: 12 }}
                autoFocus
                aria-label={t('conversation.actions.edit', { defaultValue: 'Edit' })}
              />
              <div className='flex gap-8px justify-end'>
                <Button size='small' onClick={handleEditCancel}>
                  {t('conversation.actions.cancel', { defaultValue: 'Cancel' })}
                </Button>
                <Button size='small' type='primary' onClick={handleEditSave}>
                  {t('conversation.actions.save', { defaultValue: 'Save' })}
                </Button>
              </div>
            </div>
          )}
          {/* Use CollapsibleContent for JSON content */}
          {!editing &&
            hasVisibleContent &&
            (shouldRenderPlainText ? (
              <div className='whitespace-pre-wrap break-words' data-testid='message-text-content'>
                {workflowSessionId ? stripWorkflowEnvelopes(text) : text}
              </div>
            ) : json ? (
              <CollapsibleContent maxHeight={200} defaultCollapsed={true}>
                <div data-testid='message-text-content'>
                  <MarkdownView
                    codeStyle={CODE_STYLE}
                  >{`\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``}</MarkdownView>
                </div>
              </CollapsibleContent>
            ) : (
              <div data-testid='message-text-content'>
                <WorkflowMessageBody workflowSessionId={isUserMessage ? undefined : workflowSessionId} body={data}>
                  {(cleanedBody) => <MarkdownView codeStyle={CODE_STYLE}>{cleanedBody}</MarkdownView>}
                </WorkflowMessageBody>
              </div>
            ))}
          {isTruncated && (
            <Alert
              type='warning'
              showIcon
              className={hasVisibleContent ? 'mt-8px' : ''}
              data-testid='message-truncation-warning'
              content={t('messages.truncation.budgetExhausted.body', {
                defaultValue:
                  "This reply stopped early - the model used up its room while thinking and didn't get to the answer. Try again with more headroom, or switch to a model with more reasoning room.",
              })}
              action={
                retryText != null ? (
                  <Button size='mini' type='text' onClick={handleContinueWithHeadroom}>
                    {t('messages.truncation.budgetExhausted.action', { defaultValue: 'Continue with more headroom' })}
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
        <div
          className={classNames('h-32px flex items-center mt-4px gap-8px', {
            'flex-row-reverse': isUserMessage,
          })}
        >
          {actionRow}
          {message.createdAt && (
            <span className='text-12px text-t-secondary opacity-0 group-hover:opacity-100 transition-opacity select-none'>
              {formatMessageTime(message.createdAt)}
            </span>
          )}
        </div>
      </div>
      {showCopyAlert && (
        <Alert
          type='success'
          content={t('messages.copySuccess')}
          showIcon
          className='fixed top-20px left-50% transform -translate-x-50% z-9999 w-max max-w-[80%]'
          style={{ boxShadow: '0px 2px 12px rgba(0,0,0,0.12)' }}
          closable={false}
        />
      )}
    </>
  );
};

export default MessageText;
