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

describe('Hosted ConstitutionSettings journey', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockRead.mockReset();
    mockWrite.mockReset();
    mockReset.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('waits for an in-flight autosave before reset and then renders the reset content', async () => {
    const write = deferred<{ ok: true }>();
    mockRead.mockResolvedValueOnce('# current').mockResolvedValueOnce('# default');
    mockWrite.mockReturnValue(write.promise);
    mockReset.mockResolvedValue({ ok: true });

    render(<ConstitutionSettings />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock editing' })[0]);

    const editor = screen.getByRole('textbox', { name: 'constitution-editor' }) as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: '# dirty before reset' } });
    await act(async () => vi.advanceTimersByTime(500));
    expect(mockWrite).toHaveBeenCalledWith('# dirty before reset', 'opaque-grant');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.change(screen.getByPlaceholderText('WebUI password'), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Reset' })[1]);
    expect(mockReset).not.toHaveBeenCalled();

    await act(async () => write.resolve({ ok: true }));
    await act(async () => Promise.resolve());
    expect(mockReset).toHaveBeenCalledWith('correct-password');
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect((screen.getByRole('textbox', { name: 'constitution-editor' }) as HTMLTextAreaElement).value).toBe(
      '# default'
    );
  });

  it('recovers an unsaved edit after route unmount and resumes it only after a fresh unlock', async () => {
    mockRead.mockResolvedValue('# canonical server copy');
    mockWrite.mockResolvedValue({ ok: true });

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
    expect(mockWrite).toHaveBeenCalledWith('# unsaved route draft', 'opaque-grant');
  });

  it('preserves the visible dirty buffer across grant expiry and saves it after re-unlock', async () => {
    mockRead.mockResolvedValue('# canonical server copy');
    mockWrite
      .mockResolvedValueOnce({ ok: false, reason: 'authorization_required', status: 401 })
      .mockResolvedValueOnce({ ok: true });
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
    expect(mockWrite).toHaveBeenLastCalledWith('# grant expired but keep me', 'opaque-grant');
  });

  it('serializes overlapping component edits and sends only the latest queued value next', async () => {
    const firstWrite = deferred<{ ok: true }>();
    mockRead.mockResolvedValue('# canonical server copy');
    mockWrite.mockReturnValueOnce(firstWrite.promise).mockResolvedValueOnce({ ok: true });
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

    await act(async () => firstWrite.resolve({ ok: true }));
    expect(mockWrite).toHaveBeenCalledTimes(2);
    expect(mockWrite).toHaveBeenLastCalledWith('# latest wins', 'opaque-grant');
  });
});
