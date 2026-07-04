/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #663 P3: a denied permission must NOT render as a green success banner.
 * The outcome banner branches on the chosen option's kind (reject_* => denied).
 */
// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const confirmMessageMock = vi.fn();
vi.mock('@/common/adapter/ipcBridge', () => ({
  conversation: { confirmMessage: { invoke: (...a: unknown[]) => confirmMessageMock(...a) } },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, dflt?: string) => dflt ?? key }),
}));

import MessageAcpPermission from '@/renderer/pages/conversation/Messages/acp/MessageAcpPermission';

const makeMessage = () =>
  ({
    id: 'msg-1',
    type: 'acp_permission',
    conversation_id: 'conv-1',
    content: {
      toolCall: { toolCallId: 'call-1', title: 'rm -rf /tmp/x', kind: 'execute' },
      options: [
        { optionId: 'allow_once', name: 'Allow once', kind: 'allow_once' },
        { optionId: 'reject_once', name: 'Deny', kind: 'reject_once' },
      ],
    },
  }) as never;

async function respondWith(optionId: string) {
  // Arco Radio renders a hidden input[value=optionId]; click it, then Confirm.
  const radio = document.querySelector(`input[value="${optionId}"]`) as HTMLInputElement;
  expect(radio).toBeTruthy();
  await act(async () => {
    fireEvent.click(radio);
  });
  const confirmBtn = screen.getByText('messages.confirm').closest('button') as HTMLButtonElement;
  await act(async () => {
    fireEvent.click(confirmBtn);
  });
}

describe('MessageAcpPermission — allow vs deny banner (#663 P3)', () => {
  beforeEach(() => {
    confirmMessageMock.mockReset();
    confirmMessageMock.mockResolvedValue({ success: true });
  });
  afterEach(() => cleanup());

  it('renders a DENIED (not success) banner when a reject option is chosen', async () => {
    render(<MessageAcpPermission message={makeMessage()} />);
    await respondWith('reject_once');
    await waitFor(() => expect(screen.getByTestId('acp-permission-denied')).toBeTruthy());
    expect(screen.queryByTestId('acp-permission-allowed')).toBeNull();
    // Confirm the decision was actually sent for the reject option.
    expect(confirmMessageMock).toHaveBeenCalledWith(expect.objectContaining({ confirmKey: 'reject_once' }));
  });

  it('renders an ALLOWED (success) banner when an allow option is chosen', async () => {
    render(<MessageAcpPermission message={makeMessage()} />);
    await respondWith('allow_once');
    await waitFor(() => expect(screen.getByTestId('acp-permission-allowed')).toBeTruthy());
    expect(screen.queryByTestId('acp-permission-denied')).toBeNull();
  });
});
