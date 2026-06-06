/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Wave 4 - DOM tests for InstallingCard.
 *
 * Asserts:
 *   - Renders all 4 step labels (download / extract / verify / activate)
 *   - Version label is rendered iff the `version` prop is present
 *   - Degraded banner appears when getRuntimeMode resolves to `'degraded'`
 *   - Title swaps + pending-activation block appears when the status
 *     emitter flips to `installed_pending_activation`
 *
 * i18n is mocked to return the key string, so assertions match the i18n
 * key rather than the localized copy.
 */

import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IjfwStatusPayload } from '@/common/adapter/ipcBridge';

type Listener = (payload: IjfwStatusPayload) => void;

const { listeners, getRuntimeModeInvoke, restartInvoke } = vi.hoisted(() => ({
  listeners: new Set<Listener>(),
  getRuntimeModeInvoke: vi.fn<() => Promise<'full' | 'degraded'>>(),
  restartInvoke: vi.fn<() => Promise<void>>(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      onStatusChanged: {
        on: (fn: Listener) => {
          listeners.add(fn);
          return () => {
            listeners.delete(fn);
          };
        },
      },
      getRuntimeMode: { invoke: getRuntimeModeInvoke },
    },
    application: {
      restart: { invoke: restartInvoke },
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts.version === 'string') {
        return `${key}:${opts.version}`;
      }
      return key;
    },
  }),
}));

import InstallingCard from '@renderer/pages/memory/state-branches/InstallingCard';

const emit = (payload: IjfwStatusPayload): void => {
  act(() => {
    for (const fn of listeners) fn(payload);
  });
};

beforeEach(() => {
  listeners.clear();
  getRuntimeModeInvoke.mockReset();
  getRuntimeModeInvoke.mockResolvedValue('full');
  restartInvoke.mockReset();
  restartInvoke.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

describe('InstallingCard', () => {
  it('renders all 4 step labels', () => {
    render(<InstallingCard />);
    expect(screen.getByTestId('memory-installing-step-download')).toBeTruthy();
    expect(screen.getByTestId('memory-installing-step-extract')).toBeTruthy();
    expect(screen.getByTestId('memory-installing-step-verify')).toBeTruthy();
    expect(screen.getByTestId('memory-installing-step-activate')).toBeTruthy();
  });

  it('renders the version label when version prop is supplied', () => {
    render(<InstallingCard version='1.5.4' />);
    const versionLine = screen.getByTestId('memory-installing-version');
    expect(versionLine).toBeTruthy();
    expect(versionLine.textContent).toContain('1.5.4');
  });

  it('omits the version label when no version prop is supplied', () => {
    render(<InstallingCard />);
    expect(screen.queryByTestId('memory-installing-version')).toBeNull();
  });

  it('shows the degraded banner when runtime mode is degraded', async () => {
    getRuntimeModeInvoke.mockResolvedValue('degraded');
    render(<InstallingCard version='1.5.4' />);
    await waitFor(() => {
      expect(screen.getByTestId('memory-installing-degraded-banner')).toBeTruthy();
    });
  });

  it('hides the degraded banner when runtime mode is full', async () => {
    getRuntimeModeInvoke.mockResolvedValue('full');
    render(<InstallingCard />);
    // Give the promise a tick to resolve, then confirm absence.
    await Promise.resolve();
    expect(screen.queryByTestId('memory-installing-degraded-banner')).toBeNull();
  });

  it('swaps in pending-activation block when status flips to installed_pending_activation', () => {
    render(<InstallingCard version='2.0.0' />);
    expect(screen.queryByTestId('memory-installing-pending')).toBeNull();
    emit({ status: 'installed_pending_activation', version: '2.0.0' });
    expect(screen.getByTestId('memory-installing-pending')).toBeTruthy();
  });

  it('does not show pending block while status stays installing', () => {
    render(<InstallingCard />);
    emit({ status: 'installing' });
    expect(screen.queryByTestId('memory-installing-pending')).toBeNull();
  });

  it('unsubscribes from the status emitter on unmount', () => {
    const { unmount } = render(<InstallingCard />);
    expect(listeners.size).toBe(1);
    unmount();
    expect(listeners.size).toBe(0);
  });
});
