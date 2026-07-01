/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { TProviderWithModel } from '@/common/config/storage';
import type { TChatConversation } from '@/common/config/storage';
import { buildAgentConversationParams } from '@/common/utils/buildAgentConversationParams';
import { emitter } from '@/renderer/utils/emitter';
import { buildDisplayMessage } from '@/renderer/utils/file/messageFiles';
import { updateWorkspaceTime } from '@/renderer/utils/workspace/workspaceHistory';
import { Message } from '@arco-design/web-react';
import { useCallback, useRef } from 'react';
import { type TFunction } from 'i18next';
import type { NavigateFunction } from 'react-router-dom';
import type { AcpBackend, AvailableAgent, EffectiveAgentInfo } from '../types';

export type GuidSendDeps = {
  // Input state
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  files: string[];
  setFiles: React.Dispatch<React.SetStateAction<string[]>>;
  dir: string;
  setDir: React.Dispatch<React.SetStateAction<string>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;

  // Agent state
  selectedAgent: string;
  selectedAgentKey: string;
  selectedAgentInfo: AvailableAgent | undefined;
  isPresetAgent: boolean;
  selectedMode: string;
  selectedAcpModel: string | null;
  pendingConfigOptions: Record<string, string>;
  cachedConfigOptions: import('@/common/types/acpTypes').AcpSessionConfigOption[];
  currentModel: TProviderWithModel | undefined;

  // Agent helpers
  findAgentByKey: (key: string) => AvailableAgent | undefined;
  getEffectiveAgentType: (agentInfo: { backend: AcpBackend; customAgentId?: string } | undefined) => EffectiveAgentInfo;
  resolvePresetRulesAndSkills: (
    agentInfo: { backend: AcpBackend; customAgentId?: string; context?: string } | undefined
  ) => Promise<{ rules?: string; skills?: string }>;
  resolveEnabledSkills: (
    agentInfo: { backend: AcpBackend; customAgentId?: string } | undefined
  ) => string[] | undefined;
  resolveDisabledBuiltinSkills: (
    agentInfo: { backend: AcpBackend; customAgentId?: string } | undefined
  ) => string[] | undefined;
  guidDisabledBuiltinSkills: string[] | undefined;
  /**
   * Skills the user added in the composer "+" menu before the conversation
   * existed (staged mode). Threaded into the new conversation's
   * extra.sessionSkills so consumePendingSessionSkills injects them on turn 1.
   */
  stagedSessionSkills?: string[];
  currentEffectiveAgentInfo: EffectiveAgentInfo;
  isGoogleAuth: boolean;

  // Mention state reset
  setMentionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMentionQuery: React.Dispatch<React.SetStateAction<string | null>>;
  setMentionSelectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMentionActiveIndex: React.Dispatch<React.SetStateAction<number>>;

  // Navigation & tabs
  navigate: NavigateFunction;
  closeAllTabs: () => void;
  openTab: (conversation: TChatConversation) => void;
  t: TFunction;

  /**
   * When the composer is opened inside a project, every conversation it creates
   * is stamped with this projectId (extra.projectId) so it lives under the
   * project umbrella. Undefined for the normal new-chat surface. The backend /
   * model / assistant pickers stay fully free - the project does not constrain them.
   */
  projectId?: string;
  /**
   * The project's managed workspace folder, when the composer opened inside a
   * project. Used to distinguish "user deliberately picked a custom folder" from
   * "we auto-filled the project's own folder": only the former is a custom
   * workspace. Marking an auto-filled project dir as custom would wrongly disable
   * the project-workspace self-heal guards. Undefined outside a project.
   */
  projectWorkspace?: string;
};

export type GuidSendResult = {
  /**
   * Resolves to `true` when the send completed successfully (conversation
   * created + navigated), `false` when validation rejected the send (e.g.
   * no model configured, missing conversation id). Rejects only when the
   * underlying create/IPC call throws. Cross-audit MED-3 fix: callers use
   * the boolean to gate `guid.message_sent` telemetry so failed/early-
   * returned sends are not counted.
   */
  handleSend: () => Promise<boolean>;
  /**
   * Fire-and-forget wrapper around `handleSend` that manages loading/input
   * state. Optional `onSent` callback runs only when the send was
   * successful (handleSend resolved `true`) so telemetry like
   * `guid.message_sent` is not recorded for validation-failed sends.
   */
  sendMessageHandler: (opts?: { onSent?: () => void }) => void;
  isButtonDisabled: boolean;
  /**
   * True when no usable model is configured for the current agent. This is the
   * exact predicate the send handler uses to reject a send with the
   * `conversation.noModelConfigured` warning (Gemini works with a connected
   * Google account, so `isGoogleAuth` counts as usable). Shared so the
   * new-chat CTA card and the disabled Send button stay in lockstep with the
   * send-time validation instead of duplicating the check.
   */
  noModelConfigured: boolean;
};

