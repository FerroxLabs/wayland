/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * GitHub #924 - a project-scoped save must name its project, through the REAL
 * renderer path.
 *
 * This drives the actual `/memory` route component tree (FullPanelShell ->
 * ComposerModal -> ipcBridge.memory.setQuickAdd), not a service-level harness.
 * That distinction is the whole point of this file: an earlier attempt at #924
 * resolved the project from `useActiveBrainScope()`, which reads
 * `ConversationProvider`. `/memory` is a SIBLING route to `/conversation/:id`
 * and mounts no such provider, so the hook always returned the app scope and
 * the wiring was inert - every project-scoped save fell through to the global
 * store, which `loadGlobalMemoryBlock` injects into every chat in every
 * project. A service-level test could not see that; this one can.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemoryStats, MemoryEntry, ProjectSummary, PromotionCandidates } from '@/common/types/memory';

const ALPHA = '/dev/project-alpha';
const BETA = '/dev/project-beta';
const GAMMA = '/dev/project-gamma';

const MOCK_PROJECTS: ProjectSummary[] = [
  { path: ALPHA, basename: 'project-alpha', count: 9, lastActive: Date.now() },
  { path: BETA, basename: 'project-beta', count: 2, lastActive: Date.now() - 100_000 },
];

const MOCK_STATS = {
  total: 11,
  decisions: 1,
  wiki: 0,
  sessions: 0,
  projects: 2,
  banked: 0,
  deltas: {
    total24h: 0,
    total7d: 0,
    decisions24h: 0,
    decisions7d: 0,
    wiki24h: 0,
    wiki7d: 0,
    sessions24h: 0,
    sessions7d: 0,
  },
  sparkline: [],
  sparklines: {
    total: [],
    banked: [],
    decisions: [],
    wiki: [],
    sessions: [],
    projects: [],
  },
  typeCounts: { decision: 1, pattern: 0, session: 0, observation: 0, wiki: 0, preference: 0 },
  streak: { sessions: 0, longestDays: 0, lastActiveDayMs: Date.now() },
} as unknown as MemoryStats;

const MOCK_ENTRY: MemoryEntry = {
  id: 'e1',
  type: 'decision',
  project: 'project-alpha',
  projectPath: ALPHA,
  summary: 'seed',
  bodyPreview: 'seed',
  tags: [],
  storedAt: Date.now(),
  sourcePath: `${ALPHA}/.ijfw/memory/knowledge.md`,
  sourceLine: 1,
  referencedBy: 0,
  promotionScore: 0,
};

const MOCK_CANDIDATES: PromotionCandidates = {
  candidates: [],
  threshold: 90,
  lastRun: Date.now(),
  nextRun: Date.now() + 1000,
};

const { mockMemory, mockShell, mockIjfw, mockModalConfirm, indexListeners } = vi.hoisted(() => {
  const emitter = { on: () => () => {} };
  // A REAL listener registry for memory.onIndexChanged: the F1 regression below
  // only happens when the index-changed handlers actually run, so a no-op
  // emitter cannot see it.
  const indexListeners: Array<() => void> = [];
  return {
    indexListeners,
    mockMemory: {
      getStats: { invoke: vi.fn() },
      listEntries: { invoke: vi.fn() },
      getEntry: { invoke: vi.fn() },
      getProjects: { invoke: vi.fn() },
      getTags: { invoke: vi.fn() },
      getPromotionCandidates: { invoke: vi.fn() },
      promote: { invoke: vi.fn() },
      setQuickAdd: { invoke: vi.fn() },
      updateEntry: { invoke: vi.fn() },
      deleteEntry: { invoke: vi.fn() },
      listArchivedEntries: { invoke: vi.fn() },
      restoreArchivedEntry: { invoke: vi.fn() },
      setPromotionThreshold: { invoke: vi.fn() },
      onIndexChanged: {
        on: (cb: () => void) => {
          indexListeners.push(cb);
          return () => {
            const i = indexListeners.indexOf(cb);
            if (i >= 0) indexListeners.splice(i, 1);
          };
        },
      },
      import: {
        claudeMem: { invoke: vi.fn() },
        obsidianVault: { invoke: vi.fn() },
        scanDevDir: { invoke: vi.fn() },
        processDropFolder: { invoke: vi.fn() },
        getDropFolderStatus: { invoke: vi.fn().mockResolvedValue({ path: '~/x', watching: false, ingestedToday: 0 }) },
      },
      readSourceContext: { invoke: vi.fn() },
    },
    mockShell: { openFile: { invoke: vi.fn() }, openPath: { invoke: vi.fn().mockResolvedValue({ ok: true }) } },
    mockIjfw: { getStatus: { invoke: vi.fn() }, onStatusChanged: emitter, brainInvoke: { invoke: vi.fn() } },
    mockModalConfirm: vi.fn(() => ({ close: vi.fn() })),
  };
});

