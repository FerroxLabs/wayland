/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #997 - the Wayland Core agent card must not offer a dead Settings click.
 *
 * `/settings/agents` is NOT desktop-gated, so on a WebUI the card's Settings
 * button navigates to `/settings/wcore`, which redirects into the now
 * desktop-only Core page and silently dumps the user on General settings.
 * Disable the button on that runtime instead.
 *
 * The Button mock below honours `disabled` on purpose: the shared
 * LocalAgents.dom.test.tsx mock drops it, which would make this assertion pass
 * against a broken component.
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

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LocalAgents from '../../src/renderer/pages/settings/AgentSettings/LocalAgents';

/**
 * The Settings button on the wcore card specifically. Selecting by testid alone
 * picks up the page's other buttons (Add agent, hub) and would assert nothing;
 * `t` is identity in this file, so the label is the i18n key.
 */
const settingsButton = (): HTMLButtonElement => {
  const label = screen.getByText('settings.agentManagement.settings');
  const button = label.closest('button');
  if (!button) throw new Error('settings button not found on the wcore card');
  return button as HTMLButtonElement;
};

describe('#997 Wayland Core agent card Settings action', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockIsElectronDesktop.mockReturnValue(true);
    mockDetectedAgents.current = [{ backend: 'wcore', name: 'Wayland Core' }];
  });

  it('stays clickable on the Electron desktop runtime', () => {
    render(<LocalAgents />);

    const button = settingsButton();
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/settings/wcore');
  });

  it('is disabled on a WebUI/remote client instead of bouncing the user', () => {
    mockIsElectronDesktop.mockReturnValue(false);

    render(<LocalAgents />);

    const button = settingsButton();
    expect(button.disabled).toBe(true);

    fireEvent.click(button);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('leaves the card itself rendered - only the dead action is removed', () => {
    mockIsElectronDesktop.mockReturnValue(false);
    render(<LocalAgents />);
    expect(screen.getByText('Wayland Core')).toBeInTheDocument();

    cleanup();
    mockIsElectronDesktop.mockReturnValue(true);
    render(<LocalAgents />);
    expect(screen.getByText('Wayland Core')).toBeInTheDocument();
  });
});
