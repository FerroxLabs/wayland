/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Wiki index builder - scans <project>/.ijfw/wiki/*.md, parses YAML frontmatter,
 * builds the WikiState backlink graph + orphan candidates. Writes the result to
 * <project>/.ijfw/wiki-state/index.json (outside the wiki dir, Obsidian-safe).
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseMarkdownBlocks } from '@process/services/memory/markdownFrontmatter';
import { parseWikilinks, resolveWikilink } from './wikilinkResolver';
import type { WikiConcept, WikiState, WikiTopicTag, WikiFreshness } from '@/common/types/memory';

// ===== YAML frontmatter hand-parser =====

type FmValue = string | string[] | number | undefined;
type FmMap = Record<string, FmValue>;

function parseSimpleYaml(text: string): FmMap {
  const result: FmMap = {};
  const lines = text.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const raw = line.slice(colonIdx + 1).trim();
    if (!key) continue;

    // Array: [a, b, c]
    if (raw.startsWith('[') && raw.endsWith(']')) {
      const inner = raw.slice(1, -1);
      result[key] = inner
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter((s) => s.length > 0);
    } else if (!Number.isNaN(Number(raw)) && raw !== '') {
      result[key] = Number(raw);
    } else {
      result[key] = raw.replace(/^["']|["']$/g, '');
    }
  }
  return result;
}

// Parse the top-level single-concept YAML frontmatter from a wiki .md file.
// Wiki files use a single frontmatter block at the top of the file.
function parseSingleConceptFile(content: string): { fm: FmMap; body: string } | null {
  const normalised = content.replace(/\r\n/g, '\n');
  const start = normalised.indexOf('---\n');
  if (start === -1) return null;
  const end = normalised.indexOf('\n---', start + 4);
  if (end === -1) return null;
  const fmText = normalised.slice(start + 4, end);
  const body = normalised.slice(end + 4).trim();
  return { fm: parseSimpleYaml(fmText), body };
}

// ===== Slug helper =====

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ===== Topic tag coercion =====

const VALID_TOPIC_TAGS: WikiTopicTag[] = [
  'Architecture',
  'Design',
  'Decisions',
  'Process',
  'Patterns',
  'Brand',
];

function coerceTopicTag(raw: FmValue): WikiTopicTag {
  if (typeof raw === 'string') {
    const match = VALID_TOPIC_TAGS.find((t) => t.toLowerCase() === raw.toLowerCase());
    if (match) return match;
  }
  return 'Process';
}

// ===== Freshness coercion =====

function coerceFreshness(raw: FmValue): WikiFreshness {
  if (raw === 'fresh' || raw === 'stale' || raw === 'never_reviewed') return raw;
  return 'never_reviewed';
}

// ===== Orphan detection from memory entries =====

type MemoryBlock = {
  id: string;
  body: string;
};

// Extract IJFW memory entry IDs + bodies from a project's .ijfw/memory/*.md files.
function loadMemoryBlocks(projectPath: string): MemoryBlock[] {
  const memDir = path.join(projectPath, '.ijfw', 'memory');
  if (!fs.existsSync(memDir)) return [];

  const results: MemoryBlock[] = [];
  let files: string[] = [];
  try {
    files = fs.readdirSync(memDir).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }

  for (const file of files) {
    const filePath = path.join(memDir, file);
    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    const blocks = parseMarkdownBlocks(content);
    for (const block of blocks) {
      const id = String(block.frontmatter['id'] ?? `${file}:${results.length}`);
      results.push({ id, body: block.body });
    }
  }
  return results;
}

// Identify proper-noun-like phrases mentioned >= 3x across distinct memories
// that do not yet have a corresponding WikiConcept.
function detectOrphans(
  memoryBlocks: MemoryBlock[],
  concepts: WikiConcept[],
): WikiState['orphanCandidates'] {
  // Simple heuristic: extract Title Case sequences of 2-4 words
  const PROPER_NOUN_RE = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
  const existingNames = new Set(concepts.map((c) => c.name.toLowerCase()));
  const existingSlugs = new Set(concepts.map((c) => c.slug));

  const mentionMap = new Map<string, Set<string>>(); // phrase → memory IDs

  for (const block of memoryBlocks) {
    const text = block.body;
    const re = new RegExp(PROPER_NOUN_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const phrase = m[1];
      const lower = phrase.toLowerCase();
      // Skip if already a concept or slug
      if (existingNames.has(lower)) continue;
      if (existingSlugs.has(toSlug(phrase))) continue;
      if (!mentionMap.has(phrase)) mentionMap.set(phrase, new Set());
      mentionMap.get(phrase)!.add(block.id);
    }
  }

  const candidates: WikiState['orphanCandidates'] = [];
  for (const [phrase, ids] of mentionMap.entries()) {
    if (ids.size >= 3) {
      candidates.push({
        memoryIds: Array.from(ids),
        citationCount: ids.size,
        suggestedName: phrase,
      });
    }
  }

  // Sort by citation count desc
  candidates.sort((a, b) => b.citationCount - a.citationCount);
  return candidates;
}

// ===== Core build function =====

export async function buildWikiState(projectPath: string): Promise<WikiState> {
  const wikiDir = path.join(projectPath, '.ijfw', 'wiki');
  const stateDir = path.join(projectPath, '.ijfw', 'wiki-state');

  if (!fs.existsSync(wikiDir)) {
    // Still run orphan detection even when there are no wiki pages yet
    const memoryBlocks = loadMemoryBlocks(projectPath);
    const orphanCandidates = detectOrphans(memoryBlocks, []);
    const empty: WikiState = {
      version: 1,
      concepts: [],
      backlinkGraph: {},
      orphanCandidates,
      lastUpdatedAt: Date.now(),
    };
    return empty;
  }

  let files: string[] = [];
  try {
    files = fs.readdirSync(wikiDir).filter((f) => f.endsWith('.md'));
  } catch {
    // directory unreadable
  }

  const concepts: WikiConcept[] = [];

  for (const file of files) {
    const filePath = path.join(wikiDir, file);
    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const parsed = parseSingleConceptFile(content);
    if (!parsed) continue;
    const { fm, body } = parsed;

    const name = typeof fm['name'] === 'string' ? fm['name'] : path.basename(file, '.md');
    const slug = typeof fm['slug'] === 'string' ? fm['slug'] : toSlug(name);
    const id = typeof fm['id'] === 'string' ? fm['id'] : slug;

    // aliases come from top-level frontmatter aliases: array
    const rawAliases = fm['aliases'];
    const aliases: string[] = Array.isArray(rawAliases) ? rawAliases.map(String) : [];

    // wayland_meta nested block is hand-ignored at this level
    const rawSourceIds = fm['source_memory_ids'];
    const sourceMemoryIds: string[] = Array.isArray(rawSourceIds)
      ? rawSourceIds.map(String)
      : [];

    const rawLinked = fm['linked_from_concepts'];
    const linkedFromConcepts: string[] = Array.isArray(rawLinked) ? rawLinked.map(String) : [];

    const rawRelated = fm['related_concepts'];
    const relatedConcepts: string[] = Array.isArray(rawRelated) ? rawRelated.map(String) : [];

    const rawTags = fm['tags'];
    const tags: string[] = Array.isArray(rawTags) ? rawTags.map(String) : [];

    const rawCreated = fm['created'];
    const lastSynthesizedAt =
      typeof rawCreated === 'number'
        ? rawCreated
        : typeof rawCreated === 'string'
          ? new Date(rawCreated).getTime() || Date.now()
          : Date.now();

    const rawUpdated = fm['updated'];
    const lastReviewedAt =
      typeof rawUpdated === 'number'
        ? rawUpdated
        : typeof rawUpdated === 'string' && rawUpdated
          ? new Date(rawUpdated).getTime() || undefined
          : undefined;

    concepts.push({
      id,
      name,
      slug,
      topicTag: coerceTopicTag(fm['topic_tag'] ?? fm['topicTag']),
      tldr: typeof fm['tldr'] === 'string' ? fm['tldr'] : '',
      body,
      aliases,
      sourceMemoryIds,
      linkedFromConcepts,
      relatedConcepts,
      tags,
      lastSynthesizedAt,
      lastReviewedAt,
      freshness: coerceFreshness(fm['freshness']),
    });
  }

  // Build backlink graph: slug → list of slugs that link TO it
  const backlinkGraph: Record<string, string[]> = {};
  const partialState: WikiState = {
    version: 1,
    concepts,
    backlinkGraph,
    orphanCandidates: [],
    lastUpdatedAt: Date.now(),
  };

  for (const concept of concepts) {
    const links = parseWikilinks(concept.body);
    for (const link of links) {
      const resolved = resolveWikilink(link.name, partialState);
      if (resolved.slug) {
        if (!backlinkGraph[resolved.slug]) {
          backlinkGraph[resolved.slug] = [];
        }
        if (!backlinkGraph[resolved.slug].includes(concept.slug)) {
          backlinkGraph[resolved.slug].push(concept.slug);
        }
      }
    }
  }

  // Also update linkedFromConcepts on each concept from the graph
  for (const concept of concepts) {
    const inbound = backlinkGraph[concept.slug] ?? [];
    concept.linkedFromConcepts = inbound;
  }

  // Detect orphans from memory entries
  const memoryBlocks = loadMemoryBlocks(projectPath);
  const orphanCandidates = detectOrphans(memoryBlocks, concepts);

  const state: WikiState = {
    version: 1,
    concepts,
    backlinkGraph,
    orphanCandidates,
    lastUpdatedAt: Date.now(),
  };

  // Write sidecar index outside wiki dir
  try {
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    fs.writeFileSync(path.join(stateDir, 'index.json'), JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Non-fatal - if we can't persist, we still return the state in memory
  }

  return state;
}

/**
 * Read the cached wiki-state/index.json and fall back to building if absent.
 */
export async function getWikiState(projectPath: string): Promise<WikiState> {
  const indexPath = path.join(projectPath, '.ijfw', 'wiki-state', 'index.json');
  if (fs.existsSync(indexPath)) {
    try {
      const raw = fs.readFileSync(indexPath, 'utf8');
      return JSON.parse(raw) as WikiState;
    } catch {
      // Fall through to rebuild
    }
  }
  return buildWikiState(projectPath);
}
