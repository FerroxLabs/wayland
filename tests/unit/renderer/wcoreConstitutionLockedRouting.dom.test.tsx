/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Live defect: a Constitution revision authority sealed by a different
 * installation of the app cannot be decrypted here, so every agent turn died
 * with a bare "Error while decrypting the ciphertext provided to
 * safeStorage.decryptString" printed into the chat.
 *
 * A full Constitution recovery UI already existed at /settings/constitution and
 * was completely unreachable from that error: nothing in the renderer knew the
 * failure had happened, so the only exit was for the user to guess.
 *
 * This file pins the renderer half of the route WCoreSendBox opens: the locked
 * event puts the recovery remedy card in front of the user, and its action
 * lands on the recovery flow that already exists. It deliberately does NOT
 * assert anything about deleting or resetting the encrypted authority - the
 * card offers recovery and never destroys the user's data.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigate = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

// Heavy, irrelevant chat deps stubbed to no-ops. The remedy card itself and the
// emitter stay REAL - they are the subject.
vi.mock('@renderer/pages/conversation/Messages/MessageList', () => ({
  default: () => <div data-testid='message-list' />,
}));
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
  // Partial: the readiness VERDICT is doubled, but `activationPromptFor`
  // (the pure gate that reads it) stays real - a stubbed gate would decide
  // the activation card's presence for the component under test.
  const actual = await importOriginal<typeof import('@renderer/hooks/useProviderReadiness')>();
  return { ...actual, useProviderReadiness: () => ({ ready: true, loading: false }) };
});
vi.mock('@renderer/hooks/useFluxConnected', () => ({ useFluxConnected: () => false }));
vi.mock('@renderer/hooks/context/ConversationContext', () => ({
  ConversationProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
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
  default: () => <div data-testid='send-box' />,
}));
vi.mock('@/common', () => ({ ipcBridge: {} }));

import WCoreChat from '@/renderer/pages/conversation/platforms/wcore/WCoreChat';
import { emitter } from '@/renderer/utils/emitter';

const CONV = 'conv-locked';

const renderChat = () => render(<WCoreChat conversation_id={CONV} workspace='/ws' modelSelection={{} as never} />);

const emitLocked = (conversation_id = CONV, rawError = 'Agent failed to start: could not be unlocked') =>
  act(() => {
    emitter.emit('wcore.constitution.locked.card', { conversation_id, rawError });
  });

/**
 * The card's primary action, found by its stable test id rather than by label
 * so the assertion does not depend on the i18n key stubbing above.
 */
const recoveryAction = () => screen.queryByTestId('wcore-constitution-locked-recover')?.querySelector('button') ?? null;

describe('WCoreChat routes a locked Constitution to the existing recovery flow', () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it('shows no recovery card until the engine reports a locked Constitution', () => {
    renderChat();

    // Asserted against a positive the harness can actually produce: the chat is
    // mounted and rendering, it simply has no remedy to offer yet.
    expect(screen.getByTestId('send-box')).toBeInTheDocument();
    expect(screen.queryByTestId('wcore-constitution-locked-recover')).toBeNull();
  });

  it('surfaces the recovery card, and its action opens the Constitution recovery flow', () => {
    renderChat();

    emitLocked();

    const action = recoveryAction();
    expect(action).not.toBeNull();
    fireEvent.click(action!);

    // The whole point of the fix: the user lands on the recovery UI that
    // already exists, rather than on a dead-end error bubble.
    expect(navigate).toHaveBeenCalledWith('/settings/constitution');
  });

  it('keeps the engine failure text available on the card for a bug report', () => {
    renderChat();

    emitLocked(CONV, 'Agent failed to start: the authority could not be unlocked on this machine');

    expect(screen.getByText(/could not be unlocked on this machine/)).toBeInTheDocument();
  });

  it('ignores a locked report belonging to a different conversation', () => {
    renderChat();

    emitLocked('some-other-conversation');

    expect(screen.queryByTestId('wcore-constitution-locked-recover')).toBeNull();
    // Proof the query above can find the card when it is genuinely there, so
    // the null assertion is not passing for the wrong reason.
    emitLocked();
    expect(screen.queryByTestId('wcore-constitution-locked-recover')).not.toBeNull();
  });
});
