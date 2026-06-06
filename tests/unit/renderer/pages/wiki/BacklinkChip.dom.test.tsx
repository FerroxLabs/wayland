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

import { BacklinkChip } from '@renderer/pages/wiki/components/BacklinkChip';

afterEach(() => {
  cleanup();
});

describe('BacklinkChip', () => {
  it('renders the concept name', () => {
    render(<BacklinkChip name='TurnElement enum' slug='turnelement-enum' />);
    expect(screen.getByTestId('backlink-chip').textContent).toBe('TurnElement enum');
  });

  it('fires onClick with slug when clicked and not orphan', () => {
    const onClick = vi.fn();
    render(<BacklinkChip name='TurnElement enum' slug='turnelement-enum' onClick={onClick} />);
    fireEvent.click(screen.getByTestId('backlink-chip'));
    expect(onClick).toHaveBeenCalledWith('turnelement-enum');
  });

  it('renders orphan chip when slug is null', () => {
    render(<BacklinkChip name='Unknown concept' slug={null} />);
    const chip = screen.getByTestId('backlink-chip');
    expect(chip.title).toBe('No page yet');
  });

  it('does not fire onClick when slug is null', () => {
    const onClick = vi.fn();
    render(<BacklinkChip name='Orphan' slug={null} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('backlink-chip'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not fire onClick when slug is undefined', () => {
    const onClick = vi.fn();
    render(<BacklinkChip name='Unknown' onClick={onClick} />);
    fireEvent.click(screen.getByTestId('backlink-chip'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sets title to name when not orphan', () => {
    render(<BacklinkChip name='TurnElement' slug='turnelement-enum' />);
    expect(screen.getByTestId('backlink-chip').title).toBe('TurnElement');
  });
});
