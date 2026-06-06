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
      // Use default-arg fallback when present, substituting interpolations
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

// Mock Arco Button to avoid full Arco setup in tests
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

import { OrphanCard } from '@renderer/pages/wiki/components/OrphanCard';

afterEach(() => {
  cleanup();
});

const memIds = ['m-101', 'm-102', 'm-103'];

describe('OrphanCard', () => {
  it('renders the suggested concept name in quotes', () => {
    render(
      <OrphanCard
        suggestedName='Cron skill PROPOSE-default'
        citationCount={8}
        memoryIds={memIds}
        onSynthesize={vi.fn()}
      />,
    );
    expect(screen.getByTestId('orphan-card').textContent).toContain('Cron skill PROPOSE-default');
  });

  it('shows citation count', () => {
    render(
      <OrphanCard
        suggestedName='Test concept'
        citationCount={12}
        memoryIds={memIds}
        onSynthesize={vi.fn()}
      />,
    );
    expect(screen.getByTestId('orphan-card').textContent).toContain('12 references');
  });

  it('shows project count', () => {
    render(
      <OrphanCard
        suggestedName='Test concept'
        citationCount={5}
        projectCount={3}
        memoryIds={memIds}
        onSynthesize={vi.fn()}
      />,
    );
    expect(screen.getByTestId('orphan-card').textContent).toContain('3 projects');
  });

  it('fires onSynthesize with memoryIds when button clicked', () => {
    const onSynthesize = vi.fn();
    render(
      <OrphanCard
        suggestedName='Test'
        citationCount={4}
        memoryIds={memIds}
        onSynthesize={onSynthesize}
      />,
    );
    fireEvent.click(screen.getByTestId('synthesize-btn'));
    expect(onSynthesize).toHaveBeenCalledWith(memIds);
  });

  it('renders synthesize button text', () => {
    render(
      <OrphanCard
        suggestedName='Test'
        citationCount={4}
        memoryIds={memIds}
        onSynthesize={vi.fn()}
      />,
    );
    expect(screen.getByTestId('synthesize-btn').textContent).toContain('Synthesize page');
  });
});
