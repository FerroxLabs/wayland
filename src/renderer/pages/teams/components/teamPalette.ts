/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared palette resolution for team surfaces (roster, right rail, launcher
 * header, tabs, pane header, empty-state). Mirrors the heuristic the
 * launchpad bar uses so a specialist keeps the same tile color whether it
 * appears in the launchpad or inside a team.
 *
 * Signal priority for specialists:
 *   1. The bundle-declared `category` ('sell' | 'write' | 'research' |
 *      'build' | 'run' | 'office' | 'general'). AssistantListItem's static
 *      type does not declare this - it's added by AssistantResolver at
 *      runtime - so we read it defensively.
 *   2. `presetAgentType` (only meaningful when it matches a category-style
 *      string; for waylandteams specialists this is the LLM backend like
 *      'gemini' and yields nothing).
 *   3. id / name keyword heuristic (covers Dev Shop roles whose names -
 *      Code / Ops / Quality Gate / Counsel - don't surface a category to
 *      categoryToPaletteKey).
 *   4. Final fallback to 'cowork' so a tile shows SOME color rather than
 *      neutral gray, which reads as "broken" against the dark theme.
 */

import { categoryToPaletteKey, type PaletteKey } from '@/renderer/pages/guid/components/AssistantIconTile';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';

const heuristicPaletteFromText = (text: string | undefined): PaletteKey | undefined => {
  if (!text) return undefined;
  const lower = text.toLowerCase();
  // Order matters - more specific phrases first so "quality-gate" doesn't
  // get swallowed by the generic "dev"/"build" branch.
  if (
    lower.includes('quality') ||
    lower.includes('qa') ||
    lower.includes('gate') ||
    lower.includes('review') ||
    lower.includes('audit') ||
    lower.includes('verdict')
  )
    return 'research';
  if (lower.includes('counsel') || lower.includes('legal') || lower.includes('compliance') || lower.includes('sentry'))
    return 'finance';
  if (lower.includes('copy') || lower.includes('write') || lower.includes('content') || lower.includes('marketing'))
    return 'write';
  if (lower.includes('sales') || lower.includes('sell') || lower.includes('outbound') || lower.includes('promo'))
    return 'sales';
  if (lower.includes('launch') || lower.includes('product')) return 'launch';
  if (lower.includes('research') || lower.includes('analyst')) return 'research';
  if (lower.includes('coin') || lower.includes('money') || lower.includes('wealth') || lower.includes('finance'))
    return 'finance';
  if (
    lower.includes('code') ||
    lower.includes('dev') ||
    lower.includes('engineer') ||
    lower.includes('build') ||
    lower.includes('smith') ||
    lower.includes('architect')
  )
    return 'dev';
  if (lower.includes('ops') || lower.includes('operations') || lower.includes('infra') || lower.includes('patch'))
    return 'dev';
  if (lower.includes('cowork') || lower.includes('general')) return 'cowork';
  return undefined;
};

/**
 * Defensive read of the runtime-only `category` field on an
 * AssistantListItem. AssistantResolver attaches this when the assistant
 * comes from an extension bundle, but AcpBackendConfig's static type does
 * not declare it.
 */
const readCategory = (specialist: AssistantListItem | undefined): string | undefined => {
  if (!specialist) return undefined;
  const raw = (specialist as unknown as { category?: unknown }).category;
  return typeof raw === 'string' ? raw : undefined;
};

export const resolveSpecialistPalette = (
  specialist: AssistantListItem | undefined,
  fallbackId?: string
): PaletteKey | undefined => {
  if (specialist) {
    // 1. Bundle-declared category is the strongest signal - set explicitly
    //    by the assistant author (e.g. smith = build → dev).
    const fromCategory = categoryToPaletteKey(readCategory(specialist));
    if (fromCategory) return fromCategory;
    // 2. presetAgentType - kept for back-compat; usually the LLM backend
    //    ('gemini' / 'claude') so it rarely matches a palette.
    const fromAgentType = categoryToPaletteKey(specialist.presetAgentType);
    if (fromAgentType) return fromAgentType;
    // 3. id-based heuristic (covers older ext-* assistants without category).
    const fromId = heuristicPaletteFromText(specialist.id);
    if (fromId) return fromId;
    // 4. Name-based heuristic - last shot at picking up the Dev Shop roles
    //    (Code / Ops / Quality Gate / Counsel) whose display name carries
    //    the role keyword.
    const fromName = heuristicPaletteFromText(specialist.name);
    if (fromName) return fromName;
  }
  const fromFallback = heuristicPaletteFromText(fallbackId);
  if (fromFallback) return fromFallback;
  // 5. Always return SOME palette so the tile gets a colored frame. Gray
  //    neutral reads as broken on the dark theme.
  return 'cowork';
};

/** Palette for a team/launcher record - falls back to the dev tile for the generic team avatar. */
export const resolveTeamPalette = (
  launcher: AssistantListItem | null | undefined,
  fallbackId?: string
): PaletteKey | undefined => {
  if (launcher) {
    const fromCategory = categoryToPaletteKey(readCategory(launcher));
    if (fromCategory) return fromCategory;
    const fromId = heuristicPaletteFromText(launcher.id);
    if (fromId) return fromId;
    const fromName = heuristicPaletteFromText(launcher.name);
    if (fromName) return fromName;
  }
  return heuristicPaletteFromText(fallbackId);
};
