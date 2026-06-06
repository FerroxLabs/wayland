/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultOrOpts?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      let result: string;
      if (typeof defaultOrOpts === 'string') {
        result = defaultOrOpts;
      } else {
        result = key;
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
    i18n: { language: 'en-US' },
  }),
}));

import { SourcesBlock } from '@renderer/pages/wiki/components/SourcesBlock';
import type { SourceEntry } from '@renderer/pages/wiki/components/SourcesBlock';

afterEach(() => {
  cleanup();
});

const makeSources = (n: number): SourceEntry[] =>
  Array.from({ length: n }, (_, i) => ({
    memoryId: `m-${i + 1}`,
    type: ((['Decision', 'Memory', 'Plan', 'Feedback'] as const)[i % 4]),
    project: 'wayland',
    date: `2026-05-${String(i + 1).padStart(2, '0')}`,
    title: `Source ${i + 1}`,
    quote: `Quote ${i + 1}`,
  }));

describe('SourcesBlock', () => {
  it('renders the sources block container', () => {
    render(<SourcesBlock sources={makeSources(2)} />);
    expect(screen.getByTestId('sources-block')).toBeTruthy();
  });

  it('shows first 3 sources by default', () => {
    render(<SourcesBlock sources={makeSources(5)} />);
    expect(screen.getByText('Source 1')).toBeTruthy();
    expect(screen.getByText('Source 2')).toBeTruthy();
    expect(screen.getByText('Source 3')).toBeTruthy();
  });

  it('hides sources beyond 3 by default', () => {
    render(<SourcesBlock sources={makeSources(5)} />);
    expect(screen.queryByText('Source 4')).toBeNull();
    expect(screen.queryByText('Source 5')).toBeNull();
  });

  it('shows "show all" button when there are more than 3 sources', () => {
    render(<SourcesBlock sources={makeSources(5)} />);
    expect(screen.getByTestId('show-all-sources-btn')).toBeTruthy();
  });

  it('does not show "show all" button when 3 or fewer sources', () => {
    render(<SourcesBlock sources={makeSources(3)} />);
    expect(screen.queryByTestId('show-all-sources-btn')).toBeNull();
  });

  it('expands to show all sources on click', () => {
    render(<SourcesBlock sources={makeSources(5)} />);
    fireEvent.click(screen.getByTestId('show-all-sources-btn'));
    expect(screen.getByText('Source 4')).toBeTruthy();
    expect(screen.getByText('Source 5')).toBeTruthy();
  });

  it('calls onOpenMemory when "Open memory" link is clicked', () => {
    const onOpenMemory = vi.fn();
    render(<SourcesBlock sources={makeSources(1)} onOpenMemory={onOpenMemory} />);
    fireEvent.click(screen.getByText('Open memory →'));
    expect(onOpenMemory).toHaveBeenCalledWith('m-1');
  });

  it('shows type badges for each source', () => {
    render(<SourcesBlock sources={makeSources(4)} />);
    expect(screen.getAllByText(/Decision|Memory|Plan|Feedback/).length).toBeGreaterThan(0);
  });
});
