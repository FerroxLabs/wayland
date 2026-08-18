/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #1024 - the Doctor's "Engine config integrity" row must offer the recovery
 * actions when it FAILS, and must not when it passes.
 *
 * The row is selected by the check ID (`config.engineConfig`), not by its prose:
 * that check's detail/remediation wording is owned elsewhere and is being
 * tightened separately for message sanitisation, so keying on the text would
 * make this fix break the moment that wording changes.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DoctorReport } from '../../../src/process/doctor/types';

const stableT = (key: string, opts?: Record<string, unknown>) =>
  opts && typeof opts.defaultValue === 'string' ? opts.defaultValue : key;
const stableTranslation = { t: stableT };
vi.mock('react-i18next', () => ({ useTranslation: () => stableTranslation }));

vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
    React.createElement('button', { onClick }, children),
  Spin: () => React.createElement('div', null, 'spin'),
}));

vi.mock('lucide-react', () => {
  const Icon = () => React.createElement('span');
  return {
    AlertTriangle: Icon,
    CheckCircle2: Icon,
    Copy: Icon,
    RefreshCw: Icon,
    Stethoscope: Icon,
    XCircle: Icon,
    FileSearch: Icon,
    FolderOpen: Icon,
    RotateCcw: Icon,
    Wrench: Icon,
  };
});

vi.mock('@renderer/components/settings/shared', () => ({
  Card: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  EmptyState: () => React.createElement('div', null, 'empty'),
  ConfirmDialog: () => null,
}));

vi.mock('@renderer/pages/settings/components/SettingsPageShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));

const mockRunDoctor = vi.fn();
const mockInspect = vi.fn();

vi.mock('@/common/adapter/ipcBridge', () => ({
  doctor: { runDoctor: { invoke: () => mockRunDoctor() } },
  engineConfigRecovery: {
    inspect: { invoke: () => mockInspect() },
    repair: { invoke: vi.fn() },
    regenerate: { invoke: vi.fn() },
    reveal: { invoke: vi.fn() },
  },
}));

vi.mock('@/renderer/utils/ui/clipboard', () => ({ copyText: vi.fn() }));
vi.mock('@renderer/hooks/settings/useToast', () => ({ useToast: () => ({ show: vi.fn() }) }));

import DoctorSettings from '@renderer/pages/settings/DoctorSettings';

function report(status: 'pass' | 'fail'): DoctorReport {
  return {
    ranAt: '2026-08-17T00:00:00.000Z',
    overall: status,
    counts: { pass: status === 'pass' ? 1 : 0, warn: 0, fail: status === 'fail' ? 1 : 0 },
    results: [
      {
        id: 'config.engineConfig',
        titleKey: 'settings.doctor.checks.engineConfig',
        category: 'config',
        status,
        detail: 'detail',
        durationMs: 1,
      },
    ],
  };
}

beforeEach(() => {
  mockRunDoctor.mockReset();
  mockInspect.mockReset();
  mockInspect.mockResolvedValue({
    status: 'invalid',
    path: '/x/config.toml',
    problem: { line: 5, column: 11, reason: 'Invalid TOML document: invalid value' },
    repair: { lineBreaks: 1 },
  });
});

describe('Doctor engine config integrity row', () => {
  it('renders the recovery panel when the check FAILS', async () => {
    mockRunDoctor.mockResolvedValue(report('fail'));
    render(<DoctorSettings />);
    await waitFor(() => expect(screen.getByTestId('doctor-engine-config-recovery')).toBeTruthy());
    // The panel's own actions are live, including the always-available escape hatch.
    await waitFor(() => expect(screen.getByTestId('engine-config-reveal')).toBeTruthy());
    expect(screen.getByTestId('engine-config-repair')).toBeTruthy();
  });

  it('does NOT render the recovery panel when the check passes', async () => {
    mockRunDoctor.mockResolvedValue(report('pass'));
    render(<DoctorSettings />);
    await waitFor(() => expect(mockRunDoctor).toHaveBeenCalled());
    expect(screen.queryByTestId('doctor-engine-config-recovery')).toBeNull();
    expect(mockInspect).not.toHaveBeenCalled();
  });
});
