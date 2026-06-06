/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigStorage } from '@/common/config/storage';
import type { AcpBackend } from '@/renderer/pages/guid/types';
import { getAgentKey } from '@/renderer/pages/guid/hooks/agentSelectionUtils';

export type LaunchAssistantPreset = {
  id: string;
  presetAgentType?: string;
};

/**
 * Launch a chat with the given preset assistant pre-selected. This is the
 * cross-page sibling of Phase 1's selectPresetAssistant - that hook only
 * exists inside /guid, so to launch a chat *from* /assistants we persist
 * the agent key first (matching what the in-page hook would write) and
 * then navigate to /guid. The guid restoration path picks it up.
 *
 * Note: we deliberately do NOT pass `state: { resetAssistant: true }` -
 * resetAssistant is the "new chat" sidebar shortcut that wipes the saved
 * agent and falls back to the first CLI. We want the opposite here.
 *
 * @returns the computed agent key for testing / instrumentation.
 */
export const launchAssistant = async (
  preset: LaunchAssistantPreset,
  navigate: (path: string, options?: { state?: unknown }) => void | Promise<unknown>
): Promise<string> => {
  const backend = (preset.presetAgentType ?? 'gemini') as AcpBackend;
  const key = getAgentKey({ backend, customAgentId: preset.id });
  try {
    await ConfigStorage.set('guid.lastSelectedAgent', key);
  } catch (error) {
    console.error('Failed to persist selected assistant before navigation:', error);
  }
  try {
    // `launchAssistant: true` tells /guid this is an explicit cross-page
    // launch, not a cold boot. The cold-boot launchpad gate in GuidPage
    // ignores a persisted preset key on navigation (so the launchpad stays
    // the default surface); this flag opts the preset hero in so the page
    // actually opens *into* the assistant the user just clicked.
    await Promise.resolve(navigate('/guid', { state: { launchAssistant: true } }));
  } catch (error) {
    console.error('Navigation to /guid failed:', error);
  }
  return key;
};
