/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #252 observability rework - the single consolidated per-message action row.
 *
 * Replaces the old lone copy button (and the duplicate toolbar). Assistant
 * messages get: copy, read-aloud (browser speechSynthesis - no install needed),
 * thumbs up/down (PERSISTED to localStorage, not just visual), and retry. User
 * messages get copy. The row is hover-revealed for older messages but ALWAYS
 * shown on the last message (so the primary actions are one move away).
 *
 * Retry is decoupled via a window event (mirrors CHAT_MESSAGE_JUMP_EVENT): the
 * active sendbox owns send, so it listens and re-runs the turn.
 */

import { Copy, Edit, Like, PauseOne, PlayOne, Refresh, Unlike } from '@icon-park/react';
import { Tooltip } from '@arco-design/web-react';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { iconColors } from '@/renderer/styles/colors';

/** Dispatched by Retry; the active platform sendbox listens and re-sends the turn. */
export const CHAT_RETRY_EVENT = 'wl:chat-retry';
export type ChatRetryDetail = { conversationId?: string; text: string };

/**
 * #457 True Continue: dispatched by the truncation/max-turns Continue action.
 * The active sendbox listens and sends {@link CONTINUE_DIRECTIVE} into the SAME
 * conversation (the engine holds the live transcript) - it is NOT a re-send of
 * the original prompt, which would restart the task and lose in-progress work.
 */
export const CHAT_CONTINUE_EVENT = 'wl:chat-continue';
export type ChatContinueDetail = { conversationId?: string };

/**
 * Canonical continuation directive sent verbatim into the live engine session
 * so it resumes the in-progress turn instead of restarting. Mirrors the
 * hermes-agent continuation prompt. Intentionally a fixed instruction to the
 * model (not user-facing UI copy), so it is a code constant, not an i18n key.
 */
export const CONTINUE_DIRECTIVE = 'Continue exactly where you left off. Do not restart or repeat completed work.';

/** Dispatched by the user-message Edit+Save flow; the active sendbox listens and re-runs the turn. */
export const EDIT_AND_RERUN_EVENT = 'wl:chat-edit-rerun';
export type ChatEditRerunDetail = { conversationId: string; afterTimestamp: number; text: string };

type Feedback = 'up' | 'down';

/**
 * 'always'  - pinned visible (the last, completed assistant message)
 * 'hover'   - revealed on hover/focus (older messages)
 * 'hidden'  - not rendered at all (while the message is still streaming)
 */
export type ActionsDisplay = 'always' | 'hover' | 'hidden';

type Props = {
  /** Copy handler from MessageText (rich copy incl. files/json). */
  onCopy: () => void;
  /** Stable message id - the persistence key for thumbs. */
  messageId: string;
  /** Plain text for read-aloud (markdown stripped by the caller or here). */
  readText: string;
  isUser: boolean;
  /** Visibility mode - the tool set only appears once a response is done. */
  display: ActionsDisplay;
  /** For Retry (assistant only): the preceding user prompt to re-send. */
  retryText?: string;
  conversationId?: string;
  /** Called when the user clicks the Edit button (user messages only). */
  onEdit?: () => void;
};

