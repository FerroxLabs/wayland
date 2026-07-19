/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Capabilities manifest service (Concierge U1).
 *
 * Builds a COMPACT, token-bounded markdown snapshot of what this Wayland
 * install can actually do RIGHT NOW - skill counts + top categories, bundled
 * workflows, configured providers + a few representative models, and the static
 * headline feature set. The manifest is the structured self-knowledge the
 * Concierge persona (and any capability-intent turn) injects so the model can
 * answer "what can you do?" with real specifics instead of guessing.
 *
 * Sources are read DIRECTLY in the main process (no IPC):
 *   - `SkillLibrary.getInstance()` - `stats()` + `list({ type })`.
 *   - `getProviderCatalog()` - the ~100-provider available catalog.
 *   - `ProcessConfig.get('model.config')` - the connected providers + models.
 *
 * Every source is wrapped: a throwing source omits ONLY its section and never
 * propagates to the caller. Output is hard-truncated to
 * {@link CAPABILITIES_MANIFEST_MAX_CHARS}. A tiny in-module cache, keyed on a
 * cheap signature (skill total + workflow count + provider signature +
 * options), avoids recomputing the heavier `list()` / catalog calls when
 * nothing relevant moved.
 */

import { SkillLibrary } from '@process/services/skills/SkillLibrary';
import { getProviderCatalog } from '@process/providers/ipc/modelRegistryIpc';
import { getBuiltinSkillsCopyDir, ProcessConfig } from '@process/utils/initStorage';
import { probeOfficeCliAuthoringEvidence } from '@process/services/capabilities/OfficeCliAuthoringCapability';
import {
  OFFICECLI_CAPABILITY_ID,
  WAYLAND_CAPABILITY_MANIFEST,
  selectCapabilityReadiness,
  type CapabilityPlatform,
  type CapabilityReadiness,
} from '@/common/capabilities';
import type { IProvider } from '@/common/config/storage';

export type CapabilitiesManifestOptions = {
  includeSkills?: boolean;
  includeWorkflows?: boolean;
  includeModels?: boolean;
  includeOfficeAuthoring?: boolean;
  agentKey?: string;
};

/** Hard upper bound on the rendered manifest length (characters). */
export const CAPABILITIES_MANIFEST_MAX_CHARS = 2400;

/** Static, install-independent headline features - the always-true surface. */
const HEADLINE_FEATURES = 'assistants, teams, scheduled tasks, workflows, MCP servers, projects';

/** Max top skill categories rendered. */
const MAX_CATEGORIES = 4;
/** Max example workflow names rendered. */
const MAX_WORKFLOW_NAMES = 4;
/** Max connected provider names rendered. */
const MAX_PROVIDER_NAMES = 5;
/** Max representative model ids rendered. */
const MAX_MODEL_NAMES = 4;

type CacheEntry = { key: string; value: string };
let cache: CacheEntry | null = null;

/** Drop the cached manifest so the next build re-reads every live source. */
export function invalidateCapabilitiesManifestCache(): void {
  cache = null;
}

/**
 * Skill total used for the Skills headline AND the cheap cache signature;
 * `null` when unavailable. Scoped to `{ type: 'skill' }` so the count excludes
 * workflows and agent-profiles (which route to their own surfaces) and stays
 * consistent with the skill-only category breakdown in {@link buildSkillsLine}.
 */
async function readSkillTotal(): Promise<number | null> {
  try {
    const stats = await SkillLibrary.getInstance().stats({ type: 'skill' });
    return stats.total;
  } catch {
    return null;
  }
}

/**
 * Workflow count folded into the cache signature so installing/removing a
 * workflow busts the cache even when the skill total and provider signature are
 * unchanged - otherwise the live `Workflows:` line would go stale. `null` when
 * unavailable (a throw degrades the signal rather than propagating).
 */
async function readWorkflowCount(): Promise<number | null> {
  try {
    return (await SkillLibrary.getInstance().stats({ type: 'workflow' })).total;
  } catch {
    return null;
  }
}

/** Connected providers from the legacy `model.config` mirror (main-safe). */
async function readConnectedProviders(): Promise<IProvider[]> {
  try {
    const providers = await ProcessConfig.get('model.config');
    return Array.isArray(providers) ? providers : [];
  } catch {
    return [];
  }
}

