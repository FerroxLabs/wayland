/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Memory Archive IPC bridge - wires the ijfwArchiveService to the renderer
 * via the shared ipcBridge.memory namespace.
 *
 * All args are validated; errors return { ok: false, error } - never throw
 * across IPC.
 */

import log from 'electron-log';
import { z } from 'zod';
import { ipcBridge } from '@/common';
import { getIjfwArchiveService } from '@process/services/memory/ijfwArchiveService';
import { promoteEntry, undoPromotion } from '@process/services/memory/wikiWriter';
import { startPromotionSweep } from '@process/services/memory/promotionSweep';
import { readSourceContext } from '@process/services/memory/sourceReader';
import type { ListFilter } from '@/common/types/memory';
import type { SweepHandle } from '@process/services/memory/promotionSweep';

// ===== Arg schemas =====

const listFilterSchema = z.object({
  project: z.string().optional(),
  types: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  timeWindow: z.enum(['all', 'today', '7d', '30d']).optional(),
  search: z.string().optional(),
  sort: z.enum(['recent', 'most-referenced', 'highest-score']).optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

const idSchema = z.object({ id: z.string().min(1).max(64) });

const tagsQuerySchema = z.object({ project: z.string().optional() });

const promoteSchema = z.object({ id: z.string().min(1).max(64) });

const quickAddSchema = z.object({
  content: z.string().min(1).max(10_000),
  scope: z.enum(['project', 'global']),
  type: z.string().optional(),
});

const thresholdSchema = z.object({ threshold: z.number().int().min(0).max(100) });

const autoPromoteSchema = z.object({ enabled: z.boolean() });

const undoSchema = z.object({ id: z.string().min(1).max(64) });

const updateEntrySchema = z.object({
  id: z.string().min(1).max(64),
  summary: z.string().min(1).max(500).optional(),
  type: z.string().min(1).max(40).optional(),
  tags: z.array(z.string().max(80)).max(50).optional(),
  body: z.string().max(100_000).optional(),
});

const deleteEntrySchema = z.object({ id: z.string().min(1).max(64) });

const readSourceContextSchema = z.object({
  path: z.string().min(1),
  line: z.number().int().min(0),
  contextLines: z.number().int().min(1).max(500).optional(),
});

// ===== Module-level sweep handle =====

let sweepHandle: SweepHandle | null = null;

/** Exposed for bridge/index.ts to call after initMemoryArchiveBridge(). */
export function initPromotionSweep(): void {
  if (sweepHandle) return;
  const svc = getIjfwArchiveService();
  sweepHandle = startPromotionSweep({ archive: svc });
}

// ===== Bridge init =====

export function initMemoryArchiveBridge(): void {
  const svc = getIjfwArchiveService();

  // Kick off the initial index in the background - don't block bridge init.
  void svc.init().catch((err) => {
    log.warn('[memory-archive] background init failed', { err });
  });

  // ===== Queries =====

  ipcBridge.memory.getStats.provider(async () => {
    try {
      const stats = await svc.getStats();
      return { ok: true as const, stats };
    } catch (err) {
      log.error('[memory-archive] getStats failed', { err });
      return { ok: false as const, error: (err as Error).message };
    }
  });

  ipcBridge.memory.listEntries.provider(async (rawFilter: unknown) => {
    const parsed = listFilterSchema.safeParse(rawFilter ?? {});
    if (!parsed.success) {
      return { entries: [], total: 0 };
    }
    try {
      return await svc.listEntries(parsed.data as ListFilter);
    } catch (err) {
      log.error('[memory-archive] listEntries failed', { err });
      return { entries: [], total: 0 };
    }
  });

  ipcBridge.memory.getEntry.provider(async (args: unknown) => {
    const parsed = idSchema.safeParse(args);
    if (!parsed.success) return null;
    try {
      return await svc.getEntry(parsed.data.id);
    } catch (err) {
      log.error('[memory-archive] getEntry failed', { err });
      return null;
    }
  });

  ipcBridge.memory.getProjects.provider(async () => {
    try {
      return await svc.getProjects();
    } catch (err) {
      log.error('[memory-archive] getProjects failed', { err });
      return [];
    }
  });

  ipcBridge.memory.getTags.provider(async (args: unknown) => {
    const parsed = tagsQuerySchema.safeParse(args ?? {});
    if (!parsed.success) return [];
    try {
      return await svc.getTags(parsed.data.project);
    } catch (err) {
      log.error('[memory-archive] getTags failed', { err });
      return [];
    }
  });

  ipcBridge.memory.getPromotionCandidates.provider(async () => {
    try {
      if (sweepHandle) {
        const state = sweepHandle.getCandidates();
        return {
          candidates: state.candidates,
          threshold: state.threshold,
          lastRun: state.lastRunAt,
          nextRun: state.nextRunAt,
          lastRunAt: state.lastRunAt,
          nextRunAt: state.nextRunAt,
          autoPromoteEnabled: state.autoPromoteEnabled,
          lastDream: state.lastDream,
        };
      }
      // Fallback before sweep starts.
      return await svc.getPromotionCandidates();
    } catch (err) {
      log.error('[memory-archive] getPromotionCandidates failed', { err });
      return { candidates: [], threshold: 90, lastRun: 0, nextRun: 0 };
    }
  });

  // ===== Mutations =====

  ipcBridge.memory.promote.provider(async (args) => {
    const parsed = promoteSchema.safeParse(args);
    if (!parsed.success) return { ok: false, error: 'invalid id' };
    try {
      const entry = await svc.getEntry(parsed.data.id);
      if (!entry) return { ok: false, error: 'entry not found' };
      return await promoteEntry(entry);
    } catch (err) {
      log.error('[memory-archive] promote failed', { err });
      return { ok: false, error: (err as Error).message };
    }
  });

  ipcBridge.memory.setQuickAdd.provider(async (args) => {
    const parsed = quickAddSchema.safeParse(args);
    if (!parsed.success) return { ok: false, error: parsed.error.message };
    try {
      await svc.quickAdd(parsed.data.content, parsed.data.scope, parsed.data.type);
      return { ok: true };
    } catch (err) {
      log.error('[memory-archive] setQuickAdd failed', { err });
      return { ok: false, error: (err as Error).message };
    }
  });

  ipcBridge.memory.setPromotionThreshold.provider(async (args) => {
    const parsed = thresholdSchema.safeParse(args);
    if (!parsed.success) return;
    if (sweepHandle) {
      sweepHandle.setThreshold(parsed.data.threshold);
    }
    log.info('[memory-archive] setPromotionThreshold', { threshold: parsed.data.threshold });
  });

  ipcBridge.memory.setAutoPromoteEnabled.provider(async (args) => {
    const parsed = autoPromoteSchema.safeParse(args);
    if (!parsed.success) return;
    if (sweepHandle) {
      sweepHandle.setAutoPromoteEnabled(parsed.data.enabled);
    }
    log.info('[memory-archive] setAutoPromoteEnabled', { enabled: parsed.data.enabled });
  });

  ipcBridge.memory.undoPromotion.provider(async (args) => {
    const parsed = undoSchema.safeParse(args);
    if (!parsed.success) return { ok: false, error: 'invalid id' };
    try {
      return await undoPromotion(parsed.data.id);
    } catch (err) {
      log.error('[memory-archive] undoPromotion failed', { err });
      return { ok: false, error: (err as Error).message };
    }
  });

  ipcBridge.memory.updateEntry.provider(async (args) => {
    const parsed = updateEntrySchema.safeParse(args);
    if (!parsed.success) return { ok: false, error: 'invalid args' };
    const { id, ...patch } = parsed.data;
    // Require at least one field to change.
    if (
      patch.summary === undefined &&
      patch.type === undefined &&
      patch.tags === undefined &&
      patch.body === undefined
    ) {
      return { ok: false, error: 'no_changes' };
    }
    try {
      return await svc.editEntry(id, patch);
    } catch (err) {
      log.error('[memory-archive] updateEntry failed', { err });
      return { ok: false, error: (err as Error).message };
    }
  });

  ipcBridge.memory.deleteEntry.provider(async (args) => {
    const parsed = deleteEntrySchema.safeParse(args);
    if (!parsed.success) return { ok: false, error: 'invalid id' };
    try {
      return await svc.deleteEntry(parsed.data.id);
    } catch (err) {
      log.error('[memory-archive] deleteEntry failed', { err });
      return { ok: false, error: (err as Error).message };
    }
  });

  ipcBridge.memory.forceSweep.provider(async () => {
    if (sweepHandle) {
      await sweepHandle.forceRun();
    }
  });

  ipcBridge.memory.readSourceContext.provider(async (args: unknown) => {
    const parsed = readSourceContextSchema.safeParse(args);
    if (!parsed.success) return { ok: false as const, error: 'invalid args' };
    try {
      return await readSourceContext(parsed.data as { path: string; line: number; contextLines?: number });
    } catch (err) {
      log.error('[memory-archive] readSourceContext failed', { err });
      return { ok: false as const, error: (err as Error).message };
    }
  });

  // ===== Emitters =====

  svc.onIndexChange((stats) => {
    ipcBridge.memory.onIndexChanged.emit(stats);
  });
}
