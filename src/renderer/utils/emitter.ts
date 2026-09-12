/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import EventEmitter from 'eventemitter3';
import type { DependencyList } from 'react';
import { useEffect } from 'react';
import type { FileOrFolderItem } from '@/renderer/utils/file/fileTypes';
import type { PreviewContentType } from '@/common/types/preview';

export type ReplyQuote = {
  messageId: string;
  content: string;
  position: 'left' | 'right' | 'center' | 'pop';
};

interface EventTypes {
  'gemini.selected.file': [Array<string | FileOrFolderItem>];
  'gemini.selected.file.append': [Array<string | FileOrFolderItem>];
  'gemini.selected.file.clear': void;
  'gemini.workspace.refresh': void;
  'acp.selected.file': [Array<string | FileOrFolderItem>];
  'acp.selected.file.append': [Array<string | FileOrFolderItem>];
  'acp.selected.file.clear': void;
  'acp.workspace.refresh': void;
  /**
   * Fired by AcpSendBox when an ACP CLI turn fails to authenticate. AcpChat
   * listens and shows the AcpAuthFailureCard above the send box, with remedies
   * derived from the backend (route through Flux, add a provider key, or run the
   * CLI login command).
   */
  'acp.auth.failed.card': [
    {
      conversation_id: string;
      backend: string;
      pendingInput?: string;
      pendingFiles?: string[];
      fluxAlreadyRouted?: boolean;
    },
  ];
  /**
   * Fired by AcpChat after a successful Flux failover. AcpSendBox listens and
   * re-runs the failed turn through the now-flux-routed backend.
   */
  'acp.flux.replay': [{ conversation_id: string; input: string; files: string[] }];
  'codex.selected.file': [Array<string | FileOrFolderItem>];
  'codex.selected.file.append': [Array<string | FileOrFolderItem>];
  'codex.selected.file.clear': void;
  'codex.workspace.refresh': void;
  'openclaw-gateway.selected.file': [Array<string | FileOrFolderItem>];
  'openclaw-gateway.selected.file.append': [Array<string | FileOrFolderItem>];
  'openclaw-gateway.selected.file.clear': void;
  'openclaw-gateway.workspace.refresh': void;
  'remote.selected.file': [Array<string | FileOrFolderItem>];
  'remote.selected.file.append': [Array<string | FileOrFolderItem>];
  'remote.selected.file.clear': void;
  'remote.workspace.refresh': void;
  'chat.history.refresh': void;
  // Conversation deletion event
  'conversation.deleted': [string]; // conversationId
  // Preview panel events
  'preview.open': [
    { content: string; contentType: PreviewContentType; metadata?: { title?: string; fileName?: string } },
  ];
  // Fill sendbox input event
  'sendbox.fill': [string]; // prompt text to fill
  'sendbox.reply': [ReplyQuote]; // reply/quote a message
  'sendbox.reply.clear': void; // clear reply quote
  'staroffice.install.request': [{ conversationId: string; text: string; detectedUrl?: string | null }];
  'staroffice.install.finished': [{ conversationId: string }];
  /**
   * v0.6.2.6 - fired by the sidebar Recent Chats 3-dot menu when the user
   * picks "Schedule this chat". The matching CronJobManager (mounted in
   * ChatLayout for the active conversation) listens and opens the
   * CreateTaskDialog modal with smart-prefill. If the user is on a
   * different chat, GroupedHistory navigates first via /conversation/:id
   * and ChatConversation reads ?schedule=1 to open on mount.
   */
  'cron.modal.openForChat': [{ conversationId: string }];
  /**
   * v0.6.2.6.1 (fixes Gemini G-P-01: Edit button dead-end) - fired by
   * CronProposeCard when the user clicks "Edit details". CronJobManager
   * listens for the matching conversation and opens the CreateTaskDialog
   * pre-filled with the proposed name / schedule / scheduleDescription /
   * prompt so the user can tweak before save.
   */
  'cron.modal.openWithProposal': [
    {
      conversationId: string;
      conversationTitle?: string;
      agentType?: string;
      initialName: string;
      initialPrompt: string;
      initialSchedule: string;
      initialScheduleDescription: string;
    },
  ];
}

export const emitter = new EventEmitter<EventTypes>();

export const addEventListener = <T extends EventEmitter.EventNames<EventTypes>>(
  event: T,
  fn: EventEmitter.EventListener<EventTypes, T>
) => {
  emitter.on(event, fn);
  return () => {
    emitter.off(event, fn);
  };
};

export const useAddEventListener = <T extends EventEmitter.EventNames<EventTypes>>(
  event: T,
  fn: EventEmitter.EventListener<EventTypes, T>,
  deps?: DependencyList
) => {
  useEffect(() => {
    return addEventListener(event, fn);
  }, deps || []);
};
