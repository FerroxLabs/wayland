/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SkillLibrary - singleton index service for the vendored Wayland Skills library.
 *
 * Memory budget: the index (~2 105 entries) and the name→entry Map are held
 * resident in the main process. At ~500 bytes per entry the index occupies
 * roughly 1–2 MB serialised; comfortably within Electron main-process budget.
 * Skill bodies (markdown files) are read on-demand and NOT cached here.
 */

import path from 'path';
import { existsSync } from 'fs';
import { readFile as fsReadFile } from 'fs/promises';
import {
  SKILL_SCANNER_VERSION,
  type SkillIndexEntry,
  type SkillSecurityReport,
  type SkillSource,
} from '@/common/types/skillTypes';
import { SkillGuard } from './SkillGuard';
import { openSkillPack, type SkillPackReader } from './SkillPack';

// ProcessConfig and mainLogger are intentionally NOT imported at the module
// level: pulling them in drags `@/common` + initStorage (with the database
// driver layer) into bundles that don't need them - notably the
// `wayland_search_skills` MCP stdio subprocess. Use lazy dynamic imports or a
// plain `console.warn` here instead.

const TAG = '[SkillLibrary]';

/**
 * Build the ordered list of candidate directories for a bundled resource dir
 * (`skills-library` or `bundled-workflows`), given the bundle file's directory
 * and the Electron `resourcesPath` (which is `undefined` outside the main
 * process - notably in the spawned `wayland_search_skills` stdio subprocess).
 *
 * Pure and side-effect free so the candidate order is unit-testable without a
 * packaged build. The first existing candidate wins; see the resolvers below.
 *
 * Packaging layout (extraResources, electron-builder.yml):
 *   Contents/Resources/skills-library/index.json          ← the real location
 *   Contents/Resources/app.asar.unpacked/out/main/<bundle> ← __dirname here
 * so the resource dir is THREE levels above the bundle dir, beside
 * `app.asar.unpacked`. The pre-fix candidate list only walked two levels up,
 * which is why packaged skill search failed with ENOENT (issue #22).
 *
 * The `app.asar` → `app.asar.unpacked` rewrite is separator-bounded so it
 * cannot match inside an already-unpacked path and double the suffix (the
 * `app.asar.unpacked.unpacked` bug). Mirrors `resolveMcpScriptDir()`.
 */
