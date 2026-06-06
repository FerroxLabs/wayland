/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Zap,
  PenLine,
  Handshake,
  Rocket,
  BarChart3,
  Landmark,
  Bot,
  type LucideIcon,
} from 'lucide-react';
import type { PaletteKey } from '@/renderer/pages/guid/components/AssistantIconTile';
import { categoryToPaletteKey } from '@/renderer/pages/guid/components/AssistantIconTile';
import { QUICK_LAUNCH_ANCHORS } from '@/renderer/pages/guid/quickLaunchAnchors';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import { CUSTOM_AVATAR_IMAGE_MAP } from '@/renderer/pages/guid/constants';
import { getLucideIcon } from '@/renderer/utils/lucideAvatar';
import { isImageAvatar } from '@/renderer/utils/avatar';
import { resolveExtensionAssetUrl } from '@/renderer/utils/platform';

/**
 * Visual + click payload for one launchpad bar entry. The bar holds an
 * ordered array of these. Renderer maps each to a button card; click
 * runs through GuidPage.handleQuickLaunchAnchor (which expects the
 * shape used by QuickLaunchAnchor - id, label, prefill, assistantId).
 */
export type LaunchpadBarEntry = {
  /** Stable runtime id used by the bar order array and dnd-kit sortable key. */
  id: string;
  /** assistantId passed to selectPresetAssistant - same field as QuickLaunchAnchor.assistantId. */
  assistantId: string;
  /** Display label for the card body. */
  label: string;
  /** Sub-label for the card body (one line). */
  sub: string;
  /** Lucide icon component. Pre-resolved here so the renderer stays dumb. */
  Icon: LucideIcon;
  /** Tile palette key - feeds AssistantIconTile color. */
  palette: PaletteKey | undefined;
  /** Avatar string from the source (lucide:Foo / emoji / image path). Optional. */
  avatar?: string;
  /**
   * When set, render this image inside the tile instead of `Icon`. Resolved
   * here (not in the renderer) so the bar/picker stay dumb. Covers
   * mapped icons (cowork.svg), extension-bundled SVGs (`wayland-asset://…`)
   * and absolute file paths - the same resolution chain AssistantCard uses.
   */
  avatarUrl?: string;
  /**
   * Emoji glyph (when `avatar` is a plain emoji like `📊`). Mutually exclusive
   * with `avatarUrl`. Renderer shows this in the tile instead of an icon.
   */
  avatarEmoji?: string;
  /** True only for the universal Cowork autonomous-execution card. Drives the orange halo treatment. */
  isCowork: boolean;
  /** Prefill text appended to the input when card is clicked. Defaults to empty for non-anchor picks. */
  prefill?: string;
};

const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  'zap': Zap,
  'pen-line': PenLine,
  'handshake': Handshake,
  'rocket': Rocket,
  'bar-chart-3': BarChart3,
  'landmark': Landmark,
};

const stripPrefix = (id: string): string =>
  id.startsWith('builtin-') ? id.slice('builtin-'.length) : id;

/**
 * Resolve a raw assistant id (as stored in bar order) into the shape the
 * bar renderer needs. Resolution order:
 *
 *   1. QUICK_LAUNCH_ANCHORS - the 6 originally-shipped defaults. These
 *      come pre-loaded with label/sub/icon/palette/prefill so the bar
 *      looks identical to v0.5.0 on first launch.
 *   2. `assistants[]` - the full assistant catalogue (built-in + extension)
 *      passed in by the renderer. Avatar / category / nameI18n drive
 *      label and icon.
 *   3. ASSISTANT_PRESETS - fallback for ids that don't appear in (2)
 *      yet (e.g. before useAssistantList finishes loading).
 *
 * Returns null when nothing matches - the renderer silently skips. We
 * deliberately do NOT prune unknown IDs from the persisted order; an
 * extension reinstall should restore its card to the same slot.
 */
