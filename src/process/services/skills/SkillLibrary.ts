/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SkillLibrary — singleton index service for the vendored Wayland Skills library.
 *
 * Memory budget: the index (~2 105 entries) and the name→entry Map are held
 * resident in the main process. At ~500 bytes per entry the index occupies
 * roughly 1–2 MB serialised; comfortably within Electron main-process budget.
 * Skill bodies (markdown files) are read on-demand and NOT cached here.
 */

import path from 'path';
import { readFile as fsReadFile } from 'fs/promises';
import { SKILL_SCANNER_VERSION, type SkillIndexEntry, type SkillSecurityReport, type SkillSource } from '@/common/types/skillTypes';
import { SkillGuard } from './SkillGuard';

// ProcessConfig and mainLogger are intentionally NOT imported at the module
// level: pulling them in drags `@/common` + initStorage (with the database
// driver layer) into bundles that don't need them — notably the
// `wayland_search_skills` MCP stdio subprocess. Use lazy dynamic imports or a
// plain `console.warn` here instead.

const TAG = '[SkillLibrary]';

type ReadFileFn = (p: string) => Promise<string>;

type SkillLibraryOptions = {
  resourceDir?: string;
  readFile?: ReadFileFn;
};

type SkillLibraryFilter = {
  source?: SkillSource;
  category?: string;
  tag?: string;
  type?: SkillIndexEntry['type'];
  verdict?: SkillIndexEntry['security'] extends { verdict: infer V } | undefined ? V : never;
  query?: string;
};

type SkillStats = {
  total: number;
  bySource: Record<SkillSource, number>;
  pinned: number;
  flagged: number;
};

export class SkillLibrary {
  private static instance: SkillLibrary | null = null;

  private readonly resourceDir: string;
  private readonly readFileFn: ReadFileFn;

  /** Populated incrementally — index lazy-loaded, more sources via registerSource. */
  private entries: SkillIndexEntry[] = [];
  private byName: Map<string, SkillIndexEntry> = new Map();
  /** Tracks whether the on-disk index.json has been merged in yet. */
  private indexLoaded = false;
  private loadPromise: Promise<void> | null = null;

  private constructor(opts: SkillLibraryOptions = {}) {
    this.resourceDir =
      opts.resourceDir ?? path.resolve(__dirname, '../../resources/skills-library');
    this.readFileFn = opts.readFile ?? ((p) => fsReadFile(p, 'utf-8'));
  }

  // ---------------------------------------------------------------------------
  // Singleton accessors
  // ---------------------------------------------------------------------------

  static getInstance(opts?: SkillLibraryOptions): SkillLibrary {
    if (!SkillLibrary.instance) {
      SkillLibrary.instance = new SkillLibrary(opts);
    }
    return SkillLibrary.instance;
  }

  /** For tests only — resets the singleton so a fresh instance can be injected. */
  static resetInstance(): void {
    SkillLibrary.instance = null;
  }

  // ---------------------------------------------------------------------------
  // Lazy load
  // ---------------------------------------------------------------------------