/**
 * Hook that manages the send logic for all conversation types (gemini/openclaw/nanobot/acp).
 */
export const useGuidSend = (deps: GuidSendDeps): GuidSendResult => {
  const {
    input,
    setInput,
    files,
    setFiles,
    dir,
    setDir,
    setLoading,
    loading,
    selectedAgent,
    selectedAgentKey,
    selectedAgentInfo,
    isPresetAgent,
    selectedMode,
    selectedAcpModel,
    pendingConfigOptions,
    cachedConfigOptions,
    currentModel,
    findAgentByKey,
    getEffectiveAgentType,
    resolvePresetRulesAndSkills,
    resolveEnabledSkills,
    resolveDisabledBuiltinSkills,
    guidDisabledBuiltinSkills,
    stagedSessionSkills,
    currentEffectiveAgentInfo,
    isGoogleAuth,
    setMentionOpen,
    setMentionQuery,
    setMentionSelectorOpen,
    setMentionActiveIndex,
    navigate,
    closeAllTabs,
    openTab,
    t,
    projectId,
    projectWorkspace,
  } = deps;
  const sendingRef = useRef(false);

  const handleSend = useCallback(async (): Promise<boolean> => {
    // customWorkspace means ONLY that the user chose a folder that is NOT the
    // project's managed folder. An auto-filled project dir (dir === project
    // workspace) is not custom, so it never disables the project self-heal guards.
    const isCustomWorkspace = !!dir && dir !== projectWorkspace;
    const finalWorkspace = dir || '';
    // Stamped into every create path's extra when the composer runs inside a
    // project. Omitted from extra when undefined so it never pollutes a normal chat.
    const projectExtra = projectId ? { projectId } : {};
    // Skills staged in the composer "+" menu. Injected on turn 1 by
    // consumePendingSessionSkills (all backends). A chosen assistant's own
    // assigned skills are merged in centrally by buildAgentConversationParams
    // (so the in-chat "new tab" path gets them too). Omitted when empty.
    const sessionSkillsExtra =
      stagedSessionSkills && stagedSessionSkills.length > 0 ? { sessionSkills: stagedSessionSkills } : {};

    const agentInfo = selectedAgentInfo;
    const isPreset = isPresetAgent;
    const presetAssistantId = isPreset ? agentInfo?.customAgentId : undefined;

    const { agentType: effectiveAgentType } = getEffectiveAgentType(agentInfo);

    const { rules: presetRules } = await resolvePresetRulesAndSkills(agentInfo);
    const enabledSkills = resolveEnabledSkills(agentInfo);
    // Use guid page's local skill state (initialized from assistant config, overridable by user)
    const excludeBuiltinSkills = guidDisabledBuiltinSkills ?? resolveDisabledBuiltinSkills(agentInfo);

    const finalEffectiveAgentType = effectiveAgentType;

    // Gemini path
    if (!selectedAgent || selectedAgent === 'gemini' || (isPreset && finalEffectiveAgentType === 'gemini')) {
      // The placeholder only makes sense while Google Auth is active - otherwise
      // it fabricates a logged-out auth type and the chat page fails to load.
      if (!currentModel && !isGoogleAuth) {
        Message.warning(t('conversation.noModelConfigured'));
        return false;
      }
      const placeholderModel = currentModel || {
        id: 'gemini-placeholder',
        name: 'Gemini',
        useModel: 'default',
        platform: 'gemini-with-google-auth' as const,
        baseUrl: '',
        apiKey: '',
      };
      try {
        const geminiConversationParams = buildAgentConversationParams({
          backend: 'gemini',
          name: input,
          agentName: agentInfo?.name,
          presetAssistantId,
          workspace: finalWorkspace,
          model: placeholderModel,
          customAgentId: agentInfo?.customAgentId,
          customWorkspace: isCustomWorkspace,
          isPreset,
          presetAgentType: finalEffectiveAgentType,
          presetResources: isPreset
            ? {
                rules: presetRules,
                enabledSkills,
                excludeBuiltinSkills,
              }
            : undefined,
          sessionMode: selectedMode,
          extra: {
            defaultFiles: files,
            ...projectExtra,
            ...sessionSkillsExtra,
            excludeBuiltinSkills,
            webSearchEngine:
              placeholderModel.platform === 'gemini-with-google-auth' ||
              placeholderModel.platform === 'gemini-vertex-ai'
                ? 'google'
                : 'default',
          },
        });

        const conversation = await ipcBridge.conversation.create.invoke(geminiConversationParams);

        if (!conversation || !conversation.id) {
          throw new Error('Failed to create conversation - conversation object is null or missing id');
        }

        if (isCustomWorkspace) {
          closeAllTabs();
          updateWorkspaceTime(finalWorkspace);
          openTab(conversation);
        }

        emitter.emit('chat.history.refresh');

        const workspacePath = conversation.extra?.workspace || '';
        const displayMessage = buildDisplayMessage(input, files, workspacePath);
        const initialMessage = {
          input: displayMessage,
          files: files.length > 0 ? files : undefined,
        };
        sessionStorage.setItem(`gemini_initial_message_${conversation.id}`, JSON.stringify(initialMessage));

        void navigate(`/conversation/${conversation.id}`);
      } catch (error: unknown) {
        console.error('Failed to create Gemini conversation:', error);
        throw error;
      }
      return true;
    }

    // OpenClaw Gateway path
    if (selectedAgent === 'openclaw-gateway') {
      const openclawAgentInfo = agentInfo || findAgentByKey(selectedAgentKey);
      const openclawConversationParams = buildAgentConversationParams({
        backend: openclawAgentInfo?.backend || 'openclaw-gateway',
        name: input,
        agentName: openclawAgentInfo?.name,
        presetAssistantId,
        workspace: finalWorkspace,
        model: currentModel!,
        cliPath: openclawAgentInfo?.cliPath,
        customAgentId: openclawAgentInfo?.customAgentId,
        customWorkspace: isCustomWorkspace,
        extra: {
          defaultFiles: files,
          ...projectExtra,
          ...sessionSkillsExtra,
          runtimeValidation: {
            expectedWorkspace: finalWorkspace,
            expectedBackend: openclawAgentInfo?.backend,
            expectedAgentName: openclawAgentInfo?.name,
            expectedCliPath: openclawAgentInfo?.cliPath,
            expectedModel: currentModel?.useModel,
            switchedAt: Date.now(),
          },
          enabledSkills: isPreset ? enabledSkills : undefined,
          excludeBuiltinSkills,
        },
      });

      try {
        const conversation = await ipcBridge.conversation.create.invoke(openclawConversationParams);

        if (!conversation || !conversation.id) {
          alert('Failed to create OpenClaw conversation. Please ensure the OpenClaw Gateway is running.');
          return false;
        }

        if (isCustomWorkspace) {
          closeAllTabs();
          updateWorkspaceTime(finalWorkspace);
          openTab(conversation);
        }

        emitter.emit('chat.history.refresh');

        const initialMessage = {
          input,
          files: files.length > 0 ? files : undefined,
        };
        sessionStorage.setItem(`openclaw_initial_message_${conversation.id}`, JSON.stringify(initialMessage));

        await navigate(`/conversation/${conversation.id}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Failed to create OpenClaw conversation: ${errorMessage}`);
        throw error;
      }
      return true;
    }

    // Nanobot path
    if (selectedAgent === 'nanobot') {
      const nanobotAgentInfo = agentInfo || findAgentByKey(selectedAgentKey);
      const nanobotConversationParams = buildAgentConversationParams({
        backend: nanobotAgentInfo?.backend || 'nanobot',
        name: input,
        agentName: nanobotAgentInfo?.name,
        presetAssistantId,
        workspace: finalWorkspace,
        model: currentModel!,
        customAgentId: nanobotAgentInfo?.customAgentId,
        customWorkspace: isCustomWorkspace,
        extra: {
          defaultFiles: files,
          ...projectExtra,
          ...sessionSkillsExtra,
          enabledSkills: isPreset ? enabledSkills : undefined,
          excludeBuiltinSkills,
        },
      });

      try {
        const conversation = await ipcBridge.conversation.create.invoke(nanobotConversationParams);

        if (!conversation || !conversation.id) {
          alert('Failed to create Nanobot conversation. Please ensure nanobot is installed.');
          return false;
        }

        if (isCustomWorkspace) {
          closeAllTabs();
          updateWorkspaceTime(finalWorkspace);
          openTab(conversation);
        }

        emitter.emit('chat.history.refresh');

        const initialMessage = {
          input,
          files: files.length > 0 ? files : undefined,
        };
        sessionStorage.setItem(`nanobot_initial_message_${conversation.id}`, JSON.stringify(initialMessage));

        await navigate(`/conversation/${conversation.id}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Failed to create Nanobot conversation: ${errorMessage}`);
        throw error;
      }
      return true;
    }

    // Wayland Core path (direct selection or preset assistant with wcore as main agent)
    if (selectedAgent === 'wcore' || (isPreset && finalEffectiveAgentType === 'wcore')) {
      if (!currentModel) {
        Message.warning(t('conversation.noModelConfigured'));
        return false;
      }
      try {
        const conversation = await ipcBridge.conversation.create.invoke({
          type: 'wcore',
          name: input,
          model: currentModel,
          extra: {
            defaultFiles: files,
            ...projectExtra,
            ...sessionSkillsExtra,
            workspace: finalWorkspace,
            customWorkspace: isCustomWorkspace,
            presetRules: isPreset ? presetRules : undefined,
            enabledSkills: isPreset ? enabledSkills : undefined,
            excludeBuiltinSkills,
            presetAssistantId,
            sessionMode: selectedMode,
          },
        });

        if (!conversation || !conversation.id) {
          alert('Failed to create Wayland Core conversation. Please ensure wcore is installed.');
          return false;
        }

        if (isCustomWorkspace) {
          closeAllTabs();
          updateWorkspaceTime(finalWorkspace);
          openTab(conversation);
        }

        emitter.emit('chat.history.refresh');

        const initialMessage = {
          input,
          files: files.length > 0 ? files : undefined,
        };
        sessionStorage.setItem(`wcore_initial_message_${conversation.id}`, JSON.stringify(initialMessage));

        await navigate(`/conversation/${conversation.id}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Failed to create Wayland Core conversation: ${errorMessage}`);
        throw error;
      }
      return true;
    }

    // Remaining agent path (ACP/remote/custom, including preset fallbacks)
    {
      // Agent-type fallback only applies to preset assistants whose primary agent
      // was unavailable and got switched (e.g. claude → gemini).  For non-preset
      // agents (including extension-contributed ACP adapters with backend='custom'),
      // we must keep the original selectedAgent so the correct backend/cliPath is used.
      const agentTypeChanged = isPreset && selectedAgent !== finalEffectiveAgentType;
      const acpBackend: string | undefined = agentTypeChanged
        ? finalEffectiveAgentType
        : isPreset
          ? finalEffectiveAgentType
          : selectedAgent;

      const acpAgentInfo = agentTypeChanged
        ? findAgentByKey(acpBackend as string)
        : agentInfo || findAgentByKey(selectedAgentKey);

      if (!acpAgentInfo && !isPreset) {
        console.warn(`${acpBackend} CLI not found, but proceeding to let conversation panel handle it.`);
      }
      const agentBackend = acpBackend || selectedAgent;
      const agentConversationParams = buildAgentConversationParams({
        backend: agentBackend,
        name: input,
        agentName: acpAgentInfo?.name,
        presetAssistantId,
        workspace: finalWorkspace,
        model: currentModel!,
        cliPath: acpAgentInfo?.cliPath,
        customAgentId: acpAgentInfo?.customAgentId,
        customWorkspace: isCustomWorkspace,
        isPreset,
        presetAgentType: finalEffectiveAgentType,
        presetResources: isPreset
          ? {
              rules: presetRules,
              enabledSkills,
              excludeBuiltinSkills,
            }
          : undefined,
        sessionMode: selectedMode,
        currentModelId: selectedAcpModel || undefined,
        extra: {
          defaultFiles: files,
          ...projectExtra,
          ...sessionSkillsExtra,
          excludeBuiltinSkills,
        },
      });

      try {
        // Merge pending selections into cached options so the UI shows the user's choice immediately
        const mergedCachedConfigOptions =
          cachedConfigOptions.length > 0
            ? Object.keys(pendingConfigOptions).length > 0
              ? cachedConfigOptions.map((opt) => {
                  const pending = opt.id ? pendingConfigOptions[opt.id] : undefined;
                  return pending ? { ...opt, currentValue: pending, selectedValue: pending } : opt;
                })
              : cachedConfigOptions
            : undefined;

        // Inject cachedConfigOptions & pendingConfigOptions into the params built by utility
        if (mergedCachedConfigOptions) {
          agentConversationParams.extra = {
            ...agentConversationParams.extra,
            cachedConfigOptions: mergedCachedConfigOptions,
          };
        }
        if (Object.keys(pendingConfigOptions).length > 0) {
          agentConversationParams.extra = { ...agentConversationParams.extra, pendingConfigOptions };
        }

        const conversation = await ipcBridge.conversation.create.invoke(agentConversationParams);
        if (!conversation || !conversation.id) {
          console.error('Failed to create ACP conversation - conversation object is null or missing id');
          return false;
        }

        if (isCustomWorkspace) {
          closeAllTabs();
          updateWorkspaceTime(finalWorkspace);
          openTab(conversation);
        }

        emitter.emit('chat.history.refresh');

        const initialMessage = {
          input,
          files: files.length > 0 ? files : undefined,
        };
        sessionStorage.setItem(`acp_initial_message_${conversation.id}`, JSON.stringify(initialMessage));

        await navigate(`/conversation/${conversation.id}`);
      } catch (error: unknown) {
        console.error('Failed to create ACP conversation:', error);
        throw error;
      }
      return true;
    }
  }, [
    input,
    files,
    dir,
    selectedAgent,
    selectedAgentKey,
    selectedAgentInfo,
    isPresetAgent,
    selectedMode,
    selectedAcpModel,
    pendingConfigOptions,
    cachedConfigOptions,
    currentModel,
    findAgentByKey,
    getEffectiveAgentType,
    resolvePresetRulesAndSkills,
    resolveEnabledSkills,
    resolveDisabledBuiltinSkills,
    guidDisabledBuiltinSkills,
    stagedSessionSkills,
    navigate,
    closeAllTabs,
    openTab,
    t,
    projectId,
    projectWorkspace,
  ]);

  const sendMessageHandler = useCallback((opts?: { onSent?: () => void }) => {
    if (loading || sendingRef.current) return;
    sendingRef.current = true;
    setLoading(true);
    handleSend()
      .then((ok) => {
        setInput('');
        setMentionOpen(false);
        setMentionQuery(null);
        setMentionSelectorOpen(false);
        setMentionActiveIndex(0);
        setFiles([]);
        setDir('');
        // Cross-audit MED-3: only fire onSent (telemetry) when the send
        // actually succeeded - validation early-returns resolve to false.
        if (ok) opts?.onSent?.();
      })
      .catch((error) => {
        console.error('Failed to send message:', error);
      })
      .finally(() => {
        sendingRef.current = false;
        setLoading(false);
      });
  }, [
    loading,
    handleSend,
    setLoading,
    setInput,
    setMentionOpen,
    setMentionQuery,
    setMentionSelectorOpen,
    setMentionActiveIndex,
    setFiles,
    setDir,
  ]);

  // No usable model configured. Mirrors the send-time validation: only the
  // model-backed backends actually reject on a missing model - the Gemini path
  // (unless a Google account is connected, `isGoogleAuth`) and the Wayland Core
  // path. ACP/CLI agents (Claude Code, Codex, custom adapters) spawn their own
  // model and send fine without one, so a missing model must NOT gate their
  // Send button or show the no-model CTA (#119 - the button was dead for Claude
  // Code while Enter, which skips this gate, worked). Drives both the new-chat
  // CTA card and the disabled Send button so they never diverge from the gate.
  const effectiveBackend = isPresetAgent ? currentEffectiveAgentInfo.agentType : selectedAgent;
  const modelGatedBackend = !effectiveBackend || effectiveBackend === 'gemini' || effectiveBackend === 'wcore';
  const noModelConfigured = modelGatedBackend && !currentModel && !isGoogleAuth;

  // Calculate button disabled state
  const isButtonDisabled =
    loading ||
    !input.trim() ||
    noModelConfigured ||
    ((((!selectedAgent || selectedAgent === 'gemini') && !isPresetAgent) ||
      (isPresetAgent && currentEffectiveAgentInfo.agentType === 'gemini' && currentEffectiveAgentInfo.isAvailable)) &&
      !currentModel &&
      isGoogleAuth);

  return {
    handleSend,
    sendMessageHandler,
    isButtonDisabled,
    noModelConfigured,
  };
};
