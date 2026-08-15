/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for the custom-agent dedup in AcpDetector.detectCustomAgents().
 *
 * Wayland Nano graduated to a built-in backend (ACP_BACKENDS_ALL.wnano), so
 * legacy `acp.customAgents` rows pointing at the `wayland-nano` CLI must be
 * skipped - otherwise existing profiles list the same agent twice.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks - declared before importing the module under test
// ---------------------------------------------------------------------------

const processConfigGetMock = vi.fn();

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { get: (...args: unknown[]) => processConfigGetMock(...args) },
}));

// Imported at module load but unused by detectCustomAgents - stub them so the
// module evaluates.
vi.mock('@process/extensions', () => ({
  ExtensionRegistry: { getInstance: () => ({ getAcpAdapters: () => [] }) },
}));
vi.mock('@process/utils/safeExec', () => ({
  safeExec: vi.fn(),
  safeExecFile: vi.fn(),
}));
vi.mock('@process/utils/shellEnv', () => ({
  getEnhancedEnv: () => ({}),
}));
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

async function freshDetector() {
  vi.resetModules();
  const mod = await import('@process/agent/acp/AcpDetector');
  return mod.acpDetector;
}

describe('AcpDetector.detectCustomAgents - wayland-nano dedup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips custom rows whose command is the built-in wayland-nano CLI', async () => {
    processConfigGetMock.mockResolvedValue([
      { id: 'nano-legacy', name: 'Wayland Nano', enabled: true, defaultCliPath: 'wayland-nano' },
      { id: 'other', name: 'Other Agent', enabled: true, defaultCliPath: 'other-cli --acp' },
    ]);

    const detector = await freshDetector();
    const agents = await detector.detectCustomAgents();

    expect(agents).toHaveLength(1);
    expect(agents[0]).toMatchObject({ id: 'custom:other', backend: 'custom', cliPath: 'other-cli --acp' });
  });

  it('skips wayland-nano rows even when the path carries inline args', async () => {
    processConfigGetMock.mockResolvedValue([
      { id: 'nano-args', name: 'Nano', enabled: true, defaultCliPath: 'wayland-nano --verbose' },
    ]);

    const detector = await freshDetector();
    expect(await detector.detectCustomAgents()).toEqual([]);
  });

  it('keeps preset rows excluded and disabled rows excluded alongside the dedup', async () => {
    processConfigGetMock.mockResolvedValue([
      { id: 'preset', name: 'Preset', enabled: true, isPreset: true, defaultCliPath: 'preset-cli' },
      { id: 'disabled', name: 'Disabled', enabled: false, defaultCliPath: 'disabled-cli' },
      { id: 'kept', name: 'Kept', enabled: true, defaultCliPath: 'kept-cli' },
    ]);

    const detector = await freshDetector();
    const agents = await detector.detectCustomAgents();

    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe('custom:kept');
  });

  it('returns an empty list when no custom agents are configured', async () => {
    processConfigGetMock.mockResolvedValue(undefined);

    const detector = await freshDetector();
    expect(await detector.detectCustomAgents()).toEqual([]);
  });
});
