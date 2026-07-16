/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ACP Skill Manager - Provides on-demand skill loading for ACP agents (Claude/OpenCode/Codex)
 * Inspired by aioncli-core's SkillManager design
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { getSkillsDir, getBuiltinSkillsCopyDir, getAutoSkillsDir } from '@process/utils/initStorage';
import { ExtensionRegistry } from '@process/extensions';
import type { SkillMetadata, SkillSecurityReport, SkillSource, SkillType } from '@/common/types/skillTypes';

/**
 * Skill definition (compatible with aioncli-core)
 */
export type SkillDefinition = {
  /** Unique skill name */
  name: string;
  /** Skill description (for indexing) */
  description: string;
  /** File path */
  location: string;
  /** Full content (lazy loaded) */
  body?: string;
  /** Extended fields - optional, backward compatible */
  source?: SkillSource;
  type?: SkillType;
  metadata?: SkillMetadata;
  security?: SkillSecurityReport;
  pinned?: boolean;
};

/**
 * Skill index (lightweight, for first message injection)
 */
export type SkillIndex = {
  name: string;
  description: string;
};

/** Result type returned by parseFrontmatter */
export type ParsedFrontmatter = {
  name: string;
  description?: string;
  type?: SkillType;
  metadata: SkillMetadata;
};

/**
 * Parse a space-delimited YAML scalar into a string array.
 * Empty/blank input returns [].
 */
function splitSpaceList(value: string): string[] {
  return value.trim().split(/\s+/).filter(Boolean);
}

/**
 * Parse frontmatter from SKILL.md.
 * Returns null when the frontmatter block is absent or the name field is missing/empty.
 *
 * Tolerant of CLI-tool SKILL.md formats that omit the `metadata:` block
 * (Claude Code / Codex / Gemini CLI slash-command files use a flat
 * `name + description + argument-hint + allowed-tools` shape); those
 * surface with `metadata: { tags: [] }` and no other fields.
 */
