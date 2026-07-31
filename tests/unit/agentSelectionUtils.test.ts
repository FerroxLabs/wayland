/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs. Changes are documented in the project history.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const configStorageMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock('../../src/common/config/storage', () => ({
  ConfigStorage: configStorageMocks,
}));

import {
  savePreferredMode,
  savePreferredModelId,
  getAgentKey,
  filterVisibleAgents,
} from '../../src/renderer/pages/guid/hooks/agentSelectionUtils';

// ---------------------------------------------------------------------------
// getAgentKey
// ---------------------------------------------------------------------------

describe('getAgentKey', () => {
  it('returns "custom:<id>" for agents with customAgentId', () => {
    expect(getAgentKey({ backend: 'custom', customAgentId: 'abc-123' })).toBe('custom:abc-123');
    // Preset assistants now use actual backend type but still get custom: prefix
    expect(getAgentKey({ backend: 'claude', customAgentId: 'preset-1' })).toBe('custom:preset-1');
  });

  it('returns backend directly for non-custom agents', () => {
    expect(getAgentKey({ backend: 'claude' })).toBe('claude');
    expect(getAgentKey({ backend: 'gemini' })).toBe('gemini');
    expect(getAgentKey({ backend: 'codex' })).toBe('codex');
  });

  it('returns "custom" when backend is custom but no customAgentId', () => {
    expect(getAgentKey({ backend: 'custom' })).toBe('custom');
  });
});

// ---------------------------------------------------------------------------
// filterVisibleAgents - the Guid-page toolbar strip filter + its guard rails
// ---------------------------------------------------------------------------

describe('filterVisibleAgents', () => {
  const agents = [
    { backend: 'wcore' as const },
    { backend: 'claude' as const },
    { backend: 'codex' as const },
    { backend: 'copilot' as const },
  ];

  it('passes undefined through (agents still loading)', () => {
    expect(filterVisibleAgents(undefined, new Set(), 'wcore')).toBeUndefined();
  });

  it('returns every agent when nothing is hidden', () => {
    expect(filterVisibleAgents(agents, new Set(), 'wcore')).toEqual(agents);
  });

  it('removes hidden agents from the strip', () => {
    const visible = filterVisibleAgents(agents, new Set(['codex', 'copilot']), 'wcore');
    expect(visible?.map((a) => a.backend)).toEqual(['wcore', 'claude']);
  });

  it('never hides the currently-selected agent, even if it is in the hidden set', () => {
    // codex is both hidden AND selected - it must stay in the strip so the user
    // is not left on a backend that vanished from the toolbar.
    const visible = filterVisibleAgents(agents, new Set(['codex']), 'codex');
    expect(visible?.map((a) => a.backend)).toContain('codex');
  });

  it('falls back to the full set when every agent would be hidden', () => {
    const visible = filterVisibleAgents(agents, new Set(['wcore', 'claude', 'codex', 'copilot']), 'none');
    expect(visible).toEqual(agents);
  });

  it('keys custom and remote agents by their prefixed id', () => {
    const mixed = [
      { backend: 'remote' as const, customAgentId: 'r1' },
      { backend: 'claude' as const, customAgentId: 'c1' },
    ];
    const visible = filterVisibleAgents(mixed, new Set(['remote:r1']), 'custom:c1');
    expect(visible).toEqual([{ backend: 'claude', customAgentId: 'c1' }]);
  });
});

// ---------------------------------------------------------------------------
// savePreferredMode
// ---------------------------------------------------------------------------

describe('savePreferredMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configStorageMocks.get.mockResolvedValue({});
    configStorageMocks.set.mockResolvedValue(undefined);
  });

  it('saves preferred mode for gemini under gemini.config', async () => {
    configStorageMocks.get.mockResolvedValue({ yoloMode: false });

    await savePreferredMode('gemini', 'yolo');

    expect(configStorageMocks.get).toHaveBeenCalledWith('gemini.config');
    expect(configStorageMocks.set).toHaveBeenCalledWith('gemini.config', {
      yoloMode: false,
      preferredMode: 'yolo',
    });
  });

  it('saves preferred mode for wcore under wcore.config', async () => {
    configStorageMocks.get.mockResolvedValue({});

    await savePreferredMode('wcore', 'yolo');

    expect(configStorageMocks.get).toHaveBeenCalledWith('wcore.config');
    expect(configStorageMocks.set).toHaveBeenCalledWith('wcore.config', {
      preferredMode: 'yolo',
    });
  });

  it('saves preferred mode for ACP backend under acp.config', async () => {
    configStorageMocks.get.mockResolvedValue({});

    await savePreferredMode('claude', 'bypassPermissions');

    expect(configStorageMocks.get).toHaveBeenCalledWith('acp.config');
    expect(configStorageMocks.set).toHaveBeenCalledWith('acp.config', {
      claude: { preferredMode: 'bypassPermissions' },
    });
  });

  it('preserves existing ACP config when saving mode', async () => {
    configStorageMocks.get.mockResolvedValue({
      claude: { preferredModelId: 'model-1', yoloMode: true },
      codex: { preferredMode: 'yolo' },
    });

    await savePreferredMode('claude', 'default');

    expect(configStorageMocks.set).toHaveBeenCalledWith('acp.config', {
      claude: { preferredModelId: 'model-1', yoloMode: true, preferredMode: 'default' },
      codex: { preferredMode: 'yolo' },
    });
  });

  it('does NOT save when agentKey is "custom"', async () => {
    await savePreferredMode('custom', 'yolo');

    expect(configStorageMocks.get).not.toHaveBeenCalled();
    expect(configStorageMocks.set).not.toHaveBeenCalled();
  });

  it('silently catches errors during save', async () => {
    configStorageMocks.get.mockRejectedValue(new Error('storage error'));

    // Should not throw
    await expect(savePreferredMode('claude', 'default')).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// savePreferredModelId
// ---------------------------------------------------------------------------

describe('savePreferredModelId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configStorageMocks.get.mockResolvedValue({});
    configStorageMocks.set.mockResolvedValue(undefined);
  });

  it('saves preferred model ID under acp.config for given backend', async () => {
    await savePreferredModelId('codex', 'gpt-4o');

    expect(configStorageMocks.get).toHaveBeenCalledWith('acp.config');
    expect(configStorageMocks.set).toHaveBeenCalledWith('acp.config', {
      codex: { preferredModelId: 'gpt-4o' },
    });
  });

  it('preserves existing config when saving model ID', async () => {
    configStorageMocks.get.mockResolvedValue({
      codex: { preferredMode: 'yolo' },
    });

    await savePreferredModelId('codex', 'gpt-4o');

    expect(configStorageMocks.set).toHaveBeenCalledWith('acp.config', {
      codex: { preferredMode: 'yolo', preferredModelId: 'gpt-4o' },
    });
  });

  it('silently catches errors during save', async () => {
    configStorageMocks.get.mockRejectedValue(new Error('storage error'));

    await expect(savePreferredModelId('codex', 'gpt-4o')).resolves.toBeUndefined();
  });
});
