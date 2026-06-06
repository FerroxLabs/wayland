/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for ImportDrawer.
 *
 * Covers:
 *   - Returns null (no inner content) when open=false.
 *   - Renders 4 source cards when open=true.
 *   - Clicking the claude-mem Import button invokes ipcBridge.memory.import.claudeMem.
 *   - Drop folder card shows Open folder + Process now buttons.
 *   - Close button calls onClose.
 *   - Esc keydown calls onClose.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

// ===== Mocks =====
// All vi.fn() definitions are inside the factory to avoid hoisting issues.

vi.mock('@/common', () => {
  const claudeMemInvoke = vi.fn().mockResolvedValue({ count: 5, errors: [] });
  const obsidianVaultInvoke = vi.fn().mockResolvedValue({ count: 3, errors: [] });
  const scanDevDirInvoke = vi.fn().mockResolvedValue({ count: 10, projectsFound: 2, errors: [] });
  const processDropFolderInvoke = vi.fn().mockResolvedValue({ count: 2, errors: [] });
  const openExternalInvoke = vi.fn().mockResolvedValue(undefined);

  return {
    ipcBridge: {
      memory: {
        import: {
          claudeMem: { invoke: claudeMemInvoke },
          obsidianVault: { invoke: obsidianVaultInvoke },
          scanDevDir: { invoke: scanDevDirInvoke },
          processDropFolder: { invoke: processDropFolderInvoke },
        },
      },
      shell: {
        openExternal: { invoke: openExternalInvoke },
      },
    },
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback ?? _key,
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    onClick,
    loading,
    disabled,
    type: _type,
    long: _long,
    shape: _shape,
    size: _size,
    icon,
    ...rest
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
    type?: string;
    long?: boolean;
    shape?: string;
    size?: string;
    icon?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} disabled={disabled === true || loading === true} {...rest}>
      {icon}
      {children}
    </button>
  ),
  Message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@icon-park/react', () => ({
  Close: (p: Record<string, unknown>) => <span data-testid='icon-close' {...p} />,
}));

// ===== Subject (imported AFTER mocks) =====

import { ImportDrawer } from '@renderer/pages/memory/components/ImportDrawer';
import { ipcBridge } from '@/common';

// ===== Helper to extract typed mock fns =====

type ImportBridge = {
  memory: {
    import: {
      claudeMem: { invoke: Mock };
      obsidianVault: { invoke: Mock };
      scanDevDir: { invoke: Mock };
      processDropFolder: { invoke: Mock };
    };
  };
  shell: {
    openExternal: { invoke: Mock };
  };
};

function getBridge() {
  return ipcBridge as unknown as ImportBridge;
}

// ===== Tests =====

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ImportDrawer', () => {
  it('renders no inner content when open=false', () => {
    render(<ImportDrawer open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('import-drawer-inner')).toBeNull();
  });

  it('does not apply drawerOpen class when closed', () => {
    render(<ImportDrawer open={false} onClose={vi.fn()} />);
    const drawer = screen.getByTestId('import-drawer');
    expect(drawer.className).not.toMatch(/drawerOpen/);
  });

  it('renders inner content when open=true', () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('import-drawer-inner')).toBeTruthy();
  });

  it('applies drawerOpen class when open=true', () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    const drawer = screen.getByTestId('import-drawer');
    expect(drawer.className).toMatch(/drawerOpen/);
  });

  it('renders 4 source cards when open', () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('import-card-claudemem')).toBeTruthy();
    expect(screen.getByTestId('import-card-obsidian')).toBeTruthy();
    expect(screen.getByTestId('import-card-devscan')).toBeTruthy();
    expect(screen.getByTestId('import-card-dropfolder')).toBeTruthy();
  });

  it('shows header title "Import memories"', () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('import-drawer-title').textContent).toContain('Import memories');
  });

  it('clicking close button calls onClose', () => {
    const onClose = vi.fn();
    render(<ImportDrawer open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('import-drawer-close-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Esc key calls onClose when open', () => {
    const onClose = vi.fn();
    render(<ImportDrawer open={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Esc key does not call onClose when closed', () => {
    const onClose = vi.fn();
    render(<ImportDrawer open={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clicking claude-mem Import button invokes ipcBridge.memory.import.claudeMem', async () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-claudemem'));
    await waitFor(() => {
      expect(getBridge().memory.import.claudeMem.invoke).toHaveBeenCalledTimes(1);
    });
  });

  it('clicking obsidian Import button with no vaults does not invoke (no vault selected)', () => {
    // When no vault detection results exist, selectedVault is null.
    // The handler guards on selectedVault - invoke should NOT be called.
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-obsidian'));
    expect(getBridge().memory.import.obsidianVault.invoke).not.toHaveBeenCalled();
  });

  it('clicking dev scan Import button invokes ipcBridge.memory.import.scanDevDir', async () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-devscan'));
    await waitFor(() => {
      expect(getBridge().memory.import.scanDevDir.invoke).toHaveBeenCalledTimes(1);
    });
  });

  it('drop folder card shows Open folder button', () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    const openBtn = screen.getByTestId('import-btn-openfolder');
    expect(openBtn.textContent).toContain('Open folder');
  });

  it('drop folder card shows Process now button', () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    const processBtn = screen.getByTestId('import-btn-dropfolder');
    expect(processBtn.textContent).toContain('Process now');
  });

  it('clicking Open folder invokes ipcBridge.shell.openExternal', () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-openfolder'));
    expect(getBridge().shell.openExternal.invoke).toHaveBeenCalledTimes(1);
  });

  it('clicking Process now invokes ipcBridge.memory.import.processDropFolder', async () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-dropfolder'));
    await waitFor(() => {
      expect(getBridge().memory.import.processDropFolder.invoke).toHaveBeenCalledTimes(1);
    });
  });

  it('drop folder card shows folder path', () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    const pathEl = screen.getByTestId('import-dropfolder-path');
    expect(pathEl.textContent).toContain('~/Documents/Wayland-Memory/');
  });
});
