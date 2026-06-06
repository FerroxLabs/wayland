/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Wiki IPC bridge - wires wikiIndex + wikiSynthesizer to the renderer
 * via the ipcBridge.wiki namespace.
 *
 * All args are validated; errors return { ok: false, error } - never throw
 * across IPC.
 */

import log from 'electron-log';
import { z } from 'zod';
import { ipcBridge } from '@/common';
import { buildWikiState, getWikiState } from '@process/services/wiki/wikiIndex';
import { synthesize } from '@process/services/wiki/wikiSynthesizer';
import { runSynthesisSweep } from '@process/services/wiki/wikiAutoSync';
import { resolveWikilink } from '@process/services/wiki/wikilinkResolver';
import { getIjfwArchiveService } from '@process/services/memory/ijfwArchiveService';
import type { WikiState, WikiConcept, WikiTopicTag, WikiFreshness } from '@/common/types/memory';
import fs from 'node:fs';
import path from 'node:path';

// ===== Arg schemas =====

const listConceptsSchema = z.object({
  topicTag: z
    .enum(['Architecture', 'Design', 'Decisions', 'Process', 'Patterns', 'Brand'])
    .optional(),
  search: z.string().optional(),
  freshness: z.enum(['fresh', 'stale', 'never_reviewed']).optional(),
  sort: z.enum(['recent', 'most-referenced', 'alphabetical']).optional(),
});

const getConceptSchema = z.object({ slug: z.string().min(1).max(256) });

const synthesizeOrphanSchema = z.object({
  memoryIds: z.array(z.string().min(1).max(128)).min(1),
});

const reSynthesizeSchema = z.object({ slug: z.string().min(1).max(256) });

const resolveBacklinkSchema = z.object({ wikilinkText: z.string().min(1).max(512) });

// ===== Helper: most-recently-active project path =====

async function getCurrentProjectPath(): Promise<string> {
  const svc = getIjfwArchiveService();
  const projects = await svc.getProjects();
  if (projects.length > 0) {
    const sorted = [...projects].sort((a, b) => b.lastActive - a.lastActive);
    return sorted[0].path;
  }
  return process.cwd();
}

// ===== Helper: sanitize a concept name for use as a filename =====

function sanitizeConceptName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '_').slice(0, 200);
}

// ===== Helper: write WikiConcept to .ijfw/wiki/<name>.md =====

