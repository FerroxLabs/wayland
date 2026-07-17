import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  warning: vi.fn(),
  testPlugin: vi.fn(async () => ({ success: true, data: { success: true } })),
  enablePlugin: vi.fn(async () => ({ success: true })),
  getPluginStatus: vi.fn(async () => ({ success: true, data: [] })),
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: mocks.warning,
      info: vi.fn(),
    },
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  channel: {
    testPlugin: { invoke: mocks.testPlugin },
    enablePlugin: { invoke: mocks.enablePlugin },
    getPluginStatus: { invoke: mocks.getPluginStatus },
    rotateWebhookToken: { invoke: vi.fn(async () => ({ success: true, data: { token: 'token' } })) },
  },
}));

vi.mock('@/renderer/components/settings/shared/forms/ChannelAgentModelSelector', () => ({
  default: () => <div data-testid='model-selector' />,
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div>{value}</div>,
}));

import WhatsAppConfigForm from '@renderer/components/settings/SettingsModal/contents/channels/messaging/WhatsAppConfigForm';

const modelSelection = {
  currentModel: undefined,
  isLoading: false,
  onSelectModel: vi.fn(),
};

describe('WhatsAppConfigForm Meta credential validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuses to test or enable until both inbound webhook secrets are present', async () => {
    render(<WhatsAppConfigForm pluginStatus={null} modelSelection={modelSelection} />);

    fireEvent.click(screen.getByText('Meta Business'));
    fireEvent.change(screen.getByPlaceholderText('EAAG...your-token...'), { target: { value: 'access-token' } });
    fireEvent.change(screen.getByPlaceholderText('123456789012345'), { target: { value: '123456789' } });
    fireEvent.click(screen.getByRole('button', { name: 'Test & Enable' }));

    await waitFor(() => expect(mocks.warning).toHaveBeenLastCalledWith('Verify Token is required for Meta backend'));
    expect(mocks.testPlugin).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('a long random string'), { target: { value: 'verify-token' } });
    fireEvent.click(screen.getByRole('button', { name: 'Test & Enable' }));

    await waitFor(() => expect(mocks.warning).toHaveBeenLastCalledWith('App Secret is required for Meta backend'));
    expect(mocks.testPlugin).not.toHaveBeenCalled();
    expect(mocks.enablePlugin).not.toHaveBeenCalled();
  });
});