export function resolveBarEntry(
  rawId: string,
  assistants: AssistantListItem[],
  localeKey: string
): LaunchpadBarEntry | null {
  // 1. Default anchors - preserve their hand-tuned copy. Only Cowork carries
  //    the orange-halo treatment; the other five anchors get the same neutral
  //    chrome as picker-added cards (palette still tints the tile).
  const anchor = QUICK_LAUNCH_ANCHORS.find((a) => a.assistantId === rawId);
  if (anchor) {
    return {
      id: rawId,
      assistantId: rawId,
      label: anchor.label,
      sub: anchor.sub,
      Icon: LUCIDE_ICON_MAP[anchor.lucideIcon] ?? Zap,
      palette: anchorPalette(anchor.id),
      isCowork: rawId === 'builtin-cowork',
      prefill: anchor.prefill,
    };
  }

  // 2. Live catalogue.
  const bareId = stripPrefix(rawId);
  const fromCatalogue = assistants.find((a) => a.id === rawId || a.id === bareId);
  if (fromCatalogue) {
    return entryFromAssistant(rawId, fromCatalogue, localeKey);
  }

  // 3. Preset catalogue (covers built-ins before useAssistantList resolves).
  const preset = ASSISTANT_PRESETS.find((p) => p.id === bareId);
  if (preset) {
    const label = preset.nameI18n[localeKey] || preset.nameI18n['en-US'] || preset.id;
    const description = preset.descriptionI18n?.[localeKey] || preset.descriptionI18n?.['en-US'] || '';
    return {
      id: rawId,
      assistantId: rawId,
      label,
      sub: truncate(description, 28),
      ...iconFromAvatar(preset.avatar),
      palette: categoryToPaletteKey(preset.category),
      avatar: preset.avatar,
      isCowork: false,
    };
  }

  return null;
}

function entryFromAssistant(rawId: string, a: AssistantListItem, localeKey: string): LaunchpadBarEntry {
  const label = a.nameI18n?.[localeKey] || a.nameI18n?.['en-US'] || a.name || a.id;
  const description = a.descriptionI18n?.[localeKey] || a.descriptionI18n?.['en-US'] || a.description || '';
  // Extension assistants carry their category on the raw record; for the renderer
  // we only have the resolved AssistantListItem so fall back to a heuristic on id.
  const palette = categoryToPaletteKey(a._kind) ?? heuristicPaletteFromId(a.id);
  return {
    id: rawId,
    assistantId: rawId,
    label,
    sub: truncate(description, 28),
    ...iconFromAvatar(a.avatar),
    palette,
    avatar: a.avatar,
    isCowork: false,
  };
}

/**
 * Map an `avatar` string to the renderer-ready `{ Icon, avatarUrl?, avatarEmoji? }`.
 * Mirrors the resolution chain used by AssistantCard so the bar/picker glyphs
 * match what the assistants library shows. Resolution priority:
 *   1. `lucide:Foo` → Lucide component (no avatarUrl).
 *   2. Known CUSTOM_AVATAR_IMAGE_MAP entry (e.g. 'cowork.svg' → bundled SVG).
 *   3. `wayland-asset://…` or file:// path → resolveExtensionAssetUrl().
 *   4. Plain image filename (svg/png/etc.) recognised by isImageAvatar.
 *   5. Single-char/emoji → render as a glyph.
 *   6. Anything else → fall back to the Bot icon.
 */
function iconFromAvatar(
  avatar: string | undefined
): { Icon: LucideIcon; avatarUrl?: string; avatarEmoji?: string } {
  const value = avatar?.trim();
  if (!value) return { Icon: Bot };

  const LucideIconComponent = getLucideIcon(value);
  if (LucideIconComponent) return { Icon: LucideIconComponent };

  const mapped = CUSTOM_AVATAR_IMAGE_MAP[value];
  const resolved = mapped || resolveExtensionAssetUrl(value) || value;
  if (resolved && isImageAvatar(resolved)) {
    return { Icon: Bot, avatarUrl: resolved };
  }

  // Anything left (e.g. a single emoji glyph like `📊`) renders as text in the tile.
  return { Icon: Bot, avatarEmoji: value };
}

function anchorPalette(anchorId: string): PaletteKey {
  switch (anchorId) {
    case 'cowork':
      return 'cowork';
    case 'write-copy':
      return 'write';
    case 'close-deal':
      return 'sales';
    case 'launch-it':
      return 'launch';
    case 'numbers':
    case 'quiet-money':
      return 'finance';
    default:
      return 'cowork';
  }
}

function heuristicPaletteFromId(id: string): PaletteKey | undefined {
  const lower = id.toLowerCase();
  if (lower.includes('copy') || lower.includes('write')) return 'write';
  if (lower.includes('sales') || lower.includes('sell')) return 'sales';
  if (lower.includes('launch')) return 'launch';
  if (lower.includes('research')) return 'research';
  if (lower.includes('coin') || lower.includes('money') || lower.includes('wealth')) return 'finance';
  if (lower.includes('dev') || lower.includes('engineer')) return 'dev';
  return undefined;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}
