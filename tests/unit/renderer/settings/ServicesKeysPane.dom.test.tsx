/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockList, mockSet, mockDelete, mockOpenExternal } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockSet: vi.fn(),
  mockDelete: vi.fn(),
  mockOpenExternal: vi.fn(),
}));

// i18n: return the defaultValue (reference English) so assertions read stable copy.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
  }),
}));

vi.mock('../../../../src/common', () => ({
  ipcBridge: {
    wcoreToolKeys: {
      list: { invoke: () => mockList() },
      set: { invoke: (p: { id: string; key: string }) => mockSet(p) },
      delete: { invoke: (p: { id: string }) => mockDelete(p) },
    },
  },
}));

vi.mock('../../../../src/renderer/utils/platform', () => ({
  openExternalUrl: (url: string) => mockOpenExternal(url),
  // Default to desktop so the existing save/remove tests exercise the real path.
  isElectronDesktop: () => true,
}));

import React from 'react';
import ServicesKeysPane from '../../../../src/renderer/pages/settings/WCoreConfig/panes/ServicesKeysPane';

const ALL_ABSENT = [
  { id: 'brave', hasKey: false },
  { id: 'tavily', hasKey: false },
  { id: 'exa', hasKey: false },
  { id: 'firecrawl', hasKey: false },
];

describe('ServicesKeysPane - Web Search credential surface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(ALL_ABSENT);
    mockSet.mockResolvedValue({ ok: true });
    mockDelete.mockResolvedValue({ ok: true });
  });

  it('renders the DuckDuckGo "active / free" callout', async () => {
    render(<ServicesKeysPane />);
    await waitFor(() => expect(mockList).toHaveBeenCalled());
    expect(screen.getByText('DuckDuckGo · active. Free web search is on.')).toBeTruthy();
  });

  it('renders a card per web-search backend with a signup link', async () => {
    render(<ServicesKeysPane />);
    await waitFor(() => expect(mockList).toHaveBeenCalled());
    for (const name of ['Brave Search', 'Tavily', 'Exa', 'Firecrawl']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
    // One signup link per backend: 4 web-search + 2 voice + 2 image = 8.
    const links = screen.getAllByText('Get a free key');
    expect(links.length).toBe(8);
  });

  it('opens the provider signup link externally', async () => {
    render(<ServicesKeysPane />);
    await waitFor(() => expect(mockList).toHaveBeenCalled());
    fireEvent.click(screen.getAllByText('Get a free key')[0]);
    expect(mockOpenExternal).toHaveBeenCalledWith('https://brave.com/search/api/');
  });

  it('saving a key calls wcoreToolKeys.set with the backend id and trimmed key', async () => {
    render(<ServicesKeysPane />);
    await waitFor(() => expect(mockList).toHaveBeenCalled());

    const inputs = document.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: 'brv-key-123' } });
    fireEvent.click(screen.getAllByText('Save')[0]);

    await waitFor(() => expect(mockSet).toHaveBeenCalledWith({ id: 'brave', key: 'brv-key-123' }));
  });

  it('shows the connected state for a stored key and remove calls delete', async () => {
    mockList.mockResolvedValue([
      { id: 'brave', hasKey: true },
      { id: 'tavily', hasKey: false },
      { id: 'exa', hasKey: false },
      { id: 'firecrawl', hasKey: false },
    ]);
    render(<ServicesKeysPane />);
    await waitFor(() => expect(screen.getByText('Connected')).toBeTruthy());

    fireEvent.click(screen.getByText('Remove'));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith({ id: 'brave' }));
  });
});
