// @vitest-environment jsdom

/**
 * #348 - DetailPage per-server tool scoping (allowedTools toggles).
 *
 * Acceptance: toggling a tool off persists allowedTools WITHOUT that tool (so it
 * drops out of getCandidateTools), and the change is written through
 * saveMcpServers (persists across restart). Bulk enable-all clears allowedTools
 * back to undefined (the "all" default); disable-all sets it to [].
 */

import React from 'react';
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { IMcpServer } from '@/common/config/storage';

const { saveMcpServers } = vi.hoisted(() => ({
  saveMcpServers: vi.fn<(u: (prev: IMcpServer[]) => IMcpServer[]) => Promise<void>>().mockResolvedValue(undefined),
}));

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
    saveMcpServers,
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
    login: vi.fn(),
    setByoCredentials: vi.fn(),
    cancel: vi.fn(),
    logout: vi.fn().mockResolvedValue({ success: true }),
  }),
  useMcpServerCRUD: () => ({
    handleAddMcpServer: vi.fn(),
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
      success: vi.fn(),
      error: vi.fn(),
      useMessage: () => [
        { success: vi.fn(), error: vi.fn() },
        React.createElement('div', { 'data-testid': 'arco-context-holder' }),
      ],
    },
  };
});

import { DetailPage } from '@renderer/pages/settings/McpLibrary/DetailPage';

const BRAVE = 'com.brave/brave-search-mcp';

function seed(allowedTools?: string[]): IMcpServer {
  return {
    id: 'mcp_b',
    name: BRAVE,
    enabled: true,
    status: 'connected',
    transport: { type: 'stdio', command: 'npx', args: ['brave-search-mcp'] },
    tools: [{ name: 'search', description: 'Web search' }, { name: 'news' }],
    allowedTools,
    originalJson: '{}',
    createdAt: 1,
    updatedAt: 1,
    source: 'library',
    libraryEntryId: BRAVE,
  } as IMcpServer;
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={[`/settings/mcp-library/${encodeURIComponent(BRAVE)}`]}>
      <Routes>
        <Route path='/settings/mcp-library/:entryId' element={<DetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

async function openToolsTab() {
  fireEvent.click(await screen.findByRole('button', { name: /Tools/ }));
}

// Apply the updater saveMcpServers was last called with against the seeded state.
function persistedAllowedTools(): string[] | undefined {
  const updater = saveMcpServers.mock.calls.at(-1)![0];
  return updater(hookState.mcpServers)[0].allowedTools;
}

beforeEach(() => {
  hookState.mcpServers = [seed()];
  saveMcpServers.mockReset().mockResolvedValue(undefined);
});
afterEach(() => cleanup());

test('toggling a tool off persists allowedTools without that tool', async () => {
  renderDetail();
  await openToolsTab();

  // Each tool row's Switch is labelled "Enable <tool>" for a11y + targeting.
  const searchSwitch = await screen.findByRole('switch', { name: /Enable search/i });
  await act(async () => {
    fireEvent.click(searchSwitch);
  });

  await waitFor(() => expect(saveMcpServers).toHaveBeenCalled());
  // 'search' removed; the rest stay enabled.
  expect(persistedAllowedTools()).toEqual(['news']);
});

test('enable-all clears allowedTools back to undefined (all enabled)', async () => {
  hookState.mcpServers = [seed(['news'])]; // start scoped to one tool
  renderDetail();
  await openToolsTab();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Enable all/i }));
  });

  await waitFor(() => expect(saveMcpServers).toHaveBeenCalled());
  expect(persistedAllowedTools()).toBeUndefined();
});

test('disable-all sets allowedTools to [] (none enabled)', async () => {
  renderDetail();
  await openToolsTab();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Disable all/i }));
  });

  await waitFor(() => expect(saveMcpServers).toHaveBeenCalled());
  expect(persistedAllowedTools()).toEqual([]);
});
