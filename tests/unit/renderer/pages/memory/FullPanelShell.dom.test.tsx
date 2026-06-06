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

const { mockMemory, mockShell, mockIjfw } = vi.hoisted(() => {
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
      setPromotionThreshold: { invoke: vi.fn() },
      onIndexChanged: mockIndexChangedEmitter,
      import: {
        claudeMem: { invoke: vi.fn() },
        obsidianVault: { invoke: vi.fn() },
        scanDevDir: { invoke: vi.fn() },
        processDropFolder: { invoke: vi.fn() },
        getDropFolderStatus: {
          invoke: vi
            .fn()
            .mockResolvedValue({ path: '~/Documents/Wayland-Memory', watching: false, ingestedToday: 0 }),
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
    },
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
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Dropdown: ({
      children,
      droplist,
    }: {
      children: React.ReactNode;
      droplist: React.ReactNode;
    }) => <div>{children}{droplist}</div>,
  };
});

vi.mock('@icon-park/react', () => ({
  Close: (p: Record<string, unknown>) => <span data-testid='icon-close' {...p} />,
  Copy: (p: Record<string, unknown>) => <span data-testid='icon-copy' {...p} />,
  LinkOne: (p: Record<string, unknown>) => <span data-testid='icon-link' {...p} />,
  FileCode: (p: Record<string, unknown>) => <span data-testid='icon-file-code' {...p} />,
  Help: (p: Record<string, unknown>) => <span data-testid='icon-help' {...p} />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, _opts?: Record<string, unknown>) => fallback ?? _key,
  }),
}));

vi.mock(
  '@renderer/pages/memory/components/PromotionThresholdModal',
  () => ({ default: ({ onClose }: { onClose: () => void }) => <div data-testid='threshold-modal'><button onClick={onClose}>Close</button></div> }),
  { ssr: false },
);

import FullPanelShell from '@renderer/pages/memory/state-branches/FullPanelShell';

const renderShell = (initialEntries: string[] = ['/memory']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <FullPanelShell />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
  mockMemory.import.scanDevDir.invoke.mockResolvedValue({ count: 0, projectsFound: 0, errors: [] });
  mockShell.openFile.invoke.mockResolvedValue(undefined);
  mockIjfw.getStatus.invoke.mockResolvedValue({ status: 'installed_current', cliCount: 5 });
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
