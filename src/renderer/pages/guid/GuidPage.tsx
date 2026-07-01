/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bot, ChevronDown, ChevronLeft, FolderKanban, PenSquare } from 'lucide-react';
import { ipcBridge } from '@/common';
import { resolveLocaleKey } from '@/common/utils';

import { useInputFocusRing } from '@/renderer/hooks/chat/useInputFocusRing';
import { isElectronDesktop, resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { isImageAvatar } from '@/renderer/utils/avatar';
import { getLucideIcon } from '@/renderer/utils/lucideAvatar';
import { useConversationTabs } from '@/renderer/pages/conversation/hooks/ConversationTabsContext';
import { CUSTOM_AVATAR_IMAGE_MAP } from './constants';
import AssistantIconTile, { categoryToPaletteKey, type PaletteKey } from './components/AssistantIconTile';
import AssistantSelectionArea from './components/AssistantSelectionArea';
import Greeting from './components/newChatStarter/Greeting';
import NoModelCtaCard from './components/newChatStarter/NoModelCtaCard';
import KickoffCard from './components/newChatStarter/KickoffCard';
import IntentPillBar from './components/newChatStarter/IntentPillBar';
import IntentSuggestionPanel from './components/newChatStarter/IntentSuggestionPanel';
import LaunchpadBar from './components/newChatStarter/LaunchpadBar';
import { HomeHintBar } from './components/HomeHintBar';
import type { IntentKey, IntentPrompt } from './intents';
import type { QuickLaunchAnchor } from './quickLaunchAnchors';
import { useUsageTelemetry } from '@/renderer/hooks/usage/useUsageTelemetry';
import { useUserDisplayName } from '@/renderer/hooks/system/useUserDisplayName';
import { useKickoff } from '@/renderer/hooks/kickoff/useKickoff';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import AgentPillBar from './components/AgentPillBar';
import { AgentPillBarSkeleton } from './components/GuidSkeleton';
import GuidActionRow from './components/GuidActionRow';
import GuidInputCard from './components/GuidInputCard';
import GuidModelSelector from './components/GuidModelSelector';
import MentionDropdown, { MentionSelectorBadge } from './components/MentionDropdown';
import FeedbackReportModal from '@/renderer/components/settings/SettingsModal/contents/FeedbackReportModal';
import SpeechInputButton from '@/renderer/components/chat/SpeechInputButton';
import { appendSpeechTranscript } from '@/renderer/hooks/system/useSpeechInput';
import { useHiddenAgents } from '@renderer/hooks/assistant/useHiddenAgents';
import { filterVisibleAgents } from './hooks/agentSelectionUtils';
import { useGuidAgentSelection } from './hooks/useGuidAgentSelection';
import { useGuidInput } from './hooks/useGuidInput';
import { useGuidMention } from './hooks/useGuidMention';
import { useGuidModelSelection } from './hooks/useGuidModelSelection';
import { useGuidSend } from './hooks/useGuidSend';
import { useTypewriterPlaceholder } from './hooks/useTypewriterPlaceholder';
import { useWorkflowSession } from '@/renderer/hooks/workflow/useWorkflowSession';
import type { WorkflowSession } from '@/common/types/workflowTypes';
import { ConfigStorage } from '@/common/config/storage';
import { ACP_BACKENDS_ALL } from '@/common/types/acpTypes';
import { getAgentLogo } from '@/renderer/utils/model/agentLogo';
import type { AcpBackendConfig } from './types';
import { Button, ConfigProvider, Dropdown, Menu, Message } from '@arco-design/web-react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { warmCuratedForAgent } from '@/renderer/hooks/useModelRegistry';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './index.module.css';

const GuidPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const guidContainerRef = useRef<HTMLDivElement>(null);
  const openAssistantDetailsRef = useRef<(() => void) | null>(null);
  const descriptionTextRef = useRef<HTMLDivElement>(null);
  const { closeAllTabs, openTab } = useConversationTabs();
  const { activeBorderColor, inactiveBorderColor, activeShadow } = useInputFocusRing();

  const localeKey = resolveLocaleKey(i18n.language);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // #52: when running as the headless web server (remote), the Models page is
  // read-only, so the no-model CTA guides to Flux / server-side config rather
  // than local key entry. Reuses the app's existing desktop-vs-web detection
  // (isElectronDesktop) - the same flag GuidActionRow uses for `isWebUI`.
  const isWebServer = !isElectronDesktop();

  // W3 (v0.6.2) - discoverability HomeHintBar visibility counter. Persisted in
  // localStorage so it auto-hides after the user's 5th chat across sessions.
  const [chatStartedCount, setChatStartedCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('guid.chat_started_count');
      const n = raw ? parseInt(raw, 10) : 0;
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  });

  // W4 - Workflow launch surface (SPEC §5.10). When the Workflows page (or
  // the InFlightWorkflowsStrip below) navigates here with a workflowSessionId,
  // the hook resolves the session and `WorkflowSurface` takes over the page.
  // Hook is invoked unconditionally so React's hook order stays stable; the
  // early-return check happens after every other hook in this component has
  // run, just before the main JSX.
  const workflowRouteState = location.state as {
    workflowSessionId?: string;
    initialWorkflowSession?: WorkflowSession;
    /** Set when the composer is opened from a project workspace - every chat created here is stamped with it. */
    projectId?: string;
    /** Project name, shown as a "New chat in {project}" indicator above the composer. */
    projectName?: string;
    /** The project's managed workspace folder, auto-filled as the chat's dir. */
    projectWorkspace?: string;
  } | null;
  // Project scoping: when present, useGuidSend stamps extra.projectId on the new
  // conversation. Backend / model / assistant pickers stay fully free.
  const projectId = workflowRouteState?.projectId;
  const projectName = workflowRouteState?.projectName;
  // The project's own folder, when the composer opened from a project. Threaded
  // into useGuidSend so an auto-filled project dir is NOT flagged customWorkspace.
  const projectWorkspace = workflowRouteState?.projectWorkspace;
  const workflowSession = useWorkflowSession(
    workflowRouteState?.workflowSessionId,
    workflowRouteState?.initialWorkflowSession
  );

  // --- Skills state ---
  const [builtinAutoSkills, setBuiltinAutoSkills] = useState<Array<{ name: string; description: string }>>([]);
  const [guidDisabledBuiltinSkills, setGuidDisabledBuiltinSkills] = useState<string[] | undefined>(undefined);
  // Skills the user added in the composer "+" menu before this chat exists. On
  // send they ride into the new conversation's extra.sessionSkills.
  const [stagedSessionSkills, setStagedSessionSkills] = useState<string[]>([]);

  useEffect(() => {
    ipcBridge.fs.listBuiltinAutoSkills
      .invoke()
      .then(setBuiltinAutoSkills)
      .catch(() => setBuiltinAutoSkills([]));
  }, []);

  const handleToggleBuiltinSkill = useCallback((skillName: string) => {
    setGuidDisabledBuiltinSkills((prev) => {
      const list = prev ?? [];
      return list.includes(skillName) ? list.filter((s) => s !== skillName) : [...list, skillName];
    });
  }, []);

  // --- Hooks ---
  // Track which provider-based agent is selected so model selection persists per agent type
  const [providerAgentKey, setProviderAgentKey] = useState<'gemini' | 'wcore'>('wcore');
  const modelSelection = useGuidModelSelection(providerAgentKey);

  const resetAssistantRequested = (location.state as { resetAssistant?: boolean } | null)?.resetAssistant === true;
  const agentSelection = useGuidAgentSelection({
    modelList: modelSelection.modelList,
    isGoogleAuth: modelSelection.isGoogleAuth,
    localeKey,
    resetAssistant: resetAssistantRequested,
    locationKey: location.key,
  });

  // Agents the user toggled off on the Agents settings page are removed from
  // the toolbar strip but stay detected. Guard rails: the currently-selected
  // agent is never hidden out from under the user, and we never collapse the
  // strip to empty (if every agent ends up hidden, fall back to the full set).
  const { hiddenSet } = useHiddenAgents();
  const visibleAgents = useMemo(
    () => filterVisibleAgents(agentSelection.availableAgents, hiddenSet, agentSelection.selectedAgentKey),
    [agentSelection.availableAgents, agentSelection.selectedAgentKey, hiddenSet]
  );

  // Pre-warm each toolbar agent's curated model catalog as soon as the agents
  // are known, so the FIRST open of any agent's model picker shows the real
  // list instantly instead of flashing the Flux-only placeholder while its
  // (sometimes CLI-spawning, e.g. `codex debug models`) enumeration resolves.
  // Best-effort + deduped/cached in useModelRegistry; safe to call repeatedly.
  useEffect(() => {
    if (!Array.isArray(visibleAgents)) return;
    for (const agent of visibleAgents) {
      if (agent?.backend) warmCuratedForAgent(agent.backend);
    }
  }, [visibleAgents]);

  // Cold-boot launchpad gate (cross-audit smoke HIGH).
  //
  // `useGuidAgentSelection` rehydrates `guid.lastSelectedAgent` from storage
  // on mount. A persisted preset key (e.g. `custom:builtin-cowork`) would
  // otherwise drop the page directly into preset-hero mode and hide the
  // 6-card launchpad - exactly the regression flagged by the live smoke.
  // Treat the launchpad as the canonical cold-start surface: render it
  // until the user actively interacts with agent selection in THIS page
  // lifecycle (clicks a pill, picks an assistant, taps a quick-launch
  // card), at which point the preset hero may mount as before. A sidebar
  // "new chat" reset (`resetAssistant`) also forces the launchpad.
  // Resets on every navigation via `location.key`.
  const [hasInteractedWithAgentSelection, setHasInteractedWithAgentSelection] = useState(false);
  useEffect(() => {
    // An explicit cross-page launch (clicking an assistant on /assistants or
    // in Settings) navigates here with `launchAssistant: true`. Treat that as
    // an interaction so the preset hero opens *into* the picked assistant
    // instead of dropping the user on the launchpad with only a prefilled
    // placeholder. A plain cold boot has no such flag and still shows the
    // launchpad.
    const launched = (location.state as { launchAssistant?: boolean } | null)?.launchAssistant === true;
    setHasInteractedWithAgentSelection(launched);
  }, [location.key]);
  const showPresetHero = agentSelection.isPresetAgent && hasInteractedWithAgentSelection;

  // Sync providerAgentKey when selected agent changes
  useEffect(() => {
    const agent = agentSelection.selectedAgent;
    if (agent === 'gemini' || agent === 'wcore') {
      setProviderAgentKey(agent);
    }
  }, [agentSelection.selectedAgent]);

  const guidInput = useGuidInput({
    locationState: location.state as { workspace?: string; paletteInitialPrompt?: string } | null,
  });

  const mention = useGuidMention({
    availableAgents: agentSelection.availableAgents,
    customAgentAvatarMap: agentSelection.customAgentAvatarMap,
    selectedAgentKey: agentSelection.selectedAgentKey,
    setSelectedAgentKey: agentSelection.setSelectedAgentKey,
    setInput: guidInput.setInput,
    selectedAgentInfo: agentSelection.selectedAgentInfo,
  });

  const send = useGuidSend({
    // Input state
    input: guidInput.input,
    setInput: guidInput.setInput,
    files: guidInput.files,
    setFiles: guidInput.setFiles,
    dir: guidInput.dir,
    setDir: guidInput.setDir,
    setLoading: guidInput.setLoading,
    loading: guidInput.loading,

    // Agent state
    selectedAgent: agentSelection.selectedAgent,
    selectedAgentKey: agentSelection.selectedAgentKey,
    selectedAgentInfo: agentSelection.selectedAgentInfo,
    isPresetAgent: agentSelection.isPresetAgent,
    selectedMode: agentSelection.selectedMode,
    selectedAcpModel: agentSelection.selectedAcpModel,
    pendingConfigOptions: agentSelection.pendingConfigOptions,
    cachedConfigOptions: agentSelection.cachedConfigOptions,
    currentModel: modelSelection.currentModel,

    // Agent helpers
    findAgentByKey: agentSelection.findAgentByKey,
    getEffectiveAgentType: agentSelection.getEffectiveAgentType,
    resolvePresetRulesAndSkills: agentSelection.resolvePresetRulesAndSkills,
    resolveEnabledSkills: agentSelection.resolveEnabledSkills,
    resolveDisabledBuiltinSkills: agentSelection.resolveDisabledBuiltinSkills,
    guidDisabledBuiltinSkills,
    stagedSessionSkills,
    currentEffectiveAgentInfo: agentSelection.currentEffectiveAgentInfo,
    isGoogleAuth: modelSelection.isGoogleAuth,

    // Mention state reset
    setMentionOpen: mention.setMentionOpen,
    setMentionQuery: mention.setMentionQuery,
    setMentionSelectorOpen: mention.setMentionSelectorOpen,
    setMentionActiveIndex: mention.setMentionActiveIndex,

    // Navigation & tabs
    navigate,
    closeAllTabs,
    openTab,
    t,

    // Project scoping (undefined on the normal new-chat surface)
    projectId,
    projectWorkspace,
  });

  const recordTelemetry = useUsageTelemetry();

  // Fire 'guid.foreground' once on mount so usage analytics can attribute
  // dashboard sessions to a starting page view.
  useEffect(() => {
    recordTelemetry({ eventType: 'guid.foreground' });
  }, [recordTelemetry]);

  // Fire-and-forget 'guid.message_sent' helper. Cross-audit MED-3 fix:
  // recorded only AFTER the send handler reports success - failed sends
  // and validation early-returns are not counted. Captured against the
  // snapshot of agent/files at call time (not after state-clearing).
  const recordMessageSent = useCallback(() => {
    recordTelemetry({
      eventType: 'guid.message_sent',
      assistantId: agentSelection.selectedAgentInfo?.customAgentId,
      cliBackend: agentSelection.selectedAgent,
      metadata: { hasFiles: guidInput.files.length > 0 },
    });
    // W3 (v0.6.2) - bump persisted chat-started counter for HomeHintBar
    // auto-hide. Wrapped in try/catch because some environments block
    // localStorage (e.g. Safari private mode).
    setChatStartedCount((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem('guid.chat_started_count', String(next));
      } catch {
        /* ignore - counter stays in-memory for this session */
      }
      return next;
    });
  }, [recordTelemetry, agentSelection.selectedAgentInfo, agentSelection.selectedAgent, guidInput.files]);

  // --- Coordinated handlers (depend on multiple hooks) ---
  const handleInputChange = useCallback(
    (value: string) => {
      guidInput.setInput(value);
      const match = value.match(mention.mentionMatchRegex);
      // The home page does not trigger the mention list from typing @; the @agent in the placeholder is just a hint, agent selection is done manually via the top bar or dropdown
      if (match) {
        mention.setMentionQuery(match[1]);
        mention.setMentionOpen(false);
      } else {
        mention.setMentionQuery(null);
        mention.setMentionOpen(false);
      }
    },
    [mention.mentionMatchRegex, guidInput.setInput, mention.setMentionQuery, mention.setMentionOpen]
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (
        (mention.mentionOpen || mention.mentionSelectorOpen) &&
        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
      ) {
        event.preventDefault();
        if (mention.filteredMentionOptions.length === 0) return;
        mention.setMentionActiveIndex((prev) => {
          if (event.key === 'ArrowDown') {
            return (prev + 1) % mention.filteredMentionOptions.length;
          }
          return (prev - 1 + mention.filteredMentionOptions.length) % mention.filteredMentionOptions.length;
        });
        return;
      }
      if ((mention.mentionOpen || mention.mentionSelectorOpen) && event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (mention.filteredMentionOptions.length > 0) {
          const query = mention.mentionQuery?.toLowerCase();
          const exactMatch = query
            ? mention.filteredMentionOptions.find(
                (option) => option.label.toLowerCase() === query || option.tokens.has(query)
              )
            : undefined;
          const selected =
            exactMatch ||
            mention.filteredMentionOptions[mention.mentionActiveIndex] ||
            mention.filteredMentionOptions[0];
          if (selected) {
            mention.selectMentionAgent(selected.key);
            return;
          }
        }
        mention.setMentionOpen(false);
        mention.setMentionQuery(null);
        mention.setMentionSelectorOpen(false);
        mention.setMentionActiveIndex(0);
        return;
      }
      if (mention.mentionOpen && (event.key === 'Backspace' || event.key === 'Delete') && !mention.mentionQuery) {
        mention.setMentionOpen(false);
        mention.setMentionQuery(null);
        mention.setMentionActiveIndex(0);
        return;
      }
      if (
        !mention.mentionOpen &&
        mention.mentionSelectorVisible &&
        !guidInput.input.trim() &&
        (event.key === 'Backspace' || event.key === 'Delete')
      ) {
        event.preventDefault();
        mention.setMentionSelectorVisible(false);
        mention.setMentionSelectorOpen(false);
        mention.setMentionActiveIndex(0);
        return;
      }
      if ((mention.mentionOpen || mention.mentionSelectorOpen) && event.key === 'Escape') {
        event.preventDefault();
        mention.setMentionOpen(false);
        mention.setMentionQuery(null);
        mention.setMentionSelectorOpen(false);
        mention.setMentionActiveIndex(0);
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!guidInput.input.trim()) return;
        // MED-3: telemetry fires inside onSent so validation-rejected sends
        // (no model, missing conversation id) are not counted as "sent."
        send.sendMessageHandler({ onSent: recordMessageSent });
      }
    },
    [mention, guidInput.input, send.sendMessageHandler, recordMessageSent]
  );

  const handleSelectAgent = useCallback(
    (key: string) => {
      setHasInteractedWithAgentSelection(true);
      agentSelection.setSelectedAgentKey(key);
      mention.setMentionOpen(false);
      mention.setMentionQuery(null);
      mention.setMentionSelectorOpen(false);
      mention.setMentionActiveIndex(0);
      recordTelemetry({ eventType: 'guid.cli_selected', cliBackend: key });
    },
    [
      agentSelection.setSelectedAgentKey,
      mention.setMentionOpen,
      mention.setMentionQuery,
      mention.setMentionSelectorOpen,
      mention.setMentionActiveIndex,
      recordTelemetry,
    ]
  );

  const handleSelectAssistant = useCallback(
    (assistantId: string) => {
      setHasInteractedWithAgentSelection(true);
      agentSelection.setSelectedAgentKey(assistantId);
      mention.setMentionOpen(false);
      mention.setMentionQuery(null);
      mention.setMentionSelectorOpen(false);
      mention.setMentionActiveIndex(0);
    },
    [
      agentSelection.setSelectedAgentKey,
      mention.setMentionOpen,
      mention.setMentionQuery,
      mention.setMentionSelectorOpen,
      mention.setMentionActiveIndex,
    ]
  );

  // --- Launchpad new-chat starter (greeting + quick-launch row + recents) ---
  const { resolvedName: greetingDisplayName } = useUserDisplayName();
  const [activeIntent, setActiveIntent] = useState<IntentKey | null>(null);

  // v0.4.7 - Kickoff card. Only meaningful when a preset assistant is selected
  // (per-assistant suggestions; useKickoff returns visible:false otherwise).
  const kickoffAssistantId = agentSelection.isPresetAgent ? agentSelection.selectedAgentInfo?.customAgentId : undefined;
  const kickoff = useKickoff(kickoffAssistantId);
  // Dismiss-on-type: protect the first keystroke. Once the input has any
  // content, the card silently dismisses for this session - keeps the
  // surface clean for power users who just want to type.
  const lastInputLenRef = useRef(0);
  // v0.4.7.1 (RENDERER-3) - Depend on the specific fields the effect reads,
  // NOT the whole `kickoff` object (which is a fresh literal every render and
  // would re-run this effect on every keystroke). The dismissByTyping
  // callback is stable across renders via useCallback inside useKickoff.
  useEffect(() => {
    const prev = lastInputLenRef.current;
    const curr = guidInput.input.length;
    lastInputLenRef.current = curr;
    if (prev === 0 && curr > 0 && kickoff.visible) {
      kickoff.dismissByTyping();
    }
  }, [guidInput.input, kickoff.visible, kickoff.dismissByTyping]);
  const handleKickoffAccept = useCallback(() => {
    const prefill = kickoff.accept();
    if (prefill) {
      guidInput.setInput(prefill);
      guidInput.handleTextareaFocus();
    }
  }, [kickoff, guidInput.setInput, guidInput.handleTextareaFocus]);

  const handleQuickLaunchAnchor = useCallback(
    (anchor: QuickLaunchAnchor) => {
      setHasInteractedWithAgentSelection(true);
      // Built-in preset runtime ids are `builtin-${preset.id}` (see initStorage.ts).
      // ASSISTANT_PRESETS keys by the bare id, so strip the prefix for lookup only -
      // selectPresetAssistant still needs the runtime id (with prefix) so the
      // customAgents registry lookup in useGuidAgentSelection succeeds.
      const bareId = anchor.assistantId.startsWith('builtin-')
        ? anchor.assistantId.slice('builtin-'.length)
        : anchor.assistantId;
      const preset = ASSISTANT_PRESETS.find((p) => p.id === bareId);
      // Sean's rule: the user's active backend pill wins. Only fall back to
      // the preset's recommended backend when the user is currently in
      // preset mode (selectedAgentKey starts with `custom:` / `remote:`) and
      // has no plain backend pill selected.
      const isUserOnBackendPill =
        !agentSelection.selectedAgentKey.startsWith('custom:') &&
        !agentSelection.selectedAgentKey.startsWith('remote:');
      const effectiveBackend = isUserOnBackendPill ? agentSelection.selectedAgent : preset?.presetAgentType;
      agentSelection.selectPresetAssistant({
        id: anchor.assistantId,
        presetAgentType: effectiveBackend,
      });
      // Bug 7 - Always overwrite, even when the user already typed or a prior
      // anchor's prefill is still in the textarea. The React state setter is
      // an overwrite, but we also force the underlying DOM value via the ref
      // so the Arco TextArea can't keep the prior text on re-mount/back-nav.
      const textareaEl = guidInput.textareaRef.current?.dom;
      if (textareaEl) {
        textareaEl.value = anchor.prefill;
      }
      guidInput.setInput(anchor.prefill);
      guidInput.handleTextareaFocus();
      mention.setMentionOpen(false);
      mention.setMentionQuery(null);
      mention.setMentionSelectorOpen(false);
      mention.setMentionActiveIndex(0);
      recordTelemetry({
        eventType: 'launchpad.card_clicked',
        anchorId: anchor.id,
        assistantId: anchor.assistantId,
        cliBackend: agentSelection.selectedAgent,
      });
    },
    [
      agentSelection.selectPresetAssistant,
      agentSelection.selectedAgent,
      agentSelection.selectedAgentKey,
      guidInput.setInput,
      guidInput.handleTextareaFocus,
      guidInput.textareaRef,
      mention.setMentionOpen,
      mention.setMentionQuery,
      mention.setMentionSelectorOpen,
      mention.setMentionActiveIndex,
      recordTelemetry,
    ]
  );

  const handleQuickLaunchViewAll = useCallback(() => {
    recordTelemetry({ eventType: 'launchpad.view_all_clicked' });
    navigate('/assistants');
  }, [navigate, recordTelemetry]);

  const handleSelectIntent = useCallback(
    (intent: IntentKey | null) => {
      setActiveIntent(intent);
      if (intent !== null) {
        recordTelemetry({ eventType: 'launchpad.intent_pill_clicked', metadata: { intent } });
      }
    },
    [recordTelemetry]
  );

  const handleCloseIntentPanel = useCallback(() => {
    setActiveIntent(null);
  }, []);

  const handleSelectIntentPrompt = useCallback(
    (prompt: IntentPrompt) => {
      setHasInteractedWithAgentSelection(true);
      const preset = ASSISTANT_PRESETS.find((p) => p.id === prompt.targetAssistantId);
      // Sean's rule: the user's active backend pill wins. Only fall back to
      // the preset's recommended backend when the user is currently in
      // preset mode (selectedAgentKey starts with `custom:` / `remote:`).
      const isUserOnBackendPill =
        !agentSelection.selectedAgentKey.startsWith('custom:') &&
        !agentSelection.selectedAgentKey.startsWith('remote:');
      const userBackend = isUserOnBackendPill ? agentSelection.selectedAgent : undefined;
      if (preset) {
        agentSelection.selectPresetAssistant({
          id: preset.id,
          presetAgentType: userBackend ?? preset.presetAgentType,
        });
      } else {
        // Extension-bundle assistants follow the same Rory rule. When no user
        // backend pill is active, presetAgentType is left undefined and
        // selectPresetAssistant defaults to wcore (Wayland Core, the native engine).
        agentSelection.selectPresetAssistant({
          id: prompt.targetAssistantId,
          presetAgentType: userBackend,
        });
      }
      guidInput.setInput(prompt.promptText);
      guidInput.handleTextareaFocus();
      mention.setMentionOpen(false);
      mention.setMentionQuery(null);
      mention.setMentionSelectorOpen(false);
      mention.setMentionActiveIndex(0);
      recordTelemetry({
        eventType: 'launchpad.intent_prompt_clicked',
        assistantId: prompt.targetAssistantId,
        metadata: { intent: activeIntent, prompt: prompt.promptText.slice(0, 80) },
      });
    },
    [
      activeIntent,
      agentSelection.selectPresetAssistant,
      agentSelection.selectedAgent,
      agentSelection.selectedAgentKey,
      guidInput.setInput,
      guidInput.handleTextareaFocus,
      mention.setMentionOpen,
      mention.setMentionQuery,
      mention.setMentionSelectorOpen,
      mention.setMentionActiveIndex,
      recordTelemetry,
    ]
  );

  // Typewriter placeholder
  const typewriterPlaceholder = useTypewriterPlaceholder(t('conversation.welcome.placeholder'));
  const selectedAssistantRecord = useMemo(() => {
    if (!agentSelection.isPresetAgent || !agentSelection.selectedAgentInfo?.customAgentId) return undefined;
    const selectedId = agentSelection.selectedAgentInfo.customAgentId;
    const strippedId = selectedId.replace(/^builtin-/, '');
    const candidates = new Set([selectedId, `builtin-${strippedId}`, strippedId]);
    return agentSelection.customAgents.find((item) => candidates.has(item.id));
  }, [agentSelection.customAgents, agentSelection.isPresetAgent, agentSelection.selectedAgentInfo?.customAgentId]);

  // Sync disabledBuiltinSkills from preset assistant config
  useEffect(() => {
    if (agentSelection.isPresetAgent && selectedAssistantRecord) {
      setGuidDisabledBuiltinSkills(selectedAssistantRecord.disabledBuiltinSkills ?? []);
    } else {
      setGuidDisabledBuiltinSkills(undefined);
    }
  }, [agentSelection.isPresetAgent, selectedAssistantRecord]);

  const heroTitle = useMemo(() => {
    if (!agentSelection.isPresetAgent) return t('conversation.welcome.title');
    const i18nName = selectedAssistantRecord?.nameI18n?.[localeKey];
    if (i18nName) return i18nName;
    return mention.selectedAgentLabel || t('conversation.welcome.title');
  }, [agentSelection.isPresetAgent, selectedAssistantRecord, localeKey, mention.selectedAgentLabel, t]);
  const selectedAssistantDescription = useMemo(() => {
    return selectedAssistantRecord?.descriptionI18n?.[localeKey] || selectedAssistantRecord?.description || '';
  }, [selectedAssistantRecord, localeKey]);
  const selectedAssistantAvatar = useMemo(() => {
    if (!agentSelection.isPresetAgent) return null;
    const selectedId = agentSelection.selectedAgentInfo?.customAgentId;
    const strippedId = selectedId?.replace(/^builtin-/, '');
    const candidates = new Set(selectedId && strippedId ? [selectedId, `builtin-${strippedId}`, strippedId] : []);
    const selectedAssistant = agentSelection.customAgents.find((item) => candidates.has(item.id));
    const avatarValue = selectedAssistant?.avatar?.trim() || agentSelection.selectedAgentInfo?.avatar?.trim();
    if (!avatarValue) return { kind: 'icon' as const };
    const LucideIconComponent = getLucideIcon(avatarValue);
    if (LucideIconComponent) {
      return { kind: 'lucide' as const, Icon: LucideIconComponent };
    }
    const mappedAvatar = CUSTOM_AVATAR_IMAGE_MAP[avatarValue];
    const resolvedAvatar = resolveExtensionAssetUrl(avatarValue);
    const avatarImage = mappedAvatar || resolvedAvatar;
    const showImage = Boolean(avatarImage && isImageAvatar(avatarImage));
    if (showImage && avatarImage) {
      return { kind: 'image' as const, value: avatarImage };
    }
    return { kind: 'emoji' as const, value: avatarValue };
  }, [
    agentSelection.customAgents,
    agentSelection.isPresetAgent,
    agentSelection.selectedAgentInfo?.avatar,
    agentSelection.selectedAgentInfo?.customAgentId,
  ]);
  // Tile palette for the preset hero icon. Built-in presets carry an
  // AssistantCategory we can map directly. Extension assistants (ext-*)
  // don't store a category on the customAgents record, so we hand-map a
  // few well-known ext ids to keep the launchpad anchors colored. The
  // Cowork built-in is force-pinned to the orange palette to match the
  // QuickLaunchCard treatment.
  const selectedAssistantPaletteKey = useMemo<PaletteKey | undefined>(() => {
    if (!agentSelection.isPresetAgent) return undefined;
    const selectedId = agentSelection.selectedAgentInfo?.customAgentId;
    if (!selectedId) return undefined;
    const bareId = selectedId.replace(/^builtin-/, '');
    if (bareId === 'cowork') return 'cowork';
    const EXT_PALETTE: Record<string, PaletteKey> = {
      'ext-copy': 'write',
      'ext-sales': 'sales',
      'ext-product-launch': 'launch',
      'ext-coin': 'finance',
      'ext-quiet-money': 'finance',
    };
    if (EXT_PALETTE[bareId]) return EXT_PALETTE[bareId];
    const preset = ASSISTANT_PRESETS.find((p) => p.id === bareId);
    return categoryToPaletteKey(preset?.category);
  }, [agentSelection.isPresetAgent, agentSelection.selectedAgentInfo?.customAgentId]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [canExpandDescription, setCanExpandDescription] = useState(false);

  // Reset guid-local UI state before paint so same-route navigations do not
  // briefly show the previous draft or preset assistant layout.
  //
  // `pendingPrompt` carries an inbound directive (e.g. the body of a
  // workflow the user clicked "Launch" on) so the textarea opens
  // pre-filled. The Workflows page sets this via React Router's location
  // state when handling the Launch button. Other entry points (typed
  // input, intent prompts) clear the field as before.
  useLayoutEffect(() => {
    const state = location.state as { workspace?: string; pendingPrompt?: string; projectWorkspace?: string } | null;
    guidInput.setInput(state?.pendingPrompt ?? '');
    guidInput.setFiles([]);
    guidInput.setLoading(false);
    // When opened from a project, root the chat in the project's workspace folder
    // so "Chat in Folder" shows it and the chat works inside the project.
    const initialDir = state?.projectWorkspace || state?.workspace;
    guidInput.setDir(initialDir || '');
    setIsDescriptionExpanded(false);
  }, [guidInput.setDir, guidInput.setFiles, guidInput.setInput, guidInput.setLoading, location.key, location.state]);

  // Clear resetAssistant from location.state after the hook has consumed it,
  // so that re-renders don't re-trigger the reset logic.
  //
  // Must go through React Router's navigate - raw window.history.replaceState
  // with `location.pathname` would write the HashRouter virtual path (e.g.
  // '/guid') into the browser's real URL and strip the leading '#'. On the
  // next hard reload, the browser would then request '/guid' directly from
  // the dev server (which has no SPA fallback) and 404.
  useEffect(() => {
    if (!resetAssistantRequested) return;
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null });
  }, [resetAssistantRequested, location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    const node = descriptionTextRef.current;
    if (!node || !agentSelection.isPresetAgent || !selectedAssistantDescription) {
      setCanExpandDescription(false);
      return;
    }

    const checkExpandable = () => {
      // In line-clamp mode, scrollWidth/scrollHeight can be unreliable in some engines.
      // Measure the natural multi-line height via an off-screen clone.
      const clone = node.cloneNode(true) as HTMLDivElement;
      const computed = window.getComputedStyle(node);
      clone.style.position = 'absolute';
      clone.style.visibility = 'hidden';
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = '-1';
      clone.style.left = '-99999px';
      clone.style.top = '0';
      clone.style.width = `${node.clientWidth}px`;
      clone.style.display = 'block';
      clone.style.overflow = 'visible';
      clone.style.whiteSpace = 'normal';
      clone.style.webkitLineClamp = 'unset';
      clone.style.webkitBoxOrient = 'unset';
      clone.style.lineHeight = computed.lineHeight;
      clone.style.fontSize = computed.fontSize;
      clone.style.fontWeight = computed.fontWeight;
      clone.style.letterSpacing = computed.letterSpacing;
      clone.style.fontFamily = computed.fontFamily;
      document.body.appendChild(clone);

      const expandedHeight = clone.scrollHeight;
      document.body.removeChild(clone);
      const lineHeight = Number.parseFloat(computed.lineHeight) || 20;
      const canExpand = expandedHeight > lineHeight + 1;
      setCanExpandDescription(canExpand);
      if (!canExpand) {
        setIsDescriptionExpanded(false);
      }
    };

    checkExpandable();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => checkExpandable());
    observer.observe(node);
    return () => observer.disconnect();
  }, [agentSelection.isPresetAgent, selectedAssistantDescription]);

  const currentPresetAgentType = selectedAssistantRecord?.presetAgentType || 'wcore';
  const agentSwitcherItems = useMemo(() => {
    if (!agentSelection.availableAgents) return [];
    // Build from detected execution engines, excluding preset assistants and remote agents
    return agentSelection.availableAgents
      .filter((a) => !a.isPreset && a.backend !== 'remote')
      .map((a) => ({
        key: a.backend,
        label: a.name,
        isCurrent: a.backend === currentPresetAgentType,
        isExtension: a.isExtension,
      }));
  }, [agentSelection.availableAgents, currentPresetAgentType]);
  const effectiveAgentLogo = useMemo(
    () => getAgentLogo(agentSelection.currentEffectiveAgentInfo.agentType),
    [agentSelection.currentEffectiveAgentInfo.agentType]
  );
  const handlePresetAgentTypeSwitch = useCallback(
    async (nextType: string) => {
      const customAgentId = agentSelection.selectedAgentInfo?.customAgentId;
      if (!customAgentId || nextType === currentPresetAgentType) return;
      try {
        const [presetAssistants, localAgents] = await Promise.all([
          ConfigStorage.get('assistants').then((v) => (v || []) as AcpBackendConfig[]),
          ConfigStorage.get('acp.customAgents').then((v) => (v || []) as AcpBackendConfig[]),
        ]);
        const presetIdx = presetAssistants.findIndex((a) => a.id === customAgentId);
        if (presetIdx >= 0) {
          const updated = [...presetAssistants];
          updated[presetIdx] = { ...updated[presetIdx], presetAgentType: nextType };
          await ConfigStorage.set('assistants', updated);
        } else {
          const localIdx = localAgents.findIndex((a) => a.id === customAgentId);
          if (localIdx < 0) {
            // Vendored/extension-contributed specialist (ext-*): it has no
            // persisted record in `assistants` or `acp.customAgents` to mutate,
            // so persist the chosen backend as an override the loader applies on
            // read. This keeps the in-memory registry record (avatar, context,
            // skills) intact while making the backend switch stick.
            const overrides =
              ((await ConfigStorage.get('assistant.presetAgentTypeOverrides')) as Record<string, string> | undefined) ||
              {};
            overrides[customAgentId] = nextType;
            await ConfigStorage.set('assistant.presetAgentTypeOverrides', overrides);
          } else {
            const updated = [...localAgents];
            updated[localIdx] = { ...updated[localIdx], presetAgentType: nextType };
            await ConfigStorage.set('acp.customAgents', updated);
          }
        }
        await agentSelection.refreshCustomAgents();
        const agentName = ACP_BACKENDS_ALL[nextType as keyof typeof ACP_BACKENDS_ALL]?.name || nextType;
        Message.success(t('guid.switchedToAgent', { agent: agentName }));
      } catch (error) {
        console.error('[GuidPage] Failed to switch preset agent type:', error);
        Message.error(t('common.failed', { defaultValue: 'Failed' }));
      }
    },
    [agentSelection, currentPresetAgentType, t]
  );

  // Resolve the effective agent type once - covers both direct selection and preset assistants
  const effectiveAgentTypeRaw = agentSelection.isPresetAgent
    ? agentSelection.currentEffectiveAgentInfo.agentType
    : agentSelection.selectedAgent;

  // `agent-profile` (vendored specialist assistants) and the literal
  // `wayland-core` both run on the WCore engine, NOT an ACP CLI - the send path
  // already collapses them to `wcore` (getConversationTypeForBackend in
  // buildAgentConversationParams). The model picker must use the SAME mapping or
  // it queries `curatedForAgent('agent-profile')`, gets an empty catalog, and
  // shows a dead Flux-only / "no models" picker that can never hold a pick
  // (#380, assistant model picker + persistence). Map at the picker boundary so
  // assistants surface the Wayland Core catalog and default to a WCore model.
  const WCORE_ALIAS_TYPES = new Set(['agent-profile', 'wayland-core']);
  const effectiveAgentType = WCORE_ALIAS_TYPES.has(effectiveAgentTypeRaw) ? 'wcore' : effectiveAgentTypeRaw;

  // Agents that use configured model providers instead of ACP probe-based models
  const PROVIDER_BASED_AGENTS = new Set(['gemini', 'wcore']);
  const isGeminiMode =
    PROVIDER_BASED_AGENTS.has(effectiveAgentType) &&
    // WCore-alias presets always resolve to the always-present bundled engine, so
    // the per-agent `isAvailable` probe (keyed on the raw preset type, which is
    // never a detected backend) must not gate them out of the provider picker.
    (!agentSelection.isPresetAgent ||
      agentSelection.currentEffectiveAgentInfo.isAvailable ||
      WCORE_ALIAS_TYPES.has(effectiveAgentTypeRaw));

  // Build the mention dropdown node
  const mentionDropdownNode = (
    <MentionDropdown
      menuRef={mention.mentionMenuRef}
      options={mention.filteredMentionOptions}
      selectedKey={mention.mentionMenuSelectedKey}
      onSelect={mention.selectMentionAgent}
    />
  );

  // Build the model selector node
  const modelSelectorNode = (
    <GuidModelSelector
      isGeminiMode={isGeminiMode}
      modelList={modelSelection.modelList}
      currentModel={modelSelection.currentModel}
      setCurrentModel={modelSelection.setCurrentModel}
      agentKey={effectiveAgentType}
      currentAcpCachedModelInfo={agentSelection.currentAcpCachedModelInfo}
      selectedAcpModel={agentSelection.selectedAcpModel}
      setSelectedAcpModel={agentSelection.setSelectedAcpModel}
    />
  );

  const handleSpeechTranscript = useCallback(
    (transcript: string) => {
      guidInput.setInput((prev) => appendSpeechTranscript(prev, transcript));
    },
    [guidInput.setInput]
  );

  // Build the action row
  const actionRowNode = (
    <GuidActionRow
      files={guidInput.files}
      onFilesUploaded={guidInput.handleFilesUploaded}
      onSelectWorkspace={(dir) => guidInput.setDir(dir)}
      modelSelectorNode={modelSelectorNode}
      selectedAgent={agentSelection.selectedAgent}
      effectiveModeAgent={agentSelection.currentEffectiveAgentInfo.agentType}
      selectedMode={agentSelection.selectedMode}
      onModeSelect={agentSelection.setSelectedMode}
      isPresetAgent={agentSelection.isPresetAgent}
      selectedAgentInfo={agentSelection.selectedAgentInfo}
      customAgents={agentSelection.customAgents}
      localeKey={localeKey}
      onClosePresetTag={() => agentSelection.setSelectedAgentKey(agentSelection.defaultAgentKey)}
      agentLogo={effectiveAgentLogo}
      agentSwitcherItems={agentSwitcherItems}
      onAgentSwitch={(key) => {
        handlePresetAgentTypeSwitch(key).catch((err) => console.error('Failed to switch agent type:', err));
      }}
      configOptionsBackend={agentSelection.currentEffectiveAgentInfo.agentType}
      cachedConfigOptions={agentSelection.cachedConfigOptions}
      onConfigOptionSelect={agentSelection.setPendingConfigOption}
      builtinAutoSkills={builtinAutoSkills}
      disabledBuiltinSkills={guidDisabledBuiltinSkills ?? []}
      onToggleBuiltinSkill={handleToggleBuiltinSkill}
      draftText={guidInput.input}
      onStagedSkillsChange={setStagedSessionSkills}
      hidePresetTag
      loading={guidInput.loading}
      isButtonDisabled={send.isButtonDisabled}
      noModelConfigured={send.noModelConfigured}
      speechInputNode={
        <SpeechInputButton variant='prominent' locale={i18n.language} onTranscript={handleSpeechTranscript} />
      }
      onSend={() => {
        // MED-3: only record telemetry on successful send. handleSend
        // resolves false on validation early-returns and rejects on
        // create-call failure; both must skip recordMessageSent.
        send
          .handleSend()
          .then((ok) => {
            if (ok) recordMessageSent();
          })
          .catch((error) => {
            console.error('Failed to send message:', error);
          });
      }}
    />
  );

  // W3 (v0.6.1): WorkflowSurface is now mounted on the conversation page
  // (/conversation/:id) so the chrome wraps the live chat tape and input.
  // If we somehow land here with a workflow route state (e.g. stale
  // navigation), redirect to the conversation page so the chrome renders
  // in the correct shell. This guard is a safety net only - the primary
  // navigation path goes through WorkflowDetailModal → /conversation/:id.
  if (workflowSession.isActive() && workflowRouteState?.workflowSessionId) {
    const convId = workflowSession.data?.conversation_id;
    if (convId) {
      void navigate(`/conversation/${convId}`, {
        replace: true,
        state: {
          workflowSessionId: workflowRouteState.workflowSessionId,
          initialWorkflowSession: workflowRouteState.initialWorkflowSession,
        },
      });
    }
    return null;
  }

  return (
    <ConfigProvider getPopupContainer={() => guidContainerRef.current || document.body}>
      <div ref={guidContainerRef} className={styles.guidContainer}>
        <div className={styles.guidLayout}>
          {showPresetHero ? (
            <div className={styles.heroHeader}>
              <div className={styles.heroHeaderControls}>
                <div className={styles.heroHeaderLeft}>
                  <Button
                    size='mini'
                    type='text'
                    shape='circle'
                    icon={<ChevronLeft size={18} />}
                    className={styles.heroBackButton}
                    onClick={() => {
                      agentSelection.setSelectedAgentKey(agentSelection.defaultAgentKey);
                      guidInput.setInput('');
                      setIsDescriptionExpanded(false);
                    }}
                    aria-label={t('common.back')}
                  />
                  <p className={`${styles.heroTitle} text-2xl font-semibold mb-0 text-0`}>
                    <AssistantIconTile paletteKey={selectedAssistantPaletteKey} size='md'>
                      {selectedAssistantAvatar?.kind === 'lucide' ? (
                        (() => {
                          const Icon = selectedAssistantAvatar.Icon;
                          return <Icon size={22} />;
                        })()
                      ) : selectedAssistantAvatar?.kind === 'image' ? (
                        <img src={selectedAssistantAvatar.value} alt='' style={{ objectFit: 'contain' }} />
                      ) : selectedAssistantAvatar?.kind === 'emoji' ? (
                        <span className={styles.heroTitleEmoji}>{selectedAssistantAvatar.value}</span>
                      ) : (
                        <Bot size={22} />
                      )}
                    </AssistantIconTile>
                    <span>{heroTitle}</span>
                  </p>
                  <Button
                    size='mini'
                    type='text'
                    icon={<PenSquare size={16} />}
                    className={styles.heroTitleEdit}
                    onClick={() => openAssistantDetailsRef.current?.()}
                    aria-label={t('settings.editAssistant', { defaultValue: 'Assistant Details' })}
                  />
                </div>
                <div className={styles.heroHeaderRight}>
                  <Dropdown
                    trigger='click'
                    position='bl'
                    droplist={
                      <Menu
                        onClickMenuItem={(key) => {
                          handlePresetAgentTypeSwitch(String(key)).catch((err) =>
                            console.error('Failed to switch agent type:', err)
                          );
                        }}
                      >
                        {agentSwitcherItems.map((item) => {
                          const logo = getAgentLogo(item.key);
                          return (
                            <Menu.Item key={item.key}>
                              <div className='flex items-center justify-between gap-12px min-w-120px'>
                                <span className='flex items-center gap-6px'>
                                  {logo ? (
                                    <img
                                      src={logo}
                                      alt=''
                                      width={16}
                                      height={16}
                                      style={{ objectFit: 'contain', flexShrink: 0 }}
                                    />
                                  ) : (
                                    <Bot size={16} style={{ flexShrink: 0 }} />
                                  )}
                                  {item.label}
                                  {'isExtension' in item && item.isExtension ? (
                                    <span className='text-11px px-4px py-1px rd-4px bg-[rgb(var(--arcoblue-1))] text-[rgb(var(--arcoblue-6))]'>
                                      ext
                                    </span>
                                  ) : null}
                                </span>
                                {item.isCurrent ? <span>✓</span> : null}
                              </div>
                            </Menu.Item>
                          );
                        })}
                      </Menu>
                    }
                  >
                    <Button size='mini' type='text' className={styles.heroAgentSwitchButton}>
                      <span className='inline-flex items-center gap-4px'>
                        {effectiveAgentLogo ? (
                          <img
                            src={effectiveAgentLogo}
                            alt=''
                            width={20}
                            height={20}
                            className={styles.heroAgentSwitchIcon}
                          />
                        ) : (
                          <Bot size={20} />
                        )}
                        <ChevronDown size={16} />
                      </span>
                    </Button>
                  </Dropdown>
                </div>
              </div>
            </div>
          ) : null}

          {showPresetHero && selectedAssistantDescription ? (
            <div
              className={`${styles.heroSubtitle} ${isDescriptionExpanded ? styles.heroSubtitleExpanded : ''}`}
              onClick={() => {
                if (!canExpandDescription) return;
                setIsDescriptionExpanded((v) => !v);
              }}
            >
              <div
                ref={descriptionTextRef}
                className={`${styles.heroSubtitleText} ${isDescriptionExpanded ? styles.heroSubtitleTextExpanded : ''}`}
              >
                {selectedAssistantDescription}
              </div>
              {canExpandDescription ? (
                <Button
                  size='mini'
                  type='secondary'
                  shape='circle'
                  icon={<ChevronDown size={12} />}
                  className={`${styles.heroSubtitleToggle} ${isDescriptionExpanded ? styles.heroSubtitleToggleExpanded : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDescriptionExpanded((v) => !v);
                  }}
                  aria-label={
                    isDescriptionExpanded
                      ? t('common.collapse', { defaultValue: 'Collapse' })
                      : t('common.expand', { defaultValue: 'Expand' })
                  }
                />
              ) : null}
            </div>
          ) : !showPresetHero && visibleAgents === undefined ? (
            <AgentPillBarSkeleton />
          ) : !showPresetHero && visibleAgents.length > 0 ? (
            <AgentPillBar
              availableAgents={visibleAgents}
              selectedAgentKey={agentSelection.selectedAgentKey}
              getAgentKey={agentSelection.getAgentKey}
              onSelectAgent={handleSelectAgent}
              suppressSelectionAnimation={resetAssistantRequested}
            />
          ) : null}

          {projectName ? (
            <div className='flex justify-center mb-8px'>
              <div
                className='flex items-center gap-6px px-12px py-5px rd-full text-13px font-500'
                style={{ background: 'rgba(var(--primary-6),0.12)', color: 'rgb(var(--primary-6))' }}
              >
                <FolderKanban size={14} />
                <span>{t('projects.composer.newChatIn', { name: projectName })}</span>
              </div>
            </div>
          ) : null}

          {!showPresetHero ? <Greeting displayName={greetingDisplayName} /> : null}

          {/* #52: persistent inline CTA when no usable model is configured
              (fresh install, or a cloud install where onboarding was skipped).
              Sits below the greeting and above the composer. The same predicate
              drives the disabled Send button so they never diverge. On the
              headless web server the Models page is read-only, so the copy
              points at Flux / server-side config (isWebServer branch). */}
          {send.noModelConfigured ? (
            <NoModelCtaCard isRemote={isWebServer} onSetup={() => navigate('/settings/models')} />
          ) : null}

          <GuidInputCard
            input={guidInput.input}
            onInputChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onPaste={guidInput.onPaste}
            onFocus={guidInput.handleTextareaFocus}
            onBlur={guidInput.handleTextareaBlur}
            textareaRef={guidInput.textareaRef}
            placeholder={`${mention.selectedAgentLabel}, ${typewriterPlaceholder || t('conversation.welcome.placeholder')}`}
            isInputActive={guidInput.isInputFocused}
            isFileDragging={guidInput.isFileDragging}
            activeBorderColor={activeBorderColor}
            inactiveBorderColor={inactiveBorderColor}
            activeShadow={activeShadow}
            dragHandlers={guidInput.dragHandlers}
            mentionOpen={mention.mentionOpen}
            mentionSelectorBadge={
              <MentionSelectorBadge
                visible={mention.mentionSelectorVisible}
                open={mention.mentionSelectorOpen}
                onOpenChange={mention.setMentionSelectorOpen}
                agentLabel={mention.selectedAgentLabel}
                mentionMenu={mentionDropdownNode}
                onResetQuery={() => mention.setMentionQuery(null)}
              />
            }
            mentionDropdown={mentionDropdownNode}
            files={guidInput.files}
            onRemoveFile={guidInput.handleRemoveFile}
            dir={guidInput.dir}
            onClearDir={() => guidInput.setDir('')}
            actionRow={actionRowNode}
          />

          {/* v0.4.7 - KickoffCard mounts BELOW the input (render-then-hydrate)
              so the primary `[Yes, let's start]` button never steals the
              first keystroke. Only renders for preset assistants - generic
              new-chat surfaces (no assistant yet) still use Greeting above. */}
          {showPresetHero && kickoff.visible && kickoff.currentText ? (
            <KickoffCard
              text={kickoff.currentText}
              onAccept={handleKickoffAccept}
              onRedirect={kickoff.redirect}
              onDismiss={kickoff.dismissByInteraction}
            />
          ) : null}

          {!showPresetHero ? (
            <div className={styles.newChatStarter} data-testid='new-chat-starter'>
              <LaunchpadBar
                onAnchorClick={handleQuickLaunchAnchor}
                onViewAll={handleQuickLaunchViewAll}
                mode='compact'
              />
              <IntentPillBar activeIntent={activeIntent} onSelect={handleSelectIntent} />
              {activeIntent ? (
                <IntentSuggestionPanel
                  intent={activeIntent}
                  onSelect={handleSelectIntentPrompt}
                  onClose={handleCloseIntentPanel}
                />
              ) : null}
            </div>
          ) : null}

          {/* Phase 2 keeps AssistantSelectionArea mounted only for its modal/drawer
              tree (edit drawer, skills modals). The inline pill grid is owned by
              the layered starter above. Phase 6 deletes this component outright. */}
          <AssistantSelectionArea
            isPresetAgent={agentSelection.isPresetAgent}
            selectedAgentInfo={agentSelection.selectedAgentInfo}
            customAgents={agentSelection.customAgents}
            localeKey={localeKey}
            currentEffectiveAgentInfo={agentSelection.currentEffectiveAgentInfo}
            onSelectAssistant={handleSelectAssistant}
            onSetInput={guidInput.setInput}
            onFocusInput={guidInput.handleTextareaFocus}
            onRegisterOpenDetails={(openDetails) => {
              openAssistantDetailsRef.current = openDetails;
            }}
            excludeKickoffId={kickoff.currentKickoffId}
            showKickoffGrid={showPresetHero}
            hideInlineGrid
          />
        </div>

        <HomeHintBar chatStartedCount={chatStartedCount} />
        <FeedbackReportModal visible={showFeedbackModal} onCancel={() => setShowFeedbackModal(false)} />
      </div>
    </ConfigProvider>
  );
};

export default GuidPage;
