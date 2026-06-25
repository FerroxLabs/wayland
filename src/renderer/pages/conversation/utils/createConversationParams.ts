/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigStorage } from '@/common/config/storage';
import type { ICreateConversationParams } from '@/common/adapter/ipcBridge';
import { modelRegistry, systemSettings } from '@/common/adapter/ipcBridge';
import type { TProviderWithModel } from '@/common/config/storage';
import type { AcpBackend } from '@/common/types/acpTypes';
import { getFluxCompat } from '@/common/types/acpTypes';
import { FLUX_AUTO_MODEL, FLUX_PROVIDER_ID } from '@/common/config/flux';
import { DEFAULT_CODEX_MODELS } from '@/common/types/codex/codexModels';
import { resolveLocaleKey } from '@/common/utils';
import { loadPresetAssistantResources } from '@/common/utils/presetAssistantResources';
import {
  buildAgentConversationParams,
  getConversationTypeForBackend,
} from '@/common/utils/buildAgentConversationParams';
import type { AvailableAgent } from '@/renderer/utils/model/agentTypes';
import { getAgentModes } from '@/renderer/utils/model/agentModes';

type ModePreference = {
  preferredMode?: string;
  yoloMode?: boolean;
};

const LEGACY_YOLO_MODE_MAP: Partial<Record<string, string>> = {
  claude: 'bypassPermissions',
  codex: 'yolo',
  gemini: 'yolo',
  qwen: 'yolo',
};

async function resolvePreferredMode(backend: string): Promise<string | undefined> {
  const modeOptions = getAgentModes(backend);
  if (modeOptions.length === 0) {
    return undefined;
  }

  let preference: ModePreference | undefined;

  if (backend === 'gemini') {
    preference = await ConfigStorage.get('gemini.config');
  } else if (backend === 'wcore') {
    preference = await ConfigStorage.get('wcore.config');
  } else {
    const acpConfig = await ConfigStorage.get('acp.config');
    preference = acpConfig?.[backend as AcpBackend];
  }

  if (preference?.preferredMode && modeOptions.some((option) => option.value === preference.preferredMode)) {
    return preference.preferredMode;
  }

  const legacyMode = LEGACY_YOLO_MODE_MAP[backend];
  if (preference?.yoloMode && legacyMode && modeOptions.some((option) => option.value === legacyMode)) {
    return legacyMode;
  }

  return undefined;
}

async function resolvePreferredAcpModelId(backend: string): Promise<string | undefined> {
  const acpConfig = await ConfigStorage.get('acp.config');
  const backendConfig = acpConfig?.[backend as AcpBackend] as { preferredModelId?: string } | undefined;
  const preferredModelId = backendConfig?.preferredModelId;
  if (typeof preferredModelId === 'string' && preferredModelId.trim().length > 0) {
    return preferredModelId;
  }

  // A native Claude login must not be silently routed through Flux: when the
  // user is on the Claude Code backend with a real Claude login, a fresh chat
  // defaults to their subscription slot (e.g. Opus) rather than flux-auto, so it
  // runs on their subscription (native) and the explicit-native-pick rule keeps
  // it off Flux even when "Route all agents through Flux" is globally on. An
  // explicit per-backend pin (above) still wins, so they can deliberately choose
  // Flux. Returns null when there is no native Claude login (keeps flux default).
  if (backend === 'claude') {
    try {
      const nativeClaudeDefault = await systemSettings.getClaudeNativeDefaultModelId.invoke();
      if (typeof nativeClaudeDefault === 'string' && nativeClaudeDefault.trim().length > 0) {
        return nativeClaudeDefault;
      }
    } catch {
      /* no native login signal — fall through to cached/flux default */
    }
  }

  const cachedModels = await ConfigStorage.get('acp.cachedModels');
  const cachedModelId = cachedModels?.[backend]?.currentModelId;
  if (typeof cachedModelId === 'string' && cachedModelId.trim().length > 0) {
    return cachedModelId;
  }

  // Toggle default role (R5): with no explicit per-chat pin, a Flux-capable
  // backend defaults its model to flux-auto when "Route all agents through Flux"
  // is on AND Flux is connected, so the toggle routes new chats through Flux.
  // Checked BEFORE the codex native default below, otherwise codex's early return
  // blocked Flux defaulting entirely. An explicit native pick is written into
  // preferredModelId/cachedModels above and wins here (explicit native stays native).
  if (await shouldDefaultToFluxAuto(backend)) {
    return FLUX_AUTO_MODEL;
  }

  // Codex needs a native default (its picker is empty pre-session); applies only
  // when Flux defaulting above did not fire.
  if (backend === 'codex' && DEFAULT_CODEX_MODELS.length > 0) {
    return DEFAULT_CODEX_MODELS[0]?.id;
  }

  return undefined;
}

