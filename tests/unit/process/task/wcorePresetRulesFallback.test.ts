/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { resolveWCorePresetRules } from '@process/task/WCoreManager';

/**
 * Why a wcore conversation has to read the ACP key at all.
 *
 * wcore reads `presetRules` and always has. But preset assistants created
 * through `buildAgentConversationParams` wrote their rules to `presetContext`
 * for every backend except gemini, and `ConversationServiceImpl` copies
 * unconsumed `extra` keys onto the stored row — so the persona WAS persisted,
 * on a key nothing in the wcore path ever read.
 *
 * That means the fix to the write side does not heal the conversations already
 * on disk. Every wcore preset chat created from the "+" menu or as a team
 * specialist still carries its persona under `presetContext`, and rewriting an
 * assistant's markdown would reach none of them. This fallback is what makes
 * those recover.
 */
describe('resolveWCorePresetRules', () => {
  it('reads presetRules when it is present', () => {
    expect(resolveWCorePresetRules({ presetRules: 'canonical' })).toBe('canonical');
  });

  it('recovers a persona persisted under the ACP key', () => {
    expect(resolveWCorePresetRules({ presetContext: 'stranded persona' })).toBe('stranded persona');
  });

  it('prefers presetRules when a row carries both', () => {
    expect(resolveWCorePresetRules({ presetRules: 'canonical', presetContext: 'stale' })).toBe('canonical');
  });

  /**
   * The reason this is `??` and not `||`. An assistant whose rules are an empty
   * string has expressed something; falling through to the other key would
   * resurrect a value the current write path deliberately cleared.
   */
  it('treats empty rules as a real answer rather than falling through', () => {
    expect(resolveWCorePresetRules({ presetRules: '', presetContext: 'stale' })).toBe('');
  });

  it('is undefined when neither key is set', () => {
    expect(resolveWCorePresetRules({})).toBeUndefined();
  });
});
