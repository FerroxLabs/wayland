/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * The Workbench file tree must EXPAND when its disclosure control is clicked.
 *
 * This pins the CONTROLLED-tree wiring. Arco's Tree is rendered with
 * `expandedKeys` as a prop, so its own expand handler deliberately skips
 * `setState` (`Tree/index.js`: `if (!('expandedKeys' in this.props))`) and the
 * component is entirely dependent on the `onExpand` callback being routed back
 * into `expandedKeys`. Drop that callback - or stop feeding its result back -
 * and every folder in the Workbench becomes permanently unopenable with no
 * error anywhere.
 *
 * The test CLICKS the real disclosure control on the real `ChatWorkspace` and
 * asserts a child node appears. It never sets expansion state itself, and the
 * tree it clicks on is the shape `readDirectoryRecursive` actually returns.
 *
 * Note the click target: Arco puts the handler on the INNER
 * `.arco-tree-node-switcher-icon` (role="button"), not on the
 * `.arco-tree-node-switcher` wrapper. Clicking the wrapper does nothing, which
 * makes a wrapper-targeted test fail for a reason that has nothing to do with
 * the product.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

const h = vi.hoisted(() => ({
  getWorkspace: vi.fn(),
}));

/**
 * `ipcBridge` is a deep namespace object. Enumerating every channel the
 * Workbench touches would make this test a maintenance tax on unrelated
 * features, so every path auto-resolves to an inert provider and only
 * `conversation.getWorkspace` carries real data.
 *
 * @returns A proxied stand-in for the real bridge.
 */
const makeBridge = (): unknown => {
  const provider = {
    invoke: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnValue(() => undefined),
    off: vi.fn(),
    emit: vi.fn(),
    provider: vi.fn().mockReturnValue(() => undefined),
    removeProvider: vi.fn(),
  };
  const node = (): unknown =>
    new Proxy(provider, {
      get(target, prop) {
        if (prop in target) return (target as Record<string | symbol, unknown>)[prop];
        return node();
      },
    });
  return node();
};

vi.mock('@/common', () => {
  const bridge = makeBridge() as Record<string, Record<string, { invoke: unknown }>>;
  bridge.conversation.getWorkspace = { invoke: h.getWorkspace } as never;
  bridge.fileSnapshot.init = { invoke: vi.fn().mockResolvedValue({ mode: 'none' }) } as never;
  return { ipcBridge: bridge };
});

vi.mock('@/renderer/pages/conversation/Preview', () => ({
  usePreviewContext: () => ({ openPreview: vi.fn(), setSendBoxHandler: vi.fn() }),
}));

vi.mock('swr', () => ({
  useSWRConfig: () => ({ mutate: vi.fn() }),
  default: () => ({ data: undefined, error: undefined, isLoading: false, mutate: vi.fn() }),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en-US' } }),
}));

const WORKSPACE = '/tmp/ws-expand-test';

/**
 * The workspace tree the main process would return: one root with an
 * `artifacts` folder that itself holds a file.
 *
 * @returns The tree, freshly built so no test shares node objects.
 */
const workspaceTree = () => [
  {
    name: 'ws-expand-test',
    fullPath: WORKSPACE,
    relativePath: '',
    isDir: true,
    isFile: false,
    children: [
      {
        name: 'artifacts',
        fullPath: `${WORKSPACE}/artifacts`,
        relativePath: 'artifacts',
        isDir: true,
        isFile: false,
        children: [
          {
            name: 'summary.md',
            fullPath: `${WORKSPACE}/artifacts/summary.md`,
            relativePath: 'artifacts/summary.md',
            isDir: false,
            isFile: true,
          },
        ],
      },
    ],
  },
];

describe('Workbench tree expansion', () => {
  // The only test in this file dynamically imports the whole Workspace page
  // graph. Vitest charges that first transform to the test body, which is 1682ms
  // idle and blew the 10s timeout in one of two full-suite runs on a 96-core box
  // - the same defect as conversationBridge.tray / autoUpdate / i18n.index.dom,
  // and the same reason: the worker pool is sized from the CPU count, so more
  // cores means more concurrent transform pipelines and a longer wall clock for
  // any single one. Pay it before the test is timed; the assertions below are
  // untouched and still run against a freshly rendered component.
  beforeAll(async () => {
    try {
      await import('@/renderer/pages/conversation/Workspace');
    } catch {
      // Not a verdict: the test imports the same module itself and will report
      // the real error against a real assertion.
    }
  }, 120_000);

  beforeEach(() => {
    vi.clearAllMocks();
    h.getWorkspace.mockResolvedValue(workspaceTree());
  });

  it('renders the child file after the folder switcher is CLICKED', async () => {
    const { default: ChatWorkspace } = await import('@/renderer/pages/conversation/Workspace');

    render(
      React.createElement(ChatWorkspace, {
        conversation_id: 'conv-expand-1',
        workspace: WORKSPACE,
        eventPrefix: 'wcore' as const,
      })
    );

    // The collapsed folder is on screen; its child is not.
    await waitFor(() => expect(screen.getByText('artifacts')).toBeInTheDocument());
    expect(screen.queryByText('summary.md')).not.toBeInTheDocument();

    // Arco binds the expand handler to the inner icon, not the wrapper.
    const switcher = screen.getByRole('button', { name: 'expand button' });

    fireEvent.click(switcher);

    await waitFor(() => expect(screen.getByText('summary.md')).toBeInTheDocument());
  });
});
