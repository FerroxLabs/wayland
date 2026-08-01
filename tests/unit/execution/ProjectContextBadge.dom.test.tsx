/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  changed: undefined as ((payload?: { id?: string }) => void) | undefined,
  getProject: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    project: {
      get: { invoke: mocks.getProject },
      changed: {
        on: (callback: (payload?: { id?: string }) => void) => {
          mocks.changed = callback;
          return () => {
            mocks.changed = undefined;
          };
        },
      },
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key }),
}));

import ProjectContextBadge from '@/renderer/pages/conversation/components/ProjectContext';

describe('ProjectContextBadge', () => {
  beforeEach(() => {
    mocks.changed = undefined;
    mocks.getProject.mockReset();
  });

  it('tracks canonical project rename events live', async () => {
    mocks.getProject
      .mockResolvedValueOnce({ id: 'project-1', name: 'Book launch', pinned: false, createTime: 1, modifyTime: 1 })
      .mockResolvedValueOnce({ id: 'project-1', name: 'Book launch v2', pinned: false, createTime: 1, modifyTime: 2 });
    render(<ProjectContextBadge projectId='project-1' />);
    expect(await screen.findByText('Book launch')).toBeTruthy();
    await act(async () => mocks.changed?.());
    expect(await screen.findByText('Book launch v2')).toBeTruthy();
  });

  it('shows an honest fallback when the canonical project was deleted', async () => {
    mocks.getProject.mockResolvedValue(null);
    render(<ProjectContextBadge projectId='missing-project' />);
    await waitFor(() => expect(screen.getByText('Project unavailable')).toBeTruthy());
    expect(screen.getByTestId('project-context-badge').dataset.projectState).toBe('unavailable');
  });
});
