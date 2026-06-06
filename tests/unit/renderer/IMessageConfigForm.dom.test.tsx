/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * F17: minimal renderer smoke tests for IMessageConfigForm.
 *
 * Setup/Form is the only surface a real user touches; without a test, the
 * Full-Disk-Access / Automation / attachments hints can be silently removed
 * and the first-time-setup UX (Dimension 1 of the v0.4.1 sweep) tanks with
 * zero CI signal. These tests assert the three permission notes render and
 * that the poll-interval input is wired to the plugin clamp range [500, 60000].
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue ?? _key,
  }),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  channel: {
    testPlugin: { invoke: vi.fn() },
    enablePlugin: { invoke: vi.fn() },
    getPluginStatus: { invoke: vi.fn() },
  },
}));

// Arco overrides - we only need the DOM shapes the form renders.
vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    ...props
  }: React.PropsWithChildren<{ loading?: boolean; type?: string; onClick?: () => void }>) => (
    <button {...props}>{children}</button>
  ),
  Input: Object.assign(
    ({ value, onChange }: { value?: string; onChange?: (v: string) => void }) => (
      <input value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} />
    ),
    {
      TextArea: ({
        value,
        onChange,
        placeholder,
      }: {
        value?: string;
        onChange?: (v: string) => void;
        placeholder?: string;
      }) => <textarea value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} />,
    }
  ),
  InputNumber: ({
    value,
    onChange,
    min,
    max,
  }: {
    value?: number;
    onChange?: (v: number) => void;
    min?: number;
    max?: number;
  }) => (
    <input
      type='number'
      data-testid='poll-interval'
      value={value ?? ''}
      min={min}
      max={max}
      onChange={(e) => onChange?.(Number(e.target.value))}
    />
  ),
  Message: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('lucide-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('lucide-react')>()),
  AlertTriangle: () => <span data-testid='alert-icon' />,
}));

import IMessageConfigForm from '@/renderer/components/settings/SettingsModal/contents/channels/messaging/IMessageConfigForm';

describe('IMessageConfigForm renderer smoke (F17)', () => {
  it('renders the three permission notes (FDA, Automation, attachments)', () => {
    render(<IMessageConfigForm pluginStatus={null} onStatusChange={() => undefined} />);

    expect(
      // The form now references Full Disk Access in more than one place; assert
      // at least one occurrence is present.
      screen.getAllByText(/Full Disk Access/i)[0],
      'FDA hint must be present so users know about the macOS permission gate'
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Automation consent/i),
      'Automation hint must be present so users know the second TCC prompt is coming'
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Text-only/i),
      'Attachments-not-supported hint must be present so users do not expect media'
    ).toBeInTheDocument();
  });

  it('renders the Test & Enable button', () => {
    render(<IMessageConfigForm pluginStatus={null} onStatusChange={() => undefined} />);
    expect(screen.getByRole('button', { name: /Test & Enable/i })).toBeInTheDocument();
  });

  it('wires the poll-interval input to the plugin clamp range [500, 60000] (F3)', () => {
    render(<IMessageConfigForm pluginStatus={null} onStatusChange={() => undefined} />);
    const input = screen.getByTestId('poll-interval') as HTMLInputElement;
    expect(input.min).toBe('500');
    // F3: must match MAX_POLL_INTERVAL_MS (60_000) in ImessagePlugin.ts so
    // power users can actually pick the upper third of the supported range.
    expect(input.max).toBe('60000');
  });
});
