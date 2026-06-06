/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ConversationContextValue } from '@/renderer/hooks/context/ConversationContext';
import { ConversationProvider } from '@/renderer/hooks/context/ConversationContext';
import type { StepStatus, StepTransitionSource } from '@/common/types/workflowTypes';
import FlexFullContainer from '@renderer/components/layout/FlexFullContainer';
import MessageList from '@renderer/pages/conversation/Messages/MessageList';
import { MessageListProvider, useMessageLstCache } from '@renderer/pages/conversation/Messages/hooks';
import HOC from '@renderer/utils/ui/HOC';
import React, { useEffect, useMemo } from 'react';
import LocalImageView from '@renderer/components/media/LocalImageView';
import ConversationChatConfirm from '../../components/ConversationChatConfirm';
import WCoreSendBox from './WCoreSendBox';
import type { WCoreModelSelection } from './useWCoreModelSelection';

const WCoreChat: React.FC<{
  conversation_id: string;
  workspace: string;
  modelSelection: WCoreModelSelection;
  teamId?: string;
  agentSlotId?: string;
  sessionMode?: string;
  emptySlot?: React.ReactNode;
  workflowSessionId?: string;
  workflowTotalSteps?: number | null;
  workflowApplyStepMarker?:
    | ((stepN: number, status: StepStatus, source?: StepTransitionSource) => Promise<void>)
    | null;
}> = ({
  conversation_id,
  workspace,
  modelSelection,
  teamId,
  agentSlotId,
  sessionMode,
  emptySlot,
  workflowSessionId,
  workflowTotalSteps,
  workflowApplyStepMarker,
}) => {
  useMessageLstCache(conversation_id);
  const updateLocalImage = LocalImageView.useUpdateLocalImage();
  useEffect(() => {
    updateLocalImage({ root: workspace });
  }, [workspace]);
  const conversationValue = useMemo<ConversationContextValue>(() => {
    return {
      conversationId: conversation_id,
      workspace,
      type: 'wcore',
      workflowSessionId,
      workflowTotalSteps,
      workflowApplyStepMarker,
    };
  }, [conversation_id, workspace, workflowSessionId, workflowTotalSteps, workflowApplyStepMarker]);

  return (
    <ConversationProvider value={conversationValue}>
      <div className='flex-1 flex flex-col px-20px min-h-0'>
        <FlexFullContainer>
          <MessageList className='flex-1' emptySlot={emptySlot} />
        </FlexFullContainer>
        <ConversationChatConfirm conversation_id={conversation_id}>
          <WCoreSendBox
            conversation_id={conversation_id}
            modelSelection={modelSelection}
            teamId={teamId}
            agentSlotId={agentSlotId}
            sessionMode={sessionMode}
          />
        </ConversationChatConfirm>
      </div>
    </ConversationProvider>
  );
};

export default HOC.Wrapper(MessageListProvider, LocalImageView.Provider)(WCoreChat);
