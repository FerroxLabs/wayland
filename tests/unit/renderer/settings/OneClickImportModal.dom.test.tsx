// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  getAgents: vi.fn(),
  getConfigs: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  acpConversation: { getAvailableAgents: { invoke: h.getAgents } },
  mcpService: { getAgentMcpConfigs: { invoke: h.getConfigs } },
}));

vi.mock('lucide-react', () => ({ Check: () => null }));

vi.mock('@arco-design/web-react', () => {
  type SelectComponent = React.FC<React.PropsWithChildren<{ value?: string }>> & {
    Option: React.FC<React.PropsWithChildren>;
  };
  type ButtonProps = React.PropsWithChildren<{
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
    loading?: boolean;
  }>;

  // Kept inside the hoisted Vitest factory so the mock is self-contained.
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const Select: SelectComponent = ({ value, children }) => (
    <div data-testid='agent-select' data-value={value}>
      {children}
    </div>
  );
  Select.Option = ({ children }) => <span>{children}</span>;
  return {
    Select,
    Spin: () => <span>loading</span>,
    Button: ({ children, onClick, disabled, loading }: ButtonProps) => (
      <button type='button' onClick={onClick} disabled={disabled} data-loading={loading ? 'true' : 'false'}>
        {children}
      </button>
    ),
  };
});

vi.mock('@/renderer/components/base/WaylandSteps', () => {
  type StepsComponent = React.FC<React.PropsWithChildren> & {
    Step: React.FC<{ title: React.ReactNode }>;
  };
  // Kept inside the hoisted Vitest factory so the mock is self-contained.
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const Steps: StepsComponent = ({ children }) => <div>{children}</div>;
  Steps.Step = ({ title }) => <span>{title}</span>;
  return { default: Steps };
});

vi.mock('@/renderer/components/base/WaylandModal', () => ({
  default: ({
    visible,
    children,
    footer,
  }: React.PropsWithChildren<{
    visible: boolean;
    footer?: React.ReactNode | { render?: () => React.ReactNode };
  }>) =>
    visible ? (
      <div data-testid='one-click-modal'>
        {children}
        <div>{typeof footer === 'object' && footer !== null && 'render' in footer ? footer.render?.() : footer}</div>
      </div>
    ) : null,
}));

import OneClickImportModal from '@/renderer/pages/settings/components/OneClickImportModal';

describe('OneClickImportModal transaction truth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.getAgents.mockResolvedValue({
      success: true,
      data: [{ backend: 'claude', name: 'Claude' }],
    });
    h.getConfigs.mockResolvedValue({
      success: true,
      data: [
        {
          source: 'claude',
          servers: [
            {
              id: 'tavily',
              name: 'Tavily',
              enabled: true,
              transport: { type: 'http', url: 'https://mcp.tavily.com/mcp/' },
              createdAt: 1,
              updatedAt: 1,
            },
          ],
        },
      ],
    });
  });

  it('selects the only installed agent and does not show success when publication rejects', async () => {
    const onBatchImport = vi.fn().mockRejectedValue(new Error('Tavily publication rejected'));
    render(<OneClickImportModal visible onCancel={vi.fn()} onBatchImport={onBatchImport} />);

    await waitFor(() => expect(screen.getByTestId('agent-select')).toHaveAttribute('data-value', 'claude'));
    const next = screen.getByRole('button', { name: 'settings.mcpNextStep' });
    expect(next).toBeEnabled();
    fireEvent.click(next);

    expect(await screen.findByText('Tavily')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'settings.mcpImportButton' }));

    expect(await screen.findByText('Tavily publication rejected')).toBeInTheDocument();
    expect(onBatchImport).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'settings.mcpImportButton' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'settings.mcpConfirmButton' })).not.toBeInTheDocument();
  });
});
