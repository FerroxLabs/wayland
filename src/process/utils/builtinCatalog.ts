/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Native built-in catalog (waylandteams: 28 specialists + 60 team launchers).
 *
 * This is a FIRST-CLASS native built-in, loaded exactly like ASSISTANT_PRESETS -
 * NOT an extension. The catalog JSON is imported here so electron-vite inlines it
 * into the main bundle; it therefore ships compiled into the app with zero
 * extraResources and zero on-disk path dependencies. The records are appended to
 * getBuiltinAssistants() and flow through the same config.assistants merge as the
 * other built-ins.
 *
 * Source of truth: ~/dev/waylandteams (vendored into the repo). Regenerate the
 * catalog with `node scripts/build-builtin-catalog.mjs` after re-vendoring.
 *
 * Context bodies are NOT written into config (they are ~1 MB total). They are
 * served at spawn time by fsBridge.readAssistantResource via getBuiltinCatalogContext(),
 * mirroring how extension assistants resolve their context from the registry.
 */

import type { AcpBackendConfig } from '@/common/types/acpTypes';
import builtinCatalogJson from '../resources/builtin-catalog/assistants.json';

/** Shape of a record in builtin-catalog/assistants.json (built by scripts/build-builtin-catalog.mjs). */
type BuiltinCatalogRecord = {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  presetAgentType?: string;
  category?: string;
  kind?: 'team' | 'specialist';
  enabledSkills?: string[];
  prompts?: string[];
  teammates?: string[];
  rituals?: Array<{ name: string; cadence: string }>;
  standing?: boolean;
  kickoffs?: AcpBackendConfig['kickoffs'];
  context: string;
};

/** Prefix that marks a native built-in record (shared with ASSISTANT_PRESETS rows). */
export const BUILTIN_ID_PREFIX = 'builtin-';

const RECORDS = builtinCatalogJson as BuiltinCatalogRecord[];

/** Context bodies keyed by prefixed assistant id (`builtin-<id>`), for fsBridge. */
const CONTEXT_BY_ID = new Map<string, string>(RECORDS.map((r) => [`${BUILTIN_ID_PREFIX}${r.id}`, r.context]));

/**
 * Native built-in assistant configs for the catalog, in AcpBackendConfig shape.
 * Appended to getBuiltinAssistants() so they merge into config.assistants like
 * any other built-in. Context is intentionally omitted (served via fsBridge).
 */
export function getBuiltinCatalogAssistants(): AcpBackendConfig[] {
  return RECORDS.map((r) => ({
    id: `${BUILTIN_ID_PREFIX}${r.id}`,
    name: r.name,
    description: r.description,
    avatar: r.avatar,
    presetAgentType: r.presetAgentType || 'gemini',
    category: r.category,
    kind: r.kind,
    // Parity with the dev (extension) load: every catalog record is enabled.
    enabled: true,
    isPreset: true,
    isBuiltin: true,
    enabledSkills: r.enabledSkills,
    prompts: r.prompts,
    teammates: r.teammates,
    rituals: r.rituals,
    standing: r.standing,
    kickoffs: r.kickoffs,
  }));
}

/** Resolve a native catalog record's context body by prefixed id (`builtin-<id>`). */
export function getBuiltinCatalogContext(assistantId: string): string | undefined {
  return CONTEXT_BY_ID.get(assistantId);
}

/** True when the id belongs to a native catalog record. */
export function isBuiltinCatalogId(assistantId: string): boolean {
  return CONTEXT_BY_ID.has(assistantId);
}
