import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRead, mockWrite } = vi.hoisted(() => ({ mockRead: vi.fn(), mockWrite: vi.fn() }));

vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => false }));
vi.mock('@/renderer/hooks/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@renderer/services/ConstitutionService', () => ({
  readConstitutionSpecialistHttp: mockRead,
  writeConstitutionSpecialistHttp: mockWrite,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
vi.mock('@renderer/components/settings/shared/feedback/SavedIndicator', () => ({
  default: ({ state }: { state: string }) => <span data-testid='save-state'>{state}</span>,
}));
vi.mock('@renderer/pages/conversation/Preview/components/editors/TipTapMarkdownEditor', () => ({
  default: ({ value, onChange, readOnly }: { value: string; onChange: (value: string) => void; readOnly: boolean }) => (
    <textarea
      aria-label='specialist-editor'
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, onClick, disabled, title }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type='button' onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  ),
}));
vi.mock('@renderer/pages/settings/ConstitutionSettings/HostedEditAuthorization', () => ({
  default: ({ onGranted }: { onGranted: (grant: { token: string; expiresAt: number }) => void }) => (
    <button type='button' onClick={() => onGranted({ token: 'opaque-grant', expiresAt: Date.now() + 60_000 })}>
      Unlock editing
    </button>
  ),
}));

import SpecialistOverlayEditor from '@renderer/pages/settings/ConstitutionSettings/SpecialistOverlayEditor';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const committed = (revision = 'rev:copy:00000002') => ({
  ok: true as const,
  revision,
  receiptId: 'receipt:copy:00000001',
});

describe('Hosted SpecialistOverlayEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockRead.mockReset();
    mockRead.mockResolvedValue({
      state: 'present',
      content: '# existing copy rules',
      revision: 'rev:copy:00000001',
    });
    mockWrite.mockReset();
    mockWrite.mockResolvedValue(committed());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function unlockEditor(
    onClose = vi.fn(),
    onDirtyChange = vi.fn()
  ): Promise<{
    editor: HTMLTextAreaElement;
    onClose: ReturnType<typeof vi.fn>;
    onDirtyChange: ReturnType<typeof vi.fn>;
  }> {
    render(<SpecialistOverlayEditor id='copy' onClose={onClose} onDirtyChange={onDirtyChange} />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getByRole('button', { name: 'Unlock editing' }));
    const editor = screen.getByRole('textbox', { name: 'specialist-editor' }) as HTMLTextAreaElement;
    expect(editor.readOnly).toBe(false);
    return { editor, onClose, onDirtyChange };
  }

  it('hydrates the existing hosted overlay and autosaves with its exact revision and grant', async () => {
    const { editor } = await unlockEditor();
    expect(editor.value).toBe('# existing copy rules');
    fireEvent.change(editor, { target: { value: '# hosted copy rules' } });
    await act(async () => vi.advanceTimersByTime(500));
    expect(mockWrite).toHaveBeenCalledWith(
      'copy',
      '# hosted copy rules',
      'rev:copy:00000001',
      'opaque-grant',
      expect.any(String)
    );
  });

  it('prevents close while dirty and exposes retry after a failed save', async () => {
    const first = deferred<{ ok: false; reason: 'request_failed'; status: number }>();
    mockWrite.mockReturnValueOnce(first.promise).mockResolvedValueOnce(committed());
    const onClose = vi.fn();
    const { editor, onDirtyChange } = await unlockEditor(onClose);

    fireEvent.change(editor, { target: { value: '# do not lose me' } });
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toBeDisabled();
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(close);
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(500));
    await act(async () => first.resolve({ ok: false, reason: 'request_failed', status: 503 }));
    expect(screen.getByRole('button', { name: 'Retry save' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
    await act(async () => Promise.resolve());
    expect(mockWrite).toHaveBeenCalledTimes(2);
    expect(close).not.toBeDisabled();
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it('shows explicit absent and retryable read-error states without exposing a blank editor', async () => {
    mockRead.mockResolvedValueOnce({ state: 'absent', revision: 'rev:copy:absent001' });
    const first = render(<SpecialistOverlayEditor id='copy' onClose={vi.fn()} />);
    await act(async () => Promise.resolve());
    expect(screen.getByText(/overlay no longer exists/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'specialist-editor' })).not.toBeInTheDocument();
    first.unmount();

    mockRead.mockRejectedValueOnce(new Error('inventory unavailable')).mockResolvedValueOnce({
      state: 'present',
      content: '# recovered overlay',
      revision: 'rev:copy:00000009',
    });
    render(<SpecialistOverlayEditor id='copy' onClose={vi.fn()} />);
    await act(async () => Promise.resolve());
    expect(screen.getByText('inventory unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'specialist-editor' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry load' }));
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    expect(screen.getByRole('textbox', { name: 'specialist-editor' })).toHaveValue('# recovered overlay');
  });

  it('shows a three-way specialist comparison and overwrites only after explicit choice', async () => {
    mockRead
      .mockResolvedValueOnce({
        state: 'present',
        content: '# original',
        revision: 'rev:copy:00000001',
      })
      .mockResolvedValueOnce({
        state: 'present',
        content: '# changed elsewhere',
        revision: 'rev:copy:00000002',
      });
    mockWrite
      .mockResolvedValueOnce({ ok: false, reason: 'conflict', status: 409 })
      .mockResolvedValueOnce(committed('rev:copy:00000003'));
    const { editor } = await unlockEditor();
    fireEvent.change(editor, { target: { value: '# keep specialist draft' } });
    await act(async () => vi.advanceTimersByTime(500));
    expect(screen.getByText(/server copy changed/i)).toBeInTheDocument();

    expect((screen.getByRole('textbox', { name: 'specialist-editor' }) as HTMLTextAreaElement).readOnly).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Load comparison' }));
    await act(async () => Promise.resolve());
    expect(screen.getByRole('textbox', { name: 'specialist-editor' })).toHaveValue('# keep specialist draft');
    expect(screen.getByText('Previous base')).toBeInTheDocument();
    expect(screen.getByText('Your draft')).toBeInTheDocument();
    expect(screen.getByText('Current server')).toBeInTheDocument();
    expect(mockWrite).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Overwrite with my draft' }));
    await act(async () => Promise.resolve());
    expect(mockWrite).toHaveBeenLastCalledWith(
      'copy',
      '# keep specialist draft',
      'rev:copy:00000002',
      'opaque-grant',
      expect.any(String)
    );
  });

  it('publishes the committed revision and byte count before dirty state clears', async () => {
    const onCommitted = vi.fn();
    render(<SpecialistOverlayEditor id='copy' onClose={vi.fn()} onDirtyChange={vi.fn()} onCommitted={onCommitted} />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getByRole('button', { name: 'Unlock editing' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'specialist-editor' }), {
      target: { value: '# saved revision' },
    });
    await act(async () => vi.advanceTimersByTime(500));
    expect(onCommitted).toHaveBeenCalledWith({
      revision: 'rev:copy:00000002',
      bytes: new TextEncoder().encode('# saved revision').byteLength,
    });
  });

  it('blocks new editor work while the parent owns an in-flight delete', async () => {
    const onClose = vi.fn();
    const view = render(<SpecialistOverlayEditor id='copy' onClose={onClose} locked={false} />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getByRole('button', { name: 'Unlock editing' }));
    view.rerender(<SpecialistOverlayEditor id='copy' onClose={onClose} locked />);

    const editor = screen.getByRole('textbox', { name: 'specialist-editor' }) as HTMLTextAreaElement;
    expect(editor.readOnly).toBe(true);
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    fireEvent.change(editor, { target: { value: '# must not queue' } });
    await act(async () => vi.advanceTimersByTime(500));
    expect(mockWrite).not.toHaveBeenCalled();
    expect(editor.value).toBe('# existing copy rules');
  });
});
