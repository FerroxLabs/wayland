// @vitest-environment jsdom

/**
 * Wave 1.1 - Browse-grid McpCard footer-by-state.
 *
 * Asserts the locked footer recipe:
 *   - not installed         -> Install affordance, no switch
 *   - installed + running   -> Switch (role=switch), no Install
 *   - installed + warn      -> Sign in affordance, no switch
 *   - installed + error     -> Reconnect affordance -> onReconnect(server)
 */

import React from 'react';
import { test, expect, vi, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { IMcpServer } from '@/common/config/storage';
import { McpCard } from '@renderer/pages/settings/McpLibrary/components/McpCard';
import {
  McpCardActionsProvider,
  type McpCardActions,
} from '@renderer/pages/settings/McpLibrary/components/McpCardActions';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

const fakeEntry = {
  id: 'test/x',
  name: 'Test Service',
  shortDescription: 'Does a thing.',
  iconUrl: 'icons/test.svg',
  tier: 'core' as const,
  categories: ['communication'],
  maintainerType: 'wayland' as const,
  verifiedByWayland: '2026-05-01',
  popularityRank: 5,
  installRate: 0.42,
  entryUrl: 'entries/x.json',
  guideUrl: 'guides/x.md',
};

function makeServer(overrides: Partial<IMcpServer> = {}): IMcpServer {
  return {
    id: 'srv-1',
    name: 'Test Service',
    enabled: true,
    transport: { type: 'stdio', command: 'noop', args: [] },
    status: 'connected',
    createdAt: 0,
    updatedAt: 0,
    originalJson: '{}',
    ...overrides,
  } as IMcpServer;
}

function makeActions(server: IMcpServer | undefined): McpCardActions {
  return {
    serverFor: () => server,
    onToggle: vi.fn(),
    onRemove: vi.fn(),
    onReconnect: vi.fn(),
    onConfigure: vi.fn(),
  };
}

function renderCard(props: {
  installed: boolean;
  status?: 'running' | 'warn' | 'error' | 'stopped';
  server?: IMcpServer;
  actions?: McpCardActions;
  onClick?: () => void;
}) {
  const actions = props.actions ?? makeActions(props.server);
  render(
    <McpCardActionsProvider value={actions}>
      <McpCard
        entry={fakeEntry}
        installed={props.installed}
        status={props.status}
        onClick={props.onClick ?? (() => {})}
      />
    </McpCardActionsProvider>
  );
  return actions;
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test('not installed -> Install affordance present, no switch', () => {
  renderCard({ installed: false });
  expect(screen.getByText('Install')).toBeInTheDocument();
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
});

test('installed + running -> switch present, no Install', () => {
  renderCard({ installed: true, status: 'running', server: makeServer({ enabled: true }) });
  expect(screen.getByRole('switch')).toBeInTheDocument();
  expect(screen.queryByText('Install')).not.toBeInTheDocument();
});

test('installed + warn -> Sign in affordance present, no switch', () => {
  renderCard({
    installed: true,
    status: 'warn',
    server: makeServer({ status: 'connected' }),
  });
  expect(screen.getByText('Sign in')).toBeInTheDocument();
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
});

test('installed + error -> Reconnect affordance calls onReconnect', () => {
  const server = makeServer({ status: 'error' });
  const actions = makeActions(server);
  renderCard({ installed: true, status: 'error', server, actions });
  const reconnect = screen.getByText('Reconnect');
  expect(reconnect).toBeInTheDocument();
  fireEvent.click(reconnect);
  expect(actions.onReconnect).toHaveBeenCalledWith(server);
});
