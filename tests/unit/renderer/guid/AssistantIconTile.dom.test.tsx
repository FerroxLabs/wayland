/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import AssistantIconTile from '@/renderer/pages/guid/components/AssistantIconTile';

describe('AssistantIconTile', () => {
  it('renders children inside the tile', () => {
    const { container } = render(
      <AssistantIconTile category='copy'>
        <span data-testid='child' />
      </AssistantIconTile>
    );
    expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
  });

  it('applies write palette for copy category', () => {
    const { container } = render(
      <AssistantIconTile category='copy'>
        <span />
      </AssistantIconTile>
    );
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.style.backgroundColor).toContain('139'); // violet rgb
  });

  it('falls back to neutral when category unknown', () => {
    const { container } = render(
      <AssistantIconTile category='unknown'>
        <span />
      </AssistantIconTile>
    );
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.style.backgroundColor).toBe(''); // no inline style → falls to CSS var
  });

  it('honors paletteKey override', () => {
    const { container } = render(
      <AssistantIconTile paletteKey='cowork'>
        <span />
      </AssistantIconTile>
    );
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.style.backgroundColor).toContain('249'); // orange rgb
  });
});
