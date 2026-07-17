import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

const executeExclusive = async <T,>(
  action: () => Promise<{ committed: boolean; value: T }>
): Promise<{ committed: boolean; value: T }> => action();

describe('ConstitutionRecovery', () => {
  beforeEach(() => {
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
    await act(async () => Promise.resolve());

    expect(password.value).toBe('');
    expect(mockRestore.mock.calls[0][0]).toEqual({
      operationId: '22222222-2222-4222-8222-222222222222',
      archiveId: archive.archiveId,
      expectedArchiveRevision: archive.targetRevision,
      password: 'wrong',
      expectedRevision: 'rev:v1:target',
    });
    expect(window.localStorage.length).toBe(1);

    fireEvent.change(password, { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));
    await act(async () => Promise.resolve());

    expect(mockRestore.mock.calls[1][0].operationId).toBe(mockRestore.mock.calls[0][0].operationId);
    expect(window.localStorage.length).toBe(0);
    expect(onRestored).toHaveBeenCalledTimes(1);
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
    await act(async () => Promise.resolve());

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
      await act(async () => Promise.resolve());

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
    await act(async () => Promise.resolve());

    expect(mockReadSpecialist).toHaveBeenCalledWith('research');
    expect(mockRestore.mock.calls[0][0].expectedRevision).toBe('rev:specialist:live');
  });
});
