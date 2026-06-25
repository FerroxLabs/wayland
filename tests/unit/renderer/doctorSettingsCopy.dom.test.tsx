/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Doctor settings page — "Copy report" routes through the shared `copyText`
 * helper (#269).
 *
 * `navigator.clipboard.writeText` is unreliable in the Electron renderer on
 * Windows, so the copy button must use the project's shared, Windows-hardened
 * `copyText` util (which falls back to `document.execCommand('copy')`) rather
 * than calling the browser clipboard API directly. This test asserts the click
 * invokes `copyText` with the rendered report text.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DoctorReport } from '../../../src/process/doctor/types';

// Stable `t` + `useTranslation` return value — the page memoizes `run` on `[t]`,
// so a fresh function each render would loop the auto-run effect forever.
const stableT = (key: string, opts?: Record<string, unknown>) =>
  opts && typeof opts.defaultValue === 'string' ? opts.defaultValue : key;
const stableTranslation = { t: stableT };
vi.mock('react-i18next', () => ({
  useTranslation: () => stableTranslation,
}));

// Arco's Button/Spin pull animation + portal machinery that hangs under this
// jsdom setup; the test only needs the button's label + click, so stub them to
// plain elements. (icons likewise — render noise.)
vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) =>
    React.createElement('button', { onClick, disabled }, children),
  Spin: () => React.createElement('div', null, 'spin'),
}));

vi.mock('lucide-react', () => {
  const Icon = () => React.createElement('span');
  return { AlertTriangle: Icon, CheckCircle2: Icon, Copy: Icon, RefreshCw: Icon, Stethoscope: Icon, XCircle: Icon };
});

vi.mock('@renderer/components/settings/shared', () => ({
  Card: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  EmptyState: () => React.createElement('div', null, 'empty'),
}));

const mockRunDoctor = vi.fn();
const mockCopyText = vi.fn();

vi.mock('@/common/adapter/ipcBridge', () => ({
  doctor: {
    runDoctor: { invoke: (...a: unknown[]) => mockRunDoctor(...a) },
  },
}));

vi.mock('@/renderer/utils/ui/clipboard', () => ({
  copyText: (...a: unknown[]) => mockCopyText(...a),
}));

const mockToastShow = vi.fn();
// Return a STABLE object — the page's `run`/`copyReport` callbacks depend on
// `toast`, and a fresh object each render would re-fire the auto-run effect in
// an infinite loop.
const stableToast = { show: mockToastShow };
vi.mock('@renderer/hooks/settings/useToast', () => ({
  useToast: () => stableToast,
}));

// Page chrome — stub to a plain wrapper that still renders the action buttons.
vi.mock('@renderer/pages/settings/components/SettingsPageShell', () => ({
  default: ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) =>
    React.createElement('div', null, actions, children),
}));

import DoctorSettings from '../../../src/renderer/pages/settings/DoctorSettings';

const REPORT: DoctorReport = {
  ranAt: '2026-06-22T00:00:00.000Z',
  overall: 'pass',
  counts: { pass: 1, warn: 0, fail: 0 },
  results: [
    {
      id: 'providers.connectivity',
      titleKey: 'settings.doctor.checks.providerConnectivity',
      category: 'providers',
      status: 'pass',
      detail: '1 connected provider passed.',
      durationMs: 5,
    },
  ],
};

describe('DoctorSettings — Copy report (#269)', () => {
  beforeEach(() => {
    mockRunDoctor.mockReset().mockResolvedValue(REPORT);
    mockCopyText.mockReset().mockResolvedValue(undefined);
    mockToastShow.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes "Copy report" through the shared copyText util, not navigator.clipboard directly', async () => {
    // Spy on navigator.clipboard so a regression back to a direct call is caught.
    // (The page must go through the `copyText` helper, which owns the
    // navigator/execCommand fallback decision itself.)
    const navWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: navWriteText } });

    await act(async () => {
      render(<DoctorSettings />);
    });

    // The page auto-runs the Doctor on mount; wait for the report to land.
    await waitFor(() => expect(mockRunDoctor).toHaveBeenCalled());

    const copyButton = await screen.findByText('Copy report');
    await act(async () => {
      fireEvent.click(copyButton.closest('button') ?? copyButton);
    });

    await waitFor(() => expect(mockCopyText).toHaveBeenCalledTimes(1));
    const arg = mockCopyText.mock.calls[0][0] as string;
    expect(typeof arg).toBe('string');
    expect(arg.length).toBeGreaterThan(0);
    expect(navWriteText).not.toHaveBeenCalled();
  });
});
