/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Contract test for the cross-page launch helper. The Phase 3 library page
 * lives outside the /guid hook tree, so it can't call
 * useGuidAgentSelection.selectPresetAssistant directly. The helper persists
 * the resolved agent key + navigates, and the /guid restoration path picks
 * it up - same end result, just initiated from outside.
 */

import { describe, expect, it, vi } from 'vitest';

const setMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn().mockResolvedValue(null),
    set: setMock,
  },
}));

import { launchAssistant } from '../../../../src/renderer/pages/assistants/utils/launchAssistant';

describe('launchAssistant', () => {
  it('persists the custom: agent key derived from the preset and navigates to /guid', async () => {
    const navigate = vi.fn();
    setMock.mockClear();

    const key = await launchAssistant({ id: 'word-creator', presetAgentType: 'gemini' }, navigate);

    expect(key).toBe('custom:word-creator');
    expect(setMock).toHaveBeenCalledWith('guid.lastSelectedAgent', 'custom:word-creator');
    expect(navigate).toHaveBeenCalledWith('/guid', { state: { launchAssistant: true } });
  });

  it('defaults backend to gemini when presetAgentType is missing', async () => {
    const navigate = vi.fn();
    setMock.mockClear();

    const key = await launchAssistant({ id: 'someone' }, navigate);
    expect(key).toBe('custom:someone');
    expect(setMock).toHaveBeenCalledWith('guid.lastSelectedAgent', 'custom:someone');
  });
});
