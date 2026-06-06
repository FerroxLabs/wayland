// @vitest-environment jsdom

/**
 * W1-B - InstalledPage row actions wiring.
 *
 * Covers:
 *   - Status strip derives counts via deriveStatus (running / warn / error / tools).
 *   - Toggle button calls crud.handleToggleMcpServer(id, !enabled).
 *   - Re-authorize calls login(server) with the full server object.
 *   - Remove confirm flow calls crud.handleDeleteMcpServer(id).
 */

import React from 'react';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { IMcpServer } from '@/common/config/storage';
import type { McpOAuthStatus } from '@renderer/hooks/mcp/useMcpOAuth';

const {
  handleToggleMcpServer,
  handleDeleteMcpServer,
  login,
  messageSuccess,
  messageError,
  messageInfo,
} = vi.hoisted(() => ({
  handleToggleMcpServer: vi.fn<(id: string, enabled: boolean) => Promise<void>>(),
  handleDeleteMcpServer: vi.fn<(id: string) => Promise<void>>(),
  login: vi.fn<
    (server: IMcpServer) => Promise<{ success: boolean; error?: string }>
  >(),
  messageSuccess: vi.fn<(msg: string) => void>(),
  messageError: vi.fn<(msg: string) => void>(),
  messageInfo: vi.fn<(msg: string) => void>(),
}));

// Mutable container so each test seeds its own mcpServers + oauthStatus.
const hookState: {
  mcpServers: IMcpServer[];
  oauthStatus: Record<string, McpOAuthStatus>;
} = { mcpServers: [], oauthStatus: {} };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (
      _key: string,
      defaultValue?: string | object,
      interp?: Record<string, string>,
    ) => {
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
    oauthStatus: hookState.oauthStatus,
    loggingIn: {},
    checkOAuthStatus: vi.fn().mockResolvedValue(undefined),
    checkMultipleServers: vi.fn().mockResolvedValue(undefined),
    login,
    logout: vi.fn().mockResolvedValue({ success: true }),
  }),
  useMcpServerCRUD: () => ({
    handleAddMcpServer: vi.fn().mockResolvedValue(null),
    handleBatchImportMcpServers: vi.fn().mockResolvedValue([]),
    handleEditMcpServer: vi.fn().mockResolvedValue(undefined),
    handleDeleteMcpServer,
    handleToggleMcpServer,
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
      info: messageInfo,
      useMessage: () => [
        {
          success: messageSuccess,
          error: messageError,
          info: messageInfo,
        },
        React.createElement('div', { 'data-testid': 'arco-context-holder' }),
      ],
    },
    Modal: {
      ...actual.Modal,
      // Auto-confirm Modal.confirm in tests by invoking onOk immediately.
      confirm: (opts: { onOk?: () => Promise<void> | void }) => {
        void opts.onOk?.();
        return { close: vi.fn(), update: vi.fn() };
      },
    },
  };
});

import { InstalledPage } from '@renderer/pages/settings/McpLibrary/InstalledPage';

const RUNNING_ID = 'mcp_running';
const WARN_ID = 'mcp_warn';

const runningServer: IMcpServer = {
  id: RUNNING_ID,
  name: 'com.foo/foo-mcp',
  enabled: true,
  status: 'connected',
  transport: { type: 'stdio', command: 'npx', args: ['foo-mcp'] },
  tools: [
    { name: 't1', description: 't1', inputSchema: {} },
    { name: 't2', description: 't2', inputSchema: {} },
  ] as unknown as IMcpServer['tools'],
  originalJson: '{}',
  createdAt: 1,
  updatedAt: 1,
  source: 'library',
  libraryEntryId: 'com.foo/foo-mcp',
};

const warnServer: IMcpServer = {
  id: WARN_ID,
  name: 'My SSE Server',
  enabled: true,
  status: 'connected',
  transport: { type: 'sse', url: 'https://example.com/mcp' },
  originalJson: '{}',
  createdAt: 1,
  updatedAt: 1,
  source: 'custom',
};

function renderInstalled() {
  return render(
    <MemoryRouter>
      <InstalledPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  hookState.mcpServers = [runningServer, warnServer];
  hookState.oauthStatus = {
    [WARN_ID]: {
      isAuthenticated: false,
      needsLogin: true,
      isChecking: false,
    },
  };
  handleToggleMcpServer.mockReset();
  handleDeleteMcpServer.mockReset();
  login.mockReset();
  messageSuccess.mockReset();
  messageError.mockReset();
  messageInfo.mockReset();
});

afterEach(() => {
  cleanup();
});

test('status strip derives running/warn/error/tools counts', () => {
  const { container } = renderInstalled();

  // Running: 1 (runningServer is enabled + connected + no oauth flag)
  // Warn: 1 (warnServer has oauthStatus.needsLogin === true)
  // Error: 0
  // Tools: 2 (runningServer.tools.length)
  // Scope to the status strip so the ServerRow pills (which now use i18n'd labels
  // like "Running" / "Needs re-authorization") don't collide with the strip labels.
  const strip = container.querySelector('.mcp-status-strip') as HTMLElement;
  const cells = strip.querySelectorAll('.mcp-status-cell');
  const runningCell = cells[0];
  const warnCell = cells[1];
  const errorCell = cells[2];
  const toolsCell = cells[3];

  expect(runningCell.querySelector('b')?.textContent).toBe('1');
  expect(warnCell.querySelector('b')?.textContent).toBe('1');
  expect(errorCell.querySelector('b')?.textContent).toBe('0');
  expect(toolsCell.querySelector('b')?.textContent).toBe('2');
});

test('toggle button calls handleToggleMcpServer with flipped enabled value', async () => {
  renderInstalled();

  // ServerRow now renders Arco <Switch /> (role="switch") with aria-label.
  const toggles = screen.getAllByRole('switch', { name: /Enable \/ disable/i });
  // First row (From Library) is the running server. Click its toggle.
  await act(async () => {
    fireEvent.click(toggles[0]);
  });

  await waitFor(() => {
    expect(handleToggleMcpServer).toHaveBeenCalledTimes(1);
  });
  expect(handleToggleMcpServer).toHaveBeenCalledWith(RUNNING_ID, false);
});

test('re-authorize button calls login with the full server object', async () => {
  login.mockResolvedValue({ success: true });
  renderInstalled();

  // Only the warn server renders a "Re-authorize" button (needsLogin === true).
  const reauthBtn = screen.getByRole('button', { name: /Re-authorize/i });
  await act(async () => {
    fireEvent.click(reauthBtn);
  });

  await waitFor(() => {
    expect(login).toHaveBeenCalledTimes(1);
  });
  expect(login).toHaveBeenCalledWith(
    expect.objectContaining({ id: WARN_ID, name: 'My SSE Server' }),
  );
  await waitFor(() => {
    expect(messageSuccess).toHaveBeenCalledTimes(1);
  });
});

test('remove confirm flow calls handleDeleteMcpServer with the id', async () => {
  handleDeleteMcpServer.mockResolvedValue(undefined);
  renderInstalled();

  const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
  // First row is the running server (RUNNING_ID).
  await act(async () => {
    fireEvent.click(removeButtons[0]);
  });

  await waitFor(() => {
    expect(handleDeleteMcpServer).toHaveBeenCalledTimes(1);
  });
  expect(handleDeleteMcpServer).toHaveBeenCalledWith(RUNNING_ID);
});
