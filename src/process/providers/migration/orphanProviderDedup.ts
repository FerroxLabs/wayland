/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Boot cleanup that removes orphaned pre-registry provider rows from the legacy
 * `model.config` blob.
 *
 * ### The duplicate
 *
 * Before the model registry existed, providers were added straight into
 * `model.config` (e.g. a manually-added `name: 'Gemini', platform: 'gemini'`
 * row holding the user's API key). The legacy->registry migration copies that
 * row into the registry, and the registry's write-through bridge
 * (`legacyModelConfigBridge`) then mirrors it back as a tagged row
 * (`name: 'Google Gemini'`, `__waylandModelRegistryBridge: 'v2:google-gemini'`).
 * The original untagged row is never removed, so the legacy pickers
 * (AcpModelSelector / WCoreModelSelector / GeminiModelSelector / EditModeModal)
 * show the provider twice - the reported "Two Geminis".
 *
 * ### The fix
 *
 * Drop an untagged (non-bridge) row when a bridge-tagged row exists for the
 * SAME legacy platform - the bridge row is the registry-managed, auto-refreshing
 * source of truth, so the untagged row is pure redundancy.
 *
 * Restricted to "singleton" platforms (`gemini`, `openai`, `anthropic`) where
 * the `platform` string uniquely identifies one provider. The shared
 * `openai-compatible` platform is deliberately excluded: many distinct
 * providers (Groq, OpenRouter, DeepSeek, ...) share it, so a platform match
 * there does NOT imply the rows are the same provider.
 *
 * ### Why no one-time flag
 *
 * The bridge row is written by `mirrorConnectOrRekey` on connect/refresh, which
 * can land on a LATER boot than the legacy migration. A one-time flag could
 * fire before the bridge sibling exists, find nothing to dedup, and then
 * permanently disable itself - stranding the orphan (the likely cause of the
 * surviving duplicate). This runs every boot instead: it is naturally
 * idempotent and writes only when it actually removes a row, so steady state
 * (no orphans) is a no-op. No code path creates new untagged rows today, so the
 * set of orphans only shrinks.
 */

import type { IProvider } from '@/common/config/storage';

/** Must match the tag key the registry bridge stamps onto mirrored rows. */
const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';

/**
 * Legacy platforms where the `platform` string maps to exactly one provider,
 * so a bridge row and an untagged row sharing the platform are the same
 * provider. `openai-compatible` is intentionally absent (shared by many).
 */
export const SINGLETON_PLATFORMS: ReadonlySet<string> = new Set(['gemini', 'openai', 'anthropic']);

/** True when `row` was written by the registry bridge (carries a non-empty tag). */
function isBridgeRow(row: IProvider): boolean {
  const tag = (row as unknown as Record<string, unknown>)[BRIDGE_TAG_KEY];
  return typeof tag === 'string' && tag.length > 0;
}

/**
 * Pure dedup: return the rows to keep plus the orphan rows removed. An untagged
 * row is removed iff its platform is a singleton platform AND a bridge-tagged
 * row exists for that same platform.
 */
export function dedupeOrphanProviders(rows: IProvider[]): { kept: IProvider[]; removed: IProvider[] } {
  // Platforms that have at least one bridge-tagged (registry-managed) row.
  const bridgedPlatforms = new Set<string>();
  for (const row of rows) {
    if (isBridgeRow(row)) bridgedPlatforms.add(row.platform);
  }

  const kept: IProvider[] = [];
  const removed: IProvider[] = [];
  for (const row of rows) {
    const isOrphanDuplicate =
      !isBridgeRow(row) && SINGLETON_PLATFORMS.has(row.platform) && bridgedPlatforms.has(row.platform);
    if (isOrphanDuplicate) removed.push(row);
    else kept.push(row);
  }
  return { kept, removed };
}

/**
 * The slice of `ProcessConfig` this cleanup needs. Declared structurally so unit
 * tests inject an in-memory fake - no `ProcessConfig`, no Electron runtime.
 */
export type OrphanDedupStore = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
};

/**
 * Read `model.config`, drop orphaned pre-registry duplicate rows, and write back
 * ONLY when something was removed. Defensive: any failure is logged and
 * swallowed so a bad blob can never block boot. Returns the number of rows
 * removed (0 when there was nothing to do).
 */
export async function runOrphanProviderDedup(store: OrphanDedupStore): Promise<number> {
  try {
    const raw = await store.get('model.config');
    if (!Array.isArray(raw)) return 0;
    const rows = raw as IProvider[];

    const { kept, removed } = dedupeOrphanProviders(rows);
    if (removed.length === 0) return 0;

    await store.set('model.config', kept);
    console.log(
      `[orphanProviderDedup] removed ${removed.length} orphaned pre-registry provider row(s): ` +
        removed.map((r) => `${r.name} (${r.platform})`).join(', ')
    );
    return removed.length;
  } catch (error) {
    console.warn('[orphanProviderDedup] dedup failed:', error);
    return 0;
  }
}