const stripMarkdown = (s: string): string =>
  s
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const ActionButton: React.FC<{ label: string; onClick: () => void; active?: boolean; children: React.ReactNode }> = ({
  label,
  onClick,
  active,
  children,
}) => (
  <Tooltip content={label}>
    <div
      role='button'
      tabIndex={0}
      aria-label={label}
      aria-pressed={active}
      className={classNames('p-4px rd-4px cursor-pointer hover:bg-3 transition-colors', { 'bg-2': active })}
      style={{ lineHeight: 0 }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  </Tooltip>
);

const MessageActions: React.FC<Props> = ({
  onCopy,
  messageId,
  readText,
  isUser,
  display,
  retryText,
  conversationId,
  onEdit,
}) => {
  const { t } = useTranslation();
  const fbKey = `wl:fb:${messageId}`;
  const [feedback, setFeedback] = useState<Feedback | null>(() => {
    try {
      return (localStorage.getItem(fbKey) as Feedback | null) ?? null;
    } catch {
      return null;
    }
  });
  const [speaking, setSpeaking] = useState(false);

  // Stop any in-flight speech if this row unmounts.
  useEffect(() => {
    return () => {
      if (speaking) window.speechSynthesis?.cancel();
    };
  }, [speaking]);

  const handleReadAloud = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(stripMarkdown(readText).slice(0, 4000));
    utter.addEventListener('end', () => setSpeaking(false));
    utter.addEventListener('error', () => setSpeaking(false));
    synth.cancel();
    synth.speak(utter);
    setSpeaking(true);
  }, [readText, speaking]);

  const handleFeedback = useCallback(
    (value: Feedback) => {
      const next = feedback === value ? null : value;
      setFeedback(next);
      try {
        if (next) localStorage.setItem(fbKey, next);
        else localStorage.removeItem(fbKey);
      } catch {
        /* storage unavailable - keep the in-session toggle */
      }
    },
    [feedback, fbKey]
  );

  const handleRetry = useCallback(() => {
    if (!retryText) return;
    window.dispatchEvent(
      new CustomEvent<ChatRetryDetail>(CHAT_RETRY_EVENT, { detail: { conversationId, text: retryText } })
    );
  }, [retryText, conversationId]);

  // Hidden while the message is still streaming - the tool set only appears once
  // the response is done. (Hooks above always run, so this early-return is safe.)
  if (display === 'hidden') return null;

  // Reveal: pinned for the last completed message, hover-gated for older ones.
  const revealClass =
    display === 'always'
      ? 'opacity-100'
      : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto';

  return (
    <div
      className={classNames('flex items-center gap-2px transition-opacity', revealClass, {
        'flex-row-reverse': isUser,
      })}
      role='toolbar'
    >
      <ActionButton label={t('common.copy', { defaultValue: 'Copy' })} onClick={onCopy}>
        <Copy size={16} fill={iconColors.secondary} />
      </ActionButton>

      {isUser && onEdit && (
        <ActionButton label={t('conversation.actions.edit', { defaultValue: 'Edit' })} onClick={onEdit}>
          <Edit size={16} fill={iconColors.secondary} />
        </ActionButton>
      )}

      {!isUser && (
        <>
          <ActionButton
            label={
              speaking
                ? t('conversation.actions.stopReading', { defaultValue: 'Stop' })
                : t('conversation.actions.readAloud', { defaultValue: 'Read aloud' })
            }
            onClick={handleReadAloud}
            active={speaking}
          >
            {speaking ? (
              <PauseOne size={16} fill={iconColors.brand} />
            ) : (
              <PlayOne size={16} fill={iconColors.secondary} />
            )}
          </ActionButton>

          {retryText != null && (
            <ActionButton label={t('conversation.actions.retry', { defaultValue: 'Retry' })} onClick={handleRetry}>
              <Refresh size={16} fill={iconColors.secondary} />
            </ActionButton>
          )}

          <ActionButton
            label={t('conversation.actions.thumbsUp', { defaultValue: 'Good response' })}
            onClick={() => handleFeedback('up')}
            active={feedback === 'up'}
          >
            <Like size={16} fill={feedback === 'up' ? iconColors.brand : iconColors.secondary} />
          </ActionButton>

          <ActionButton
            label={t('conversation.actions.thumbsDown', { defaultValue: 'Bad response' })}
            onClick={() => handleFeedback('down')}
            active={feedback === 'down'}
          >
            <Unlike size={16} fill={feedback === 'down' ? iconColors.brand : iconColors.secondary} />
          </ActionButton>
        </>
      )}
    </div>
  );
};

export default MessageActions;
