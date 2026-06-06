/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { History } from 'lucide-react';
import { ipcBridge } from '@/common';
import type { IProvider, TChatConversation, TProviderWithModel } from '@/common/config/storage';
import type { WorkflowSession } from '@/common/types/workflowTypes';
import { uuid } from '@/common/utils';
import addChatIcon from '@/renderer/assets/icons/add-chat.svg';
import { CronJobManager } from '@/renderer/pages/cron';
import { usePresetAssistantInfo, resolveAssistantConfigId } from '@/renderer/hooks/agent/usePresetAssistantInfo';
import { useWorkflowSession } from '@/renderer/hooks/workflow/useWorkflowSession';
import { iconColors } from '@/renderer/styles/colors';
import { Button, Dropdown, Menu, Tooltip, Typography } from '@arco-design/web-react';
import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { emitter } from '../../../utils/emitter';
import AcpChat from '../platforms/acp/AcpChat';
import ChatLayout from './ChatLayout';
import ChatSider from './ChatSider';
import NanobotChat from '../platforms/nanobot/NanobotChat';
import OpenClawChat from '../platforms/openclaw/OpenClawChat';
import RemoteChat from '../platforms/remote/RemoteChat';
import GeminiChat from '../platforms/gemini/GeminiChat';
import AcpModelSelector from '@/renderer/components/agent/AcpModelSelector';
import GeminiModelSelector from '../platforms/gemini/GeminiModelSelector';
import { useGeminiModelSelection } from '../platforms/gemini/useGeminiModelSelection';
import WCoreChat from '../platforms/wcore/WCoreChat';
import WCoreModelSelector from '../platforms/wcore/WCoreModelSelector';
import { useWCoreModelSelection } from '../platforms/wcore/useWCoreModelSelection';
import { usePreviewContext } from '../Preview';
import StarOfficeMonitorCard from '../platforms/openclaw/StarOfficeMonitorCard.tsx';
import ConversationSkillsIndicator from './ConversationSkillsIndicator';
import AddSkillToChatButton from './AddSkillToChatButton';
import { WorkflowSurface } from '@/renderer/pages/guid/components/workflow/WorkflowSurface';
import type { WCoreModelSelection } from '../platforms/wcore/useWCoreModelSelection';
import type { GeminiModelSelection } from '../platforms/gemini/useGeminiModelSelection';
// import SkillRuleGenerator from './components/SkillRuleGenerator'; // Temporarily hidden

// Null-object model selection stubs used when a wcore or gemini conversation
// is wrapped inside WorkflowSurface. The workflow chrome controls the flow;
// model switching is disabled in this path (no WCore/GeminiModelSelector is
// rendered in the ChatLayout header because hideHeader=true suppresses it).
const WORKFLOW_WCORE_MODEL_SELECTION: WCoreModelSelection = {
  currentModel: undefined,
  providers: [],
  getAvailableModels: () => [],
  handleSelectModel: async () => {},
  getDisplayModelName: () => '',
};

const WORKFLOW_GEMINI_MODEL_SELECTION: GeminiModelSelection = {
  currentModel: undefined,
  providers: [],
  geminiModeLookup: new Map(),
  formatModelLabel: () => '',
  getDisplayModelName: () => '',
  getAvailableModels: () => [],
  handleSelectModel: async () => {},
};

/** Check whether a specific skill is loaded for the conversation */
const hasLoadedSkill = (conversation: TChatConversation | undefined, skillName: string): boolean => {
  const loadedSkills = (conversation?.extra as { loadedSkills?: Array<{ name: string }> })?.loadedSkills;
  return loadedSkills?.some((s) => s.name === skillName) ?? false;
};