function writeConceptFile(projectPath: string, concept: WikiConcept): void {
  const wikiDir = path.join(projectPath, '.ijfw', 'wiki');
  if (!fs.existsSync(wikiDir)) {
    fs.mkdirSync(wikiDir, { recursive: true });
  }
  const safeName = sanitizeConceptName(concept.name);
  const filename = `${safeName}.md`;
  const filePath = path.join(wikiDir, filename);

  // Guard against path traversal
  const resolvedWikiDir = path.resolve(wikiDir);
  const resolvedFilePath = path.resolve(filePath);
  if (!resolvedFilePath.startsWith(resolvedWikiDir + path.sep) && resolvedFilePath !== resolvedWikiDir) {
    throw new Error(`Concept filename escapes wiki directory: ${concept.name}`);
  }

  const aliasesYaml =
    concept.aliases.length > 0
      ? `aliases: [${concept.aliases.map((a) => `"${a}"`).join(', ')}]`
      : 'aliases: []';

  const tagsYaml =
    concept.tags.length > 0
      ? `tags: [${concept.tags.map((t) => `"${t}"`).join(', ')}]`
      : 'tags: []';

  const lines = [
    '---',
    aliasesYaml,
    tagsYaml,
    `created: ${concept.lastSynthesizedAt}`,
    concept.lastReviewedAt != null ? `updated: ${concept.lastReviewedAt}` : undefined,
    'wayland_meta:',
    `  id: "${concept.id}"`,
    `  slug: "${concept.slug}"`,
    `  name: "${concept.name}"`,
    `  topic_tag: "${concept.topicTag}"`,
    `  freshness: "${concept.freshness}"`,
    `  tldr: "${concept.tldr.replace(/"/g, '\\"')}"`,
    `  source_memory_ids: [${concept.sourceMemoryIds.map((id) => `"${id}"`).join(', ')}]`,
    `  related_concepts: [${concept.relatedConcepts.map((s) => `"${s}"`).join(', ')}]`,
    '---',
    '',
    concept.body,
  ].filter((l): l is string => l != null);

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

// ===== Bridge init =====

export function initWikiBridge(): void {
  // ===== wiki.list-concepts =====

  ipcBridge.wiki.listConcepts.provider(async (args: unknown) => {
    const parsed = listConceptsSchema.safeParse(args ?? {});
    const filter = parsed.success ? parsed.data : {};

    try {
      const projectPath = await getCurrentProjectPath();
      const state = await getWikiState(projectPath);

      let concepts = state.concepts;

      if (filter.topicTag) {
        const tag = filter.topicTag as WikiTopicTag;
        concepts = concepts.filter((c) => c.topicTag === tag);
      }

      if (filter.freshness) {
        const freshness = filter.freshness as WikiFreshness;
        concepts = concepts.filter((c) => c.freshness === freshness);
      }

      if (filter.search) {
        const q = filter.search.toLowerCase();
        concepts = concepts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.tldr.toLowerCase().includes(q) ||
            c.tags.some((t) => t.toLowerCase().includes(q)),
        );
      }

      if (filter.sort === 'alphabetical') {
        concepts = [...concepts].sort((a, b) => a.name.localeCompare(b.name));
      } else if (filter.sort === 'most-referenced') {
        concepts = [...concepts].sort(
          (a, b) => b.linkedFromConcepts.length - a.linkedFromConcepts.length,
        );
      } else {
        // Default: recent
        concepts = [...concepts].sort((a, b) => b.lastSynthesizedAt - a.lastSynthesizedAt);
      }

      return { concepts, total: concepts.length };
    } catch (err) {
      log.error('[wiki] listConcepts failed', { err });
      return { concepts: [], total: 0 };
    }
  });

  // ===== wiki.get-concept =====

  ipcBridge.wiki.getConcept.provider(async (args: unknown) => {
    const parsed = getConceptSchema.safeParse(args);
    if (!parsed.success) return null;

    try {
      const projectPath = await getCurrentProjectPath();
      const state = await getWikiState(projectPath);
      return state.concepts.find((c) => c.slug === parsed.data.slug) ?? null;
    } catch (err) {
      log.error('[wiki] getConcept failed', { err });
      return null;
    }
  });

  // ===== wiki.synthesize-orphan =====

  ipcBridge.wiki.synthesizeOrphan.provider(async (args: unknown) => {
    const parsed = synthesizeOrphanSchema.safeParse(args);
    if (!parsed.success) return { ok: false, error: 'invalid memoryIds' };

    try {
      const svc = getIjfwArchiveService();
      const memoryIds = parsed.data.memoryIds;

      const entries = await Promise.all(memoryIds.map((id) => svc.getEntry(id)));
      const validEntries = entries.filter(Boolean) as NonNullable<(typeof entries)[0]>[];

      if (validEntries.length === 0) {
        return { ok: false, error: 'no valid memory entries found' };
      }

      const concept = await synthesize(validEntries);
      const projectPath = await getCurrentProjectPath();
      writeConceptFile(projectPath, concept);
      const newState = await buildWikiState(projectPath);
      ipcBridge.wiki.stateChanged.emit(newState);

      return { ok: true, slug: concept.slug };
    } catch (err) {
      log.error('[wiki] synthesizeOrphan failed', { err });
      return { ok: false, error: (err as Error).message };
    }
  });

  // ===== wiki.re-synthesize =====

  ipcBridge.wiki.reSynthesize.provider(async (args: unknown) => {
    const parsed = reSynthesizeSchema.safeParse(args);
    if (!parsed.success) return { ok: false, error: 'invalid slug' };

    try {
      const projectPath = await getCurrentProjectPath();
      const state = await getWikiState(projectPath);
      const existing = state.concepts.find((c) => c.slug === parsed.data.slug);
      if (!existing) return { ok: false, error: 'concept not found' };

      const svc = getIjfwArchiveService();
      const entries = await Promise.all(existing.sourceMemoryIds.map((id) => svc.getEntry(id)));
      const validEntries = entries.filter(Boolean) as NonNullable<(typeof entries)[0]>[];

      const concept = await synthesize(validEntries, { topicHint: existing.topicTag });
      // Preserve identity fields
      const updated: WikiConcept = {
        ...concept,
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        lastSynthesizedAt: Date.now(),
      };

      writeConceptFile(projectPath, updated);
      const newState = await buildWikiState(projectPath);
      ipcBridge.wiki.stateChanged.emit(newState);

      return { ok: true, lastSynthesizedAt: updated.lastSynthesizedAt };
    } catch (err) {
      log.error('[wiki] reSynthesize failed', { err });
      return { ok: false, error: (err as Error).message };
    }
  });

  // ===== wiki.resolve-backlink =====

  ipcBridge.wiki.resolveBacklink.provider(async (args: unknown) => {
    const parsed = resolveBacklinkSchema.safeParse(args);
    if (!parsed.success) return { slug: null, name: null };

    try {
      const projectPath = await getCurrentProjectPath();
      const state = await getWikiState(projectPath);
      return resolveWikilink(parsed.data.wikilinkText, state);
    } catch (err) {
      log.error('[wiki] resolveBacklink failed', { err });
      return { slug: null, name: null };
    }
  });

  // ===== wiki.get-backlink-graph =====

  ipcBridge.wiki.getBacklinkGraph.provider(async () => {
    try {
      const projectPath = await getCurrentProjectPath();
      const state = await getWikiState(projectPath);
      return state.backlinkGraph;
    } catch (err) {
      log.error('[wiki] getBacklinkGraph failed', { err });
      return {};
    }
  });

  // ===== wiki.get-state - full state for cold-load orphan population =====

  ipcBridge.wiki.getState.provider(async () => {
    try {
      const projectPath = await getCurrentProjectPath();
      return await getWikiState(projectPath);
    } catch (err) {
      log.error('[wiki] getState failed', { err });
      return {
        version: 1,
        concepts: [],
        backlinkGraph: {},
        orphanCandidates: [],
        lastUpdatedAt: Date.now(),
      };
    }
  });

  // ===== wiki.synthesize-now =====

  ipcBridge.wiki.synthesizeNow.provider(async () => {
    try {
      const newConcepts = await runSynthesisSweep();
      return { ok: true, newConcepts };
    } catch (err) {
      log.error('[wiki] synthesizeNow failed', { err });
      return { ok: false, newConcepts: 0, error: (err as Error).message };
    }
  });
}
