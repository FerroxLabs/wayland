/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CohortAssignmentStatus } from '@/common/types/cohortRollout';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const messages: Record<string, string> = {
        'settings.navigationPage.cohortAssignmentLabel': 'Your evaluation group',
        'settings.navigationPage.cohortAssignmentHelp': 'Wayland validates the effective group.',
        'settings.navigationPage.cohortAssignmentPlaceholder': 'Choose a group',
        'settings.navigationPage.cohortAssignmentActive': 'Locked while the current evidence window is active.',
        'settings.navigationPage.cohortAssignmentReady': 'Classification confirmed.',
        'settings.navigationPage.cohortAssignmentCompleted': 'The evidence window is complete and locked.',
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
        'settings.navigationPage.evidenceWindowCompleted': 'Completed 14-day window: {{start}} – {{end}}.',
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
  Select: ({
    value,
    disabled,
    onChange,
    options,
    'aria-label': ariaLabel,
    'data-testid': testId,
  }: {
    value?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
    options?: Array<{ value: string; label: string }>;
    'aria-label'?: string;
    'data-testid'?: string;
  }) => (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      <option value='' disabled />
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
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
  cohortAuthorityStatus?: ReturnType<typeof vi.fn>;
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
  if (!api) {
    Object.defineProperty(window, 'electronAPI', { configurable: true, writable: true, value: api });
    return;
  }
  const authorityStatus =
    api.cohortAuthorityStatus ??
    vi.fn(async () => {
      const assignment = (await api.cohortAssignmentStatus?.()) as CohortAssignmentStatus | undefined;
      return {
        generation: assignment?.available ? 1 : null,
        consent: await api.cohortConsentStatus?.(),
        assignment,
      };
    });
  const setConsent = api.cohortAuthorityStatus
    ? api.cohortSetConsent
    : api.cohortSetConsent
      ? vi.fn(async (enabled: boolean) => {
          const result = (await api.cohortSetConsent?.(enabled)) as Record<string, unknown>;
          const projected = (await api.cohortAssignmentStatus?.()) as CohortAssignmentStatus;
          const assignment =
            enabled && projected.observationState === 'ready'
              ? { ...projected, observationState: 'active' as const }
              : !enabled && projected.observationState === 'active'
                ? { ...projected, observationState: 'revoked' as const }
                : projected;
          return {
            ...result,
            generation: 2,
            assignment,
          };
        })
      : undefined;
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    writable: true,
    value: { ...api, cohortAuthorityStatus: authorityStatus, cohortSetConsent: setConsent },
  });
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

  it('accepts a process-owned locked projection while the system clock is before the immutable window', async () => {
    setApi({
      cohortAuthorityStatus: vi.fn().mockResolvedValue({
        generation: 1,
        consent: enabledStatus,
        assignment: { ...readyAssignment, observationState: 'locked' },
      }),
      cohortSetConsent: vi.fn(),
      cohortRequestAssignment: vi.fn(),
    });
    render(<CohortEvidenceConsent />);

    const selector = await screen.findByRole('combobox', { name: /evaluation group/i });
    await waitFor(() => expect(selector).toBeDisabled());
    expect(screen.getByRole('checkbox', { name: /collect local aggregate evidence/i })).toBeChecked();
    expect(screen.queryByText(/unavailable in this build/i)).not.toBeInTheDocument();
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

  it('[MF-03] consumes one aggregate generation for initial state and consent mutation', async () => {
    const authorityStatus = vi.fn().mockResolvedValue({
      generation: 1,
      consent: disabledStatus,
      assignment: readyAssignment,
    });
    const setConsent = vi.fn().mockResolvedValue({
      status: 'enabled',
      generation: 2,
      consent: enabledStatus,
      assignment: activeAssignment,
    });
    setApi({ cohortAuthorityStatus: authorityStatus, cohortSetConsent: setConsent, cohortRequestAssignment: vi.fn() });
    render(<CohortEvidenceConsent />);

    const toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toBeChecked());
    expect(authorityStatus).toHaveBeenCalledTimes(1);
    expect(setConsent).toHaveBeenCalledWith(true);
  });

  it('[MF-03] rejects a torn aggregate mutation response instead of joining incompatible state', async () => {
    const setConsent = vi.fn().mockResolvedValue({
      status: 'enabled',
      generation: 2,
      consent: enabledStatus,
      assignment: readyAssignment,
    });
    setApi({
      cohortAuthorityStatus: vi.fn().mockResolvedValue({
        generation: 1,
        consent: disabledStatus,
        assignment: readyAssignment,
      }),
      cohortSetConsent: setConsent,
      cohortRequestAssignment: vi.fn(),
    });
    render(<CohortEvidenceConsent />);

    const toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('last confirmed choice'));
    expect(toggle).not.toBeChecked();
  });

  it('[MF-03] rejects an available assignment without a matching authority generation', async () => {
    setApi({
      cohortAuthorityStatus: vi.fn().mockResolvedValue({
        generation: null,
        consent: disabledStatus,
        assignment: readyAssignment,
      }),
      cohortSetConsent: vi.fn(),
      cohortRequestAssignment: vi.fn(),
    });
    render(<CohortEvidenceConsent />);

    await waitFor(() => expect(screen.getByText(/unavailable in this build/i)).toBeInTheDocument());
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('[MF-04] renders a completed enabled window as a valid, controllable lifecycle', async () => {
    setApi({
      cohortAuthorityStatus: vi.fn().mockResolvedValue({
        generation: 3,
        consent: enabledStatus,
        assignment: { ...activeAssignment, observationState: 'completed' },
      }),
      cohortSetConsent: vi.fn(),
      cohortRequestAssignment: vi.fn(),
    });
    render(<CohortEvidenceConsent />);

    const toggle = await screen.findByRole('checkbox', { name: /collect local aggregate evidence/i });
    expect(toggle).toBeChecked();
    expect(toggle).toBeEnabled();
    expect(screen.getByTestId('cohort-assignment-state')).toHaveTextContent(/complete and locked/i);
    expect(screen.getByTestId('cohort-evidence-window-state')).toHaveTextContent(/completed 14-day window/i);
  });

  it('[LF-01] treats native assignment cancellation as neutral and preserves confirmed state', async () => {
    setApi({
      cohortAuthorityStatus: vi.fn().mockResolvedValue({
        generation: 1,
        consent: disabledStatus,
        assignment: readyAssignment,
      }),
      cohortSetConsent: vi.fn(),
      cohortRequestAssignment: vi.fn().mockResolvedValue({
        status: 'confirmation-denied',
        assignment: readyAssignment,
      }),
    });
    render(<CohortEvidenceConsent />);

    const select = await screen.findByTestId('cohort-assignment-select');
    fireEvent.change(select, { target: { value: 'operator' } });
    await waitFor(() => expect(select).toHaveValue('developer'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
