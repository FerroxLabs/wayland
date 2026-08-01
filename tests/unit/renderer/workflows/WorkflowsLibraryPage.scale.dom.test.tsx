/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const workflowFixtures = vi.hoisted(() =>
  Array.from({ length: 1_000 }, (_, index) => ({
    name: `scale-workflow-${String(index).padStart(4, '0')}`,
    title: `Scale Workflow ${String(index).padStart(4, '0')}`,
    description: `Deterministic scale fixture ${index}`,
    type: 'workflow' as const,
    source: 'wayland-library' as const,
    metadata: {
      tags: ['scale'],
      category: [
        'business-operations',
        'career',
        'content-creation',
        'creative-project',
        'cross-domain',
        'life-event',
        'software-project',
      ][index % 7],
    },
    path: `/fixtures/scale-workflow-${index}/SKILL.md`,
  }))
);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (
      key: string,
      fallbackOrOptions?: string | { defaultValue?: string; count?: number; shown?: number | string; total?: number },
      trailingOptions?: { count?: number; shown?: number | string; total?: number }
    ) => {
      const options = typeof fallbackOrOptions === 'object' ? fallbackOrOptions : trailingOptions;
      const translations: Record<string, string> = {
        'mcpLibrary.browse.showMore': 'Show more',
        'mcpLibrary.browse.showMoreCount': '({{shown}} of {{total}})',
        'settings.shared.back': 'Back',
        'settings.shared.next': 'Next',
      };
      const fallback =
        typeof fallbackOrOptions === 'string'
          ? fallbackOrOptions
          : (fallbackOrOptions?.defaultValue ?? translations[key] ?? key);
      return fallback
        .replace('{{count}}', String(options?.count ?? ''))
        .replace('{{shown}}', String(options?.shown ?? ''))
        .replace('{{total}}', String(options?.total ?? ''));
    },
  }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    skills: {
      list: { invoke: vi.fn().mockResolvedValue(workflowFixtures) },
    },
  },
}));

vi.mock('@/renderer/components/import/ImportModal', () => ({ default: () => null }));
vi.mock('@/renderer/pages/workflows/BuildWorkflowModal', () => ({ default: () => null }));
vi.mock('@/renderer/pages/workflows/WorkflowDetailModal', () => ({
  default: ({ entry }: { entry: { name: string } | null }) =>
    entry ? <div data-testid='workflow-detail-selected'>{entry.name}</div> : null,
}));

import WorkflowsLibraryPage from '../../../../src/renderer/pages/workflows/WorkflowsLibraryPage';

describe('WorkflowsLibraryPage scale behavior', () => {
  it('bounds 1,000 workflows while preserving card actions and deterministic load-more focus', async () => {
    render(
      <MemoryRouter initialEntries={['/workflows']}>
        <WorkflowsLibraryPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByTestId('workflow-card')).toHaveLength(48));
    expect(screen.getByTestId('workflows-load-more-status').textContent).toContain('1–48 of 1000');

    fireEvent.click(screen.getAllByTestId('workflow-card')[0]);
    expect(screen.getByTestId('workflow-detail-selected').textContent).toBe('scale-workflow-0000');
    const firstPageFirstName = screen.getAllByTestId('workflow-card')[0].getAttribute('data-workflow-name');

    const loadMore = screen.getByTestId('workflows-load-more');
    expect(loadMore.tagName).toBe('BUTTON');
    expect(loadMore.getAttribute('aria-controls')).toBe('workflows-catalog-items');
    loadMore.focus();
    fireEvent.click(loadMore);

    expect(screen.getAllByTestId('workflow-card')).toHaveLength(48);
    expect(screen.getAllByTestId('workflow-card')[0].getAttribute('data-workflow-name')).not.toBe(firstPageFirstName);
    expect(document.querySelector('[data-workflow-name="scale-workflow-0000"]')).toBeNull();
    expect(screen.getByTestId('workflows-load-more-status').textContent).toContain('49–96 of 1000');
    expect(document.activeElement).toBe(loadMore);
  });

  it('searches the complete 1,000-item source and resets the visible window synchronously', async () => {
    render(
      <MemoryRouter initialEntries={['/workflows']}>
        <WorkflowsLibraryPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByTestId('workflow-card')).toHaveLength(48));
    fireEvent.click(screen.getByTestId('workflows-load-more'));
    expect(screen.getAllByTestId('workflow-card')).toHaveLength(48);

    fireEvent.change(screen.getByPlaceholderText('Search workflows…'), {
      target: { value: 'scale-workflow-0999' },
    });

    expect(screen.getAllByTestId('workflow-card')).toHaveLength(1);
    expect(screen.getByTestId('workflow-card').getAttribute('data-workflow-name')).toBe('scale-workflow-0999');
    expect(screen.queryByTestId('workflows-load-more')).toBeNull();
  });
});
