/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.hoisted(() => vi.fn());

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
  },
}));

vi.mock('@renderer/hooks/mcp', () => ({
  useMcpServers: () => ({ mcpServers: [], saveMcpServers: vi.fn() }),
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
});
