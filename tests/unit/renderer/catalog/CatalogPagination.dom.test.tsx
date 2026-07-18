/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (
      key: string,
      options?: {
        defaultValue?: string;
        count?: number;
        shown?: number | string;
        total?: number;
      }
    ) => {
      const translations: Record<string, string> = {
        'mcpLibrary.browse.showMore': 'Show more',
        'mcpLibrary.browse.showMoreCount': '({{shown}} of {{total}})',
        'settings.shared.back': 'Back',
        'settings.shared.next': 'Next',
      };
      return (options?.defaultValue ?? translations[key] ?? key)
        .replace('{{count}}', String(options?.count ?? ''))
        .replace('{{shown}}', String(options?.shown ?? ''))
        .replace('{{total}}', String(options?.total ?? ''));
    },
  }),
}));

import {
  CatalogPaginationControls,
  useCatalogPagination,
} from '../../../../src/renderer/components/layout/library/CatalogPagination';

const FIXTURES = Array.from({ length: 1_001 }, (_, index) => `fixture-${index}`);

const Harness: React.FC = () => {
  const pagination = useCatalogPagination(FIXTURES, 'stable', 73);
  return (
    <>
      <ul id='catalog-test-window'>
        {pagination.visibleItems.map((item) => (
          <li key={item} data-testid='catalog-window-item'>
            {item}
          </li>
        ))}
      </ul>
      <CatalogPaginationControls
        visibleCount={pagination.visibleCount}
        totalCount={pagination.totalCount}
        remainingCount={pagination.remainingCount}
        pageSize={pagination.pageSize}
        firstVisibleIndex={pagination.firstVisibleIndex}
        lastVisibleIndex={pagination.lastVisibleIndex}
        hasPrevious={pagination.hasPrevious}
        hasMore={pagination.hasMore}
        onNextPage={pagination.nextPage}
        onPreviousPage={pagination.previousPage}
        controlsId='catalog-test-window'
        testId='catalog-test-next'
      />
    </>
  );
};

describe('CatalogPagination', () => {
  it('walks all 1,001 items without ever rendering more than the configured 73-item bound', () => {
    render(<Harness />);
    const observed = new Set<string>();
    const next = screen.getByTestId('catalog-test-next');

    expect(next.textContent).toContain('73');
    for (let page = 0; page < 20; page += 1) {
      const visible = screen.getAllByTestId('catalog-window-item');
      expect(visible.length).toBeLessThanOrEqual(73);
      for (const item of visible) observed.add(item.textContent ?? '');
      if (next.getAttribute('aria-disabled') === 'true') break;
      fireEvent.click(next);
    }

    expect(observed.size).toBe(1_001);
    expect(screen.getAllByTestId('catalog-window-item')).toHaveLength(52);
    expect(screen.getByTestId('catalog-test-next-status').textContent).toContain('950–1001 of 1001');
    expect(next.getAttribute('aria-disabled')).toBe('true');

    fireEvent.click(screen.getByTestId('catalog-test-next-previous'));
    expect(screen.getAllByTestId('catalog-window-item')).toHaveLength(73);
    expect(screen.getByTestId('catalog-test-next-status').textContent).toContain('877–949 of 1001');
  });
});