  private load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = (async () => {
      const indexPath = path.join(this.resourceDir, 'index.json');
      const raw = await this.readFileFn(indexPath);
      const parsed = JSON.parse(raw) as SkillIndexEntry[];
      // Merge index entries into existing collections so registerSource()
      // calls made before the first lazy-load are preserved.
      for (const e of parsed) {
        if (!this.byName.has(e.name)) {
          this.entries.push(e);
          this.byName.set(e.name, e);
        }
      }
      this.indexLoaded = true;
    })();
    return this.loadPromise;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.indexLoaded) return;
    await this.load();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Merge additional skill entries into the library.
   * On name collision the later registration wins; a warning is logged.
   */
  registerSource(incoming: SkillIndexEntry[]): void {
    for (const entry of incoming) {
      if (this.byName.has(entry.name)) {
        const prev = this.byName.get(entry.name)?.source;
        console.warn(
          `${TAG} Skill name collision on registerSource — '${entry.name}' overwritten`,
          { prev, next: entry.source }
        );
        this.entries = this.entries.filter((e) => e.name !== entry.name);
      }
      this.entries.push(entry);
      this.byName.set(entry.name, entry);
    }
  }

  /**
   * Return all entries, optionally filtered.
   * `query` is a case-insensitive substring match over `name` and `description`.
   */
  async list(filter?: SkillLibraryFilter): Promise<SkillIndexEntry[]> {
    await this.ensureLoaded();
    let result = this.entries;

    if (!filter) return result;

    const { source, category, tag, type, verdict, query } = filter;

    if (source !== undefined) {
      result = result.filter((e) => e.source === source);
    }
    if (category !== undefined) {
      result = result.filter((e) => e.metadata.category === category);
    }
    if (tag !== undefined) {
      result = result.filter((e) => e.metadata.tags.includes(tag));
    }
    if (type !== undefined) {
      result = result.filter((e) => e.type === type);
    }
    if (verdict !== undefined) {
      result = result.filter((e) => e.security?.verdict === verdict);
    }
    if (query !== undefined && query.length > 0) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      );
    }

    return result;
  }

  /** Return a single entry by exact name, or null if not found. */
  async get(name: string): Promise<SkillIndexEntry | null> {
    await this.ensureLoaded();
    return this.byName.get(name) ?? null;
  }

  /**
   * Return aggregate statistics.
   * `pinned` reads from `skills.preferences.pinned` via ProcessConfig; if
   * storage is unavailable it falls back to 0.
   */
  async stats(): Promise<SkillStats> {
    await this.ensureLoaded();

    const bySource = {} as Record<SkillSource, number>;
    let flagged = 0;

    for (const entry of this.entries) {
      bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
      if (entry.security && entry.security.verdict !== 'clean') {
        flagged += 1;
      }
    }

    let pinned = 0;
    try {
      const { ProcessConfig } = await import('@process/utils/initStorage');
      const prefs = await ProcessConfig.get('skills.preferences');
      pinned = prefs?.pinned?.length ?? 0;
    } catch {
      // Storage unavailable (e.g. running inside a subprocess MCP bundle) —
      // treat as 0.
    }

    return { total: this.entries.length, bySource, pinned, flagged };
  }

  /**
   * Load the body (markdown content) for a named skill.
   *
   * Returns `null` for unknown skills (no throw).
   * Returns `null` and logs a warning if `security.verdict === 'blocked'`
   * without invoking the filesystem (blocked skills are quarantined).
   */
  async loadBody(name: string): Promise<string | null> {
    await this.ensureLoaded();

    const entry = this.byName.get(name);
    if (!entry) return null;

    if (entry.security?.verdict === 'blocked') {
      console.warn(`${TAG} Refused to load body for blocked skill '${name}'`);
      return null;
    }

    const bodyPath = path.join(this.resourceDir, entry.path);
    try {
      return await this.readFileFn(bodyPath);
    } catch {
      return null;
    }
  }

  /**
   * Re-scan a skill if its stored scannerVersion is older than the current
   * SKILL_SCANNER_VERSION. Reads the body off the resource dir and updates
   * the in-memory entry's `security` field in place. Returns the new report
   * (or the existing one if no re-scan was needed), or null for unknown skills.
   * Runs lazily / on demand — never on the startup path.
   */
  async rescanIfStale(name: string, opts?: { llm?: boolean }): Promise<SkillSecurityReport | null> {
    await this.ensureLoaded();
    const entry = this.byName.get(name);
    if (!entry) return null;
    const stored = entry.security?.scannerVersion ?? 0;
    if (stored >= SKILL_SCANNER_VERSION) return entry.security ?? null;
    let body: string;
    try {
      body = await this.readFileFn(path.join(this.resourceDir, entry.path));
    } catch {
      return entry.security ?? null;
    }
    const [report] = await SkillGuard.scan(
      [{ name: entry.name, body, description: entry.description, tags: entry.metadata.tags ?? [] }],
      opts
    );
    entry.security = report;
    return report;
  }
}
