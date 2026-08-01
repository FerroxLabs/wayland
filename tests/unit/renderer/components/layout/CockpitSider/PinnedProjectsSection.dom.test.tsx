/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const changedHandlers: Array<() => void> = [];
const listProjects = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {
    project: {
      list: { invoke: (...args: unknown[]) => listProjects(...args) },
      changed: {
        on: (handler: () => void) => {
          changedHandlers.push(handler);
          return () => {
            const index = changedHandlers.indexOf(handler);
            if (index >= 0) changedHandlers.splice(index, 1);
          };
        },
      },
    },
  },
}));

import { PinnedProjectsSection } from '@renderer/components/layout/CockpitSider/PinnedProjectsSection';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const project = (id: string, name: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name,
  pinned: true,
  pinnedAt: 1,
  createTime: 1,
  modifyTime: 1,
  ...overrides,
});

describe('PinnedProjectsSection', () => {
  beforeEach(() => {
    changedHandlers.length = 0;
    listProjects.mockReset();
    listProjects.mockResolvedValue([]);
  });

  it('filters hostile rows, orders pins deterministically, and routes an encoded project id', async () => {
    const onNavigate = vi.fn();
    listProjects.mockResolvedValue([
      project('older', 'Older', { pinnedAt: 10, modifyTime: 100 }),
      project('newest', 'Newest', { pinnedAt: 30 }),
      project('modified', 'Modified', { pinnedAt: 10, modifyTime: 200 }),
      project('project / private', 'Encoded route', { pinnedAt: 5 }),
      project('not-pinned', 'Not pinned', { pinned: false }),
      { pinned: true, id: '', name: 'Missing id' },
      { pinned: true, id: 'missing-name', name: '' },
      null,
      'not a project',
    ]);

    render(<PinnedProjectsSection collapsed={false} onNavigate={onNavigate} />);

    const section = await screen.findByTestId('cockpit-pinned-projects');
    expect(section).toHaveTextContent('projects.list.title');
    expect(screen.queryByText('Not pinned')).not.toBeInTheDocument();
    expect(screen.queryByText('Missing id')).not.toBeInTheDocument();
    expect(screen.queryByText('missing-name')).not.toBeInTheDocument();

    const buttons = screen.getAllByRole('button').map((button) => button.textContent);
    expect(buttons).toEqual(['Newest', 'Modified', 'Older', 'Encoded route']);

    fireEvent.click(screen.getByRole('button', { name: 'Encoded route' }));
    expect(onNavigate).toHaveBeenCalledWith('/project/project%20%2F%20private');
  });

  it('fails quiet for rejected and malformed project lists', async () => {
    const onNavigate = vi.fn();
    listProjects.mockRejectedValueOnce(new Error('project storage unavailable'));
    const { rerender } = render(<PinnedProjectsSection collapsed={false} onNavigate={onNavigate} />);

    await waitFor(() => expect(listProjects).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('cockpit-pinned-projects')).not.toBeInTheDocument();

    listProjects.mockResolvedValueOnce({ pinned: true });
    act(() => changedHandlers.forEach((handler) => handler()));
    rerender(<PinnedProjectsSection collapsed={false} onNavigate={onNavigate} />);
    await waitFor(() => expect(listProjects).toHaveBeenCalledTimes(2));
    expect(screen.queryByTestId('cockpit-pinned-projects')).not.toBeInTheDocument();
  });

  it('keeps the newest refresh when project.changed responses resolve out of order', async () => {
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    listProjects.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<PinnedProjectsSection collapsed={false} onNavigate={vi.fn()} />);

    await waitFor(() => expect(listProjects).toHaveBeenCalledTimes(1));
    act(() => changedHandlers.forEach((handler) => handler()));
    expect(listProjects).toHaveBeenCalledTimes(2);

    await act(async () => second.resolve([project('current', 'Current')]));
    expect(await screen.findByRole('button', { name: 'Current' })).toBeInTheDocument();

    await act(async () => first.resolve([project('stale', 'Stale')]));
    expect(screen.getByRole('button', { name: 'Current' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stale' })).not.toBeInTheDocument();
  });

  it('replaces rather than duplicates rows across repeated change events', async () => {
    listProjects.mockResolvedValue([project('same', 'One project')]);
    render(<PinnedProjectsSection collapsed={false} onNavigate={vi.fn()} />);
    expect(await screen.findByRole('button', { name: 'One project' })).toBeInTheDocument();

    act(() => changedHandlers.forEach((handler) => handler()));
    act(() => changedHandlers.forEach((handler) => handler()));
    await waitFor(() => expect(listProjects).toHaveBeenCalledTimes(3));
    expect(screen.getAllByRole('button', { name: 'One project' })).toHaveLength(1);
  });

  it('does no project work while collapsed', () => {
    render(<PinnedProjectsSection collapsed onNavigate={vi.fn()} />);
    expect(listProjects).not.toHaveBeenCalled();
    expect(changedHandlers).toHaveLength(0);
    expect(screen.queryByTestId('cockpit-pinned-projects')).not.toBeInTheDocument();
  });

  it('unsubscribes and ignores a late response after unmount', async () => {
    const pending = deferred<unknown>();
    listProjects.mockReturnValue(pending.promise);
    const { unmount } = render(<PinnedProjectsSection collapsed={false} onNavigate={vi.fn()} />);
    await waitFor(() => expect(changedHandlers).toHaveLength(1));

    unmount();
    expect(changedHandlers).toHaveLength(0);
    await act(async () => pending.resolve([project('late', 'Late')]));
    expect(screen.queryByText('Late')).not.toBeInTheDocument();
  });
});
