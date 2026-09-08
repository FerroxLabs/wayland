/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const bridge = vi.hoisted(() => ({
  get: vi.fn(),
  abandon: vi.fn(),
}));
const modalConfirm = vi.hoisted(() => vi.fn());
const sendBox = vi.hoisted(() => ({ props: [] as Array<{ recoveryBlocked?: boolean; recoveryChecking?: boolean }> }));

const translate = vi.hoisted(() => (key: string) => key);
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: translate }),
}));
vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    disabled,
    loading,
    onClick,
  }: React.PropsWithChildren<{ disabled?: boolean; loading?: boolean; onClick?: () => void }>) => (
    <button type='button' disabled={disabled || loading} onClick={onClick}>
      {children}
    </button>
  ),
  Spin: () => <span data-testid='spin' />,
  Modal: { confirm: modalConfirm },
}));
vi.mock('@/common', () => ({
  ipcBridge: {
    wcoreRecovery: {
      get: { invoke: bridge.get },
      abandon: { invoke: bridge.abandon },
    },
  },
}));
vi.mock('@renderer/pages/conversation/Messages/MessageList', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/conversation/Messages/hooks', () => ({
  MessageListProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useMessageList: () => [],
  useMessageLstCache: () => {},
}));
vi.mock('@renderer/components/layout/FlexFullContainer', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/components/activation/ActivationCard', () => ({ default: () => null }));
vi.mock('@renderer/components/activation/AcpAuthFailureCard', () => ({ default: () => null }));
vi.mock('@renderer/components/activation/CuaPermissionCard', () => ({ default: () => null }));
vi.mock('@renderer/components/media/LocalImageView', () => ({
  default: Object.assign(() => null, {
    Provider: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useUpdateLocalImage: () => () => {},
  }),
}));
vi.mock('@renderer/hooks/useProviderReadiness', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@renderer/hooks/useProviderReadiness')>();
  return { ...actual, useProviderReadiness: () => ({ ready: true, loading: false }) };
});
vi.mock('@renderer/hooks/useFluxConnected', () => ({ useFluxConnected: () => false }));
vi.mock('@renderer/hooks/context/ConversationContext', () => ({
  ConversationProvider: ({
    children,
    value,
  }: React.PropsWithChildren<{ value: { executionInterrupted?: boolean } }>) => (
    <div data-testid='recovery-display-context' data-interrupted={String(value.executionInterrupted)}>
      {children}
    </div>
  ),
}));
vi.mock('@renderer/hooks/useModelRegistry', () => ({
  ModelRegistryProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/pages/conversation/platforms/acp/acpAuthFailure', () => ({ getAcpAuthRemedy: () => null }));
vi.mock('@renderer/pages/conversation/platforms/acp/acpFluxFailover', () => ({ routeThroughFluxAndReplay: vi.fn() }));
vi.mock('@renderer/pages/conversation/components/ConversationChatConfirm', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/pages/conversation/components/ExecutionSpine', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/pages/conversation/platforms/wcore/WCoreSendBox', () => ({
  default: (props: { recoveryBlocked?: boolean }) => {
    sendBox.props.push(props);
    return <div data-testid='send-box' data-recovery-blocked={String(props.recoveryBlocked)} />;
  },
}));
vi.mock('@renderer/utils/emitter', () => ({ emitter: { emit: vi.fn() }, useAddEventListener: () => {} }));
vi.mock('react-router-dom', () => ({ useNavigate: () => () => {} }));

import WCoreChat from '@/renderer/pages/conversation/platforms/wcore/WCoreChat';

const interrupted = {
  success: true,
  data: {
    state: 'interrupted' as const,
    lifecycle: 'awaiting_approval' as const,
    reason: 'approval_expired',
    canAbandon: true,
  },
};
const healthy = {
  success: true,
  data: { state: 'healthy' as const, lifecycle: 'ready' as const, canAbandon: false },
};

const renderChat = (conversationId = 'conversation-1') =>
  render(<WCoreChat conversation_id={conversationId} workspace='/ws' modelSelection={{} as never} />);

describe('WCoreChat interrupted-turn recovery', () => {
  beforeEach(() => {
    bridge.get.mockReset().mockResolvedValue(healthy);
    bridge.abandon.mockReset().mockResolvedValue(healthy);
    modalConfirm.mockReset();
    sendBox.props.length = 0;
  });

  it('uses a neutral startup status while preserving the pending send gate', async () => {
    const pending = deferred<typeof healthy>();
    bridge.get.mockReturnValue(pending.promise);
    renderChat();
    expect(screen.getByRole('status')).toHaveTextContent('conversation.turnRecovery.starting');
    expect(screen.queryByTestId('wcore-turn-recovery-card')).toBeNull();
    expect(sendBox.props.at(-1)).toMatchObject({ recoveryBlocked: true, recoveryChecking: true });
    await act(async () => pending.resolve(healthy));
    expect(screen.queryByRole('status')).toBeNull();
    expect(sendBox.props.at(-1)?.recoveryBlocked).toBe(false);
    expect(screen.getByTestId('recovery-display-context')).toHaveAttribute('data-interrupted', 'false');
  });

  it('requires explicit confirmation, then unlocks only after a verified healthy result', async () => {
    bridge.get.mockResolvedValue(interrupted);
    renderChat();

    expect(await screen.findByTestId('wcore-turn-recovery-card')).toHaveTextContent(
      'conversation.turnRecovery.interrupted'
    );
    expect(screen.getByTestId('send-box')).toHaveAttribute('data-recovery-blocked', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'conversation.turnRecovery.endAction' }));
    expect(modalConfirm).toHaveBeenCalledOnce();
    expect(bridge.abandon).not.toHaveBeenCalled();

    const confirmation = modalConfirm.mock.calls[0]?.[0] as { onOk: () => Promise<void> };
    await act(async () => {
      await confirmation.onOk();
    });

    expect(bridge.abandon).toHaveBeenCalledWith({ conversation_id: 'conversation-1' });
    await waitFor(() => expect(screen.queryByTestId('wcore-turn-recovery-card')).toBeNull());
    expect(screen.getByTestId('send-box')).toHaveAttribute('data-recovery-blocked', 'false');
  });

  it('keeps the composer blocked and surfaces a failed recovery action', async () => {
    bridge.get.mockResolvedValue(interrupted);
    bridge.abandon.mockResolvedValue({ success: false, msg: 'Core refused recovery' });
    renderChat();

    fireEvent.click(await screen.findByRole('button', { name: 'conversation.turnRecovery.endAction' }));
    const confirmation = modalConfirm.mock.calls[0]?.[0] as { onOk: () => Promise<void> };
    await act(async () => {
      await confirmation.onOk();
    });

    expect(await screen.findByText('Core refused recovery')).toBeInTheDocument();
    expect(screen.getByTestId('send-box')).toHaveAttribute('data-recovery-blocked', 'true');
  });

  it('blocks while checking and ignores a late result from the previous conversation', async () => {
    const first = deferred<typeof interrupted>();
    bridge.get.mockImplementation(({ conversation_id }: { conversation_id: string }) =>
      conversation_id === 'conversation-1' ? first.promise : Promise.resolve(healthy)
    );
    const view = renderChat('conversation-1');

    expect(screen.getByTestId('send-box')).toHaveAttribute('data-recovery-blocked', 'true');
    view.rerender(<WCoreChat conversation_id='conversation-2' workspace='/ws' modelSelection={{} as never} />);
    await waitFor(() => expect(screen.getByTestId('send-box')).toHaveAttribute('data-recovery-blocked', 'false'));

    await act(async () => first.resolve(interrupted));
    expect(screen.queryByText('conversation.turnRecovery.interrupted')).toBeNull();
    expect(screen.getByTestId('send-box')).toHaveAttribute('data-recovery-blocked', 'false');
  });

  it('offers only reinspection when Core cannot establish safe abandonment authority', async () => {
    bridge.get.mockResolvedValue({
      success: true,
      data: { state: 'unavailable', reason: 'provider_outcome_unknown', canAbandon: false },
    });
    renderChat();

    expect(await screen.findByText('conversation.turnRecovery.unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'conversation.turnRecovery.endAction' })).toBeNull();
    expect(screen.getByRole('button', { name: 'conversation.turnRecovery.checkAgain' })).toBeInTheDocument();
    expect(screen.getByTestId('recovery-display-context')).toHaveAttribute('data-interrupted', 'true');
    expect(bridge.abandon).not.toHaveBeenCalled();
    expect(screen.getByTestId('send-box')).toHaveAttribute('data-recovery-blocked', 'true');
  });
});
