import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import type { TChatConversation } from '@/common/config/storage';
import type { DetectedAgentKind } from '@/common/types/detectedAgent';
import { getSendBoxDraftHook } from '@renderer/hooks/chat/useSendBoxDraft';
import { getAgentLogo } from '@renderer/utils/model/agentLogo';
import { usePresetAssistantInfo } from '@renderer/hooks/agent/usePresetAssistantInfo';
import { getLucideIcon } from '@renderer/utils/lucideAvatar';
import AssistantIconTile from '@/renderer/pages/guid/components/AssistantIconTile';
import { resolveSpecialistPalette } from '@/renderer/pages/teams/components/teamPalette';

const useAcpDraft = getSendBoxDraftHook('acp', { _type: 'acp', atPath: [], content: '', uploadFile: [] });
const useGeminiDraft = getSendBoxDraftHook('gemini', { _type: 'gemini', atPath: [], content: '', uploadFile: [] });
const useOpenClawDraft = getSendBoxDraftHook('openclaw-gateway', {
  _type: 'openclaw-gateway',
  atPath: [],
  content: '',
  uploadFile: [],
});
const useNanobotDraft = getSendBoxDraftHook('nanobot', { _type: 'nanobot', atPath: [], content: '', uploadFile: [] });
const useRemoteDraft = getSendBoxDraftHook('remote', { _type: 'remote', atPath: [], content: '', uploadFile: [] });
const useWCoreDraft = getSendBoxDraftHook('wcore', { _type: 'wcore', atPath: [], content: '', uploadFile: [] });

type Props = {
  conversationId: string;
  /**
   * Differentiates the team-orchestration entry point (leader) from passive
   * specialist columns. Leaders show the "describe your goal" prompt + suggestion
   * cards; specialists show a passive "standing by" state so they don't read as
   * additional entry points and confuse the user about which column to type in.
   *
   * Default true preserves the legacy behaviour for any caller that hasn't
   * threaded the flag yet (TeamChatView always passes it).
   */
  isLeader?: boolean;
};

const SUGGESTIONS = [
  { key: 'debate', icon: '🎭' },
  { key: 'interview', icon: '🎙️' },
  { key: 'expert_review', icon: '🧠' },
];

const SUGGESTION_DEFAULTS: Record<string, string> = {
  debate: 'Organize a debate with agents taking different sides',
  interview: 'Plan an in-depth interview between agents',
  expert_review: 'Have multiple experts analyze the same problem',
};

/** Map a conversation.type onto a DetectedAgentKind so draft hooks stay exhaustive. */
const toDetectedKind = (type: TChatConversation['type']): DetectedAgentKind => {
  // Codex conversations are rendered via the ACP pipeline and share the acp draft store.
  if (type === 'codex') return 'acp';
  return type;
};

const resolveAgentTypeFromConversation = (conversation: TChatConversation): string => {
  if (conversation.type === 'acp') {
    return (conversation.extra as { backend?: string } | undefined)?.backend ?? 'acp';
  }
  if (conversation.type === 'openclaw-gateway') {
    return (conversation.extra as { backend?: string } | undefined)?.backend ?? 'openclaw-gateway';
  }
  return conversation.type;
};

const resolveAgentName = (conversation: TChatConversation, presetName: string | null): string => {
  if (presetName) return presetName;
  const extraAgentName = (conversation.extra as { agentName?: string } | undefined)?.agentName;
  if (extraAgentName && extraAgentName.trim()) return extraAgentName.trim();
  // conversation.name is typically "teamName - agentRole"
  const segments = conversation.name?.split(' - ') ?? [];
  const role = segments[segments.length - 1]?.trim();
  if (role) return role;
  return 'Leader';
};