export function parseFrontmatter(content: string): ParsedFrontmatter | null {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];

  // Parse name - required; reject if absent or blank.
  // Use [ \t]* (not \s*) so the match cannot consume the newline and bleed
  // into the next frontmatter line. The value is `.+?` (not `[^'"\n]+?`) so a
  // name with an embedded apostrophe/quote - e.g. `Sam's Assistant`, which
  // js-yaml emits unquoted - parses in full instead of truncating at the quote
  // (`.` never matches `\n`, so the no-line-bleed property holds). #512.
  const nameMatch = frontmatter.match(/^name:[ \t]*['"]?(.+?)['"]?[ \t]*$/m);
  const name = nameMatch ? nameMatch[1].trim() : '';
  if (!name) return null;

  // Parse description
  const descMatch = frontmatter.match(/^description:[ \t]*['"]?(.+?)['"]?[ \t]*$/m);
  const description = descMatch ? descMatch[1].trim() : undefined;

  // Parse top-level type field
  const typeMatch = frontmatter.match(/^type:[ \t]*['"]?([^'"\n]+?)['"]?[ \t]*$/m);
  const rawType = typeMatch ? typeMatch[1].trim() : undefined;
  const skillType: SkillType | undefined =
    rawType === 'skill' || rawType === 'workflow' || rawType === 'agent-profile' ? rawType : undefined;

  // Parse metadata: block - everything indented under "metadata:"
  const metadata: SkillMetadata = { tags: [] };

  const metaBlockMatch = frontmatter.match(/^metadata:\s*\n((?:[ \t]+[^\n]*\n?)*)/m);
  if (metaBlockMatch) {
    const block = metaBlockMatch[1];

    const field = (key: string): string | undefined => {
      const m = block.match(new RegExp(`^[ \\t]+${key}:[ \\t]*(.+?)[ \\t]*$`, 'm'));
      return m ? m[1].trim() : undefined;
    };

    const author = field('author');
    if (author) metadata.author = author;

    const version = field('version');
    if (version) metadata.version = version;

    const tagsRaw = field('tags');
    if (tagsRaw) metadata.tags = splitSpaceList(tagsRaw);

    const category = field('category');
    if (category) metadata.category = category;

    const subcategory = field('subcategory');
    if (subcategory) metadata.subcategory = subcategory;

    const difficulty = field('difficulty');
    if (difficulty) metadata.difficulty = difficulty;

    const model = field('model');
    if (model) metadata.model = model;

    const tools = field('tools');
    if (tools) metadata.tools = tools;

    const dependsRaw = field('depends');
    if (dependsRaw) metadata.depends = splitSpaceList(dependsRaw);
  }

  return { name, description, type: skillType, metadata };
}

/** Exported for unit tests only - do not use in production code */
export const parseFrontmatterForTest = parseFrontmatter;

/**
 * Remove frontmatter, keep only body content
 */
function extractBody(content: string): string {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '').trim();
}

/**
 * ACP Skill Manager
 * Provides skill index loading and on-demand fetching for ACP agents.
 *
 * Uses singleton pattern to avoid repeated filesystem scans
 *
 * Two skill categories are supported:
 * - Builtin skills (_builtin/): auto-injected in all scenarios
 * - Optional skills: controlled via the enabledSkills parameter
 */
export class AcpSkillManager {
  private static instance: AcpSkillManager | null = null;
  private static instanceKey: string | null = null;

  private skills: Map<string, SkillDefinition> = new Map();
  private autoSkills: Map<string, SkillDefinition> = new Map();
  /** Extension-contributed skills loaded from ExtensionRegistry */
  private extensionSkills: Map<string, SkillDefinition> = new Map();
  private skillsDir: string;
  private autoSkillsDir: string;
  private initialized: boolean = false;
  private autoInitialized: boolean = false;
  private extensionInitialized: boolean = false;
  /** Globally disabled skill names - getSkill refuses to return content for these. */
  private disabledSkills: Set<string> = new Set();

  constructor(skillsDir?: string) {
    this.skillsDir = skillsDir || getSkillsDir();
    this.autoSkillsDir = getAutoSkillsDir();
  }

  /**
   * Get singleton instance (with enabledSkills + excludeBuiltinSkills + preferences revision cache key)
   *
   * @param enabledSkills - Enabled skills list
   * @param excludeBuiltinSkills - Builtin skills to exclude
   * @param prefsRevision - Current skills.preferences.revision value; bumping it invalidates the cache
   * @returns AcpSkillManager instance
   */
  static getInstance(
    enabledSkills?: string[],
    excludeBuiltinSkills?: string[],
    prefsRevision?: number
  ): AcpSkillManager {
    const enabledPart = enabledSkills?.toSorted().join(',') || 'all';
    const excludePart = excludeBuiltinSkills?.toSorted().join(',') || '';
    const revPart = prefsRevision !== undefined ? `|rev:${prefsRevision}` : '';
    const cacheKey = excludePart ? `${enabledPart}|exclude:${excludePart}${revPart}` : `${enabledPart}${revPart}`;

    // If cache key changed, need to recreate instance
    if (AcpSkillManager.instance && AcpSkillManager.instanceKey === cacheKey) {
      return AcpSkillManager.instance;
    }

    // Create new instance
    AcpSkillManager.instance = new AcpSkillManager();
    AcpSkillManager.instanceKey = cacheKey;
    return AcpSkillManager.instance;
  }

  /**
   * Reset singleton instance (for testing or config changes)
   */
  static resetInstance(): void {
    AcpSkillManager.instance = null;
    AcpSkillManager.instanceKey = null;
  }

  /**
   * Initialize: discover and load index of builtin skills (auto-injected for all scenarios)
   *
   * @param excludeSkills - Builtin skill names to exclude
   */
  async discoverAutoSkills(excludeSkills?: string[]): Promise<void> {
    if (this.autoInitialized) return;

    const builtinDir = this.autoSkillsDir;
    if (!existsSync(builtinDir)) {
      console.log(`[AcpSkillManager] Builtin skills directory not found: ${builtinDir}`);
      this.autoInitialized = true;
      return;
    }

    const excludeSet = new Set(excludeSkills ?? []);

    try {
      const entries = await fs.readdir(builtinDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

        const skillName = entry.name;

        // Skip excluded builtin skills
        if (excludeSet.has(skillName)) continue;

        const skillFile = path.join(builtinDir, skillName, 'SKILL.md');
        if (!existsSync(skillFile)) continue;

        try {
          const content = await fs.readFile(skillFile, 'utf-8');
          const parsed = parseFrontmatter(content);

          // Also check by resolved name
          if (parsed && excludeSet.has(parsed.name)) continue;

          const skillDef: SkillDefinition = {
            name: parsed?.name || skillName,
            description: parsed?.description || `Builtin Skill: ${skillName}`,
            location: skillFile,
            // body is loaded on demand, not here
          };

          this.autoSkills.set(skillName, skillDef);
        } catch (error) {
          console.warn(`[AcpSkillManager] Failed to load builtin skill ${skillName}:`, error);
        }
      }

      console.log(
        `[AcpSkillManager] Discovered ${this.autoSkills.size} builtin skills` +
          (excludeSet.size > 0 ? ` (excluded: ${[...excludeSet].join(', ')})` : '')
      );
    } catch (error) {
      console.error(`[AcpSkillManager] Failed to discover builtin skills:`, error);
    }

    this.autoInitialized = true;
  }

  /**
   * Load extension-contributed skills from ExtensionRegistry
   *
   * Extensions declare skills via aion-extension.json's contributes.skills field.
   * SkillResolver resolves them and caches them in ExtensionRegistry.
   * This method merges them into AcpSkillManager so agents can load them on demand.
   */
  private async discoverExtensionSkills(enabledSkills?: string[]): Promise<void> {
    if (this.extensionInitialized) return;

    try {
      const registry = ExtensionRegistry.getInstance();
      const extSkills = registry.getSkills();

      if (extSkills.length === 0) {
        this.extensionInitialized = true;
        return;
      }

      const enabledSet = new Set(enabledSkills ?? []);
      for (const extSkill of extSkills) {
        // Extension (team-bundle) skills are NOT always-on. Only the ones the
        // user explicitly enabled or pinned join the always-on index
        // (enabledSkills already includes pinned via conversationBridge). When
        // nothing is enabled, load NONE - the full team set stays discoverable
        // via `wayland_search_skills` / the per-turn match against SkillLibrary,
        // instead of injecting ~3,200 tokens of always-on skill list into every
        // prompt. This restores the documented "native ships builtin + pinned +
        // enabledSkills; full library via search" contract.
        if (!enabledSet.has(extSkill.name)) {
          continue;
        }

        // Avoid conflicts with builtin/optional skills
        if (this.autoSkills.has(extSkill.name) || this.skills.has(extSkill.name)) {
          console.warn(`[AcpSkillManager] Extension skill "${extSkill.name}" conflicts with existing skill, skipping`);
          continue;
        }

        const skillDef: SkillDefinition = {
          name: extSkill.name,
          description: extSkill.description,
          location: extSkill.location,
        };

        this.extensionSkills.set(extSkill.name, skillDef);
      }

      if (this.extensionSkills.size > 0) {
        console.log(`[AcpSkillManager] Loaded ${this.extensionSkills.size} extension skills`);
      }
    } catch (error) {
      console.warn('[AcpSkillManager] Failed to load extension skills:', error);
    }

    this.extensionInitialized = true;
  }

  /**
   * Initialize: discover and load index of all skills (without body)
   *
   * @param enabledSkills - Enabled optional skills list
   * @param excludeBuiltinSkills - Builtin auto-injected skills to exclude
   */
  async discoverSkills(enabledSkills?: string[], excludeBuiltinSkills?: string[]): Promise<void> {
    // Always load builtin skills first
    await this.discoverAutoSkills(excludeBuiltinSkills);

    // Load extension-contributed skills
    await this.discoverExtensionSkills(enabledSkills);

    if (this.initialized) return;

    // Skip all optional skills when enabledSkills is not specified (non-preset agent)
    if (!enabledSkills || enabledSkills.length === 0) {
      this.initialized = true;
      return;
    }

    // Scan both builtin-skills/ (bundled, non-_builtin) and skills/ (user custom)
    const dirsToScan = [getBuiltinSkillsCopyDir(), this.skillsDir];

    for (const dir of dirsToScan) {
      if (!existsSync(dir)) continue;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

          const skillName = entry.name;

          // Skip _builtin directory (handled by discoverAutoSkills)
          if (skillName === '_builtin') continue;

          // Only load enabled skills
          if (!enabledSkills.includes(skillName)) continue;

          // Skip if already discovered (builtin-skills/ takes precedence)
          if (this.skills.has(skillName)) continue;

          const skillFile = path.join(dir, skillName, 'SKILL.md');
          if (!existsSync(skillFile)) continue;

          try {
            const content = await fs.readFile(skillFile, 'utf-8');
            const parsed = parseFrontmatter(content);

            // Skip skills with unparseable or nameless frontmatter
            if (!parsed) continue;

            this.skills.set(skillName, {
              name: parsed.name,
              description: parsed.description || `Skill: ${skillName}`,
              location: skillFile,
            });
          } catch (error) {
            console.warn(`[AcpSkillManager] Failed to load skill ${skillName}:`, error);
          }
        }
      } catch (error) {
        console.error(`[AcpSkillManager] Failed to discover skills in ${dir}:`, error);
      }
    }

    console.log(`[AcpSkillManager] Discovered ${this.skills.size} optional skills`);

    this.initialized = true;
  }

  /**
   * Get index of all skills (lightweight)
   * Includes builtin skills + optional skills
   */
  getSkillsIndex(): SkillIndex[] {
    // Priority: optional (user-selected for this assistant) > builtin (auto-injected) > extension
    // User-selected skills come first because they represent the most specific intent for this assistant.
    const allSkills: SkillIndex[] = [];

    // Optional skills first (explicitly configured for this assistant - highest priority)
    for (const skill of this.skills.values()) {
      allSkills.push({
        name: skill.name,
        description: skill.description,
      });
    }

    // Then builtin skills
    for (const skill of this.autoSkills.values()) {
      allSkills.push({
        name: skill.name,
        description: skill.description,
      });
    }

    // Then extension skills
    for (const skill of this.extensionSkills.values()) {
      allSkills.push({
        name: skill.name,
        description: skill.description,
      });
    }

    return allSkills;
  }

  /**
   * Get index of builtin skills only
   */
  getBuiltinSkillsIndex(): SkillIndex[] {
    return Array.from(this.autoSkills.values()).map((skill) => ({
      name: skill.name,
      description: skill.description,
    }));
  }

  /**
   * Check if there are any skills (builtin or optional)
   */
  hasAnySkills(): boolean {
    return this.autoSkills.size > 0 || this.skills.size > 0 || this.extensionSkills.size > 0;
  }

  /**
   * Get full content of a skill by name (on-demand loading)
   * Priority: optional (user-configured) > builtin > extension
   *
   * Returns null (not available) when:
   *  - skill has security.verdict === 'blocked' (quarantined)
   *  - skill name is in the globally-disabled set (skills.preferences.disabled)
   */
  async getSkill(name: string): Promise<SkillDefinition | null> {
    // Check optional skills first (explicitly configured for this assistant)
    let skill = this.skills.get(name);
    // Then search builtin skills
    if (!skill) {
      skill = this.autoSkills.get(name);
    }
    // Then search extension skills
    if (!skill) {
      skill = this.extensionSkills.get(name);
    }
    if (!skill) return null;

    // Defense-in-depth: refuse blocked or globally-disabled skills
    if (skill.security?.verdict === 'blocked') {
      console.warn(`[AcpSkillManager] Refused to load blocked skill '${name}'`);
      return null;
    }
    if (this.disabledSkills.has(name)) {
      console.warn(`[AcpSkillManager] Refused to load disabled skill '${name}'`);
      return null;
    }

    // If body has not been loaded yet, load it now
    if (skill.body === undefined) {
      try {
        const content = await fs.readFile(skill.location, 'utf-8');
        skill.body = extractBody(content);
      } catch (error) {
        console.warn(`[AcpSkillManager] Failed to load skill body for ${name}:`, error);
        skill.body = '';
      }
    }

    return skill;
  }

  /**
   * Get full content of multiple skills
   */
  async getSkills(names: string[]): Promise<SkillDefinition[]> {
    const results: SkillDefinition[] = [];
    for (const name of names) {
      const skill = await this.getSkill(name);
      if (skill) {
        results.push(skill);
      }
    }
    return results;
  }

  /**
   * Check if a skill exists (including builtin and optional)
   */
  hasSkill(name: string): boolean {
    return this.autoSkills.has(name) || this.skills.has(name) || this.extensionSkills.has(name);
  }

  /**
   * Set the globally-disabled skill names.
   * getSkill will refuse to return content for any name in this set.
   * Call after discoverSkills when the caller has loaded skills.preferences.
   */
  setDisabled(disabled: string[]): void {
    this.disabledSkills = new Set(disabled);
  }

  /**
   * Clear cached body content (for refresh)
   */
  clearCache(): void {
    for (const skill of this.autoSkills.values()) {
      skill.body = undefined;
    }
    for (const skill of this.skills.values()) {
      skill.body = undefined;
    }
    for (const skill of this.extensionSkills.values()) {
      skill.body = undefined;
    }
  }
}

