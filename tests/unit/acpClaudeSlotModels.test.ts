/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #184 - the claude-agent-acp bridge can advertise no models (empty list under
 * Claude subscription / OAuth auth), which left the in-chat picker stuck on a
 * dead "Select Model". `buildClaudeSlotModelInfo` is the static fallback catalog
 * so the picker is always populated + switchable. The slot ids are valid
 * `--model` / `ANTHROPIC_MODEL` aliases (verified live: `opus` -> claude-opus-4-8).
 */

import { describe, expect, it } from 'vitest';
import { buildClaudeSlotModelInfo, CLAUDE_SLOT_MODELS } from '../../src/process/agent/acp/utils';

describe('buildClaudeSlotModelInfo (#184 fallback catalog)', () => {
  it('exposes Sonnet/Opus/Haiku as switchable slots', () => {
    const info = buildClaudeSlotModelInfo();
    expect(info.availableModels.map((m) => m.id)).toEqual(['sonnet', 'opus', 'haiku']);
    expect(info.availableModels.map((m) => m.label)).toEqual(['Sonnet', 'Opus', 'Haiku']);
    expect(info.canSwitch).toBe(true);
    expect(info.source).toBe('models');
    expect(info.sourceDetail).toBe('claude-slots');
  });

  it('defaults to Sonnet for absent / unknown current model', () => {
    expect(buildClaudeSlotModelInfo().currentModelId).toBe('sonnet');
    expect(buildClaudeSlotModelInfo(null).currentModelId).toBe('sonnet');
    expect(buildClaudeSlotModelInfo('gpt-4o').currentModelId).toBe('sonnet');
  });

  it('reflects a valid user pick', () => {
    const opus = buildClaudeSlotModelInfo('opus');
    expect(opus.currentModelId).toBe('opus');
    expect(opus.currentModelLabel).toBe('Opus');

    const haiku = buildClaudeSlotModelInfo('haiku');
    expect(haiku.currentModelId).toBe('haiku');
    expect(haiku.currentModelLabel).toBe('Haiku');
  });

  it('slot ids are the claude CLI aliases (apply via --model / ANTHROPIC_MODEL)', () => {
    expect(CLAUDE_SLOT_MODELS.map((m) => m.id)).toEqual(['sonnet', 'opus', 'haiku']);
  });
});
