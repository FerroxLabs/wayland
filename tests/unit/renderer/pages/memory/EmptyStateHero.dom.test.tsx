/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for EmptyStateHero.
 */

import React from 'react';
import { cleanup, render, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, _opts?: Record<string, unknown>) => fallback ?? _key,
  }),
}));

const { mockMemoryImport, mockDialog } = vi.hoisted(() => ({
  mockMemoryImport: {
    claudeMem: { invoke: vi.fn() },
    obsidianVault: { invoke: vi.fn() },
    scanDevDir: { invoke: vi.fn() },
    processDropFolder: { invoke: vi.fn() },
  },
  mockDialog: {
    showOpen: { invoke: vi.fn() },
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  memory: {
    import: mockMemoryImport,
  },
  dialog: mockDialog,
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@arco-design/web-react');
  return {
    ...actual,
    Message: { success: vi.fn(), error: vi.fn() },
    Input: ({ placeholder, onChange, 'data-testid': testId }: {
      placeholder?: string;
      onChange?: (val: string) => void;
      'data-testid'?: string;
    }) => (
      <input
        placeholder={placeholder}
        data-testid={testId}
        onChange={(e) => onChange?.(e.target.value)}
      />
    ),
  };
});

import EmptyStateHero from '@renderer/pages/memory/components/EmptyStateHero';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockMemoryImport.scanDevDir.invoke.mockResolvedValue({ count: 50, projectsFound: 3, errors: [] });
  mockMemoryImport.claudeMem.invoke.mockResolvedValue({ count: 100, errors: [] });
  mockMemoryImport.obsidianVault.invoke.mockResolvedValue({ count: 30, errors: [] });
  mockMemoryImport.processDropFolder.invoke.mockResolvedValue({ count: 5, errors: [] });
  mockDialog.showOpen.invoke.mockResolvedValue(['/Users/me/MyVault']);
});

describe('EmptyStateHero', () => {
  it('renders the hero container', async () => {
    await act(async () => {
      render(<EmptyStateHero />);
    });
    expect(screen.getByTestId('empty-state-hero')).toBeTruthy();
  });

  it('renders the headline', async () => {
    await act(async () => {
      render(<EmptyStateHero />);
    });
    const headline = screen.getByTestId('empty-hero-headline');
    expect(headline.textContent).toContain("Your memory is empty");
  });

  it('renders the search input', async () => {
    await act(async () => {
      render(<EmptyStateHero />);
    });
    expect(screen.getByTestId('empty-hero-search')).toBeTruthy();
  });

  it('renders 4 import CTA cards', async () => {
    await act(async () => {
      render(<EmptyStateHero />);
    });
    expect(screen.getByTestId('empty-import-card-claude-mem')).toBeTruthy();
    expect(screen.getByTestId('empty-import-card-obsidian')).toBeTruthy();
    expect(screen.getByTestId('empty-import-card-drop')).toBeTruthy();
    expect(screen.getByTestId('empty-import-card-dev-scan')).toBeTruthy();
  });

  it('calls scanDevDir on mount for count detection', async () => {
    await act(async () => {
      render(<EmptyStateHero />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(mockMemoryImport.scanDevDir.invoke).toHaveBeenCalled();
  });

  it('calls onImportComplete after claude-mem import', async () => {
    const onImportComplete = vi.fn();
    await act(async () => {
      render(<EmptyStateHero onImportComplete={onImportComplete} />);
    });
    await act(async () => {
      screen.getByTestId('empty-import-card-claude-mem').click();
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(mockMemoryImport.claudeMem.invoke).toHaveBeenCalled();
    expect(onImportComplete).toHaveBeenCalled();
  });

  // #133: the Obsidian card used to import a hardcoded `~/Documents`, so on a
  // machine without a vault there it silently found nothing and the empty
  // archive flashed "No matches". It must open a folder picker and import the
  // chosen vault instead.
  it('opens a folder picker for Obsidian and imports the picked vault (#133)', async () => {
    mockDialog.showOpen.invoke.mockResolvedValueOnce(['/Users/me/MyVault']);
    const onImportComplete = vi.fn();
    await act(async () => {
      render(<EmptyStateHero onImportComplete={onImportComplete} />);
    });
    await act(async () => {
      screen.getByTestId('empty-import-card-obsidian').click();
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(mockDialog.showOpen.invoke).toHaveBeenCalledWith({ properties: ['openDirectory'] });
    expect(mockMemoryImport.obsidianVault.invoke).toHaveBeenCalledWith({ vaultPath: '/Users/me/MyVault' });
    expect(onImportComplete).toHaveBeenCalled();
  });

  it('does not import (or flash a refresh) when the Obsidian picker is cancelled (#133)', async () => {
    mockDialog.showOpen.invoke.mockResolvedValueOnce(undefined); // user cancelled the dialog
    const onImportComplete = vi.fn();
    await act(async () => {
      render(<EmptyStateHero onImportComplete={onImportComplete} />);
    });
    await act(async () => {
      screen.getByTestId('empty-import-card-obsidian').click();
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(mockMemoryImport.obsidianVault.invoke).not.toHaveBeenCalled();
    expect(onImportComplete).not.toHaveBeenCalled();
  });

  it('does not refresh when an import yields zero entries (no empty-state flash) (#133)', async () => {
    mockMemoryImport.processDropFolder.invoke.mockResolvedValueOnce({ count: 0, errors: [] });
    const onImportComplete = vi.fn();
    await act(async () => {
      render(<EmptyStateHero onImportComplete={onImportComplete} />);
    });
    await act(async () => {
      screen.getByTestId('empty-import-card-drop').click();
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(mockMemoryImport.processDropFolder.invoke).toHaveBeenCalled();
    expect(onImportComplete).not.toHaveBeenCalled();
  });
});
