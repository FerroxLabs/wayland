/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Smoke tests for WikiHomePage.
 * Asserts: 3 column headers present + at least 1 concept card + 1 orphan card.
 */

// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MOCK_CONCEPTS, MOCK_BACKLINK_GRAPH, MOCK_ORPHANS } from '@renderer/pages/wiki/__fixtures__/mockWikiState';

// Mock Arco components
vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons (already handled by dom setup, but ensure they don't error)
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('lucide-react');
  return actual;
});

// Mock react-i18next: prefer default-arg fallback when present, else humanize key tail
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultOrOpts?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      let result: string;
      if (typeof defaultOrOpts === 'string') {
        result = defaultOrOpts;
      } else {
        const tail = key.split('.').pop() ?? key;
        result = tail
          .replace(/([A-Z])/g, ' $1')
          .toLowerCase()
          .replace(/^./, (c) => c.toUpperCase())
          .trim();
      }
      const interp = typeof defaultOrOpts === 'object' ? defaultOrOpts : opts;
      if (interp && typeof interp === 'object') {
        return Object.entries(interp).reduce(
          (acc, [k, v]) => acc.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v)),
          result,
        );
      }
      return result;
    },
  }),
}));

// Mock the IPC bridge so the wiki page gets mock data instead of real IPC
vi.mock('@/common/adapter/ipcBridge', () => ({
  wiki: {
    listConcepts: { invoke: vi.fn() },
    getConcept: { invoke: vi.fn() },
    getBacklinkGraph: { invoke: vi.fn() },
    getState: { invoke: vi.fn() },
    resolveBacklink: { invoke: vi.fn() },
    synthesizeOrphan: { invoke: vi.fn() },
    reSynthesize: { invoke: vi.fn() },
    stateChanged: { on: vi.fn(() => () => undefined) },
  },
}));

import { wiki as wikiBridge } from '@/common/adapter/ipcBridge';
import { WikiHomePage } from '@renderer/pages/wiki/WikiHomePage';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  // WikiHomePage now calls wiki.getState (Fix 8) instead of listConcepts + getBacklinkGraph.
  (wikiBridge.getState.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
    version: 1,
    concepts: MOCK_CONCEPTS,
    backlinkGraph: MOCK_BACKLINK_GRAPH,
    orphanCandidates: [],
    lastUpdatedAt: Date.now(),
  });
  // Keep legacy mocks for any code that still calls them.
  (wikiBridge.listConcepts.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
    concepts: MOCK_CONCEPTS,
    total: MOCK_CONCEPTS.length,
  });
  (wikiBridge.getBacklinkGraph.invoke as ReturnType<typeof vi.fn>).mockResolvedValue(
    MOCK_BACKLINK_GRAPH,
  );
  (wikiBridge.stateChanged.on as ReturnType<typeof vi.fn>).mockReturnValue(() => undefined);
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <WikiHomePage />
    </MemoryRouter>,
  );

describe('WikiHomePage (smoke)', () => {
  it('renders without crashing', async () => {
    expect(() => renderPage()).not.toThrow();
    // WikiHomePage now calls wiki.getState on mount (Fix 8).
    await waitFor(() => expect(wikiBridge.getState.invoke).toHaveBeenCalled());
  });

  it('shows the 3 column headers', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('col-by-topic').textContent?.toLowerCase()).toContain('by topic'),
    );
    expect(screen.getByTestId('col-updated').textContent?.toLowerCase()).toContain(
      'updated this week',
    );
    expect(screen.getByTestId('col-emerging').textContent?.toLowerCase()).toContain('emerging');
  });

  it('shows at least 1 concept card', async () => {
    renderPage();
    await waitFor(() => {
      const cards = screen.getAllByTestId('concept-card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows at least 1 orphan card', async () => {
    // Orphans come from stateChanged event - trigger via mock state update
    const mockState = {
      concepts: MOCK_CONCEPTS,
      backlinkGraph: MOCK_BACKLINK_GRAPH,
      orphanCandidates: MOCK_ORPHANS,
    };
    (wikiBridge.stateChanged.on as ReturnType<typeof vi.fn>).mockImplementation((cb) => {
      // Call callback synchronously to inject orphan data
      setTimeout(() => cb(mockState), 0);
      return () => undefined;
    });
    renderPage();
    await waitFor(() => {
      const cards = screen.getAllByTestId('orphan-card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows the wiki status bar', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('wiki-status-bar')).toBeTruthy(),
    );
  });

  it('shows the "Most Referenced" section', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('most-referenced')).toBeTruthy(),
    );
  });

  it('shows at least 1 ref tile', async () => {
    renderPage();
    await waitFor(() => {
      const tiles = screen.getAllByTestId('ref-tile');
      expect(tiles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows the list view by default', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('list-view')).toBeTruthy(),
    );
  });

  it('shows the search input', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('textbox')).toBeTruthy(),
    );
  });

  it('shows concept items in the By Topic column', async () => {
    renderPage();
    await waitFor(() => {
      const items = screen.getAllByTestId('concept-item');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });
  });
});
