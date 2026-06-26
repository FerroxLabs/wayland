/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { ConversationProvider } from '@/renderer/hooks/context/ConversationContext';
import type { AcpBackend } from '@/common/types/acpTypes';
import type { StepStatus, StepTransitionSource } from '@/common/types/workflowTypes';
import AcpAuthFailureCard from '@/renderer/components/activation/AcpAuthFailureCard';
import { emitter, useAddEventListener } from '@/renderer/utils/emitter';
import { FLUX_AUTO_MODEL } from '@/common/config/flux';
import { useFluxConnected } from '@/renderer/hooks/useFluxConnected';
import { routeThroughFluxAndReplay, type FluxFailoverTurn } from './acpFluxFailover';
import { copyText } from '@/renderer/utils/ui/clipboard';
import { Message } from '@arco-design/web-react';
import { getAcpAuthRemedy, type AcpAuthRemedy } from './acpAuthFailure';
import FlexFullContainer from '@renderer/components/layout/FlexFullContainer';
import MessageList from '@renderer/pages/conversation/Messages/MessageList';
import { MessageListProvider, useMessageLstCache } from '@renderer/pages/conversation/Messages/hooks';
import HOC from '@renderer/utils/ui/HOC';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ConversationChatConfirm from '../../components/ConversationChatConfirm';
import AcpSendBox from './AcpSendBox';

const AcpChat: React.FC<{
  conversation_id: string;
  workspace?: string;
  backend: AcpBackend;
  sessionMode?: string;
  cachedConfigOptions?: import('@/common/types/acpTypes').AcpSessionConfigOption[];
  agentName?: string;
  cronJobId?: string;
  hideSendBox?: boolean;
  teamId?: string;
  agentSlotId?: string;
  emptySlot?: React.ReactNode;
  workflowSessionId?: string;
  workflowTotalSteps?: number | null;
  workflowApplyStepMarker?:
    | ((stepN: number, status: StepStatus, source?: StepTransitionSource) => Promise<void>)
    | null;
}> = ({
  conversation_id,
  workspace,
  backend,
  sessionMode,
  cachedConfigOptions,
  agentName,
  cronJobId,
  hideSendBox,
  teamId,
  agentSlotId,
  emptySlot,
  workflowSessionId,
  workflowTotalSteps,
  workflowApplyStepMarker,
}) => {
  useMessageLstCache(conversation_id);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const [authRemedy, setAuthRemedy] = useState<AcpAuthRemedy | null>(null);
  // Drives the shared inline orbit (MessageList footer) so it animates while the
  // ACP agent is working, mirroring the wcore/Flux path. Fed by AcpSendBox.
  const [isProcessing, setIsProcessing] = useState(false);
  // The turn that triggered the auth-failure card, captured so the Flux failover
  // can replay it after the backend reconnects.
  const pendingTurnRef = useRef<FluxFailoverTurn | null>(null);
  // When Flux is already connected, the failover skips the browser OAuth and
  // routes straight away; only an unconnected user needs the one-click sign-in.
  const fluxConnected = useFluxConnected();

  useAddEventListener(
    'acp.auth.failed.card',
    (p) => {
      if (p.conversation_id !== conversation_id) return;
      pendingTurnRef.current =
        p.pendingInput !== undefined ? { input: p.pendingInput, files: p.pendingFiles ?? [] } : null;
      setAuthRemedy(getAcpAuthRemedy(p.backend, { fluxAlreadyRouted: p.fluxAlreadyRouted }));
    },
    [conversation_id]
  );

  // Reset the card when switching conversations.
  useEffect(() => {
    setAuthRemedy(null);
    pendingTurnRef.current = null;
  }, [conversation_id]);

  const onAddKey = useCallback(() => {
    navigate('/settings/models');
  }, [navigate]);

  const onRouteThroughFlux = useCallback(async () => {
    // Reconnect through Flux, switch this chat to flux-auto (which re-spawns the
    // backend with Flux env), then replay the turn that failed. The card is
    // cleared only on full success, so a failed switch leaves it up to retry.
    await routeThroughFluxAndReplay({
      conversationId: conversation_id,
      pendingTurn: pendingTurnRef.current,
      connectFlux: () =>
        fluxConnected ? Promise.resolve({ ok: true }) : ipcBridge.onboarding.connectFlux.invoke(),
      switchToFlux: async (cid) => {
        const res = await ipcBridge.acpConversation.setModel.invoke({ conversationId: cid, modelId: FLUX_AUTO_MODEL });
        return res.success === true;
      },
      replay: (turn) => emitter.emit('acp.flux.replay', { conversation_id, input: turn.input, files: turn.files }),
      clearCard: () => {
        pendingTurnRef.current = null;
        setAuthRemedy(null);
      },
    });
  }, [conversation_id, fluxConnected]);

  const onCliLogin = useCallback(async () => {
    if (!authRemedy?.cliLoginCmd) return;
    await copyText(authRemedy.cliLoginCmd);
    Message.success(t('conversation.acpAuthFailure.cliLogin.copied'));
  }, [authRemedy, t]);

  return (
    <ConversationProvider
      value={{
        conversationId: conversation_id,
        workspace,
        type: 'acp',
        cronJobId,
        hideSendBox,
        workflowSessionId,
        workflowTotalSteps,
        workflowApplyStepMarker,
      }}
    >
      <div className='flex-1 flex flex-col px-20px min-h-0'>
        <FlexFullContainer>
          <MessageList className='flex-1' emptySlot={emptySlot} isProcessing={isProcessing} />
        </FlexFullContainer>
        {!hideSendBox && authRemedy && (
          <div className='max-w-800px w-full mx-auto mb-12px'>
            <AcpAuthFailureCard
              remedy={authRemedy}
              onAddKey={onAddKey}
              onRouteThroughFlux={onRouteThroughFlux}
              onCliLogin={onCliLogin}
              onDismiss={() => setAuthRemedy(null)}
            />
          </div>
        )}
        {!hideSendBox && (
          <ConversationChatConfirm conversation_id={conversation_id}>
            <AcpSendBox
              conversation_id={conversation_id}
              backend={backend}
              sessionMode={sessionMode}
              cachedConfigOptions={cachedConfigOptions}
              agentName={agentName}
              workspacePath={workspace}
              teamId={teamId}
              agentSlotId={agentSlotId}
              onRunningChange={setIsProcessing}
            ></AcpSendBox>
          </ConversationChatConfirm>
        )}
      </div>
    </ConversationProvider>
  );
};

export default HOC(MessageListProvider)(AcpChat);