/**
 * Build skills index text (for first message injection).
 *
 * Only the always-on set (builtin + pinned + assistant enabledSkills) is listed here.
 * When the full skill library is available, a one-line note directs the agent to call
 * `wayland_search_skills` for anything else - the library is never dumped inline.
 *
 * @param skills - always-on skill entries to list
 * @param hasLibrary - when true, append the wayland_search_skills discovery note
 */
export function buildSkillsIndexText(skills: SkillIndex[], hasLibrary = false): string {
  if (skills.length === 0 && !hasLibrary) return '';

  const lines = skills.map((s) => `- ${s.name}: ${s.description}`);
  const listBlock = lines.length > 0 ? `\n\n${lines.join('\n')}` : '';
  const searchNote = hasLibrary
    ? '\n\nFor skills not listed above, call `wayland_search_skills` to search the full library.'
    : '';

  return `[Available Skills]
The following skills are available. When you need detailed instructions for a specific skill,
you can request it by outputting: [LOAD_SKILL: skill-name]${listBlock}${searchNote}`;
}

/**
 * Detect if message requests loading a skill
 */
export function detectSkillLoadRequest(content: string): string[] {
  const matches = content.matchAll(/\[LOAD_SKILL:\s*([^\]]+)\]/gi);
  const requested: string[] = [];
  for (const match of matches) {
    requested.push(match[1].trim());
  }
  return requested;
}

/**
 * Build skill content text (for injection)
 */
export function buildSkillContentText(skills: SkillDefinition[]): string {
  if (skills.length === 0) return '';

  return skills.map((s) => `[Skill: ${s.name}]\n${s.body}`).join('\n\n');
}