/**
 * Whether a brand-new chat for `backend` should default its model to flux-auto.
 * True only when the backend is Flux-routable (not vendor-locked), the global
 * "route through Flux" toggle is on, and the flux-router provider is connected.
 * Any failure resolves false so model selection is never broken by a flux probe.
 */
async function shouldDefaultToFluxAuto(backend: string): Promise<boolean> {
  if (getFluxCompat(backend) === undefined || getFluxCompat(backend) === 'vendor') {
    return false;
  }
  try {
    const routeThroughFlux = await systemSettings.getRouteThroughFlux.invoke();
    if (!routeThroughFlux) return false;
    const providers = await modelRegistry.list.invoke();
    return Array.isArray(providers) && providers.some((p) => p.providerId === FLUX_PROVIDER_ID);
  } catch {
    return false;
  }
}

/**
 * Get a model from configured providers that is compatible with Wayland Core.
 * Wayland Core supports all platforms via OpenAI-compatible protocol.
 * Throws if no compatible provider is configured.
 */
export async function getDefaultWCoreModel(): Promise<TProviderWithModel> {
  const providers = await ConfigStorage.get('model.config');

  if (!providers || providers.length === 0) {
    throw new Error('No model provider configured');
  }

  // Wayland Core supports all platforms via OpenAI-compatible protocol
  const provider = providers.find((p) => p.enabled !== false);
  if (!provider) {
    throw new Error('No enabled model provider for Wayland Core');
  }

  const enabledModel = provider.model.find((m) => provider.modelEnabled?.[m] !== false);

  return {
    id: provider.id,
    platform: provider.platform,
    name: provider.name,
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    useModel: enabledModel || provider.model[0],
    capabilities: provider.capabilities,
    contextLimit: provider.contextLimit,
    modelProtocols: provider.modelProtocols,
    bedrockConfig: provider.bedrockConfig,
    enabled: provider.enabled,
    modelEnabled: provider.modelEnabled,
    modelHealth: provider.modelHealth,
  };
}

/**
 * Get the default Gemini model configuration from user settings.
 * Throws if no enabled provider or model is configured.
 * [BUG-3 fix]: callers must call this inside a try block
 */
export async function getDefaultGeminiModel(): Promise<TProviderWithModel> {
  const providers = await ConfigStorage.get('model.config');

  if (!providers || providers.length === 0) {
    throw new Error('No model provider configured');
  }

  const enabledProvider = providers.find((p) => p.enabled !== false);
  if (!enabledProvider) {
    throw new Error('No enabled model provider');
  }

  const enabledModel = enabledProvider.model.find((m) => enabledProvider.modelEnabled?.[m] !== false);

  return {
    id: enabledProvider.id,
    platform: enabledProvider.platform,
    name: enabledProvider.name,
    baseUrl: enabledProvider.baseUrl,
    apiKey: enabledProvider.apiKey,
    useModel: enabledModel || enabledProvider.model[0],
    capabilities: enabledProvider.capabilities,
    contextLimit: enabledProvider.contextLimit,
    modelProtocols: enabledProvider.modelProtocols,
    bedrockConfig: enabledProvider.bedrockConfig,
    enabled: enabledProvider.enabled,
    modelEnabled: enabledProvider.modelEnabled,
    modelHealth: enabledProvider.modelHealth,
  };
}

