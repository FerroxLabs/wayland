/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Promotion sweep - periodically checks all entries against the configured
 * threshold and auto-promotes qualifying entries (if autoPromoteEnabled).
 *
 * Settings persist to ~/.config/wayland-dev/memory-archive-settings.json.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import log from 'electron-log';
import { promoteEntry, isEntryPromoted } from './wikiWriter';
import { scheduleSynthesisSweep } from '@process/services/wiki/wikiAutoSync';
import type { IjfwArchiveService } from './ijfwArchiveService';
import type { MemoryEntry } from '@/common/types/memory';

// ===== Public types =====

export type LastDreamSummary = {
  /** Entries promoted during the most recent sweep run. */
  promoted: number;
  /**
   * Entries observed in the index during the most recent sweep.
   * Stubbed to 0 - requires archive.getStats() call that would add latency.
   * TODO(v0.6.5): wire by calling archive.getStats().total - previousTotal.
   */
  factsExtracted: number;
  /** Milliseconds since the last sweep ran. */
  agoMs: number;
};

export type PromotionCandidatesState = {
  candidates: Array<{ id: string; score: number; summary: string; project: string }>;
  threshold: number;
  lastRunAt: number;
  nextRunAt: number;
  autoPromoteEnabled: boolean;
  /** Summary of the most recent sweep run (undefined before first sweep). */
  lastDream?: LastDreamSummary;
};

type SweepSettings = {
  threshold: number;
  autoPromoteEnabled: boolean;
};

export type SweepHandle = {
  stop: () => void;
  getCandidates: () => PromotionCandidatesState;
  setThreshold: (n: number) => void;
  setAutoPromoteEnabled: (b: boolean) => void;
  forceRun: () => Promise<void>;
};

// ===== Settings persistence =====

function settingsPath(): string {
  return path.join(os.homedir(), '.config', 'wayland-dev', 'memory-archive-settings.json');
}

function loadSettings(): SweepSettings {
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<SweepSettings>;
    return {
      threshold: typeof parsed.threshold === 'number' ? parsed.threshold : 90,
      autoPromoteEnabled:
        typeof parsed.autoPromoteEnabled === 'boolean' ? parsed.autoPromoteEnabled : true,
    };
  } catch {
    return { threshold: 90, autoPromoteEnabled: true };
  }
}

function saveSettings(settings: SweepSettings): void {
  const p = settingsPath();
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(settings, null, 2), 'utf8');
  } catch (err) {
    log.warn('[promotion-sweep] could not save settings', { err });
  }
}

// ===== Sweep factory =====

const ENTRY_MIN_AGE_MS = 10 * 60 * 1000; // 10 minutes

type CandidateRecord = {
  id: string;
  score: number;
  summary: string;
  project: string;
  storedAt: number;
  entry: MemoryEntry;
};

export function startPromotionSweep(opts: {
  archive: IjfwArchiveService;
  intervalMs?: number;
  autoPromoteEnabled?: boolean;
  initialThreshold?: number;
}): SweepHandle {
  const intervalMs = opts.intervalMs ?? 30 * 60 * 1000;

  // Load persisted settings; opts override only if explicitly provided.
  const persisted = loadSettings();
  let threshold = opts.initialThreshold ?? persisted.threshold;
  let autoPromoteEnabled = opts.autoPromoteEnabled ?? persisted.autoPromoteEnabled;

  let state: PromotionCandidatesState = {
    candidates: [],
    threshold,
    lastRunAt: 0,
    nextRunAt: Date.now() + intervalMs,
    autoPromoteEnabled,
  };

  // factsExtracted delta tracking.
  // First-sweep policy: report 0 to avoid showing a large number on cold boot
  // (the entire index would otherwise appear as "facts extracted this sweep").
  // Subsequent sweeps report the net new entries since the prior run.
  let previousTotalEntries: number | null = null;

  async function runSweep(): Promise<void> {
    const now = Date.now();
    log.debug('[promotion-sweep] running sweep', { threshold, autoPromoteEnabled });

    let candidateRecords: CandidateRecord[];
    try {
      const result = await opts.archive.listEntries({
        sort: 'highest-score',
        limit: 500,
      });
      candidateRecords = result.entries
        .filter((e) => e.promotionScore >= threshold)
        .map((e) => ({
          id: e.id,
          score: e.promotionScore,
          summary: e.summary,
          project: e.project,
          storedAt: e.storedAt,
          entry: e,
        }));
    } catch (err) {
      log.error('[promotion-sweep] listEntries failed', { err });
      return;
    }

    // Filter already-promoted entries.
    const unpromoted: CandidateRecord[] = [];
    for (const candidate of candidateRecords) {
      const alreadyDone = await isEntryPromoted(candidate.entry).catch(() => false);
      if (!alreadyDone) unpromoted.push(candidate);
    }

    let promotedCount = 0;
    if (autoPromoteEnabled) {
      // Auto-promote entries older than 10 minutes.
      for (const candidate of unpromoted) {
        const ageMs = now - candidate.storedAt;
        if (ageMs < ENTRY_MIN_AGE_MS) continue;
        try {
          const result = await promoteEntry(candidate.entry);
          if (result.ok) {
            promotedCount++;
            log.info('[promotion-sweep] auto-promoted entry', {
              id: candidate.id,
              wikiPath: result.wikiPath,
            });
          }
        } catch (err) {
          log.warn('[promotion-sweep] promote failed for entry', { id: candidate.id, err });
        }
      }
    }

    // Compute factsExtracted: net new entries since the last sweep.
    // First sweep always reports 0 (cold-boot policy - avoids surfacing the
    // entire index as "extracted this sweep" when the user first opens the app).
    let factsExtracted = 0;
    try {
      const stats = await opts.archive.getStats();
      const currentTotal = stats.total;
      if (previousTotalEntries !== null) {
        factsExtracted = Math.max(0, currentTotal - previousTotalEntries);
      }
      previousTotalEntries = currentTotal;
    } catch (err) {
      log.warn('[promotion-sweep] getStats for factsExtracted failed', { err });
      // Leave factsExtracted = 0 and don't update previousTotalEntries
    }

    // If new memories landed, schedule a wiki synthesis sweep (debounced 60s).
    if (factsExtracted > 0) {
      scheduleSynthesisSweep();
    }

    // Update state with sweep results + lastDream summary.
    const lastDream: LastDreamSummary = {
      promoted: promotedCount,
      factsExtracted,
      agoMs: Date.now() - now,
    };

    state = {
      candidates: unpromoted.map(({ id, score, summary, project }) => ({
        id,
        score,
        summary,
        project,
      })),
      threshold,
      lastRunAt: now,
      nextRunAt: now + intervalMs,
      autoPromoteEnabled,
      lastDream,
    };
  }

  // Run first sweep lazily after a short delay to let the archive settle.
  const initialDelay = setTimeout(() => {
    void runSweep();
  }, 5000);

  const timer = setInterval(() => {
    void runSweep();
  }, intervalMs);

  return {
    stop(): void {
      clearTimeout(initialDelay);
      clearInterval(timer);
    },

    getCandidates(): PromotionCandidatesState {
      return state;
    },

    setThreshold(n: number): void {
      threshold = n;
      state = { ...state, threshold };
      saveSettings({ threshold, autoPromoteEnabled });
    },

    setAutoPromoteEnabled(b: boolean): void {
      autoPromoteEnabled = b;
      state = { ...state, autoPromoteEnabled };
      saveSettings({ threshold, autoPromoteEnabled });
    },

    async forceRun(): Promise<void> {
      await runSweep();
    },
  };
}
