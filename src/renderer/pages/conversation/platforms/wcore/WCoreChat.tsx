/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { ConversationContextValue } from '@/renderer/hooks/context/ConversationContext';
import { ConversationProvider } from '@/renderer/hooks/context/ConversationContext';
import type { StepStatus, StepTransitionSource } from '@/common/types/workflowTypes';
import ActivationCard from '@renderer/components/activation/ActivationCard';
import AcpAuthFailureCard from '@renderer/components/activation/AcpAuthFailureCard';
import CuaPermissionCard from '@renderer/components/activation/CuaPermissionCard';
import FlexFullContainer from '@renderer/components/layout/FlexFullContainer';
import { useProviderReadiness } from '@renderer/hooks/useProviderReadiness';
import { ModelRegistryProvider } from '@renderer/hooks/useModelRegistry';
import MessageList from '@renderer/pages/conversation/Messages/MessageList';
import { MessageListProvider, useMessageLstCache } from '@renderer/pages/conversation/Messages/hooks';
import { getAcpAuthRemedy, type AcpAuthRemedy } from '@renderer/pages/conversation/platforms/acp/acpAuthFailure';
import {
  routeThroughFluxAndReplay,
  type FluxFailoverTurn,
} from '@renderer/pages/conversation/platforms/acp/acpFluxFailover';
import { useFluxConnected } from '@renderer/hooks/useFluxConnected';
import { FLUX_AUTO_MODEL, isFluxModelId } from '@/common/config/flux';
import type { TProviderWithModel } from '@/common/config/storage';
import { emitter, useAddEventListener } from '@renderer/utils/emitter';
import HOC from '@renderer/utils/ui/HOC';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocalImageView from '@renderer/components/media/LocalImageView';
import ConversationChatConfirm from '../../components/ConversationChatConfirm';
import WCoreSendBox from './WCoreSendBox';
import WCoreContextCeilingCard from './WCoreContextCeilingCard';
import WCoreConstitutionLockedCard from './WCoreConstitutionLockedCard';
import type { WCoreModelSelection } from './useWCoreModelSelection';
import ExecutionSpine from '../../components/ExecutionSpine';

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
  projectId?: string;
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
  projectId,
}) => {
  useMessageLstCache(conversation_id);
  const navigate = useNavigate();
  const readiness = useProviderReadiness();
  // #252 rework: the orbit "thinking" indicator renders inline at the END of the
  // message list (under the last block). The sendbox owns the `running` signal,
  // so it reports it up here and we pass it to MessageList.
  const [isProcessing, setIsProcessing] = useState(false);

  // Auth-failure remedy card: shown above the send box when the engine reports a
  // provider key rejection (401). Built from the failing provider's label so the
  // remedy can offer to re-key that specific provider. The main process also
  // flips the provider off "connected" (WCoreManager).
  const [authRemedy, setAuthRemedy] = useState<AcpAuthRemedy | null>(null);
  // The turn that triggered the card, captured so the Flux failover can replay it.
  const pendingTurnRef = useRef<FluxFailoverTurn | null>(null);
  const fluxConnected = useFluxConnected();
  useAddEventListener(
    'wcore.auth.failed.card',
    (p) => {
      if (p.conversation_id !== conversation_id) return;
      pendingTurnRef.current =
        p.pendingInput !== undefined ? { input: p.pendingInput, files: p.pendingFiles ?? [] } : null;
      setAuthRemedy(
        getAcpAuthRemedy('wcore', {
          ...(p.providerLabel ? { providerKeyLabel: p.providerLabel } : {}),
          fluxAlreadyRouted: p.fluxAlreadyRouted,
        })
      );
    },
    [conversation_id]
  );
  // Context-window-ceiling remedy card (#615): shown above the send box when the
  // engine stops a run because the request exceeded the model's context window
  // and compaction could not shrink it. Leads with a one-click model switch (to a
  // larger-context model) and a retry of the failed turn.
  const [ceilingRemedy, setCeilingRemedy] = useState<{ model?: string; rawError?: string } | null>(null);
  const pendingCeilingTurnRef = useRef<FluxFailoverTurn | null>(null);
  useAddEventListener(
    'wcore.context.ceiling.card',
    (p) => {
      if (p.conversation_id !== conversation_id) return;
      pendingCeilingTurnRef.current =
        p.pendingInput !== undefined ? { input: p.pendingInput, files: p.pendingFiles ?? [] } : null;
      setCeilingRemedy({ model: p.model, rawError: p.rawError });
    },
    [conversation_id]
  );
  const onCeilingRetry = useCallback(() => {
    const turn = pendingCeilingTurnRef.current;
    if (turn) {
      emitter.emit('wcore.context.retry', { conversation_id, input: turn.input, files: turn.files });
    }
    pendingCeilingTurnRef.current = null;
    setCeilingRemedy(null);
  }, [conversation_id]);
  // Locked-Constitution remedy card: shown when a turn could not start because
  // the Constitution revision authority on this machine cannot be unlocked. Its
  // one action opens the Constitution recovery flow that already lives in
  // Settings; the encrypted authority itself is never touched from here.
  const [constitutionLocked, setConstitutionLocked] = useState<{ rawError?: string } | null>(null);
  useAddEventListener(
    'wcore.constitution.locked.card',
    (p) => {
      if (p.conversation_id !== conversation_id) return;
      setConstitutionLocked({ rawError: p.rawError });
    },
    [conversation_id]
  );
  const goToConstitutionRecovery = useCallback(() => navigate('/settings/constitution'), [navigate]);
  // #466: Computer-Use permission onboarding. WCoreSendBox emits the engine's
  // `computer_use` capability; we prime the macOS permission card only while CUA
  // is available (the card itself stays null unless a grant is actually missing).
  const [hasCuaCapability, setHasCuaCapability] = useState(false);
  const [cuaCardDismissed, setCuaCardDismissed] = useState(false);
  useAddEventListener(
    'wcore.cua.capability',
    (p) => {
      if (p.conversation_id !== conversation_id) return;
      setHasCuaCapability(p.hasCua);
    },
    [conversation_id]
  );
  // Reset the cards when switching conversations.
  useEffect(() => {
    setAuthRemedy(null);
    pendingTurnRef.current = null;
    setCeilingRemedy(null);
    pendingCeilingTurnRef.current = null;
    setConstitutionLocked(null);
    setHasCuaCapability(false);
    setCuaCardDismissed(false);
  }, [conversation_id]);
  // Wake-the-engine call to action: shown inline above the send box whenever no
  // working inference provider is configured (WS-4). A held first message
  // auto-fires once a provider connects.
  const engineAsleep = !readiness.ready && !readiness.loading;
  const handleConnectFlux = useCallback(() => {
    // Fire-and-forget: the one-click PKCE flow runs in main; on success the model
    // registry emits listChanged, readiness flips, the card unmounts, and the
    // held message auto-fires from WCoreSendBox.
    void ipcBridge.onboarding.connectFlux.invoke();
  }, []);
  const goToModels = useCallback(() => navigate('/settings/models'), [navigate]);
  const onAuthRouteThroughFlux = useCallback(async () => {
    // Reconnect through Flux, persist the conversation's model as flux-auto (which
    // rebuilds the engine with the Flux spawn on the next send), then replay the
    // failed turn. The card clears only on full success.
    await routeThroughFluxAndReplay({
      conversationId: conversation_id,
      pendingTurn: pendingTurnRef.current,
      connectFlux: () => (fluxConnected ? Promise.resolve({ ok: true }) : ipcBridge.onboarding.connectFlux.invoke()),
      switchToFlux: async (cid) => {
        // The Flux provider in model.config carries an opaque id, so match it by
        // its flux-* model catalog, not a fixed id. Persisting this provider with
        // useModel=flux-auto is the same shape getDefaultWCoreModel produces; the
        // main process resolves the Flux base URL + key at spawn.
        const cfg = await ipcBridge.mode.getModelConfig.invoke();
        const fluxProvider = (Array.isArray(cfg) ? cfg : []).find((p) => (p.model ?? []).some((m) => isFluxModelId(m)));
        if (!fluxProvider) return false;
        const fluxModel = { ...fluxProvider, useModel: FLUX_AUTO_MODEL } as TProviderWithModel;
        // Mirror the model picker: stop the running engine, then persist the Flux
        // model. The update must settle before replay so the rebuild reads it.
        await ipcBridge.conversation.stop.invoke({ conversation_id: cid });
        const ok = await ipcBridge.conversation.update.invoke({ id: cid, updates: { model: fluxModel } });
        return Boolean(ok);
      },
      replay: (turn) => emitter.emit('wcore.flux.replay', { conversation_id, input: turn.input, files: turn.files }),
      clearCard: () => {
        pendingTurnRef.current = null;
        setAuthRemedy(null);
      },
    });
  }, [conversation_id, fluxConnected]);
  const updateLocalImage = LocalImageView.useUpdateLocalImage();
  useEffect(() => {
    updateLocalImage({ root: workspace });
  }, [workspace]);

  // Workbench sections are registered by ExecutionSpine, which every platform
  // chat renders inside this same MessageListProvider. Registering one here
  // would make it exclusive to wcore: Claude Code, Codex and Gemini would get
  // no such surface at all.
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
      <ExecutionSpine
        backend='wcore'
        conversationId={conversation_id}
        workspaceId={workspace || conversation_id}
        projectId={projectId}
        agentId='wcore'
      >
        <div className='flex-1 flex relative min-h-0'>
          <div className='flex flex-1 flex-col px-20px min-h-0 min-w-0'>
            <FlexFullContainer>
              <MessageList className='flex-1' emptySlot={emptySlot} isProcessing={isProcessing} />
            </FlexFullContainer>
            {engineAsleep && (
              <div className='max-w-800px w-full mx-auto mb-8px'>
                <ActivationCard
                  onConnectFlux={handleConnectFlux}
                  onUseOwnKey={goToModels}
                  onUseClaudeCode={goToModels}
                />
              </div>
            )}
            {authRemedy && (
              <div className='max-w-800px w-full mx-auto mb-12px'>
                <AcpAuthFailureCard
                  remedy={authRemedy}
                  onAddKey={goToModels}
                  onRouteThroughFlux={onAuthRouteThroughFlux}
                  onDismiss={() => setAuthRemedy(null)}
                />
              </div>
            )}
            {ceilingRemedy && (
              <div className='max-w-800px w-full mx-auto mb-12px'>
                <WCoreContextCeilingCard
                  conversationId={conversation_id}
                  modelSelection={modelSelection}
                  model={ceilingRemedy.model}
                  rawError={ceilingRemedy.rawError}
                  onRetry={onCeilingRetry}
                  onDismiss={() => setCeilingRemedy(null)}
                />
              </div>
            )}
            {constitutionLocked && (
              <div className='max-w-800px w-full mx-auto mb-12px'>
                <WCoreConstitutionLockedCard
                  rawError={constitutionLocked.rawError}
                  onOpenRecovery={goToConstitutionRecovery}
                  onDismiss={() => setConstitutionLocked(null)}
                />
              </div>
            )}
            {hasCuaCapability && !cuaCardDismissed && (
              <div className='max-w-800px w-full mx-auto mb-12px'>
                <CuaPermissionCard active={hasCuaCapability} onDismiss={() => setCuaCardDismissed(true)} />
              </div>
            )}
            <ConversationChatConfirm conversation_id={conversation_id}>
              <WCoreSendBox
                conversation_id={conversation_id}
                modelSelection={modelSelection}
                teamId={teamId}
                agentSlotId={agentSlotId}
                sessionMode={sessionMode}
                onRunningChange={setIsProcessing}
              />
            </ConversationChatConfirm>
          </div>
        </div>
      </ExecutionSpine>
    </ConversationProvider>
  );
};

const WCoreChatWithRegistry: React.FC<React.ComponentProps<typeof WCoreChat>> = (props) => (
  <ModelRegistryProvider>
    <WCoreChat {...props} />
  </ModelRegistryProvider>
);

export default HOC.Wrapper(MessageListProvider, LocalImageView.Provider)(WCoreChatWithRegistry);
