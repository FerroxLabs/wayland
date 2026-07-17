import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

const pendingKey = 'wayland:constitution:classic-recovery:hosted%3Auser-1';
const pendingLock = 'wayland:constitution:classic-recovery-lock:hosted%3Auser-1';
const lockQueues = new Map<string, Promise<void>>();
const activeLocks = new Set<string>();

const mockLockRequest = vi.fn(
  async <T,>(name: string, _options: LockOptions, callback: (lock: Lock | null) => Promise<T>): Promise<T> => {
    const previous = lockQueues.get(name) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    lockQueues.set(
      name,
      previous.then(() => current)
    );
    await previous;
    expect(activeLocks.has(name)).toBe(false);
    activeLocks.add(name);
    try {
      return await callback({ name, mode: 'exclusive' } as Lock);
    } finally {
      activeLocks.delete(name);
      release();
    }
  }
);

function pendingOperation(
  overrides: Partial<{
    operationId: string;
    action: 'promote' | 'keep-v2' | 'discard' | 'resume';
    projectionReceiptSha256: `sha256:${string}`;
    expectedRecoveryRevision: string;
    confirmedObjectIds: readonly string[];
    promotionId: string | null;
    expectedJournalHeadSha256: `sha256:${string}` | null;
    createdAt: string;
  }> = {}
) {
  return {
    contract: 'wayland-constitution-classic-recovery-client-operation/2.0',
    operationId: '33333333-3333-4333-8333-333333333333',
    action: 'keep-v2' as const,
    projectionReceiptSha256,
    expectedRecoveryRevision: 'recovery:v1',
    confirmedObjectIds: [] as readonly string[],
    promotionId: null,
    expectedJournalHeadSha256: null,
    createdAt: '2026-07-17T00:00:00.000Z',
    ...overrides,
  };
}

const executeExclusive = async <T,>(
  action: () => Promise<{ committed: boolean; value: T }>
): Promise<{ committed: boolean; value: T }> => action();

