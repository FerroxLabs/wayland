// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  probe: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => (typeof fallback === 'string' ? fallback : key),
  }),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  mcpService: { testMcpConnection: { invoke: h.probe } },
}));

vi.mock('@icon-park/react', () => ({
  Check: () => null,
  CloseOne: () => null,
  Key: () => null,
  Components: () => null,
}));

vi.mock('@arco-design/web-react', () => {
  type InputProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
  };
  type ButtonProps = React.PropsWithChildren<{
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
    loading?: boolean;
  }>;

  // Kept inside the hoisted Vitest factory so the mock is self-contained.
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const Input = ({ value, onChange, placeholder, disabled }: InputProps) => (
    <input
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
  Input.Password = Input;
  return {
    Input,
    Button: ({ children, onClick, disabled, loading }: ButtonProps) => (
      <button type='button' onClick={onClick} disabled={disabled} data-loading={loading ? 'true' : 'false'}>
        {children}
      </button>
    ),
    Link: ({ children, onClick }: Pick<ButtonProps, 'children' | 'onClick'>) => (
      <button type='button' onClick={onClick}>
        {children}
      </button>
    ),
  };
});

vi.mock('@/renderer/components/base/WaylandModal', () => ({
  default: ({ visible, children, footer }: React.PropsWithChildren<{ visible: boolean; footer?: React.ReactNode }>) =>
    visible ? (
      <div data-testid='url-modal'>
        {children}
        <div>{footer}</div>
      </div>
    ) : null,
}));

import UrlAddModal from '@/renderer/pages/settings/components/UrlAddModal';

describe('UrlAddModal publication truth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.probe.mockResolvedValue({
      success: true,
      data: { success: true, tools: [{ name: 'search' }] },
    });
  });

  it('keeps the modal open and shows the exact error when agent publication fails', async () => {
    let rejectPublication!: (error: Error) => void;
    const publication = new Promise<void>((_resolve, reject) => {
      rejectPublication = reject;
    });
    const onSubmit = vi.fn().mockReturnValue(publication);
    const onCancel = vi.fn();

    render(<UrlAddModal visible onCancel={onCancel} onSubmit={onSubmit} onUseJson={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('https://mcp.example.com/mcp'), {
      target: { value: 'https://mcp.tavily.com/mcp/' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(await screen.findByText(/Server reachable/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add server' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Tavily', enabled: true }));
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Adding to Wayland…' })).toHaveAttribute('data-loading', 'true');

    rejectPublication(new Error('Tavily was saved but no active agent accepted it'));
    await waitFor(() =>
      expect(screen.getByText('Tavily was saved but no active agent accepted it')).toBeInTheDocument()
    );
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByTestId('url-modal')).toBeInTheDocument();
  });
});
