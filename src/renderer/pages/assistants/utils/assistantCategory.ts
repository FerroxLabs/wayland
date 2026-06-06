/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASSISTANT_PRESETS, type AssistantCategory } from '@/common/config/presets/assistantPresets';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';

export const ASSISTANT_CATEGORY_VALUES: readonly AssistantCategory[] = [
  'sell',
  'write',
  'research',
  'build',
  'run',
  'office',
  'general',
] as const;

const CATEGORY_SET: ReadonlySet<AssistantCategory> = new Set(ASSISTANT_CATEGORY_VALUES);

/**
 * Coerce an unknown value into an AssistantCategory or undefined.
 * Used to read the `category` field off raw extension manifest data.
 */
export const coerceAssistantCategory = (raw: unknown): AssistantCategory | undefined => {
  if (typeof raw !== 'string') return undefined;
  return CATEGORY_SET.has(raw as AssistantCategory) ? (raw as AssistantCategory) : undefined;
};

/**
 * Build a lookup id -> category from raw extension assistant records.
 * Built-in assistants are not included; resolve them via ASSISTANT_PRESETS lookup.
 */
export const buildExtensionCategoryMap = (
  rawExtensions: Record<string, unknown>[] | undefined
): Map<string, AssistantCategory> => {
  const map = new Map<string, AssistantCategory>();
  if (!Array.isArray(rawExtensions)) return map;
  for (const ext of rawExtensions) {
    const id = typeof ext.id === 'string' ? ext.id : '';
    if (!id) continue;
    const cat = coerceAssistantCategory(ext.category);
    if (cat) map.set(id, cat);
  }
  return map;
};

/**
 * Resolve the chat-redesign category for an assistant. Falls back to a preset
 * lookup for built-ins (their stored records predate the field), then to
 * 'general' for user-created customs.
 */
export const resolveAssistantCategory = (
  assistant: AssistantListItem,
  extensionCategoryById: Map<string, AssistantCategory>
): AssistantCategory => {
  const fromExt = extensionCategoryById.get(assistant.id);
  if (fromExt) return fromExt;
  if (assistant.isBuiltin) {
    const presetId = assistant.id.replace(/^builtin-/, '');
    const preset = ASSISTANT_PRESETS.find((p) => p.id === presetId);
    if (preset?.category) return preset.category;
  }
  return 'general';
};
