/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Test for #508: a compact spend pill in the top bar reading the existing,
 * allowlisted cost.listBudgets provider. It must render "$spent / $limit" for a
 * configured global month budget, render nothing when no budget is configured,
 * and be a real <button> with an accessible name (the button-name axe rule).
 */

const listBudgets = vi.fn();
vi.mock('@/common', () => ({
  ipcBridge: {
    cost: {
      listBudgets: { invoke: () => listBudgets() },
      budgetAlert: { on: vi.fn(() => () => void 0) },
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      key === 'missionControl.cost.totalSpend' ? 'Total spend' : opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}));

import { SpendPill } from '../../../src/renderer/components/layout/Titlebar/SpendPill';

const renderPill = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <SpendPill />
      </MemoryRouter>
    </SWRConfig>
  );

const globalBudget = {
  id: 'b1',
  scope: 'global',
  scopeKey: undefined,
  limitUsd: 10,
  period: 'month',
  action: 'warn',
  spentUsd: 3.1,
  periodStartMs: 0,
};

describe('SpendPill (#508)', () => {
  beforeEach(() => {
    listBudgets.mockReset();
  });

  it('renders spend / limit for a configured global month budget', async () => {
    listBudgets.mockResolvedValue([globalBudget]);
    renderPill();

    const pill = await screen.findByRole('button');
    // formatUsd renders 2 decimals under $100.
    expect(pill).toHaveTextContent('$3.10');
    expect(pill).toHaveTextContent('$10.00');
  });

  it('renders nothing when no budget is configured', async () => {
    listBudgets.mockResolvedValue([]);
    const { container } = renderPill();

    // Give SWR a tick to resolve; the component must stay empty.
    await Promise.resolve();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('is a labeled <button> whose accessible name conveys the spend and limit', async () => {
    listBudgets.mockResolvedValue([globalBudget]);
    renderPill();

    const pill = await screen.findByRole('button');
    expect(pill.tagName).toBe('BUTTON');
    const label = pill.getAttribute('aria-label') ?? '';
    // Uses the localized missionControl.cost.totalSpend key, not an English-only string.
    expect(label).toContain('Total spend');
    expect(label).toContain('$3.10');
    expect(label).toContain('$10.00');
  });

  it('renders nothing for malformed budget data (zero / negative / NaN limit)', async () => {
    for (const badLimit of [0, -5, Number.NaN]) {
      listBudgets.mockReset();
      listBudgets.mockResolvedValue([{ ...globalBudget, limitUsd: badLimit }]);
      const { container, unmount } = renderPill();
      await Promise.resolve();
      await Promise.resolve();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });

  it('renders nothing when the spend is not finite', async () => {
    listBudgets.mockResolvedValue([{ ...globalBudget, spentUsd: Number.NaN }]);
    const { container } = renderPill();
    await Promise.resolve();
    await Promise.resolve();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
