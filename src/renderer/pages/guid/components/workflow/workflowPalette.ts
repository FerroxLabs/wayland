/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure mapping from a workflow category string to a palette token used
 * across the workflow chrome and step rail. Tokens are consumed by the
 * shared `AssistantIconTile` system + the `--workflow-accent` CSS variable
 * set on `WorkflowSurface` root.
 *
 * Source of truth: SPEC.md §13.
 */

export type PaletteKey =
  | 'business-ops'
  | 'violet'
  | 'rose'
  | 'blue'
  | 'amber'
  | 'emerald'
  | 'slate'
  | 'orange';

export const WORKFLOW_CATEGORY_PALETTE: Readonly<Record<string, PaletteKey>> = {
  'Business Operations': 'business-ops',
  'Content Creation': 'violet',
  'Creative Projects': 'rose',
  Career: 'blue',
  Lifestyle: 'amber',
  'Software & Engineering': 'emerald',
  'Cross-Domain': 'slate',
};

/**
 * Resolve a workflow category to its palette token. Unknown, null, or
 * empty categories fall through to `'orange'` (the default workflow hue).
 */
export function resolveWorkflowPalette(category: string | null): PaletteKey {
  if (!category) return 'orange';
  return WORKFLOW_CATEGORY_PALETTE[category] ?? 'orange';
}
