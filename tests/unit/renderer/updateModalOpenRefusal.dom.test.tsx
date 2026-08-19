/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * UpdateModal - the post-download "Open file" / "Show in folder" buttons must
 * not swallow a refusal.
 *
 * `shell.openFile` and `shell.showItemInFolder` are RESOLVE-ONLY: a refusal from
 * confinement or the open-target type gate comes back as a RESOLVED
 * `{ ok: false, error }`, and a failed OS handler (a Linux box with no
 * association) does too. Both handlers previously attached only `.catch()`, so
 * every one of those outcomes was a console line and a dead button.
 */

import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUpdate from '../../../src/renderer/services/i18n/locales/en-US/update.json';

const h = vi.hoisted(() => ({
  downloadPath: '/Users/tester/Downloads/Wayland-9.9.9.dmg',
  progressListener: null as ((evt: unknown) => void) | null,
  openFile: vi.fn(),
  showItemInFolder: vi.fn(),
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');
  return { ...actual, Message: { success: h.messageSuccess, error: h.messageError } };
});

function lookup(path: string): string | undefined {
  const parts = path.replace(/^update\./, '').split('.');
  let node: unknown = enUpdate;
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === 'string' ? node : undefined;
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const out = lookup(key);
      if (out === undefined) {
        if (opts && typeof opts.defaultValue === 'string') return opts.defaultValue;
        return key;
      }
      return out;
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => React.createElement('span', null, i18nKey),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    autoUpdate: {
      status: { on: () => () => {} },
      check: { invoke: vi.fn().mockResolvedValue({ success: false }) },
      quitAndInstall: { invoke: vi.fn() },
    },
    update: {
      open: { on: () => () => {} },
      downloadProgress: {
        on: (cb: (evt: unknown) => void) => {
          h.progressListener = cb;
          return () => {
            h.progressListener = null;
          };
        },
      },
      check: {
        invoke: vi.fn().mockResolvedValue({
          success: true,
          data: {
            currentVersion: '9.9.8',
            updateAvailable: true,
            latest: {
              version: '9.9.9',
              tagName: 'v9.9.9',
              htmlUrl: 'https://example.invalid/release',
              recommendedAsset: { url: 'https://example.invalid/a.dmg', name: 'a.dmg' },
            },
          },
        }),
      },
      download: {
        invoke: vi.fn().mockResolvedValue({ success: true, data: { downloadId: 'd1', filePath: h.downloadPath } }),
      },
    },
    shell: {
      openFile: { invoke: h.openFile },
      showItemInFolder: { invoke: h.showItemInFolder },
      openExternal: { invoke: vi.fn() },
    },
  },
}));

vi.mock('@/renderer/components/Markdown', () => ({ default: () => null }));

vi.mock('@/renderer/components/base/WaylandModal', () => ({
  default: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? React.createElement('div', { 'data-testid': 'wayland-modal' }, children) : null,
}));

import UpdateModal from '@/renderer/components/settings/UpdateModal';

/** Drive the modal to the post-download state that renders Open / Show in folder. */
async function renderDownloadedState(): Promise<void> {
  render(<UpdateModal />);
  await act(async () => {
    window.dispatchEvent(new Event('wayland-open-update-modal'));
  });
  await act(async () => {
    screen.getByText(enUpdate.downloadButton).click();
  });
  await act(async () => {
    h.progressListener?.({ downloadId: 'd1', status: 'completed', filePath: h.downloadPath, percent: 100 });
  });
  expect(screen.getByText(enUpdate.openFile)).toBeTruthy();
}

describe('UpdateModal - post-download open actions surface refusals', () => {
  beforeEach(() => {
    h.progressListener = null;
    h.messageError.mockClear();
    h.openFile.mockReset();
    h.showItemInFolder.mockReset();
  });

  it('"Open file" reports a RESOLVED refusal instead of dying silently', async () => {
    h.openFile.mockResolvedValue({ ok: false, error: 'refusing to open ".dmg": not an openable document type' });

    await renderDownloadedState();
    await act(async () => {
      screen.getByText(enUpdate.openFile).click();
    });

    expect(h.openFile).toHaveBeenCalledWith(h.downloadPath);
    expect(h.messageError).toHaveBeenCalledWith('refusing to open ".dmg": not an openable document type');
  });

  it('"Show in folder" reports a RESOLVED refusal too', async () => {
    h.openFile.mockResolvedValue({ ok: true });
    h.showItemInFolder.mockResolvedValue({ ok: false, error: 'path not allowed' });

    await renderDownloadedState();
    await act(async () => {
      screen.getByText(enUpdate.showInFolder).click();
    });

    expect(h.showItemInFolder).toHaveBeenCalledWith(h.downloadPath);
    expect(h.messageError).toHaveBeenCalledWith('path not allowed');
  });

  it('stays quiet when the open actually succeeds', async () => {
    h.openFile.mockResolvedValue({ ok: true });

    await renderDownloadedState();
    await act(async () => {
      screen.getByText(enUpdate.openFile).click();
    });

    expect(h.messageError).not.toHaveBeenCalled();
  });
});
