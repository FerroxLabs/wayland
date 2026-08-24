/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Workspace "Reveal in file manager" must never be a silent dead click.
 *
 * `ipcBridge` is RESOLVE-ONLY: `shell.showItemInFolder` reports a refusal (a
 * path outside every authorized root) as a RESOLVED `{ ok: false, error }`,
 * never as a rejection. `handleOpenWorkspaceRoot` awaited the invoke inside a
 * `try/catch`, so the catch could only ever see a transport failure - a refusal
 * fell straight through and the menu item did nothing at all.
 */

import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  showItemInFolder: vi.fn(),
  messageError: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    shell: { showItemInFolder: { invoke: h.showItemInFolder } },
    dialog: { showOpen: { invoke: vi.fn() } },
    conversation: { get: { invoke: vi.fn() } },
  },
}));

vi.mock('@/renderer/pages/cron/useCronJobs', () => ({
  useCronJobs: () => ({ jobs: [], loading: false }),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

vi.mock('swr', () => ({ useSWRConfig: () => ({ mutate: vi.fn() }) }));

const WORKSPACE = '/workspace/project';

/**
 * Render the hook with the reveal path wired to the mocked bridge.
 *
 * @returns The hook result.
 */
const renderMigration = async () => {
  const { useWorkspaceMigration } = await import('@/renderer/pages/conversation/Workspace/hooks/useWorkspaceMigration');
  return renderHook(() =>
    useWorkspaceMigration({
      conversation_id: 'conv-1',
      workspace: WORKSPACE,
      messageApi: { error: h.messageError, success: vi.fn(), warning: vi.fn(), info: vi.fn() } as never,
      t: ((key: string) => key) as never,
      isTemporaryWorkspace: false,
    })
  );
};

describe('workspace reveal - resolve-only refusals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports a RESOLVED refusal instead of silently doing nothing', async () => {
    h.showItemInFolder.mockResolvedValue({ ok: false, error: 'path not allowed' });

    const { result } = await renderMigration();
    await act(async () => {
      await result.current.handleOpenWorkspaceRoot();
    });

    expect(h.showItemInFolder).toHaveBeenCalledWith(WORKSPACE);
    expect(h.messageError).toHaveBeenCalledWith('conversation.workspace.contextMenu.revealFailed');
  });

  it('still reports when the invoke rejects outright', async () => {
    h.showItemInFolder.mockRejectedValue(new Error('bridge died'));

    const { result } = await renderMigration();
    await act(async () => {
      await result.current.handleOpenWorkspaceRoot();
    });

    expect(h.messageError).toHaveBeenCalledWith('conversation.workspace.contextMenu.revealFailed');
  });

  it('stays quiet when the reveal actually succeeds', async () => {
    h.showItemInFolder.mockResolvedValue({ ok: true });

    const { result } = await renderMigration();
    await act(async () => {
      await result.current.handleOpenWorkspaceRoot();
    });

    expect(h.showItemInFolder).toHaveBeenCalledWith(WORKSPACE);
    expect(h.messageError).not.toHaveBeenCalled();
  });
});
