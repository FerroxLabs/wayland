/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared palette resolution for team surfaces (roster, right rail, launcher
 * header). Mirrors the heuristic the launchpad bar uses so a specialist
 * keeps the same tile color whether it appears in the launchpad or inside a
 * team. AssistantListItem does not carry a `category` field, so we derive
 * the palette from `presetAgentType` first (covers built-ins) and fall back
 * to id-based keyword matching (covers waylandteams specialists like
 * ext-money-strategist).
 */

import {
  categoryToPaletteKey,
  type PaletteKey,
} from '@/renderer/pages/guid/components/AssistantIconTile';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';

const heuristicPaletteFromId = (id: string | undefined): PaletteKey | undefined => {
  if (!id) return undefined;
  const lower = id.toLowerCase();
  if (lower.includes('copy') || lower.includes('write') || lower.includes('content')) return 'write';
  if (lower.includes('sales') || lower.includes('sell') || lower.includes('outbound')) return 'sales';
  if (lower.includes('launch')) return 'launch';
  if (lower.includes('research') || lower.includes('analyst')) return 'research';
  if (
    lower.includes('coin') ||
    lower.includes('money') ||
    lower.includes('wealth') ||
    lower.includes('finance')
  )
    return 'finance';
  if (lower.includes('dev') || lower.includes('engineer') || lower.includes('build')) return 'dev';
  return undefined;
};

export const resolveSpecialistPalette = (
  specialist: AssistantListItem | undefined,
  fallbackId?: string
): PaletteKey | undefined => {
  if (specialist) {
    const fromAgentType = categoryToPaletteKey(specialist.presetAgentType);
    if (fromAgentType) return fromAgentType;
    const fromId = heuristicPaletteFromId(specialist.id);
    if (fromId) return fromId;
  }
  return heuristicPaletteFromId(fallbackId);
};

/** Palette for a team/launcher record — falls back to the dev tile for the generic team avatar. */
export const resolveTeamPalette = (
  launcher: AssistantListItem | null | undefined,
  fallbackId?: string
): PaletteKey | undefined => {
  if (launcher) {
    const fromId = heuristicPaletteFromId(launcher.id);
    if (fromId) return fromId;
  }
  return heuristicPaletteFromId(fallbackId);
};
