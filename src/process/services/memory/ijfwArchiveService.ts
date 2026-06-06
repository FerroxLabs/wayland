/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW Archive Service - reads .ijfw/memory/*.md files directly from disk,
 * builds an in-memory index, and watches for changes.
 *
 * Architectural note: this service intentionally does NOT go through the MCP
 * server. The MCP server owns write/orchestrate paths; this service owns the
 * human display path (read + index + present).
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import log from 'electron-log';
import { parseMarkdownBlocks } from './markdownFrontmatter';
import { computePromotionScore } from './promotionScore';
import type {
  MemoryEntry,
  MemoryStats,
  ListFilter,
  ProjectSummary,
  TagCount,
  PromotionCandidates,
  IndexStats,
} from '@/common/types/memory';

// Memory files to read per project root.
const MEMORY_FILES = ['knowledge.md', 'journal.md', 'handoff.md', 'plan.md', 'brief.md', 'project-journal.md'] as const;

type WatcherFactory = (
  filePath: string,
  opts: { persistent: boolean },
  callback: (event: string, filename: string | null) => void
) => { close(): void };

// ===== Index data structures =====

type MemoryIndex = {
  byId: Map<string, MemoryEntry>;
  byProject: Map<string, MemoryEntry[]>;
  byType: Map<string, MemoryEntry[]>;
  byTag: Map<string, MemoryEntry[]>;
  all: MemoryEntry[];
  projects: ProjectSummary[];
  wikiCounts: Map<string, number>; // project basename → wiki file count
  refsReady: boolean;
  refsExpiry: number; // epoch ms when refsByEntry cache expires
  refsByEntry: Map<string, number>; // entryId → cross-project ref count
};

// ===== Helpers =====

function makeId(sourcePath: string, storedAt: string, summary: string): string {
  const raw = `${sourcePath}:${storedAt}:${summary.slice(0, 80)}`;
  return crypto.createHash('sha1').update(raw).digest('hex').slice(0, 12);
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function parseDateToMs(stored: string): number {
  if (!stored) return 0;
  const ms = Date.parse(stored);
  return isNaN(ms) ? 0 : ms;
}

function toMemoryType(raw: string): MemoryEntry['type'] {
  const lower = raw?.toLowerCase?.() ?? '';
  const valid = ['decision', 'pattern', 'observation', 'session', 'wiki', 'preference'] as const;
  return (valid as readonly string[]).includes(lower) ? (lower as MemoryEntry['type']) : 'observation';
}

// ===== Registry reader =====

type RegistryEntry = { path: string; lastSeen: number };

async function readRegistry(): Promise<RegistryEntry[]> {
  const registryPath = path.join(os.homedir(), '.ijfw', 'registry.md');
  try {
    const content = await fs.promises.readFile(registryPath, 'utf8');
    const entries: RegistryEntry[] = [];
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('<!--')) continue;
      // Format: <path> | <hash> | <ISO8601>
      const parts = trimmed.split('|').map((p) => p.trim());
      if (parts.length < 1 || !parts[0]) continue;
      const projectPath = parts[0];
      const lastSeen = parts[2] ? parseDateToMs(parts[2]) : 0;
      entries.push({ path: projectPath, lastSeen });
    }
    return entries;
  } catch {
    return [];
  }
}

async function fallbackScanForProjects(): Promise<RegistryEntry[]> {
  const devDir = path.join(os.homedir(), 'dev');
  const entries: RegistryEntry[] = [];
  try {
    const topDirs = await fs.promises.readdir(devDir);
    for (const name of topDirs) {
      const candidate = path.join(devDir, name, '.ijfw', 'memory');
      try {
        await fs.promises.access(candidate);
        entries.push({ path: path.join(devDir, name), lastSeen: 0 });
      } catch {
        // not an IJFW project
      }
    }
  } catch {
    // dev dir doesn't exist
  }
  return entries;
}

// ===== Entry parser =====

function parseEntriesFromFile(filePath: string, projectPath: string, projectName: string): MemoryEntry[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const blocks = parseMarkdownBlocks(content);
  const entries: MemoryEntry[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const fm = block.frontmatter;

    const summary =
      typeof fm['summary'] === 'string' && fm['summary']
        ? fm['summary']
        : block.body.split('\n')[0].replace(/^#+\s*/, '') || 'Untitled';

    const storedStr = typeof fm['stored'] === 'string' ? fm['stored'] : '';
    const storedAt = parseDateToMs(storedStr) || Date.now();

    const rawTags = fm['tags'];
    const tags: string[] = Array.isArray(rawTags) ? rawTags : typeof rawTags === 'string' && rawTags ? [rawTags] : [];

    const id = makeId(filePath, storedStr || String(storedAt), summary);
    const bodyPreview = stripMarkdown(block.body).slice(0, 200);

    // Extract Why / How to apply from body text.
    let why: string | undefined;
    let howToApply: string | undefined;
    const whyMatch = block.body.match(/\*\*Why:\*\*\s*([\s\S]+?)(?=\n\*\*|$)/);
    if (whyMatch) why = whyMatch[1].trim();
    const howMatch = block.body.match(/\*\*How to apply:\*\*\s*([\s\S]+?)(?=\n\*\*|$)/);
    if (howMatch) howToApply = howMatch[1].trim();

    entries.push({
      id,
      type: toMemoryType(typeof fm['type'] === 'string' ? fm['type'] : ''),
      project: projectName,
      projectPath,
      summary,
      bodyPreview,
      why,
      howToApply,
      tags,
      storedAt,
      sourcePath: filePath,
      sourceLine: 0, // computed below
      referencedBy: 0, // populated after cross-project grep
      promotionScore: 0, // computed after referencedBy
    });
  }

  // Approximate source lines by counting `---` separators in file.
  // We walk the original content to assign approximate line numbers.
  const lines = content.split('\n');
  let blockIdx = -1;
  let lastLine = 1;
  for (let l = 0; l < lines.length; l++) {
    if (lines[l].trim() === '---') {
      if (blockIdx >= 0 && blockIdx < entries.length) {
        entries[blockIdx].sourceLine = lastLine;
      }
      blockIdx++;
      lastLine = l + 1;
    }
  }
  if (blockIdx >= 0 && blockIdx < entries.length) {
    entries[blockIdx].sourceLine = lastLine;
  }

  return entries;
}

