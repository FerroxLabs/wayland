/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { KnowledgeGraph } from '@renderer/pages/wiki/components/KnowledgeGraph';
import { MOCK_CONCEPTS, MOCK_BACKLINK_GRAPH } from '@renderer/pages/wiki/__fixtures__/mockWikiState';

afterEach(() => {
  cleanup();
});

describe('KnowledgeGraph', () => {
  it('renders the graph container', () => {
    render(<KnowledgeGraph concepts={MOCK_CONCEPTS} />);
    expect(screen.getByTestId('knowledge-graph')).toBeTruthy();
  });

  it('renders the legend', () => {
    render(<KnowledgeGraph concepts={MOCK_CONCEPTS} />);
    expect(screen.getByTestId('graph-legend')).toBeTruthy();
  });

  it('shows all topic labels in the legend', () => {
    render(<KnowledgeGraph concepts={MOCK_CONCEPTS} />);
    const legend = screen.getByTestId('graph-legend');
    expect(legend.textContent).toContain('Architecture');
    expect(legend.textContent).toContain('Design');
    expect(legend.textContent).toContain('Patterns');
  });

  it('renders an SVG element', () => {
    const { container } = render(<KnowledgeGraph concepts={MOCK_CONCEPTS} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders with backlink graph without errors', () => {
    expect(() =>
      render(
        <KnowledgeGraph
          concepts={MOCK_CONCEPTS}
          backlinkGraph={MOCK_BACKLINK_GRAPH}
          onNavigate={vi.fn()}
        />,
      ),
    ).not.toThrow();
  });

  it('renders with empty concepts list without errors', () => {
    expect(() => render(<KnowledgeGraph concepts={[]} />)).not.toThrow();
  });
});
