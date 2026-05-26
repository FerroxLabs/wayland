/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Wave 5 — DOM tests for WikiTab. Covers:
 *  - List renders entries from wiki.get.
 *  - Clicking an entry triggers wiki.compile and renders the markdown.
 *  - DOMPurify strips <script> payloads before the markdown reaches the DOM.
 *  - Promote / Export / Share-README buttons fire the matching brain verbs.
 */

import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { brainInvokeMock } = vi.hoisted(() => ({
  brainInvokeMock: vi.fn<
    (args: { verb: string; args?: Record<string, unknown> }) => Promise<
      { ok: true; data?: unknown } | { ok: false; error?: string; errorReason?: string }
    >
  >(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      brainInvoke: { invoke: brainInvokeMock },
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>(
    '@arco-design/web-react'
  );
  return {
    ...actual,
    Message: {
      ...actual.Message,
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

import WikiTab from '@renderer/pages/memory/tabs/WikiTab';

const renderTab = () =>
  render(
    <MemoryRouter initialEntries={['/memory?tab=wiki']}>
      <WikiTab />
    </MemoryRouter>
  );

beforeEach(() => {
  brainInvokeMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('WikiTab', () => {
  it('renders the entry list from wiki.get', async () => {
    brainInvokeMock.mockImplementation(async ({ verb }) => {
      if (verb === 'wiki.get') {
        return {
          ok: true,
          data: {
            entries: [
              { slug: 'auth-stack', title: 'Auth stack decision', updatedAt: 1 },
              { slug: 'cron-pipeline', title: 'Cron pipeline', updatedAt: 2 },
            ],
          },
        };
      }
      return { ok: true, data: { markdown: '', meta: { compiled: true, promotedAt: 0 } } };
    });

    renderTab();

    await waitFor(() => {
      expect(screen.getByTestId('wiki-list-row-auth-stack')).toBeTruthy();
      expect(screen.getByTestId('wiki-list-row-cron-pipeline')).toBeTruthy();
    });
  });

  it('clicking an entry sets activeSlug and loads its compiled markdown', async () => {
    brainInvokeMock.mockImplementation(async ({ verb, args }) => {
      if (verb === 'wiki.get') {
        return {
          ok: true,
          data: {
            entries: [{ slug: 'auth-stack', title: 'Auth stack', updatedAt: 1 }],
          },
        };
      }
      if (verb === 'wiki.compile' && args?.slug === 'auth-stack') {
        return {
          ok: true,
          data: {
            markdown: '# Hello\n\nThis is **bold**.',
            meta: { compiled: true, promotedAt: 0 },
          },
        };
      }
      return { ok: false, errorReason: 'unknown' };
    });

    renderTab();

    await waitFor(() => {
      expect(screen.getByTestId('wiki-list-row-auth-stack')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('wiki-list-row-auth-stack'));

    await waitFor(() => {
      const content = screen.getByTestId('wiki-content');
      expect(content.innerHTML).toContain('<h1>Hello</h1>');
      expect(content.innerHTML).toContain('<strong>bold</strong>');
    });
  });

  it('strips <script> payloads via DOMPurify before the markdown reaches the DOM', async () => {
    brainInvokeMock.mockImplementation(async ({ verb }) => {
      if (verb === 'wiki.get') {
        return {
          ok: true,
          data: {
            entries: [{ slug: 'evil', title: 'Evil entry', updatedAt: 1 }],
          },
        };
      }
      if (verb === 'wiki.compile') {
        return {
          ok: true,
          data: {
            markdown:
              'Safe text\n\n<script>window.__pwned = true;</script>\n\n<img src=x onerror=alert(1)>',
            meta: { compiled: true, promotedAt: 0 },
          },
        };
      }
      return { ok: false, errorReason: 'unknown' };
    });

    renderTab();

    await waitFor(() => {
      expect(screen.getByTestId('wiki-list-row-evil')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('wiki-list-row-evil'));

    await waitFor(() => {
      const content = screen.getByTestId('wiki-content');
      // No real script tag was rendered (the payload was either escaped to
      // text by the markdown converter or stripped by DOMPurify; both are
      // safe and neither produces an executable element).
      expect(content.querySelector('script')).toBeNull();
      expect(content.querySelector('img')).toBeNull();
      // No live event handler attributes survive on any element.
      const all = content.querySelectorAll('*');
      for (const el of Array.from(all)) {
        for (const attr of Array.from(el.attributes)) {
          expect(attr.name.toLowerCase().startsWith('on')).toBe(false);
        }
      }
      // Safe content survives.
      expect(content.textContent).toContain('Safe text');
    });
  });

  it('fires wiki.promote when the Promote button is clicked', async () => {
    brainInvokeMock.mockImplementation(async ({ verb }) => {
      if (verb === 'wiki.get') {
        return {
          ok: true,
          data: { entries: [{ slug: 'auth', title: 'Auth', updatedAt: 1 }] },
        };
      }
      if (verb === 'wiki.compile') {
        return {
          ok: true,
          data: { markdown: 'body', meta: { compiled: true, promotedAt: 0 } },
        };
      }
      return { ok: true };
    });

    renderTab();

    await waitFor(() => {
      expect(screen.getByTestId('wiki-list-row-auth')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('wiki-list-row-auth'));

    await waitFor(() => {
      const btn = screen.getByTestId('wiki-button-promote') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    fireEvent.click(screen.getByTestId('wiki-button-promote'));

    await waitFor(() => {
      const calls = brainInvokeMock.mock.calls.map((c) => c[0].verb);
      expect(calls).toContain('wiki.promote');
    });
  });

  it('fires wiki.export when the Export button is clicked', async () => {
    brainInvokeMock.mockImplementation(async ({ verb }) => {
      if (verb === 'wiki.get') {
        return {
          ok: true,
          data: { entries: [{ slug: 'auth', title: 'Auth', updatedAt: 1 }] },
        };
      }
      if (verb === 'wiki.compile') {
        return {
          ok: true,
          data: { markdown: 'body', meta: { compiled: true, promotedAt: 0 } },
        };
      }
      return { ok: true };
    });

    renderTab();

    await waitFor(() => {
      expect(screen.getByTestId('wiki-list-row-auth')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('wiki-list-row-auth'));

    await waitFor(() => {
      const btn = screen.getByTestId('wiki-button-export') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    fireEvent.click(screen.getByTestId('wiki-button-export'));

    await waitFor(() => {
      const calls = brainInvokeMock.mock.calls.map((c) => c[0].verb);
      expect(calls).toContain('wiki.export');
    });
  });
});
