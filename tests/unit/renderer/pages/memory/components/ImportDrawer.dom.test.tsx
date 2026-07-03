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
  // Default: one vault found (so a single click scans + auto-selects it).
  const obsidianDetectVaultsInvoke = vi
    .fn()
    .mockResolvedValue([{ path: '/Users/x/Documents/MyVault', name: 'MyVault', mdFileCount: 12 }]);
  const obsidianVaultInvoke = vi.fn().mockResolvedValue({ count: 3, errors: [] });
  const scanDevDirInvoke = vi.fn().mockResolvedValue({ count: 10, projectsFound: 2, errors: [] });
  const processDropFolderInvoke = vi.fn().mockResolvedValue({ count: 2, errors: [] });
  const openExternalInvoke = vi.fn().mockResolvedValue(undefined);
  const showOpenInvoke = vi.fn().mockResolvedValue(['/Users/x/Desktop/PickedVault']);

  return {
    ipcBridge: {
      memory: {
        import: {
          claudeMem: { invoke: claudeMemInvoke },
          obsidianDetectVaults: { invoke: obsidianDetectVaultsInvoke },
          obsidianVault: { invoke: obsidianVaultInvoke },
          scanDevDir: { invoke: scanDevDirInvoke },
          processDropFolder: { invoke: processDropFolderInvoke },
        },
      },
      shell: {
        openExternal: { invoke: openExternalInvoke },
      },
      dialog: {
        showOpen: { invoke: showOpenInvoke },
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
      obsidianDetectVaults: { invoke: Mock };
      obsidianVault: { invoke: Mock };
      scanDevDir: { invoke: Mock };
      processDropFolder: { invoke: Mock };
    };
  };
  shell: {
    openExternal: { invoke: Mock };
  };
  dialog: {
    showOpen: { invoke: Mock };
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

  // #553: with no vaults yet, the obsidian button scans (not a silent no-op).
  it('clicking obsidian button with no vaults runs a vault scan', async () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    // Before any scan the button offers "Scan for vaults".
    expect(screen.getByTestId('import-btn-obsidian').textContent).toContain('Scan for vaults');
    fireEvent.click(screen.getByTestId('import-btn-obsidian'));
    await waitFor(() => {
      expect(getBridge().memory.import.obsidianDetectVaults.invoke).toHaveBeenCalledTimes(1);
    });
    // A single found vault is auto-selected and the button flips to "Import".
    await waitFor(() => {
      expect(screen.getByTestId('import-btn-obsidian').textContent).toContain('Import');
    });
  });

  it('scanning then clicking Import imports the auto-selected vault', async () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-obsidian')); // scan
    await waitFor(() => {
      expect(screen.getByTestId('import-btn-obsidian').textContent).toContain('Import');
    });
    fireEvent.click(screen.getByTestId('import-btn-obsidian')); // import
    await waitFor(() => {
      expect(getBridge().memory.import.obsidianVault.invoke).toHaveBeenCalledWith({
        vaultPath: '/Users/x/Documents/MyVault',
      });
    });
  });

  it('a scan that finds no vaults does not import and leaves the button on "Scan for vaults"', async () => {
    getBridge().memory.import.obsidianDetectVaults.invoke.mockResolvedValueOnce([]);
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-obsidian'));
    await waitFor(() => {
      expect(getBridge().memory.import.obsidianDetectVaults.invoke).toHaveBeenCalledTimes(1);
    });
    expect(getBridge().memory.import.obsidianVault.invoke).not.toHaveBeenCalled();
    expect(screen.getByTestId('import-btn-obsidian').textContent).toContain('Scan for vaults');
  });

  it('multiple vaults require an explicit pick before Import is enabled', async () => {
    getBridge().memory.import.obsidianDetectVaults.invoke.mockResolvedValueOnce([
      { path: '/Users/x/Documents/VaultA', name: 'VaultA', mdFileCount: 4 },
      { path: '/Users/x/Documents/VaultB', name: 'VaultB', mdFileCount: 9 },
    ]);
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-obsidian')); // scan
    await waitFor(() => {
      expect(screen.getAllByTestId('import-vault-row').length).toBe(2);
    });
    // No auto-selection with multiple vaults → Import stays disabled.
    const btn = screen.getByTestId('import-btn-obsidian') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.click(screen.getAllByTestId('import-vault-row')[1]); // pick VaultB
    await waitFor(() => expect((screen.getByTestId('import-btn-obsidian') as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByTestId('import-btn-obsidian')); // import
    await waitFor(() => {
      expect(getBridge().memory.import.obsidianVault.invoke).toHaveBeenCalledWith({
        vaultPath: '/Users/x/Documents/VaultB',
      });
    });
  });

  // #553: folder-picker fallback for vaults outside ~/Documents.
  it('Choose folder… opens a directory picker and imports the picked vault', async () => {
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-obsidian-choose'));
    await waitFor(() => {
      expect(getBridge().dialog.showOpen.invoke).toHaveBeenCalledWith({ properties: ['openDirectory'] });
    });
    await waitFor(() => {
      expect(getBridge().memory.import.obsidianVault.invoke).toHaveBeenCalledWith({
        vaultPath: '/Users/x/Desktop/PickedVault',
      });
    });
  });

  it('Choose folder… cancelled (no selection) does not import', async () => {
    getBridge().dialog.showOpen.invoke.mockResolvedValueOnce(undefined);
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-obsidian-choose'));
    await waitFor(() => {
      expect(getBridge().dialog.showOpen.invoke).toHaveBeenCalledTimes(1);
    });
    expect(getBridge().memory.import.obsidianVault.invoke).not.toHaveBeenCalled();
  });

  it('a failed scan surfaces an error and does not import', async () => {
    getBridge().memory.import.obsidianDetectVaults.invoke.mockRejectedValueOnce(new Error('boom'));
    render(<ImportDrawer open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('import-btn-obsidian'));
    await waitFor(() => {
      expect(getBridge().memory.import.obsidianDetectVaults.invoke).toHaveBeenCalledTimes(1);
    });
    expect(getBridge().memory.import.obsidianVault.invoke).not.toHaveBeenCalled();
    // Button returns to the scan affordance (no vaults loaded).
    expect(screen.getByTestId('import-btn-obsidian').textContent).toContain('Scan for vaults');
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