// ===== Cross-project reference grep =====

const REFS_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * PERF-MEM-01: resident cap on the in-process memory index. `all[]` previously
 * grew with the user's entire accumulated corpus and was rebuilt in place, so a
 * multi-day main-process session kept an ever-larger array resident. We keep
 * only the most-recent N entries (by storedAt) resident; older entries stay on
 * disk and remain reachable on demand via getEntry (which reads the body from
 * sourcePath). Per-project counts are computed from the full scan before the cap
 * so list/stats totals are unaffected. Set generously so normal corpora are
 * fully resident and only pathological histories are trimmed.
 */
const RESIDENT_ENTRY_CAP = 5000;

function buildRefsMap(allEntries: MemoryEntry[]): Map<string, number> {
  const refs = new Map<string, number>();
  const journalEntries = allEntries.filter(
    (e) => e.sourcePath.endsWith('journal.md') || e.sourcePath.endsWith('project-journal.md')
  );
  const journalBodies = journalEntries.map((e) => e.bodyPreview + (e.body ?? ''));

  for (const entry of allEntries) {
    const needle = entry.summary.slice(0, 80).toLowerCase();
    if (!needle) continue;
    let count = 0;
    for (const body of journalBodies) {
      if (body.toLowerCase().includes(needle)) count++;
    }
    if (count > 0) refs.set(entry.id, count);
  }
  return refs;
}

// ===== Wiki file counts =====

