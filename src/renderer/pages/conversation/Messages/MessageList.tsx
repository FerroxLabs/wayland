/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronDown } from 'lucide-react';
import { ipcBridge } from '@/common';
import type { CodexToolCallUpdate, IMessageAcpToolCall, IMessageToolGroup, TMessage } from '@/common/chat/chatLib';
import { useConversationContextSafe } from '@/renderer/hooks/context/ConversationContext';
import { useWorkflowViewMode } from '@/renderer/pages/guid/components/workflow/workflowViewMode';
import { WorkflowTranscript } from '@/renderer/pages/guid/components/workflow/WorkflowTranscript';
import { iconColors } from '@/renderer/styles/colors';
import { CHAT_MESSAGE_JUMP_EVENT, type ChatMessageJumpDetail } from '@/renderer/utils/chat/chatMinimapEvents';
import { Image } from '@arco-design/web-react';
import MessageAcpPermission from '@renderer/pages/conversation/Messages/acp/MessageAcpPermission';
import MessageAcpToolCall from '@renderer/pages/conversation/Messages/acp/MessageAcpToolCall';
import classNames from 'classnames';
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { uuid } from '@renderer/utils/common';
import './messages.css';
import HOC from '@renderer/utils/ui/HOC';
import MessageCodexToolCall from './codex/MessageCodexToolCall';
import type { FileChangeInfo } from './codex/MessageFileChanges';
import MessageFileChanges, { parseDiff } from './codex/MessageFileChanges';
import { useMessageList } from './hooks';
import MessageAgentStatus from './components/MessageAgentStatus';
import MessagePlan from './components/MessagePlan';
import MessageTips from './components/MessageTips';
import MessageToolCall from './components/MessageToolCall';
import MessageToolGroup from './components/MessageToolGroup';
import ActivityTimeline from '@/renderer/components/chat/observability/ActivityTimeline';
import OrbitThinking from '@/renderer/components/chat/observability/OrbitThinking';
import { activityToSteps, subAgentToStep, toolSummaryToSteps } from '@/common/chat/activity/projectMessages';
import MessageCronTrigger from './components/MessageCronTrigger';
import CronProposeCard from './components/CronProposeCard';
import MessageSkillSuggest from './components/MessageSkillSuggest';
import MessageText from './components/MessageText';
import type { ActionsDisplay } from './components/MessageActions';
import MessageThinking from './components/MessageThinking';
import type { WriteFileResult } from './types';
import { useAutoScroll } from './useAutoScroll';
import { useAutoPreviewOfficeFiles } from '@/renderer/hooks/file/useAutoPreviewOfficeFiles';
import SelectionReplyButton from './components/SelectionReplyButton';
import { computeChatTimeMarkers, splitGap, type ChatTimeMarker } from './utils/chatTimeMarkers';

type TurnDiffContent = Extract<CodexToolCallUpdate, { subtype: 'turn_diff' }>;

type IMessageVO =
  | TMessage
  | { type: 'file_summary'; id: string; diffs: FileChangeInfo[]; sourceMessageIds: string[] }
  | {
      type: 'tool_summary';
      id: string;
      messages: Array<IMessageToolGroup | IMessageAcpToolCall>;
      sourceMessageIds: string[];
    };

type ConversationLocationState = {
  targetMessageId?: string;
  fromConversationSearch?: boolean;
};

const getProcessedItemSourceMessageIds = (item: IMessageVO): string[] => {
  if ('type' in item && item.type === 'tool_summary') {
    return item.sourceMessageIds;
  }
  if ('type' in item && item.type === 'file_summary') {
    return item.sourceMessageIds;
  }
  return 'id' in item ? [item.id] : [];
};

const matchesTargetMessage = (item: IMessageVO, targetMessageId?: string): boolean => {
  if (!targetMessageId) {
    return false;
  }
  return getProcessedItemSourceMessageIds(item).includes(targetMessageId);
};

const getProcessedItemAnchorId = (item: IMessageVO): string => {
  const sourceIds = getProcessedItemSourceMessageIds(item);
  return sourceIds[0] || ('id' in item ? item.id : uuid());
};

const highlightStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-aou-1)',
  boxShadow: '0 0 0 1px var(--color-aou-6-brand) inset',
  borderRadius: '12px',
};

const getUnhandledMessageType = (_message: never): string => 'unknown';

// Image preview context
export const ImagePreviewContext = createContext<{ inPreviewGroup: boolean }>({ inPreviewGroup: false });

const MessageItem: React.FC<{
  message: TMessage;
  highlighted?: boolean;
  toolbarMode?: ActionsDisplay;
  retryText?: string;
}> = React.memo(
  HOC((props) => {
    const { message, highlighted } = props as { message: TMessage; highlighted?: boolean };
    return (
      <div
        id={`message-${message.id}`}
        data-testid={`message-${message.type}-${message.position}`}
        data-message-type={message.type}
        data-message-position={message.position}
        className={classNames(
          'min-w-0 flex items-start message-item [&>div]:max-w-full px-8px m-t-10px max-w-full md:max-w-780px mx-auto',
          message.type,
          {
            'justify-center': message.position === 'center',
            'justify-end': message.position === 'right',
            'justify-start': message.position === 'left',
          }
        )}
        style={highlighted ? highlightStyle : undefined}
      >
        {props.children}
      </div>
    );
  })(
    ({
      message,
      toolbarMode,
      retryText,
    }: {
      message: TMessage;
      highlighted?: boolean;
      toolbarMode?: ActionsDisplay;
      retryText?: string;
    }) => {
      const { t } = useTranslation();
      switch (message.type) {
        case 'text':
          return <MessageText message={message} toolbarMode={toolbarMode} retryText={retryText} />;
        case 'tips':
          return <MessageTips message={message}></MessageTips>;
        case 'tool_call':
          return <MessageToolCall message={message}></MessageToolCall>;
        case 'tool_group':
          return <MessageToolGroup message={message}></MessageToolGroup>;
        case 'agent_status':
          return <MessageAgentStatus message={message}></MessageAgentStatus>;
        case 'acp_permission':
          return <MessageAcpPermission message={message}></MessageAcpPermission>;
        case 'acp_tool_call':
          return <MessageAcpToolCall message={message}></MessageAcpToolCall>;
        case 'codex_permission':
          // Permission UI is now handled by ConversationChatConfirm component
          return null;
        case 'codex_tool_call':
          return <MessageCodexToolCall message={message}></MessageCodexToolCall>;
        case 'plan':
          return <MessagePlan message={message}></MessagePlan>;
        case 'thinking':
          return <MessageThinking message={message}></MessageThinking>;
        case 'skill_suggest':
          return <MessageSkillSuggest message={message} />;
        case 'cron_trigger':
          return <MessageCronTrigger message={message} />;
        case 'cron_propose':
          return <CronProposeCard message={message} />;
        case 'sub_agent':
          // #252 rework: a spawned sub-agent renders as one collapsible timeline
          // step carrying its parsed inner subtree (tools / thinking / nested agents).
          return <ActivityTimeline steps={[subAgentToStep(message.content)]} />;
        case 'activity':
          // #252 rework: the live activity tree (tool lifecycle, chunks, cost,
          // circuit/browser/cua) renders inline as the unified timeline.
          return <ActivityTimeline steps={activityToSteps(message.content)} />;
        case 'available_commands':
          return null;
        default:
          return <div>{t('messages.unknownMessageType', { type: getUnhandledMessageType(message) })}</div>;
      }
    }
  ),
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.position === next.message.position &&
    prev.message.type === next.message.type &&
    prev.highlighted === next.highlighted &&
    prev.toolbarMode === next.toolbarMode &&
    prev.retryText === next.retryText
);

/**
 * Subtle date/time + elapsed-gap chip rendered above a project-chat message
 * when the day changes or a meaningful gap has passed (#59). Date/time are
 * locale-formatted via Intl; only the compact gap units come from i18n.
 */
