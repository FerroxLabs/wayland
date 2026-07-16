import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDelete, mockList, mockRead, mockWrite } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockList: vi.fn(),
  mockRead: vi.fn(),
  mockWrite: vi.fn(),
}));

vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => false }));
vi.mock('@/renderer/hooks/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@renderer/services/ConstitutionService', () => ({
  deleteConstitutionSpecialistHttp: mockDelete,
  listConstitutionSpecialistsHttp: mockList,
  readConstitutionSpecialistHttp: mockRead,
  writeConstitutionSpecialistHttp: mockWrite,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
vi.mock('@renderer/pages/settings/ConstitutionSettings/HostedEditAuthorization', () => ({
  default: ({
    onGranted,
    scopes,
  }: {
    onGranted: (grant: { token: string; expiresAt: number }) => void;
    scopes: string[];
  }) => (
    <button type='button' onClick={() => onGranted({ token: 'opaque-grant', expiresAt: Date.now() + 60_000 })}>
      Authorize {scopes.join(',')}
    </button>
  ),
}));
vi.mock('@renderer/pages/settings/ConstitutionSettings/SpecialistOverlayEditor', () => ({
  default: ({
    id,
    onDirtyChange,
    onCommitted,
    locked,
  }: {
    id: string;
    onDirtyChange?: (dirty: boolean) => void;
    onCommitted?: (result: { revision: string; bytes: number }) => void;
    locked?: boolean;
  }) => (
    <div>
      Editor {id}
      <button type='button' disabled={locked} onClick={() => onDirtyChange?.(true)}>
        Simulate dirty
      </button>
      <button
        type='button'
        onClick={() => {
          onCommitted?.({ revision: 'rev:copy:00000009', bytes: 99 });
          onDirtyChange?.(false);
        }}
      >
        Simulate committed
      </button>
    </div>
  ),
}));
vi.mock('@arco-design/web-react', () => {
  const Input = ({
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
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
  Input.Password = Input;
  return {
    Button: ({ children, onClick, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type='button' onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
    Input,
  };
});

import SpecialistOverlays from '@renderer/pages/settings/ConstitutionSettings/SpecialistOverlays';

const copyEntry = { id: 'copy', bytes: 40, revision: 'rev:copy:00000001' };
const committed = (revision: string) => ({
  ok: true as const,
  revision,
  receiptId: 'receipt:specialist:00000001',
});

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('Hosted SpecialistOverlays journey', () => {
  beforeEach(() => {
    mockDelete.mockReset().mockResolvedValue(committed('rev:copy:absent002'));
    mockList.mockReset().mockResolvedValue([copyEntry]);
    mockRead.mockReset().mockResolvedValue({ state: 'absent', revision: 'rev:research:absent001' });
    mockWrite.mockReset().mockResolvedValue(committed('rev:research:00000001'));
  });

  it('loads the hosted inventory and opens an existing overlay', async () => {
    render(<SpecialistOverlays />);
    await act(async () => Promise.resolve());
    expect(screen.getByText('copy')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Editor copy')).toBeInTheDocument();
  });

  it('creates through a scoped grant, refreshes, and opens the new overlay', async () => {
    mockList
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'research', bytes: 0, revision: 'rev:research:00000001' }]);
    render(<SpecialistOverlays />);
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: 'Add overlay' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. copy, spark, humanizer'), {
      target: { value: 'research' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Authorize specialist.write:research' }));
    await act(async () => Promise.resolve());

    expect(mockRead).toHaveBeenCalledWith('research');
    expect(mockWrite).toHaveBeenCalledWith(
      'research',
      '',
      'rev:research:absent001',
      'opaque-grant',
      expect.any(String)
    );
    expect(mockList).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Editor research')).toBeInTheDocument();
  });

  it('binds deletion to the inventory revision and removes only after success', async () => {
    mockList.mockResolvedValueOnce([copyEntry]).mockResolvedValueOnce([]);
    render(<SpecialistOverlays />);
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.change(screen.getByPlaceholderText('WebUI password'), { target: { value: 'fresh-password' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    await act(async () => Promise.resolve());

    expect(mockDelete).toHaveBeenCalledWith('copy', 'fresh-password', 'rev:copy:00000001', expect.any(String));
    expect(screen.getByText(/No specialist overlays yet/)).toBeInTheDocument();
  });

  it('blocks a confirmed delete while autosave is dirty and then uses the newly committed revision', async () => {
    mockList.mockResolvedValueOnce([copyEntry]).mockResolvedValueOnce([]);
    render(<SpecialistOverlays />);
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.change(screen.getByPlaceholderText('WebUI password'), { target: { value: 'fresh-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simulate dirty' }));

    const confirmedDelete = screen.getAllByRole('button', { name: 'Delete' })[1];
    expect(confirmedDelete).toBeDisabled();
    fireEvent.click(confirmedDelete);
    expect(mockDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Simulate committed' }));
    expect(screen.getAllByRole('button', { name: 'Delete' })[1]).not.toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    await act(async () => Promise.resolve());
    expect(mockDelete).toHaveBeenCalledWith('copy', 'fresh-password', 'rev:copy:00000009', expect.any(String));
  });

  it('locks editing and duplicate submission for the full in-flight delete', async () => {
    const deletion = deferred<ReturnType<typeof committed>>();
    mockDelete.mockReturnValueOnce(deletion.promise);
    mockList.mockResolvedValueOnce([copyEntry]).mockResolvedValueOnce([]);
    render(<SpecialistOverlays />);
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.change(screen.getByPlaceholderText('WebUI password'), { target: { value: 'fresh-password' } });
    const confirmedDelete = screen.getAllByRole('button', { name: 'Delete' })[1];
    fireEvent.click(confirmedDelete);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Simulate dirty' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Delete' })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Delete' })[1]).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    expect(mockDelete).toHaveBeenCalledTimes(1);

    await act(async () => deletion.resolve(committed('rev:copy:absent002')));
    expect(screen.getByText(/No specialist overlays yet/)).toBeInTheDocument();
  });

  it('shows inventory failure without a false empty state and recovers on retry', async () => {
    mockList.mockRejectedValueOnce(new Error('inventory offline')).mockResolvedValueOnce([copyEntry]);
    render(<SpecialistOverlays />);
    await act(async () => Promise.resolve());
    expect(screen.getByText('inventory offline')).toBeInTheDocument();
    expect(screen.queryByText(/No specialist overlays yet/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry load' }));
    await act(async () => Promise.resolve());
    expect(screen.getByText('copy')).toBeInTheDocument();
  });
});
