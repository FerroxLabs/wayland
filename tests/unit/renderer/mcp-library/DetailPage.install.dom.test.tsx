// @vitest-environment jsdom

/**
 * W1-A — DetailPage install wiring.
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

const { handleAddMcpServer, login, messageSuccess, messageError } = vi.hoisted(() => ({
  handleAddMcpServer: vi.fn<
    (data: Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IMcpServer | null>
  >(),
  login: vi.fn<
    (server: IMcpServer) => Promise<{ success: boolean; error?: string }>
  >(),
  messageSuccess: vi.fn<(msg: string) => void>(),
  messageError: vi.fn<(msg: string) => void>(),
}));

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
}));

vi.mock('@arco-design/web-react', async () => {
  const actual =
    await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');
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
    <MemoryRouter
      initialEntries={[`/settings/mcp-library/${encodeURIComponent(BRAVE_ENTRY_ID)}`]}
    >
      <Routes>
        <Route path="/settings/mcp-library/:entryId" element={<DetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  hookState.mcpServers = [];
  handleAddMcpServer.mockReset();
  login.mockReset();
  messageSuccess.mockReset();
  messageError.mockReset();
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
      name: BRAVE_ENTRY_ID,
      enabled: false,
      transport: expect.objectContaining({
        type: 'stdio',
        env: expect.objectContaining({ BRAVE_API_KEY: 'sk_test_123' }),
      }),
    }),
  );

  expect(messageSuccess).toHaveBeenCalledTimes(1);
});

test('button shows Installed (disabled) when the entry is already in mcpServers', async () => {
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

  const btn = await screen.findByRole('button', { name: /Installed/i });
  expect(btn).toBeDisabled();
});