const ChatTimeMarkerRow: React.FC<{ marker: ChatTimeMarker }> = ({ marker }) => {
  const { t, i18n } = useTranslation();
  const d = new Date(marker.ts);
  const time = d.toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' });
  let label: string;
  if (marker.dayChange) {
    const date = d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });
    label = `${date} · ${time}`;
  } else {
    const { hours, minutes } = splitGap(marker.gapMs);
    const gap =
      hours === 0
        ? t('messages.timeMarker.gapMinutes', { minutes })
        : minutes === 0
          ? t('messages.timeMarker.gapHours', { hours })
          : t('messages.timeMarker.gapHoursMinutes', { hours, minutes });
    label = `${time} · ${gap}`;
  }
  return (
    <div className='flex justify-center mt-14px mb-4px'>
      <span className='text-11px text-t-tertiary bg-1 rd-full px-10px py-2px whitespace-nowrap'>{label}</span>
    </div>
  );
};

// Stable Virtuoso list components (module-level so they are NEVER recreated on
// render). This is what keeps the orbit indicator MOUNTED across re-renders, so
// its CSS animation runs continuously instead of restarting (= flashing) every
// streamed token. The processing state reaches the footer via Virtuoso `context`.
type MessageListContext = { isProcessing?: boolean; currentLabel?: string; turnStartTime?: number };
const ListHeader: React.FC = () => <div className='h-10px' />;
const ListFooter: React.FC<{ context?: MessageListContext }> = ({ context }) => (
  <OrbitThinking
    isProcessing={!!context?.isProcessing}
    currentLabel={context?.currentLabel}
    startTime={context?.turnStartTime}
  />
);
const LIST_COMPONENTS = { Header: ListHeader, Footer: ListFooter } as const;

