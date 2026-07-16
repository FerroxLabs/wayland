import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRead, mockWrite, mockReset } = vi.hoisted(() => ({
  mockRead: vi.fn(),
  mockWrite: vi.fn(),
  mockReset: vi.fn(),
}));

vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => false }));
vi.mock('@/renderer/hooks/context/LayoutContext', () => ({ useLayoutContext: () => ({ isMobile: false }) }));
vi.mock('@/renderer/hooks/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
vi.mock('@renderer/services/ConstitutionService', () => ({
  readConstitutionHttp: mockRead,
  writeConstitutionHttp: mockWrite,
  resetConstitutionHttp: mockReset,
}));
vi.mock('@renderer/pages/settings/components/SettingsPageShell', () => ({
  default: ({
    actions,
    savedIndicator,
    children,
  }: {
    actions: React.ReactNode;
    savedIndicator: string;
    children: React.ReactNode;
  }) => (
    <main>
      <div>{actions}</div>
      <span data-testid='save-state'>{savedIndicator}</span>
      {children}
    </main>
  ),
}));
vi.mock('@renderer/pages/settings/ConstitutionSettings/SpecialistOverlays', () => ({ default: () => null }));
vi.mock('@renderer/pages/settings/ConstitutionSettings/HostedEditAuthorization', () => ({
  default: ({ onGranted }: { onGranted: (grant: { token: string; expiresAt: number }) => void }) => (
    <button type='button' onClick={() => onGranted({ token: 'opaque-grant', expiresAt: Date.now() + 60_000 })}>
      Unlock editing
    </button>
  ),
}));
vi.mock('@renderer/pages/conversation/Preview/components/editors/TipTapMarkdownEditor', () => ({
  default: ({ value, onChange, readOnly }: { value: string; onChange: (value: string) => void; readOnly: boolean }) => (
    <textarea
      aria-label='constitution-editor'
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, onClick, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type='button' onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Input: {
    Password: ({
      value,
      onChange,
      placeholder,
    }: {
      value: string;
      onChange: (value: string) => void;
      placeholder: string;
    }) => (
      <input
        type='password'
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  },
}));

import ConstitutionSettings from '@renderer/pages/settings/ConstitutionSettings';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const present = (content: string, revision = 'rev:main:00000001') => ({
  state: 'present' as const,
  content,
  revision,
});

const committed = (revision = 'rev:main:00000002') => ({
  ok: true as const,
  revision,
  receiptId: 'receipt:main:00000001',
});

describe('Hosted ConstitutionSettings journey', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockRead.mockReset();
    mockWrite.mockReset();
    mockReset.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('waits for an in-flight autosave before reset and then renders the reset content', async () => {
    const write = deferred<ReturnType<typeof committed>>();
    mockRead
      .mockResolvedValueOnce(present('# current'))
      .mockResolvedValueOnce(present('# default', 'rev:main:00000003'));
    mockWrite.mockReturnValue(write.promise);
    mockReset.mockResolvedValue(committed('rev:main:00000003'));

    render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[0]);

    const editor = screen.getByRole('textbox', { name: 'constitution-editor' }) as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: '# dirty before reset' } });
    await act(async () => vi.advanceTimersByTime(500));
    expect(mockWrite).toHaveBeenCalledWith('# dirty before reset', 'rev:main:00000001', 'opaque-grant');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.change(screen.getByPlaceholderText('WebUI password'), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset' })[1]);
    expect(mockReset).not.toHaveBeenCalled();

    await act(async () => write.resolve(committed()));
    await act(async () => Promise.resolve());
    expect(mockReset).toHaveBeenCalledWith('correct-password', 'rev:main:00000002');
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect((screen.getByRole('textbox', { name: 'constitution-editor' }) as HTMLTextAreaElement).value).toBe(
      '# default'
    );
  });

  it('recovers an unsaved edit after route unmount and resumes it only after a fresh unlock', async () => {
    mockRead.mockResolvedValue(present('# canonical server copy'));
    mockWrite.mockResolvedValue(committed());

    const first = render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[0]);
    fireEvent.change(screen.getByRole('textbox', { name: 'constitution-editor' }), {
      target: { value: '# unsaved route draft' },
    });
    first.unmount();

    render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    const recovered = screen.getByRole('textbox', { name: 'constitution-editor' }) as HTMLTextAreaElement;
    expect(recovered.value).toBe('# unsaved route draft');
    expect(recovered.readOnly).toBe(true);
    expect(mockWrite).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[0]);
    await act(async () => Promise.resolve());
    expect(mockWrite).toHaveBeenCalledWith('# unsaved route draft', 'rev:main:00000001', 'opaque-grant');
  });

  it('preserves the visible dirty buffer across grant expiry and saves it after re-unlock', async () => {
    mockRead.mockResolvedValue(present('# canonical server copy'));
    mockWrite
      .mockResolvedValueOnce({ ok: false, reason: 'authorization_required', status: 401 })
      .mockResolvedValueOnce(committed());
    render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[0]);

    const editor = screen.getByRole('textbox', { name: 'constitution-editor' }) as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: '# grant expired but keep me' } });
    await act(async () => vi.advanceTimersByTime(500));
    await act(async () => Promise.resolve());
    expect(editor.value).toBe('# grant expired but keep me');
    expect(editor.readOnly).toBe(true);
    expect(screen.getByRole('button', { name: 'Retry save' })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[0]);
    await act(async () => Promise.resolve());
    expect(mockWrite).toHaveBeenCalledTimes(2);
    expect(mockWrite).toHaveBeenLastCalledWith('# grant expired but keep me', 'rev:main:00000001', 'opaque-grant');
  });

  it('serializes overlapping component edits and sends only the latest queued value next', async () => {
    const firstWrite = deferred<ReturnType<typeof committed>>();
    mockRead.mockResolvedValue(present('# canonical server copy'));
    mockWrite.mockReturnValueOnce(firstWrite.promise).mockResolvedValueOnce(committed('rev:main:00000003'));
    render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[0]);
    const editor = screen.getByRole('textbox', { name: 'constitution-editor' });

    fireEvent.change(editor, { target: { value: '# first in flight' } });
    await act(async () => vi.advanceTimersByTime(500));
    fireEvent.change(editor, { target: { value: '# superseded' } });
    fireEvent.change(editor, { target: { value: '# latest wins' } });
    await act(async () => vi.advanceTimersByTime(500));
    expect(mockWrite).toHaveBeenCalledTimes(1);

    await act(async () => firstWrite.resolve(committed()));
    expect(mockWrite).toHaveBeenCalledTimes(2);
    expect(mockWrite).toHaveBeenLastCalledWith('# latest wins', 'rev:main:00000002', 'opaque-grant');
  });

  it('keeps an empty file distinct from an absent file and never creates on read', async () => {
    mockRead.mockResolvedValueOnce(present(''));
    const first = render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    expect(screen.getByRole('textbox', { name: 'constitution-editor' })).toHaveValue('');
    expect(screen.queryByText('No Constitution exists yet')).not.toBeInTheDocument();
    expect(mockReset).not.toHaveBeenCalled();
    first.unmount();

    mockRead.mockResolvedValueOnce({ state: 'absent', revision: 'rev:main:absent001' });
    render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    expect(screen.getByText('No Constitution exists yet')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'constitution-editor' })).not.toBeInTheDocument();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('renders a retryable read error without exposing an editor or destructive reset', async () => {
    mockRead.mockRejectedValueOnce(new Error('service offline')).mockResolvedValueOnce(present('# recovered'));
    render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());

    expect(screen.getByText('Constitution unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'constitution-editor' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
    expect(mockWrite).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Retry load' }));
    await act(async () => Promise.resolve());
    expect(screen.getByRole('textbox', { name: 'constitution-editor' })).toHaveValue('# recovered');
  });

  it('shows a three-way conflict comparison and overwrites only after explicit choice', async () => {
    mockRead
      .mockResolvedValueOnce(present('# original'))
      .mockResolvedValueOnce(present('# someone else', 'rev:main:00000002'));
    mockWrite
      .mockResolvedValueOnce({ ok: false, reason: 'conflict', status: 409 })
      .mockResolvedValueOnce(committed('rev:main:00000003'));
    render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[0]);

    fireEvent.change(screen.getByRole('textbox', { name: 'constitution-editor' }), {
      target: { value: '# keep my draft' },
    });
    await act(async () => vi.advanceTimersByTime(500));
    expect(screen.getByText(/server copy changed/i)).toBeInTheDocument();

    const conflictedEditor = screen.getByRole('textbox', { name: 'constitution-editor' }) as HTMLTextAreaElement;
    expect(conflictedEditor.readOnly).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Load comparison' }));
    await act(async () => Promise.resolve());
    expect(screen.getByRole('textbox', { name: 'constitution-editor' })).toHaveValue('# keep my draft');
    expect(screen.getByText('Previous base')).toBeInTheDocument();
    expect(screen.getByText('Your draft')).toBeInTheDocument();
    expect(screen.getByText('Current server')).toBeInTheDocument();
    expect(mockWrite).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Overwrite with my draft' }));
    await act(async () => Promise.resolve());
    expect(mockWrite).toHaveBeenLastCalledWith('# keep my draft', 'rev:main:00000002', 'opaque-grant');
  });

  it('adopts the server copy only after an explicit conflict choice', async () => {
    mockRead
      .mockResolvedValueOnce(present('# original'))
      .mockResolvedValueOnce(present('# authoritative server', 'rev:main:00000002'));
    mockWrite.mockResolvedValueOnce({ ok: false, reason: 'conflict', status: 409 });
    render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[0]);
    fireEvent.change(screen.getByRole('textbox', { name: 'constitution-editor' }), {
      target: { value: '# local draft' },
    });
    await act(async () => vi.advanceTimersByTime(500));

    fireEvent.click(screen.getByRole('button', { name: 'Load comparison' }));
    await act(async () => Promise.resolve());
    expect(screen.getByRole('textbox', { name: 'constitution-editor' })).toHaveValue('# local draft');
    expect(mockWrite).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Use server copy' }));
    await act(async () => vi.advanceTimersByTime(50));
    expect(screen.getByRole('textbox', { name: 'constitution-editor' })).toHaveValue('# authoritative server');
    expect(screen.queryByText(/server copy changed/i)).not.toBeInTheDocument();
    expect(mockWrite).toHaveBeenCalledTimes(1);
  });

  it('treats a reset receipt as committed when the follow-up read fails and never revives the old draft', async () => {
    mockRead.mockResolvedValueOnce(present('# original')).mockRejectedValueOnce(new Error('read path offline'));
    mockWrite.mockResolvedValue(committed());
    mockReset.mockResolvedValue(committed('rev:main:00000003'));
    render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[0]);
    fireEvent.change(screen.getByRole('textbox', { name: 'constitution-editor' }), {
      target: { value: '# must not return after reset' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.change(screen.getByPlaceholderText('WebUI password'), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset' })[1]);
    await act(async () => Promise.resolve());

    expect(screen.getByText(/Reset committed, but content reload failed/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'constitution-editor' })).not.toBeInTheDocument();
    mockRead.mockResolvedValueOnce(present('# default', 'rev:main:00000003'));
    fireEvent.click(screen.getByRole('button', { name: 'Retry load' }));
    await act(async () => Promise.resolve());
    expect(screen.getByRole('textbox', { name: 'constitution-editor' })).toHaveValue('# default');
    expect(mockWrite).not.toHaveBeenCalledWith('# must not return after reset', expect.anything(), expect.anything());
  });
});
