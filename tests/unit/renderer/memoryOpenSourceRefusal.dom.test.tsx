/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Memory archive - "Open source file" must never be a silent dead click.
 *
 * `ipcBridge` is RESOLVE-ONLY: `shell.openFile` reports a refusal (path not
 * confined, or a type the open-target gate declines) as a RESOLVED
 * `{ ok: false, error }`, never as a rejection. A handler that only attached
 * `.catch()` therefore did nothing at all on a refusal - no toast, and the
 * clipboard fallback that was the whole point of the handler never ran. That is
 * the same resolve-only silent-hang class that already shipped twice in 0.12.0.
 *
 * These tests drive the real `FullPanelShell` handler through the drawer prop the
 * button is wired to, so the assertion covers the wiring, not a helper in
 * isolation.
 */

import { render, act } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  openFile: vi.fn(),
  writeText: vi.fn(),
  messageSuccess: vi.fn(),
  messageError: vi.fn(),
  /** Captured from the RightDrawer stub: the real handler under test. */
  onOpenSource: null as ((path: string, line: number) => void) | null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : _key),
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, ...rest }: React.ComponentProps<'button'>) => <button {...rest}>{children}</button>,
  Input: Object.assign((props: React.ComponentProps<'input'>) => <input {...props} />, {
    Search: (props: React.ComponentProps<'input'>) => <input {...props} />,
  }),
  Message: { success: h.messageSuccess, error: h.messageError, warning: vi.fn() },
  Modal: { confirm: vi.fn() },
}));

vi.mock('lucide-react', () => {
  const Icon = () => <span />;
  return {
    Archive: Icon,
    ArchiveRestore: Icon,
    Search: Icon,
    Import: Icon,
    Settings2: Icon,
    Plus: Icon,
    ChevronDown: Icon,
    ChevronRight: Icon,
  };
});

vi.mock('@/common', () => ({
  ipcBridge: { shell: { openFile: { invoke: h.openFile } } },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  memory: {
    getPromotionCandidates: { invoke: vi.fn().mockResolvedValue({ threshold: 90 }) },
    onIndexChanged: { on: () => () => {} },
    promote: { invoke: vi.fn() },
    deleteEntry: { invoke: vi.fn() },
    ingestFiles: { invoke: vi.fn() },
  },
  ijfw: {
    getStatus: { invoke: vi.fn().mockResolvedValue({ cliCount: 0, status: 'installed_current' }) },
    onStatusChanged: { on: () => () => {} },
  },
}));

vi.mock('@/renderer/utils/platform', () => ({ formatModifierShortcut: (k: string) => k }));

// --- Child components: stubs. The one that matters is RightDrawer, which owns
// the "Open source file" button and receives the handler under test.
vi.mock('@/renderer/pages/memory/components/RightDrawer', () => ({
  default: ({ onOpenSource }: { onOpenSource?: (p: string, l: number) => void }) => {
    h.onOpenSource = onOpenSource ?? null;
    return <div data-testid='right-drawer' />;
  },
}));

vi.mock('@/renderer/pages/memory/components/MemoryList', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/TopbarChips', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/StreakPill', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/ProjectDropdown', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/TimeDropdown', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/TypeDropdown', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/EmptyStateHero', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/MemoryStatusBar', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/ImportDrawer', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/ComposerModal', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/EntryEditorModal', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/ArchivedMemoryModal', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/memory/components/PromotionThresholdModal', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/settings/components/IjfwSetupStatus', () => ({ default: () => <div /> }));
vi.mock('@/renderer/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const entry = {
  id: 'm1',
  type: 'decision',
  title: 'A memory',
  project: 'wayland',
  sourcePath: '/authorized/workspace/src/module.ts',
  sourceLine: 12,
};

vi.mock('@/renderer/pages/memory/hooks/useMemoryIndex', () => ({
  useMemoryIndex: () => ({
    stats: { total: 1 },
    entries: [entry],
    projects: [],
    total: 1,
    isLoading: false,
    reload: vi.fn(),
  }),
}));

vi.mock('@/renderer/pages/memory/hooks/useSelectedEntry', () => ({
  useSelectedEntry: () => ({
    selectedId: 'm1',
    selected: entry,
    selectEntry: vi.fn(),
    clearSelection: vi.fn(),
  }),
}));

import FullPanelShell from '@/renderer/pages/memory/state-branches/FullPanelShell';

const SOURCE_PATH = '/authorized/workspace/src/module.ts';

/** Mount the shell and hand back the real `onOpenSource` handler. */
async function mountAndGetHandler(): Promise<(p: string, l: number) => void> {
  await act(async () => {
    render(<FullPanelShell />);
  });
  expect(h.onOpenSource).toBeTypeOf('function');
  return h.onOpenSource!;
}

describe('Memory archive "Open source file" - resolve-only refusals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.onOpenSource = null;
    h.writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: h.writeText },
      configurable: true,
    });
  });

  it('falls back to copying the path when the bridge RESOLVES a refusal', async () => {
    // The refusal the shell providers actually emit: a resolved {ok:false},
    // never a rejection.
    h.openFile.mockResolvedValue({ ok: false, error: 'refusing to open ".ts": not an openable document type' });

    const openSource = await mountAndGetHandler();
    await act(async () => {
      openSource(SOURCE_PATH, 12);
    });

    expect(h.openFile).toHaveBeenCalledWith(SOURCE_PATH);
    expect(h.writeText).toHaveBeenCalledWith(SOURCE_PATH);
    expect(h.messageSuccess).toHaveBeenCalled();
  });

  it('also falls back when the invoke rejects outright', async () => {
    h.openFile.mockRejectedValue(new Error('bridge blew up'));

    const openSource = await mountAndGetHandler();
    await act(async () => {
      openSource(SOURCE_PATH, 12);
    });

    expect(h.writeText).toHaveBeenCalledWith(SOURCE_PATH);
    expect(h.messageSuccess).toHaveBeenCalled();
  });

  it('does not copy the path when the file actually opened', async () => {
    h.openFile.mockResolvedValue({ ok: true });

    const openSource = await mountAndGetHandler();
    await act(async () => {
      openSource(SOURCE_PATH, 12);
    });

    expect(h.openFile).toHaveBeenCalledWith(SOURCE_PATH);
    expect(h.writeText).not.toHaveBeenCalled();
  });
});
