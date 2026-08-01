import { IDBFactory } from 'fake-indexeddb';
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockList, mockReadSpecialist, mockRestore } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockReadSpecialist: vi.fn(),
  mockRestore: vi.fn(),
}));

vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => false }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
vi.mock('@renderer/services/ConstitutionService', () => ({
  listConstitutionArchivesHttp: mockList,
  readConstitutionSpecialistHttp: mockReadSpecialist,
  restoreConstitutionArchiveHttp: mockRestore,
  runDesktopConstitutionArchiveInventory: vi.fn(),
  runDesktopConstitutionArchiveRestore: vi.fn(),
  runDesktopConstitutionRead: vi.fn(),
}));
vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    loading,
    'aria-label': ariaLabel,
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
    <button type='button' onClick={onClick} disabled={disabled || loading} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  Input: {
    Password: ({
      value,
      onChange,
      placeholder,
      disabled,
    }: {
      value: string;
      onChange: (value: string) => void;
      placeholder: string;
      disabled?: boolean;
    }) => (
      <input
        type='password'
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  },
}));

import ConstitutionRecovery from '@renderer/pages/settings/ConstitutionSettings/ConstitutionRecovery';
import { withConstitutionRecoveryTransaction } from '@renderer/services/ConstitutionRecoveryOperationLock';

const archive = {
  archiveId: '11111111-1111-4111-8111-111111111111',
  archivedAt: '2026-07-17T01:02:03.004Z',
  targetKind: 'constitution' as const,
  specialistId: null,
  sourceName: 'CONSTITUTION.md',
  bytes: 42,
  targetRevision: 'rev:v1:archive',
};

const inventory = {
  success: true as const,
  data: { contract: 'wayland-constitution-archive-recovery-dto/1.0' as const, archives: [archive] },
};
const pendingKey = `wayland:constitution:archive-restore:hosted%3Auser-1:${archive.archiveId}`;
const secondArchive = {
  ...archive,
  archiveId: '44444444-4444-4444-8444-444444444444',
  archivedAt: '2026-07-17T01:04:05.006Z',
  sourceName: 'CONSTITUTION.previous.md',
  targetRevision: 'rev:v1:archive-previous',
};
const secondPendingKey = `wayland:constitution:archive-restore:hosted%3Auser-1:${secondArchive.archiveId}`;

function pendingRestore(
  overrides: Partial<{
    operationId: string;
    archiveId: string;
    expectedArchiveRevision: string;
    expectedRevision: string;
    createdAt: string;
  }> = {}
) {
  return {
    contract: 'wayland-constitution-archive-restore-client-operation/1.0',
    operationId: '22222222-2222-4222-8222-222222222222',
    archiveId: archive.archiveId,
    expectedArchiveRevision: archive.targetRevision,
    expectedRevision: 'rev:v1:target',
    createdAt: '2026-07-17T01:03:04.005Z',
    ...overrides,
  };
}

const executeExclusive = async <T,>(
  action: () => Promise<{ committed: boolean; value: T }>
): Promise<{ committed: boolean; value: T }> => action();

