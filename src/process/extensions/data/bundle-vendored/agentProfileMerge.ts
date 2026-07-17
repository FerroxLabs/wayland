/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Vendored agent-profile → Assistants merge (2026-05-21).
 *
 * The FoundrySkills bundle vendored at `src/process/resources/skills-library/`
 * carries 25 `type: 'agent-profile'` entries - single-character personas like
 * `executive-communicator`, `marketing-strategist`, `legal-compliance-reviewer`.
 * These are NOT skills (the agent doesn't reach for them mid-task); they're
 * mini assistants. Before this merge, they landed on the Skills page as if
 * they were skills, and the Workspace > Assistants page never saw them.
 *
 * This overlay reads the 25 entries on registry init, converts each to the
 * assistant shape used by the rest of the system (mirrors the bundled
 * waylandteams `assistants.json`), and appends them to the live assistants
 * list with id-dedup against the existing set: when an id is already taken
 * by a live waylandteams or extension-contributed assistant, the live record
 * wins (it's hand-curated for the team release). New ids get added.
 *
 * The `prompts.system` field is populated inline from the body SKILL.md, so
 * the assistant is self-contained and works without a new contextFile
 * resolution path.
 *
 * Idempotent (cached after first build). Degrades cleanly when any input
 * file is unreadable.
 */

import path from 'path';
import { closeSync, existsSync, openSync, readFileSync, readSync } from 'fs';
import { buildResourceDirCandidates } from '@process/services/skills/SkillLibrary';
import { PACK_BLOB_NAME, PACK_OFFSETS_NAME, type PackOffsets } from '@process/services/skills/SkillPack';
import agentProfileSkills from './agentProfileSkills.json';

const TAG = '[AgentProfileMerge]';

/** Curated skill set per agent-profile slug (BM25-derived, hand-audited). */
const AGENT_PROFILE_SKILLS = agentProfileSkills as Record<string, string[]>;

type VendoredAgentProfile = {
  id: string;
  name: string;
  description: string;
  presetAgentType: 'agent-profile';
  category: string;
  /** `lucide:IconName` reference so the assistant list/cards render a glyph instead of the Bot fallback. */
  avatar: string;
  /** SKILL.md body, mirroring waylandteams resolver shape so editor's Rules surface reads it. */
  context: string;
  prompts: { system: string };
  isPreset: true;
  kind: 'specialist';
  /**
   * Curated skills pre-attached to this agent-profile's workspace. Without
   * this, the 25 agent-profiles ran on persona prompt alone - the full
   * library stayed reachable only on-demand via `wayland_search_skills`, so
   * they never had their core toolkit in hand. BM25-derived + hand-audited.
   */
  enabledSkills?: string[];
  /** Provenance tag so downstream code can identify these vs hand-curated. */
  _source: 'vendored-agent-profile';
  /**
   * v0.4.7.1 (DATA-2) - sentinel telling the Kickoff SuggestionEngine to
   * return `notRendered: 'kickoffs-excluded'` instead of `no-kickoffs-defined`.
   * Agent-profile assistants are intentionally NOT in the kickoff library
   * (they're persona overlays, not full assistants). Without this opt-out,
   * v2 analytics would log a `not_rendered` event for every cold-start on
   * an agent-profile, inflating the generic-miss bucket with intentional
   * absences.
   */
  _kickoffsExcluded: true;
};

let cached: VendoredAgentProfile[] | null = null;

/**
 * Resolve the on-disk skills-library dir, reusing the canonical candidate list
 * from SkillLibrary.ts. The previous inlined copy omitted the
 * `process.resourcesPath` probe and used the wrong packaged depth
 * (`../../resources/skills-library` instead of `../../../skills-library`), so in
 * a packaged Windows build none of its candidates resolved to the real
 * `resources/skills-library` - the merge silently disabled itself and only the
 * built-in assistants loaded (#126 / #127). `buildResourceDirCandidates` is a
 * pure function (no SkillLibrary singleton), and this overlay runs in the main
 * process where `process.resourcesPath` is populated.
 */
function resolveSkillsLibraryDir(): string | null {
  const candidates = buildResourceDirCandidates(path.dirname(__filename), process.resourcesPath, 'skills-library');
  for (const c of candidates) {
    if (existsSync(path.join(c, 'index.json'))) return c;
  }
  return null;
}

/** Synchronous packed-body reader; `null` body means "not in the pack". */
type SyncPackReader = { read(relPath: string): string | null; close(): void };

/**
 * Synchronous counterpart of `SkillPack.openSkillPack` for this overlay's
 * one-shot sync `buildOverlay()` path (#502). Since #309, packaged builds ship
 * skill bodies as `skill-bodies.bin` + `skill-bodies.offsets.json` with NO
 * loose `bodies/<path>/SKILL.md` files, so the raw `readFileSync` here always
 * hit ENOENT and every vendored agent-profile merged with an empty body.
 *
 * Returns `null` when no pack exists (dev tree / legacy loose layout) or when
 * the pack is malformed, so callers transparently fall back to loose files -
 * mirroring `SkillLibrary.loadBody`'s pack-then-loose order.
 */
function openSkillPackSync(dir: string): SyncPackReader | null {
  const blobPath = path.join(dir, PACK_BLOB_NAME);
  const offsetsPath = path.join(dir, PACK_OFFSETS_NAME);
  if (!existsSync(blobPath) || !existsSync(offsetsPath)) return null;

  let offsets: PackOffsets;
  try {
    offsets = JSON.parse(readFileSync(offsetsPath, 'utf-8')) as PackOffsets;
  } catch {
    return null;
  }
  if (!offsets || typeof offsets !== 'object' || !offsets.entries) return null;

  let fd: number;
  try {
    fd = openSync(blobPath, 'r');
  } catch {
    return null;
  }
  return {
    read: (relPath: string): string | null => {
      const range = offsets.entries[relPath];
      if (!range) return null;
      const [offset, length] = range;
      if (length === 0) return '';
      try {
        const buf = Buffer.allocUnsafe(length);
        readSync(fd, buf, 0, length, offset);
        return buf.toString('utf-8');
      } catch {
        return null;
      }
    },
    close: (): void => {
      try {
        closeSync(fd);
      } catch {
        // Already closed - nothing to release.
      }
    },
  };
}

function toDisplayName(slug: string): string {
  // Mirror the renderer's displayName.ts logic so the names look the same on
  // both sides without sharing a renderer dep (renderer/process boundary).
  const ACRONYMS = new Set([
    'AI',
    'API',
    'CLI',
    'CSS',
    'HTML',
    'HTTP',
    'ID',
    'IP',
    'JS',
    'JSON',
    'ML',
    'OS',
    'PR',
    'QA',
    'SDK',
    'SEO',
    'SQL',
    'SSH',
    'TS',
    'UI',
    'URL',
    'UX',
    'VPN',
    'XML',
  ]);
  let label = slug
    .split('-')
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  label = label.replace(/\bAI Machine Learning\b/g, 'AI & Machine Learning');
  label = label.replace(/\bMarketing Sales\b/g, 'Marketing & Sales');
  label = label.replace(/\bDevOps Cloud\b/g, 'DevOps & Cloud');
  return label;
}

/**
 * Best-effort map from the FoundrySkills category slug to one of the seven
 * assistant categories used by the chat-surface picker. Unmapped categories
 * fall back to 'general' so we never drop an assistant for a category we
 * haven't seen yet.
 */
function mapCategory(rawCategory: string | undefined): string {
  if (!rawCategory) return 'general';
  const c = rawCategory.toLowerCase();
  if (c.includes('finance') || c.includes('business') || c.includes('sales') || c.includes('marketing')) return 'sell';
  if (c.includes('writ') || c.includes('content') || c.includes('communication')) return 'write';
  if (c.includes('research') || c.includes('analy') || c.includes('legal')) return 'research';
  if (c.includes('engineer') || c.includes('develop') || c.includes('code') || c.includes('build')) return 'build';
  if (c.includes('ops') || c.includes('operat') || c.includes('manag') || c.includes('product')) return 'run';
  if (c.includes('office') || c.includes('admin')) return 'office';
  return 'general';
}

/**
 * Per-agent glyph map. Keys are the agent-profile slugs from the skills
 * library index; values are Lucide icon names registered in the renderer's
 * LUCIDE_ICONS map (src/renderer/utils/lucideAvatar.tsx). Stored on the
 * record as `lucide:<Name>` so the assistant list/cards render a meaningful
 * icon instead of the generic Bot fallback. Any agent-profile not listed
 * here falls back to a per-category glyph below.
 */
const AGENT_PROFILE_ICONS: Record<string, string> = {
  'executive-communicator': 'Megaphone',
  'finance-analyst': 'TrendingUp',
  'legal-compliance-reviewer': 'Scale',
  'marketing-strategist': 'Target',
  'product-manager': 'Package',
  'project-manager': 'ClipboardList',
  'content-strategist': 'PenTool',
  'ux-researcher': 'Compass',
  'visual-designer': 'Palette',
  'backend-architect': 'Server',
  'code-reviewer': 'Code',
  'devops-engineer': 'Cloud',
  'frontend-developer': 'MonitorSmartphone',
  'performance-engineer': 'Gauge',
  'qa-engineer': 'Bug',
  'security-auditor': 'ShieldCheck',
  'technical-writer': 'FileText',
  'customer-support-specialist': 'Headset',
  'data-analyst': 'BarChart3',
  'hr-specialist': 'UserRound',
  'operations-manager': 'Workflow',
  'incident-commander': 'Siren',
  'research-orchestrator': 'Network',
  'sprint-facilitator': 'CalendarClock',
  'team-coordinator': 'Users',
};

/** Per-(mapped)-category fallback glyph for agent-profiles not in the map above. */
const CATEGORY_FALLBACK_ICONS: Record<string, string> = {
  sell: 'TrendingUp',
  write: 'PenTool',
  research: 'Compass',
  build: 'Code',
  run: 'Workflow',
  office: 'FileText',
  general: 'Sparkles',
};

/** Resolve the `lucide:<Name>` avatar for an agent-profile by slug, then category. */
function pickAvatar(slug: string, mappedCategory: string): string {
  const icon = AGENT_PROFILE_ICONS[slug] ?? CATEGORY_FALLBACK_ICONS[mappedCategory] ?? 'Sparkles';
  return `lucide:${icon}`;
}

/**
 * Build the 25-entry overlay once and cache it. Returns [] on any I/O failure.
 */
function buildOverlay(): VendoredAgentProfile[] {
  if (cached !== null) return cached;

  const dir = resolveSkillsLibraryDir();
  if (!dir) {
    console.warn(`${TAG} Skills library not found on disk; agent-profile merge disabled.`);
    cached = [];
    return cached;
  }

  let index: unknown;
  try {
    const raw = readFileSync(path.join(dir, 'index.json'), 'utf-8');
    index = JSON.parse(raw);
  } catch (err) {
    console.warn(`${TAG} Failed to read skills-library index.json: ${String(err)}`);
    cached = [];
    return cached;
  }
  if (!Array.isArray(index)) {
    console.warn(`${TAG} skills-library index.json is not an array; merge disabled.`);
    cached = [];
    return cached;
  }

  const out: VendoredAgentProfile[] = [];
  const seen = new Set<string>();
  // #502: packaged builds carry bodies in the packed blob (#309), not loose
  // files. Open it once for the whole loop; null in the dev tree.
  const pack = openSkillPackSync(dir);

  for (const entry of index) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (e.type !== 'agent-profile') continue;
    const name = typeof e.name === 'string' ? e.name : null;
    if (!name) continue;
    // Index has duplicate slugs in places - keep the first.
    if (seen.has(name)) continue;
    seen.add(name);

    const description = typeof e.description === 'string' ? e.description : '';
    const metadata = (e.metadata ?? {}) as Record<string, unknown>;
    const relPath = typeof e.path === 'string' ? e.path : null;
    const rawCategory = typeof metadata.category === 'string' ? metadata.category : undefined;

    let body = '';
    if (relPath) {
      // Mirror SkillLibrary.loadBody's resolution order: packed blob first
      // (packaged builds, #309), then the literal path, then `bodies/`
      // (dev tree - index.json records paths relative to the library root
      // WITHOUT the `bodies/` segment; the loose SKILL.md files live under
      // bodies/).
      const packed = pack?.read(relPath) ?? null;
      if (packed !== null) {
        body = packed;
      } else {
        const candidates = [path.join(dir, relPath), path.join(dir, 'bodies', relPath)];
        let lastErr: unknown = null;
        for (const tried of candidates) {
          try {
            body = readFileSync(tried, 'utf-8');
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
          }
        }
        if (lastErr !== null) {
          // Loud one-line warning so the next time someone wonders why a
          // vendored agent-profile shows empty rules, the log says exactly
          // which file failed to resolve and why.
          console.warn(
            `${TAG} body read failed for ${name} at ${candidates[candidates.length - 1]}: ${String(lastErr).slice(0, 200)}`
          );
        }
      }
    }

    const mappedCategory = mapCategory(rawCategory);

    out.push({
      id: name,
      name: toDisplayName(name),
      description,
      presetAgentType: 'agent-profile',
      category: mappedCategory,
      avatar: pickAvatar(name, mappedCategory),
      // The editor's "Rules" surface reads `context`; mirror the field used
      // by the waylandteams resolver so vendored agent-profiles surface
      // their SKILL.md body the same way.
      context: body,
      prompts: { system: body },
      isPreset: true,
      kind: 'specialist',
      enabledSkills: AGENT_PROFILE_SKILLS[name],
      _source: 'vendored-agent-profile',
      _kickoffsExcluded: true,
    });
  }

  pack?.close();
  cached = out;
  return out;
}

/**
 * Merge the 25 vendored agent-profiles into the live assistants list.
 *
 * - If an id already exists in `liveAssistants`, the live record wins.
 * - New ids are appended (the renderer sorts on display).
 * - Always returns the input array's contents plus any non-colliding overlays.
 * - The input is never mutated.
 */
export function mergeVendoredAgentProfiles(liveAssistants: Record<string, unknown>[]): Record<string, unknown>[] {
  const overlay = buildOverlay();
  if (overlay.length === 0) return liveAssistants;

  const liveIds = new Set<string>();
  for (const a of liveAssistants) {
    const id = (a as { id?: unknown }).id;
    if (typeof id === 'string') liveIds.add(id);
  }

  const merged: Record<string, unknown>[] = liveAssistants.slice();
  let added = 0;
  for (const profile of overlay) {
    if (liveIds.has(profile.id)) continue;
    merged.push(profile as unknown as Record<string, unknown>);
    added += 1;
  }

  if (added > 0) {
    console.log(`${TAG} Added ${added} vendored agent-profile assistant(s).`);
  }
  return merged;
}

/** Test-only: drop the cached overlay so a fresh build runs. */
export function __resetAgentProfileMergeCacheForTests(): void {
  cached = null;
}
