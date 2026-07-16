import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockWrite } = vi.hoisted(() => ({ mockWrite: vi.fn() }));

vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => false }));
vi.mock('@/renderer/hooks/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@renderer/services/ConstitutionService', () => ({
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

describe('Hosted SpecialistOverlayEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockWrite.mockReset();
    mockWrite.mockResolvedValue({ ok: true });
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
    await act(async () => vi.advanceTimersByTime(50));
    fireEvent.click(screen.getByRole('button', { name: 'Unlock editing' }));
    const editor = screen.getByRole('textbox', { name: 'specialist-editor' }) as HTMLTextAreaElement;
    expect(editor.readOnly).toBe(false);
    return { editor, onClose, onDirtyChange };
  }

  it('leaves hydration and autosaves a hosted edit with the exact specialist scope grant', async () => {
    const { editor } = await unlockEditor();
    fireEvent.change(editor, { target: { value: '# hosted copy rules' } });
    await act(async () => vi.advanceTimersByTime(500));
    expect(mockWrite).toHaveBeenCalledWith('copy', '# hosted copy rules', 'opaque-grant');
  });

  it('prevents close while dirty and exposes retry after a failed save', async () => {
    const first = deferred<{ ok: false; reason: 'request_failed'; status: number }>();
    mockWrite.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ ok: true });
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
});
