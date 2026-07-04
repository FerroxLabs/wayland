/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for RightDrawer.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MemoryEntry } from '@/common/types/memory';

// Mock ipcBridge so the renderer doesn't try to call Electron IPC in jsdom.
// NOTE: vi.mock factory is hoisted, so we cannot reference outer `const` vars.
// Instead, expose the mock via module-level state accessed inside the factory.
vi.mock('@/common', () => ({
  ipcBridge: {
    memory: {
      readSourceContext: {
        invoke: vi.fn(),
      },
    },
  },
}));

// Minimal react-markdown stub - renders children as plain text.
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <span data-testid='md'>{children}</span>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, _opts?: Record<string, unknown>) => fallback ?? _key,
  }),
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@arco-design/web-react');
  return {
    ...actual,
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Message: { success: vi.fn(), error: vi.fn() },
  };
});

vi.mock('@icon-park/react', () => ({
  Close: (p: Record<string, unknown>) => <span data-testid='icon-close' {...p} />,
  Copy: (p: Record<string, unknown>) => <span data-testid='icon-copy' {...p} />,
  LinkOne: (p: Record<string, unknown>) => <span data-testid='icon-link' {...p} />,
  Edit: (p: Record<string, unknown>) => <span data-testid='icon-edit' {...p} />,
  Delete: (p: Record<string, unknown>) => <span data-testid='icon-delete' {...p} />,
  FileCode: (p: Record<string, unknown>) => <span data-testid='icon-file-code' {...p} />,
  Help: (p: Record<string, unknown>) => <span data-testid='icon-help' {...p} />,
}));

import RightDrawer from '@renderer/pages/memory/components/RightDrawer';
import { ipcBridge } from '@/common';

