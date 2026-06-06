/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Smoke tests for WikiDetailPage.
 * Asserts: TL;DR + Title + Sources block + Linked from + Related Concepts all present.
 */

// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_CONCEPTS } from '@renderer/pages/wiki/__fixtures__/mockWikiState';

// Mock Arco
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

// Mock the IPC bridge so the wiki detail page gets mock data instead of real IPC
vi.mock('@/common/adapter/ipcBridge', () => ({
  wiki: {
    listConcepts: { invoke: vi.fn() },
    getConcept: { invoke: vi.fn() },
    getBacklinkGraph: { invoke: vi.fn() },
    resolveBacklink: { invoke: vi.fn() },
    synthesizeOrphan: { invoke: vi.fn() },
    reSynthesize: { invoke: vi.fn() },
    stateChanged: { on: vi.fn(() => () => undefined) },
  },
  pptPreview: {
    start: { invoke: vi.fn() },
    stop: { invoke: vi.fn() },
    status: { on: vi.fn(() => () => undefined) },
  },
  wordPreview: {
    start: { invoke: vi.fn() },
    stop: { invoke: vi.fn() },
    status: { on: vi.fn(() => () => undefined) },
  },
  excelPreview: {
    start: { invoke: vi.fn() },
    stop: { invoke: vi.fn() },
    status: { on: vi.fn(() => () => undefined) },
  },
}));

import { wiki as wikiBridge } from '@/common/adapter/ipcBridge';
import { WikiDetailPage } from '@renderer/pages/wiki/WikiDetailPage';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const firstConcept = MOCK_CONCEPTS[0];

beforeEach(() => {
  (wikiBridge.getConcept.invoke as ReturnType<typeof vi.fn>).mockImplementation(
    async ({ slug }: { slug: string }) => MOCK_CONCEPTS.find((c) => c.slug === slug) ?? null,
  );
  (wikiBridge.resolveBacklink.invoke as ReturnType<typeof vi.fn>).mockImplementation(
    async ({ wikilinkText }: { wikilinkText: string }) => {
      const concept = MOCK_CONCEPTS.find(
        (c) => c.name.toLowerCase() === wikilinkText.toLowerCase(),
      );
      return concept ? { slug: concept.slug, name: concept.name } : { slug: null, name: null };
    },
  );
});

describe('WikiDetailPage (smoke)', () => {
  it('renders without crashing', async () => {
    expect(() => render(<WikiDetailPage slug={firstConcept.slug} />)).not.toThrow();
    await waitFor(() => expect(wikiBridge.getConcept.invoke).toHaveBeenCalled());
  });

  it('renders the TL;DR block', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() => expect(screen.getByTestId('tldr-block')).toBeTruthy());
  });

  it('renders the concept title', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() =>
      expect(screen.getByTestId('concept-title').textContent).toBe(firstConcept.name),
    );
  });

  it('renders the sources section heading', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() =>
      expect(screen.getByTestId('sources-heading').textContent).toContain('Sources'),
    );
  });

  it('renders the sources block', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() => expect(screen.getByTestId('sources-block')).toBeTruthy());
  });

  it('renders the linked from section', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() =>
      expect(screen.getByTestId('linked-from-heading').textContent).toContain('Linked from'),
    );
  });

  it('renders linked from items when concept has linkedFromConcepts', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() => expect(screen.getByTestId('linked-from-heading')).toBeTruthy());
    if (firstConcept.linkedFromConcepts.length > 0) {
      expect(screen.getByTestId('linked-from-list')).toBeTruthy();
    }
  });

  it('renders related concepts section', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() =>
      expect(screen.getByTestId('related-heading').textContent).toContain('Related concepts'),
    );
    expect(screen.getByTestId('related-concepts')).toBeTruthy();
  });

  it('renders the page footer', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() => expect(screen.getByTestId('page-footer')).toBeTruthy());
  });

  it('renders the topic badge', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() =>
      expect(screen.getByTestId('topic-badge').textContent).toContain('Architecture'),
    );
  });

  it('renders the freshness badge', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() => expect(screen.getByTestId('freshness-badge')).toBeTruthy());
  });

  it('renders the status bar', async () => {
    render(<WikiDetailPage slug={firstConcept.slug} />);
    await waitFor(() => expect(screen.getByTestId('wiki-detail-status-bar')).toBeTruthy());
  });

  it('shows the not-found state for an unknown slug', async () => {
    render(<WikiDetailPage slug='nonexistent-slug' />);
    await waitFor(() => {
      const matches = screen.getAllByText(/not found/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });
});
