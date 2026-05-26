/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for the 6-state MemoryPage router.
 *
 * MemoryPage subscribes to `ipcBridge.ijfw.onStatusChanged` and dispatches one
 * of five Wave-4 production components based on {@link IjfwLifecycleStatus}.
 * The tests mock each branch component so the assertions verify MemoryPage's
 * routing logic without coupling to child implementation details (the child
 * components have their own dom tests).
 */

import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IjfwStatusPayload } from '@/common/adapter/ipcBridge';

type Listener = (payload: IjfwStatusPayload) => void;

const { listeners, unsubscribeSpy, getStatusInvoke, brainInvokeMock } = vi.hoisted(() => ({
  listeners: new Set<Listener>(),
  unsubscribeSpy: vi.fn(),
  getStatusInvoke: vi.fn<() => Promise<IjfwStatusPayload | undefined>>(),
  brainInvokeMock: vi.fn<
    (args: { verb: string; args?: Record<string, unknown> }) => Promise<
      { ok: true; data: unknown } | { ok: false; errorReason?: string }
    >
  >(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      onStatusChanged: {
        on: (fn: Listener) => {
          listeners.add(fn);
          return () => {
            listeners.delete(fn);
            unsubscribeSpy();
          };
        },
      },
      getStatus: { invoke: getStatusInvoke },
      brainInvoke: { invoke: brainInvokeMock },
    },
  },
}));

vi.mock('@renderer/pages/memory/state-branches/InstallerPitchCard', () => ({
  default: () => <div data-testid='branch-installer-pitch' />,
}));

vi.mock('@renderer/pages/memory/state-branches/InstallingCard', () => ({
  default: ({ version }: { version?: string }) => (
    <div data-testid='branch-installing' data-version={version ?? ''} />
  ),
}));

vi.mock('@renderer/pages/memory/state-branches/InstallFailedCard', () => ({
  default: ({ errorReason, stderr }: { errorReason?: string; stderr?: string }) => (
    <div data-testid='branch-install-failed' data-reason={errorReason ?? ''} data-stderr={stderr ?? ''} />
  ),
}));

vi.mock('@renderer/pages/memory/state-branches/OnboardingEmptyState', () => ({
  default: () => <div data-testid='branch-onboarding-empty' />,
}));

vi.mock('@renderer/pages/memory/state-branches/FullPanelShell', () => ({
  default: () => <div data-testid='branch-full-panel-shell' />,
}));

import MemoryPage from '@renderer/pages/memory/MemoryPage';

const emit = (payload: IjfwStatusPayload): void => {
  act(() => {
    for (const fn of listeners) fn(payload);
  });
};

beforeEach(() => {
  listeners.clear();
  unsubscribeSpy.mockReset();
  getStatusInvoke.mockReset();
  getStatusInvoke.mockResolvedValue(undefined);
  brainInvokeMock.mockReset();
  brainInvokeMock.mockResolvedValue({ ok: true, data: { facts: [] } });
});

afterEach(() => {
  cleanup();
});

describe('MemoryPage', () => {
  it('subscribes to status emitter on mount and unsubscribes on unmount', () => {
    const { unmount } = render(<MemoryPage />);
    expect(listeners.size).toBe(1);
    unmount();
    expect(listeners.size).toBe(0);
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('renders InstallerPitchCard when status is not_installed', () => {
    render(<MemoryPage />);
    emit({ status: 'not_installed' });
    expect(screen.getByTestId('branch-installer-pitch')).toBeTruthy();
  });

  it('renders InstallingCard when status is installing', () => {
    render(<MemoryPage />);
    emit({ status: 'installing', version: '1.5.4' });
    const card = screen.getByTestId('branch-installing');
    expect(card.getAttribute('data-version')).toBe('1.5.4');
  });

  it('renders InstallingCard when status is upgrading', () => {
    render(<MemoryPage />);
    emit({ status: 'upgrading', version: '1.2.3' });
    const card = screen.getByTestId('branch-installing');
    expect(card.getAttribute('data-version')).toBe('1.2.3');
  });

  it('renders InstallingCard when status is installed_pending_activation', () => {
    render(<MemoryPage />);
    emit({ status: 'installed_pending_activation', version: '2.0.0' });
    const card = screen.getByTestId('branch-installing');
    expect(card.getAttribute('data-version')).toBe('2.0.0');
  });

  it('renders InstallFailedCard with errorReason and stderr when status is install_failed', () => {
    render(<MemoryPage />);
    emit({ status: 'install_failed', errorReason: 'spawn_error', stderr: 'ENOENT npm' });
    const card = screen.getByTestId('branch-install-failed');
    expect(card.getAttribute('data-reason')).toBe('spawn_error');
    expect(card.getAttribute('data-stderr')).toBe('ENOENT npm');
  });

  it('renders OnboardingEmptyState when status is installed_current and memory_facts is empty', async () => {
    brainInvokeMock.mockResolvedValueOnce({ ok: true, data: { facts: [] } });
    render(<MemoryPage />);
    emit({ status: 'installed_current', version: '1.0.0' });
    await waitFor(() => {
      expect(screen.getByTestId('branch-onboarding-empty')).toBeTruthy();
    });
    expect(brainInvokeMock).toHaveBeenCalledWith({
      verb: 'memory_facts',
      args: { any: true },
    });
  });

  it('renders FullPanelShell when status is installed_current and memory_facts has results', async () => {
    brainInvokeMock.mockResolvedValueOnce({
      ok: true,
      data: { facts: [{ id: 'f1' }] },
    });
    render(<MemoryPage />);
    emit({ status: 'installed_current', version: '1.0.0' });
    await waitFor(() => {
      expect(screen.getByTestId('branch-full-panel-shell')).toBeTruthy();
    });
  });

  it('renders FullPanelShell (degraded) when status is installed_current and memory_facts errors', async () => {
    brainInvokeMock.mockResolvedValueOnce({ ok: false, errorReason: 'mcp_error' });
    render(<MemoryPage />);
    emit({ status: 'installed_current', version: '1.0.0' });
    await waitFor(() => {
      expect(screen.getByTestId('branch-full-panel-shell')).toBeTruthy();
    });
  });

  it('does not duplicate subscriptions under React strict-mode double-mount', () => {
    const { unmount } = render(
      <React.StrictMode>
        <MemoryPage />
      </React.StrictMode>
    );
    expect(listeners.size).toBe(1);
    unmount();
    expect(listeners.size).toBe(0);
  });
});
