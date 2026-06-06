/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import useSWR from 'swr';
import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';
import type { AcpBackendConfig } from '@/common/types/acpTypes';
import { DETECTED_AGENTS_SWR_KEY, fetchDetectedAgents } from '@/renderer/utils/model/agentTypes';
import type { AvailableAgent } from '@/renderer/utils/model/agentTypes';

export type UseConversationAgentsResult = {
  /** Detected execution engines (acp, extension, remote, wcore, gemini, etc.) */
  cliAgents: AvailableAgent[];
  /** Preset assistants from config layer */
  presetAssistants: AvailableAgent[];
  /** Loading state */
  isLoading: boolean;
  /** Refresh data */
  refresh: () => Promise<void>;
};

/**
 * Convert a preset assistant config into an AvailableAgent shape.
 */
function configToAvailableAgent(config: AcpBackendConfig): AvailableAgent {
  return {
    backend: config.presetAgentType || 'gemini',
    name: config.name,
    customAgentId: config.id,
    isPreset: true,
    context: config.context,
    avatar: config.avatar,
    presetAgentType: config.presetAgentType,
  };
}

/**
 * Convert an extension-contributed assistant (from ipcBridge.extensions.getAssistants)
 * into an AvailableAgent shape. Extension assistants live in a separate store from
 * ConfigStorage('assistants') and must be merged in so they surface in the
 * TeamCreateModal leader dropdown alongside built-in presets.
 */
function extensionAssistantToAvailableAgent(ext: Record<string, unknown>): AvailableAgent {
  const presetAgentType = typeof ext.presetAgentType === 'string' ? ext.presetAgentType : undefined;
  const context = typeof ext.context === 'string' ? ext.context : undefined;
  const avatar = typeof ext.avatar === 'string' ? ext.avatar : undefined;
  return {
    backend: presetAgentType || 'gemini',
    name: String(ext.name ?? ''),
    customAgentId: String(ext.id ?? ''),
    isPreset: true,
    isExtension: true,
    context,
    avatar,
    presetAgentType,
  };
}

/**
 * Hook to fetch available CLI agents and preset assistants for the conversation tab dropdown.
 *
 * Two independent data sources:
 *   - Execution engines - from AgentRegistry via IPC (agents.detected)
 *   - Preset assistants - from ConfigStorage ('assistants')
 */
export const useConversationAgents = (): UseConversationAgentsResult => {
  // Execution engines from AgentRegistry (shared cache with useDetectedAgents / useGuidAgentSelection)
  const {
    data: cliAgents,
    isLoading: isLoadingAgents,
    mutate,
  } = useSWR<AvailableAgent[]>(DETECTED_AGENTS_SWR_KEY, fetchDetectedAgents);

  // Preset assistants from config layer
  const { data: presetConfigs, isLoading: isLoadingPresets } = useSWR('assistants.presets', async () => {
    const agents: AcpBackendConfig[] = (await ConfigStorage.get('assistants')) || [];
    return agents.filter((a) => a.isPreset && a.enabled !== false);
  });

  // Extension-contributed assistants (shared SWR key with useAssistantList / usePresetAssistantInfo)
  const { data: extensionAssistants, isLoading: isLoadingExtensionAssistants } = useSWR(
    'extensions.assistants',
    () => ipcBridge.extensions.getAssistants.invoke().catch(() => [] as Record<string, unknown>[])
  );

  const presetAssistants = useMemo(() => {
    const configBased = (presetConfigs || []).map(configToAvailableAgent);
    const extensionBased = (extensionAssistants || [])
      .filter((ext) => ext && ext.enabled !== false)
      .map(extensionAssistantToAvailableAgent);
    // Dedupe by customAgentId - config layer wins if both sources surface the same ID
    const seen = new Set<string>();
    const merged: AvailableAgent[] = [];
    for (const agent of [...configBased, ...extensionBased]) {
      const key = agent.customAgentId;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(agent);
    }
    return merged;
  }, [presetConfigs, extensionAssistants]);

  const refresh = async () => {
    await mutate();
  };

  return {
    cliAgents: cliAgents || [],
    presetAssistants,
    isLoading: isLoadingAgents || isLoadingPresets || isLoadingExtensionAssistants,
    refresh,
  };
};
