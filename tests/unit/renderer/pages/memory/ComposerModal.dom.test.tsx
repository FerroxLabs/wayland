/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for ComposerModal.
 *
 * Covers:
 *   - Renders when open=true, returns null when open=false.
 *   - ESC triggers onClose via Arco Modal's onCancel.
 *   - Submit fires onSubmit with correct shape (content, scope, tags).
 *   - Validation rejects empty content.
 *   - Validation rejects content > 8000 chars.
 *   - Scope toggle switches between project / global.
 *   - Cancel button fires onClose without submitting.
 *   - Falls back to ipcBridge when no onSubmit prop is provided.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockSetQuickAdd } = vi.hoisted(() => ({
  mockSetQuickAdd: vi.fn(),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  memory: {
    setQuickAdd: { invoke: mockSetQuickAdd },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

// Arco stub - lightweight replacements; Modal surfaces onCancel for ESC testing.
vi.mock('@arco-design/web-react', () => {
  const ModalStub = ({
    visible,
    children,
    onCancel,
    'data-testid': testId,
    className,
  }: {
    visible: boolean;
    children?: React.ReactNode;
    onCancel?: () => void;
    'data-testid'?: string;
    className?: string;
    [key: string]: unknown;
  }) =>
    visible ? (
      <div
        role='dialog'
        data-testid={testId ?? 'modal-root'}
        className={className ?? ''}
        // Expose onCancel via data attr so tests can trigger it
        onKeyDown={(e) => {
          if (e.key === 'Escape' && onCancel) onCancel();
        }}
      >
        {children}
      </div>
    ) : null;

  const ButtonStub = ({
    children,
    onClick,
    disabled,
    loading,
    'data-testid': testId,
    type: _type,
    className: _className,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    'data-testid'?: string;
    type?: string;
    className?: string;
    [key: string]: unknown;
  }) => (
    <button type='button' onClick={onClick} disabled={disabled === true || loading === true} data-testid={testId}>
      {children}
    </button>
  );

  const InputTextAreaStub = ({
    value,
    onChange,
    onKeyDown,
    disabled,
    placeholder,
    'data-testid': testId,
  }: {
    value?: string;
    onChange?: (val: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    disabled?: boolean;
    placeholder?: string;
    'data-testid'?: string;
    [key: string]: unknown;
  }) => (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      data-testid={testId}
    />
  );

  const InputStub = Object.assign(
    ({
      value,
      onChange,
      'data-testid': testId,
    }: {
      value?: string;
      onChange?: (v: string) => void;
      'data-testid'?: string;
    }) => <input value={value} onChange={(e) => onChange?.(e.target.value)} data-testid={testId} />,
    { TextArea: InputTextAreaStub }
  );

  const MessageStub = {
    success: vi.fn(),
    error: vi.fn(),
  };

  return {
    Modal: ModalStub,
    Button: ButtonStub,
    Input: InputStub,
    Message: MessageStub,
  };
});

vi.mock('lucide-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('lucide-react')>()),
  X: ({ size: _size, 'aria-hidden': _ah }: { size?: number; 'aria-hidden'?: boolean }) => <span data-icon='x' />,
}));

// ---------------------------------------------------------------------------
// Subject
// ---------------------------------------------------------------------------

import { ComposerModal } from '@renderer/pages/memory/components/ComposerModal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup(props: Partial<React.ComponentProps<typeof ComposerModal>> = {}) {
  const onClose = props.onClose ?? vi.fn();
  const onSubmit = props.onSubmit;
  return {
    onClose: onClose as Mock,
    onSubmit: onSubmit as Mock | undefined,
    ...render(<ComposerModal open={props.open ?? true} onClose={onClose} onSubmit={onSubmit} />),
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ComposerModal', () => {
  describe('visibility', () => {
    it('renders when open=true', () => {
      setup({ open: true });
      expect(screen.getByTestId('composer-modal')).toBeTruthy();
    });

    it('returns null when open=false', () => {
      setup({ open: false });
      expect(screen.queryByTestId('composer-modal')).toBeNull();
    });
  });

  describe('close behaviour', () => {
    it('ESC keydown on modal triggers onClose', () => {
      const { onClose } = setup();
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('cancel button calls onClose without submitting', async () => {
      const onSubmit = vi.fn();
      const { onClose } = setup({ onSubmit });
      const ta = screen.getByTestId('composer-textarea') as HTMLTextAreaElement;
      fireEvent.change(ta, { target: { value: 'some content' } });
      fireEvent.click(screen.getByTestId('composer-cancel-btn'));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('rejects empty content - submit button is disabled', () => {
      const onSubmit = vi.fn();
      setup({ onSubmit });
      const btn = screen.getByTestId('composer-submit-btn') as HTMLButtonElement;
      // Button is disabled when content is empty - click cannot fire onSubmit.
      expect(btn.disabled).toBe(true);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submit button is disabled when content is empty', () => {
      setup({ onSubmit: vi.fn() });
      const btn = screen.getByTestId('composer-submit-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('rejects content over 8000 chars - submit button is disabled', () => {
      const onSubmit = vi.fn();
      setup({ onSubmit });
      const ta = screen.getByTestId('composer-textarea') as HTMLTextAreaElement;
      fireEvent.change(ta, { target: { value: 'a'.repeat(8001) } });
      const btn = screen.getByTestId('composer-submit-btn') as HTMLButtonElement;
      // charOverLimit=true → button disabled, onSubmit never fires.
      expect(btn.disabled).toBe(true);
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('calls onSubmit with correct shape on button click', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      setup({ onSubmit });
      const ta = screen.getByTestId('composer-textarea') as HTMLTextAreaElement;
      fireEvent.change(ta, { target: { value: 'Always use Arco components' } });
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          content: 'Always use Arco components',
          scope: 'project',
          tags: [],
        });
      });
    });

    it('calls onSubmit via Cmd+Enter', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      setup({ onSubmit });
      const ta = screen.getByTestId('composer-textarea') as HTMLTextAreaElement;
      fireEvent.change(ta, { target: { value: 'Cmd enter submit' } });
      fireEvent.keyDown(ta, { key: 'Enter', metaKey: true });
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          content: 'Cmd enter submit',
          scope: 'project',
          tags: [],
        });
      });
    });

    it('calls onClose after successful submit', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const { onClose } = setup({ onSubmit });
      const ta = screen.getByTestId('composer-textarea') as HTMLTextAreaElement;
      fireEvent.change(ta, { target: { value: 'Memory content' } });
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('shows inline error on submit failure', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Save failed'));
      setup({ onSubmit });
      const ta = screen.getByTestId('composer-textarea') as HTMLTextAreaElement;
      fireEvent.change(ta, { target: { value: 'bad memory' } });
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
      await waitFor(() => {
        const errorEl = screen.getByTestId('composer-error');
        expect(errorEl.textContent).toContain('Save failed');
      });
    });

    it('falls back to ipcBridge when onSubmit is omitted', async () => {
      mockSetQuickAdd.mockResolvedValue({ ok: true });
      const onClose = vi.fn();
      render(<ComposerModal open onClose={onClose} />);
      const ta = screen.getByTestId('composer-textarea') as HTMLTextAreaElement;
      fireEvent.change(ta, { target: { value: 'IPC fallback test' } });
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
      await waitFor(() => {
        expect(mockSetQuickAdd).toHaveBeenCalledWith({
          content: 'IPC fallback test',
          scope: 'project',
        });
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('scope toggle', () => {
    it('defaults to project scope', () => {
      setup();
      const projectBtn = screen.getByTestId('composer-scope-project');
      expect(projectBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('switches scope to global on click', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      setup({ onSubmit });
      fireEvent.click(screen.getByTestId('composer-scope-global'));
      const ta = screen.getByTestId('composer-textarea') as HTMLTextAreaElement;
      fireEvent.change(ta, { target: { value: 'global scope check' } });
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ scope: 'global' }));
      });
    });

    it('project pill is aria-pressed=true after selecting project again', async () => {
      setup();
      fireEvent.click(screen.getByTestId('composer-scope-global'));
      expect(screen.getByTestId('composer-scope-global').getAttribute('aria-pressed')).toBe('true');
      fireEvent.click(screen.getByTestId('composer-scope-project'));
      expect(screen.getByTestId('composer-scope-project').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByTestId('composer-scope-global').getAttribute('aria-pressed')).toBe('false');
    });
  });
});
