/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Regression for #792 (follow-up to #751): a render error inside the memory
 * detail panel (RightDrawer / Inspector) must NOT take down the whole memory
 * page. Before the fix there was no error boundary between RightDrawer and the
 * app-root boundary, so any throw blanked the entire app. FullPanelShell now
 * wraps RightDrawer in an <ErrorBoundary resetKeys={[selectedId]}> - a
 * resetKeys-based recovery (NOT a React key, which would remount the drawer and
 * break its width transition), so a detail-panel crash is contained: the memory
 * list stays mounted and selecting another entry clears the fallback.
 *
 * The real ErrorBoundary is intentionally NOT mocked here — it is the unit
 * under test. Everything else FullPanelShell pulls in is stubbed to keep the
 * render in jsdom and to give RightDrawer a controllable throw.
 */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Controllable state read from inside hoisted mock factories --------------
let drawerThrows = true;
let mockSelectedId: string | null = 'entry-A';

// --- Mocks -------------------------------------------------------------------
vi.mock('@/common', () => ({
  ipcBridge: { shell: { openFile: { invoke: vi.fn() } } },
}));

vi.mock('@/common/adapter/ipcBridge', () => {
  const emitter = { on: vi.fn(() => vi.fn()) };
  return {
    memory: {
      promote: { invoke: vi.fn() },
      deleteEntry: { invoke: vi.fn() },
      ingestFiles: { invoke: vi.fn() },
      getPromotionCandidates: { invoke: vi.fn().mockResolvedValue({ threshold: 90 }) },
      onIndexChanged: emitter,
    },
    ijfw: {
      getStatus: { invoke: vi.fn().mockResolvedValue({ status: 'installed_current', cliCount: 0 }) },
      onStatusChanged: emitter,
    },
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Handles both t('key', 'default') and t('key', { defaultValue }).
    t: (k: string, d?: string | { defaultValue?: string }) => (typeof d === 'string' ? d : (d?.defaultValue ?? k)),
  }),
}));

vi.mock('@/renderer/utils/platform', () => ({ formatModifierShortcut: (k: string) => k }));

vi.mock('@arco-design/web-react', () => ({
  Button: (p: Record<string, unknown>) => <button {...p} />,
  Input: (p: Record<string, unknown>) => <input {...p} />,
  Message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  Modal: { confirm: vi.fn() },
}));

vi.mock('lucide-react', () => {
  const Icon = () => <span />;
  return {
    Archive: Icon,
    Search: Icon,
    Import: Icon,
    Settings2: Icon,
    Plus: Icon,
    ChevronDown: Icon,
    ChevronRight: Icon,
  };
});

// Hooks: return controlled state so the list branch (non-empty) renders.
vi.mock('@renderer/pages/memory/hooks/useMemoryIndex', () => ({
  useMemoryIndex: () => ({
    stats: null,
    entries: [{ id: 'entry-A', type: 'decision', summary: 's' }],
    projects: [],
    tags: [],
    typeCounts: {},
    total: 1,
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));
vi.mock('@renderer/pages/memory/hooks/useSelectedEntry', () => ({
  useSelectedEntry: () => ({
    selectedId: mockSelectedId,
    selected: mockSelectedId ? { id: mockSelectedId, type: 'decision', summary: 's', body: 'b' } : null,
    selectEntry: vi.fn(),
    clearSelection: vi.fn(),
  }),
}));

// Child components stubbed to trivial markers. RightDrawer is the one that
// throws — the exact failure mode #792 is about.
vi.mock('@renderer/pages/memory/components/MemoryList', () => ({
  default: () => <div data-testid='memory-list-stub' />,
}));
vi.mock('@renderer/pages/memory/components/RightDrawer', () => ({
  default: () => {
    if (drawerThrows) throw new Error('boom: detail panel render crash');
    return <div data-testid='right-drawer-stub' />;
  },
}));
vi.mock('@renderer/pages/memory/components/TopbarChips', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/memory/components/StreakPill', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/memory/components/ProjectDropdown', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/memory/components/TimeDropdown', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/memory/components/TypeDropdown', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/memory/components/EmptyStateHero', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/memory/components/MemoryStatusBar', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/memory/components/ImportDrawer', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/memory/components/ComposerModal', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/memory/components/EntryEditorModal', () => ({ default: () => <div /> }));
vi.mock('@/renderer/pages/settings/components/IjfwSetupStatus', () => ({ default: () => <div /> }));

import FullPanelShell from '@renderer/pages/memory/state-branches/FullPanelShell';

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  drawerThrows = true;
  mockSelectedId = 'entry-A';
  // React logs caught render errors; the throw here is intentional, so keep the
  // test output clean.
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  errorSpy.mockRestore();
  vi.clearAllMocks();
});

describe('FullPanelShell detail-panel error boundary (#792)', () => {
  it('contains a RightDrawer render crash: the list survives and a fallback shows', () => {
    render(<FullPanelShell />);
    // The memory list is still mounted — the crash did NOT unmount the page.
    expect(screen.getByTestId('memory-list-stub')).toBeInTheDocument();
    // The boundary rendered its fallback in place of the drawer.
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    // The crashing drawer content is NOT in the tree.
    expect(screen.queryByTestId('right-drawer-stub')).toBeNull();
  });

  it('recovers when a different entry is selected (boundary resetKeys on selectedId)', () => {
    const { rerender } = render(<FullPanelShell />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Simulate the user selecting a different, healthy entry: the id changes and
    // the drawer no longer throws. selectedId is the boundary's resetKey, so the
    // fallback clears and the healthy drawer renders (no remount of the drawer).
    drawerThrows = false;
    mockSelectedId = 'entry-B';
    rerender(<FullPanelShell />);

    expect(screen.getByTestId('right-drawer-stub')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });
});
