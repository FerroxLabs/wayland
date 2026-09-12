// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { statusInvoke } = vi.hoisted(() => ({
  statusInvoke: vi.fn<() => Promise<{ success: boolean; data?: Record<string, unknown> }>>(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/common', () => ({
  ipcBridge: { acpConversation: { getFuigoEngineStatus: { invoke: statusInvoke } } },
}));
vi.mock('@/renderer/utils/model/agentLogo', () => ({ resolveAgentLogo: () => null }));
vi.mock('swr', () => ({
  default: (_key: string, fetcher: () => Promise<unknown>) => {
    const [data, setData] = React.useState<unknown>(undefined);
    React.useEffect(() => {
      void fetcher().then(setData);
    }, []);
    return { data };
  },
}));

import FuigoEngineCard from '@renderer/pages/settings/AgentSettings/FuigoEngineCard';

beforeEach(() => statusInvoke.mockReset());
afterEach(cleanup);

describe('FuigoEngineCard', () => {
  it('shows the receipt version, the verified badge and the engine home', async () => {
    statusInvoke.mockResolvedValue({
      success: true,
      data: { state: 'verified', version: '1.0.14', path: '/app/fuigo', homeDir: '/Users/x/Wayland/fuigo' },
    });
    render(<FuigoEngineCard name='Fuigo' />);
    expect(await screen.findByText('settings.agentManagement.fuigoVerified')).toBeTruthy();
    expect(screen.getByText(/v1\.0\.14/)).toBeTruthy();
    expect(screen.getByText(/\/Users\/x\/Wayland\/fuigo/)).toBeTruthy();
  });

  it('says the staged engine is unverified when the receipt does not vouch for it', async () => {
    statusInvoke.mockResolvedValue({
      success: true,
      data: { state: 'unverified', path: '/app/fuigo', homeDir: '/h' },
    });
    render(<FuigoEngineCard name='Fuigo' />);
    expect(await screen.findByText('settings.agentManagement.fuigoUnverified')).toBeTruthy();
    expect(screen.queryByText('settings.agentManagement.fuigoVerified')).toBeNull();
  });

  it('says the engine is missing when no bundle is staged', async () => {
    statusInvoke.mockResolvedValue({ success: true, data: { state: 'missing', homeDir: '/h' } });
    render(<FuigoEngineCard name='Fuigo' />);
    expect(await screen.findByText('settings.agentManagement.fuigoMissing')).toBeTruthy();
  });
});
