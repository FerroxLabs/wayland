/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import { INTENTS, INTENT_KEYS } from '@/renderer/pages/guid/intents';
import type { IntentKey } from '@/renderer/pages/guid/intents';

/**
 * Known assistant ids contributed by the wayland-teams extension bundle
 * (`contributes/assistants.json`, 44 entries at the time of Phase 2). The
 * bundle is loaded at runtime via `ipcBridge.extensions.getAssistants`, so
 * we keep a snapshot here for the static intent test to catch dangling
 * `targetAssistantId` values before they ship.
 *
 * If the bundle grows or shrinks, update this list together with any new
 * intent prompts you add.
 */
const KNOWN_EXTENSION_ASSISTANT_IDS = new Set<string>([
  'research',
  'copy',
  'sales',
  'forge',
  'mira',
  'beacon',
  'patch',
  'spark',
  'coin',
  'sentry',
  'stage',
  'helm',
  'probe',
  'vault',
  'smith',
  'mend',
  'lens',
  'verdict',
  'slate',
  'voiceprint',
  'cold-outbound',
  'product-launch',
  'sales-pipeline',
  'info-product-launch',
  'validate-before-build',
  'first-customers',
  'fundraise',
  'founder-setup',
  'bootstrap-profit',
  'affiliate-site-engine',
  'support-stack',
  'growth-loop',
  'creator-studio',
  'ecommerce-engine',
  'saas-mvp-sprint',
  'content-studio',
  'service-studio',
  'marketing-strategy',
  'damage-control',
  'marketing-agency',
  'sales-org',
  'customer-success-org',
  'editorial-newsroom',
  'dev-shop',
]);

const PRESET_IDS = new Set(ASSISTANT_PRESETS.map((preset) => preset.id));
const RESOLVABLE_IDS = new Set([...PRESET_IDS, ...KNOWN_EXTENSION_ASSISTANT_IDS]);

describe('INTENTS map', () => {
  it('exposes exactly 7 intent keys in stable order', () => {
    expect(INTENT_KEYS).toEqual(['sell', 'write', 'research', 'plan', 'build', 'run', 'learn']);
    expect(Object.keys(INTENTS)).toHaveLength(7);
  });

  it.each(INTENT_KEYS)('intent %s has exactly 5 prompts', (key: IntentKey) => {
    const intent = INTENTS[key];
    expect(intent.prompts).toHaveLength(5);
  });

  it.each(INTENT_KEYS)('intent %s has self-consistent key and non-empty label', (key: IntentKey) => {
    const intent = INTENTS[key];
    expect(intent.key).toBe(key);
    expect(intent.label.length).toBeGreaterThan(0);
  });

  it('every prompt has a non-empty title and promptText', () => {
    for (const key of INTENT_KEYS) {
      const { prompts } = INTENTS[key];
      for (const prompt of prompts) {
        expect(prompt.title.length, `intent=${key} title`).toBeGreaterThan(0);
        expect(prompt.promptText.length, `intent=${key} promptText`).toBeGreaterThan(0);
      }
    }
  });

  it('every targetAssistantId resolves against built-in presets or the known extension bundle', () => {
    const unresolved: Array<{ intent: IntentKey; targetAssistantId: string }> = [];
    for (const key of INTENT_KEYS) {
      for (const prompt of INTENTS[key].prompts) {
        if (!RESOLVABLE_IDS.has(prompt.targetAssistantId)) {
          unresolved.push({ intent: key, targetAssistantId: prompt.targetAssistantId });
        }
      }
    }
    expect(unresolved, `unresolved ids: ${JSON.stringify(unresolved)}`).toEqual([]);
  });
});