describe('ConstitutionRecovery', () => {
  beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    window.localStorage.clear();
    mockList.mockReset();
    mockList.mockResolvedValue(inventory);
    mockReadSpecialist.mockReset();
    mockRestore.mockReset();
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('22222222-2222-4222-8222-222222222222');
  });

  it('persists one operation before dispatch, resumes authentication, and clears it only after commit', async () => {
    const onRestored = vi.fn();
    mockRestore
      .mockImplementationOnce(async (request) => {
        const key = window.localStorage.key(0);
        expect(key).not.toBeNull();
        expect(window.localStorage.getItem(key!)).toContain(request.operationId);
        return {
          success: false,
          error: {
            code: 'AUTH_FAILED',
            message: 'Authentication failed.',
            retryable: true,
            operationId: request.operationId,
          },
        };
      })
      .mockImplementationOnce(async (request) => ({
        success: true,
        data: {
          status: 'committed',
          operationId: request.operationId,
          revision: 'rev:v1:restored',
          receiptId: 'receipt:v1:restored',
        },
      }));

    render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:target'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={onRestored}
      />
    );
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: /Main Constitution/i }));
    const password = screen.getByPlaceholderText('Current Wayland password') as HTMLInputElement;
    fireEvent.change(password, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));
    await waitFor(() => expect(mockRestore).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(password.value).toBe(''));

    expect(mockRestore.mock.calls[0][0]).toEqual({
      operationId: '22222222-2222-4222-8222-222222222222',
      archiveId: archive.archiveId,
      expectedArchiveRevision: archive.targetRevision,
      password: 'wrong',
      expectedRevision: 'rev:v1:target',
    });
    expect(window.localStorage.length).toBe(1);

    fireEvent.change(password, { target: { value: 'correct' } });
    await waitFor(() =>
      expect((screen.getByRole('button', { name: 'Restore archive' }) as HTMLButtonElement).disabled).toBe(false)
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));
    await waitFor(() => expect(mockRestore).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(window.localStorage.length).toBe(0));

    expect(mockRestore.mock.calls[1][0].operationId).toBe(mockRestore.mock.calls[0][0].operationId);
    expect(window.localStorage.length).toBe(0);
    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));
  });

  it('mints and dispatches a cryptographic UUID when remote HTTP lacks randomUUID', async () => {
    const originalRandomUuid = globalThis.crypto.randomUUID;
    Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: undefined });
    mockRestore.mockImplementationOnce(async (request) => ({
      success: true,
      data: {
        status: 'committed',
        operationId: request.operationId,
        revision: 'rev:v1:restored',
        receiptId: 'receipt:v1:restored',
      },
    }));

    try {
      render(
        <ConstitutionRecovery
          expectedRevision='rev:v1:target'
          principalScope='hosted:user-1'
          executeExclusive={executeExclusive}
          onRestored={vi.fn()}
        />
      );
      await act(async () => Promise.resolve());
      fireEvent.click(screen.getByRole('button', { name: /Main Constitution/i }));
      fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
      fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));
      await waitFor(() => expect(mockRestore).toHaveBeenCalledTimes(1));

      expect(mockRestore.mock.calls[0][0].operationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    } finally {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        configurable: true,
        value: originalRandomUuid,
      });
    }
  });

  it('clears password and stale operation identity on a non-retryable conflict', async () => {
    mockRestore.mockImplementationOnce(async (request) => ({
      success: false,
      error: {
        code: 'STALE_TARGET_REVISION',
        message: 'Reload before retrying.',
        retryable: false,
        operationId: request.operationId,
      },
    }));
    render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:target'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: /Main Constitution/i }));
    const password = screen.getByPlaceholderText('Current Wayland password') as HTMLInputElement;
    fireEvent.change(password, { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));
    await waitFor(() => expect(mockRestore).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(window.localStorage.length).toBe(0));

    expect(password.value).toBe('');
    expect(window.localStorage.length).toBe(0);
    expect(screen.getByRole('alert')).toHaveTextContent('Reload before retrying.');
  });

  it.each(['INTEGRITY_FAILURE', 'NATIVE_FAILURE'] as const)(
    'retains the operation identity when %s leaves the commit outcome ambiguous',
    async (code) => {
      mockRestore.mockImplementationOnce(async (request) => ({
        success: false,
        error: {
          code,
          message: 'The native outcome is not yet authoritative.',
          retryable: false,
          operationId: request.operationId,
        },
      }));
      render(
        <ConstitutionRecovery
          expectedRevision='rev:v1:target'
          principalScope='hosted:user-1'
          executeExclusive={executeExclusive}
          onRestored={vi.fn()}
        />
      );
      await act(async () => Promise.resolve());
      fireEvent.click(screen.getByRole('button', { name: /Main Constitution/i }));
      fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
      fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));
      await waitFor(() => expect(mockRestore).toHaveBeenCalledTimes(1));

      expect(window.localStorage.length).toBe(1);
      expect(window.localStorage.getItem(window.localStorage.key(0)!)).toContain(
        '22222222-2222-4222-8222-222222222222'
      );
    }
  );

  it('binds a specialist restore to the selected specialist live revision', async () => {
    const specialistArchive = {
      ...archive,
      archiveId: '33333333-3333-4333-8333-333333333333',
      targetKind: 'specialist' as const,
      specialistId: 'research',
      sourceName: 'research.md',
    };
    mockList.mockResolvedValue({
      ...inventory,
      data: { ...inventory.data, archives: [specialistArchive] },
    });
    mockReadSpecialist.mockResolvedValue({ state: 'present', content: 'current', revision: 'rev:specialist:live' });
    mockRestore.mockImplementationOnce(async (restoreRequest) => ({
      success: true,
      data: {
        status: 'committed',
        operationId: restoreRequest.operationId,
        revision: 'rev:specialist:restored',
        receiptId: 'receipt:specialist:restored',
      },
    }));

    render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:main'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: /Specialist: research/i }));
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));
    await waitFor(() => expect(mockRestore).toHaveBeenCalledTimes(1));

    expect(mockReadSpecialist).toHaveBeenCalledWith('research');
    expect(mockRestore.mock.calls[0][0].expectedRevision).toBe('rev:specialist:live');
  });

  it('fails closed without minting or dispatching over malformed durable evidence', async () => {
    const unsupported = JSON.stringify({ contract: 'attacker-operation/99.0', operationId: 'forged' });
    window.localStorage.setItem(pendingKey, unsupported);

    render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:target'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Pending archive restore evidence has an unsupported shape.'
    );
    expect(screen.getByRole('button', { name: /Main Constitution/i })).toBeDisabled();
    expect(mockRestore).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(pendingKey)).toBe(unsupported);
  });

  it.each([
    [
      'a non-v4 archive ID',
      'wayland:constitution:archive-restore:hosted%3Auser-1:not-an-archive-uuid',
      pendingRestore({ archiveId: 'not-an-archive-uuid' }),
    ],
    ['a decomposed archive revision', pendingKey, pendingRestore({ expectedArchiveRevision: 'rev:e\u0301' })],
    ['a control character in the target revision', pendingKey, pendingRestore({ expectedRevision: 'rev:\nnext' })],
    ['an over-limit target revision', pendingKey, pendingRestore({ expectedRevision: 'r'.repeat(4097) })],
    ['an inexact creation timestamp', pendingKey, pendingRestore({ createdAt: '2026-07-17T01:03:04Z' })],
    ['an impossible creation date', pendingKey, pendingRestore({ createdAt: '2026-02-31T01:03:04.005Z' })],
  ])('preserves shaped durable evidence with %s without dispatch', async (_case, key, record) => {
    const raw = JSON.stringify(record);
    window.localStorage.setItem(key, raw);

    render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:target'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Pending archive restore evidence failed validation.');
    expect(mockRestore).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(key)).toBe(raw);
  });

  it('fails closed over multiple pending archive identities', async () => {
    window.localStorage.setItem(pendingKey, JSON.stringify(pendingRestore()));
    window.localStorage.setItem(
      secondPendingKey,
      JSON.stringify(
        pendingRestore({
          operationId: '44444444-4444-4444-8444-444444444444',
          archiveId: secondArchive.archiveId,
          expectedArchiveRevision: secondArchive.targetRevision,
        })
      )
    );

    render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:target'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Multiple pending archive restores are ambiguous and require supervised recovery.'
    );
    expect(mockRestore).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(pendingKey)).not.toBeNull();
    expect(window.localStorage.getItem(secondPendingKey)).not.toBeNull();
  });

  it('does not mint a second identity while another archive restore is pending', async () => {
    window.localStorage.setItem(pendingKey, JSON.stringify(pendingRestore()));
    mockList.mockResolvedValue({
      ...inventory,
      data: { ...inventory.data, archives: [archive, secondArchive] },
    });

    render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:target'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    fireEvent.click(await screen.findByRole('button', { name: /CONSTITUTION.previous.md/i }));
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));

    expect(await screen.findByText('Another pending archive restore must be reconciled before starting a new one.'));
    expect(mockRestore).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(secondPendingKey)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(pendingKey)!)).toMatchObject({
      operationId: '22222222-2222-4222-8222-222222222222',
    });
  });

  it('serializes two renderer roots onto one archive operation identity', async () => {
    const firstOperationId = '22222222-2222-4222-8222-222222222222';
    const secondOperationId = '33333333-3333-4333-8333-333333333333';
    vi.mocked(globalThis.crypto.randomUUID)
      .mockReturnValueOnce(firstOperationId)
      .mockReturnValueOnce(secondOperationId);
    mockRestore.mockImplementation(async (request) => ({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Authorize again.',
        retryable: true,
        operationId: request.operationId,
      },
    }));

    const first = render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:target'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    const second = render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:target'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    const firstRoot = within(first.container);
    const secondRoot = within(second.container);
    fireEvent.click(await firstRoot.findByRole('button', { name: /Main Constitution/i }));
    fireEvent.click(await secondRoot.findByRole('button', { name: /Main Constitution/i }));
    fireEvent.change(firstRoot.getByPlaceholderText('Current Wayland password'), { target: { value: 'first' } });
    fireEvent.change(secondRoot.getByPlaceholderText('Current Wayland password'), { target: { value: 'second' } });
    fireEvent.click(firstRoot.getByRole('button', { name: 'Restore archive' }));
    fireEvent.click(secondRoot.getByRole('button', { name: 'Restore archive' }));

    await waitFor(() => expect(mockRestore).toHaveBeenCalledTimes(2));
    expect(mockRestore.mock.calls.map(([request]) => request.operationId)).toEqual([
      firstOperationId,
      firstOperationId,
    ]);
    expect(JSON.parse(window.localStorage.getItem(pendingKey)!)).toMatchObject({ operationId: firstOperationId });
  });

  it('preserves a queued replacement when an older success reaches conditional clear', async () => {
    let resolveRestore!: (value: unknown) => void;
    mockRestore.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRestore = resolve;
        })
    );
    render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:target'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={vi.fn()}
      />
    );
    fireEvent.click(await screen.findByRole('button', { name: /Main Constitution/i }));
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));
    await waitFor(() => expect(mockRestore).toHaveBeenCalledTimes(1));

    const replacement = pendingRestore({
      operationId: '33333333-3333-4333-8333-333333333333',
      createdAt: '2026-07-17T02:03:04.005Z',
    });
    await withConstitutionRecoveryTransaction('hosted:user-1', () => {
      window.localStorage.setItem(pendingKey, JSON.stringify(replacement));
    });
    resolveRestore({
      success: true,
      data: {
        status: 'committed',
        operationId: '22222222-2222-4222-8222-222222222222',
        revision: 'rev:v1:restored',
        receiptId: 'receipt:v1:restored',
      },
    });

    await screen.findByText('Another pending operation was preserved for review.', { exact: false });
    expect(JSON.parse(window.localStorage.getItem(pendingKey)!)).toEqual(replacement);
  });

  it('surfaces and replays an operation after committed response loss retires its source row', async () => {
    const onRestored = vi.fn();
    mockRestore
      .mockImplementationOnce(async () => {
        mockList.mockResolvedValue({ ...inventory, data: { ...inventory.data, archives: [] } });
        throw new Error('Connection lost after the restore committed.');
      })
      .mockImplementationOnce(async (request) => ({
        success: true,
        data: {
          status: 'committed',
          operationId: request.operationId,
          revision: 'rev:v1:restored',
          receiptId: 'receipt:v1:replayed',
        },
      }));
    render(
      <ConstitutionRecovery
        expectedRevision='rev:v1:target'
        principalScope='hosted:user-1'
        executeExclusive={executeExclusive}
        onRestored={onRestored}
      />
    );
    fireEvent.click(await screen.findByRole('button', { name: /Main Constitution/i }));
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'first' } });
    fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));

    await screen.findByText('Connection lost after the restore committed.');
    await screen.findByRole('button', { name: new RegExp(`Pending archive replay: ${archive.archiveId}`) });
    fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'second' } });
    const retryButton = screen.getByRole('button', { name: 'Restore archive' });
    await waitFor(() => expect(retryButton).toBeEnabled());
    fireEvent.click(retryButton);

    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));
    expect(mockRestore).toHaveBeenCalledTimes(2);
    expect(mockRestore.mock.calls[1][0]).toEqual({
      ...mockRestore.mock.calls[0][0],
      password: 'second',
    });
    expect(window.localStorage.getItem(pendingKey)).toBeNull();
  });
});