/** Build the `Skills:` line, or `null` to omit the section. */
/**
 * Neutralize a data token (skill category, workflow title, provider/model name)
 * before it lands in the system-prompt manifest: collapse whitespace/control
 * chars, strip leading markdown control chars so it cannot read as a new heading
 * or list block, and bound length. Defense-in-depth against instruction
 * injection via community-sourced workflow titles or user-set provider names.
 */
function sanitizeToken(s: string): string {
  return s
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/^[\s#>*`-]+/, '')
    .trim()
    .slice(0, 40);
}

async function buildSkillsLine(skillTotal: number | null): Promise<string | null> {
  try {
    const total = skillTotal ?? (await SkillLibrary.getInstance().stats({ type: 'skill' })).total;
    const entries = await SkillLibrary.getInstance().list({ type: 'skill' });
    const counts = new Map<string, number>();
    for (const entry of entries) {
      const category = entry.metadata?.category;
      if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    const top = [...counts.entries()]
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, MAX_CATEGORIES)
      .map(([category, n]) => `${sanitizeToken(category)} ${n}`);
    const topPart = top.length > 0 ? ` (top: ${top.join(', ')})` : '';
    return `- Skills: ${total} available${topPart}.`;
  } catch {
    return null;
  }
}

/** Build the `Workflows:` line, or `null` to omit the section. */
async function buildWorkflowsLine(): Promise<string | null> {
  try {
    const workflows = await SkillLibrary.getInstance().list({ type: 'workflow' });
    const names = workflows
      .slice(0, MAX_WORKFLOW_NAMES)
      .map((w) => w.title || w.name)
      .filter((n): n is string => Boolean(n))
      .map(sanitizeToken);
    const examplePart = names.length > 0 ? ` (e.g. ${names.join(', ')})` : '';
    return `- Workflows: ${workflows.length} ready-to-run${examplePart}.`;
  } catch {
    return null;
  }
}

/** Build the `Providers:` line, or `null` to omit the section. */
async function buildModelsLine(providers: IProvider[]): Promise<string | null> {
  try {
    const names = providers
      .map((p) => p.name)
      .filter((n): n is string => Boolean(n))
      .slice(0, MAX_PROVIDER_NAMES)
      .map(sanitizeToken);

    const models: string[] = [];
    for (const provider of providers) {
      for (const model of provider.model ?? []) {
        const m = sanitizeToken(model);
        if (m && !models.includes(m)) models.push(m);
        if (models.length >= MAX_MODEL_NAMES) break;
      }
      if (models.length >= MAX_MODEL_NAMES) break;
    }

    let available = 0;
    try {
      available = (await getProviderCatalog()).length;
    } catch {
      available = 0;
    }

    // `model.config` providers are CONFIGURED (credentials saved), not
    // verified-connected - we have not pinged them - so the wording stays
    // truthfully "configured" rather than overclaiming a live connection.
    const configuredPart =
      providers.length > 0
        ? `${providers.length} configured${names.length > 0 ? ` (${names.join(', ')})` : ''}`
        : 'none configured yet';
    const availablePart = available > 0 ? ` of ~${available} available` : '';
    const modelsPart = models.length > 0 ? `; models e.g. ${models.join(', ')}` : '';
    return `- Providers: ${configuredPart}${availablePart}${modelsPart}.`;
  } catch {
    return null;
  }
}

function buildOfficeAuthoringLine(readiness: CapabilityReadiness): string {
  if (readiness.state === 'ready' && readiness.canInvoke) {
    return `- Native Office authoring: ready with officecli ${sanitizeToken(readiness.capabilityVersion)}; target-exact enforced contract verified.`;
  }
  if (readiness.state === 'brokered') {
    return '- Native Office authoring: available only through an explicit broker decision; do not invoke it automatically.';
  }
  if (readiness.state === 'advisory') {
    return '- Native Office authoring: advisory evidence only; it is not callable.';
  }
  return `- Native Office authoring: unavailable; ${sanitizeToken(readiness.reason)} Do not guess commands or use a hosted fallback.`;
}

function normalizeCapabilityBackend(agentKey?: string): 'wcore' | 'gemini' | 'acp' {
  return agentKey === 'wcore' || agentKey === 'gemini' ? agentKey : 'acp';
}

/**
 * Build the compact capabilities manifest from live install state.
 *
 * Never throws: a failing source contributes nothing rather than rejecting.
 * The result is always `<= CAPABILITIES_MANIFEST_MAX_CHARS`.
 */
export async function buildCapabilitiesManifest(opts?: CapabilitiesManifestOptions): Promise<string> {
  const includeSkills = opts?.includeSkills ?? true;
  const includeWorkflows = opts?.includeWorkflows ?? true;
  const includeModels = opts?.includeModels ?? true;
  const includeOfficeAuthoring = opts?.includeOfficeAuthoring ?? false;
  // `agentKey` is reserved for future per-agent model curation; it does NOT
  // currently affect output, so it is deliberately EXCLUDED from the cache key
  // (otherwise distinct backends would thrash the single-slot cache).

  try {
    // Cheap signature inputs - read first so a cache hit skips the heavier
    // `list()` / `getProviderCatalog()` work below.
    const skillTotal = await readSkillTotal();
    // Cheap workflow count for the cache signature only - guarded so a throw
    // degrades (omits the signal) instead of propagating.
    const workflowCount = includeWorkflows ? await readWorkflowCount() : null;
    const providers = includeModels ? await readConnectedProviders() : [];
    const capabilityBackend = normalizeCapabilityBackend(opts?.agentKey);
    const capabilityNow = Date.now();
    const capabilityCorrelation = `capabilities:${capabilityBackend}:${capabilityNow}`;
    const officeEvidence = includeOfficeAuthoring
      ? await probeOfficeCliAuthoringEvidence({
          correlationId: capabilityCorrelation,
          backend: capabilityBackend,
          now: capabilityNow,
          skillsRoot: getBuiltinSkillsCopyDir(),
        })
      : null;
    const officeAuthoring = officeEvidence
      ? selectCapabilityReadiness(WAYLAND_CAPABILITY_MANIFEST, [officeEvidence], {
          capabilityId: OFFICECLI_CAPABILITY_ID,
          correlationId: capabilityCorrelation,
          platform: process.platform as CapabilityPlatform['platform'],
          arch: process.arch as CapabilityPlatform['arch'],
          backend: capabilityBackend,
          now: capabilityNow,
        })
      : null;

    // Provider IDENTITY (name + model set), not just count, so swapping provider
    // A for B at equal count - or adding/removing a model inside a provider -
    // busts the cache and re-renders. Stale provider names would undermine the
    // "costly-to-fake" trust signal the manifest exists to provide.
    const providerSig = providers
      .map((p) => `${p.name ?? ''}:${Array.isArray(p.model) ? p.model.join(',') : ''}`)
      .join('|');

    const key = JSON.stringify({
      s: skillTotal ?? -1,
      w: workflowCount ?? -1,
      p: providerSig,
      o: { includeSkills, includeWorkflows, includeModels, includeOfficeAuthoring },
      office: officeAuthoring,
    });
    if (cache && cache.key === key) return cache.value;

    const lines: string[] = [];

    if (includeSkills) {
      const skillsLine = await buildSkillsLine(skillTotal);
      if (skillsLine) lines.push(skillsLine);
    }
    if (includeWorkflows) {
      const workflowsLine = await buildWorkflowsLine();
      if (workflowsLine) lines.push(workflowsLine);
    }
    if (includeModels) {
      const modelsLine = await buildModelsLine(providers);
      if (modelsLine) lines.push(modelsLine);
    }
    if (officeAuthoring) lines.push(buildOfficeAuthoringLine(officeAuthoring));
    lines.push(`- Features: ${HEADLINE_FEATURES}.`);

    const rendered = lines.join('\n');
    const value =
      rendered.length > CAPABILITIES_MANIFEST_MAX_CHARS ? rendered.slice(0, CAPABILITIES_MANIFEST_MAX_CHARS) : rendered;

    cache = { key, value };
    return value;
  } catch {
    // Catastrophic failure (should be unreachable - every section is guarded):
    // degrade to the static headline rather than throwing to the caller.
    return `- Features: ${HEADLINE_FEATURES}.`;
  }
}