async function countWikiFiles(projectPath: string): Promise<number> {
  const wikiDir = path.join(projectPath, '.ijfw', 'wiki');
  try {
    const entries = await fs.promises.readdir(wikiDir);
    return entries.filter((n) => n.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

// ===== Sparkline builder =====

function buildSparkline(entries: MemoryEntry[], days = 30): number[] {
  const now = Date.now();
  const buckets: number[] = Array.from({ length: days }, () => 0);
  for (const e of entries) {
    const dayAgo = Math.floor((now - e.storedAt) / (24 * 60 * 60 * 1000));
    if (dayAgo >= 0 && dayAgo < days) {
      buckets[days - 1 - dayAgo]++;
    }
  }
  return buckets;
}

// ===== Main service =====

type ChangeCallback = (stats: IndexStats) => void;

class IjfwArchiveService {
  private index: MemoryIndex = {
    byId: new Map(),
    byProject: new Map(),
    byType: new Map(),
    byTag: new Map(),
    all: [],
    projects: [],
    wikiCounts: new Map(),
    refsReady: false,
    refsExpiry: 0,
    refsByEntry: new Map(),
  };

  private watchers: Array<{ close(): void }> = [];
  private changeCallbacks: ChangeCallback[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  /** Tracks the currently-running rebuild so IPC callers can await it. */
  private activeRebuild: Promise<void> | null = null;
  private watcherFactory: WatcherFactory;

  constructor(watcherFactory?: WatcherFactory) {
    this.watcherFactory = watcherFactory ?? defaultWatcherFactory;
  }

  /** Initialize - read all projects, build index. Idempotent. */
  async init(): Promise<void> {
    // If a rebuild is in flight (from scheduleReindex), wait for it to land
    // before serving any query so callers never read a half-built index.
    if (this.activeRebuild) await this.activeRebuild;
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.buildIndex();
    await this.initPromise;
    this.initialized = true;
  }

  private async buildIndex(): Promise<void> {
    let registryEntries = await readRegistry();
    if (registryEntries.length === 0) {
      registryEntries = await fallbackScanForProjects();
    }

    // Deduplicate by normalized path.
    const seen = new Set<string>();
    const projectPaths: RegistryEntry[] = [];
    for (const entry of registryEntries) {
      const norm = path.resolve(entry.path);
      if (seen.has(norm)) continue;
      // Skip temp dirs and non-existent paths.
      if (norm.includes('/tmp/') || norm.includes('Temp/')) continue;
      try {
        await fs.promises.access(path.join(norm, '.ijfw', 'memory'));
        seen.add(norm);
        projectPaths.push({ path: norm, lastSeen: entry.lastSeen });
      } catch {
        // project has no .ijfw/memory dir - skip
      }
    }

    const allEntries: MemoryEntry[] = [];
    const projectSummaries: ProjectSummary[] = [];
    const wikiCounts = new Map<string, number>();

    for (const { path: pPath, lastSeen } of projectPaths) {
      const memDir = path.join(pPath, '.ijfw', 'memory');
      const projectName = path.basename(pPath);
      const projectEntries: MemoryEntry[] = [];

      for (const fileName of MEMORY_FILES) {
        const filePath = path.join(memDir, fileName);
        try {
          await fs.promises.access(filePath);
        } catch {
          continue;
        }
        const parsed = parseEntriesFromFile(filePath, pPath, projectName);
        projectEntries.push(...parsed);
        this.watchFile(filePath);
      }

      allEntries.push(...projectEntries);
      const wikiCount = await countWikiFiles(pPath);
      wikiCounts.set(projectName, wikiCount);

      const maxStored = projectEntries.reduce((m, e) => Math.max(m, e.storedAt), lastSeen);
      projectSummaries.push({
        path: pPath,
        basename: projectName,
        count: projectEntries.length,
        lastActive: maxStored,
      });
    }

    // PERF-MEM-01: cap the resident working set. projectSummaries.count above is
    // computed from the full per-project scan, so list/stats project totals stay
    // accurate; only the in-memory `all[]` (and the maps derived from it) is
    // trimmed to the most-recent N entries. Older entries remain on disk and are
    // still reachable via getEntry, which reads the body from sourcePath.
    const resident =
      allEntries.length > RESIDENT_ENTRY_CAP
        ? allEntries.toSorted((a, b) => b.storedAt - a.storedAt).slice(0, RESIDENT_ENTRY_CAP)
        : allEntries;

    this.index = {
      byId: new Map(resident.map((e) => [e.id, e])),
      byProject: groupBy(resident, (e) => e.project),
      byType: groupBy(resident, (e) => e.type),
      byTag: groupByTags(resident),
      all: resident,
      projects: projectSummaries.toSorted((a, b) => b.lastActive - a.lastActive),
      wikiCounts,
      refsReady: false,
      refsExpiry: 0,
      refsByEntry: new Map(),
    };
  }

  private ensureRefs(): void {
    const now = Date.now();
    if (this.index.refsReady && now < this.index.refsExpiry) return;
    this.index.refsByEntry = buildRefsMap(this.index.all);
    this.index.refsExpiry = now + REFS_TTL_MS;
    this.index.refsReady = true;

    // Recompute promotion scores now that refs are available.
    for (const entry of this.index.all) {
      entry.referencedBy = this.index.refsByEntry.get(entry.id) ?? 0;
      entry.promotionScore = computePromotionScore(entry, this.index.refsByEntry);
    }
  }

  private watchFile(filePath: string): void {
    try {
      const watcher = this.watcherFactory(filePath, { persistent: false }, () => {
        this.scheduleReindex();
      });
      this.watchers.push(watcher);
    } catch (err) {
      log.warn('[memory-archive] watch failed', { filePath, err });
    }
  }

  private scheduleReindex(): void {
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      // Build into a local variable, then atomically swap onto this.index.
      // This prevents any IPC caller that arrives mid-build from reading
      // an inconsistent state.  We do NOT flip initialized=false so callers
      // continue to see the old (valid) index while the rebuild runs.
      const rebuild = (async () => {
        this.closeWatchers();
        await this.buildIndex();
        const stats = this.indexStats();
        for (const cb of this.changeCallbacks) cb(stats);
      })();
      this.activeRebuild = rebuild;
      rebuild
        .catch((err) => {
          log.error('[memory-archive] reindex failed', { err });
        })
        .finally(() => {
          if (this.activeRebuild === rebuild) this.activeRebuild = null;
        });
    }, 500);
  }

  private closeWatchers(): void {
    for (const w of this.watchers) {
      try {
        w.close();
      } catch {
        /* ignore */
      }
    }
    this.watchers = [];
  }

  onIndexChange(cb: ChangeCallback): () => void {
    this.changeCallbacks.push(cb);
    return () => {
      this.changeCallbacks = this.changeCallbacks.filter((c) => c !== cb);
    };
  }

  // ===== Public API =====

  async getStats(): Promise<MemoryStats> {
    await this.init();
    this.ensureRefs();
    const idx = this.index;
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const WEEK = 7 * DAY;

    const all = idx.all;
    const decisions = (idx.byType.get('decision') ?? []).length;
    const sessions = (idx.byType.get('session') ?? []).length;
    const wikiTotal = [...idx.wikiCounts.values()].reduce((s, n) => s + n, 0);
    const projects = idx.projects.length;

    // Banked value proxy: referenced * $0.15 + decisions * $0.50 + wiki * $2.00
    const totalRefs = [...idx.refsByEntry.values()].reduce((s, n) => s + n, 0);
    const banked = Math.round(totalRefs * 0.15 + decisions * 0.5 + wikiTotal * 2);

    const since24h = now - DAY;
    const since7d = now - WEEK;
    const countSince = (entries: MemoryEntry[], since: number) => entries.filter((e) => e.storedAt >= since).length;

    const decisionEntries = idx.byType.get('decision') ?? [];
    const wikiEntries = idx.byType.get('wiki') ?? [];
    const sessionEntries = idx.byType.get('session') ?? [];

    // typeCounts - zero-filled for all six MemoryType keys so the renderer
    // can render "Decisions (0)" without optional chaining.
    const typeCounts: MemoryStats['typeCounts'] = {
      decision: 0,
      pattern: 0,
      observation: 0,
      session: 0,
      wiki: 0,
      preference: 0,
    };
    for (const e of all) typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1;

    // streak - computed across the disk index (all projects).
    // Collect distinct UTC calendar days (YYYY-MM-DD), sort ascending, then
    // walk once to find the longest consecutive run and total active-day count.
    const daySet = new Set<string>();
    for (const e of all) {
      if (!e.storedAt) continue;
      const d = new Date(e.storedAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      daySet.add(key);
    }
    const sortedDays = [...daySet].toSorted();
    let longestDays = 0;
    let currentRun = 0;
    let prevDayMs = 0;
    let lastActiveDayMs = 0;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    for (const dayStr of sortedDays) {
      const dayMs = Date.parse(dayStr); // midnight UTC
      if (prevDayMs > 0 && dayMs - prevDayMs === ONE_DAY_MS) {
        currentRun++;
      } else {
        currentRun = 1;
      }
      if (currentRun > longestDays) longestDays = currentRun;
      prevDayMs = dayMs;
      lastActiveDayMs = dayMs;
    }
    const streak: MemoryStats['streak'] = {
      sessions: sortedDays.length,
      longestDays,
      lastActiveDayMs,
    };

    return {
      total: all.length,
      decisions,
      wiki: wikiTotal,
      sessions,
      projects,
      banked,
      deltas: {
        total24h: countSince(all, since24h),
        total7d: countSince(all, since7d),
        decisions24h: countSince(decisionEntries, since24h),
        decisions7d: countSince(decisionEntries, since7d),
        wiki24h: countSince(wikiEntries, since24h),
        wiki7d: countSince(wikiEntries, since7d),
        sessions24h: countSince(sessionEntries, since24h),
        sessions7d: countSince(sessionEntries, since7d),
      },
      sparkline: buildSparkline(all),
      sparklines: {
        total: buildSparkline(all),
        banked: buildSparkline(all),
        decisions: buildSparkline(decisionEntries),
        wiki: buildSparkline(wikiEntries),
        sessions: buildSparkline(sessionEntries),
        projects: buildSparkline(all),
      },
      typeCounts,
      streak,
    };
  }

  async listEntries(filter: ListFilter = {}): Promise<{ entries: MemoryEntry[]; total: number }> {
    await this.init();
    this.ensureRefs();

    let entries = this.index.all;

    // Project filter.
    if (filter.project && filter.project !== 'all') {
      if (filter.project === 'global') {
        entries = entries.filter((e) => e.tags.includes('global'));
      } else if (filter.project === 'this') {
        // 'this' = the first project in the index (most recently active).
        const firstProject = this.index.projects[0]?.basename;
        if (firstProject) {
          entries = entries.filter((e) => e.project === firstProject);
        }
      } else {
        entries = entries.filter((e) => e.project === filter.project);
      }
    }

    // Type filter.
    if (filter.types && filter.types.length > 0) {
      const typeSet = new Set(filter.types);
      entries = entries.filter((e) => typeSet.has(e.type));
    }

    // Tag filter.
    if (filter.tags && filter.tags.length > 0) {
      const tagSet = new Set(filter.tags.map((t) => t.toLowerCase()));
      entries = entries.filter((e) => e.tags.some((t) => tagSet.has(t.toLowerCase())));
    }

    // Time window filter.
    if (filter.timeWindow && filter.timeWindow !== 'all') {
      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;
      const cutoff =
        filter.timeWindow === 'today' ? now - DAY : filter.timeWindow === '7d' ? now - 7 * DAY : now - 30 * DAY;
      entries = entries.filter((e) => e.storedAt >= cutoff);
    }

    // Search filter.
    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.summary.toLowerCase().includes(q) ||
          e.bodyPreview.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort.
    const sort = filter.sort ?? 'recent';
    if (sort === 'recent') {
      entries = [...entries].toSorted((a, b) => b.storedAt - a.storedAt);
    } else if (sort === 'most-referenced') {
      entries = [...entries].toSorted((a, b) => b.referencedBy - a.referencedBy);
    } else {
      entries = [...entries].toSorted((a, b) => b.promotionScore - a.promotionScore);
    }

    const total = entries.length;
    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 50;
    entries = entries.slice(offset, offset + limit);

    return { entries, total };
  }

  async getEntry(id: string): Promise<(MemoryEntry & { body: string }) | null> {
    await this.init();
    this.ensureRefs();
    const entry = this.index.byId.get(id);
    if (!entry) return null;

    // Read the full body from disk if not already in memory.
    let body = entry.body ?? '';
    if (!body) {
      try {
        const content = await fs.promises.readFile(entry.sourcePath, 'utf8');
        const blocks = parseMarkdownBlocks(content);
        // Find the block whose summary matches.
        const match = blocks.find(
          (b) =>
            typeof b.frontmatter['summary'] === 'string' &&
            (b.frontmatter['summary'] as string).slice(0, 80) === entry.summary.slice(0, 80)
        );
        if (match) body = match.body;
      } catch {
        body = entry.bodyPreview;
      }
    }

    return { ...entry, body };
  }

  async getProjects(): Promise<ProjectSummary[]> {
    await this.init();
    return this.index.projects;
  }

  async getTags(project?: string): Promise<TagCount[]> {
    await this.init();
    const entries = project ? this.index.all.filter((e) => e.project === project) : this.index.all;

    const counts = new Map<string, number>();
    for (const entry of entries) {
      for (const tag of entry.tags) {
        const lower = tag.toLowerCase();
        counts.set(lower, (counts.get(lower) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .toSorted((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  async getPromotionCandidates(threshold = 90): Promise<PromotionCandidates> {
    await this.init();
    this.ensureRefs();
    const now = Date.now();
    const candidates = this.index.all
      .filter((e) => e.promotionScore >= threshold)
      .map((e) => ({ id: e.id, score: e.promotionScore }))
      .toSorted((a, b) => b.score - a.score);
    return {
      candidates,
      threshold,
      lastRun: now,
      nextRun: now + 30 * 60 * 1000,
    };
  }

  async quickAdd(content: string, scope: 'project' | 'global', type = 'observation'): Promise<void> {
    const memDir =
      scope === 'global'
        ? path.join(os.homedir(), '.ijfw', 'memory')
        : path.join(this.index.projects[0]?.path ?? os.homedir(), '.ijfw', 'memory');
    await fs.promises.mkdir(memDir, { recursive: true });
    const journalPath = path.join(memDir, 'journal.md');
    const now = new Date().toISOString();
    const block = [
      '---',
      `type: ${sanitizeYamlScalar(type)}`,
      `summary: ${sanitizeYamlScalar(content)}`,
      `stored: ${now}`,
      `tags: []`,
      '---',
      content,
      '',
    ].join('\n');
    await fs.promises.appendFile(journalPath, block, 'utf8');
    this.scheduleReindex();
  }

  indexStats(): IndexStats {
    return {
      total: this.index.all.length,
      projects: this.index.projects.length,
      lastIndexedAt: Date.now(),
    };
  }

  dispose(): void {
    this.closeWatchers();
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

// ===== Utility helpers =====

/**
 * Strip newlines/CR from a value that will be embedded in a YAML scalar.
 * Prevents frontmatter injection via multi-line content.
 */
function sanitizeYamlScalar(s: string): string {
  return s.replace(/[\r\n]+/g, ' ').slice(0, 200);
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const arr = map.get(k);
    if (arr) arr.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function groupByTags(items: MemoryEntry[]): Map<string, MemoryEntry[]> {
  const map = new Map<string, MemoryEntry[]>();
  for (const item of items) {
    for (const tag of item.tags) {
      const lower = tag.toLowerCase();
      const arr = map.get(lower);
      if (arr) arr.push(item);
      else map.set(lower, [item]);
    }
  }
  return map;
}

function defaultWatcherFactory(
  filePath: string,
  opts: { persistent: boolean },
  callback: (event: string, filename: string | null) => void
): { close(): void } {
  return fs.watch(filePath, opts, callback);
}

// ===== Singleton =====

let instance: IjfwArchiveService | null = null;

export function getIjfwArchiveService(watcherFactory?: WatcherFactory): IjfwArchiveService {
  if (!instance) {
    instance = new IjfwArchiveService(watcherFactory);
  }
  return instance;
}

/** Replace singleton (for testing). */
export function setIjfwArchiveService(svc: IjfwArchiveService): void {
  if (instance) instance.dispose();
  instance = svc;
}

/** Reset singleton (for testing). */
export function resetIjfwArchiveService(): void {
  if (instance) {
    instance.dispose();
    instance = null;
  }
}

export { IjfwArchiveService };
export type { ChangeCallback, WatcherFactory };
