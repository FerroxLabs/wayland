/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: Record<string, unknown>) => {
      let value = String(options?.defaultValue ?? _key);
      for (const [name, replacement] of Object.entries(options ?? {})) {
        if (name === 'defaultValue') continue;
        value = value.replace(`{{${name}}}`, String(replacement));
      }
      return value;
    },
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Switch: ({
    checked,
    disabled,
    onChange,
    'aria-label': ariaLabel,
    'data-testid': testId,
  }: {
    checked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
    'aria-label'?: string;
    'data-testid'?: string;
  }) => (
    <input
      type='checkbox'
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.checked)}
      aria-label={ariaLabel}
      data-testid={testId}
    />
  ),
}));

import CohortEvidenceConsent from '@renderer/pages/settings/NavigationSettings/CohortEvidenceConsent';

const DAY_MS = 86_400_000;
const START = Date.UTC(2026, 6, 1);
const END = START + 14 * DAY_MS;

const disabledStatus = Object.freeze({
  enabled: false,
  acceptedAtMs: null,
  observationWindow: null,
});

const enabledStatus = Object.freeze({
  enabled: true,
  acceptedAtMs: START,
  observationWindow: { startMs: START, endMs: END },
});

const enabledResult = Object.freeze({ status: 'enabled', consent: enabledStatus });
const disabledResult = Object.freeze({ status: 'disabled', consent: disabledStatus });

type ConsentApi = {
  cohortConsentStatus?: ReturnType<typeof vi.fn>;
  cohortSetConsent?: ReturnType<typeof vi.fn>;
};

function setApi(api: ConsentApi | undefined): void {
  Object.defineProperty(window, 'electronAPI', { configurable: true, writable: true, value: api });
}

describe('CohortEvidenceConsent', () => {
  beforeEach(() => {
    setApi(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    setApi(undefined);
  });

  it('stays explicitly off and disabled when the desktop consent API is absent', async () => {
    render(<CohortEvidenceConsent />);

    await waitFor(() => expect(screen.getByText(/unavailable in this build/i)).toBeInTheDocument());
    const toggle = screen.getByRole('checkbox', { name: /collect local aggregate evidence/i });
    expect(toggle).not.toBeChecked();
    expect(toggle).toBeDisabled();
  });

  it('enables only after an authoritative API acknowledgement and shows the exact 14-day window', async () => {
    const getStatus = vi.fn().mockResolvedValue(disabledStatus);
    const setConsent = vi.fn().mockResolvedValue(enabledResult);
    setApi({ cohortConsentStatus: getStatus, cohortSetConsent: setConsent });
    render(<CohortEvidenceConsent />);

    const toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    await waitFor(() => expect(toggle).toBeEnabled());
    expect(toggle).not.toBeChecked();
    expect(screen.getByTestId('cohort-evidence-window-state')).toHaveTextContent('No evidence window is active');

    fireEvent.click(toggle);

    await waitFor(() => expect(setConsent).toHaveBeenCalledWith(true));
    await waitFor(() => expect(toggle).toBeChecked());
    expect(screen.getByTestId('cohort-evidence-window-state')).toHaveTextContent('Active 14-day window');
  });

  it('revokes consent through the API and removes the active-window claim', async () => {
    const getStatus = vi.fn().mockResolvedValue(enabledStatus);
    const setConsent = vi.fn().mockResolvedValue(disabledResult);
    setApi({ cohortConsentStatus: getStatus, cohortSetConsent: setConsent });
    render(<CohortEvidenceConsent />);

    const toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    await waitFor(() => expect(toggle).toBeChecked());
    fireEvent.click(toggle);

    await waitFor(() => expect(setConsent).toHaveBeenCalledWith(false));
    await waitFor(() => expect(toggle).not.toBeChecked());
    expect(screen.getByTestId('cohort-evidence-window-state')).toHaveTextContent('No evidence window is active');
  });

  it('keeps the last confirmed choice when an enable or revoke request fails', async () => {
    const enable = vi.fn().mockRejectedValue(new Error('offline'));
    setApi({ cohortConsentStatus: vi.fn().mockResolvedValue(disabledStatus), cohortSetConsent: enable });
    const { unmount } = render(<CohortEvidenceConsent />);

    let toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('last confirmed choice'));
    expect(toggle).not.toBeChecked();

    unmount();
    const revoke = vi.fn().mockResolvedValue({ status: 'storage-error', consent: enabledStatus });
    setApi({ cohortConsentStatus: vi.fn().mockResolvedValue(enabledStatus), cohortSetConsent: revoke });
    render(<CohortEvidenceConsent />);
    toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    await waitFor(() => expect(toggle).toBeChecked());
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('last confirmed choice'));
    expect(toggle).toBeChecked();
  });

  it('fails closed on malformed enabled state instead of displaying false consent', async () => {
    setApi({
      cohortConsentStatus: vi.fn().mockResolvedValue({
        ...enabledStatus,
        observationWindow: { startMs: START, endMs: END + 1 },
        userComment: 'collect me',
      }),
      cohortSetConsent: vi.fn(),
    });
    render(<CohortEvidenceConsent />);

    await waitFor(() => expect(screen.getByText(/unavailable in this build/i)).toBeInTheDocument());
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('offers no freeform/content collection surface and explains the privacy boundary', async () => {
    setApi({ cohortConsentStatus: vi.fn().mockResolvedValue(disabledStatus), cohortSetConsent: vi.fn() });
    const { container } = render(<CohortEvidenceConsent />);
    await waitFor(() => expect(screen.getByRole('checkbox')).toBeEnabled());

    expect(container.querySelector('textarea')).toBeNull();
    expect(container.querySelector('input:not([type="checkbox"])')).toBeNull();
    expect(screen.getByText(/local aggregate evidence only/i)).toHaveTextContent(/never chat messages/i);
    expect(screen.getByText(/off until you explicitly enable it/i)).toHaveTextContent(/revoke consent at any time/i);
  });
});