const _AssociatedConversation: React.FC<{ conversation_id: string }> = ({ conversation_id }) => {
  const { data } = useSWR(['getAssociateConversation', conversation_id], () =>
    ipcBridge.conversation.getAssociateConversation.invoke({ conversation_id })
  );
  const navigate = useNavigate();
  const list = useMemo(() => {
    if (!data?.length) return [];
    return data.filter((conversation) => conversation.id !== conversation_id);
  }, [data]);
  if (!list.length) return null;
  return (
    <Dropdown
      droplist={
        <Menu
          onClickMenuItem={(key) => {
            Promise.resolve(navigate(`/conversation/${key}`)).catch((error) => {
              console.error('Navigation failed:', error);
            });
          }}
        >
          {list.map((conversation) => {
            return (
              <Menu.Item key={conversation.id}>
                <Typography.Ellipsis className={'max-w-300px'}>{conversation.name}</Typography.Ellipsis>
              </Menu.Item>
            );
          })}
        </Menu>
      }
      trigger={['click']}
    >
      <Button
        size='mini'
        icon={
          <History size={14} color={iconColors.primary} strokeWidth={2} strokeLinejoin='miter' strokeLinecap='square' />
        }
      ></Button>
    </Dropdown>
  );
};

const _AddNewConversation: React.FC<{ conversation: TChatConversation }> = ({ conversation }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isCreatingRef = useRef(false);
  if (!conversation.extra?.workspace) return null;
  return (
    <Tooltip content={t('conversation.workspace.createNewConversation')}>
      <Button
        size='mini'
        icon={<img src={addChatIcon} alt='Add chat' className='w-14px h-14px block m-auto' />}
        onClick={async () => {
          if (isCreatingRef.current) return;
          isCreatingRef.current = true;
          try {
            const id = uuid();
            // Fetch latest conversation from DB to ensure sessionMode is current
            const latest = await ipcBridge.conversation.get.invoke({ id: conversation.id }).catch((): null => null);
            const source = latest || conversation;
            await ipcBridge.conversation.createWithConversation.invoke({
              conversation: {
                ...source,
                id,
                createTime: Date.now(),
                modifyTime: Date.now(),
                // Clear ACP session fields to prevent new conversation from inheriting old session context
                extra:
                  source.type === 'acp'
                    ? { ...source.extra, acpSessionId: undefined, acpSessionUpdatedAt: undefined }
                    : source.extra,
              } as TChatConversation,
            });
            void navigate(`/conversation/${id}`);
            emitter.emit('chat.history.refresh');
          } catch (error) {
            console.error('Failed to create conversation:', error);
          } finally {
            isCreatingRef.current = false;
          }
        }}
      />
    </Tooltip>
  );
};

// Narrow to Gemini conversations so model field is always available
type GeminiConversation = Extract<TChatConversation, { type: 'gemini' }>;

const GeminiConversationPanel: React.FC<{
  conversation: GeminiConversation;
  sliderTitle: React.ReactNode;
  hideSendBox?: boolean;
}> = ({ conversation, sliderTitle, hideSendBox }) => {
  // Save model selection to conversation via IPC
  const onSelectModel = useCallback(
    async (_provider: IProvider, modelName: string) => {
      const selected = { ..._provider, useModel: modelName } as TProviderWithModel;
      const ok = await ipcBridge.conversation.update.invoke({ id: conversation.id, updates: { model: selected } });
      return Boolean(ok);
    },
    [conversation.id]
  );

  // Share model selection state between header and send box
  const modelSelection = useGeminiModelSelection({ initialModel: conversation.model, onSelectModel });
  const workspaceEnabled = Boolean(conversation.extra?.workspace);

  // Use unified hook for preset assistant info
  const { info: presetAssistantInfo } = usePresetAssistantInfo(conversation);
  const geminiAssistantId = resolveAssistantConfigId(conversation) ?? undefined;

  const chatLayoutProps = {
    title: conversation.name,
    siderTitle: sliderTitle,
    sider: <ChatSider conversation={conversation} />,
    headerLeft: <GeminiModelSelector selection={modelSelection} />,
    headerExtra: (
      <div className='flex items-center gap-8px'>
        <ConversationSkillsIndicator conversation={conversation} />
        <AddSkillToChatButton conversationId={conversation.id} />
        <CronJobManager
          conversationId={conversation.id}
          cronJobId={conversation.extra?.cronJobId as string | undefined}
          conversationTitle={conversation.name}
          agentType='gemini'
        />
      </div>
    ),
    workspaceEnabled,
    backend: 'gemini' as const,
    presetAssistant: presetAssistantInfo ? { ...presetAssistantInfo, id: geminiAssistantId } : undefined,
  };

  return (
    <ChatLayout {...chatLayoutProps} conversationId={conversation.id} workspacePath={conversation.extra.workspace}>
      <GeminiChat
        conversation_id={conversation.id}
        workspace={conversation.extra.workspace}
        modelSelection={modelSelection}
        cronJobId={conversation.extra?.cronJobId as string | undefined}
        hideSendBox={hideSendBox}
        sessionMode={conversation.extra?.sessionMode}
      />
    </ChatLayout>
  );
};

