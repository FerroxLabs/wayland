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
    t: (key: string, options?: Record<string, unknown>) => {
      const messages: Record<string, string> = {
        'settings.navigationPage.cohortAssignmentLabel': 'Your evaluation group',
        'settings.navigationPage.cohortAssignmentHelp': 'Wayland validates the effective group.',
        'settings.navigationPage.cohortAssignmentPlaceholder': 'Choose a group',
        'settings.navigationPage.cohortAssignmentActive': 'Locked while the current evidence window is active.',
        'settings.navigationPage.cohortAssignmentReady': 'Classification confirmed.',
        'settings.navigationPage.cohortAssignmentUnavailable': 'Choose a group before starting.',
        'settings.navigationPage.cohort.novice': 'Getting started',
        'settings.navigationPage.cohort.knowledge-work': 'Knowledge work',
        'settings.navigationPage.cohort.developer': 'Developer',
        'settings.navigationPage.cohort.operator': 'Operator',
        'settings.navigationPage.evidenceChecking': 'Checking consent and classification…',
        'settings.navigationPage.evidenceUnavailable':
          'Evidence sharing is unavailable in this build, so it remains off.',
        'settings.navigationPage.evidenceWindowInactive': 'No evidence window is active.',
        'settings.navigationPage.evidenceWindowActive': 'Active 14-day window: {{start}} – {{end}}.',
        'settings.navigationPage.evidenceConsentLabel': 'Collect local aggregate evidence',
        'settings.navigationPage.evidenceConsentHelp':
          'Local aggregate evidence only. Never chat messages, prompts, file contents, filenames, paths, URLs, tool arguments, or free-form text.',
        'settings.navigationPage.evidenceConsentControl':
          'Off until you explicitly enable it. You can revoke consent at any time.',
        'settings.navigationPage.evidenceConsentUpdateFailed':
          "Wayland couldn't update this setting. The last confirmed choice remains in effect.",
      };
      let value = messages[key] ?? key;
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
  cohortAssignmentStatus?: ReturnType<typeof vi.fn>;
  cohortRequestAssignment?: ReturnType<typeof vi.fn>;
};

const readyAssignment = Object.freeze({
  available: true,
  effectiveCohort: 'developer',
  classifiedAtMs: START,
  observationState: 'ready',
});

