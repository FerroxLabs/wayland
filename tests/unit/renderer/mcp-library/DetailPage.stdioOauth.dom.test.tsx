// @vitest-environment jsdom

/**
 * #306 - DetailPage transport-aware "Sign in" routing for oauth2-byo connectors.
 *
 * An oauth2-byo connector splits by transport:
 *   - STDIO (Google Workspace, gcloud, Teams, MS365, Xero): the spawned
 *     subprocess runs its OWN OAuth using env credentials. The desktop loopback
 *     OAuth path (login()) hard-rejects non-HTTP transports
 *     ("OAuth requires an HTTP-family transport, got 'stdio'"), so clicking
 *     "Sign in" must install + connection-test the server, NOT call login().
 *   - HTTP-family (Atlassian, GitHub, ...): real loopback OAuth via login().
 *
 * These tests pin both halves of that discriminator so the #306 fix can't
 * regress into the old "got 'stdio'" failure, and so the fix doesn't break the
 * HTTP OAuth path that #283/#242 depend on.
 */

import React from 'react';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { IMcpServer } from '@/common/config/storage';

const { handleAddMcpServer, handleToggleMcpServer, login, messageSuccess, messageError, testMcpConnection } =
  vi.hoisted(() => ({
    handleAddMcpServer:
      vi.fn<(data: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IMcpServer | null>>(),
    handleToggleMcpServer: vi.fn<(id: string, enabled: boolean) => Promise<void>>(),
    login: vi.fn<(server: IMcpServer) => Promise<{ success: boolean; error?: string; code?: string }>>(),
    messageSuccess: vi.fn<(msg: string) => void>(),
    messageError: vi.fn<(msg: string) => void>(),
    testMcpConnection: vi.fn().mockResolvedValue({ success: true, data: { success: true, tools: [] } }),
  }));

vi.mock('@/common/adapter/ipcBridge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/common/adapter/ipcBridge')>();
  return {
    ...actual,
    mcpService: {
      ...actual.mcpService,
      testMcpConnection: { invoke: testMcpConnection },
    },
  };
});

const hookState: { mcpServers: IMcpServer[] } = { mcpServers: [] };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string | object, interp?: Record<string, string>) => {
      const tpl = typeof defaultValue === 'string' ? defaultValue : _key;
      if (!interp) return tpl;
      return tpl.replace(/\{\{(\w+)\}\}/g, (_m, k) => interp[k] ?? '');
    },
  }),
}));

vi.mock('@renderer/hooks/mcp', () => ({
  useMcpServers: () => ({
    mcpServers: hookState.mcpServers,
    allMcpServers: hookState.mcpServers,
    extensionMcpServers: [],
    setMcpServers: vi.fn(),
    saveMcpServers: vi.fn().mockResolvedValue(undefined),
  }),
  useMcpAgentStatus: () => ({
    agentInstallStatus: {},
    setAgentInstallStatus: vi.fn(),
    loadingServers: new Set(),
    isServerLoading: () => false,
    checkAgentInstallStatus: vi.fn().mockResolvedValue(undefined),
    debouncedCheckAgentInstallStatus: vi.fn(),
    checkSingleServerInstallStatus: vi.fn().mockResolvedValue(undefined),
  }),
  useMcpOperations: () => ({
    syncMcpToAgents: vi.fn().mockResolvedValue(undefined),
    removeMcpFromAgents: vi.fn().mockResolvedValue(undefined),
    handleMcpOperationResult: vi.fn(),
  }),
  useMcpOAuth: () => ({
    oauthStatus: {},
    loggingIn: {},
    checkOAuthStatus: vi.fn().mockResolvedValue(undefined),
    checkMultipleServers: vi.fn().mockResolvedValue(undefined),
    login,
    setByoCredentials: vi.fn().mockResolvedValue({ success: true, server: null }),
    cancelMcpOAuth: vi.fn(),
    logout: vi.fn().mockResolvedValue({ success: true }),
  }),
  useMcpServerCRUD: () => ({
    handleAddMcpServer,
    handleBatchImportMcpServers: vi.fn().mockResolvedValue([]),
    handleEditMcpServer: vi.fn().mockResolvedValue(undefined),
    handleDeleteMcpServer: vi.fn().mockResolvedValue(undefined),
    handleToggleMcpServer,
  }),
  useMcpConnection: () => ({
    testingServers: {},
    handleTestMcpConnection: vi.fn(),
    refreshServerStatuses: vi.fn(),
  }),
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');
  return {
    ...actual,
    Message: {
      ...actual.Message,
      success: messageSuccess,
      error: messageError,
      useMessage: () => [
        { success: messageSuccess, error: messageError },
        React.createElement('div', { 'data-testid': 'arco-context-holder' }),
      ],
    },
  };
});

import { DetailPage } from '@renderer/pages/settings/McpLibrary/DetailPage';

const GOOGLE_WORKSPACE_ID = 'io.github.taylorwilsdon/google-workspace-mcp';
const ATLASSIAN_ID = 'com.atlassian/atlassian-mcp';

function renderDetail(entryId: string) {
  return render(
    <MemoryRouter initialEntries={[`/settings/mcp-library/${encodeURIComponent(entryId)}`]}>
      <Routes>
        <Route path='/settings/mcp-library/:entryId' element={<DetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  hookState.mcpServers = [];
  handleAddMcpServer.mockReset();
  handleToggleMcpServer.mockReset().mockResolvedValue(undefined);
  login.mockReset().mockResolvedValue({ success: true });
  messageSuccess.mockReset();
  messageError.mockReset();
  testMcpConnection.mockReset().mockResolvedValue({ success: true, data: { success: true, tools: [] } });
});

afterEach(() => {
  cleanup();
});

test('stdio oauth2-byo: "Sign in" installs + connection-tests and NEVER calls login()', async () => {
  const fakeServer: IMcpServer = {
    id: 'mcp_gws',
    name: GOOGLE_WORKSPACE_ID.replace(/[^A-Za-z0-9_.-]/g, '-'),
    enabled: false,
    transport: {
      type: 'stdio',
      command: 'uvx',
      args: ['workspace-mcp'],
      env: { GOOGLE_OAUTH_CLIENT_ID: 'cid.apps.googleusercontent.com', GOOGLE_OAUTH_CLIENT_SECRET: 'secret' },
    },
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    source: 'library',
    libraryEntryId: GOOGLE_WORKSPACE_ID,
  };
  handleAddMcpServer.mockResolvedValue(fakeServer);

  renderDetail(GOOGLE_WORKSPACE_ID);
  await screen.findByText('Google Workspace');

  // The setup guide (with the OAuth client-id/secret inputs and the
  // "Sign in with Google" action) is the default tab when not yet connected.
  fireEvent.click(screen.getByRole('button', { name: /^Setup$/i }));

  fireEvent.change(await screen.findByLabelText(/Client ID/i), {
    target: { value: 'cid.apps.googleusercontent.com' },
  });
  fireEvent.change(await screen.findByLabelText(/Client Secret/i), { target: { value: 'secret' } });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
  });

  // Core #306 guarantee: a stdio transport must NEVER reach the HTTP loopback
  // OAuth path (which rejects it).
  await waitFor(() => expect(handleAddMcpServer).toHaveBeenCalledTimes(1));
  expect(login).not.toHaveBeenCalled();

  // It must self-authenticate via the env-install path: persist creds, then run
  // a real connection test (the subprocess runs its own OAuth on start).
  expect(handleAddMcpServer).toHaveBeenCalledWith(
    expect.objectContaining({
      transport: expect.objectContaining({
        type: 'stdio',
        env: expect.objectContaining({ GOOGLE_OAUTH_CLIENT_ID: 'cid.apps.googleusercontent.com' }),
      }),
    })
  );
  expect(testMcpConnection).toHaveBeenCalledTimes(1);
  expect(handleToggleMcpServer).toHaveBeenCalledWith('mcp_gws', true);
  expect(messageSuccess).toHaveBeenCalled();
});

