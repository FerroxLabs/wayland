/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { ConfigStorage } from '@/common/config/storage';
import type { AcpBackendConfig } from '../types';
import { DETECTED_AGENTS_SWR_KEY } from '@/renderer/utils/model/agentTypes';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { mutate } from 'swr';

type UseCustomAgentsLoaderOptions = {
  availableCustomAgentIds: Set<string>;
};

type UseCustomAgentsLoaderResult = {
  customAgents: AcpBackendConfig[];
  customAgentAvatarMap: Map<string, string | undefined>;
  refreshCustomAgents: () => Promise<void>;
};

/**
 * Hook that loads custom agents from ConfigStorage and ipcBridge.
 * Handles both user-created custom agents and extension-contributed assistants.
 */
export const useCustomAgentsLoader = ({
  availableCustomAgentIds,
}: UseCustomAgentsLoaderOptions): UseCustomAgentsLoaderResult => {
  const [customAgents, setCustomAgents] = useState<AcpBackendConfig[]>([]);

  const customAgentAvatarMap = useMemo(() => {
    return new Map(customAgents.map((agent) => [agent.id, agent.avatar]));
  }, [customAgents]);

  const loadCustomAgents = useCallback(async () => {
    try {
      const [presetAssistants, userCustomAgents, extAssistants, presetAgentTypeOverrides] = await Promise.all([
        ConfigStorage.get('assistants'),
        ConfigStorage.get('acp.customAgents'),
        ipcBridge.extensions.getAssistants.invoke().catch(() => [] as Record<string, unknown>[]),
        ConfigStorage.get('assistant.presetAgentTypeOverrides'),
      ]);
      const overrides = (presetAgentTypeOverrides || {}) as Record<string, string>;
      // User-created custom agents are always included (gated by availability);
      // they are the safe default that keeps the launch list non-empty.
      const userAgents = ((userCustomAgents || []) as AcpBackendConfig[]).filter((a) =>
        availableCustomAgentIds.has(a.id)
      );
      // Only enabled presets surface as launch choices - a disabled preset is
      // template inventory the user turned off, not something to launch.
      const enabledPresets = ((presetAssistants || []) as AcpBackendConfig[]).filter(
        (a) => a.isPreset && a.enabled !== false
      );
      const list: AcpBackendConfig[] = [...enabledPresets, ...userAgents];
      for (const ext of extAssistants) {
        const id = typeof ext.id === 'string' ? ext.id : '';
        // Skip disabled extension assistants instead of force-enabling them.
        if (!id || ext.enabled === false || list.some((a) => a.id === id)) continue;
        list.push({
          id,
          name: typeof ext.name === 'string' ? ext.name : id,
          nameI18n: ext.nameI18n as Record<string, string> | undefined,
          avatar: typeof ext.avatar === 'string' ? ext.avatar : undefined,
          isPreset: true,
          enabled: ext.enabled !== false,
          presetAgentType:
            overrides[id] ?? (typeof ext.presetAgentType === 'string' ? ext.presetAgentType : undefined),
          context: typeof ext.context === 'string' ? ext.context : undefined,
          contextI18n: ext.contextI18n as Record<string, string> | undefined,
          enabledSkills: Array.isArray(ext.enabledSkills) ? (ext.enabledSkills as string[]) : undefined,
          prompts: Array.isArray(ext.prompts) ? (ext.prompts as string[]) : undefined,
          promptsI18n: ext.promptsI18n as Record<string, string[]> | undefined,
        } as AcpBackendConfig);
      }
      // Fallback guard: if filtering left nothing AND there is preset inventory,
      // surface the presets unfiltered so the picker is never empty.
      if (list.length === 0) {
        const allPresets = ((presetAssistants || []) as AcpBackendConfig[]).filter((a) => a.isPreset);
        setCustomAgents(allPresets);
        return;
      }
      setCustomAgents(list);
    } catch (error) {
      console.error('Failed to load custom agents:', error);
    }
  }, [availableCustomAgentIds]);

  // Initial load
  useEffect(() => {
    void loadCustomAgents();
  }, [loadCustomAgents]);

  const refreshCustomAgents = useCallback(async () => {
    try {
      await ipcBridge.acpConversation.refreshCustomAgents.invoke();
      await mutate(DETECTED_AGENTS_SWR_KEY);
    } catch (error) {
      console.error('Failed to refresh custom agents:', error);
    }
    // Re-read ConfigStorage so UI reflects any changes (e.g. presetAgentType switch)
    await loadCustomAgents();
  }, [loadCustomAgents]);

  useEffect(() => {
    void refreshCustomAgents();
  }, [refreshCustomAgents]);

  return {
    customAgents,
    customAgentAvatarMap,
    refreshCustomAgents,
  };
};
