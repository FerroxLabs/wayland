/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockResponseStreamOn = vi.hoisted(() => vi.fn(() => vi.fn()));
/** Stored conversation + connector inventory the menu reads on open. */
const state = vi.hoisted(() => ({
  conversation: undefined as unknown,
  mcpServers: [] as unknown[],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      let s = (opts?.defaultValue as string) ?? key;
      if (opts) {
        for (const [k, v] of Object.entries(opts)) {
          s = s.replace(`{{${k}}}`, String(v));
        }
      }
      return s;
    },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    skills: {
      list: { invoke: vi.fn().mockResolvedValue([]) },
      addToConversation: { invoke: vi.fn().mockResolvedValue({ ok: true }) },
    },
    conversation: {
      responseStream: { on: mockResponseStreamOn },
      get: { invoke: vi.fn(async () => state.conversation) },
      update: { invoke: vi.fn().mockResolvedValue(undefined) },
    },
  },
}));

vi.mock('@renderer/hooks/mcp', () => ({
  useMcpServers: () => ({ mcpServers: state.mcpServers, saveMcpServers: vi.fn() }),
  useMcpAgentStatus: () => ({ setAgentInstallStatus: vi.fn(), checkSingleServerInstallStatus: vi.fn() }),
  useMcpOperations: () => ({ syncMcpToAgents: vi.fn(), removeMcpFromAgents: vi.fn() }),
  useMcpServerCRUD: () => ({ handleToggleMcpServer: vi.fn() }),
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');
  // eslint-disable-next-line unicorn/consistent-function-scoping -- mock must live in the factory (vi.mock hoisting)
  const Dropdown = ({
    children,
    droplist,
    popupVisible,
    onVisibleChange,
  }: {
    children: React.ReactNode;
    droplist: React.ReactNode;
    popupVisible?: boolean;
    onVisibleChange?: (v: boolean) => void;
  }) => (
    <div>
      <div data-testid='dd-trigger' onClick={() => onVisibleChange?.(!popupVisible)}>
        {children}
      </div>
      {popupVisible ? <div data-testid='dd-pop'>{droplist}</div> : null}
    </div>
  );
  return { ...actual, Dropdown };
});

import ComposerAddMenu from '@renderer/pages/conversation/components/composerMenu/ComposerAddMenu';

const builtins = [
  { name: 'cron', description: 'Schedule recurring tasks' },
  { name: 'officecli', description: 'Office documents from the CLI' },
];

describe('ComposerAddMenu', () => {
  const baseProps = {
    mode: 'staged' as const,
    uploadItems: [{ key: 'file', label: 'Upload Files', onClick: vi.fn() }],
    builtinAutoSkills: builtins,
    disabledBuiltinSkills: ['officecli'],
    onToggleBuiltinSkill: vi.fn(),
  };

  it('opens to the Skills pane and counts enabled builtins (2 - 1 disabled = 1 on)', async () => {
    render(<ComposerAddMenu {...baseProps} />);
    fireEvent.click(screen.getByTestId('dd-trigger'));
    // Skills flyout is the default pane: builtin rows render their names directly.
    await waitFor(() => expect(screen.getByText('cron')).toBeInTheDocument());
    expect(screen.getByText('officecli')).toBeInTheDocument();
    // Count pill: 2 builtins minus 1 disabled.
    expect(screen.getByText('1 on')).toBeInTheDocument();
  });

  it('switches to the Connectors pane (skills rows unmount)', async () => {
    render(<ComposerAddMenu {...baseProps} />);
    fireEvent.click(screen.getByTestId('dd-trigger'));
    await waitFor(() => expect(screen.getByText('cron')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Connectors'));
    // SkillsFlyout unmounted -> builtin rows gone; ConnectorsFlyout empty-state shows.
    await waitFor(() => expect(screen.queryByText('cron')).not.toBeInTheDocument());
    expect(screen.getByText('No connectors installed yet.')).toBeInTheDocument();
  });

  it('listens for active-session MCP evidence before the lazy menu opens', () => {
    mockResponseStreamOn.mockClear();
    render(<ComposerAddMenu {...baseProps} mode='live' conversationId='chat-1' />);

    expect(screen.queryByTestId('dd-pop')).not.toBeInTheDocument();
    expect(mockResponseStreamOn).toHaveBeenCalledOnce();
  });
});

/**
 * #998 — the seam between `resolveModelToolCap` and the flyout copy.
 *
 * `ConnectorsFlyout` only ever says a named model "caps at N" when
 * `modelCapDocumented` is true, and `resolveModelToolCap` only reports
 * `documented: true` for a published vendor cap. Both ends are guarded on their
 * own; the WIRING between them was not, so hard-coding `capDocumented: true`
 * here re-introduced the exact false claim commit 2 of this PR removed
 * ("claude-sonnet-4-5 caps at 128" — Anthropic publishes no such tool-array
 * cap) with the whole suite still green. Both directions are pinned: an
 * undocumented model must get the advisory copy, and a documented one must keep
 * the real cap copy, so neither hard-coding nor unwiring the flag survives.
 */
/** A connected connector publishing `toolCount` tools. */
const connector = (toolCount: number) => ({
  id: 'srv-1',
  name: 'workspace',
  enabled: true,
  status: 'connected',
  transport: { type: 'stdio', command: 'x', args: [] },
  tools: Array.from({ length: toolCount }, (_, i) => ({ name: `t${i}` })),
  originalJson: '{}',
  createdAt: 1,
  updatedAt: 1,
});

describe('ComposerAddMenu model tool-cap wiring (#998)', () => {
  const props = {
    mode: 'live' as const,
    conversationId: 'chat-1',
    uploadItems: [{ key: 'file', label: 'Upload Files', onClick: vi.fn() }],
    builtinAutoSkills: builtins,
    disabledBuiltinSkills: ['officecli'],
    onToggleBuiltinSkill: vi.fn(),
  };

  afterEach(() => {
    state.conversation = undefined;
    state.mcpServers = [];
  });

  const openConnectorsPane = async (model: { id: string; useModel: string }) => {
    state.conversation = { id: 'chat-1', model, extra: {} };
    state.mcpServers = [connector(130)];

    render(<ComposerAddMenu {...props} />);
    fireEvent.click(screen.getByTestId('dd-trigger'));
    await waitFor(() => expect(screen.getByText('cron')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Connectors'));
    return waitFor(() => screen.getByRole('status'));
  };

  it('never tells an Anthropic chat the model caps at the advisory ceiling', async () => {
    const note = await openConnectorsPane({ id: 'anthropic', useModel: 'claude-sonnet-4-5' });

    // The nudge IS live on this path - the assertions below are about its copy,
    // not about a banner that never rendered.
    expect(note).toHaveTextContent('130 tools enabled');
    expect(note).toHaveTextContent('degrade tool selection on most models');
    expect(note.textContent).not.toContain('caps at');
    expect(note.textContent).not.toContain('claude-sonnet-4-5');
  });

  it('still names the published cap for a model that really has one', async () => {
    const note = await openConnectorsPane({ id: 'openai', useModel: 'gpt-5' });

    expect(note).toHaveTextContent('gpt-5 caps at 128');
  });
});
