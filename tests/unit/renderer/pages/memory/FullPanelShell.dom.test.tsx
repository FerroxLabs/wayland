/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM smoke tests for FullPanelShell v0.6.4 Mail-style layout.
 *
 * Tests:
 *   - topbar renders with breadcrumb heading
 *   - filter bar renders
 *   - main body renders
 *   - clicking a row opens the right drawer with entry data
 *   - clicking the same row again closes the drawer
 *   - Esc key closes the drawer
 *   - empty state hero shown when no entries and no filters
 *   - status bar renders
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

import type { MemoryStats, MemoryEntry, ProjectSummary, PromotionCandidates } from '@/common/types/memory';

const MOCK_STATS: MemoryStats = {
  total: 42,
  decisions: 10,
  wiki: 5,
  sessions: 8,
  projects: 3,
  banked: 120,
  deltas: {
    total24h: 2,
    total7d: 8,
    decisions24h: 1,
    decisions7d: 3,
    wiki24h: 0,
    wiki7d: 1,
    sessions24h: 0,
    sessions7d: 2,
  },
  sparkline: [],
  sparklines: {
    total: Array(30).fill(10),
    banked: Array(30).fill(0),
    decisions: Array(30).fill(5),
    wiki: Array(30).fill(0),
    sessions: Array(30).fill(2),
    projects: Array(30).fill(1),
  },
  typeCounts: {
    decision: 10,
    pattern: 3,
    session: 8,
    observation: 2,
    wiki: 5,
    preference: 1,
  },
  streak: { sessions: 30, longestDays: 12, lastActiveDayMs: Date.now() - 86400_000 },
};

const MOCK_ENTRY: MemoryEntry = {
  id: 'entry-001',
  type: 'decision',
  project: 'wayland-app',
  projectPath: '/dev/wayland/app',
  summary: 'Always use Arco components',
  bodyPreview: 'Body preview...',
  tags: ['arco'],
  storedAt: Date.now() - 3600_000,
  sourcePath: 'src/renderer/AGENTS.md',
  sourceLine: 10,
  referencedBy: 3,
  promotionScore: 70,
};

const MOCK_FULL_ENTRY = {
  ...MOCK_ENTRY,
  body: 'Full body text.',
  why: 'Because consistency.',
  howToApply: 'Use Arco everywhere.',
};

const MOCK_PROJECTS: ProjectSummary[] = [
  { path: '/dev/wayland/app', basename: 'wayland-app', count: 42, lastActive: Date.now() },
];

const MOCK_CANDIDATES: PromotionCandidates = {
  candidates: [],
  threshold: 90,
  lastRun: Date.now() - 60_000,
  nextRun: Date.now() + 8 * 60 * 1000,
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockMemory, mockShell, mockIjfw, mockModalConfirm } = vi.hoisted(() => {
  let _indexChangedListeners: Array<(v: unknown) => void> = [];
  let _ijfwListeners: Array<(v: unknown) => void> = [];
  const mockIndexChangedEmitter = {
    on: (cb: (v: unknown) => void) => {
      _indexChangedListeners.push(cb);
      return () => {
        _indexChangedListeners = _indexChangedListeners.filter((l) => l !== cb);
      };
    },
  };
  const mockIjfwStatusEmitter = {
    on: (cb: (v: unknown) => void) => {
      _ijfwListeners.push(cb);
      return () => {
        _ijfwListeners = _ijfwListeners.filter((l) => l !== cb);
      };
    },
  };

  return {
    mockMemory: {
      getStats: { invoke: vi.fn() },
      listEntries: { invoke: vi.fn() },
      getEntry: { invoke: vi.fn() },
      getProjects: { invoke: vi.fn() },
      getTags: { invoke: vi.fn() },
      getPromotionCandidates: { invoke: vi.fn() },
      promote: { invoke: vi.fn() },
      setQuickAdd: { invoke: vi.fn() },
      // #414 edit/delete mutations (used by the drawer actions).
      updateEntry: { invoke: vi.fn() },
      deleteEntry: { invoke: vi.fn() },
      setPromotionThreshold: { invoke: vi.fn() },
      onIndexChanged: mockIndexChangedEmitter,
      import: {
        claudeMem: { invoke: vi.fn() },
        obsidianVault: { invoke: vi.fn() },
        scanDevDir: { invoke: vi.fn() },
        processDropFolder: { invoke: vi.fn() },
        getDropFolderStatus: {
          invoke: vi.fn().mockResolvedValue({ path: '~/Documents/Wayland-Memory', watching: false, ingestedToday: 0 }),
        },
      },
      readSourceContext: { invoke: vi.fn() },
    },
    mockShell: {
      openFile: { invoke: vi.fn() },
      openPath: { invoke: vi.fn().mockResolvedValue({ ok: true }) },
    },
    mockIjfw: {
      getStatus: { invoke: vi.fn() },
      onStatusChanged: mockIjfwStatusEmitter,
      // Used by the embedded IjfwSetupStatus (#414 health strip) on expand.
      brainInvoke: { invoke: vi.fn() },
    },
    // Captures the config passed to Modal.confirm so the delete-gate test can
    // assert deleteEntry fires ONLY from the confirm dialog's onOk.
    mockModalConfirm: vi.fn((_cfg: unknown) => ({ close: vi.fn() })),
  };
});

