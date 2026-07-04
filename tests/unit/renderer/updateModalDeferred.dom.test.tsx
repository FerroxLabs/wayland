/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * UpdateModal — deferred state contract (#651/#632).
 *
 * When the main process broadcasts a 'deferred' auto-update status (its restart
 * was held because the app is busy), the modal must surface the deferred copy
 * and an "install now anyway" override that forces the install past the quiesce
 * gate. `ipcBridge` is mocked so we can drive the status event and assert the
 * force-install invocation; i18n returns the real en-US strings.
 */

import { act, render as rtlRender, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');
  return { ...actual, Message: { success: vi.fn(), error: vi.fn() } };
});

import enUpdate from '../../../src/renderer/services/i18n/locales/en-US/update.json';

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

// Capture the auto-update status listener so the test can drive events. Held in
// a hoisted box so the vi.mock factory (hoisted to the top) can reference it
// without a temporal-dead-zone error.
const h = vi.hoisted(() => ({
  statusListener: null as ((evt: unknown) => void) | null,
  quitAndInstall: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    autoUpdate: {
      status: {
        on: (cb: (evt: unknown) => void) => {
          h.statusListener = cb;
          return () => {
            h.statusListener = null;
          };
        },
      },
      quitAndInstall: { invoke: h.quitAndInstall },
    },
    update: {
      open: { on: () => () => {} },
      downloadProgress: { on: () => () => {} },
    },
    shell: { openExternal: { invoke: vi.fn() } },
  },
}));

// MarkdownView pulls a heavy markdown stack that is irrelevant to this state.
vi.mock('@/renderer/components/Markdown', () => ({ default: () => null }));

// WaylandModal needs ThemeProvider context; stub it to a visible-gated wrapper
// so we can assert on the rendered content without the full theme tree.
vi.mock('@/renderer/components/base/WaylandModal', () => ({
  default: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? React.createElement('div', { 'data-testid': 'wayland-modal' }, children) : null,
}));

import UpdateModal from '@/renderer/components/settings/UpdateModal';

describe('UpdateModal — deferred state (#651)', () => {
  beforeEach(() => {
    h.statusListener = null;
    h.quitAndInstall.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function emit(evt: unknown) {
    act(() => {
      h.statusListener?.(evt);
    });
  }

  it('renders the deferred copy + "install now anyway" when a deferred status arrives', () => {
    rtlRender(<UpdateModal />);
    expect(h.statusListener).toBeTypeOf('function');

    emit({ status: 'deferred', version: '2.0.0' });

    expect(screen.getByText(enUpdate.deferredTitle)).toBeTruthy();
    expect(screen.getByText(enUpdate.deferredDesc)).toBeTruthy();
    expect(screen.getByText(enUpdate.installNowAnyway)).toBeTruthy();
  });

  it('"install now anyway" forces the install past the gate (force: true)', () => {
    rtlRender(<UpdateModal />);
    emit({ status: 'deferred', version: '2.0.0' });

    const btn = screen.getByText(enUpdate.installNowAnyway);
    act(() => {
      btn.click();
    });

    expect(h.quitAndInstall).toHaveBeenCalledWith({ force: true });
  });
});
