import { ChevronLeft, ChevronRight, Crown, Maximize2, Minimize2, X } from 'lucide-react';
import { Message, Modal, Spin } from '@arco-design/web-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR, { useSWRConfig } from 'swr';
import { useAuth } from '@renderer/hooks/context/AuthContext';
import { useLayoutContext } from '@renderer/hooks/context/LayoutContext';
import { ipcBridge } from '@/common';
import type { TeamAgent, TTeam } from '@/common/types/teamTypes';
import type { IProvider, TChatConversation, TProviderWithModel } from '@/common/config/storage';
import { useAssistantList } from '@/renderer/hooks/assistant';
import { resolveSpecialistPalette } from '@/renderer/pages/teams/components/teamPalette';
import type { PaletteKey } from '@/renderer/pages/guid/components/AssistantIconTile';
import ChatLayout from '@/renderer/pages/conversation/components/ChatLayout';
import ChatSider from '@/renderer/pages/conversation/components/ChatSider';
import { useTeamPendingPermissions } from './hooks/useTeamPendingPermissions';
import AcpModelSelector from '@/renderer/components/agent/AcpModelSelector';
import GeminiModelSelector from '@/renderer/pages/conversation/platforms/gemini/GeminiModelSelector';
import { useGeminiModelSelection } from '@/renderer/pages/conversation/platforms/gemini/useGeminiModelSelection';
import WCoreModelSelector from '@/renderer/pages/conversation/platforms/wcore/WCoreModelSelector';
import { useWCoreModelSelection } from '@/renderer/pages/conversation/platforms/wcore/useWCoreModelSelection';
import TeamTabs from './components/TeamTabs';
import TeamChatView from './components/TeamChatView';
import TeamAgentIdentity from './components/TeamAgentIdentity';
import TeamRightRail from './components/TeamRightRail';
import TeamActivityTab from './components/TeamActivityTab';
import TeamHeaderBadges from './components/TeamHeaderBadges';
import PromoteToStandingModal from './components/PromoteToStandingModal';
import AgentBackendPill from './components/AgentBackendPill';
import { TeamTabsProvider, useTeamTabs } from './hooks/TeamTabsContext';
import { TeamPermissionProvider } from './hooks/TeamPermissionContext';
import { useTeamSession } from './hooks/useTeamSession';
import { useTeamSourceLauncher } from './hooks/useTeamSourceLauncher';
import { useStandingEligibility } from './hooks/useStandingEligibility';
import { resolveConversationType } from './components/agentSelectUtils';
import { dispatchWorkspaceHasFilesEvent } from '@/renderer/utils/workspace/workspaceEvents';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';

type Props = {
  team: TTeam;
};

type TeamPageContentProps = {
  team: TTeam;
  onRenameTeam: (newName: string) => Promise<boolean>;
};

/** Compact Wayland Core model selector for the agent header */
const WCoreHeaderModelSelector: React.FC<{ conversationId: string; initialModel?: TProviderWithModel }> = ({
  conversationId,
  initialModel,
}) => {
  const onSelectModel = useCallback(
    async (_provider: IProvider, modelName: string) => {
      const selected = { ..._provider, useModel: modelName } as TProviderWithModel;
      const ok = await ipcBridge.conversation.update.invoke({ id: conversationId, updates: { model: selected } });
      return Boolean(ok);
    },
    [conversationId]
  );
  const modelSelection = useWCoreModelSelection({ initialModel, onSelectModel });
  return <WCoreModelSelector selection={modelSelection} conversationId={conversationId} />;
};