type WCoreConversation = Extract<TChatConversation, { type: 'wcore' }>;

const WCoreConversationPanel: React.FC<{ conversation: WCoreConversation; sliderTitle: React.ReactNode }> = ({
  conversation,
  sliderTitle,
}) => {
  const onSelectModel = useCallback(
    async (_provider: IProvider, modelName: string) => {
      const selected = { ..._provider, useModel: modelName } as TProviderWithModel;
      // Kill running agent on model switch - will be rebuilt with new model on next message
      await ipcBridge.conversation.stop.invoke({ conversation_id: conversation.id });
      const ok = await ipcBridge.conversation.update.invoke({ id: conversation.id, updates: { model: selected } });
      return Boolean(ok);
    },
    [conversation.id]
  );

  const modelSelection = useWCoreModelSelection({
    initialModel: conversation.model,
    onSelectModel,
  });
  const workspaceEnabled = Boolean(conversation.extra?.workspace);
  const { info: presetAssistantInfo } = usePresetAssistantInfo(conversation);
  const wcoreAssistantId = resolveAssistantConfigId(conversation) ?? undefined;

  const chatLayoutProps = {
    title: conversation.name,
    siderTitle: sliderTitle,
    sider: <ChatSider conversation={conversation} />,
    headerLeft: <WCoreModelSelector selection={modelSelection} />,
    headerExtra: (
      <div className='flex items-center gap-8px'>
        <ConversationSkillsIndicator conversation={conversation} />
        <AddSkillToChatButton conversationId={conversation.id} />
        <CronJobManager
          conversationId={conversation.id}
          cronJobId={conversation.extra?.cronJobId as string | undefined}
          conversationTitle={conversation.name}
          agentType='wcore'
        />
      </div>
    ),
    workspaceEnabled,
    backend: 'wcore' as const,
    presetAssistant: presetAssistantInfo ? { ...presetAssistantInfo, id: wcoreAssistantId } : undefined,
  };

  return (
    <ChatLayout {...chatLayoutProps} conversationId={conversation.id}>
      <WCoreChat
        conversation_id={conversation.id}
        workspace={conversation.extra.workspace}
        modelSelection={modelSelection}
        sessionMode={conversation.extra?.sessionMode}
      />
    </ChatLayout>
  );
};

