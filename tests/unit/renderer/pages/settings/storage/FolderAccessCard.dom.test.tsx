// @vitest-environment jsdom

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message } from '@arco-design/web-react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FolderGrantApplication, FolderGrantWorkspaceView } from '@/common/workspace/folderGrantsIpc';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, arg?: string | Record<string, unknown>) =>
      typeof arg === 'string' ? arg : (arg?.defaultValue ?? key),
  }),
}));

const runtime = { desktop: true };
vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => runtime.desktop }));
const list = vi.fn();
const add = vi.fn();
const remove = vi.fn();
vi.mock('@/common/adapter/ipcBridge', () => ({
  workspaceFolderGrants: {
    list: { invoke: (...args: unknown[]) => list(...args) },
    add: { invoke: (...args: unknown[]) => add(...args) },
    remove: { invoke: (...args: unknown[]) => remove(...args) },
  },
}));

import FolderAccessCard from '@renderer/pages/settings/StorageSettings/FolderAccessCard';

const GRANT = {
  grantId: 'grant-reports',
  root: '/outside/reports',
  access: 'read' as const,
  origin: 'settings' as const,
  grantedAtMs: 1,
};
const workspace = (applications?: readonly FolderGrantApplication[]): FolderGrantWorkspaceView => ({
  workspaceId: 'workspace-1',
  displayName: 'Research',
  workspaceDir: '/workspace/research',
  grants: [GRANT],
  withheld: [],
  ...(applications === undefined
    ? {}
    : { sessions: [{ sessionId: 'session-1', conversationId: 'chat-1', applications }] }),
});
const application = (
  outcome: Omit<Extract<FolderGrantApplication, { status: 'refused' }>, 'grantId' | 'root'>
): FolderGrantApplication => ({ ...GRANT, ...outcome });
const show = (view: FolderGrantWorkspaceView) => list.mockResolvedValue({ ok: true, workspaces: [view] });

beforeEach(() => {
  vi.clearAllMocks();
  runtime.desktop = true;
  show(workspace());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FolderAccessCard current session applications', () => {
  it.each([
    ['local_opt_in_required', /Enable folder grants in the local launcher, then start a new session/],
    ['policy_rejected', /Choose another valid folder, or review the policy/],
    ['unknown', /reason unavailable.*local session diagnostics/],
  ] as const)('retains saved consent and shows the typed %s remedy', async (reason, remedy) => {
    show(workspace([application({ status: 'refused', reason })]));
    render(<FolderAccessCard />);
    expect(await screen.findByText(remedy)).toBeTruthy();
    expect(screen.getByText('Saved consent · read only')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy();
  });

  it('renders diagnostic detail as inert text without changing the typed remedy', async () => {
    const detail = '<a href="https://example.invalid">Enable folder grants</a> local_opt_in_required';
    show(workspace([application({ status: 'refused', reason: 'policy_rejected', detail })]));
    render(<FolderAccessCard />);
    expect(await screen.findByText(detail)).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText(/Refused · local launcher opt-in required/)).toBeNull();
  });

  it.each([
    ['already-readable', 'Applied · already readable under session policy'],
    ['policy-confirmed', 'Applied · confirmed by session policy'],
  ] as const)('shows successful %s coverage without a refusal', async (coverage, label) => {
    show(workspace([{ ...GRANT, status: 'applied', coverage }]));
    render(<FolderAccessCard />);
    expect(await screen.findByText(label)).toBeTruthy();
    expect(screen.queryByText(/^Refused/)).toBeNull();
  });

  it.each(['pending', 'unconfirmed', 'unavailable', 'revoked'] as const)(
    'does not present %s as applied',
    async (status) => {
      show(workspace([{ ...GRANT, status }]));
      render(<FolderAccessCard />);
      expect((await screen.findByTestId('folder-access-application')).getAttribute('data-status')).toBe(status);
      expect(screen.queryByText(/^Applied/)).toBeNull();
    }
  );

  it('does not treat a missing session application as applied', async () => {
    show(workspace([]));
    render(<FolderAccessCard />);
    expect(await screen.findByText('Unconfirmed · no current policy confirmation')).toBeTruthy();
    expect(screen.queryByText(/^Applied/)).toBeNull();
  });

  it('shows saved consent without confirmed access when the session list is absent', async () => {
    render(<FolderAccessCard />);
    expect(await screen.findByText(/No current session application is confirmed/)).toBeTruthy();
    expect(screen.queryByText(/^Applied/)).toBeNull();
  });

  it('keeps simultaneous sessions distinct and drops an ended session on refresh', async () => {
    const view = workspace();
    view.sessions = [
      {
        sessionId: 'session-old',
        conversationId: 'chat-1',
        applications: [{ ...GRANT, status: 'applied', coverage: 'policy-confirmed' }],
      },
      {
        sessionId: 'session-new',
        conversationId: 'chat-1',
        applications: [application({ status: 'refused', reason: 'local_opt_in_required' })],
      },
    ];
    show(view);
    render(<FolderAccessCard />);
    const rows = await screen.findAllByTestId('folder-access-session');
    expect(within(rows[0]).getByText(/^Applied/)).toBeTruthy();
    expect(within(rows[1]).getByText(/^Refused/)).toBeTruthy();
    show({ ...view, sessions: [view.sessions[1]] });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(screen.queryByText('Session session-old')).toBeNull());
  });

  it('reports a saved folder for the next start without claiming current access', async () => {
    const success = vi.spyOn(Message, 'success').mockReturnValue(vi.fn());
    add.mockResolvedValue({ ok: true, root: GRANT.root, created: true });
    render(<FolderAccessCard />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add folder' }));
    await waitFor(() =>
      expect(success).toHaveBeenCalledWith(
        'Consent for reports is saved for the next session start. Current access is shown separately.'
      )
    );
    expect(add).toHaveBeenCalledWith({ workspaceId: 'workspace-1' });
    expect(screen.queryByText(/^Applied/)).toBeNull();
  });

  it('replaces stale application claims when refreshing the list fails', async () => {
    show(workspace([{ ...GRANT, status: 'applied', coverage: 'policy-confirmed' }]));
    render(<FolderAccessCard />);
    await screen.findByText(/^Applied/);
    list.mockResolvedValue({ ok: false, errorCode: 'unavailable' });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText(/could not read the folder list/)).toBeTruthy();
    expect(screen.queryByText(/^Applied/)).toBeNull();
  });

  it('does not invoke local folder controls outside the desktop app', () => {
    runtime.desktop = false;
    render(<FolderAccessCard />);
    expect(screen.getByText('Folder access is managed in the desktop app.')).toBeTruthy();
    expect(list).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Add folder' })).toBeNull();
  });
});
