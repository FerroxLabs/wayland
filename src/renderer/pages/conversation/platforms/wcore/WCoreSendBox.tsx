/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield } from 'lucide-react';
import { ipcBridge } from '@/common';
import { uuid } from '@/common/utils';
import AgentModeSelector from '@/renderer/components/agent/AgentModeSelector';
import ContextUsageIndicator from '@/renderer/components/agent/ContextUsageIndicator';
import CommandQueuePanel from '@/renderer/components/chat/CommandQueuePanel';
import SendBox from '@/renderer/components/chat/sendbox';
import ThoughtDisplay from '@/renderer/components/chat/ThoughtDisplay';
import {
  CHAT_RETRY_EVENT,
  EDIT_AND_RERUN_EVENT,
  type ChatRetryDetail,
  type ChatEditRerunDetail,
} from '@/renderer/pages/conversation/Messages/components/MessageActions';
import FileAttachButton from '@/renderer/components/media/FileAttachButton';
import FilePreview from '@/renderer/components/media/FilePreview';
import HorizontalFileList from '@/renderer/components/media/HorizontalFileList';
import { useAutoTitle } from '@/renderer/hooks/chat/useAutoTitle';
import { getSendBoxDraftHook, type FileOrFolderItem } from '@/renderer/hooks/chat/useSendBoxDraft';
import { createSetUploadFile, useSendBoxFiles } from '@/renderer/hooks/chat/useSendBoxFiles';
import { useSlashCommands } from '@/renderer/hooks/chat/useSlashCommands';
import { usePendingSendOnWake } from '@/renderer/hooks/chat/usePendingSendOnWake';
import { useOpenFileSelector } from '@/renderer/hooks/file/useOpenFileSelector';
import { useProviderReadiness } from '@/renderer/hooks/useProviderReadiness';
import { useLatestRef } from '@/renderer/hooks/ui/useLatestRef';
import {
  useAddOrUpdateMessage,
  useRemoveMessageByMsgId,
  useTruncateMessagesAfter,
} from '@/renderer/pages/conversation/Messages/hooks';
import { assertBridgeSuccess } from '@/renderer/pages/conversation/platforms/assertBridgeSuccess';
import {
  shouldEnqueueConversationCommand,
  useConversationCommandQueue,
  type ConversationCommandQueueItem,
} from '@/renderer/pages/conversation/platforms/useConversationCommandQueue';
import { usePreviewContext } from '@/renderer/pages/conversation/Preview';
import { allSupportedExts } from '@/renderer/services/FileService';
import { iconColors } from '@/renderer/styles/colors';
import { emitter, useAddEventListener } from '@/renderer/utils/emitter';
import { mergeFileSelectionItems } from '@/renderer/utils/file/fileSelection';
import { buildDisplayMessage, collectSelectedFiles } from '@/renderer/utils/file/messageFiles';
import { mergeWithCapabilities, type AgentModeOption } from '@/renderer/utils/model/agentModes';
import { getModelContextLimit } from '@/renderer/utils/model/modelContextLimits';
import { Message, Tag } from '@arco-design/web-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWCoreMessage } from './useWCoreMessage';
import type { WCoreModelSelection } from './useWCoreModelSelection';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { classifyAcpAuthFailure } from '@/renderer/pages/conversation/platforms/acp/acpAuthFailure';
import { isFluxModelId } from '@/common/config/flux';

const useWCoreSendBoxDraft = getSendBoxDraftHook('wcore', {
  _type: 'wcore',
  atPath: [],
  content: '',
  uploadFile: [],
});

const EMPTY_AT_PATH: Array<string | FileOrFolderItem> = [];
const EMPTY_UPLOAD_FILES: string[] = [];

const useSendBoxDraft = (conversation_id: string) => {
  const { data, mutate } = useWCoreSendBoxDraft(conversation_id);

  const atPath = data?.atPath ?? EMPTY_AT_PATH;
  const uploadFile = data?.uploadFile ?? EMPTY_UPLOAD_FILES;
  const content = data?.content ?? '';

  const setAtPath = useCallback(
    (nextAtPath: Array<string | FileOrFolderItem>) => {
      mutate((prev) => ({ ...prev, atPath: nextAtPath }));
    },
    [data, mutate]
  );

  const setUploadFile = createSetUploadFile(mutate, data);

  const setContent = useCallback(
    (nextContent: string) => {
      mutate((prev) => ({ ...prev, content: nextContent }));
    },
    [data, mutate]
  );

  return {
    atPath,
    uploadFile,
    setAtPath,
    setUploadFile,
    content,
    setContent,
  };
};

