/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { getLucideIcon, isLucideAvatar, toLucideIconName } from '@/renderer/utils/lucideAvatar';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';

/**
 * An avatar naming an icon outside the bundled set used to resolve to null and
 * render NOTHING - silently, with no warning and no fallback. The author of a
 * new assistant found out by looking at a blank circle.
 *
 * Any Lucide name now resolves: bundled ones from the static map, everything
 * else through the library's lazy loader.
 */
describe('lucide avatars accept any icon in the library', () => {
  it('resolves an icon that is NOT in the bundled fast-path map', () => {
    // Deliberately one the static map does not import.
    expect(getLucideIcon('lucide:CandlestickChart')).not.toBeNull();
  });

  it('still resolves the bundled ones', () => {
    expect(getLucideIcon('lucide:Sparkles')).not.toBeNull();
    expect(getLucideIcon('lucide:TrendingUp')).not.toBeNull();
  });

  /**
   * Validation is what keeps a typo honest. Without it a misspelling would be
   * handed to the loader and render an empty hole rather than falling through
   * to the caller's own emoji/image path.
   */
  it('returns null for a name no such icon exists under', () => {
    expect(getLucideIcon('lucide:NotARealIconName')).toBeNull();
    expect(getLucideIcon('lucide:')).toBeNull();
  });

  it('ignores avatars that are not lucide references', () => {
    expect(getLucideIcon('cowork.svg')).toBeNull();
    expect(getLucideIcon('🎯')).toBeNull();
    expect(getLucideIcon(undefined)).toBeNull();
    expect(isLucideAvatar('lucide:Bot')).toBe(true);
    expect(isLucideAvatar('cowork.svg')).toBe(false);
  });

  it('converts PascalCase component names to the loader spelling', () => {
    expect(toLucideIconName('TrendingUp')).toBe('trending-up');
    expect(toLucideIconName('BarChart3')).toBe('bar-chart-3');
    expect(toLucideIconName('CandlestickChart')).toBe('candlestick-chart');
  });

  /**
   * Component identity must be stable across calls. React keys on reference, so
   * a fresh wrapper each time would remount the icon on every render, which for
   * an avatar in a list reads as a flicker.
   */
  it('returns the same component instance for repeated lookups', () => {
    expect(getLucideIcon('lucide:CandlestickChart')).toBe(getLucideIcon('lucide:CandlestickChart'));
  });

  /**
   * The guard that matters in practice: a shipped assistant whose avatar does
   * not resolve renders a blank slot for every user.
   */
  it('every shipped preset assistant has a resolvable avatar', () => {
    const broken = ASSISTANT_PRESETS.filter(
      (preset) => isLucideAvatar(preset.avatar) && getLucideIcon(preset.avatar) === null
    ).map((preset) => `${preset.id} (${preset.avatar})`);
    expect(broken).toEqual([]);
  });
});
