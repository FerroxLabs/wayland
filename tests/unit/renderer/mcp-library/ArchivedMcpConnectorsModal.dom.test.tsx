/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  restore: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  mcpService: {
    listArchivedServers: { invoke: mocks.list },
    restoreArchivedServer: { invoke: mocks.restore },
  },
}));

vi.mock('@/renderer/utils/platform', () => ({ isElectronDesktop: () => true }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

vi.mock('@arco-design/web-react', () => ({
  Modal: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? <div role='dialog'>{children}</div> : null,
  Button: ({ children, onClick, loading }: { children: React.ReactNode; onClick?: () => void; loading?: boolean }) => (
    <button onClick={onClick} disabled={loading}>
      {children}
    </button>
  ),
  Empty: ({ description }: { description: React.ReactNode }) => <div>{description}</div>,
  Spin: () => <div>loading</div>,
  Message: { success: mocks.success, error: mocks.error },
}));

import ArchivedMcpConnectorsModal from '@renderer/pages/settings/McpLibrary/components/ArchivedMcpConnectorsModal';

describe('ArchivedMcpConnectorsModal', () => {
  beforeEach(() => {
    mocks.list.mockReset().mockResolvedValue({
      success: true,
      data: [
        {
          archiveId: '9fef2d90-6384-4a84-834c-efb1a437696f',
          archivedAt: 1000,
          serverId: 'mcp_customer',
          name: 'Customer tools',
          transportType: 'stdio',
          source: 'custom',
        },
      ],
    });
    mocks.restore.mockReset().mockResolvedValue({ success: true, data: {} });
    mocks.success.mockReset();
    mocks.error.mockReset();
  });

  afterEach(cleanup);

  it('lists secret-free archive summaries and restores through the main-process boundary', async () => {
    const onRestored = vi.fn().mockResolvedValue(undefined);
    render(<ArchivedMcpConnectorsModal visible onClose={vi.fn()} onRestored={onRestored} />);

    expect(await screen.findByText('Customer tools')).toBeTruthy();
    expect(document.body.textContent).not.toContain('CUSTOMER_API_KEY');
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    await waitFor(() => {
      expect(mocks.restore).toHaveBeenCalledWith({ archiveId: '9fef2d90-6384-4a84-834c-efb1a437696f' });
      expect(onRestored).toHaveBeenCalledTimes(1);
      expect(mocks.success).toHaveBeenCalledTimes(1);
    });
  });

  it('does not refresh active connector state when restore fails', async () => {
    mocks.restore.mockResolvedValueOnce({ success: false, msg: 'archive digest mismatch' });
    const onRestored = vi.fn().mockResolvedValue(undefined);
    render(<ArchivedMcpConnectorsModal visible onClose={vi.fn()} onRestored={onRestored} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Restore' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('archive digest mismatch'));
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('surfaces archive inventory corruption instead of presenting an empty archive', async () => {
    mocks.list.mockResolvedValueOnce({ success: false, msg: 'MCP connector archive digest mismatch' });
    render(<ArchivedMcpConnectorsModal visible onClose={vi.fn()} onRestored={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('MCP connector archive digest mismatch');
    expect(screen.queryByText('No archived connectors.')).toBeNull();
  });
});