const ConversationMessageList: React.FC<{
  className?: string;
  emptySlot?: React.ReactNode;
  isProcessing?: boolean;
}> = ({ emptySlot, isProcessing }) => {
  const list = useMessageList();
  const conversationContext = useConversationContextSafe();
  useAutoPreviewOfficeFiles(conversationContext);

  // Project-backed chats get subtle transcript time markers (#59); gate on the
  // conversation's projectId so personal chats stay quiet.
  const conversationId = conversationContext?.conversationId;
  const [isProjectChat, setIsProjectChat] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setIsProjectChat(false);
    if (!conversationId) return;
    void ipcBridge.conversation.get
      .invoke({ id: conversationId })
      .then((conv) => {
        if (cancelled) return;
        const projectId = (conv?.extra as { projectId?: string } | undefined)?.projectId;
        setIsProjectChat(Boolean(projectId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [conversationId]);
  const { t } = useTranslation();
  const location = useLocation();
  const locationState = (location.state || {}) as ConversationLocationState;
  const targetMessageId = locationState.targetMessageId;
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | undefined>();
  const handledTargetKeyRef = useRef<string>('');

  // Pre-process message list to group Codex turn_diff messages
  const processedList = useMemo(() => {
    const result: Array<IMessageVO> = [];
    let diffsChanges: FileChangeInfo[] = [];
    let diffsSourceMessageIds: string[] = [];
    let toolList: Array<IMessageToolGroup | IMessageAcpToolCall> = [];
    let toolSourceMessageIds: string[] = [];

    const pushFileDffChanges = (changes: FileChangeInfo, sourceMessageId: string) => {
      if (!diffsChanges.length) {
        diffsSourceMessageIds = [];
        result.push({
          type: 'file_summary',
          id: `summary-${sourceMessageId}`,
          diffs: diffsChanges,
          sourceMessageIds: diffsSourceMessageIds,
        });
      }
      diffsChanges.push(changes);
      diffsSourceMessageIds.push(sourceMessageId);
      toolList = [];
      toolSourceMessageIds = [];
    };
    const pushToolList = (message: IMessageToolGroup | IMessageAcpToolCall) => {
      if (!toolList.length) {
        toolSourceMessageIds = [];
        result.push({
          type: 'tool_summary',
          id: `tool-summary-${message.id}`,
          messages: toolList,
          sourceMessageIds: toolSourceMessageIds,
        });
      }
      toolList.push(message);
      toolSourceMessageIds.push(message.id);
      diffsChanges = [];
      diffsSourceMessageIds = [];
    };

    for (let i = 0, len = list.length; i < len; i++) {
      const message = list[i];
      // Skip hidden and available_commands messages
      if (message.hidden) continue;
      if (message.type === 'available_commands') continue;
      if (message.type === 'codex_tool_call' && message.content.subtype === 'turn_diff') {
        pushFileDffChanges(parseDiff((message.content as TurnDiffContent).data.unified_diff), message.id);
        continue;
      }
      if (message.type === 'tool_group') {
        if (message.content.length === 1) {
          const writeFileResults = message.content
            .filter(
              (item) =>
                item.name === 'WriteFile' &&
                item.resultDisplay &&
                typeof item.resultDisplay === 'object' &&
                'fileDiff' in item.resultDisplay
            )
            .map((item) => item.resultDisplay as WriteFileResult);
          if (writeFileResults.length && writeFileResults[0].fileDiff) {
            pushFileDffChanges(parseDiff(writeFileResults[0].fileDiff, writeFileResults[0].fileName), message.id);
            continue;
          }
        }
        pushToolList(message);
        continue;
      }
      if (message.type === 'acp_tool_call') {
        pushToolList(message);
        continue;
      }
      toolList = [];
      toolSourceMessageIds = [];
      diffsChanges = [];
      diffsSourceMessageIds = [];
      result.push(message);
    }
    return result;
  }, [list]);

  // #252 rework: the per-message action row is always shown on the LAST assistant
  // bubble (hover-revealed elsewhere), and Retry needs the preceding user prompt.
  // Compute the last assistant-text id + a map of assistant id -> its prompt.
  const { lastAssistantId, retryTextById } = useMemo(() => {
    const map = new Map<string, string>();
    let lastId: string | undefined;
    let lastUserText = '';
    for (const item of processedList) {
      if ('type' in item && (item.type === 'file_summary' || item.type === 'tool_summary')) continue;
      const m = item as TMessage;
      if (m.type !== 'text') continue;
      if (m.position === 'right') {
        if (typeof m.content?.content === 'string') lastUserText = m.content.content;
      } else if (m.position === 'left') {
        if (lastUserText) map.set(m.id, lastUserText);
        lastId = m.id;
      }
    }
    return { lastAssistantId: lastId, retryTextById: map };
  }, [processedList]);

  // Per-row time markers for project chats, aligned to processedList indices (#59).
  const timeMarkers = useMemo(() => {
    if (!isProjectChat) return null;
    const tsById = new Map<string, number | undefined>();
    for (const m of list) tsById.set(m.id, m.createdAt);
    const timestamps = processedList.map((item) => {
      if ('type' in item && (item.type === 'file_summary' || item.type === 'tool_summary')) {
        const firstSrc = getProcessedItemSourceMessageIds(item)[0];
        return firstSrc ? tsById.get(firstSrc) : undefined;
      }
      return (item as TMessage).createdAt;
    });
    return computeChatTimeMarkers(timestamps);
  }, [isProjectChat, processedList, list]);

  // Use auto-scroll hook
  const {
    virtuosoRef,
    handleScrollerRef,
    handleScroll,
    handleAtBottomStateChange,
    handleFollowOutput,
    showScrollButton,
    scrollToBottom,
    hideScrollButton,
  } = useAutoScroll({
    messages: list,
    itemCount: processedList.length,
  });

  useEffect(() => {
    if (!targetMessageId || processedList.length === 0 || !virtuosoRef.current) {
      return;
    }

    const targetKey = `${location.key}:${targetMessageId}`;
    if (handledTargetKeyRef.current === targetKey) {
      return;
    }

    const targetIndex = processedList.findIndex((item) => matchesTargetMessage(item, targetMessageId));
    if (targetIndex === -1) {
      return;
    }

    handledTargetKeyRef.current = targetKey;
    setHighlightedMessageId(targetMessageId);
    hideScrollButton();

    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: targetIndex,
        behavior: 'smooth',
        align: 'center',
      });
    });

    const timer = window.setTimeout(() => {
      setHighlightedMessageId((current) => (current === targetMessageId ? undefined : current));
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [hideScrollButton, location.key, processedList, targetMessageId, virtuosoRef]);

  useEffect(() => {
    const handleMessageJump = (event: Event) => {
      const detail = (event as CustomEvent<ChatMessageJumpDetail>).detail;
      if (!detail || !detail.conversationId) return;
      if (!conversationContext?.conversationId || detail.conversationId !== conversationContext.conversationId) return;

      const targetIndex = processedList.findIndex((item) => {
        if (
          (item as { type?: string }).type === 'file_summary' ||
          (item as { type?: string }).type === 'tool_summary'
        ) {
          return false;
        }
        const message = item as TMessage;
        if (detail.messageId && message.id === detail.messageId) return true;
        if (detail.msgId && message.msg_id === detail.msgId) return true;
        return false;
      });
      if (targetIndex < 0) return;

      hideScrollButton();
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: targetIndex,
          align: detail.align || 'start',
          behavior: detail.behavior || 'smooth',
        });
      });
    };

    window.addEventListener(CHAT_MESSAGE_JUMP_EVENT, handleMessageJump);
    return () => {
      window.removeEventListener(CHAT_MESSAGE_JUMP_EVENT, handleMessageJump);
    };
  }, [conversationContext?.conversationId, hideScrollButton, processedList, virtuosoRef]);

  // Click scroll button
  const handleScrollButtonClick = () => {
    hideScrollButton();
    scrollToBottom('smooth');
  };

  // The orbit's live label = the real current action (the last running tool
  // step), so the indicator reads "Searching the web…" / "Running a command…"
  // instead of a generic phrase. Undefined while there is no active tool (the
  // orbit then falls back to a calm reasoning phrase), and only while processing.
  const currentLabel = useMemo<string | undefined>(() => {
    if (!isProcessing) return undefined;
    for (let i = processedList.length - 1; i >= 0; i--) {
      const item = processedList[i];
      if ('type' in item && item.type === 'tool_summary') {
        const steps = toolSummaryToSteps(item.messages);
        return [...steps].reverse().find((s) => s.status === 'running')?.label;
      }
      // #318: during the live reasoning phase (no tool activity yet) prefer the
      // engine's own per-turn reasoning subject for the orbit footer; PHRASES stays
      // the fallback for reasoning turns the engine gives no subject for.
      if ('type' in item && item.type === 'thinking') {
        const c = (item as TMessage & { type: 'thinking' }).content;
        if (c.status !== 'done' && c.subject) return c.subject;
      }
    }
    return undefined;
  }, [processedList, isProcessing]);

  // #288: the orbit's elapsed timer is anchored to the turn's actual start - the
  // last user submission (createdAt is epoch-ms). This makes elapsed = TOTAL
  // running time that survives chat switches (the timer no longer resets to 0 on
  // remount), and it is undefined while idle so the timer never ticks with no
  // task running.
  const turnStartTime = useMemo<number | undefined>(() => {
    if (!isProcessing) return undefined;
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i];
      if (m.position === 'right' && typeof m.createdAt === 'number') return m.createdAt;
    }
    return undefined;
  }, [list, isProcessing]);

  const renderItem = (_index: number, item: (typeof processedList)[0]) => {
    const highlighted = matchesTargetMessage(item, highlightedMessageId);
    const marker = timeMarkers?.[_index] ?? null;
    let body: React.ReactNode;
    if ('type' in item && ['file_summary', 'tool_summary'].includes(item.type)) {
      body = (
        <div
          key={item.id}
          id={`message-${getProcessedItemAnchorId(item)}`}
          className={'min-w-0 message-item px-8px m-t-10px max-w-full md:max-w-780px mx-auto ' + item.type}
          style={highlighted ? highlightStyle : undefined}
        >
          {item.type === 'file_summary' && <MessageFileChanges diffsChanges={item.diffs} />}
          {/* #252 rework: grouped tool calls render as the unified collapsible
              activity timeline (replaces the old raw "View Steps" list). */}
          {item.type === 'tool_summary' && <ActivityTimeline steps={toolSummaryToSteps(item.messages)} />}
        </div>
      );
    } else {
      const tm = item as TMessage;
      const isLastAssistant = tm.type === 'text' && tm.id === lastAssistantId;
      // The tool set only appears once a response is DONE: the last assistant
      // message is 'hidden' while it is the last item AND still streaming, then
      // 'always' once complete; older messages reveal on hover.
      const toolbarMode: ActionsDisplay = isLastAssistant
        ? _index === processedList.length - 1 && isProcessing
          ? 'hidden'
          : 'always'
        : 'hover';
      body = (
        <MessageItem
          message={tm}
          key={tm.id}
          highlighted={highlighted}
          toolbarMode={toolbarMode}
          retryText={retryTextById.get(tm.id)}
        ></MessageItem>
      );
    }
    if (!marker) return body;
    return (
      <>
        <ChatTimeMarkerRow marker={marker} />
        {body}
      </>
    );
  };

  if (processedList.length === 0 && emptySlot) {
    return <div className='relative flex-1 h-full flex items-center justify-center'>{emptySlot}</div>;
  }

  return (
    <div className='relative flex-1 h-full'>
      {/* Use PreviewGroup to wrap all messages for cross-message image preview */}
      <Image.PreviewGroup actionsLayout={['zoomIn', 'zoomOut', 'originalSize', 'rotateLeft', 'rotateRight']}>
        <ImagePreviewContext.Provider value={{ inPreviewGroup: true }}>
          <Virtuoso
            ref={virtuosoRef}
            scrollerRef={handleScrollerRef}
            className='flex-1 h-full pb-10px box-border'
            data={processedList}
            initialTopMostItemIndex={processedList.length - 1}
            defaultItemHeight={40}
            atBottomThreshold={100}
            increaseViewportBy={1200}
            itemContent={renderItem}
            followOutput={handleFollowOutput}
            onScroll={handleScroll}
            atBottomStateChange={handleAtBottomStateChange}
            // #252 rework: the orbit "thinking" indicator is the (stable) footer -
            // always parked under the last block, animating while processing and
            // resting static when done. Stable components + context avoid remounts
            // (= flashing). See LIST_COMPONENTS above.
            components={LIST_COMPONENTS}
            context={{ isProcessing, currentLabel, turnStartTime }}
          />
        </ImagePreviewContext.Provider>
      </Image.PreviewGroup>

      {showScrollButton && (
        <>
          {/* Gradient mask */}
          <div className='absolute bottom-0 left-0 right-0 h-100px pointer-events-none' />
          {/* Scroll button */}
          <div className='absolute bottom-20px left-50% transform -translate-x-50% z-100'>
            <div
              className='flex items-center justify-center w-40px h-40px rd-full bg-base shadow-lg cursor-pointer hover:bg-1 transition-all hover:scale-110 border-1 border-solid border-3'
              onClick={handleScrollButtonClick}
              title={t('messages.scrollToBottom')}
              style={{ lineHeight: 0 }}
            >
              <ChevronDown size={20} color={iconColors.secondary} style={{ display: 'block' }} />
            </div>
          </div>
        </>
      )}

      <SelectionReplyButton messages={list} />
    </div>
  );
};

/**
 * Swaps to the polished WorkflowTranscript when a workflow run is in 'workflow'
 * view mode. The branch lives in this thin wrapper (only context reads, no other
 * hooks) so toggling views mounts/unmounts a whole child component instead of
 * changing the hook count inside one component (which React forbids).
 */
const MessageList: React.FC<{ className?: string; emptySlot?: React.ReactNode; isProcessing?: boolean }> = (props) => {
  const conversationContext = useConversationContextSafe();
  const wf = useWorkflowViewMode();
  const workflowSessionId = conversationContext?.workflowSessionId;
  if (wf.isWorkflow && wf.mode === 'workflow' && workflowSessionId) {
    return <WorkflowTranscript />;
  }
  return <ConversationMessageList {...props} />;
};

export default MessageList;
