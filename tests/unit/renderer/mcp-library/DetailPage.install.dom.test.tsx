// @vitest-environment jsdom

/**
 * W1-A - DetailPage install wiring.
 *
 * Covers:
 *   - Install button calls crud.handleAddMcpServer with source/libraryEntryId metadata.
 *   - After install resolves, the button reads "Installed" and is disabled.
 *   - Env values typed into the SetupGuide flow through to the install payload.
 */

import React from 'react';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { IMcpServer } from '@/common/config/storage';

const { handleAddMcpServer, login, messageSuccess, messageError, testMcpConnection } = vi.hoisted(() => ({
  handleAddMcpServer: vi.fn<(data: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IMcpServer | null>>(),
  login: vi.fn<(server: IMcpServer) => Promise<{ success: boolean; error?: string }>>(),
  messageSuccess: vi.fn<(msg: string) => void>(),
  messageError: vi.fn<(msg: string) => void>(),
  // The redesigned api-key install path runs a real connection test before
  // toasting success and enabling the server; default it to a passing probe.
  testMcpConnection: vi.fn().mockResolvedValue({ success: true, data: { success: true, tools: [] } }),
}));

// The api-key save+connect flow probes the server through the IPC bridge.
// Partial-mock so the bridge's other exports stay intact; only the MCP
// connection probe is stubbed to a passing result.
vi.mock('@/common/adapter/ipcBridge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/common/adapter/ipcBridge')>();
  return {
    ...actual,
    mcpService: {
      ...actual.mcpService,
      testMcpConnection: { invoke: testMcpConnection },
    },
    // DetailPage.buildServerData (#448) resolves the user's home via
    // application.getPath to bake the filesystem server's directory arg. jsdom
    // has no main process, so the real provider's invoke never resolves — stub
    // it, or the install click rejects in buildServerData before it ever reaches
    // handleAddMcpServer.
    application: {
      ...actual.application,
      getPath: { invoke: vi.fn().mockResolvedValue('/Users/test') },
    },
  };
});

// Mutable container so tests can flip the mcpServers list to simulate "installed".
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
    logout: vi.fn().mockResolvedValue({ success: true }),
  }),
  useMcpServerCRUD: () => ({
    handleAddMcpServer,
    handleBatchImportMcpServers: vi.fn().mockResolvedValue([]),
    handleEditMcpServer: vi.fn().mockResolvedValue(undefined),
    handleDeleteMcpServer: vi.fn().mockResolvedValue(undefined),
    handleToggleMcpServer: vi.fn().mockResolvedValue(undefined),
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

const BRAVE_ENTRY_ID = 'com.brave/brave-search-mcp';

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={[`/settings/mcp-library/${encodeURIComponent(BRAVE_ENTRY_ID)}`]}>
      <Routes>
        <Route path='/settings/mcp-library/:entryId' element={<DetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  hookState.mcpServers = [];
  handleAddMcpServer.mockReset();
  login.mockReset();
  messageSuccess.mockReset();
  messageError.mockReset();
  testMcpConnection.mockReset();
  testMcpConnection.mockResolvedValue({ success: true, data: { success: true, tools: [] } });
});

afterEach(() => {
  cleanup();
});

test('Install click calls handleAddMcpServer with library source + libraryEntryId', async () => {
  const fakeServer: IMcpServer = {
    id: 'mcp_test',
    name: BRAVE_ENTRY_ID,
    enabled: false,
    transport: {
      type: 'stdio',
      command: 'npx',
      args: ['brave-search-mcp'],
      env: { BRAVE_API_KEY: 'sk_test_123' },
    },
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    source: 'library',
    libraryEntryId: BRAVE_ENTRY_ID,
  };
  handleAddMcpServer.mockResolvedValue(fakeServer);

  renderDetail();

  // Wait for the entry to mount.
  await screen.findByText('Brave Search');

  // The SetupGuide (with its env inputs) now lives behind the "Setup" tab in
  // the redesigned DetailPage. Open it before typing the API key.
  fireEvent.click(screen.getByRole('button', { name: /^Setup$/i }));

  // Type API key into the SetupGuide input.
  const input = await screen.findByLabelText(/Brave API key/i);
  fireEvent.change(input, { target: { value: 'sk_test_123' } });

  // Click Install in the header.
  const installBtn = screen.getByRole('button', { name: /^Install$/ });
  await act(async () => {
    fireEvent.click(installBtn);
  });

  await waitFor(() => {
    expect(handleAddMcpServer).toHaveBeenCalledTimes(1);
  });

  expect(handleAddMcpServer).toHaveBeenCalledWith(
    expect.objectContaining({
      source: 'library',
      libraryEntryId: BRAVE_ENTRY_ID,
      // The catalog id carries a reverse-DNS slash; entryToServerData sanitizes
      // it to the agent-config-safe form (the slash would fail validateMcpServer).
      // libraryEntryId keeps the canonical slug for dedup/matching.
      name: BRAVE_ENTRY_ID.replace(/[^A-Za-z0-9_.-]/g, '-'),
      enabled: false,
      transport: expect.objectContaining({
        type: 'stdio',
        env: expect.objectContaining({ BRAVE_API_KEY: 'sk_test_123' }),
      }),
    })
  );

  expect(messageSuccess).toHaveBeenCalledTimes(1);
});

test('shows the installed lifecycle (Remove, no Install CTA) when already in mcpServers', async () => {
  hookState.mcpServers = [
    {
      id: 'mcp_existing',
      name: BRAVE_ENTRY_ID,
      enabled: false,
      transport: { type: 'stdio', command: 'npx', args: ['brave-search-mcp'] },
      originalJson: '{}',
      createdAt: 1,
      updatedAt: 1,
      source: 'library',
      libraryEntryId: BRAVE_ENTRY_ID,
    },
  ];

  renderDetail();

  // The redesigned DetailPage replaces the old disabled "Installed" button with
  // the installed lifecycle action card: a "Remove connector" control and no
  // fresh "Install" CTA.
  expect(await screen.findByRole('button', { name: /Remove connector/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Install$/ })).not.toBeInTheDocument();
});
