import { ipcBridge } from '@/common';
import type { IProvider, TChatConversation, TProviderWithModel } from '@/common/config/storage';
import { Spin } from '@arco-design/web-react';
import React, { Suspense, useCallback } from 'react';
import { useGeminiModelSelection } from '@/renderer/pages/conversation/platforms/gemini/useGeminiModelSelection';
import { useWCoreModelSelection } from '@/renderer/pages/conversation/platforms/wcore/useWCoreModelSelection';
import TeamChatEmptyState from './TeamChatEmptyState';

const AcpChat = React.lazy(() => import('@/renderer/pages/conversation/platforms/acp/AcpChat'));
const WCoreChat = React.lazy(() => import('@/renderer/pages/conversation/platforms/wcore/WCoreChat'));
const GeminiChat = React.lazy(() => import('@/renderer/pages/conversation/platforms/gemini/GeminiChat'));
const OpenClawChat = React.lazy(() => import('@/renderer/pages/conversation/platforms/openclaw/OpenClawChat'));
const NanobotChat = React.lazy(() => import('@/renderer/pages/conversation/platforms/nanobot/NanobotChat'));
const RemoteChat = React.lazy(() => import('@/renderer/pages/conversation/platforms/remote/RemoteChat'));

// Narrow to Gemini conversations so model field is always available
type GeminiConversation = Extract<TChatConversation, { type: 'gemini' }>;

/** Gemini sub-component manages model selection state without adding a ChatLayout wrapper */
const GeminiTeamChat: React.FC<{
  conversation: GeminiConversation;
  hideSendBox?: boolean;
  teamId?: string;
  agentSlotId?: string;
  emptySlot?: React.ReactNode;
}> = ({ conversation, hideSendBox, teamId, agentSlotId, emptySlot }) => {
  const onSelectModel = useCallback(
    async (_provider: IProvider, modelName: string) => {
      const selected = { ..._provider, useModel: modelName } as TProviderWithModel;
      const ok = await ipcBridge.conversation.update.invoke({ id: conversation.id, updates: { model: selected } });
      return Boolean(ok);
    },
    [conversation.id]
  );

  const modelSelection = useGeminiModelSelection({ initialModel: conversation.model, onSelectModel });

  return (
    <GeminiChat
      conversation_id={conversation.id}
      workspace={conversation.extra.workspace}
      modelSelection={modelSelection}
      hideSendBox={hideSendBox}
      teamId={teamId}
      agentSlotId={agentSlotId}
      emptySlot={emptySlot}
    />
  );
};

// Narrow to Wayland Core conversations so model field is always available
type WCoreConversation = Extract<TChatConversation, { type: 'wcore' }>;

/** Wayland Core sub-component manages model selection state without adding a ChatLayout wrapper */
const WCoreTeamChat: React.FC<{
  conversation: WCoreConversation;
  teamId?: string;
  agentSlotId?: string;
  emptySlot?: React.ReactNode;
}> = ({ conversation, teamId, agentSlotId, emptySlot }) => {
  const onSelectModel = useCallback(
    async (_provider: IProvider, modelName: string) => {
      const selected = { ..._provider, useModel: modelName } as TProviderWithModel;
      const ok = await ipcBridge.conversation.update.invoke({ id: conversation.id, updates: { model: selected } });
      return Boolean(ok);
    },
    [conversation.id]
  );

  const modelSelection = useWCoreModelSelection({ initialModel: conversation.model, onSelectModel });

  return (
    <WCoreChat
      conversation_id={conversation.id}
      workspace={conversation.extra.workspace}
      modelSelection={modelSelection}
      teamId={teamId}
      agentSlotId={agentSlotId}
      emptySlot={emptySlot}
    />
  );
};

type TeamChatViewProps = {
  conversation: TChatConversation;
  hideSendBox?: boolean;
  /** When set, the SendBox routes messages through team.sendMessage instead of direct conversation send */
  teamId?: string;
  /** When set alongside teamId, routes messages to a specific agent via team.sendMessageToAgent */
  agentSlotId?: string;
  agentName?: string;
};

/**
 * Routes to the correct platform chat component based on conversation type.
 * Does NOT wrap in ChatLayout - that is done by the parent TeamPage.
 */
const TeamChatView: React.FC<TeamChatViewProps> = ({ conversation, hideSendBox, teamId, agentSlotId, agentName }) => {
  // Single source of truth for the team greeting. Each *Chat simply forwards `emptySlot`
  // to MessageList; the empty state itself reads teamId / backend / preset info from the
  // shared SWR-cached conversation record, so none of that needs to flow through props.
  //
  // Leader vs specialist signal - TeamPage passes `agentSlotId={undefined}` for the
  // leader slot (line 195 of TeamPage.tsx) and the actual slot id for every specialist.
  // We reuse that signal so callers don't have to thread an extra prop.
  const isLeader = agentSlotId === undefined;
  const emptySlot = teamId
    ? <TeamChatEmptyState conversationId={conversation.id} isLeader={isLeader} />
    : undefined;
  const content = (() => {
    switch (conversation.type) {
      case 'acp':
        return (
          <AcpChat
            key={conversation.id}
            conversation_id={conversation.id}
            workspace={conversation.extra?.workspace}
            backend={conversation.extra?.backend || 'claude'}
            sessionMode={conversation.extra?.sessionMode}
            agentName={agentName ?? (conversation.extra as { agentName?: string })?.agentName}
            hideSendBox={hideSendBox}
            teamId={teamId}
            agentSlotId={agentSlotId}
            emptySlot={emptySlot}
          />
        );
      case 'codex': // Legacy: codex now uses ACP protocol
        return (
          <AcpChat
            key={conversation.id}
            conversation_id={conversation.id}
            workspace={conversation.extra?.workspace}
            backend='codex'
            agentName={agentName ?? (conversation.extra as { agentName?: string })?.agentName}
            hideSendBox={hideSendBox}
            teamId={teamId}
            agentSlotId={agentSlotId}
            emptySlot={emptySlot}
          />
        );
      case 'wcore':
        return (
          <WCoreTeamChat
            key={conversation.id}
            conversation={conversation as WCoreConversation}
            teamId={teamId}
            agentSlotId={agentSlotId}
            emptySlot={emptySlot}
          />
        );
      case 'gemini':
        return (
          <GeminiTeamChat
            key={conversation.id}
            conversation={conversation}
            hideSendBox={hideSendBox}
            teamId={teamId}
            agentSlotId={agentSlotId}
            emptySlot={emptySlot}
          />
        );
      case 'openclaw-gateway':
        return (
          <OpenClawChat
            key={conversation.id}
            conversation_id={conversation.id}
            workspace={conversation.extra?.workspace}
            hideSendBox={hideSendBox}
            emptySlot={emptySlot}
          />
        );
      case 'nanobot':
        return (
          <NanobotChat
            key={conversation.id}
            conversation_id={conversation.id}
            workspace={conversation.extra?.workspace}
            hideSendBox={hideSendBox}
            emptySlot={emptySlot}
          />
        );
      case 'remote':
        return (
          <RemoteChat
            key={conversation.id}
            conversation_id={conversation.id}
            workspace={conversation.extra?.workspace}
            hideSendBox={hideSendBox}
            emptySlot={emptySlot}
          />
        );
      default:
        return null;
    }
  })();

  return <Suspense fallback={<Spin loading className='flex flex-1 items-center justify-center' />}>{content}</Suspense>;
};

export default TeamChatView;
