import React from 'react';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import { getAgentLogo } from '@renderer/utils/model/agentLogo';
import { usePresetAssistantInfo } from '@renderer/hooks/agent/usePresetAssistantInfo';
import { getLucideIcon } from '@renderer/utils/lucideAvatar';
import AssistantIconTile, { type PaletteKey } from '@/renderer/pages/guid/components/AssistantIconTile';

type Props = {
  agentName: string;
  agentType: string;
  /** When provided, enables preset-aware avatar (emoji / custom svg) via the agent's conversation extras. */
  conversationId?: string;
  /**
   * Retained for API stability; no longer drives an inline glyph in this component.
   * The TEAM LEADER pill in `TeamPage` (and the amber accent in the right-rail roster)
   * is now the at-a-glance leader signal.
   */
  isLeader?: boolean;
  className?: string;
  logoClassName?: string;
  /** Used for emoji presets (text-based avatar) and the first-letter fallback circle. */
  avatarClassName?: string;
  nameClassName?: string;
  /** When set, wraps the avatar glyph/emoji in an AssistantIconTile so flat-fill icons stay legible on dark. */
  paletteKey?: PaletteKey;
  /** Tile size override (defaults to 'sm' = 28px when paletteKey is set). */
  tileSize?: 'sm' | 'md';
};

const TeamAgentIdentity: React.FC<Props> = ({
  agentName,
  agentType,
  conversationId,
  isLeader: _isLeader = false,
  className,
  logoClassName,
  avatarClassName,
  nameClassName,
  paletteKey,
  tileSize = 'sm',
}) => {
  // Share the SWR key with AgentChatSlot / TeamChatEmptyState so this hits cache instead of firing a fetch
  const { data: conversation } = useSWR(conversationId ? ['team-conversation', conversationId] : null, () =>
    ipcBridge.conversation.get.invoke({ id: conversationId! })
  );
  const { info: presetInfo } = usePresetAssistantInfo(conversation ?? undefined);
  const backendLogo = getAgentLogo(agentType);

  const defaultLogoClassName = 'w-16px h-16px object-contain rounded-2px opacity-80';
  const resolvedLogoClassName = logoClassName ?? defaultLogoClassName;
  const defaultAvatarClassName =
    'w-16px h-16px rounded-2px flex items-center justify-center text-12px leading-none bg-fill-2 shrink-0';
  const resolvedAvatarClassName = avatarClassName ?? defaultAvatarClassName;

  const renderAvatar = () => {
    if (presetInfo) {
      const LucideIconComponent = getLucideIcon(presetInfo.lucideIcon);
      if (LucideIconComponent) {
        return (
          <span className={resolvedAvatarClassName}>
            <LucideIconComponent size={12} className='text-[var(--color-text-2)]' />
          </span>
        );
      }
      if (presetInfo.isEmoji) {
        return <span className={resolvedAvatarClassName}>{presetInfo.logo}</span>;
      }
      return <img src={presetInfo.logo} alt={presetInfo.name} className={resolvedLogoClassName} />;
    }
    if (backendLogo) {
      return <img src={backendLogo} alt={agentType} className={resolvedLogoClassName} />;
    }
    return <span className={resolvedAvatarClassName}>{agentName.charAt(0).toUpperCase() || '🤖'}</span>;
  };

  const avatarNode = renderAvatar();
  const wrappedAvatar = paletteKey ? (
    <AssistantIconTile paletteKey={paletteKey} size={tileSize}>
      {avatarNode}
    </AssistantIconTile>
  ) : (
    avatarNode
  );

  return (
    <div className={['flex items-center gap-8px', className].filter(Boolean).join(' ')}>
      {wrappedAvatar}
      <span className={['min-w-0 flex-1 truncate', nameClassName].filter(Boolean).join(' ')}>{agentName}</span>
    </div>
  );
};

export default TeamAgentIdentity;
