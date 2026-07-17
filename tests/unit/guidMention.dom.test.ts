/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useGuidMention } from '../../src/renderer/pages/guid/hooks/useGuidMention';
import type { AvailableAgent } from '../../src/renderer/pages/guid/types';

const baseOptions = {
  availableAgents: [] as AvailableAgent[],
  customAgentAvatarMap: new Map<string, string | undefined>(),
  setSelectedAgentKey: vi.fn(),
  setInput: vi.fn(),
};

const resolvedAgent = {
  backend: 'gemini',
  name: 'Gemini',
  isPreset: false,
} as unknown as AvailableAgent;

describe('useGuidMention selectedAgentLabel', () => {
  it('does not leak an unresolved raw agent key into the label (#779)', () => {
    const { result } = renderHook(() =>
      useGuidMention({
        ...baseOptions,
        // A stale onboarding demo-team id that resolves to no real agent.
        selectedAgentKey: 'ext-quiet-money-council',
        selectedAgentInfo: undefined,
      })
    );

    expect(result.current.selectedAgentLabel).toBe('');
    expect(result.current.selectedAgentLabel).not.toBe('ext-quiet-money-council');
  });

  it('surfaces the resolved agent display name when the selection resolves', () => {
    const { result } = renderHook(() =>
      useGuidMention({
        ...baseOptions,
        selectedAgentKey: 'gemini',
        selectedAgentInfo: resolvedAgent,
      })
    );

    expect(result.current.selectedAgentLabel).toBe('Gemini');
  });
});
