/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Fuigo cutover (Phase 2): on the Local Agents list the bundled Fuigo engine
 * is the first detected card, ahead of Gemini CLI, whatever order the detector
 * returned them in.
 */

const mockNavigate = vi.hoisted(() => vi.fn());
const mockIsElectronDesktop = vi.hoisted(() => vi.fn(() => true));
const mockDetectedAgents = vi.hoisted(() => ({ current: [] as Array<{ backend: string; name: string }> }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en-US' } }),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => mockIsElectronDesktop(),
  resolveExtensionAssetUrl: vi.fn(() => undefined),
}));

vi.mock('../../src/common', () => ({
  ipcBridge: { acpConversation: { getAvailableAgents: { invoke: vi.fn() } } },
}));

vi.mock('swr', () => ({
  default: vi.fn((key: string) =>
    key === 'acp.agents.available.settings'
      ? { data: mockDetectedAgents.current, mutate: vi.fn(), isLoading: false }
      : { data: undefined, mutate: vi.fn(), isLoading: false }
  ),
  mutate: vi.fn(),
}));

vi.mock('@arco-design/web-react', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  Typography: { Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span> },
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Alert: () => <div />,
  Switch: () => <button role='switch'>switch</button>,
  // Honours `disabled` - that is the whole point of this file.
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button data-testid='agent-settings-button' onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('@/renderer/components/base/WaylandModal', () => ({ default: () => null }));
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: vi.fn().mockResolvedValue([]), set: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('@/renderer/utils/model/agentLogo', () => ({
  getAgentLogo: vi.fn(() => null),
  resolveAgentLogo: vi.fn(() => null),
}));
vi.mock('@/renderer/hooks/agent/useHubAgents', () => ({
  useHubAgents: () => ({ agents: [], loading: false, install: vi.fn(), retryInstall: vi.fn(), update: vi.fn() }),
}));
vi.mock('../../src/renderer/pages/settings/AgentSettings/AgentHubModal', () => ({ AgentHubModal: () => null }));
vi.mock('../../src/renderer/pages/settings/AgentSettings/InlineAgentEditor', () => ({ default: () => null }));
vi.mock('@/renderer/hooks/context/ThemeContext', () => ({ useThemeContext: () => ({ theme: 'light' }) }));

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LocalAgents from '../../src/renderer/pages/settings/AgentSettings/LocalAgents';

/** Detected-card names in DOM order (Text is mocked to a bare span, so match on text). */
const cardNames = (names: string[]): string[] =>
  names
    .map((name) => screen.getByText(name))
    .toSorted((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map((el) => el.textContent ?? '');

describe('LocalAgents - Fuigo is listed first among detected engines', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockIsElectronDesktop.mockReturnValue(true);
  });

  it('renders the Fuigo card before Gemini even when detected last', () => {
    mockDetectedAgents.current = [
      { backend: 'gemini', name: 'Gemini CLI' },
      { backend: 'claude', name: 'Claude Code' },
      { backend: 'fuigo', name: 'Fuigo' },
    ];
    render(<LocalAgents />);

    expect(cardNames(['Claude Code', 'Gemini CLI', 'Fuigo'])).toEqual(['Fuigo', 'Gemini CLI', 'Claude Code']);
  });

  it('does not list Fuigo twice (once pinned, once as an ordinary detected agent)', () => {
    mockDetectedAgents.current = [
      { backend: 'fuigo', name: 'Fuigo' },
      { backend: 'claude', name: 'Claude Code' },
    ];
    render(<LocalAgents />);

    expect(screen.getAllByText('Fuigo')).toHaveLength(1);
  });

  it('renders no live Settings link on the Fuigo card yet (Engine pane is Phase 4)', () => {
    mockDetectedAgents.current = [{ backend: 'fuigo', name: 'Fuigo' }];
    render(<LocalAgents />);

    const buttons = screen
      .getAllByText('settings.agentManagement.settings')
      .map((label) => label.closest('button') as HTMLButtonElement);
    expect(buttons).toHaveLength(1);
    expect(buttons[0].disabled).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