const MOCK_ENTRY: MemoryEntry & { body: string } = {
  id: 'entry-001',
  type: 'decision',
  project: 'wayland-app',
  projectPath: '/dev/wayland/app',
  summary: 'Always use Arco components',
  bodyPreview: 'Body preview...',
  body: 'Full body text explaining the decision.',
  why: 'Because consistency matters.',
  howToApply: 'Replace all raw inputs with Arco components.',
  tags: ['arco', 'ui'],
  storedAt: Date.now() - 3600_000,
  sourcePath: 'src/renderer/AGENTS.md',
  sourceLine: 10,
  referencedBy: 3,
  promotionScore: 75,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('RightDrawer', () => {
  it('renders nothing visible when entry is null', () => {
    render(<RightDrawer entry={null} onClose={vi.fn()} />);
    const drawer = screen.getByTestId('right-drawer');
    // Drawer exists in DOM but has no .inner content
    expect(screen.queryByTestId('right-drawer-inner')).toBeNull();
  });

  it('renders inner content when entry is provided', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    expect(screen.getByTestId('right-drawer-inner')).toBeTruthy();
  });

  it('shows entry summary in title', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    const title = screen.getByTestId('drawer-title');
    expect(title.textContent).toContain('Always use Arco components');
  });

  it('shows type badge', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    expect(screen.getByTestId('drawer-type-badge').textContent).toContain('decision');
  });

  it('shows Why section as first body section (K3 fix)', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    const whySection = screen.getByTestId('drawer-section-why');
    expect(whySection).toBeTruthy();
    expect(whySection.textContent).toContain('Because consistency matters.');
  });

  it('shows Summary section', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    expect(screen.getByTestId('drawer-section-summary')).toBeTruthy();
  });

  it('shows promotion score bar', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    expect(screen.getByTestId('drawer-score-wrap')).toBeTruthy();
    expect(screen.getByTestId('drawer-score-fill')).toBeTruthy();
  });

  it('shows source path (Q5 acceptance)', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    const sourcePath = screen.getByTestId('drawer-source-path');
    expect(sourcePath.textContent).toContain('src/renderer/AGENTS.md');
    expect(sourcePath.textContent).toContain('L10');
  });

  it('clicking close button calls onClose', () => {
    const onClose = vi.fn();
    render(<RightDrawer entry={MOCK_ENTRY} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('drawer-close-btn'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Esc key calls onClose', () => {
    const onClose = vi.fn();
    render(<RightDrawer entry={MOCK_ENTRY} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows promote button when entry is not wiki type', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    const promoteBtn = screen.getByTestId('drawer-promote-btn');
    expect(promoteBtn).toBeTruthy();
    expect(promoteBtn.hasAttribute('disabled')).toBe(false);
  });

  it('disables promote button when entry is wiki type', () => {
    const wikiEntry = { ...MOCK_ENTRY, type: 'wiki' as const };
    render(<RightDrawer entry={wikiEntry} onClose={vi.fn()} />);
    const promoteBtn = screen.getByTestId('drawer-promote-btn');
    expect(promoteBtn.hasAttribute('disabled')).toBe(true);
  });

  it('calls onPromote with entry id when promote clicked', () => {
    const onPromote = vi.fn();
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} onPromote={onPromote} />);
    fireEvent.click(screen.getByTestId('drawer-promote-btn'));
    expect(onPromote).toHaveBeenCalledWith('entry-001');
  });

  it('applies drawerOpen class when entry is set', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    const drawer = screen.getByTestId('right-drawer');
    expect(drawer.className).toMatch(/drawerOpen/);
  });

  it('does not apply drawerOpen class when entry is null', () => {
    render(<RightDrawer entry={null} onClose={vi.fn()} />);
    const drawer = screen.getByTestId('right-drawer');
    expect(drawer.className).not.toMatch(/drawerOpen/);
  });

  // --- SourcePanel / "Read source" disclosure tests ---

  it('renders source panel toggle button', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    expect(screen.getByTestId('source-panel-toggle')).toBeTruthy();
  });

  it('source panel is collapsed by default when entry has why + howToApply', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    expect(screen.queryByTestId('source-panel-body')).toBeNull();
  });

  it('clicking toggle opens the panel and shows loading state then renders markdown', async () => {
    vi.mocked(ipcBridge.memory.readSourceContext.invoke).mockResolvedValue({
      ok: true,
      before: '## Context',
      anchor: 'Use Arco components everywhere.',
      after: '## End',
      totalLines: 50,
    });

    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    const toggle = screen.getByTestId('source-panel-toggle');
    fireEvent.click(toggle);

    // Panel body appears
    expect(screen.getByTestId('source-panel-body')).toBeTruthy();

    // Wait for the async fetch to resolve
    await waitFor(() => expect(screen.getByTestId('source-panel-anchor')).toBeTruthy());
    expect(screen.getByTestId('source-panel-anchor').textContent).toContain('Use Arco components everywhere.');
  });

  it('shows error message when IPC returns ok=false', async () => {
    vi.mocked(ipcBridge.memory.readSourceContext.invoke).mockResolvedValue({ ok: false, error: 'File not found' });

    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('source-panel-toggle'));

    await waitFor(() => expect(screen.getByTestId('source-panel-error')).toBeTruthy());
    expect(screen.getByTestId('source-panel-error').textContent).toContain('File not found');
  });

  it('re-toggling closed then open does NOT re-fetch (cached)', async () => {
    vi.mocked(ipcBridge.memory.readSourceContext.invoke).mockResolvedValue({
      ok: true,
      before: '',
      anchor: 'cached line',
      after: '',
      totalLines: 1,
    });

    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    const toggle = screen.getByTestId('source-panel-toggle');

    fireEvent.click(toggle); // open
    await waitFor(() => expect(screen.getByTestId('source-panel-anchor')).toBeTruthy());

    fireEvent.click(toggle); // close
    expect(screen.queryByTestId('source-panel-body')).toBeNull();

    fireEvent.click(toggle); // re-open
    expect(screen.getByTestId('source-panel-body')).toBeTruthy();

    // Fetch should only have been called once
    expect(vi.mocked(ipcBridge.memory.readSourceContext.invoke)).toHaveBeenCalledTimes(1);
  });

  it('auto-expands when both why and howToApply are empty', async () => {
    vi.mocked(ipcBridge.memory.readSourceContext.invoke).mockResolvedValue({
      ok: true,
      before: '',
      anchor: 'auto anchor',
      after: '',
      totalLines: 5,
    });

    const emptyEntry = { ...MOCK_ENTRY, why: '', howToApply: '' };
    render(<RightDrawer entry={emptyEntry} onClose={vi.fn()} />);

    // Panel body should be visible immediately (auto-expanded)
    expect(screen.getByTestId('source-panel-body')).toBeTruthy();

    await waitFor(() => expect(screen.getByTestId('source-panel-anchor')).toBeTruthy());
    expect(screen.getByTestId('source-panel-anchor').textContent).toContain('auto anchor');
  });

  // #414 - Edit / Delete row actions
  it('renders Edit and Delete actions', () => {
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} />);
    expect(screen.getByTestId('drawer-edit-btn')).toBeTruthy();
    expect(screen.getByTestId('drawer-delete-btn')).toBeTruthy();
  });

  it('clicking Edit calls onEdit with the full entry', () => {
    const onEdit = vi.fn();
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} onEdit={onEdit} />);
    fireEvent.click(screen.getByTestId('drawer-edit-btn'));
    expect(onEdit).toHaveBeenCalledWith(MOCK_ENTRY);
  });

  it('clicking Delete calls onDelete with the entry (confirm is owned by the host)', () => {
    const onDelete = vi.fn();
    render(<RightDrawer entry={MOCK_ENTRY} onClose={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('drawer-delete-btn'));
    expect(onDelete).toHaveBeenCalledWith(MOCK_ENTRY);
  });
});