export function buildResourceDirCandidates(
  bundleDir: string,
  resourcesPath: string | undefined,
  resourceName: 'skills-library' | 'bundled-workflows'
): string[] {
  // `out/main/chunks/` when electron-vite code-splits → collapse to `out/main/`.
  const baseDir = path.basename(bundleDir) === 'chunks' ? path.dirname(bundleDir) : bundleDir;
  // Separator-bounded so it only fires when `app.asar` is a real path segment
  // and never matches the `app.asar.unpacked` we are trying to produce.
  const baseDirUnpacked = baseDir.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`);

  return [
    // Main-process context: Electron resolves `resourcesPath` directly.
    ...(resourcesPath ? [path.join(resourcesPath, resourceName)] : []),
    // Packaged subprocess: extraResources sits beside `app.asar.unpacked`, three
    // levels above out/main (app.asar.unpacked/out/main → Resources/<name>).
    path.resolve(baseDirUnpacked, `../../../${resourceName}`),
    // Dev build: out/main/ → repo root → src/process/resources/<name>.
    path.resolve(baseDir, `../../src/process/resources/${resourceName}`),
    // Headless getwayland payload: the bundle ships at payload/dist-server (one
    // level deep, not two like dev's out/main), with the builtin resources at
    // payload/src/process/resources/<name>. build-payload.mjs copies them there.
    path.resolve(baseDir, `../src/process/resources/${resourceName}`),
    // Legacy asarUnpack target (never populated; kept for back-compat).
    path.resolve(baseDirUnpacked, `../../resources/${resourceName}`),
    // Pre-fix legacy defaults - kept last so an existing prod layout still works.
    path.resolve(baseDir, `../../resources/${resourceName}`),
    path.resolve(baseDir, `../resources/${resourceName}`),
  ];
}

/**
 * Resolve the on-disk directory that holds `index.json` + `bodies/`.
 *
 * Anchors on `__dirname` (the bundle file's directory) - NOT `require.main`,
 * which in Electron resolves to the app dir passed on the command line. The
 * candidate order (see {@link buildResourceDirCandidates}) handles dev, the
 * packaged main process, and the packaged stdio subprocess (where
 * `process.resourcesPath` is `undefined`) without an explicit `isPackaged`
 * flag. If no candidate exists, the first is returned so the eventual
 * `readFile(index.json)` failure surfaces a concrete path to grep for.
 */
function resolveSkillsLibraryDir(): string {
  const candidates = buildResourceDirCandidates(path.dirname(__filename), process.resourcesPath, 'skills-library');
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'index.json'))) return candidate;
  }
  return candidates[0];
}

/**
 * Resolve the on-disk directory that holds the Wayland built-in workflows
 * (`index.json` + `bodies/`). These are Wayland-original workflows kept
 * separate from the vendored skills-library. Mirrors
 * {@link resolveSkillsLibraryDir}'s probe order. Unlike the skills-library this
 * folder may legitimately be empty (an `index.json` of `[]`), so callers must
 * no-op gracefully when the index is absent.
 */
function resolveBundledWorkflowsDir(): string {
  const candidates = buildResourceDirCandidates(path.dirname(__filename), process.resourcesPath, 'bundled-workflows');
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'index.json'))) return candidate;
  }
  return candidates[0];
}

type ReadFileFn = (p: string) => Promise<string>;

type SkillLibraryOptions = {
  resourceDir?: string;
  /** Override for the Wayland built-in workflows dir (tests). */
  bundledWorkflowsDir?: string;
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
  /** Count of entries with `security.verdict === 'clean'` (verified safe). */
  verified: number;
};

export class SkillLibrary {
  private static instance: SkillLibrary | null = null;

  private readonly resourceDir: string;
  private readonly bundledWorkflowsDir: string;
  private readonly readFileFn: ReadFileFn;

  /** Populated incrementally - index lazy-loaded, more sources via registerSource. */
  private entries: SkillIndexEntry[] = [];
  private byName: Map<string, SkillIndexEntry> = new Map();
  /**
   * Names whose body lives under {@link bundledWorkflowsDir} rather than
   * {@link resourceDir}. Lets `loadBody` route to the correct resource root.
   */
  private bundledWorkflowNames: Set<string> = new Set();
  /** Tracks whether the on-disk index.json has been merged in yet. */
  private indexLoaded = false;
  private loadPromise: Promise<void> | null = null;
  /**
   * #309: packed body stores. When a `skill-bodies.bin` + offset index is
   * present in the resource dir (packaged builds), vendored bodies are seek-read
   * from the blob instead of loose `bodies/*.md`. `null` means no pack (dev tree
   * / legacy layout) - `loadBody` then reads loose files exactly as before.
   */
  private skillPack: SkillPackReader | null = null;
  private workflowPack: SkillPackReader | null = null;

  private constructor(opts: SkillLibraryOptions = {}) {
    this.resourceDir = opts.resourceDir ?? resolveSkillsLibraryDir();
    this.bundledWorkflowsDir = opts.bundledWorkflowsDir ?? resolveBundledWorkflowsDir();
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

  /** For tests only - resets the singleton so a fresh instance can be injected. */
  static resetInstance(): void {
    SkillLibrary.instance = null;
  }

  // ---------------------------------------------------------------------------
  // Lazy load
  // ---------------------------------------------------------------------------

  private load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = (async () => {
      // #309: open the packed body stores if present (packaged builds ship a
      // blob + offset index instead of loose bodies/). Absent in the dev tree -
      // openSkillPack returns null and loadBody falls back to loose files.
      this.skillPack = await openSkillPack(this.resourceDir);
      this.workflowPack = await openSkillPack(this.bundledWorkflowsDir);

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
      // ALSO merge the Wayland built-in workflows folder. The main library
      // wins on name conflict (the bundled-workflows entry is dropped). The
      // folder is optional: a missing/empty/malformed index is a graceful
      // no-op rather than a startup failure.
      await this.loadBundledWorkflows();
      this.indexLoaded = true;
    })();
    return this.loadPromise;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.indexLoaded) return;
    await this.load();
  }

  /**
   * Merge the Wayland built-in workflows index ({@link bundledWorkflowsDir}/
   * index.json) into the in-memory collections. The main library always wins
   * on name conflict. Entries sourced here are tracked in
   * {@link bundledWorkflowNames} so `loadBody` resolves their bodies against
   * the bundled-workflows root.
   *
   * Failure modes (folder absent, index missing, JSON malformed) are swallowed
   * with a warning - the built-in workflows are additive and must never break
   * the skills-library load path.
   */
  private async loadBundledWorkflows(): Promise<void> {
    let raw: string;
    try {
      raw = await this.readFileFn(path.join(this.bundledWorkflowsDir, 'index.json'));
    } catch {
      // No bundled-workflows folder/index - expected when none are vendored.
      return;
    }
    let parsed: SkillIndexEntry[];
    try {
      parsed = JSON.parse(raw) as SkillIndexEntry[];
    } catch (err) {
      console.warn(`${TAG} Ignoring malformed bundled-workflows index.json`, err);
      return;
    }
    if (!Array.isArray(parsed)) return;
    for (const e of parsed) {
      if (this.byName.has(e.name)) continue; // main library wins
      this.entries.push(e);
      this.byName.set(e.name, e);
      this.bundledWorkflowNames.add(e.name);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Merge additional skill entries into the library.
   *
   * Collision policy:
   *  - Imported entries CANNOT overwrite trusted sources ('wayland-library',
   *    'team'). The incoming entry is skipped and a warning is returned so the
   *    caller can surface "skipped — name collides with a built-in" to the user.
   *  - All other collisions: later registration wins (existing behavior).
   *
   * @returns Array of human-readable warning strings for any skipped entries.
   */
  registerSource(incoming: SkillIndexEntry[]): string[] {
    const collisionWarnings: string[] = [];
    const TRUSTED_SOURCES: ReadonlySet<SkillSource> = new Set(['wayland-library', 'team']);

    for (const entry of incoming) {
      if (this.byName.has(entry.name)) {
        const existing = this.byName.get(entry.name)!;
        // Imported entry must not shadow a trusted built-in/vendor entry.
        if (entry.source === 'imported' && TRUSTED_SOURCES.has(existing.source)) {
          const warning = `Skipped '${entry.name}': name collides with a built-in (${existing.source}) — import not applied`;
          collisionWarnings.push(warning);
          console.warn(`${TAG} ${warning}`);
          continue;
        }
        console.warn(`${TAG} Skill name collision on registerSource - '${entry.name}' overwritten`, {
          prev: existing.source,
          next: entry.source,
        });
        this.entries = this.entries.filter((e) => e.name !== entry.name);
      }
      this.entries.push(entry);
      this.byName.set(entry.name, entry);
    }

    return collisionWarnings;
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
      result = result.filter((e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }

    return result;
  }

  /** Return a single entry by exact name, or null if not found. */
  async get(name: string): Promise<SkillIndexEntry | null> {
    await this.ensureLoaded();
    return this.byName.get(name) ?? null;
  }

  /**
   * Return aggregate statistics, optionally over a subset of the library.
   *
   * `pinned` reads from `skills.preferences.pinned` via ProcessConfig; if
   * storage is unavailable it falls back to 0.
   *
   * The optional `filter.type` lets callers scope the stats to a single
   * entry kind. The Skills page passes `{ type: 'skill' }` so workflows
   * (107) and agent-profiles (25) don't pad the displayed counts - they
   * route to the Workflows page and Assistants nav respectively.
   */
  async stats(filter?: { type?: SkillIndexEntry['type'] }): Promise<SkillStats> {
    await this.ensureLoaded();

    const entries = filter?.type ? this.entries.filter((e) => e.type === filter.type) : this.entries;

    const bySource = {} as Record<SkillSource, number>;
    let flagged = 0;
    let verified = 0;

    for (const entry of entries) {
      bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
      const verdict = entry.security?.verdict;
      // Flagged = SkillGuard saw a real problem. Unscanned/clean don't count
      // - every freshly-vendored skill is "unscanned" until scanned on
      // demand, so treating unscanned as flagged would surface a
      // 2,096-flagged stat that is just noise.
      if (verdict === 'review' || verdict === 'blocked') {
        flagged += 1;
      }
      if (verdict === 'clean') {
        verified += 1;
      }
    }

    let pinned = 0;
    try {
      const { ProcessConfig } = await import('@process/utils/initStorage');
      const prefs = await ProcessConfig.get('skills.preferences');
      pinned = prefs?.pinned?.length ?? 0;
    } catch {
      // Storage unavailable (e.g. running inside a subprocess MCP bundle) -
      // treat as 0.
    }

    return { total: entries.length, bySource, pinned, flagged, verified };
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

    // Externally-rooted sources (team, user, imported, cli-discovered) carry
    // absolute paths because their SKILL.md lives outside the bundled
    // `resourceDir`. Honor those directly. Vendored entries keep relative
    // paths and continue to resolve against `resourceDir`.
    //
    // Vendored bodies live under `<resourceDir>/bodies/...` but index.json
    // stores the path without the `bodies/` prefix. Try the literal path
    // first (preserves any existing layout) and fall back to `bodies/` so the
    // canonical vendored layout works without touching every index entry.
    if (path.isAbsolute(entry.path)) {
      try {
        return await this.readFileFn(entry.path);
      } catch {
        return null;
      }
    }
    // Wayland built-in workflows resolve their (relative) body against the
    // bundled-workflows root, mirroring the skills-library literal-then-bodies
    // fallback so index entries may store the path with or without the
    // `bodies/` prefix.
    if (this.bundledWorkflowNames.has(name)) {
      // #309: prefer the packed body store; fall back to loose files (dev tree).
      if (this.workflowPack?.has(entry.path)) {
        const body = await this.workflowPack.read(entry.path);
        if (body !== null) return body;
      }
      try {
        return await this.readFileFn(path.join(this.bundledWorkflowsDir, entry.path));
      } catch {
        try {
          return await this.readFileFn(path.join(this.bundledWorkflowsDir, 'bodies', entry.path));
        } catch {
          return null;
        }
      }
    }
    // #309: vendored skills-library body - prefer the pack, fall back to loose.
    if (this.skillPack?.has(entry.path)) {
      const body = await this.skillPack.read(entry.path);
      if (body !== null) return body;
    }
    try {
      return await this.readFileFn(path.join(this.resourceDir, entry.path));
    } catch {
      try {
        return await this.readFileFn(path.join(this.resourceDir, 'bodies', entry.path));
      } catch {
        return null;
      }
    }
  }

  /**
   * Re-scan a skill if its stored scannerVersion is older than the current
   * SKILL_SCANNER_VERSION. Reads the body off the resource dir and updates
   * the in-memory entry's `security` field in place. Returns the new report
   * (or the existing one if no re-scan was needed), or null for unknown skills.
   * Runs lazily / on demand - never on the startup path.
   */
  async rescanIfStale(name: string, opts?: { llm?: boolean }): Promise<SkillSecurityReport | null> {
    await this.ensureLoaded();
    const entry = this.byName.get(name);
    if (!entry) return null;
    const stored = entry.security?.scannerVersion ?? 0;
    if (stored >= SKILL_SCANNER_VERSION) return entry.security ?? null;
    let body: string | null = null;
    // #309: prefer the packed body store; fall back to loose files (dev tree).
    if (this.skillPack?.has(entry.path)) {
      body = await this.skillPack.read(entry.path);
    }
    if (body === null) {
      try {
        body = await this.readFileFn(path.join(this.resourceDir, entry.path));
      } catch {
        return entry.security ?? null;
      }
    }
    const [report] = await SkillGuard.scan(
      [{ name: entry.name, body, description: entry.description, tags: entry.metadata.tags ?? [] }],
      opts
    );
    entry.security = report;
    return report;
  }

  /**
   * One-time, regex-only sweep of the vendored library (C4).
   *
   * Flips every entry whose stored `scannerVersion` is behind the current
   * `SKILL_SCANNER_VERSION` from `unscanned` to its real `clean`/`review`
   * verdict, fixing the "verified safe" counter. First-party content, so it is
   * ALWAYS `{ llm: false }` — never a model call. The `scannerVersion` gate
   * makes it idempotent: a second call after a full sweep re-scans nothing.
   *
   * Batched with an `await` yield between chunks so a 2,000-entry sweep does
   * not monopolize the event loop on the boot path.
   *
   * @returns the number of entries that were (re)scanned.
   */
  async rescanStale(opts?: { batchSize?: number }): Promise<{ rescanned: number }> {
    await this.ensureLoaded();
    const batchSize = opts?.batchSize ?? 100;
    const stale = this.entries.filter((e) => (e.security?.scannerVersion ?? 0) < SKILL_SCANNER_VERSION);
    let rescanned = 0;
    for (let i = 0; i < stale.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await this.rescanIfStale(stale[i].name, { llm: false });
      rescanned += 1;
      // Yield to the event loop between batches so the sweep stays off the UI
      // thread's critical path.
      if (i > 0 && i % batchSize === 0) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setImmediate(resolve));
      }
    }
    return { rescanned };
  }
}