describe('ConstitutionClassicRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lockQueues.clear();
    activeLocks.clear();
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: { request: mockLockRequest },
    });
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

  it('retains and replays the operation identity when conflict follows an ambiguous dispatch', async () => {
    const onRestored = vi.fn();
    mockDecide
      .mockImplementationOnce(async (request) => ({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Classic recovery facts changed after dispatch.',
          retryable: false,
          operationId: request.operationId,
        },
      }))
      .mockResolvedValueOnce(committed);
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
    await screen.findByText('Classic recovery facts changed after dispatch.');

    expect(password.value).toBe('');
    expect(window.localStorage.length).toBe(1);
    expect(window.localStorage.getItem(window.localStorage.key(0)!)).toContain('11111111-1111-4111-8111-111111111111');

    fireEvent.change(password, { target: { value: 'correct-again' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));

    expect(mockDecide).toHaveBeenCalledTimes(2);
    expect(mockDecide.mock.calls[1][0].operationId).toBe(mockDecide.mock.calls[0][0].operationId);
    expect(mockDecide.mock.calls[1][0].password).toBe('correct-again');
    expect(window.localStorage.length).toBe(0);
  });

  it('retains an operation identity when a post-dispatch reconciliation reports an ID conflict', async () => {
    const onRestored = vi.fn();
    const driftedProjectionReceiptSha256 = `sha256:${'c'.repeat(64)}` as const;
    mockGet.mockResolvedValueOnce(metadata).mockResolvedValue({
      success: true,
      data: {
        ...metadata.data,
        recoveryRevision: 'recovery:v2',
        projectionReceiptSha256: driftedProjectionReceiptSha256,
      },
    });
    mockDecide
      .mockImplementationOnce(async (request) => ({
        success: false,
        error: {
          code: 'OPERATION_ID_CONFLICT',
          message: 'The dispatched operation conflicts with the recovered journal.',
          retryable: false,
          operationId: request.operationId,
        },
      }))
      .mockResolvedValueOnce(committed);
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
    await screen.findByText('The dispatched operation conflicts with the recovered journal.');
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));

    expect(password.value).toBe('');
    expect(window.localStorage.length).toBe(1);
    expect(window.localStorage.getItem(window.localStorage.key(0)!)).toContain('11111111-1111-4111-8111-111111111111');
    expect(screen.queryByRole('button', { name: 'Discard Classic changes' })).not.toBeInTheDocument();

    fireEvent.change(password, { target: { value: 'correct-again' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));

    expect(mockDecide).toHaveBeenCalledTimes(2);
    expect(mockDecide.mock.calls[1][0].operationId).toBe(mockDecide.mock.calls[0][0].operationId);
    expect(mockDecide.mock.calls[1][0].expectedRecoveryRevision).toBe(
      mockDecide.mock.calls[0][0].expectedRecoveryRevision
    );
    expect(mockDecide.mock.calls[1][0].expectedRecoveryRevision).toBe('recovery:v1');
    expect(mockDecide.mock.calls[1][0].projectionReceiptSha256).toBe(
      mockDecide.mock.calls[0][0].projectionReceiptSha256
    );
    expect(mockDecide.mock.calls[1][0].projectionReceiptSha256).toBe(projectionReceiptSha256);
    expect(window.localStorage.length).toBe(0);
  });

  it('keeps exact reconciliation available after an ambiguous failure refreshes to terminal metadata', async () => {
    const onRestored = vi.fn();
    const terminalMetadata = {
      success: true as const,
      data: {
        ...metadata.data,
        recoveryRevision: 'recovery:v2',
        state: 'committed' as const,
        items: [],
        allowedActions: [],
        discardChallenge: null,
      },
    };
    mockGet.mockResolvedValueOnce(metadata).mockResolvedValue(terminalMetadata);
    mockDecide
      .mockImplementationOnce(async (request) => ({
        success: false as const,
        error: {
          code: 'NATIVE_FAILURE' as const,
          message: 'Native dispatch completed but its receipt response was lost.',
          retryable: false,
          operationId: request.operationId,
        },
      }))
      .mockResolvedValueOnce(committed);

    render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={onRestored}
      />
    );
    await screen.findByText('Classic session recovery');
    fireEvent.click(screen.getByRole('button', { name: 'Apply Classic work' }));
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await screen.findByText('Native dispatch completed but its receipt response was lost.');
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));

    expect(screen.getByText('Classic work was applied')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply Classic work' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Keep current and preserve Classic' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct-again' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));

    expect(mockDecide).toHaveBeenCalledTimes(2);
    expect(mockDecide.mock.calls[1][0]).toMatchObject({
      operationId: mockDecide.mock.calls[0][0].operationId,
      expectedRecoveryRevision: mockDecide.mock.calls[0][0].expectedRecoveryRevision,
      projectionReceiptSha256: mockDecide.mock.calls[0][0].projectionReceiptSha256,
    });
  });

  it('replays the originally bound discard inventory across item and allowed-action drift', async () => {
    const onRestored = vi.fn();
    const driftedMetadata = {
      success: true as const,
      data: {
        ...metadata.data,
        recoveryRevision: 'recovery:v2',
        projectionReceiptSha256: `sha256:${'c'.repeat(64)}` as const,
        items: [
          {
            ...metadata.data.items[0],
            objectId: 'specialist:drifted',
          },
        ],
        allowedActions: ['keep-v2'] as const,
        discardChallenge: 'discard:drifted',
      },
    };
    mockGet.mockResolvedValueOnce(metadata).mockResolvedValue(driftedMetadata);
    mockDecide
      .mockImplementationOnce(async (request) => ({
        success: false as const,
        error: {
          code: 'NATIVE_FAILURE' as const,
          message: 'Discard receipt response was lost after dispatch.',
          retryable: false,
          operationId: request.operationId,
        },
      }))
      .mockResolvedValueOnce(committed);

    render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={onRestored}
      />
    );
    await screen.findByText('Classic session recovery');
    fireEvent.click(screen.getByRole('button', { name: 'Discard Classic changes' }));
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
    fireEvent.change(screen.getByPlaceholderText('Exact discard confirmation'), {
      target: { value: 'DISCARD constitution' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await screen.findByText('Discard receipt response was lost after dispatch.');
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));

    expect(screen.getByRole('button', { name: 'Discard Classic changes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Keep current and preserve Classic' })).not.toBeInTheDocument();
    expect(screen.getByText('RECONCILE PENDING DISCARD')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct-again' } });
    fireEvent.change(screen.getByPlaceholderText('Exact discard confirmation'), {
      target: { value: 'RECONCILE PENDING DISCARD' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));

    expect(mockDecide).toHaveBeenCalledTimes(2);
    expect(mockDecide.mock.calls[0][0].decision.confirmedObjectIds).toEqual(['constitution']);
    expect(mockDecide.mock.calls[1][0].decision).toEqual({
      kind: 'discard',
      confirmedObjectIds: ['constitution'],
      confirmationText: 'RECONCILE PENDING DISCARD',
    });
    expect(mockDecide.mock.calls[1][0].operationId).toBe(mockDecide.mock.calls[0][0].operationId);
    expect(mockDecide.mock.calls[1][0].expectedRecoveryRevision).toBe('recovery:v1');
    expect(mockDecide.mock.calls[1][0].projectionReceiptSha256).toBe(projectionReceiptSha256);
  });

  it('fails closed on unsupported durable evidence without minting or dispatching a replacement', async () => {
    const unsupported = JSON.stringify({
      contract: 'wayland-constitution-classic-recovery-client-operation/1.0',
      operationId: '11111111-1111-4111-8111-111111111111',
      action: 'promote',
      projectionReceiptSha256,
      expectedRecoveryRevision: 'recovery:v1',
      promotionId: null,
      expectedJournalHeadSha256: null,
      createdAt: '2026-07-17T00:00:00.000Z',
    });
    window.localStorage.setItem(pendingKey, unsupported);

    render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    await screen.findByText('Classic session recovery');

    expect(screen.getByRole('alert')).toHaveTextContent('No recovery action will run or replace this operation.');
    expect(screen.queryByRole('button', { name: 'Apply Classic work' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Current Wayland password')).not.toBeInTheDocument();
    expect(globalThis.crypto.randomUUID).not.toHaveBeenCalled();
    expect(mockDecide).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(pendingKey)).toBe(unsupported);
  });

  it('rejects a durable action change until the newly displayed destructive intent is authorized', async () => {
    const onRestored = vi.fn();
    mockDecide.mockResolvedValue(committed);
    render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={onRestored}
      />
    );
    await screen.findByText('Classic session recovery');
    fireEvent.click(screen.getByRole('button', { name: 'Apply Classic work' }));
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'promote-secret' } });

    const concurrentDiscard = pendingOperation({
      action: 'discard',
      confirmedObjectIds: ['constitution'],
    });
    window.localStorage.setItem(pendingKey, JSON.stringify(concurrentDiscard));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await screen.findByText('Pending Classic recovery changed. Review and authorize the current operation again.');

    expect(mockDecide).not.toHaveBeenCalled();
    expect(globalThis.crypto.randomUUID).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Discard Classic changes' })).toBeInTheDocument();
    expect(screen.getByText('RECONCILE PENDING DISCARD')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Current Wayland password')).toHaveValue('');

    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'discard-secret' } });
    fireEvent.change(screen.getByPlaceholderText('Exact discard confirmation'), {
      target: { value: 'RECONCILE PENDING DISCARD' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));
    expect(mockDecide).toHaveBeenCalledTimes(1);
    expect(mockDecide.mock.calls[0][0]).toMatchObject({
      operationId: concurrentDiscard.operationId,
      password: 'discard-secret',
      decision: {
        kind: 'discard',
        confirmedObjectIds: ['constitution'],
        confirmationText: 'RECONCILE PENDING DISCARD',
      },
    });
  });

  it('fails closed before minting or dispatch when cross-window lock authority is unavailable', async () => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
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
    await screen.findByText('Cross-window recovery transaction authority is unavailable.');

    expect(globalThis.crypto.randomUUID).not.toHaveBeenCalled();
    expect(mockDecide).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(pendingKey)).toBeNull();
    expect(screen.getByPlaceholderText('Current Wayland password')).toHaveValue('');
  });

  it('serializes two windows before absence can become a replacement write', async () => {
    let resolveFirst!: (value: typeof committed) => void;
    mockDecide.mockImplementationOnce(
      () =>
        new Promise<typeof committed>((resolve) => {
          resolveFirst = resolve;
        })
    );
    const first = render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    const second = render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    await Promise.all([
      within(first.container).findByText('Classic session recovery'),
      within(second.container).findByText('Classic session recovery'),
    ]);

    fireEvent.click(within(first.container).getByRole('button', { name: 'Apply Classic work' }));
    fireEvent.change(within(first.container).getByPlaceholderText('Current Wayland password'), {
      target: { value: 'first-secret' },
    });
    fireEvent.click(within(second.container).getByRole('button', { name: 'Discard Classic changes' }));
    fireEvent.change(within(second.container).getByPlaceholderText('Current Wayland password'), {
      target: { value: 'second-secret' },
    });
    fireEvent.change(within(second.container).getByPlaceholderText('Exact discard confirmation'), {
      target: { value: 'DISCARD constitution' },
    });

    fireEvent.click(within(first.container).getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(mockDecide).toHaveBeenCalledTimes(1));
    fireEvent.click(within(second.container).getByRole('button', { name: 'Confirm' }));
    await within(second.container).findByText(
      'Pending Classic recovery changed. Review and authorize the current operation again.'
    );

    expect(mockDecide).toHaveBeenCalledTimes(1);
    expect(globalThis.crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.localStorage.getItem(pendingKey)!)).toMatchObject({ action: 'promote' });
    expect(within(second.container).getByPlaceholderText('Current Wayland password')).toHaveValue('');

    resolveFirst(committed);
    await waitFor(() => expect(window.localStorage.getItem(pendingKey)).toBeNull());
    expect(mockLockRequest.mock.calls.every(([name]) => name === pendingLock)).toBe(true);
  });

  it.each([
    ['success', committed],
    [
      'producer-proven rollback',
      {
        success: false as const,
        error: {
          code: 'ROLLED_BACK' as const,
          message: 'The original operation was authoritatively rolled back.',
          retryable: false,
          operationId: '11111111-1111-4111-8111-111111111111',
        },
      },
    ],
  ] as const)('preserves a concurrently replaced operation after %s', async (_outcome, result) => {
    const onRestored = vi.fn();
    const replacement = pendingOperation({
      operationId: '44444444-4444-4444-8444-444444444444',
      expectedRecoveryRevision: 'recovery:v2',
      projectionReceiptSha256: `sha256:${'d'.repeat(64)}`,
    });
    mockDecide.mockImplementationOnce(async () => {
      window.localStorage.setItem(pendingKey, JSON.stringify(replacement));
      return result;
    });

    render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={onRestored}
      />
    );
    await screen.findByText('Classic session recovery');
    fireEvent.click(screen.getByRole('button', { name: 'Apply Classic work' }));
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await screen.findByText(/Another pending operation was preserved for review\./);

    expect(JSON.parse(window.localStorage.getItem(pendingKey)!)).toEqual(replacement);
    expect(screen.getByRole('button', { name: 'Keep current and preserve Classic' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Current Wayland password')).toHaveValue('');
    expect(onRestored).toHaveBeenCalledTimes(result.success ? 1 : 0);
  });

  it('clears secrets and resynchronizes when another window publishes a pending operation', async () => {
    render(
      <ConstitutionClassicRecovery
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    await screen.findByText('Classic session recovery');
    fireEvent.click(screen.getByRole('button', { name: 'Apply Classic work' }));
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'must-clear' } });

    const concurrentDiscard = pendingOperation({
      action: 'discard',
      confirmedObjectIds: ['constitution'],
    });
    const newValue = JSON.stringify(concurrentDiscard);
    window.localStorage.setItem(pendingKey, newValue);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: pendingKey,
        newValue,
      })
    );

    await screen.findByText('Pending Classic recovery changed in another window. Review and authorize it again.');
    expect(screen.getByRole('button', { name: 'Discard Classic changes' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Current Wayland password')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    expect(mockDecide).not.toHaveBeenCalled();
  });

  it('queues a replacement requested during terminal comparison until after the matching remove', async () => {
    const replacement = pendingOperation({
      operationId: '44444444-4444-4444-8444-444444444444',
      expectedRecoveryRevision: 'recovery:v2',
      projectionReceiptSha256: `sha256:${'d'.repeat(64)}`,
    });
    const originalGetItem = window.localStorage.getItem.bind(window.localStorage);
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    const originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage);
    let terminalReturned = false;
    let replacementQueued = false;
    let replacementWrite: Promise<unknown> | null = null;
    let lockedReads = 0;
    const events: string[] = [];
    mockDecide.mockImplementationOnce(async () => {
      terminalReturned = true;
      return committed;
    });
    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
      const value = originalGetItem(key);
      if (key === pendingKey && activeLocks.has(pendingLock)) {
        lockedReads += 1;
        if (terminalReturned && value !== null && !replacementQueued) {
          replacementQueued = true;
          replacementWrite = navigator.locks.request(pendingLock, { mode: 'exclusive' }, async () => {
            events.push('replacement');
            localStorage.setItem(pendingKey, JSON.stringify(replacement));
          });
        }
      }
      return value;
    });
    const setItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === pendingKey) expect(activeLocks.has(pendingLock)).toBe(true);
      return originalSetItem(key, value);
    });
    const removeItem = vi.spyOn(window.localStorage, 'removeItem').mockImplementation((key) => {
      if (key === pendingKey) {
        expect(activeLocks.has(pendingLock)).toBe(true);
        events.push('remove');
      }
      return originalRemoveItem(key);
    });

    try {
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

      await screen.findByText('Classic recovery completed with a durable receipt.');
      expect(replacementQueued).toBe(true);
      if (!replacementWrite) throw new Error('The hostile replacement was not queued.');
      await replacementWrite;
      expect(JSON.parse(window.localStorage.getItem(pendingKey)!)).toEqual(replacement);
      expect(events).toEqual(['remove', 'replacement']);
      expect(lockedReads).toBeGreaterThanOrEqual(3);
      expect(mockLockRequest.mock.calls.every(([name]) => name === pendingLock)).toBe(true);
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
      removeItem.mockRestore();
    }
  });

  it('clears the operation identity after a producer-proven terminal rollback', async () => {
    mockDecide.mockImplementationOnce(async (request) => ({
      success: false,
      error: {
        code: 'ROLLED_BACK',
        message: 'The operation was authoritatively rolled back.',
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
    const password = screen.getByPlaceholderText('Current Wayland password') as HTMLInputElement;
    fireEvent.change(password, { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await screen.findByText('The operation was authoritatively rolled back.');

    expect(password.value).toBe('');
    expect(window.localStorage.length).toBe(0);
  });

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
