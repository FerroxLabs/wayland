/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: Record<string, unknown>) => {
      let out = (options?.defaultValue as string | undefined) ?? _key;
      if (options) {
        for (const [k, v] of Object.entries(options)) {
          if (k === 'defaultValue') continue;
          out = out.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        }
      }
      return out;
    },
  }),
}));

vi.mock('@/renderer/utils/platform', () => ({
  openExternalUrl: vi.fn(),
}));

import SourceBlock from '@/renderer/components/chat/observability/SourceBlock';
import type { Source } from '@/common/chat/activity/sources';

const sources: Source[] = [
  { title: 'Reuters', url: 'https://reuters.com', domain: 'reuters.com', favicon: 'https://www.google.com/s2/favicons?domain=reuters.com&sz=32' },
  { title: 'BBC News', url: 'https://bbc.com/news', domain: 'bbc.com', favicon: 'https://www.google.com/s2/favicons?domain=bbc.com&sz=32' },
];

describe('SourceBlock', () => {
  it('renders source rows for a non-empty sources array', () => {
    render(<SourceBlock sources={sources} />);
    const block = screen.getByTestId('source-block');
    expect(block).toBeTruthy();
    // Header shows count
    expect(block.textContent).toContain('2 sources');
    // Both source titles are visible
    expect(screen.getByText('Reuters')).toBeTruthy();
    expect(screen.getByText('BBC News')).toBeTruthy();
    // Domains are shown
    expect(screen.getAllByText('reuters.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('bbc.com').length).toBeGreaterThan(0);
  });

  it('renders nothing for an empty sources array', () => {
    const { container } = render(<SourceBlock sources={[]} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('source-block')).toBeNull();
  });

  it('renders a single source correctly', () => {
    render(<SourceBlock sources={[sources[0]]} />);
    expect(screen.getByTestId('source-block').textContent).toContain('1 sources');
    expect(screen.getByText('Reuters')).toBeTruthy();
  });
});