/** Fetches conversation for a single agent and renders TeamChatView */
const AgentChatSlot: React.FC<{
  agent: TeamAgent;
  teamId: string;
  isLeader: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onRemove?: () => void;
  /** Pre-resolved palette for the agent's tile (computed by parent so we don't re-walk the assistant list per slot). */
  palette?: PaletteKey;
}> = ({ agent, teamId, isLeader, isFullscreen = false, onToggleFullscreen, onRemove, palette }) => {
  const { t } = useTranslation();
  const { data: conversation } = useSWR(agent.conversationId ? ['team-conversation', agent.conversationId] : null, () =>
    ipcBridge.conversation.get.invoke({ id: agent.conversationId })
  );

  const isWCore = conversation?.type === 'wcore';
  const initialModelId = (conversation?.extra as { currentModelId?: string })?.currentModelId;
  const isAcpLike = agent.conversationType === 'acp' || agent.conversationType === 'codex';
  const isGemini = agent.conversationType === 'gemini';

  const geminiOnSelectModel = useCallback(
    async (_provider: IProvider, modelName: string) => {
      if (!conversation) return false;
      const selected = { ..._provider, useModel: modelName } as TProviderWithModel;
      const ok = await ipcBridge.conversation.update.invoke({ id: conversation.id, updates: { model: selected } });
      return Boolean(ok);
    },
    [conversation]
  );
  const geminiModelSelection = useGeminiModelSelection({
    initialModel:
      isGemini && conversation ? (conversation as Extract<TChatConversation, { type: 'gemini' }>).model : undefined,
    onSelectModel: geminiOnSelectModel,
  });

  return (
    <div
      className='flex flex-col h-full'
      style={
        isLeader
          ? {
              borderLeft: '3px solid var(--color-primary-6)',
              background: 'color-mix(in srgb, var(--color-primary-6) 3%, var(--color-bg-1))',
            }
          : { background: 'var(--color-bg-1)' }
      }
    >
      <div
        className='flex items-center justify-between gap-8px px-12px h-40px shrink-0 border-b border-solid border-[color:var(--border-base)] relative z-10'
        style={
          isLeader
            ? { background: 'color-mix(in srgb, var(--color-primary-6) 8%, var(--color-bg-2))' }
            : { background: 'var(--color-bg-2)' }
        }
      >
        <div className='flex items-center gap-8px min-w-0'>
          {/* v0.6.2.2 Fix E2 - TEAM LEADER pill relocated out of this header.
              The header was overcrowded with the orange pill + identity +
              backend swap + model selector + maximize icon all fighting for
              ~400px of column width. The pill now renders as a slim banner
              inside the chat area (below this header) for leader columns
              only - see "team-leader-banner" mount further down. */}
          <TeamAgentIdentity
            agentName={agent.agentName}
            agentType={agent.agentType}
            conversationId={agent.conversationId}
            isLeader={isLeader}
            className='min-w-0'
            nameClassName='text-13px text-[color:var(--color-text-2)] font-medium'
            paletteKey={palette}
          />
        </div>
        <div className='flex items-center gap-8px shrink-0'>
          {/* Live-smoke fix #4b (2026-05-19) - per-agent backend swap.
              Hides itself when fewer than 2 backends are installed and
              surfaces same-conversationType-only constraints via toast. */}
          <AgentBackendPill teamId={teamId} slotId={agent.slotId} agentType={agent.agentType} />
          {agent.conversationId && !isWCore && isAcpLike && (
            <div className='min-w-0 max-w-140px [&_button]:max-w-full [&_button_span]:truncate'>
              <AcpModelSelector
                key={agent.conversationId}
                conversationId={agent.conversationId}
                backend={agent.agentType}
                initialModelId={initialModelId}
              />
            </div>
          )}
          {agent.conversationId && isGemini && (
            <div className='min-w-0 max-w-140px [&_button]:max-w-full [&_button_span]:truncate'>
              <GeminiModelSelector selection={geminiModelSelection} />
            </div>
          )}
          {isWCore && agent.conversationId && (
            <div className='min-w-0 max-w-140px [&_button]:max-w-full [&_button_span]:truncate'>
              <WCoreHeaderModelSelector
                key={agent.conversationId}
                conversationId={agent.conversationId}
                initialModel={conversation?.model as TProviderWithModel | undefined}
              />
            </div>
          )}
          {!isLeader && onRemove && (
            <div
              className='shrink-0 cursor-pointer hover:bg-[var(--color-fill-3)] p-4px rd-4px text-[color:var(--color-text-3)] hover:text-[color:var(--color-danger-6)] transition-colors'
              onClick={onRemove}
            >
              <X size={16} />
            </div>
          )}
          <div
            className='shrink-0 cursor-pointer hover:bg-[var(--color-fill-3)] p-4px rd-4px text-[color:var(--color-text-3)] hover:text-[color:var(--color-text-1)] transition-colors'
            onClick={() => onToggleFullscreen?.()}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </div>
        </div>
      </div>
      <div className='relative flex flex-col flex-1 min-h-0'>
        {isLeader && (
          <div
            data-testid='team-leader-banner'
            className='flex items-center justify-center gap-6px shrink-0 px-12px py-4px text-9.5px font-semibold uppercase tracking-wider border-b border-solid border-[color:var(--border-base)]'
            style={{
              background: 'color-mix(in srgb, var(--color-primary-6) 8%, var(--color-bg-1))',
              color: 'rgb(245,158,11)',
              letterSpacing: '0.06em',
            }}
            aria-label={t('teams.teamLeader', { defaultValue: 'Team Leader' })}
          >
            <Crown size={10} aria-hidden='true' />
            <span>{t('teams.teamLeader', { defaultValue: 'Team Leader' })}</span>
          </div>
        )}
        {conversation ? (
          <TeamChatView
            conversation={conversation as TChatConversation}
            teamId={teamId}
            agentSlotId={isLeader ? undefined : agent.slotId}
            agentName={agent.agentName}
          />
        ) : (
          <div className='flex flex-1 items-center justify-center'>
            <Spin loading />
          </div>
        )}
      </div>
    </div>
  );
};

