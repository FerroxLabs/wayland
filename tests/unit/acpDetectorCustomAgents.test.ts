/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for the custom-agent filtering in AcpDetector.detectCustomAgents():
 * preset and disabled rows are excluded, everything else is listed.
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

describe('AcpDetector.detectCustomAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps preset rows excluded and disabled rows excluded', async () => {
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
