/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * LIVE WSL integration test for #258 — runs the REAL AcpDetector against a REAL
 * `wsl.exe` on a windows-latest CI runner that has a WSL distro installed plus a
 * CLI planted ONLY inside WSL (not on the Windows PATH).
 *
 * Gated by WSL_LIVE=1 (set only in .github/workflows/wsl-detect-live.yml). It is
 * INERT in the normal suite (dev machines / macOS+Linux CI have no WSL), so it
 * never runs or fails there.
 *
 * Unlike acpDetectorWsl.test.ts — which mocks the exec boundary to assert the
 * branch logic — this does NOT mock safeExec / child_process. It proves the real
 * `wsl.exe -e bash -lc 'command -v <cli>'` invocation and its stdout parsing
 * actually detect a CLI that exists only inside WSL. Only the electron-backed
 * imports are stubbed so the module can evaluate outside an Electron runtime.
 */

import { describe, it, expect, vi } from 'vitest';

// Stub ONLY the electron-backed module imports; exec boundaries run for real.
vi.mock('@process/utils/shellEnv', () => ({
  // Real Windows PATH so `where` behaves normally; env is passed to wsl.exe too.
  getEnhancedEnv: () => ({ ...process.env }),
}));
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: () => ({ getAcpAdapters: () => [] }) },
}));
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: async () => undefined },
}));

const LIVE = process.env.WSL_LIVE === '1';

// The CLI the workflow plants inside WSL (/usr/local/bin), absent on Windows.
const WSL_PLANTED_CLI = 'hermes';
const GUARANTEED_MISSING_CLI = 'definitelymissing999';

describe.skipIf(!LIVE)('AcpDetector WSL LIVE (#258, real wsl.exe)', () => {
  it('finds a CLI that exists only inside WSL, and not a missing one', async () => {
    vi.resetModules();
    const { acpDetector } = await import('@process/agent/acp/AcpDetector');

    const available = await acpDetector.batchCheckCliAvailability([WSL_PLANTED_CLI, GUARANTEED_MISSING_CLI]);

    // The whole point of #258: a WSL-only CLI is detected via the wsl.exe probe.
    expect(available.has(WSL_PLANTED_CLI)).toBe(true);
    // A CLI on neither Windows PATH nor WSL stays not-found (and no throw above).
    expect(available.has(GUARANTEED_MISSING_CLI)).toBe(false);
  });
});