/** Inner component that reads active tab from context and renders the chat layout */
const TeamPageContent: React.FC<TeamPageContentProps> = ({ team, onRenameTeam }) => {
  const { t } = useTranslation();
  const { agents, activeSlotId, statusMap, switchTab } = useTeamTabs();
  // Narrow viewports (mobile + small windows) can't fit the side-by-side agent
  // columns (each has a 400px floor), so they horizontally overflow/cram. On
  // narrow, show one agent pane full-width and let the top tabs switch agents.
  const layout = useLayoutContext();
  const isNarrow = !!layout?.isNarrow;
  const [, messageContext] = Message.useMessage({ maxCount: 1 });
  // Resolve specialist palettes for each slot so AgentChatSlot can color its
  // identity tile from the same source the launcher uses (keeps a specialist's
  // tile hue stable from launchpad → roster → pane header).
  const { assistants } = useAssistantList();
  const paletteBySlotId = useMemo(() => {
    const map = new Map<string, PaletteKey>();
    for (const agent of agents) {
      const spec = agent.customAgentId ? assistants.find((a) => a.id === agent.customAgentId) : undefined;
      const palette = resolveSpecialistPalette(spec, agent.customAgentId ?? agent.agentName);
      if (palette) map.set(agent.slotId, palette);
    }
    return map;
  }, [agents, assistants]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const agentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [fullscreenSlotId, setFullscreenSlotId] = useState<string | null>(null);
  // W2c - chat vs activity view. Activity tab is mutually exclusive with the
  // agent tabs; clicking an agent tab snaps back to chat.
  const [viewMode, setViewMode] = useState<'chat' | 'activity'>('chat');

  // W2c - best-effort lookup of the bundle launcher this team was spawned
  // from. Used for header Standing badge + right-rail rituals.
  const { launcher } = useTeamSourceLauncher(team);

  const activeAgent = agents.find((a) => a.slotId === activeSlotId);
  const leadAgent = agents.find((a) => a.role === 'leader');

  const doRemoveAgent = useCallback(
    async (slotId: string) => {
      try {
        await ipcBridge.team.removeAgent.invoke({ teamId: team.id, slotId });
        Message.success(t('common.deleteSuccess'));
        // Only switch tab when removing the currently active tab
        if (slotId === activeSlotId && leadAgent?.slotId) switchTab(leadAgent.slotId);
        if (fullscreenSlotId === slotId) setFullscreenSlotId(null);
      } catch (error) {
        console.error('Failed to remove agent:', error);
        Message.error(String(error));
      }
    },
    [team.id, activeSlotId, leadAgent?.slotId, switchTab, fullscreenSlotId, t]
  );

  const handleRemoveAgent = useCallback(
    (slotId: string) => {
      const status = statusMap.get(slotId)?.status;
      if (status === 'active') {
        Modal.confirm({
          title: t('team.removeAgent.confirmTitle'),
          content: t('team.removeAgent.confirmContent'),
          okText: t('common.remove', { defaultValue: 'Remove' }),
          cancelText: t('common.cancel', { defaultValue: 'Cancel' }),
          onOk: () => doRemoveAgent(slotId),
        });
      } else {
        void doRemoveAgent(slotId);
      }
    },
    [statusMap, doRemoveAgent, t]
  );

  // W3a - right-rail + Add teammate. The picker hands the chosen specialist
  // up to this handler; we build the agent payload using the specialist's
  // preferred backend (preset agent type) and fall back to the leader's
  // backend so unknown specialists still get a sensible default. The
  // `agentSpawned` IPC subscription in useTeamSession refreshes the tabs.
  const handleAddTeammate = useCallback(
    async (specialist: AssistantListItem) => {
      const leaderAgentType = leadAgent?.agentType ?? 'claude';
      const agentType =
        ('presetAgentType' in specialist && (specialist as { presetAgentType?: string }).presetAgentType) ||
        leaderAgentType;
      const agentName = specialist.nameI18n?.['en-US'] || specialist.name || specialist.id;
      try {
        const result = (await ipcBridge.team.addAgent.invoke({
          teamId: team.id,
          agent: {
            conversationId: '',
            role: 'teammate',
            agentType,
            agentName,
            conversationType: resolveConversationType(agentType),
            status: 'pending',
            customAgentId: specialist.id,
          },
        })) as TeamAgent | { __bridgeError: true; message?: string };
        if (result && typeof result === 'object' && '__bridgeError' in result) {
          Message.error(
            result.message ?? t('teams.rightRail.addTeammateError', { defaultValue: 'Failed to add teammate' })
          );
          return;
        }
        Message.success(t('teams.rightRail.addTeammateSuccess', { defaultValue: 'Teammate added' }));
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        Message.error(msg || t('teams.rightRail.addTeammateError', { defaultValue: 'Failed to add teammate' }));
      }
    },
    [team.id, leadAgent?.agentType, t]
  );
  const leaderConversationId = leadAgent?.conversationId ?? '';
  const isLeaderAgent = activeAgent?.role === 'leader';
  const allConversationIds = useMemo(() => agents.map((a) => a.conversationId).filter(Boolean), [agents]);

  // Fetch leader agent's conversation for the workspace sider
  const { data: dispatchConversation } = useSWR(
    leadAgent?.conversationId ? ['team-conversation', leadAgent.conversationId] : null,
    () => ipcBridge.conversation.get.invoke({ id: leadAgent!.conversationId })
  );

  // Use team workspace if specified, otherwise fall back to leader agent's conversation workspace (temp workspace)
  const effectiveWorkspace = team.workspace || (dispatchConversation?.extra as { workspace?: string })?.workspace || '';
  const workspaceEnabled = Boolean(effectiveWorkspace);

  // Auto-expand workspace panel on mount when workspace is available
  useEffect(() => {
    if (workspaceEnabled && leadAgent?.conversationId) {
      dispatchWorkspaceHasFilesEvent(true, leadAgent.conversationId);
    }
  }, [workspaceEnabled, leadAgent?.conversationId]);

  const siderTitle = useMemo(
    () => (
      <div className='flex items-center justify-between'>
        <span className='text-16px font-bold text-t-primary'>{t('conversation.workspace.title')}</span>
      </div>
    ),
    [t]
  );

  const sider = useMemo(() => {
    if (!workspaceEnabled || !dispatchConversation) return <div />;
    return <ChatSider conversation={dispatchConversation} teamId={team.id} />;
  }, [workspaceEnabled, dispatchConversation, team.id]);

  const updateScrollArrows = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const hasOverflow = container.scrollWidth > container.clientWidth + 1;
    setShowLeftArrow(hasOverflow && container.scrollLeft > 10);
    setShowRightArrow(hasOverflow && container.scrollLeft + container.clientWidth < container.scrollWidth - 10);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', updateScrollArrows, { passive: true });
    window.addEventListener('resize', updateScrollArrows);
    const observer = new ResizeObserver(updateScrollArrows);
    observer.observe(container);
    updateScrollArrows();
    return () => {
      container.removeEventListener('scroll', updateScrollArrows);
      window.removeEventListener('resize', updateScrollArrows);
      observer.disconnect();
    };
  }, [updateScrollArrows]);

  const handleTabClick = useCallback(
    (slotId: string) => {
      // W2c - clicking an agent tab always exits Activity view.
      setViewMode('chat');
      switchTab(slotId);
      if (fullscreenSlotId) setFullscreenSlotId(slotId);
      requestAnimationFrame(() => {
        const el = agentRefs.current[slotId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
          // Flash: opacity 1→0→1
          setTimeout(() => {
            el.style.transition = 'opacity 150ms ease-out';
            el.style.opacity = '0';
            setTimeout(() => {
              el.style.transition = 'opacity 150ms ease-in';
              el.style.opacity = '1';
              setTimeout(() => {
                el.style.transition = '';
              }, 200);
            }, 150);
          }, 200);
        }
      });
    },
    [switchTab, fullscreenSlotId]
  );

  const scrollToPrev = useCallback(() => {
    const idx = agents.findIndex((a) => a.slotId === activeSlotId);
    const target = idx > 0 ? idx - 1 : 0;
    if (agents[target]) handleTabClick(agents[target].slotId);
  }, [agents, activeSlotId, handleTabClick]);

  const scrollToNext = useCallback(() => {
    const idx = agents.findIndex((a) => a.slotId === activeSlotId);
    const target = idx >= 0 && idx < agents.length - 1 ? idx + 1 : 0;
    if (agents[target]) handleTabClick(agents[target].slotId);
  }, [agents, activeSlotId, handleTabClick]);

  // Every time the page mounts, scroll + flash the active tab
  useEffect(() => {
    if (activeSlotId && agents.length > 0) {
      const timer = setTimeout(() => {
        const el = agentRefs.current[activeSlotId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
          setTimeout(() => {
            el.style.transition = 'opacity 150ms ease-out';
            el.style.opacity = '0';
            setTimeout(() => {
              el.style.transition = 'opacity 150ms ease-in';
              el.style.opacity = '1';
              setTimeout(() => {
                el.style.transition = '';
              }, 200);
            }, 150);
          }, 200);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []); // empty deps = only on mount

  // Track pending permission confirmation counts per agent (requirements 5, 6, 7, 8)
  const { pendingCounts } = useTeamPendingPermissions(team.id, allConversationIds);

  // Build slotId → pendingCount map for tab badge display
  const slotPendingCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const agent of agents) {
      if (agent.conversationId) {
        map.set(agent.slotId, pendingCounts[agent.conversationId] ?? 0);
      }
    }
    return map;
  }, [agents, pendingCounts]);

  const tabsSlot = useMemo(
    () => (
      <TeamTabs
        onTabClick={handleTabClick}
        pendingCounts={slotPendingCounts}
        paletteBySlotId={paletteBySlotId}
        showActivityTab
        activityActive={viewMode === 'activity'}
        onActivityClick={() => setViewMode('activity')}
      />
    ),
    [handleTabClick, slotPendingCounts, paletteBySlotId, viewMode]
  );

  // W3b - Standing-promotion state: eligibility predicate + modal visibility +
  // pending IPC flag. The promote/demote handlers are intentionally thin -
  // service-side methods are idempotent and emit listChanged('standing_changed')
  // which the page-level subscription picks up to refresh the team record.
  const eligibility = useStandingEligibility(team);
  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [promoteLoading, setPromoteLoading] = useState(false);

  const handlePromoteClick = useCallback(() => setPromoteModalVisible(true), []);
  const handlePromoteCancel = useCallback(() => setPromoteModalVisible(false), []);

  const handlePromoteConfirm = useCallback(async () => {
    setPromoteLoading(true);
    try {
      const result = (await ipcBridge.team.promoteToStanding.invoke({ teamId: team.id })) as void | {
        __bridgeError: true;
        message?: string;
      };
      if (result && typeof result === 'object' && '__bridgeError' in result) {
        Message.error(result.message ?? t('teams.standing.promoteError', { defaultValue: 'Failed to promote team' }));
        return;
      }
      Message.success(t('teams.standing.promoteSuccess', { defaultValue: 'Team promoted to Standing' }));
      setPromoteModalVisible(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Message.error(msg || t('teams.standing.promoteError', { defaultValue: 'Failed to promote team' }));
    } finally {
      setPromoteLoading(false);
    }
  }, [team.id, t]);

  const handleDemote = useCallback(async () => {
    try {
      const result = (await ipcBridge.team.demoteFromStanding.invoke({ teamId: team.id })) as void | {
        __bridgeError: true;
        message?: string;
      };
      if (result && typeof result === 'object' && '__bridgeError' in result) {
        Message.error(result.message ?? t('teams.standing.demoteError', { defaultValue: 'Failed to demote team' }));
        return;
      }
      Message.success(t('teams.standing.demoteSuccess', { defaultValue: 'Team demoted to regular' }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Message.error(msg || t('teams.standing.demoteError', { defaultValue: 'Failed to demote team' }));
    }
  }, [team.id, t]);

  // W2c - header extras: Standing badge + backend rollup. We keep the
  // title slot as the raw `team.name` string so the inline rename flow
  // (useTitleRename → canRenameTitle requires a string title) keeps
  // working unchanged. W3b adds the Promote CTA + Demote action.
  const headerExtra = useMemo(
    () => (
      <TeamHeaderBadges
        agents={agents}
        launcher={launcher}
        team={team}
        eligibility={eligibility}
        onPromoteClick={handlePromoteClick}
        onDemote={handleDemote}
      />
    ),
    [agents, launcher, team, eligibility, handlePromoteClick, handleDemote]
  );

  return (
    <TeamPermissionProvider
      teamId={team.id}
      isLeaderAgent={isLeaderAgent}
      leaderConversationId={leaderConversationId}
      allConversationIds={allConversationIds}
    >
      {messageContext}
      <ChatLayout
        title={team.name}
        siderTitle={siderTitle}
        sider={sider}
        workspaceEnabled={workspaceEnabled}
        tabsSlot={tabsSlot}
        headerExtra={headerExtra}
        conversationId={activeAgent?.conversationId}
        agentName={undefined}
        workspacePath={effectiveWorkspace}
        onRenameTitle={onRenameTeam}
      >
        <div className='relative flex h-full'>
          <div className='relative flex flex-1 min-w-0 h-full'>
            {viewMode === 'activity' ? (
              <div className='flex flex-1 min-w-0 flex-col'>
                <TeamActivityTab teamId={team.id} />
              </div>
            ) : fullscreenSlotId ? (
              // Fullscreen: single agent fills the entire content area
              (() => {
                const agent = agents.find((a) => a.slotId === fullscreenSlotId);
                if (!agent) return null;
                const isLeaderSlot = agent.slotId === leadAgent?.slotId;
                return (
                  <div className='flex-1 h-full'>
                    <AgentChatSlot
                      agent={agent}
                      teamId={team.id}
                      isLeader={isLeaderSlot}
                      isFullscreen
                      onToggleFullscreen={() => setFullscreenSlotId(null)}
                      onRemove={() => handleRemoveAgent(agent.slotId)}
                      palette={paletteBySlotId.get(agent.slotId)}
                    />
                  </div>
                );
              })()
            ) : isNarrow ? (
              // Narrow: a single full-width agent pane; the top tabs switch which
              // agent is shown (no side-by-side columns, no horizontal overflow).
              (() => {
                const agent = activeAgent ?? agents[0];
                if (!agent) return null;
                const isLeaderSlot = agent.slotId === leadAgent?.slotId;
                return (
                  <div className='flex-1 min-w-0 h-full'>
                    <AgentChatSlot
                      agent={agent}
                      teamId={team.id}
                      isLeader={isLeaderSlot}
                      onToggleFullscreen={() => setFullscreenSlotId(agent.slotId)}
                      onRemove={() => handleRemoveAgent(agent.slotId)}
                      palette={paletteBySlotId.get(agent.slotId)}
                    />
                  </div>
                );
              })()
            ) : (
              <>
                {showLeftArrow && (
                  <div
                    className='absolute left-0 top-0 bottom-0 w-48px z-20 flex items-center justify-center cursor-pointer opacity-80 hover:opacity-100 transition-opacity'
                    style={{ background: 'linear-gradient(90deg, var(--color-bg-1) 40%, transparent)' }}
                    onClick={scrollToPrev}
                  >
                    <div
                      className='w-32px h-32px rd-full flex items-center justify-center'
                      style={{ background: 'rgba(0,0,0,0.5)', lineHeight: 0 }}
                    >
                      <ChevronLeft size={24} color='#fff' />
                    </div>
                  </div>
                )}
                <div
                  ref={scrollContainerRef}
                  className='flex h-full w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none]'
                  style={{ scrollSnapType: 'x proximity' }}
                >
                  {agents.map((agent) => {
                    const isSingle = agents.length <= 2;
                    const isLeaderSlot = agent.slotId === leadAgent?.slotId;
                    return (
                      <div
                        key={agent.slotId}
                        ref={(el) => {
                          agentRefs.current[agent.slotId] = el;
                        }}
                        className='relative h-full border-r border-solid border-[color:var(--border-base)]'
                        style={{
                          // Always flex-grow to fill available space; each slot starts at 400px
                          // basis so the layout is stable, but spare room is distributed evenly
                          // instead of leaving empty gaps to the right. When the team is wider
                          // than the viewport we preserve the 400px floor (prevents shrinking
                          // into unreadable cards) so horizontal scroll kicks in naturally.
                          flex: '1 1 400px',
                          minWidth: isSingle ? '240px' : '400px',
                          scrollSnapAlign: 'start',
                        }}
                      >
                        <AgentChatSlot
                          agent={agent}
                          teamId={team.id}
                          isLeader={isLeaderSlot}
                          onToggleFullscreen={() => setFullscreenSlotId(agent.slotId)}
                          onRemove={() => handleRemoveAgent(agent.slotId)}
                          palette={paletteBySlotId.get(agent.slotId)}
                        />
                      </div>
                    );
                  })}
                </div>
                {showRightArrow && (
                  <div
                    className='absolute right-0 top-0 bottom-0 w-48px z-20 flex items-center justify-center cursor-pointer opacity-80 hover:opacity-100 transition-opacity'
                    style={{ background: 'linear-gradient(270deg, var(--color-bg-1) 40%, transparent)' }}
                    onClick={scrollToNext}
                  >
                    <div
                      className='w-32px h-32px rd-full flex items-center justify-center'
                      style={{ background: 'rgba(0,0,0,0.5)', lineHeight: 0 }}
                    >
                      <ChevronRight size={24} color='#fff' />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <TeamRightRail
            agents={agents}
            statusMap={statusMap}
            launcher={launcher}
            workspacePath={effectiveWorkspace}
            teamId={team.id}
            onTeammateAdded={handleAddTeammate}
          />
        </div>
        <PromoteToStandingModal
          visible={promoteModalVisible}
          teamName={team.name}
          onConfirm={handlePromoteConfirm}
          onCancel={handlePromoteCancel}
          loading={promoteLoading}
        />
      </ChatLayout>
    </TeamPermissionProvider>
  );
};

const TeamPage: React.FC<Props> = ({ team }) => {
  const { t } = useTranslation();
  const { statusMap, renameAgent, removeAgent, mutateTeam } = useTeamSession(team);
  const { user } = useAuth();
  const { mutate: globalMutate } = useSWRConfig();
  const defaultSlotId = team.agents[0]?.slotId ?? '';

  const handleRemoveAgentWithConfirm = useCallback(
    (slotId: string) => {
      const doRemove = async () => {
        try {
          await removeAgent(slotId);
          Message.success(t('common.deleteSuccess'));
        } catch (error) {
          Message.error(String(error));
        }
      };
      const status = statusMap.get(slotId)?.status;
      if (status === 'active') {
        Modal.confirm({
          title: t('team.removeAgent.confirmTitle'),
          content: t('team.removeAgent.confirmContent'),
          okText: t('common.remove', { defaultValue: 'Remove' }),
          cancelText: t('common.cancel', { defaultValue: 'Cancel' }),
          onOk: doRemove,
        });
      } else {
        void doRemove();
      }
    },
    [statusMap, removeAgent, t]
  );

  const handleRenameTeam = useCallback(
    async (newName: string): Promise<boolean> => {
      try {
        await ipcBridge.team.renameTeam.invoke({ id: team.id, name: newName });
        await mutateTeam();
        await globalMutate(`teams/${user?.id ?? 'system_default_user'}`);
        return true;
      } catch (error) {
        console.error('Failed to rename team:', error);
        return false;
      }
    },
    [team.id, mutateTeam, globalMutate, user]
  );

  return (
    <TeamTabsProvider
      agents={team.agents}
      statusMap={statusMap}
      defaultActiveSlotId={defaultSlotId}
      teamId={team.id}
      renameAgent={renameAgent}
      removeAgent={handleRemoveAgentWithConfirm}
    >
      <TeamPageContent team={team} onRenameTeam={handleRenameTeam} />
    </TeamTabsProvider>
  );
};

export default TeamPage;
