/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DoctorReportModal — the `/doctor` slash-command modal (issue #458).
 *
 * Covers three behaviors the cross-audit flagged:
 *   1. Opening the modal runs the Doctor exactly once and renders the report.
 *   2. "Copy report" routes through the shared, Windows-hardened `copyText`
 *      helper (never `navigator.clipboard` directly) — mirrors #269.
 *   3. A FAILED run renders a visible error message (not an empty `<pre>`) and
 *      leaves Copy disabled.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DoctorReport } from '../../../src/process/doctor/types';

// Stable `t` + `useTranslation` — the modal memoizes `run` on `[t]`, so a fresh
// function each render would loop the auto-run effect forever.
const stableT = (key: string, opts?: Record<string, unknown>) =>
  opts && typeof opts.defaultValue === 'string' ? opts.defaultValue : key;
const stableTranslation = { t: stableT };
vi.mock('react-i18next', () => ({
  useTranslation: () => stableTranslation,
}));

// Arco's Modal/Button/Spin pull portal + animation machinery that hangs under
// this jsdom setup; stub them to plain elements that still render the title,
// body children, and footer actions. `Message` is a static toast object here
// (Message.error / Message.success), not the `useMessage` hook.
const mockMessageError = vi.fn();
const mockMessageSuccess = vi.fn();
vi.mock('@arco-design/web-react', () => ({
  Modal: ({
    children,
    footer,
    title,
  }: {
    children: React.ReactNode;
    footer?: React.ReactNode;
    title?: React.ReactNode;
  }) => React.createElement('div', null, React.createElement('div', null, title), children, footer),
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) =>
    React.createElement('button', { onClick, disabled }, children),
  Spin: () => React.createElement('div', null, 'spin'),
  Message: {
    error: (...a: unknown[]) => mockMessageError(...a),
    success: (...a: unknown[]) => mockMessageSuccess(...a),
  },
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

import DoctorReportModal from '../../../src/renderer/components/chat/DoctorReportModal';

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

const getCopyButton = (): HTMLButtonElement => {
  const label = screen.getByText('Copy report');
  const button = label.closest('button');
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Expected Copy report button');
  }
  return button;
};

describe('DoctorReportModal (#458)', () => {
  beforeEach(() => {
    mockRunDoctor.mockReset().mockResolvedValue(REPORT);
    mockCopyText.mockReset().mockResolvedValue(undefined);
    mockMessageError.mockReset();
    mockMessageSuccess.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs the Doctor once on open, renders the report, and Copy routes through copyText', async () => {
    // Guard against a regression back to a direct navigator.clipboard call.
    const navWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: navWriteText } });

    await act(async () => {
      render(<DoctorReportModal visible onClose={() => {}} />);
    });

    await waitFor(() => expect(mockRunDoctor).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Wayland Doctor report/)).toBeInTheDocument();

    const copyButton = getCopyButton();
    expect(copyButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(copyButton);
    });

    await waitFor(() => expect(mockCopyText).toHaveBeenCalledTimes(1));
    const arg = mockCopyText.mock.calls[0][0] as string;
    expect(typeof arg).toBe('string');
    expect(arg).toContain('Wayland Doctor report');
    expect(navWriteText).not.toHaveBeenCalled();
  });

  it('shows an error message and keeps Copy disabled when the run fails', async () => {
    mockRunDoctor.mockReset().mockRejectedValue(new Error('boom'));

    await act(async () => {
      render(<DoctorReportModal visible onClose={() => {}} />);
    });

    await waitFor(() => expect(mockRunDoctor).toHaveBeenCalledTimes(1));

    // A failed run must render a visible error, not an empty <pre>.
    expect(await screen.findByText('Could not run the Doctor. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText(/Wayland Doctor report/)).not.toBeInTheDocument();

    // Copy stays disabled because there is no report to copy.
    expect(getCopyButton()).toBeDisabled();
  });
});
