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

import { ConceptCard } from '@renderer/pages/wiki/components/ConceptCard';
import type { WikiConcept } from '@/common/types/memory';

afterEach(() => {
  cleanup();
});

const mockConcept: WikiConcept = {
  id: 'c-001',
  name: 'Wayland v0.9.0 TUI Architecture',
  slug: 'wayland-v090-tui-architecture',
  topicTag: 'Architecture',
  tldr: 'A test TL;DR',
  body: 'A test body',
  aliases: [],
  sourceMemoryIds: ['m-001', 'm-002', 'm-003', 'm-004', 'm-005', 'm-006', 'm-007', 'm-008'],
  linkedFromConcepts: [],
  relatedConcepts: [],
  tags: ['#architecture'],
  lastSynthesizedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  freshness: 'fresh',
};

describe('ConceptCard', () => {
  it('renders the concept name', () => {
    render(<ConceptCard concept={mockConcept} />);
    expect(screen.getByTestId('concept-card').textContent).toContain(
      'Wayland v0.9.0 TUI Architecture',
    );
  });

  it('shows memory count in meta', () => {
    render(<ConceptCard concept={mockConcept} />);
    expect(screen.getByTestId('concept-card').textContent).toContain('Synthesized from 8 memories');
  });

  it('shows topic tag in meta', () => {
    render(<ConceptCard concept={mockConcept} />);
    expect(screen.getByTestId('concept-card').textContent).toContain('Architecture');
  });

  it('fires onClick with slug when clicked', () => {
    const onClick = vi.fn();
    render(<ConceptCard concept={mockConcept} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('concept-card'));
    expect(onClick).toHaveBeenCalledWith('wayland-v090-tui-architecture');
  });

  it('shows age based on lastSynthesizedAt', () => {
    render(<ConceptCard concept={mockConcept} />);
    // 2 days ago
    expect(screen.getByTestId('concept-card').textContent).toContain('2d');
  });

  it('uses data-slug attribute', () => {
    render(<ConceptCard concept={mockConcept} />);
    expect(screen.getByTestId('concept-card').getAttribute('data-slug')).toBe(
      'wayland-v090-tui-architecture',
    );
  });
});