const ChatConversation: React.FC<{
  conversation?: TChatConversation;
  hideSendBox?: boolean;
}> = ({ conversation, hideSendBox }) => {
  const { t } = useTranslation();
  const { openPreview } = usePreviewContext();
  const location = useLocation();
  const workspaceEnabled = Boolean(conversation?.extra?.workspace);

  // Resolve workflowSessionId from router state (preferred - present on first
  // navigation) then fall back to the persisted extra field (survives refresh).
  const locationState = location.state as {
    workflowSessionId?: string;
    initialWorkflowSession?: WorkflowSession;
  } | null;
  const workflowSessionId: string | undefined =
    locationState?.workflowSessionId ??
    (conversation?.extra as { workflowSessionId?: string } | undefined)?.workflowSessionId;
  const initialWorkflowSession: WorkflowSession | undefined = locationState?.initialWorkflowSession;
  const isWorkflow = Boolean(workflowSessionId);

  // W0.3 N+1 fix (completed in W0.6): subscribe to the workflow session ONCE
  // at the conversation level and thread BOTH `workflowTotalSteps` AND
  // `applyStepMarker` through ConversationContext. Per-message
  // `WorkflowMessageBody` instances no longer mount their own
  // `useWorkflowSession` - without removing that per-message hook, the
  // mount-effect at `useWorkflowSession.ts:115-122` was still triggering N
  // `findAllActive` IPC roundtrips (one per assistant message) on first
  // render.
  const hoistedWorkflowSession = useWorkflowSession(workflowSessionId, initialWorkflowSession);
  const workflowTotalSteps: number | null = hoistedWorkflowSession.data?.total_steps ?? null;
  const workflowApplyStepMarker = hoistedWorkflowSession.applyStepMarker;

  const isGeminiConversation = conversation?.type === 'gemini';
  const isWCoreConversation = conversation?.type === 'wcore';

  // Use unified hook for preset assistant info (ACP/Codex conversations)
  const acpConversation = isGeminiConversation || isWCoreConversation ? undefined : conversation;
  const { info: presetAssistantInfo, isLoading: isLoadingPreset } = usePresetAssistantInfo(acpConversation);
  const acpAssistantId = acpConversation ? (resolveAssistantConfigId(acpConversation) ?? undefined) : undefined;

  const conversationAgentName = (conversation?.extra as { agentName?: string } | undefined)?.agentName;
  const assistantDisplayName = presetAssistantInfo?.name || conversationAgentName;

  const conversationNode = useMemo(() => {
    if (!conversation || isGeminiConversation || isWCoreConversation) return null;
    switch (conversation.type) {
      case 'acp':
        return (
          <AcpChat
            key={conversation.id}
            conversation_id={conversation.id}
            workspace={conversation.extra?.workspace}
            backend={conversation.extra?.backend || 'claude'}
            sessionMode={conversation.extra?.sessionMode}
            cachedConfigOptions={conversation.extra?.cachedConfigOptions}
            agentName={assistantDisplayName}
            cronJobId={(conversation.extra as { cronJobId?: string })?.cronJobId}
            hideSendBox={hideSendBox}
            workflowSessionId={workflowSessionId}
            workflowTotalSteps={workflowTotalSteps}
            workflowApplyStepMarker={workflowApplyStepMarker}
          ></AcpChat>
        );
      case 'codex': // Legacy: codex now uses ACP protocol
        return (
          <AcpChat
            key={conversation.id}
            conversation_id={conversation.id}
            workspace={conversation.extra?.workspace}
            backend='codex'
            agentName={assistantDisplayName}
            cachedConfigOptions={
              (
                conversation.extra as {
                  cachedConfigOptions?: import('@/common/types/acpTypes').AcpSessionConfigOption[];
                }
              )?.cachedConfigOptions
            }
            hideSendBox={hideSendBox}
            workflowSessionId={workflowSessionId}
            workflowTotalSteps={workflowTotalSteps}
            workflowApplyStepMarker={workflowApplyStepMarker}
          />
        );
      case 'openclaw-gateway':
        return (
          <OpenClawChat
            key={conversation.id}
            conversation_id={conversation.id}
            workspace={conversation.extra?.workspace}
            cronJobId={(conversation.extra as { cronJobId?: string })?.cronJobId}
          />
        );
      case 'nanobot':
        return (
          <NanobotChat
            key={conversation.id}
            conversation_id={conversation.id}
            workspace={conversation.extra?.workspace}
            cronJobId={(conversation.extra as { cronJobId?: string })?.cronJobId}
          />
        );
      case 'remote':
        return (
          <RemoteChat
            key={conversation.id}
            conversation_id={conversation.id}
            workspace={conversation.extra?.workspace}
            cronJobId={(conversation.extra as { cronJobId?: string })?.cronJobId}
          />
        );
      default:
        return null;
    }
  }, [
    conversation,
    isGeminiConversation,
    isWCoreConversation,
    assistantDisplayName,
    hideSendBox,
    workflowSessionId,
    workflowTotalSteps,
    workflowApplyStepMarker,
  ]);

  const sliderTitle = useMemo(() => {
    return (
      <div className='flex items-center justify-between'>
        <span className='text-16px font-bold text-t-primary'>{t('conversation.workspace.title')}</span>
      </div>
    );
  }, [t]);

  // For ACP/Codex conversations, use AcpModelSelector that can show/switch models.
  // For other non-Gemini conversations, show disabled GeminiModelSelector.
  // NOTE: This must be placed before the Gemini early return to maintain consistent hook order.
  const modelSelector = useMemo(() => {
    if (!conversation || isGeminiConversation || isWCoreConversation) return undefined;
    if (conversation.type === 'acp') {
      const extra = conversation.extra as { backend?: string; currentModelId?: string };
      return (
        <AcpModelSelector
          conversationId={conversation.id}
          backend={extra.backend}
          initialModelId={extra.currentModelId}
        />
      );
    }
    if (conversation.type === 'codex') {
      return <AcpModelSelector conversationId={conversation.id} />;
    }
    return <GeminiModelSelector disabled={true} />;
  }, [conversation, isGeminiConversation, isWCoreConversation]);

  // Non-workflow paths: delegate to the specialized panel components that own
  // their own ChatLayout + model selector. This path is unchanged from v0.6.0.
  if (!isWorkflow) {
    if (conversation && conversation.type === 'wcore') {
      return <WCoreConversationPanel key={conversation.id} conversation={conversation} sliderTitle={sliderTitle} />;
    }

    if (conversation && conversation.type === 'gemini') {
      return (
        <GeminiConversationPanel
          key={conversation.id}
          conversation={conversation}
          sliderTitle={sliderTitle}
          hideSendBox={hideSendBox}
        />
      );
    }
  }

  // Workflow path: build the appropriate chat node for any backend type, then
  // wrap it in WorkflowSurface inside a ChatLayout that hides the standard header.
  if (isWorkflow && workflowSessionId) {
    // For wcore workflow conversations, build a WCoreChat node directly so we
    // can pass it as children to WorkflowSurface without double-mounting ChatLayout.
    if (conversation && conversation.type === 'wcore') {
      const wcoreConv = conversation as Extract<TChatConversation, { type: 'wcore' }>;
      const wcoreChatNode = (
        <WCoreChat
          key={wcoreConv.id}
          conversation_id={wcoreConv.id}
          workspace={wcoreConv.extra.workspace}
          modelSelection={WORKFLOW_WCORE_MODEL_SELECTION}
          sessionMode={wcoreConv.extra?.sessionMode}
          workflowSessionId={workflowSessionId}
          workflowTotalSteps={workflowTotalSteps}
          workflowApplyStepMarker={workflowApplyStepMarker}
        />
      );
      return (
        <ChatLayout
          title={wcoreConv.name}
          sider={<ChatSider conversation={wcoreConv} />}
          siderTitle={sliderTitle}
          workspaceEnabled={workspaceEnabled}
          workspacePath={wcoreConv.extra.workspace}
          conversationId={wcoreConv.id}
          hideHeader={true}
        >
          <WorkflowSurface sessionId={workflowSessionId} initialSession={initialWorkflowSession}>
            {wcoreChatNode}
          </WorkflowSurface>
        </ChatLayout>
      );
    }

    // For gemini workflow conversations, build a GeminiChat node directly.
    if (conversation && conversation.type === 'gemini') {
      const geminiConv = conversation as Extract<TChatConversation, { type: 'gemini' }>;
      const geminiChatNode = (
        <GeminiChat
          key={geminiConv.id}
          conversation_id={geminiConv.id}
          workspace={geminiConv.extra.workspace}
          modelSelection={WORKFLOW_GEMINI_MODEL_SELECTION}
          cronJobId={geminiConv.extra?.cronJobId as string | undefined}
          hideSendBox={hideSendBox}
          sessionMode={geminiConv.extra?.sessionMode}
          workflowSessionId={workflowSessionId}
          workflowTotalSteps={workflowTotalSteps}
          workflowApplyStepMarker={workflowApplyStepMarker}
        />
      );
      return (
        <ChatLayout
          title={geminiConv.name}
          sider={<ChatSider conversation={geminiConv} />}
          siderTitle={sliderTitle}
          workspaceEnabled={workspaceEnabled}
          workspacePath={geminiConv.extra.workspace}
          conversationId={geminiConv.id}
          hideHeader={true}
        >
          <WorkflowSurface sessionId={workflowSessionId} initialSession={initialWorkflowSession}>
            {geminiChatNode}
          </WorkflowSurface>
        </ChatLayout>
      );
    }

    // ACP / codex / openclaw / nanobot / remote workflow conversations:
    // conversationNode was already built above via useMemo.
    return (
      <ChatLayout
        title={conversation?.name}
        sider={<ChatSider conversation={conversation} />}
        siderTitle={sliderTitle}
        workspaceEnabled={workspaceEnabled}
        workspacePath={conversation?.extra?.workspace}
        conversationId={conversation?.id}
        hideHeader={true}
      >
        <WorkflowSurface sessionId={workflowSessionId} initialSession={initialWorkflowSession}>
          {conversationNode}
        </WorkflowSurface>
      </ChatLayout>
    );
  }

  // If preset assistant info exists, use preset logo/name; while loading, avoid fallback; otherwise use backend logo
  const chatLayoutProps = presetAssistantInfo
    ? {
        presetAssistant: { ...presetAssistantInfo, id: acpAssistantId },
      }
    : isLoadingPreset
      ? {} // Still loading custom agents - avoid showing backend logo prematurely
      : {
          backend:
            conversation?.type === 'acp'
              ? conversation?.extra?.backend
              : conversation?.type === 'wcore'
                ? 'wcore'
                : conversation?.type === 'codex'
                  ? 'codex'
                  : conversation?.type === 'openclaw-gateway'
                    ? 'openclaw-gateway'
                    : conversation?.type === 'nanobot'
                      ? 'nanobot'
                      : conversation?.type === 'remote'
                        ? 'remote'
                        : undefined,
          agentName: conversationAgentName,
        };

  const headerExtraNode = (
    <div className='flex items-center gap-8px'>
      {conversation?.type === 'openclaw-gateway' && (
        <div className='shrink-0'>
          <StarOfficeMonitorCard
            conversationId={conversation.id}
            onOpenUrl={(url, metadata) => {
              openPreview(url, 'url', metadata);
            }}
          />
        </div>
      )}
      <ConversationSkillsIndicator conversation={conversation} />
      {conversation && <AddSkillToChatButton conversationId={conversation.id} />}
      {conversation && (
        <div className='shrink-0'>
          <CronJobManager
            conversationId={conversation.id}
            cronJobId={conversation.extra?.cronJobId as string | undefined}
            conversationTitle={conversation.name}
            agentType={(conversation.extra as { backend?: string } | undefined)?.backend || 'claude'}
          />
        </div>
      )}
    </div>
  );

  return (
    <ChatLayout
      title={conversation?.name}
      {...chatLayoutProps}
      headerLeft={modelSelector}
      headerExtra={headerExtraNode}
      siderTitle={sliderTitle}
      sider={<ChatSider conversation={conversation} />}
      workspaceEnabled={workspaceEnabled}
      workspacePath={conversation?.extra?.workspace}
      conversationId={conversation?.id}
    >
      {conversationNode}
    </ChatLayout>
  );
};

export default ChatConversation;
