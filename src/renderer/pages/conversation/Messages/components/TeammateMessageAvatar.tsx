/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import { usePresetAssistantInfo } from '@renderer/hooks/agent/usePresetAssistantInfo';
import { getLucideIcon } from '@renderer/utils/lucideAvatar';

type Props = {
  senderName: string;
  /** Sender teammate's conversation id - enables preset-aware avatar resolution via conversation extras. */
  senderConversationId?: string;
  /** Precomputed backend logo URL (fallback when no preset avatar is found). */
  backendLogo: string | null;
};

/**
 * Avatar shown next to a teammate's message bubble. Prefers the sender's preset
 * assistant icon (emoji or svg) over the generic backend logo so preset-backed
 * teammates keep their persona when messaging others.
 */
const TeammateMessageAvatar: React.FC<Props> = ({ senderName, senderConversationId, backendLogo }) => {
  // Share the SWR key with AgentChatSlot / TeamAgentIdentity so this hits cache
  // instead of firing another fetch for the same conversation.
  const { data: conversation } = useSWR(senderConversationId ? ['team-conversation', senderConversationId] : null, () =>
    ipcBridge.conversation.get.invoke({ id: senderConversationId! })
  );
  const { info: presetInfo } = usePresetAssistantInfo(conversation ?? undefined);

  if (presetInfo) {
    const LucideIconComponent = getLucideIcon(presetInfo.lucideIcon);
    if (LucideIconComponent) {
      return (
        <span className='w-20px h-20px rounded-full flex items-center justify-center bg-fill-2'>
          <LucideIconComponent size={12} className='text-[var(--color-text-2)]' />
        </span>
      );
    }
    if (presetInfo.isEmoji) {
      return (
        <span className='w-20px h-20px rounded-full flex items-center justify-center text-14px leading-none bg-fill-2'>
          {presetInfo.logo}
        </span>
      );
    }
    return <img src={presetInfo.logo} alt={presetInfo.name} className='w-20px h-20px rounded-full object-contain' />;
  }

  if (backendLogo) {
    return <img src={backendLogo} alt={senderName} className='w-20px h-20px rounded-full object-contain' />;
  }

  return (
    <div className='w-20px h-20px rounded-full bg-fill-3 flex items-center justify-center text-10px text-t-secondary font-medium'>
      {senderName.charAt(0).toUpperCase()}
    </div>
  );
};

export default TeammateMessageAvatar;