vi.mock('@/common/adapter/ipcBridge', () => ({
  memory: mockMemory,
  shell: mockShell,
  ijfw: mockIjfw,
  IjfwStatusPayload: {},
}));
vi.mock('@/common', () => ({ ipcBridge: { shell: mockShell, memory: mockMemory, ijfw: mockIjfw } }));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@arco-design/web-react');
  return {
    ...actual,
    Message: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
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

vi.mock(
  '@icon-park/react',
  () =>
    new Proxy(
      {},
      {
        get: () => (p: Record<string, unknown>) => <span {...p} />,
      }
    )
);

vi.mock('react-i18next', () => ({
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

vi.mock('@renderer/pages/memory/components/PromotionThresholdModal', () => ({
  default: () => <div />,
}));

import FullPanelShell from '@renderer/pages/memory/state-branches/FullPanelShell';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  indexListeners.length = 0;
});

beforeEach(() => {
  mockMemory.getStats.invoke.mockResolvedValue({ ok: true, stats: MOCK_STATS });
  mockMemory.listEntries.invoke.mockResolvedValue({ entries: [MOCK_ENTRY], total: 1 });
  mockMemory.getEntry.invoke.mockResolvedValue({ ...MOCK_ENTRY, body: 'b' });
  mockMemory.getProjects.invoke.mockResolvedValue(MOCK_PROJECTS);
  mockMemory.getTags.invoke.mockResolvedValue([]);
  mockMemory.getPromotionCandidates.invoke.mockResolvedValue(MOCK_CANDIDATES);
  mockMemory.setQuickAdd.invoke.mockResolvedValue({ ok: true });
  mockMemory.listArchivedEntries.invoke.mockResolvedValue([]);
  mockMemory.import.scanDevDir.invoke.mockResolvedValue({ count: 0, projectsFound: 0, errors: [] });
  mockIjfw.getStatus.invoke.mockResolvedValue({ status: 'installed_current', cliCount: 0 });
  mockIjfw.brainInvoke.invoke.mockResolvedValue({ ok: true });
});

async function openComposer(): Promise<void> {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/memory']}>
        <FullPanelShell />
      </MemoryRouter>
    );
  });
  await act(async () => {
    fireEvent.click(screen.getByTestId('memory-btn-quickadd'));
  });
}