const TeamChatEmptyState: React.FC<Props> = ({ conversationId, isLeader = true }) => {
  const { t } = useTranslation();

  // Reuse the same SWR key as AgentChatSlot so this hits cache instead of a new fetch.
  const { data: conversation } = useSWR(conversationId ? ['team-conversation', conversationId] : null, () =>
    ipcBridge.conversation.get.invoke({ id: conversationId })
  );
  const { info: presetInfo } = usePresetAssistantInfo(conversation ?? undefined);

  // Hooks must run unconditionally; the lookup below picks the right draft at call time.
  // `satisfies Record<DetectedAgentKind, ...>` keeps the map exhaustive - adding a new
  // DetectedAgentKind without wiring up a draft setter here becomes a typecheck error.
  const acpDraft = useAcpDraft(conversationId);
  const geminiDraft = useGeminiDraft(conversationId);
  const wcoreDraft = useWCoreDraft(conversationId);
  const nanobotDraft = useNanobotDraft(conversationId);
  const remoteDraft = useRemoteDraft(conversationId);
  const openClawDraft = useOpenClawDraft(conversationId);
  const setContentByKind = {
    acp: (text: string) => acpDraft.mutate((prev) => ({ ...prev, content: text })),
    gemini: (text: string) => geminiDraft.mutate((prev) => ({ ...prev, content: text })),
    wcore: (text: string) => wcoreDraft.mutate((prev) => ({ ...prev, content: text })),
    nanobot: (text: string) => nanobotDraft.mutate((prev) => ({ ...prev, content: text })),
    remote: (text: string) => remoteDraft.mutate((prev) => ({ ...prev, content: text })),
    'openclaw-gateway': (text: string) => openClawDraft.mutate((prev) => ({ ...prev, content: text })),
  } satisfies Record<DetectedAgentKind, (text: string) => void>;

  const fillDraft = useCallback(
    (text: string) => {
      if (!conversation) return;
      setContentByKind[toDetectedKind(conversation.type)](text);
    },
    [conversation, setContentByKind]
  );

  if (!conversation) return null;
  const teamId = (conversation.extra as { teamId?: string } | undefined)?.teamId?.trim();
  if (!teamId) return null;

  const agentType = resolveAgentTypeFromConversation(conversation);
  const agentName = resolveAgentName(conversation, presetInfo?.name ?? null);
  const backendLogo = getAgentLogo(agentType);
  // customAgentId on the conversation extras points to the specialist's
  // bundle id when this agent was spawned from a waylandteams launcher.
  // We don't pull the full assistant list here (would add a hook dep on
  // i18n that the rest of this component doesn't need); the resolver's
  // heuristic on the agent name is enough for the Dev Shop roles (Code /
  // Ops / Quality Gate / Counsel) and the id-based heuristics cover
  // older specialists.
  const customAgentId = (conversation.extra as { customAgentId?: string } | undefined)?.customAgentId;
  const palette = resolveSpecialistPalette(undefined, customAgentId ?? agentName);
  // 48px tile (matches the pre-fix container) lives between md (40) and
  // lg (56). Override AssistantIconTile's preset size via className so the
  // visual delta from the prior layout is zero - we only add the palette
  // colour and replace the bg-fill-2 frame.
  const tileSize = '!w-48px !h-48px !rd-8px';

  // Live-smoke fix #4a (2026-05-19): pin every avatar branch to the
  // same 48px box so the previous "huge dark blob" Sean reported on the
  // fallback path can't visually dominate the empty state.
  //
  // 2026-05-25 update: every branch is now wrapped in AssistantIconTile so
  // the per-role palette (resolveSpecialistPalette) tints the frame
  // instead of the neutral bg-fill-2. The testid stays on the tile so
  // existing assertions continue to find the avatar.
  const renderAvatar = () => {
    if (presetInfo) {
      const LucideIconComponent = getLucideIcon(presetInfo.lucideIcon);
      if (LucideIconComponent) {
        return (
          <AssistantIconTile
            paletteKey={palette}
            size='md'
            className={`${tileSize}`}
            data-testid='team-chat-empty-state-avatar'
            data-variant='lucide'
          >
            <LucideIconComponent size={28} />
          </AssistantIconTile>
        );
      }
      if (presetInfo.isEmoji) {
        return (
          <AssistantIconTile
            paletteKey={palette}
            size='md'
            className={`${tileSize} text-32px leading-none`}
            data-testid='team-chat-empty-state-avatar'
            data-variant='emoji'
          >
            {presetInfo.logo}
          </AssistantIconTile>
        );
      }
      return (
        <AssistantIconTile
          paletteKey={palette}
          size='md'
          className={tileSize}
          data-testid='team-chat-empty-state-avatar'
          data-variant='preset'
        >
          <img
            width={48}
            height={48}
            src={presetInfo.logo}
            alt={presetInfo.name}
            className='object-contain opacity-90'
          />
        </AssistantIconTile>
      );
    }
    if (backendLogo) {
      return (
        <AssistantIconTile
          paletteKey={palette}
          size='md'
          className={tileSize}
          data-testid='team-chat-empty-state-avatar'
          data-variant='backend'
        >
          <img width={48} height={48} src={backendLogo} alt={agentName} className='object-contain opacity-80' />
        </AssistantIconTile>
      );
    }
    return (
      <AssistantIconTile
        paletteKey={palette}
        size='md'
        className={`${tileSize} text-18px font-medium`}
        data-testid='team-chat-empty-state-avatar'
        data-variant='fallback'
      >
        {agentName.charAt(0).toUpperCase()}
      </AssistantIconTile>
    );
  };

  // Specialist columns get a passive "standing by" state so the user reads them
  // as observable side-channels, not entry points. The leader column is the team
  // orchestration entry point - that's where the user should type.
  if (!isLeader) {
    return (
      <div
        data-testid='team-chat-empty-state'
        data-variant='specialist'
        className='flex flex-col items-center gap-16px px-24px text-center max-w-360px opacity-90'
      >
        {renderAvatar()}
        <div className='flex flex-col gap-6px'>
          <span className='text-15px font-medium text-t-primary'>{agentName}</span>
          <span
            data-testid='team-chat-empty-state-subtitle'
            className='text-12px text-t-tertiary italic'
          >
            {t('team.emptyState.specialistStandby', {
              defaultValue: 'Standing by - the team leader handles incoming work.',
            })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid='team-chat-empty-state'
      data-variant='leader'
      className='flex flex-col items-center gap-20px px-24px text-center max-w-360px'
    >
      {renderAvatar()}
      <div className='flex flex-col gap-6px'>
        <span className='text-16px font-semibold text-t-primary'>{agentName}</span>
        <span data-testid='team-chat-empty-state-subtitle' className='text-13px text-t-secondary'>
          {t('team.emptyState.subtitle', { defaultValue: "Describe your goal and I'll get the team working on it" })}
        </span>
      </div>
      <div className='flex flex-col gap-6px w-full'>
        {SUGGESTIONS.map((s) => {
          const label = t(`team.emptyState.suggestions.${s.key}`, { defaultValue: SUGGESTION_DEFAULTS[s.key] });
          return (
            <div
              key={s.key}
              data-testid={`team-chat-empty-state-suggestion-${s.key}`}
              onClick={() => fillDraft(label)}
              className='flex items-center gap-10px px-14px py-10px rd-10px bg-fill-2 hover:bg-fill-3 cursor-pointer transition-colors text-left border border-transparent hover:border-[var(--color-border-2)]'
            >
              <span className='text-15px shrink-0'>{s.icon}</span>
              <span className='text-13px text-t-secondary'>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamChatEmptyState;
