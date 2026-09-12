/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import type { ICreateConversationParams } from '@/common/adapter/ipcBridge';
import type { TProviderWithModel } from '@/common/config/storage';
import type { AcpBackend, AcpBackendAll } from '@/common/types/acpTypes';

export type BuildAgentConversationPresetResources = {
  rules?: string;
  enabledSkills?: string[];
  excludeBuiltinSkills?: string[];
};

export type BuildAgentConversationInput = {
  backend: string;
  name: string;
  agentName?: string;
  presetAssistantId?: string;
  workspace: string;
  model: TProviderWithModel;
  cliPath?: string;
  customAgentId?: string;
  customWorkspace?: boolean;
  isPreset?: boolean;
  presetAgentType?: string;
  presetResources?: BuildAgentConversationPresetResources;
  sessionMode?: string;
  currentModelId?: string;
  extra?: Partial<ICreateConversationParams['extra']>;
};

/**
 * The ACP backend a launcher-facing backend id actually spawns.
 *
 * Teams emit the first-party engine under the retired engine's literal id, and
 * vendored agent-profile specialists carry no real backend and leak their
 * preset type `agent-profile`. Both mean the bundled Fuigo engine, which is an
 * ordinary ACP backend. Every other id is already the backend it names.
 */
export function resolveAcpBackendAlias(backend: string): string {
  switch (backend) {
    case 'wayland-core':
    case 'wcore':
    case 'wnano':
    case 'agent-profile':
      return 'fuigo';
    default:
      return backend;
  }
}

export function getConversationTypeForBackend(backend: string): ICreateConversationParams['type'] {
  switch (backend) {
    case 'gemini':
      return 'gemini';
    case 'openclaw-gateway':
    case 'openclaw':
      return 'openclaw-gateway';
    case 'remote':
      return 'remote';
    default:
      return 'acp';
  }
}

export function buildAgentConversationParams(input: BuildAgentConversationInput): ICreateConversationParams {
  const {
    backend,
    name,
    agentName,
    presetAssistantId,
    workspace,
    model,
    cliPath,
    customAgentId,
    customWorkspace = true,
    isPreset = false,
    presetAgentType,
    presetResources,
    sessionMode,
    currentModelId,
    extra: extraOverrides,
  } = input;

  const effectivePresetType = presetAgentType || backend;
  const effectivePresetAssistantId = presetAssistantId || customAgentId;
  const type = getConversationTypeForBackend(isPreset ? effectivePresetType : backend);
  const extra: ICreateConversationParams['extra'] = {
    workspace,
    customWorkspace,
    ...extraOverrides,
  };

  if (isPreset) {
    extra.enabledSkills = presetResources?.enabledSkills;
    extra.excludeBuiltinSkills = presetResources?.excludeBuiltinSkills;
    // Pre-load the assistant's explicitly-assigned skills on turn 1 (consumed by
    // consumePendingSessionSkills, every backend) so an assistant's skills are
    // active from the first turn, not merely searchable - the point of choosing
    // an assistant. Merge + dedupe with anything already staged in the composer
    // "+" menu. An assistant with no explicit list (undefined/empty) uses "all
    // skills", so we never pre-load the entire library.
    const assignedSkills = presetResources?.enabledSkills ?? [];
    if (assignedSkills.length > 0) {
      extra.sessionSkills = Array.from(new Set([...(extra.sessionSkills ?? []), ...assignedSkills]));
    }
    extra.presetAssistantId = effectivePresetAssistantId;
    // Which key carries the rules is not cosmetic - each backend reads exactly
    // one of them and never looks at the other.
    // `ConversationServiceImpl.injectProjectKnowledge` states the rule outright:
    // gemini reads `presetRules`, acp reads `presetContext`.
    if (type === 'gemini') {
      extra.presetRules = presetResources?.rules;
    } else {
      extra.presetContext = presetResources?.rules;
      if (type === 'acp') {
        extra.backend = resolveAcpBackendAlias(effectivePresetType) as AcpBackend;
      }
    }
  } else if (type === 'remote') {
    extra.remoteAgentId = customAgentId;
  } else if (type === 'acp' || type === 'openclaw-gateway') {
    extra.backend = resolveAcpBackendAlias(backend) as AcpBackendAll;
    extra.agentName = agentName || name;
    if (cliPath) extra.cliPath = cliPath;
    if (customAgentId) {
      extra.customAgentId = customAgentId;
    }
  }

  if (sessionMode) extra.sessionMode = sessionMode;
  if (currentModelId) extra.currentModelId = currentModelId;

  return {
    type,
    model,
    name,
    extra,
  };
}