const WCoreSendBox: React.FC<{
  conversation_id: string;
  modelSelection: WCoreModelSelection;
  teamId?: string;
  agentSlotId?: string;
  sessionMode?: string;
  /** Report the turn-running state up so the inline orbit indicator can render in the message list. */
  onRunningChange?: (running: boolean) => void;
}> = ({ conversation_id, modelSelection, teamId, agentSlotId, sessionMode, onRunningChange }) => {
  const [workspacePath, setWorkspacePath] = useState('');
  const [dynamicModes, setDynamicModes] = useState<AgentModeOption[]>([]);
  // The most recent turn dispatched, kept so the Flux failover can replay it.
  // WCore's 401 arrives asynchronously via the stream (onError), where the
  // original input is no longer in scope - so we stash it at send time.
  const lastSentRef = useRef<{ input: string; files: string[]; msg_id: string } | null>(null);
  const { t } = useTranslation();
  const { checkAndUpdateTitle } = useAutoTitle();
  const { currentModel, getDisplayModelName } = modelSelection;
  const readiness = useProviderReadiness();
  // The engine is "asleep" when no working inference provider is configured.
  // While asleep we still let the user compose + send: the message is held in
  // the main process and auto-fires once a provider wakes the engine (WS-4).
  const engineAsleep = !readiness.ready && !readiness.loading;

  // When the engine surfaces a provider auth failure (e.g. 401 / invalid
  // x-api-key on a dead key), show the same remedy card the ACP backends use.
  // The main process separately flips that provider off "connected".
  const handleAuthError = useCallback(
    (message: IResponseMessage) => {
      const text = typeof message.data === 'string' ? message.data : String(message.data ?? '');
      if (classifyAcpAuthFailure('wcore', text)) {
        emitter.emit('wcore.auth.failed.card', {
          conversation_id,
          providerLabel: currentModel?.name,
          pendingInput: lastSentRef.current?.input,
          pendingFiles: lastSentRef.current?.files,
          fluxAlreadyRouted: isFluxModelId(currentModel?.useModel),
        });
      }
    },
    [conversation_id, currentModel?.name, currentModel?.useModel]
  );

  const { thought, running, hasHydratedRunningState, tokenUsage, setActiveMsgId, setWaitingResponse, resetState } =
    useWCoreMessage(conversation_id, {
      onConfigChanged: (capabilities) => {
        const modes = (capabilities as { modes?: string[] })?.modes;
        if (modes && modes.length > 0) {
          setDynamicModes(mergeWithCapabilities('wcore', modes));
        }
        // #466: surface Computer-Use availability so WCoreChat can prime the
        // macOS permission card only when the agent actually has CUA.
        const hasCua = Boolean((capabilities as { computer_use?: boolean })?.computer_use);
        emitter.emit('wcore.cua.capability', { conversation_id, hasCua });
      },
      onError: handleAuthError,
    });

  const { atPath, uploadFile, setAtPath, setUploadFile, content, setContent } = useSendBoxDraft(conversation_id);

  useEffect(() => {
    void ipcBridge.conversation.get.invoke({ id: conversation_id }).then((res) => {
      if (!res?.extra?.workspace) return;
      setWorkspacePath(res.extra.workspace);
    });
  }, [conversation_id]);

  const slashCommands = useSlashCommands(conversation_id);

  const addOrUpdateMessage = useAddOrUpdateMessage();
  const removeMessageByMsgId = useRemoveMessageByMsgId();
  const truncateMessagesAfter = useTruncateMessagesAfter();
  const { setSendBoxHandler } = usePreviewContext();
  const isBusy = running;

  const setContentRef = useLatestRef(setContent);
  const atPathRef = useLatestRef(atPath);

  // Register handler for adding text from preview panel to sendbox
  useEffect(() => {
    const handler = (text: string) => {
      const newContent = content ? `${content}\n${text}` : text;
      setContentRef.current(newContent);
    };
    setSendBoxHandler(handler);
  }, [setSendBoxHandler, content]);

  // Listen for sendbox.fill event to populate input from external sources
  useAddEventListener(
    'sendbox.fill',
    (text: string) => {
      setContentRef.current(text);
    },
    []
  );

  // Shared file handling logic
  const { handleFilesAdded, clearFiles } = useSendBoxFiles({
    atPath,
    uploadFile,
    setAtPath,
    setUploadFile,
  });

  const executeCommand = useCallback(
    async ({ input, files }: Pick<ConversationCommandQueueItem, 'input' | 'files'>) => {
      if (!currentModel?.useModel) {
        Message.warning(t('conversation.chat.noModelSelected'));
        throw new Error('No model selected');
      }

      const msg_id = uuid();
      lastSentRef.current = { input, files, msg_id };
      setActiveMsgId(msg_id);
      setWaitingResponse(true);

      const displayMessage = buildDisplayMessage(input, files, workspacePath);
      if (!teamId) {
        addOrUpdateMessage(
          {
            id: msg_id,
            type: 'text',
            position: 'right',
            conversation_id,
            content: {
              content: displayMessage,
            },
            createdAt: Date.now(),
          },
          true
        );
      }

      try {
        void checkAndUpdateTitle(conversation_id, input);
        if (teamId) {
          if (agentSlotId) {
            const result = await ipcBridge.team.sendMessageToAgent.invoke({
              teamId,
              slotId: agentSlotId,
              content: displayMessage,
              files,
            });
            const maybeError = result as unknown as { __bridgeError?: boolean; message?: string };
            if (maybeError.__bridgeError) {
              throw new Error(maybeError.message || 'Failed to send message to agent');
            }
          } else {
            const result = await ipcBridge.team.sendMessage.invoke({ teamId, content: displayMessage, files });
            const maybeError = result as unknown as { __bridgeError?: boolean; message?: string };
            if (maybeError.__bridgeError) {
              throw new Error(maybeError.message || 'Failed to send message to team');
            }
          }
        } else {
          const result = await ipcBridge.conversation.sendMessage.invoke({
            input: displayMessage,
            msg_id,
            conversation_id,
            files,
          });
          assertBridgeSuccess(result, 'Failed to send message to Wayland Core');
        }
        emitter.emit('chat.history.refresh');
        if (files.length > 0) {
          emitter.emit('wcore.workspace.refresh');
        }
      } catch (error) {
        removeMessageByMsgId(msg_id);
        throw error;
      }
    },
    [
      addOrUpdateMessage,
      agentSlotId,
      checkAndUpdateTitle,
      conversation_id,
      currentModel?.useModel,
      setActiveMsgId,
      removeMessageByMsgId,
      setWaitingResponse,
      teamId,
      workspacePath,
    ]
  );

  // WS-4: hold a send while the engine is asleep; auto-fire it once a provider
  // wakes the engine (exactly-once, survives a remount into settings and back).
  const { holdIfAsleep } = usePendingSendOnWake({
    conversationId: conversation_id,
    asleep: engineAsleep,
    ready: readiness.ready,
    execute: executeCommand,
  });

  const {
    items: queuedCommands,
    isPaused: isQueuePaused,
    isInteractionLocked: isQueueInteractionLocked,
    hasPendingCommands,
    enqueue,
    remove,
    clear,
    reorder,
    pause,
    resume,
    lockInteraction,
    unlockInteraction,
    resetActiveExecution,
  } = useConversationCommandQueue({
    conversationId: conversation_id,
    enabled: true,
    isBusy,
    isHydrated: hasHydratedRunningState,
    onExecute: executeCommand,
  });

  // Handle initial message from Guid page
  useEffect(() => {
    if (!conversation_id) return;

    const storageKey = `wcore_initial_message_${conversation_id}`;
    const processedKey = `wcore_initial_processed_${conversation_id}`;

    const processInitialMessage = async () => {
      if (sessionStorage.getItem(processedKey)) return;
      const storedMessage = sessionStorage.getItem(storageKey);
      if (!storedMessage) return;

      sessionStorage.setItem(processedKey, '1');
      sessionStorage.removeItem(storageKey);

      try {
        const { input, files: initialFiles } = JSON.parse(storedMessage);
        await executeCommand({ input, files: initialFiles || [] });
      } catch (error) {
        console.error('[WCoreSendBox] Failed to send initial message:', error);
        sessionStorage.removeItem(processedKey);
      }
    };

    void processInitialMessage();
  }, [conversation_id, executeCommand]);

  const onSendHandler = async (message: string) => {
    if (!teamId && isBusy) {
      Message.warning(t('messages.conversationInProgress'));
      return;
    }

    const filesToSend = collectSelectedFiles(uploadFile, atPath);
    clearFiles();
    emitter.emit('wcore.selected.file.clear');

    // Engine asleep: park the message instead of dispatching it. The inline
    // ActivationCard (hosted by WCoreChat) is the call-to-action; the held
    // message auto-fires the moment a provider is connected.
    if (await holdIfAsleep(message, filesToSend)) {
      return;
    }

    if (
      shouldEnqueueConversationCommand({
        enabled: true,
        isBusy,
        hasPendingCommands,
      })
    ) {
      enqueue({ input: message, files: filesToSend });
      return;
    }

    await executeCommand({ input: message, files: filesToSend });
  };

  // #252 rework: Retry on a message's action row re-sends that turn's prompt.
  // The active sendbox owns send, so it listens for the window event (scoped to
  // this conversation so it never fires on another open tab).
  const onSendRef = useRef(onSendHandler);
  onSendRef.current = onSendHandler;
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ChatRetryDetail>).detail;
      if (!detail?.text) return;
      if (detail.conversationId && detail.conversationId !== conversation_id) return;
      void onSendRef.current(detail.text);
    };
    window.addEventListener(CHAT_RETRY_EVENT, handler);
    return () => window.removeEventListener(CHAT_RETRY_EVENT, handler);
  }, [conversation_id]);

  // Edit-and-rerun: truncate messages after the edited user message, then re-send.
  const truncateRef = useRef(truncateMessagesAfter);
  truncateRef.current = truncateMessagesAfter;
  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent<ChatEditRerunDetail>).detail;
      if (!detail?.text || !detail.conversationId || detail.afterTimestamp == null) return;
      if (detail.conversationId !== conversation_id) return;
      const result = await ipcBridge.conversation.deleteMessagesAfter.invoke({
        conversation_id: detail.conversationId,
        afterTimestamp: detail.afterTimestamp,
      });
      if (!result?.success) {
        console.error('[WCoreSendBox] deleteMessagesAfter failed', result);
      }
      truncateRef.current(detail.afterTimestamp);
      void onSendRef.current(detail.text);
    };
    window.addEventListener(EDIT_AND_RERUN_EVENT, handler);
    return () => window.removeEventListener(EDIT_AND_RERUN_EVENT, handler);
  }, [conversation_id]);

  // Report the turn-running state up so the inline orbit "thinking" indicator
  // (rendered in the message list, under the last block) shows the moment a turn
  // starts and hides when it completes.
  useEffect(() => {
    onRunningChange?.(running);
  }, [running, onRunningChange]);

  const handleEditQueuedCommand = useCallback(
    (item: ConversationCommandQueueItem) => {
      remove(item.id);
      setContent(item.input);
      setUploadFile(Array.from(new Set(item.files)));
      setAtPath([]);
      emitter.emit('wcore.selected.file.clear');
    },
    [remove, setAtPath, setContent, setUploadFile]
  );

  const appendSelectedFiles = useCallback(
    (files: string[]) => {
      setUploadFile((prev) => [...prev, ...files]);
    },
    [setUploadFile]
  );
  const { openFileSelector, onSlashBuiltinCommand } = useOpenFileSelector({
    onFilesSelected: appendSelectedFiles,
  });

  useAddEventListener('wcore.selected.file', setAtPath);
  useAddEventListener('wcore.selected.file.append', (selectedItems: Array<string | FileOrFolderItem>) => {
    const merged = mergeFileSelectionItems(atPathRef.current, selectedItems);
    if (merged !== atPathRef.current) {
      setAtPath(merged as Array<string | FileOrFolderItem>);
    }
  });

  // Flux failover replay: WCoreChat re-routes the dead chat through Flux, then
  // asks the send box to re-run the failed turn. Drop the original failed bubble
  // first so the retry does not duplicate it.
  useAddEventListener(
    'wcore.flux.replay',
    (p) => {
      if (p.conversation_id !== conversation_id) return;
      const last = lastSentRef.current;
      if (last?.msg_id) removeMessageByMsgId(last.msg_id);
      void executeCommand({ input: p.input, files: p.files });
    },
    [conversation_id, executeCommand, removeMessageByMsgId]
  );

  // Stop conversation handler
  const handleStop = async (): Promise<void> => {
    try {
      await ipcBridge.conversation.stop.invoke({ conversation_id });
    } finally {
      resetState();
      resetActiveExecution('stop');
    }
  };

  return (
    <div className='max-w-800px w-full mx-auto flex flex-col mt-auto mb-16px'>
      <CommandQueuePanel
        items={queuedCommands}
        paused={isQueuePaused}
        interactionLocked={isQueueInteractionLocked}
        onPause={pause}
        onResume={resume}
        onInteractionLock={lockInteraction}
        onInteractionUnlock={unlockInteraction}
        onEdit={handleEditQueuedCommand}
        onReorder={reorder}
        onRemove={remove}
        onClear={clear}
      />
      {/* #252 rework: the orbit "thinking" indicator moved INTO the message list
          (inline, under the last block - Claude-style), driven by onRunningChange.
          ThoughtDisplay is kept for the thought-subject hint path (e.g.
          "Awaiting Confirmation"), which renders null otherwise. */}
      <ThoughtDisplay thought={thought} onStop={handleStop} />

      <SendBox
        value={content}
        onChange={setContent}
        selectedWorkspaceItems={atPath}
        onSelectedWorkspaceItemsChange={(items) => {
          emitter.emit('wcore.selected.file', items);
          setAtPath(items);
        }}
        loading={isBusy}
        disabled={!currentModel?.useModel && !engineAsleep}
        placeholder={
          currentModel?.useModel
            ? t('conversation.chat.sendMessageTo', { model: getDisplayModelName(currentModel.useModel) })
            : t('conversation.chat.noModelSelected')
        }
        onStop={handleStop}
        className='z-10'
        onFilesAdded={handleFilesAdded}
        hasPendingAttachments={uploadFile.length > 0 || atPath.length > 0}
        supportedExts={allSupportedExts}
        defaultMultiLine={true}
        lockMultiLine={true}
        tools={
          <div className='flex items-center gap-4px'>
            <FileAttachButton openFileSelector={openFileSelector} onLocalFilesAdded={handleFilesAdded} />
            <AgentModeSelector
              backend='wcore'
              conversationId={conversation_id}
              compact
              initialMode={sessionMode}
              dynamicModes={dynamicModes}
              compactLeadingIcon={<Shield size={14} color={iconColors.secondary} />}
              modeLabelFormatter={(mode) => t(`agentMode.${mode.value}`, { defaultValue: mode.label })}
              compactLabelPrefix={t('agentMode.permission')}
              hideCompactLabelPrefixOnMobile
            />
          </div>
        }
        sendButtonPrefix={
          <ContextUsageIndicator
            tokenUsage={tokenUsage}
            contextLimit={getModelContextLimit(currentModel?.useModel)}
            size={24}
          />
        }
        prefix={
          <>
            {uploadFile.length > 0 && (
              <HorizontalFileList>
                {uploadFile.map((path) => (
                  <FilePreview
                    key={path}
                    path={path}
                    onRemove={() => setUploadFile(uploadFile.filter((v) => v !== path))}
                  />
                ))}
              </HorizontalFileList>
            )}
            {atPath.some((item) => (typeof item === 'string' ? false : !item.isFile)) && (
              <div className='flex flex-wrap items-center gap-8px mb-8px'>
                {atPath.map((item) => {
                  if (typeof item === 'string') return null;
                  if (!item.isFile) {
                    return (
                      <Tag
                        key={item.path}
                        color='blue'
                        closable
                        onClose={() => {
                          const newAtPath = atPath.filter((v) => (typeof v === 'string' ? true : v.path !== item.path));
                          emitter.emit('wcore.selected.file', newAtPath);
                          setAtPath(newAtPath);
                        }}
                      >
                        {item.name}
                      </Tag>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </>
        }
        onSend={onSendHandler}
        slashCommands={slashCommands}
        onSlashBuiltinCommand={onSlashBuiltinCommand}
        allowSendWhileLoading
      />
    </div>
  );
};

export default WCoreSendBox;