describe('#924 F1: project-scoped save through the real /memory renderer path', () => {
  it('sends a concrete projectPath, so the write can never fall through to the global store', async () => {
    await openComposer();

    fireEvent.change(screen.getByTestId('composer-textarea'), {
      target: { value: 'note that must stay in one project' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });

    await waitFor(() => expect(mockMemory.setQuickAdd.invoke).toHaveBeenCalled());
    const payload = mockMemory.setQuickAdd.invoke.mock.calls[0][0];

    expect(payload.scope).toBe('project');
    // The regression: projectPath absent -> main cannot place the write.
    expect(payload.projectPath).toBeTruthy();
    expect(MOCK_PROJECTS.map((p) => p.path)).toContain(payload.projectPath);
  });

  it('names the destination in the UI before the user saves', async () => {
    await openComposer();
    const dest = screen.getByTestId('composer-destination');
    expect(dest.textContent).toContain('Saving to');
    expect(dest.textContent).toContain('project-alpha');
  });

  it('switching to global scope names the global destination and drops projectPath', async () => {
    await openComposer();

    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-scope-global'));
    });
    expect(screen.getByTestId('composer-destination').textContent).toContain('Global memory');

    fireEvent.change(screen.getByTestId('composer-textarea'), { target: { value: 'global note' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });

    await waitFor(() => expect(mockMemory.setQuickAdd.invoke).toHaveBeenCalled());
    const payload = mockMemory.setQuickAdd.invoke.mock.calls[0][0];
    expect(payload.scope).toBe('global');
    expect(payload.projectPath).toBeUndefined();
  });

  /**
   * #924 recurrence: the reset effect re-seeded the destination from
   * `projects[0]` whenever its deps changed. The Memory page re-fetches its
   * project list on every `onIndexChanged`, which IJFW fires whenever an agent
   * writes memory in the background, so a refresh that reordered the list
   * rewrote the user's explicit pick WHILE THE MODAL WAS OPEN and the note went
   * to a project they never named.
   */
  it('keeps the destination the user picked when a background index refresh reorders the projects', async () => {
    await openComposer();

    // Explicit pick: project-beta, not the default first entry.
    await act(async () => {
      fireEvent.change(screen.getByTestId('composer-project-picker'), { target: { value: BETA } });
    });
    expect(screen.getByTestId('composer-destination').textContent).toContain('project-beta');

    // A background write lands and GAMMA becomes the most recent project.
    mockMemory.getProjects.invoke.mockResolvedValue([
      { path: GAMMA, basename: 'project-gamma', count: 1, lastActive: Date.now() + 100_000 },
      ...MOCK_PROJECTS,
    ]);
    expect(indexListeners.length).toBeGreaterThan(0);
    await act(async () => {
      indexListeners.forEach((fire) => fire());
    });

    // Control: the refresh really did reach the open composer - GAMMA is now an
    // option - so a picker that still reads BETA is holding the user's choice,
    // not merely failing to notice the change.
    await waitFor(() => {
      const picker = screen.getByTestId('composer-project-picker') as HTMLSelectElement;
      expect(Array.from(picker.options).map((o) => o.value)).toContain(GAMMA);
    });
    expect((screen.getByTestId('composer-project-picker') as HTMLSelectElement).value).toBe(BETA);
    expect(screen.getByTestId('composer-destination').textContent).toContain('project-beta');

    fireEvent.change(screen.getByTestId('composer-textarea'), { target: { value: 'beta-only note' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });

    await waitFor(() => expect(mockMemory.setQuickAdd.invoke).toHaveBeenCalled());
    expect(mockMemory.setQuickAdd.invoke.mock.calls[0][0].projectPath).toBe(BETA);
  });

  /**
   * #924 F1: `getProjects` returns the GLOBAL store (`~/.ijfw/memory`) as an
   * ordinary row so the Memory tab can browse it (#137), and it sorts to the
   * FRONT right after any global save, drop ingest or importer run - which is
   * exactly what seeds the composer's destination. The user would read
   * "Saving to: <their-username>", write a project-private note, and land it in
   * the store injected into every chat in every project.
   */
  it('never offers or seeds the global store as a project destination', async () => {
    mockMemory.getProjects.invoke.mockResolvedValue([
      { path: '/Users/someone', basename: 'someone', count: 40, lastActive: Date.now() + 100_000, isGlobalStore: true },
      ...MOCK_PROJECTS,
    ]);
    await openComposer();

    // Seeded from the first REAL project, not the global store.
    expect(screen.getByTestId('composer-destination').textContent).toContain('project-alpha');
    expect(screen.getByTestId('composer-destination').textContent).not.toContain('someone');
    const picker = screen.getByTestId('composer-project-picker') as HTMLSelectElement;
    expect(Array.from(picker.options).map((o) => o.value)).toEqual([ALPHA, BETA]);

    fireEvent.change(screen.getByTestId('composer-textarea'), { target: { value: 'project-private note' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });
    await waitFor(() => expect(mockMemory.setQuickAdd.invoke).toHaveBeenCalled());
    expect(mockMemory.setQuickAdd.invoke.mock.calls[0][0].projectPath).toBe(ALPHA);
  });

  /**
   * Over-filter guard: dropping the global store from the PROJECT picker must
   * not touch the deliberate global save, which is the supported way in.
   */
  it('still saves to global when the user picks the global scope', async () => {
    mockMemory.getProjects.invoke.mockResolvedValue([
      { path: '/Users/someone', basename: 'someone', count: 40, lastActive: Date.now() + 100_000, isGlobalStore: true },
      ...MOCK_PROJECTS,
    ]);
    await openComposer();
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-scope-global'));
    });
    expect(screen.getByTestId('composer-destination').textContent).toContain('Global memory');

    fireEvent.change(screen.getByTestId('composer-textarea'), { target: { value: 'deliberate global note' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });
    await waitFor(() => expect(mockMemory.setQuickAdd.invoke).toHaveBeenCalled());
    const payload = mockMemory.setQuickAdd.invoke.mock.calls[0][0];
    expect(payload.scope).toBe('global');
    expect(payload.projectPath).toBeUndefined();
  });

  /**
   * #924 F2: the same race, for the user who never touches the picker. The
   * "authoritative" flag is set ONLY by the <select> onChange, and that select
   * renders only when more than one project is indexed - so a user who reads
   * "Saving to: project-alpha" and accepts it never sets it. The background
   * refresh then re-seeds the destination out from under them and the note goes
   * somewhere they were never shown.
   */
  it('saves to the destination it SHOWED, even when the user never touched the picker', async () => {
    await openComposer();
    expect(screen.getByTestId('composer-destination').textContent).toContain('project-alpha');

    // A background agent write lands; GAMMA becomes the most recent project.
    mockMemory.getProjects.invoke.mockResolvedValue([
      { path: GAMMA, basename: 'project-gamma', count: 1, lastActive: Date.now() + 100_000 },
      ...MOCK_PROJECTS,
    ]);
    expect(indexListeners.length).toBeGreaterThan(0);
    await act(async () => {
      indexListeners.forEach((fire) => fire());
    });

    // Control: the refresh really reached the open composer.
    await waitFor(() => {
      const picker = screen.getByTestId('composer-project-picker') as HTMLSelectElement;
      expect(Array.from(picker.options).map((o) => o.value)).toContain(GAMMA);
    });

    // The destination the user was shown must not have moved.
    expect(screen.getByTestId('composer-destination').textContent).toContain('project-alpha');

    fireEvent.change(screen.getByTestId('composer-textarea'), { target: { value: 'note for alpha' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });

    await waitFor(() => expect(mockMemory.setQuickAdd.invoke).toHaveBeenCalled());
    expect(mockMemory.setQuickAdd.invoke.mock.calls[0][0].projectPath).toBe(ALPHA);
  });

  /**
   * Over-freeze guard: freezing the SEED must not freeze the picker. A
   * deliberate change after a background refresh still has to win.
   */
  it('still honours a deliberate picker change made after a background refresh', async () => {
    await openComposer();

    mockMemory.getProjects.invoke.mockResolvedValue([
      { path: GAMMA, basename: 'project-gamma', count: 1, lastActive: Date.now() + 100_000 },
      ...MOCK_PROJECTS,
    ]);
    await act(async () => {
      indexListeners.forEach((fire) => fire());
    });
    await waitFor(() => {
      const picker = screen.getByTestId('composer-project-picker') as HTMLSelectElement;
      expect(Array.from(picker.options).map((o) => o.value)).toContain(GAMMA);
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId('composer-project-picker'), { target: { value: GAMMA } });
    });
    expect(screen.getByTestId('composer-destination').textContent).toContain('project-gamma');

    fireEvent.change(screen.getByTestId('composer-textarea'), { target: { value: 'note for gamma' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });
    await waitFor(() => expect(mockMemory.setQuickAdd.invoke).toHaveBeenCalled());
    expect(mockMemory.setQuickAdd.invoke.mock.calls[0][0].projectPath).toBe(GAMMA);
  });

  /**
   * The seed must stay live while the destination is still UNRESOLVED: on a cold
   * open the project list arrives after the modal mounts, and a freeze that
   * started before it landed would leave the destination permanently blank.
   */
  it('still fills a blank destination in when the project list arrives after open', async () => {
    mockMemory.getProjects.invoke.mockResolvedValue([]);
    await openComposer();
    expect(screen.getByTestId('composer-destination').textContent).toContain('no project selected');

    mockMemory.getProjects.invoke.mockResolvedValue(MOCK_PROJECTS);
    await act(async () => {
      indexListeners.forEach((fire) => fire());
    });

    await waitFor(() => expect(screen.getByTestId('composer-destination').textContent).toContain('project-alpha'));

    fireEvent.change(screen.getByTestId('composer-textarea'), { target: { value: 'late list note' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });
    await waitFor(() => expect(mockMemory.setQuickAdd.invoke).toHaveBeenCalled());
    expect(mockMemory.setQuickAdd.invoke.mock.calls[0][0].projectPath).toBe(ALPHA);
  });

  /**
   * First run: nothing indexed yet, so there is no project to name and main
   * refuses the save with the internal code `unresolved_project_scope`. That
   * code was printed straight at the user, which tells them nothing and hides
   * the one action that works (switch to global).
   */
  it('explains a refused project-scoped save instead of printing the internal code', async () => {
    mockMemory.getProjects.invoke.mockResolvedValue([]);
    // Mirror main: it refuses ONLY a project-scoped save it cannot place.
    mockMemory.setQuickAdd.invoke.mockImplementation(async (payload: { scope: string; projectPath?: string }) =>
      payload.scope === 'project' && !payload.projectPath
        ? { ok: false, error: 'unresolved_project_scope' }
        : { ok: true }
    );
    await openComposer();
    expect(screen.queryByTestId('composer-project-picker')).toBeNull();

    fireEvent.change(screen.getByTestId('composer-textarea'), { target: { value: 'my first ever note' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });

    const err = await screen.findByTestId('composer-error');
    expect(err.textContent).not.toContain('unresolved_project_scope');
    expect(err.textContent).toContain('No project is indexed yet');
    expect(err.textContent).toContain('global');
    // The note is still in the box, so switching to global saves it.
    expect((screen.getByTestId('composer-textarea') as HTMLTextAreaElement).value).toBe('my first ever note');
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-scope-global'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });
    await waitFor(() => {
      const last = mockMemory.setQuickAdd.invoke.mock.calls.at(-1)![0];
      expect(last.scope).toBe('global');
    });
  });

  it('still surfaces an unrecognised save error verbatim', async () => {
    // Control for the mapping above: only the one known code is translated, so
    // a genuine failure is not swallowed behind generic copy.
    mockMemory.setQuickAdd.invoke.mockResolvedValue({ ok: false, error: 'disk full' });
    await openComposer();
    fireEvent.change(screen.getByTestId('composer-textarea'), { target: { value: 'note' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });
    expect((await screen.findByTestId('composer-error')).textContent).toContain('disk full');
  });

  /**
   * The Memory page's project filter is keyed on BASENAME, and this modal turns
   * that name into a write destination. Two indexed projects can share one, and
   * the write silently resolves to whichever came first - so the label has to
   * identify exactly one project.
   */
  it('disambiguates the destination when two indexed projects share a basename', async () => {
    mockMemory.getProjects.invoke.mockResolvedValue([
      { path: '/dev/one/app', basename: 'app', count: 3, lastActive: Date.now() },
      { path: '/dev/two/app', basename: 'app', count: 1, lastActive: Date.now() - 1000 },
    ]);
    await openComposer();

    const picker = screen.getByTestId('composer-project-picker') as HTMLSelectElement;
    const labels = Array.from(picker.options).map((o) => o.textContent);
    expect(new Set(labels).size).toBe(2);
    expect(labels).toEqual(['app (one)', 'app (two)']);
    expect(screen.getByTestId('composer-destination').textContent).toContain('app (one)');

    // Control: a basename that does NOT collide keeps its plain name.
    cleanup();
    mockMemory.getProjects.invoke.mockResolvedValue(MOCK_PROJECTS);
    await openComposer();
    expect(
      Array.from((screen.getByTestId('composer-project-picker') as HTMLSelectElement).options).map((o) => o.textContent)
    ).toEqual(['project-alpha', 'project-beta']);
  });

  /**
   * The ref that makes a pick authoritative is cleared on close, and nothing
   * pinned that. Leave it set and the next open skips the seeding branch:
   * `projectPath` stays '' from the close reset, the destination reads "no
   * project selected", and the save goes out with no `projectPath` at all -
   * which main refuses. That is #924 coming back through the fix for #924.
   *
   * It is invisible in the picker, which still DISPLAYS project-alpha: a
   * `<select>` whose value matches no option falls back to showing the first
   * one. Assert the destination line and the payload, never the picker's value.
   */
  it('re-seeds the destination on reopen, so a pick from a previous open cycle cannot leave it blank', async () => {
    await openComposer();

    // Control: the pick really registers, so the reopen assertions below are
    // exercising a ref that was actually set - not a cycle that never picked.
    await act(async () => {
      fireEvent.change(screen.getByTestId('composer-project-picker'), { target: { value: BETA } });
    });
    expect(screen.getByTestId('composer-destination').textContent).toContain('project-beta');

    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-cancel-btn'));
    });
    expect(screen.queryByTestId('composer-destination')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByTestId('memory-btn-quickadd'));
    });

    const dest = screen.getByTestId('composer-destination').textContent ?? '';
    expect(dest).not.toContain('no project selected');
    expect(dest).toContain('project-alpha');

    fireEvent.change(screen.getByTestId('composer-textarea'), { target: { value: 'note after reopen' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('composer-submit-btn'));
    });

    await waitFor(() => expect(mockMemory.setQuickAdd.invoke).toHaveBeenCalled());
    const payload = mockMemory.setQuickAdd.invoke.mock.calls[0][0];
    expect(payload.scope).toBe('project');
    expect(payload.projectPath).toBe(ALPHA);
  });
});
