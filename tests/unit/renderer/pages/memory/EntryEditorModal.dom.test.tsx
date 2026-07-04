/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for EntryEditorModal (#414). The load-bearing behavior is the
 * diff-only patch: editing one field must send ONLY that field to
 * memory.update-entry so untouched frontmatter is left verbatim on disk.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemoryEntry } from '@/common/types/memory';

const updateEntry = vi.hoisted(() => vi.fn());

vi.mock('@/common/adapter/ipcBridge', () => ({
  memory: { updateEntry: { invoke: updateEntry } },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: unknown) => (typeof fb === 'string' ? fb : _k) }),
}));

// Minimal Arco stubs: expose the OK button (with its disabled state) and the
// summary input; other fields are inert passthroughs for this diff test.
vi.mock('@arco-design/web-react', () => {
  const Input: React.FC<Record<string, unknown>> & { TextArea: React.FC<Record<string, unknown>> } = ((
    props: Record<string, unknown>
  ) => (
    <input
      data-testid={props['data-testid'] as string}
      value={props.value as string}
      onChange={(e) => (props.onChange as (v: string) => void)?.(e.target.value)}
    />
  )) as never;
  Input.TextArea = (props: Record<string, unknown>) => (
    <textarea
      data-testid={props['data-testid'] as string}
      value={props.value as string}
      onChange={(e) => (props.onChange as (v: string) => void)?.(e.target.value)}
    />
  );
  return {
    Input,
    InputTag: (props: Record<string, unknown>) => <div data-testid={props['data-testid'] as string} />,
    Select: Object.assign(
      (props: Record<string, unknown>) => (
        <div data-testid={props['data-testid'] as string}>{props.children as React.ReactNode}</div>
      ),
      { Option: (props: Record<string, unknown>) => <span>{props.children as React.ReactNode}</span> }
    ),
    Message: { success: vi.fn(), error: vi.fn() },
    Modal: (props: Record<string, unknown>) => {
      if (!props.visible) return null;
      const okp = (props.okButtonProps as { disabled?: boolean }) ?? {};
      return (
        <div>
          {props.children as React.ReactNode}
          <button data-testid='modal-ok' disabled={okp.disabled} onClick={props.onOk as () => void}>
            ok
          </button>
        </div>
      );
    },
  };
});

// eslint-disable-next-line import/first
import EntryEditorModal from '@/renderer/pages/memory/components/EntryEditorModal';

const ENTRY: MemoryEntry & { body: string } = {
  id: 'entry-001',
  type: 'decision',
  project: 'p',
  projectPath: '/p',
  summary: 'Original summary',
  bodyPreview: 'prev',
  body: 'Original body',
  tags: ['a', 'b'],
  storedAt: 1,
  sourcePath: '/p/.ijfw/memory/journal.md',
  sourceLine: 0,
  referencedBy: 0,
  promotionScore: 0,
};

afterEach(() => {
  cleanup();
  updateEntry.mockReset();
});

beforeEach(() => {
  updateEntry.mockResolvedValue({ ok: true, newId: 'entry-new' });
});

describe('EntryEditorModal (#414)', () => {
  it('prefills the summary from the entry', () => {
    render(<EntryEditorModal open entry={ENTRY} onClose={vi.fn()} onSaved={vi.fn()} />);
    expect((screen.getByTestId('entry-editor-summary') as HTMLInputElement).value).toBe('Original summary');
  });

  it('disables Save when nothing has changed', () => {
    render(<EntryEditorModal open entry={ENTRY} onClose={vi.fn()} onSaved={vi.fn()} />);
    expect((screen.getByTestId('modal-ok') as HTMLButtonElement).disabled).toBe(true);
  });

  it('sends ONLY the changed field (summary) and calls onSaved with the new id', async () => {
    const onSaved = vi.fn();
    render(<EntryEditorModal open entry={ENTRY} onClose={vi.fn()} onSaved={onSaved} />);
    fireEvent.change(screen.getByTestId('entry-editor-summary'), { target: { value: 'Renamed' } });
    expect((screen.getByTestId('modal-ok') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByTestId('modal-ok'));
    await waitFor(() => expect(updateEntry).toHaveBeenCalledTimes(1));
    // Diff-only: no type/tags/body in the payload.
    expect(updateEntry).toHaveBeenCalledWith({ id: 'entry-001', summary: 'Renamed' });
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('entry-new'));
  });

  it('does not save when the summary is cleared (empty summary is invalid)', () => {
    render(<EntryEditorModal open entry={ENTRY} onClose={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(screen.getByTestId('entry-editor-summary'), { target: { value: '   ' } });
    expect((screen.getByTestId('modal-ok') as HTMLButtonElement).disabled).toBe(true);
  });

  it('sends only the body when only the body changed', async () => {
    render(<EntryEditorModal open entry={ENTRY} onClose={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(screen.getByTestId('entry-editor-body'), { target: { value: 'New body' } });
    fireEvent.click(screen.getByTestId('modal-ok'));
    await waitFor(() => expect(updateEntry).toHaveBeenCalledWith({ id: 'entry-001', body: 'New body' }));
  });
});
