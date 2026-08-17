/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression test for D-06 xaudit finding 1: the Mission Control `?tab=cost`
 * deep-link (opened by the Titlebar SpendPill) was inert once the page was
 * already mounted - activeTab was a one-shot useState, so a navigation to
 * ?tab=cost updated the URL but not the visible tab. The page must re-sync the
 * active tab when the search params change.
 */

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

vi.mock('@/renderer/hooks/system/useIsPopoutMode', () => ({
  useIsPopoutMode: () => false,
}));

vi.mock('../../../src/renderer/pages/mission-control/useMissionControl', () => ({
  useMissionControl: () => ({ snapshot: null, loading: false, refresh: vi.fn() }),
}));

vi.mock('../../../src/renderer/pages/mission-control/cost/CostTab', () => ({
  CostTab: () => <div data-testid='cost-tab-content'>cost</div>,
}));

vi.mock('@/common', () => ({
  ipcBridge: {},
}));

import MissionControlPage from '../../../src/renderer/pages/mission-control';

const tabByTitle = (title: string): HTMLElement | undefined =>
  screen.getAllByRole('tab').find((el) => el.textContent?.includes(title));

const Harness: React.FC = () => {
  const navigate = useNavigate();
  return (
    <>
      <button data-testid='go-cost' onClick={() => navigate('/mission-control?tab=cost')}>
        go cost
      </button>
      <Routes>
        <Route path='/mission-control' element={<MissionControlPage />} />
      </Routes>
    </>
  );
};

describe('Mission Control ?tab deep-link (D-06 xaudit finding 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('switches to the cost tab when navigated to ?tab=cost while already mounted', async () => {
    render(
      <MemoryRouter initialEntries={['/mission-control']}>
        <Harness />
      </MemoryRouter>
    );

    // Starts on operations.
    expect(tabByTitle('missionControl.tabs.operations')).toHaveAttribute('aria-selected', 'true');
    expect(tabByTitle('missionControl.tabs.cost')).toHaveAttribute('aria-selected', 'false');

    // Navigate (page already mounted) - the effect must follow the deep-link.
    fireEvent.click(screen.getByTestId('go-cost'));

    expect(await screen.findByTestId('cost-tab-content')).toBeInTheDocument();
    expect(tabByTitle('missionControl.tabs.cost')).toHaveAttribute('aria-selected', 'true');
  });

  it('honors ?tab=cost on initial mount', () => {
    render(
      <MemoryRouter initialEntries={['/mission-control?tab=cost']}>
        <Routes>
          <Route path='/mission-control' element={<MissionControlPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(tabByTitle('missionControl.tabs.cost')).toHaveAttribute('aria-selected', 'true');
  });

  it('hides the cost tab on the remote WebUI transport and ignores ?tab=cost there (#979)', () => {
    // The whole cost.* namespace is remote-denied, so on a browser WebUI the tab
    // could only ever show empty panels - it must not be offered at all, and the
    // SpendPill deep-link must not be able to land on it.
    const electronApi = (window as { electronAPI?: unknown }).electronAPI;
    delete (window as { electronAPI?: unknown }).electronAPI;
    try {
      render(
        <MemoryRouter initialEntries={['/mission-control?tab=cost']}>
          <Routes>
            <Route path='/mission-control' element={<MissionControlPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(tabByTitle('missionControl.tabs.cost')).toBeUndefined();
      expect(screen.queryByTestId('cost-tab-content')).not.toBeInTheDocument();
      expect(tabByTitle('missionControl.tabs.operations')).toHaveAttribute('aria-selected', 'true');
    } finally {
      (window as { electronAPI?: unknown }).electronAPI = electronApi;
    }
  });
});
