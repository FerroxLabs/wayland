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

const { listeners, unsubscribeSpy, getStatusInvoke } = vi.hoisted(() => ({
  listeners: new Set<Listener>(),
  unsubscribeSpy: vi.fn(),
  getStatusInvoke: vi.fn<() => Promise<IjfwStatusPayload | undefined>>(),
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
    },
  },
}));

vi.mock('@renderer/pages/memory/state-branches/InstallerPitchCard', () => ({
  default: () => <div data-testid='branch-installer-pitch' />,
}));

vi.mock('@renderer/pages/memory/state-branches/AutoSettingUpCard', () => ({
  default: () => <div data-testid='branch-auto-setting-up' />,
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

  it('renders AutoSettingUpCard (silent auto-install) when status is not_installed with no reason', () => {
    // v0.6.3 disclosure flip: default not_installed view is the silent
    // background-install surface. Bootstrap auto-installs at app boot, so
    // the default UX is "Setting up Memory" -- NOT the manual pitch.
    render(<MemoryPage />);
    emit({ status: 'not_installed' });
    expect(screen.getByTestId('branch-auto-setting-up')).toBeTruthy();
  });

  it('renders InstallerPitchCard (opt-out re-enable surface) when status is not_installed AND reason is opt_out', () => {
    render(<MemoryPage />);
    emit({ status: 'not_installed', reason: 'opt_out' });
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

  it('renders FullPanelShell directly when status is installed_current (no memory_facts gate)', () => {
    // Prior behavior routed through `memory_facts({any:true})` which is a
    // hallucinated arg shape (real schema requires {subject, predicate}). When
    // the server returned empty facts, users with hundreds of memories were
    // wedged on OnboardingEmptyState. Now the route is direct: any
    // installed_current emission immediately surfaces the full tab shell, and
    // each tab handles its own empty/error states locally.
    render(<MemoryPage />);
    emit({ status: 'installed_current', version: '1.0.0' });
    expect(screen.getByTestId('branch-full-panel-shell')).toBeTruthy();
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

  it('Gemini H2: falls back to not_installed when getStatus.invoke throws synchronously', async () => {
    // Regression for the H2 BLOCKER. The prior Promise.resolve(invoke()) chain
    // did not catch synchronous throws (IPC dispatcher not yet hydrated,
    // serialization error). The async-IIFE try/catch must trap both sync and
    // async failures. The fallback emits `{ status: 'not_installed' }` with
    // no reason -- v0.6.3 routes this to the silent AutoSettingUpCard.
    getStatusInvoke.mockImplementationOnce(() => {
      throw new Error('sync IPC dispatcher not initialized');
    });
    render(<MemoryPage />);
    await waitFor(
      () => {
        expect(screen.getByTestId('branch-auto-setting-up')).toBeTruthy();
      },
      { timeout: 2000 },
    );
  });
});