const activeAssignment = Object.freeze({ ...readyAssignment, observationState: 'active' });

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
    setApi({
      cohortConsentStatus: getStatus,
      cohortSetConsent: setConsent,
      cohortAssignmentStatus: vi.fn().mockResolvedValue(readyAssignment),
      cohortRequestAssignment: vi.fn(),
    });
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
    setApi({
      cohortConsentStatus: getStatus,
      cohortSetConsent: setConsent,
      cohortAssignmentStatus: vi.fn().mockResolvedValue(activeAssignment),
      cohortRequestAssignment: vi.fn(),
    });
    render(<CohortEvidenceConsent />);

    const toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    await waitFor(() => expect(toggle).toBeChecked());
    fireEvent.click(toggle);

    await waitFor(() => expect(setConsent).toHaveBeenCalledWith(false));
    await waitFor(() => expect(toggle).not.toBeChecked());
    expect(screen.getByTestId('cohort-evidence-window-state')).toHaveTextContent('No evidence window is active');
  });

  it('[WR-02] refreshes assignment projection after successful enable and revoke', async () => {
    const enableAssignmentStatus = vi
      .fn()
      .mockResolvedValueOnce(readyAssignment)
      .mockResolvedValueOnce(activeAssignment);
    setApi({
      cohortConsentStatus: vi.fn().mockResolvedValue(disabledStatus),
      cohortSetConsent: vi.fn().mockResolvedValue(enabledResult),
      cohortAssignmentStatus: enableAssignmentStatus,
      cohortRequestAssignment: vi.fn(),
    });
    const enabled = render(<CohortEvidenceConsent />);
    let toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toBeChecked());
    const enabledSelectorLocked = (screen.getByRole('combobox', { name: /evaluation group/i }) as HTMLSelectElement)
      .disabled;
    enabled.unmount();

    const lockedAssignment = { ...readyAssignment, observationState: 'locked' } as const;
    const revokeAssignmentStatus = vi
      .fn()
      .mockResolvedValueOnce(activeAssignment)
      .mockResolvedValueOnce(lockedAssignment);
    setApi({
      cohortConsentStatus: vi.fn().mockResolvedValue(enabledStatus),
      cohortSetConsent: vi.fn().mockResolvedValue(disabledResult),
      cohortAssignmentStatus: revokeAssignmentStatus,
      cohortRequestAssignment: vi.fn(),
    });
    render(<CohortEvidenceConsent />);
    toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    await waitFor(() => expect(toggle).toBeChecked());
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).not.toBeChecked());

    expect({
      enableAssignmentRefreshes: enableAssignmentStatus.mock.calls.length,
      enabledSelectorLocked,
      revokeAssignmentRefreshes: revokeAssignmentStatus.mock.calls.length,
    }).toEqual({
      enableAssignmentRefreshes: 2,
      enabledSelectorLocked: true,
      revokeAssignmentRefreshes: 2,
    });
  });

  it('keeps the last confirmed choice when an enable or revoke request fails', async () => {
    const enable = vi.fn().mockRejectedValue(new Error('offline'));
    setApi({
      cohortConsentStatus: vi.fn().mockResolvedValue(disabledStatus),
      cohortSetConsent: enable,
      cohortAssignmentStatus: vi.fn().mockResolvedValue(readyAssignment),
      cohortRequestAssignment: vi.fn(),
    });
    const { unmount } = render(<CohortEvidenceConsent />);

    let toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('last confirmed choice'));
    expect(toggle).not.toBeChecked();

    unmount();
    const revoke = vi.fn().mockResolvedValue({ status: 'storage-error', consent: enabledStatus });
    setApi({
      cohortConsentStatus: vi.fn().mockResolvedValue(enabledStatus),
      cohortSetConsent: revoke,
      cohortAssignmentStatus: vi.fn().mockResolvedValue(activeAssignment),
      cohortRequestAssignment: vi.fn(),
    });
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
      cohortAssignmentStatus: vi.fn().mockResolvedValue(readyAssignment),
      cohortRequestAssignment: vi.fn(),
    });
    render(<CohortEvidenceConsent />);

    await waitFor(() => expect(screen.getByText(/unavailable in this build/i)).toBeInTheDocument());
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('requests a closed classification and displays only the acknowledged effective cohort', async () => {
    const unavailableAssignment = {
      available: false,
      effectiveCohort: null,
      classifiedAtMs: null,
      observationState: 'unavailable',
    };
    const requestAssignment = vi.fn().mockResolvedValue({
      status: 'classified',
      assignment: { ...readyAssignment, effectiveCohort: 'operator' },
    });
    setApi({
      cohortConsentStatus: vi.fn().mockResolvedValue(disabledStatus),
      cohortSetConsent: vi.fn(),
      cohortAssignmentStatus: vi.fn().mockResolvedValue(unavailableAssignment),
      cohortRequestAssignment: requestAssignment,
    });
    render(<CohortEvidenceConsent />);

    const selector = await screen.findByRole('combobox', { name: /evaluation group/i });
    await waitFor(() => expect(selector).toBeEnabled());
    expect(screen.getByRole('checkbox')).toBeDisabled();
    fireEvent.change(selector, { target: { value: 'operator' } });
    await waitFor(() => expect(requestAssignment).toHaveBeenCalledWith('operator'));
    await waitFor(() => expect(selector).toHaveValue('operator'));
    expect(screen.getByRole('checkbox')).toBeEnabled();
  });

  it('keeps cohort selection locked after consent withdrawal during the original window', async () => {
    setApi({
      cohortConsentStatus: vi.fn().mockResolvedValue(disabledStatus),
      cohortSetConsent: vi.fn(),
      cohortAssignmentStatus: vi.fn().mockResolvedValue({ ...readyAssignment, observationState: 'locked' }),
      cohortRequestAssignment: vi.fn(),
    });
    render(<CohortEvidenceConsent />);

    const selector = await screen.findByRole('combobox', { name: /evaluation group/i });
    await waitFor(() => expect(selector).toBeDisabled());
    expect(screen.getByTestId('cohort-assignment-state')).toHaveTextContent(/locked/i);
  });

  it('fails closed on a forged effective assignment projection', async () => {
    setApi({
      cohortConsentStatus: vi.fn().mockResolvedValue(disabledStatus),
      cohortSetConsent: vi.fn(),
      cohortAssignmentStatus: vi.fn().mockResolvedValue({ ...readyAssignment, effectiveCohort: 'executive' }),
      cohortRequestAssignment: vi.fn(),
    });
    render(<CohortEvidenceConsent />);

    await waitFor(() => expect(screen.getByText(/unavailable in this build/i)).toBeInTheDocument());
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('offers no freeform/content collection surface and explains the privacy boundary', async () => {
    setApi({
      cohortConsentStatus: vi.fn().mockResolvedValue(disabledStatus),
      cohortSetConsent: vi.fn(),
      cohortAssignmentStatus: vi.fn().mockResolvedValue(readyAssignment),
      cohortRequestAssignment: vi.fn(),
    });
    const { container } = render(<CohortEvidenceConsent />);
    await waitFor(() => expect(screen.getByRole('checkbox')).toBeEnabled());

    expect(container.querySelector('textarea')).toBeNull();
    expect(container.querySelector('input:not([type="checkbox"])')).toBeNull();
    expect(screen.getByText(/local aggregate evidence only/i)).toHaveTextContent(/never chat messages/i);
    expect(screen.getByText(/off until you explicitly enable it/i)).toHaveTextContent(/revoke consent at any time/i);
  });
});