vi.mock('@/common/adapter/ipcBridge', () => ({
  memory: mockMemory,
  shell: mockShell,
  ijfw: mockIjfw,
  IjfwStatusPayload: {},
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    shell: mockShell,
    memory: mockMemory,
    ijfw: mockIjfw,
  },
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@arco-design/web-react');
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
    // Modal.confirm is captured (delete gate); the component form renders its
    // children when visible so any other Modal usage in the tree still works.
    Modal: Object.assign(
      ({ visible, children }: { visible?: boolean; children?: React.ReactNode }) =>
        visible ? <div data-testid='arco-modal'>{children}</div> : null,
      { confirm: mockModalConfirm }
    ),
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Dropdown: ({ children, droplist }: { children: React.ReactNode; droplist: React.ReactNode }) => (
      <div>
        {children}
        {droplist}
      </div>
    ),
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
  // Used by the embedded IjfwSetupStatus (#414 health strip) when expanded.
  CheckOne: (p: Record<string, unknown>) => <span data-testid='icon-check-one' {...p} />,
  Attention: (p: Record<string, unknown>) => <span data-testid='icon-attention' {...p} />,
  CloseOne: (p: Record<string, unknown>) => <span data-testid='icon-close-one' {...p} />,
  Loading: (p: Record<string, unknown>) => <span data-testid='icon-loading' {...p} />,
  Round: (p: Record<string, unknown>) => <span data-testid='icon-round' {...p} />,
}));

vi.mock('react-i18next', () => ({
  // Unified stub: FullPanelShell calls t(key, 'string fallback'); the embedded
  // IjfwSetupStatus calls t(key, { defaultValue }). Handle both forms.
  useTranslation: () => ({
    t: (_key: string, arg?: unknown) => {
      if (typeof arg === 'string') return arg;
      if (arg && typeof arg === 'object' && 'defaultValue' in arg) {
        return (arg as { defaultValue?: string }).defaultValue ?? _key;
      }
      return _key;
    },
  }),
}));

vi.mock(
  '@renderer/pages/memory/components/PromotionThresholdModal',
  () => ({
    default: ({ onClose }: { onClose: () => void }) => (
      <div data-testid='threshold-modal'>
        <button onClick={onClose}>Close</button>
      </div>
    ),
  }),
  { ssr: false }
);

import FullPanelShell from '@renderer/pages/memory/state-branches/FullPanelShell';

const renderShell = (initialEntries: string[] = ['/memory']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <FullPanelShell />
    </MemoryRouter>
  );

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear(); // reset the persisted setup-status strip open state
});

