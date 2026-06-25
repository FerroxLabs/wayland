/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * GitHub #256 - LIVE integration proof.
 *
 * Unlike tests/unit/process/services/globalMemoryBlock.test.ts (which drives a
 * FAKE IjfwArchiveService), this test exercises the REAL code path end to end:
 * the REAL `getIjfwArchiveService()` reads the user's REAL global memory store
 * (`~/.ijfw/memory/*.md`), builds its index from disk, and `loadGlobalMemoryBlock`
 * filters + composes the injected block from that real index.
 *
 * It is gated: it only runs when a sentinel fixture file has been dropped into
 * the real global store (the live-verification harness creates and deletes it).
 * Without the fixture the test self-skips so it never fails on other machines.
 *
 * Only electron-backed imports are mocked so the module loads under node vitest;
 * the archive service itself is NOT mocked.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// electron-log is pulled in transitively by ijfwArchiveService; stub it so the
// real service module loads outside an Electron runtime.
vi.mock('electron-log', () => ({
  default: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, verbose: () => {} },
}));

// Deterministic, init-free label so the block heading is assertable without i18n.
vi.mock('@process/services/i18n', () => ({
  default: { t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key },
}));

import { loadGlobalMemoryBlock } from '@process/services/projectKnowledge/knowledge';
import { resetIjfwArchiveService } from '@process/services/memory/ijfwArchiveService';

const SENTINEL_FILE = path.join(os.homedir(), '.ijfw', 'memory', '__livetest-hyperframes-zx7q.md');

describe('loadGlobalMemoryBlock - REAL store, REAL service (#256)', () => {
  it.runIf(fs.existsSync(SENTINEL_FILE))(
    'injects a file really present in ~/.ijfw/memory into the assembled block',
    async () => {
      // Force a fresh real service so it indexes the real dir, including the
      // sentinel fixture just dropped on disk.
      resetIjfwArchiveService();

      const block = await loadGlobalMemoryBlock();

      // The real dropped file's content must be present in the real block.
      expect(block).toContain('ZX7Q');
      expect(block).toContain('HyperFrames');
      expect(block).toContain('HF-9001');
      // Attributed heading + the entry summary, proving it came through the
      // global-store filter and was composed (not just read raw).
      expect(block).toContain('User memory (from Wayland Memory)');
      expect(block).toContain('HyperFrames product spec');

      resetIjfwArchiveService();
    }
  );
});
