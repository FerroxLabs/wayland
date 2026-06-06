/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Wiki auto-sync - periodically synthesizes new concepts from unseen memory
 * entries and emits wiki.state-changed so the renderer updates live.
 */

import fs from 'node:fs';
import path from 'node:path';
import log from 'electron-log';
import { ipcBridge } from '@/common';
import { getIjfwArchiveService } from '@process/services/memory/ijfwArchiveService';
import { buildWikiState } from './wikiIndex';
import { synthesizeMany } from './wikiSynthesizer';
import type { WikiState } from '@/common/types/memory';

// ===== Helpers =====

function sanitizeConceptName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '_').slice(0, 200);
}

function writeConceptFile(projectPath: string, concept: import('@/common/types/memory').WikiConcept): void {
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
  if (
    !resolvedFilePath.startsWith(resolvedWikiDir + path.sep) &&
    resolvedFilePath !== resolvedWikiDir
  ) {
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

// ===== Core sweep logic =====

/** Persist lastSyncAt into the sidecar wiki-state/index.json. */
function persistLastSyncAt(projectPath: string, state: WikiState, lastSyncAt: number): WikiState {
  const updated: WikiState = { ...state, lastSyncAt };
  const stateDir = path.join(projectPath, '.ijfw', 'wiki-state');
  try {
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(stateDir, 'index.json'),
      JSON.stringify(updated, null, 2),
      'utf8',
    );
  } catch (err) {
    log.warn('[wiki-auto-sync] could not persist lastSyncAt', { err });
  }
  return updated;
}

/**
 * Run one full synthesis pass:
 * 1. Load all memory entries from the current project.
 * 2. Load existing WikiState.
 * 3. Call synthesizeMany() for entries not yet covered.
 * 4. Write new concept .md files.
 * 5. Rebuild WikiState and emit wiki.state-changed.
 *
 * Returns number of newly synthesized concepts.
 */
export async function runSynthesisSweep(): Promise<number> {
  const svc = getIjfwArchiveService();

  let projectPath: string;
  try {
    const projects = await svc.getProjects();
    if (projects.length > 0) {
      const sorted = [...projects].sort((a, b) => b.lastActive - a.lastActive);
      projectPath = sorted[0].path;
    } else {
      projectPath = process.cwd();
    }
  } catch (err) {
    log.warn('[wiki-auto-sync] could not resolve project path', { err });
    return 0;
  }

  let allEntries: import('@/common/types/memory').MemoryEntry[];
  try {
    const result = await svc.listEntries({ limit: 500 });
    allEntries = result.entries;
  } catch (err) {
    log.warn('[wiki-auto-sync] listEntries failed', { err });
    return 0;
  }

  let existingState: WikiState;
  try {
    existingState = await buildWikiState(projectPath);
  } catch (err) {
    log.warn('[wiki-auto-sync] buildWikiState failed', { err });
    existingState = {
      version: 1,
      concepts: [],
      backlinkGraph: {},
      orphanCandidates: [],
      lastUpdatedAt: Date.now(),
    };
  }

  const existingSourceIds = new Set(
    existingState.concepts.flatMap((c) => c.sourceMemoryIds),
  );

  let newConcepts: import('@/common/types/memory').WikiConcept[];
  try {
    newConcepts = await synthesizeMany(allEntries, existingSourceIds);
  } catch (err) {
    log.error('[wiki-auto-sync] synthesizeMany failed', { err });
    return 0;
  }

  if (newConcepts.length === 0) {
    // Still update lastSyncAt so the status bar reflects the sweep ran
    const updatedState = persistLastSyncAt(projectPath, existingState, Date.now());
    ipcBridge.wiki.stateChanged.emit(updatedState);
    return 0;
  }

  for (const concept of newConcepts) {
    try {
      writeConceptFile(projectPath, concept);
      log.info('[wiki-auto-sync] synthesized concept', { name: concept.name, sources: concept.sourceMemoryIds.length });
    } catch (err) {
      log.warn('[wiki-auto-sync] writeConceptFile failed', { name: concept.name, err });
    }
  }

  let finalState: WikiState;
  try {
    finalState = await buildWikiState(projectPath);
  } catch (err) {
    log.warn('[wiki-auto-sync] post-write buildWikiState failed', { err });
    finalState = existingState;
  }

  const updatedState = persistLastSyncAt(projectPath, finalState, Date.now());
  ipcBridge.wiki.stateChanged.emit(updatedState);

  return newConcepts.length;
}

// ===== Debounced trigger =====

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 60_000; // 60 seconds

/**
 * Schedule a synthesis sweep, debounced by 60s.
 * Used by the promotion sweep to avoid rapid-fire sweeps when many entries land.
 */
export function scheduleSynthesisSweep(): void {
  if (debounceTimer !== null) return;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runSynthesisSweep().catch((err) => {
      log.error('[wiki-auto-sync] debounced sweep failed', { err });
    });
  }, DEBOUNCE_MS);
}

// ===== Auto-sync scheduler =====

export type AutoSyncHandle = { stop: () => void };

/**
 * Start the wiki auto-sync timer. Calls runSynthesisSweep() every intervalMs.
 * Returns a handle with stop() to cancel.
 */
export function startWikiAutoSync(intervalMs = 30 * 60 * 1000): AutoSyncHandle {
  const timer = setInterval(() => {
    void runSynthesisSweep().catch((err) => {
      log.error('[wiki-auto-sync] scheduled sweep failed', { err });
    });
  }, intervalMs);

  log.info('[wiki-auto-sync] started', { intervalMs });

  return {
    stop(): void {
      clearInterval(timer);
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      log.info('[wiki-auto-sync] stopped');
    },
  };
}