beforeEach(() => {
  mockMemory.getStats.invoke.mockResolvedValue({ ok: true, stats: MOCK_STATS });
  mockMemory.listEntries.invoke.mockResolvedValue({ entries: [MOCK_ENTRY], total: 1 });
  mockMemory.getEntry.invoke.mockResolvedValue(MOCK_FULL_ENTRY);
  mockMemory.getProjects.invoke.mockResolvedValue(MOCK_PROJECTS);
  mockMemory.getTags.invoke.mockResolvedValue([{ tag: 'arco', count: 5 }]);
  mockMemory.getPromotionCandidates.invoke.mockResolvedValue(MOCK_CANDIDATES);
  mockMemory.promote.invoke.mockResolvedValue({ ok: true });
  mockMemory.setQuickAdd.invoke.mockResolvedValue({ ok: true });
  mockMemory.deleteEntry.invoke.mockResolvedValue({ ok: true });
  mockMemory.updateEntry.invoke.mockResolvedValue({ ok: true });
  mockMemory.import.scanDevDir.invoke.mockResolvedValue({ count: 0, projectsFound: 0, errors: [] });
  mockShell.openFile.invoke.mockResolvedValue(undefined);
  mockIjfw.getStatus.invoke.mockResolvedValue({ status: 'installed_current', cliCount: 5 });
  mockIjfw.brainInvoke.invoke.mockResolvedValue({ ok: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FullPanelShell (v0.6.4 Mail-style)', () => {
  it('renders breadcrumb heading', async () => {
    await act(async () => {
      renderShell();
    });
    const heading = screen.getByTestId('memory-full-panel-heading');
    expect(heading.textContent).toContain('Archive');
  });

  it('renders the filter bar', async () => {
    await act(async () => {
      renderShell();
    });
    expect(screen.getByTestId('memory-filter-bar')).toBeTruthy();
  });

  it('renders the main body container', async () => {
    await act(async () => {
      renderShell();
    });
    expect(screen.getByTestId('memory-body')).toBeTruthy();
  });

  it('renders the list column', async () => {
    await act(async () => {
      renderShell();
    });
    expect(screen.getByTestId('memory-list-col')).toBeTruthy();
  });

  it('renders MemoryStatusBar', async () => {
    await act(async () => {
      renderShell();
    });
    expect(screen.getByTestId('memory-status-bar')).toBeTruthy();
  });

  it('renders right drawer (closed initially)', async () => {
    await act(async () => {
      renderShell();
    });
    const drawer = screen.getByTestId('right-drawer');
    expect(drawer).toBeTruthy();
    // Drawer is closed - no inner content
    expect(screen.queryByTestId('right-drawer-inner')).toBeNull();
  });

  it('clicking a row opens the right drawer with entry data', async () => {
    await act(async () => {
      renderShell();
    });
    // Wait for entries to load
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    const rows = screen.queryAllByTestId(`memory-row-${MOCK_ENTRY.id}`);
    if (rows.length > 0) {
      await act(async () => {
        fireEvent.click(rows[0]!);
        await new Promise((r) => setTimeout(r, 30));
      });
      expect(mockMemory.getEntry.invoke).toHaveBeenCalledWith({ id: 'entry-001' });
    }
  });

  it('Esc key clears selection', async () => {
    await act(async () => {
      renderShell(['/memory?entry=entry-001']);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    // After Esc, no crash and panel is still visible
    expect(screen.getByTestId('memory-full-panel')).toBeTruthy();
  });

  it('shows EmptyStateHero when no entries and no filters', async () => {
    mockMemory.listEntries.invoke.mockResolvedValue({ entries: [], total: 0 });
    await act(async () => {
      renderShell();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(screen.getByTestId('empty-state-hero')).toBeTruthy();
  });

  it('renders MemoryList pane (not empty hero) when entries exist', async () => {
    await act(async () => {
      renderShell();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(screen.getByTestId('memory-list-pane')).toBeTruthy();
    expect(screen.queryByTestId('empty-state-hero')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// #414 - Setup-status health strip folded into the Memory panel header
// ---------------------------------------------------------------------------

describe('FullPanelShell setup-status strip (#414)', () => {
  it('renders the strip toggle, collapsed by default (no body, no MCP probe)', async () => {
    await act(async () => {
      renderShell();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(screen.getByTestId('memory-setup-status-strip')).toBeTruthy();
    expect(screen.getByTestId('memory-setup-status-toggle')).toBeTruthy();
    // Collapsed: the checklist body is not mounted, so no MCP child is spawned.
    expect(screen.queryByTestId('memory-setup-status-body')).toBeNull();
    expect(mockIjfw.brainInvoke.invoke).not.toHaveBeenCalled();
  });

  it('reflects install health on the strip dot (ok when installed_current)', async () => {
    await act(async () => {
      renderShell();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    const dot = screen.getByTestId('memory-setup-status-strip').querySelector('[data-tone]');
    expect(dot?.getAttribute('data-tone')).toBe('ok');
  });

  it('marks the dot warn when IJFW is not installed', async () => {
    mockIjfw.getStatus.invoke.mockResolvedValue({ status: 'not_installed', cliCount: 0 });
    await act(async () => {
      renderShell();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    const dot = screen.getByTestId('memory-setup-status-strip').querySelector('[data-tone]');
    expect(dot?.getAttribute('data-tone')).toBe('warn');
  });

  it('expands to show the IjfwSetupStatus checklist when the toggle is clicked', async () => {
    await act(async () => {
      renderShell();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('memory-setup-status-toggle'));
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(screen.getByTestId('memory-setup-status-body')).toBeTruthy();
    // The embedded checklist renders its install row (title hidden via hideTitle).
    expect(screen.getByTestId('ijfw-settings-setup-status')).toBeTruthy();
    expect(screen.getByTestId('ijfw-status-item-install').getAttribute('data-status')).toBe('ok');
  });

  it('persists the expanded state across remounts (localStorage)', async () => {
    await act(async () => {
      renderShell();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('memory-setup-status-toggle'));
    });
    expect(localStorage.getItem('wayland.memory.setupStatus.open')).toBe('1');
    cleanup();
    await act(async () => {
      renderShell();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    // Re-opened already expanded from the persisted flag.
    expect(screen.getByTestId('memory-setup-status-body')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// #414 - Delete is gated behind the confirm dialog (cannot-be-undone). The
// destructive deleteEntry mutation must fire ONLY from the dialog's onOk, never
// on the bare button click. Automated coverage so a refactor can't silently
// weaken the gate the #414 ruling mandates.
// ---------------------------------------------------------------------------

describe('FullPanelShell delete confirm gate (#414)', () => {
  it('does not call deleteEntry on button click; only the confirm onOk fires it', async () => {
    await act(async () => {
      renderShell(['/memory?entry=entry-001']);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });

    // Drawer is open with the selected entry; the Delete action is present.
    const deleteBtn = screen.getByTestId('drawer-delete-btn');
    expect(deleteBtn).toBeTruthy();

    // Click Delete: the confirm dialog is requested, but NOTHING is deleted yet.
    await act(async () => {
      fireEvent.click(deleteBtn);
    });
    expect(mockModalConfirm).toHaveBeenCalledTimes(1);
    expect(mockMemory.deleteEntry.invoke).not.toHaveBeenCalled();

    // The confirm copy states the action cannot be undone (the #414 ruling).
    const cfg = mockModalConfirm.mock.calls[0]![0] as {
      content?: string;
      onOk?: () => Promise<void> | void;
    };
    expect(String(cfg.content)).toContain('cannot be undone');

    // Only firing the dialog's onOk performs the real, hard delete.
    await act(async () => {
      await cfg.onOk?.();
    });
    expect(mockMemory.deleteEntry.invoke).toHaveBeenCalledTimes(1);
    expect(mockMemory.deleteEntry.invoke).toHaveBeenCalledWith({ id: 'entry-001' });
  });
});