/**
 * Resolve the Gemini model to use, falling back to a placeholder for Google Auth if needed.
 */
async function resolveGeminiModel(): Promise<TProviderWithModel> {
  try {
    return await getDefaultGeminiModel();
  } catch (e) {
    // Fallback to placeholder if no model configured (supports Google Auth users)
    return {
      id: 'gemini-placeholder',
      name: 'Gemini',
      useModel: 'default',
      platform: 'gemini-with-google-auth' as TProviderWithModel['platform'],
      baseUrl: '',
      apiKey: '',
    };
  }
}

/**
 * Build ICreateConversationParams for a CLI agent.
 * The backend will automatically fill in derived fields (gateway.cliPath, runtimeValidation, etc.).
 * [BUG-3 fix]: callers must invoke this inside a try block because getDefaultGeminiModel may throw.
 */
export async function buildCliAgentParams(
  agent: AvailableAgent,
  workspace: string
): Promise<ICreateConversationParams> {
  const type = getConversationTypeForBackend(agent.backend);
  const preferredMode = await resolvePreferredMode(agent.backend);
  const preferredAcpModelId = type === 'acp' ? await resolvePreferredAcpModelId(agent.backend) : undefined;

  let model: TProviderWithModel;
  if (type === 'gemini') {
    model = await resolveGeminiModel();
  } else if (type === 'wcore') {
    // Wayland Core needs a real model from configured providers (anthropic, openai, ali-intl, aws)
    model = await getDefaultWCoreModel();
  } else {
    model = {} as TProviderWithModel;
  }

  return buildAgentConversationParams({
    backend: agent.backend,
    name: agent.name,
    agentName: agent.name,
    workspace,
    cliPath: agent.cliPath,
    customAgentId: agent.customAgentId,
    model,
    sessionMode: preferredMode,
    currentModelId: preferredAcpModelId,
  });
}

/**
 * Build ICreateConversationParams for a preset assistant.
 * Applies 4-layer fallback for reading rules and skills (BUG-1 fix).
 * Uses resolveLocaleKey() to convert i18n.language to standard locale format (BUG-2 fix).
 * [BUG-3 fix]: callers must invoke this inside a try block because getDefaultGeminiModel may throw.
 */
export async function buildPresetAssistantParams(
  agent: AvailableAgent,
  workspace: string,
  language: string
): Promise<ICreateConversationParams> {
  const { customAgentId, presetAgentType = 'gemini' } = agent;

  // [BUG-2] Map raw i18n.language to standard locale key
  const localeKey = resolveLocaleKey(language);

  const {
    rules: presetContext,
    enabledSkills,
    disabledBuiltinSkills,
  } = await loadPresetAssistantResources({
    customAgentId,
    localeKey,
  });

  const type = getConversationTypeForBackend(presetAgentType);
  const preferredMode = await resolvePreferredMode(presetAgentType);
  const preferredAcpModelId = type === 'acp' ? await resolvePreferredAcpModelId(presetAgentType) : undefined;
  const model = type === 'gemini' ? await resolveGeminiModel() : ({} as TProviderWithModel);

  return buildAgentConversationParams({
    backend: agent.backend,
    name: agent.name,
    agentName: agent.name,
    workspace,
    customAgentId,
    isPreset: true,
    presetAgentType,
    presetResources: {
      rules: presetContext,
      enabledSkills,
      excludeBuiltinSkills: disabledBuiltinSkills,
    },
    model,
    sessionMode: preferredMode,
    currentModelId: preferredAcpModelId,
  });
}