test('stdio oauth2-byo: a failed connection test does NOT enable the server and surfaces the error', async () => {
  const fakeServer: IMcpServer = {
    id: 'mcp_gws',
    name: GOOGLE_WORKSPACE_ID.replace(/[^A-Za-z0-9_.-]/g, '-'),
    enabled: false,
    transport: { type: 'stdio', command: 'uvx', args: ['workspace-mcp'], env: {} },
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    source: 'library',
    libraryEntryId: GOOGLE_WORKSPACE_ID,
  };
  handleAddMcpServer.mockResolvedValue(fakeServer);
  testMcpConnection.mockResolvedValue({ success: true, data: { success: false, error: 'auth declined' } });

  renderDetail(GOOGLE_WORKSPACE_ID);
  await screen.findByText('Google Workspace');
  fireEvent.click(screen.getByRole('button', { name: /^Setup$/i }));
  fireEvent.change(await screen.findByLabelText(/Client ID/i), { target: { value: 'cid' } });
  fireEvent.change(await screen.findByLabelText(/Client Secret/i), { target: { value: 'secret' } });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
  });

  await waitFor(() => expect(testMcpConnection).toHaveBeenCalledTimes(1));
  expect(login).not.toHaveBeenCalled();
  // Failed probe must not flip the server on.
  expect(handleToggleMcpServer).not.toHaveBeenCalledWith('mcp_gws', true);
  expect(messageError).toHaveBeenCalled();
});

test('HTTP-family oauth2-byo: "Sign in" still runs the loopback OAuth via login()', async () => {
  const fakeServer: IMcpServer = {
    id: 'mcp_atl',
    name: ATLASSIAN_ID.replace(/[^A-Za-z0-9_.-]/g, '-'),
    enabled: false,
    transport: { type: 'streamable_http', url: 'https://mcp.atlassian.com/v1/sse' },
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    source: 'library',
    libraryEntryId: ATLASSIAN_ID,
  };
  handleAddMcpServer.mockResolvedValue(fakeServer);

  renderDetail(ATLASSIAN_ID);

  // Not-installed oauth2-byo header CTA dispatches onPrimary('oauth-flow').
  await act(async () => {
    fireEvent.click(await screen.findByRole('button', { name: /^Install$/ }));
  });

  // HTTP-family transport must take the real loopback OAuth path - the #306
  // guard only diverts stdio.
  await waitFor(() => expect(login).toHaveBeenCalledTimes(1));
  expect(testMcpConnection).not.toHaveBeenCalled();
});
