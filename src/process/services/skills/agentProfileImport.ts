/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * agentProfileImport - turns an imported `type:'agent-profile'` SKILL.md into a
 * custom Assistant.
 *
 * Asymmetry (see PLAN): imported workflows surface automatically via the
 * SkillLibrary type filter, but imported assistants do NOT - the agent-profile
 * merge that feeds Workspace > Assistants only scans the vendored bundle dir.
 * So an imported agent-profile has to be written into the custom-assistant
 * store: an `AcpBackendConfig` appended to ConfigStorage('assistants') plus its
 * system-prompt rule file on disk. This mirrors useAssistantEditor.handleSave's
 * "Build my own" path, just sourced from frontmatter instead of the editor.
 */

import type { AcpBackendConfig } from '@/common/types/acpTypes';
import { PRESET_AGENT_TYPES } from '@process/extensions/types';

// IO seam - injected by the bridge with real ConfigStorage + rule writers,
// stubbed in unit tests. Keeps this module free of Electron/fs coupling.
export type AgentProfileImportIo = {
  /** Current custom-assistant list from ConfigStorage('assistants'). */
  getAssistants: () => Promise<AcpBackendConfig[]>;
  /** Persist the updated custom-assistant list. */
  setAssistants: (next: AcpBackendConfig[]) => Promise<void>;
  /** Write the assistant's system-prompt rule file (locale 'en-US'). */
  writeRule: (assistantId: string, content: string) => Promise<void>;
  /** Millisecond clock - injected so tests get a deterministic id suffix. */
  now: () => number;
};

export type ImportedAssistant = {
  /** The generated assistant id (`imported-<slug>-<ts>`). */
  id: string;
  /** Display name. */
  name: string;
};

/** Strip the leading `---\n…\n---` frontmatter block, returning the body. */
function stripFrontmatter(content: string): string {
  const match = content.match(/^---\s*\n[\s\S]*?\n---\s*\n?/);
  return match ? content.slice(match[0].length).trim() : content.trim();
}

/** Read a flat top-level frontmatter scalar (e.g. `avatar:`, `main-agent:`). */
function frontmatterField(content: string, key: string): string | undefined {
  const block = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!block) return undefined;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = block[1].match(new RegExp(`^${escaped}:[ \\t]*['"]?(.+?)['"]?[ \\t]*$`, 'm'));
  return m ? m[1].trim() : undefined;
}

/** Kebab-case slug from a display name, mirroring skills.save's normalizer. */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Default presetAgentType when frontmatter omits `main-agent`/`presetAgentType`. */
const DEFAULT_PRESET_AGENT_TYPE = 'claude';
/** Default avatar when frontmatter omits `avatar` or provides an unsafe value. */
const DEFAULT_AVATAR = 'lucide:Bot';

/**
 * Safe set of presetAgentType values. Anything from untrusted frontmatter that
 * isn't in this set falls back to DEFAULT_PRESET_AGENT_TYPE so a malicious
 * `main-agent: ../../evil` value can never route to an unexpected backend.
 */
const VALID_PRESET_AGENT_TYPES: ReadonlySet<string> = new Set(PRESET_AGENT_TYPES);

/**
 * Regex that matches safe avatar values:
 *  - lucide:<IconName>  (lucide icon)
 *  - a single emoji character
 *  - data: URI (inline image)
 *  - asset: or app: scheme (internal asset references)
 * Anything else falls back to DEFAULT_AVATAR.
 */
const SAFE_AVATAR_RE = /^(lucide:[A-Za-z][A-Za-z0-9]*|data:[a-z]+\/[a-z0-9+.-]+;base64,[A-Za-z0-9+/=]+|(asset|app):\/\/[^\s]+|\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u;

function sanitizePresetAgentType(raw: string | undefined): string {
  if (raw && VALID_PRESET_AGENT_TYPES.has(raw)) return raw;
  return DEFAULT_PRESET_AGENT_TYPE;
}

function sanitizeAvatar(raw: string | undefined): string {
  if (raw && SAFE_AVATAR_RE.test(raw)) return raw;
  return DEFAULT_AVATAR;
}

/**
 * Map a parsed agent-profile SKILL.md into an AcpBackendConfig.
 *
 * @param frontmatter the already-parsed `{ name, description }` header
 * @param body the full SKILL.md content (frontmatter + markdown)
 * @param now millisecond clock for the id suffix
 */
export function buildAssistantFromSkillMd(
  frontmatter: { name: string; description?: string },
  body: string,
  now: number
): AcpBackendConfig {
  const slug = slugify(frontmatter.name) || 'assistant';
  const id = `imported-${slug}-${now}`;
  const avatar = sanitizeAvatar(frontmatterField(body, 'avatar'));
  const presetAgentType = sanitizePresetAgentType(
    frontmatterField(body, 'main-agent') ?? frontmatterField(body, 'presetAgentType')
  );
  const systemPrompt = stripFrontmatter(body);

  return {
    id,
    name: frontmatter.name,
    description: frontmatter.description ?? '',
    avatar,
    isPreset: true,
    isBuiltin: false,
    // An imported agent-profile is a single-role Specialist, same as a
    // "Build my own" assistant - stamp `kind` so it classifies correctly in
    // the library + Teams pickers.
    kind: 'specialist',
    presetAgentType,
    enabled: true,
    context: systemPrompt,
  };
}

/**
 * Persist an imported agent-profile as a custom assistant: append the
 * AcpBackendConfig to ConfigStorage('assistants') and write its rule file.
 * Skips silently (returns null) when an assistant with the same id already
 * exists - the `now` suffix makes a real collision effectively impossible, but
 * the guard keeps a double-import from duplicating an entry.
 */
export async function importAgentProfile(
  frontmatter: { name: string; description?: string },
  body: string,
  io: AgentProfileImportIo
): Promise<ImportedAssistant | null> {
  const config = buildAssistantFromSkillMd(frontmatter, body, io.now());

  const existing = await io.getAssistants();
  if (existing.some((a) => a.id === config.id)) {
    return null;
  }

  if (config.context && config.context.trim()) {
    await io.writeRule(config.id, config.context);
  }
  await io.setAssistants([...existing, config]);

  return { id: config.id, name: config.name };
}
