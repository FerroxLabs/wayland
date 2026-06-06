/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockAssistantList = vi.fn();

vi.mock('@/renderer/hooks/assistant', () => ({
  useAssistantList: () => mockAssistantList(),
}));

import { useTeamSourceLauncher } from '@/renderer/pages/team/hooks/useTeamSourceLauncher';

type Launcher = {
  id: string;
  name?: string;
  nameI18n?: Record<string, string>;
  _kind?: string;
};

const setAssistants = (assistants: Launcher[], localeKey = 'en-US') => {
  mockAssistantList.mockReturnValue({ assistants, localeKey });
};

describe('useTeamSourceLauncher', () => {
  it('returns null when team is null/undefined', () => {
    setAssistants([{ id: 'ext-a', name: 'A', _kind: 'team' }]);
    const { result } = renderHook(() => useTeamSourceLauncher(null));
    expect(result.current.launcher).toBeNull();
  });

  it('prefers strict id-match over name-match when sourceLauncherId is set', () => {
    setAssistants([
      { id: 'ext-other', name: 'My Team', _kind: 'team' },
      { id: 'ext-canonical', name: 'Different Name', _kind: 'team' },
    ]);
    const { result } = renderHook(() =>
      useTeamSourceLauncher({ name: 'My Team', sourceLauncherId: 'ext-canonical' })
    );
    expect(result.current.launcher?.id).toBe('ext-canonical');
  });

  it('returns null when sourceLauncherId is stale (no fallback to name match)', () => {
    setAssistants([{ id: 'ext-existing', name: 'My Team', _kind: 'team' }]);
    const { result } = renderHook(() =>
      useTeamSourceLauncher({ name: 'My Team', sourceLauncherId: 'ext-deleted' })
    );
    expect(result.current.launcher).toBeNull();
  });

  it('falls back to case-insensitive name match when no sourceLauncherId', () => {
    setAssistants([
      { id: 'ext-a', name: 'Alpha', _kind: 'team' },
      { id: 'ext-b', nameI18n: { 'en-US': 'Renewal Push' }, _kind: 'team' },
    ]);
    const { result } = renderHook(() => useTeamSourceLauncher({ name: 'renewal push' }));
    expect(result.current.launcher?.id).toBe('ext-b');
  });

  it('returns null when name has no match and no sourceLauncherId', () => {
    setAssistants([{ id: 'ext-a', name: 'Alpha', _kind: 'team' }]);
    const { result } = renderHook(() => useTeamSourceLauncher({ name: 'Unknown' }));
    expect(result.current.launcher).toBeNull();
  });

  it('skips non-team entries during both match paths', () => {
    setAssistants([
      { id: 'ext-spec', name: 'My Team', _kind: 'specialist' },
      { id: 'ext-team', name: 'My Team', _kind: 'team' },
    ]);
    const { result } = renderHook(() => useTeamSourceLauncher({ name: 'My Team' }));
    expect(result.current.launcher?.id).toBe('ext-team');
  });
});
