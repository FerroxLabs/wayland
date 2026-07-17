import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockDecide, mockResume } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockDecide: vi.fn(),
  mockResume: vi.fn(),
}));

vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => false }));
vi.mock('@renderer/services/ConstitutionService', () => ({
  getConstitutionClassicRecoveryHttp: mockGet,
  decideConstitutionClassicRecoveryHttp: mockDecide,
  resumeConstitutionClassicRecoveryHttp: mockResume,
  runDesktopConstitutionClassicRecoveryMetadata: vi.fn(),
  runDesktopConstitutionClassicRecoveryMutation: vi.fn(),
}));
vi.mock('@arco-design/web-react', () => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- Vitest mock factories cannot reference outer bindings.
  const TextInput = ({
    value,
    onChange,
    placeholder,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
  }) => (
    <input
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
  TextInput.Password = ({
    value,
    onChange,
    placeholder,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
  }) => (
    <input
      type='password'
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
  return {
    Button: ({
      children,
      onClick,
      disabled,
      loading,
      'aria-label': ariaLabel,
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; status?: string }) => (
      <button type='button' onClick={onClick} disabled={disabled || loading} aria-label={ariaLabel}>
        {children}
      </button>
    ),
    Input: TextInput,
  };
});

import ConstitutionClassicRecovery from '@renderer/pages/settings/ConstitutionSettings/ConstitutionClassicRecovery';

const projectionReceiptSha256 = `sha256:${'a'.repeat(64)}` as const;
const metadata = {
  success: true as const,
  data: {
    contract: 'wayland-constitution-classic-recovery-dto/1.0' as const,
    recoveryRevision: 'recovery:v1',
    projectionReceiptSha256,
    promotionId: null,
    journalHeadSha256: null,
    state: 'awaiting-decision' as const,
    items: [
      {
        objectId: 'constitution',
        operation: 'replace' as const,
        state: 'pending' as const,
        resultRevision: null,
        receiptId: null,
        conflictCode: null,
      },
    ],
    rescue: null,
    allowedActions: ['promote', 'keep-v2', 'discard'] as const,
    discardChallenge: 'DISCARD constitution',
  },
};

const committed = {
  success: true as const,
  data: {
    status: 'committed' as const,
    operationId: '11111111-1111-4111-8111-111111111111',
    recoveryRevision: 'recovery:v2',
    promotionId: '22222222-2222-4222-8222-222222222222',
    journalHeadSha256: `sha256:${'b'.repeat(64)}` as const,
    receiptId: 'receipt:v1',
    items: [],
    rescue: null,
  },
};

const executeExclusive = async <T,>(
  action: () => Promise<{ committed: boolean; value: T }>
): Promise<{ committed: boolean; value: T }> => action();

describe('ConstitutionClassicRecovery', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockGet.mockReset();
    mockGet.mockResolvedValue(metadata);
    mockDecide.mockReset();
    mockResume.mockReset();
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111');
  });

  it('stays absent on a cold profile without creating a recovery operation', async () => {
    mockGet.mockResolvedValue({
      success: false,
      error: {
        code: 'OPERATION_NOT_FOUND',
        message: 'Classic recovery is unavailable.',
        retryable: false,
        operationId: null,
      },
    });
    render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Classic session recovery')).not.toBeInTheDocument();
    expect(window.localStorage.length).toBe(0);
  });

  it('replays the same persisted operation identity after response loss and clears secrets', async () => {
    const onRestored = vi.fn();
    mockDecide.mockRejectedValueOnce(new Error('Connection lost after dispatch.')).mockResolvedValueOnce(committed);
    render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={onRestored}
      />
    );
    await screen.findByText('Classic session recovery');
    fireEvent.click(screen.getByRole('button', { name: 'Apply Classic work' }));
    const password = screen.getByPlaceholderText('Current Wayland password') as HTMLInputElement;
    fireEvent.change(password, { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await screen.findByText('Connection lost after dispatch.');

    expect(password.value).toBe('');
    expect(window.localStorage.length).toBe(1);
    fireEvent.change(password, { target: { value: 'correct-again' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));

    expect(mockDecide).toHaveBeenCalledTimes(2);
    expect(mockDecide.mock.calls[0][0].operationId).toBe('11111111-1111-4111-8111-111111111111');
    expect(mockDecide.mock.calls[1][0].operationId).toBe(mockDecide.mock.calls[0][0].operationId);
    expect(mockDecide.mock.calls[1][0].password).toBe('correct-again');
    expect(window.localStorage.length).toBe(0);
    expect(screen.queryByPlaceholderText('Current Wayland password')).not.toBeInTheDocument();
  });

  it('requires the exact discard challenge and sends the complete object inventory', async () => {
    mockDecide.mockResolvedValue(committed);
    render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    await screen.findByText('Classic session recovery');
    fireEvent.click(screen.getByRole('button', { name: 'Discard Classic changes' }));
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
    fireEvent.change(screen.getByPlaceholderText('Exact discard confirmation'), { target: { value: 'wrong' } });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Exact discard confirmation'), {
      target: { value: 'DISCARD constitution' },
    });
    expect(confirm).not.toBeDisabled();
    fireEvent.click(confirm);
    await waitFor(() => expect(mockDecide).toHaveBeenCalledTimes(1));
    expect(mockDecide.mock.calls[0][0].decision).toEqual({
      kind: 'discard',
      confirmedObjectIds: ['constitution'],
      confirmationText: 'DISCARD constitution',
    });
  });

  it.each(['INTEGRITY_FAILURE', 'NATIVE_FAILURE'] as const)(
    'retains the operation identity when %s leaves the commit outcome ambiguous',
    async (code) => {
      mockDecide.mockImplementationOnce(async (request) => ({
        success: false,
        error: {
          code,
          message: 'The native outcome is not yet authoritative.',
          retryable: false,
          operationId: request.operationId,
        },
      }));
      render(
        <ConstitutionClassicRecovery
          principalScope='hosted:user-1'
          executeExclusive={executeExclusive}
          onRestored={vi.fn()}
        />
      );
      await screen.findByText('Classic session recovery');
      fireEvent.click(screen.getByRole('button', { name: 'Apply Classic work' }));
      fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      await screen.findByText('The native outcome is not yet authoritative.');

      expect(window.localStorage.length).toBe(1);
      expect(window.localStorage.getItem(window.localStorage.key(0)!)).toContain(
        '11111111-1111-4111-8111-111111111111'
      );
    }
  );

  it('does not expose portable transfer or destructive rescue lifecycle controls', async () => {
    render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    await screen.findByText('Classic session recovery');
    for (const forbidden of [/export rescue/i, /import rescue/i, /delete rescue/i, /purge rescue/i, /prune rescue/i]) {
      expect(screen.queryByRole('button', { name: forbidden })).not.toBeInTheDocument();
    }
  });
});
