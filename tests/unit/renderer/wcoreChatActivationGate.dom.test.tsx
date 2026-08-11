/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * The in-thread activation gate, asserted through the REAL WCoreChat ->
 * ActivationCard path.
 *
 * Reported defect: an install with five connected providers (Flux Router with
 * 77 models, Groq, Google Gemini, OpenRouter, OpenAI - every one "Connected" in
 * Settings) was shown "Wake your agents / Connect a model provider to start
 * running tasks" inside a conversation. The gate was `!ready && !loading`, so
 * EVERY not-ready reason - a blocked registry, a failed list() IPC, a provider
 * mid-probe - rendered the one piece of copy that is only true when the user
 * has no provider at all.
 *
 * The card is deliberately NOT stubbed here. Stubbing it is what let the old
 * gate read as covered: the wiring under test is precisely which headline
 * reaches the user, and a `() => null` double cannot see a headline.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProviderReadiness } from '@renderer/hooks/useProviderReadiness';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

// Heavy, irrelevant chat deps stubbed to no-ops - the same set the sibling
// WCoreChat wiring suite uses.
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
vi.mock('@renderer/components/activation/AcpAuthFailureCard', () => ({ default: () => null }));
vi.mock('@renderer/components/media/LocalImageView', () => ({
  default: Object.assign(() => null, {
    Provider: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useUpdateLocalImage: () => () => {},
  }),
}));
vi.mock('@renderer/hooks/useFluxConnected', () => ({ useFluxConnected: () => false }));
vi.mock('@renderer/hooks/context/ConversationContext', () => ({
  ConversationProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/hooks/useModelRegistry', () => ({
  ModelRegistryProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/pages/conversation/platforms/acp/acpAuthFailure', () => ({ getAcpAuthRemedy: () => null }));
vi.mock('@renderer/pages/conversation/platforms/acp/acpFluxFailover', () => ({ routeThroughFluxAndReplay: vi.fn() }));
vi.mock('@renderer/pages/conversation/components/ConversationChatConfirm', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/pages/conversation/platforms/wcore/WCoreSendBox', () => ({
  default: () => <div data-testid='send-box' />,
}));
vi.mock('@renderer/pages/conversation/components/ExecutionSpine', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/utils/emitter', () => ({
  emitter: { emit: vi.fn() },
  useAddEventListener: () => {},
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => () => {} }));
vi.mock('@/common', () => ({ ipcBridge: { onboarding: { connectFlux: { invoke: vi.fn() } } } }));

// The readiness hook is the gate's only input. The projection that produces it
// is covered exhaustively in useProviderReadiness.dom.test.tsx; what is under
// test here is what WCoreChat DOES with each verdict.
const readinessMock = vi.hoisted(() => ({ value: { ready: true, loading: false } as ProviderReadiness }));
vi.mock('@renderer/hooks/useProviderReadiness', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@renderer/hooks/useProviderReadiness')>();
  return { ...actual, useProviderReadiness: () => readinessMock.value };
});

import WCoreChat from '@/renderer/pages/conversation/platforms/wcore/WCoreChat';

function renderChat(readiness: ProviderReadiness) {
  readinessMock.value = readiness;
  return render(<WCoreChat conversation_id='c1' workspace='/ws' modelSelection={{} as never} />);
}

describe('WCoreChat activation gate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('tells a user with no provider at all to connect one', () => {
    renderChat({ ready: false, loading: false, reason: 'no-provider' });
    const card = screen.getByTestId('activation-card');
    expect(card).toHaveAttribute('data-variant', 'connect');
    expect(card.textContent).toContain('conversation.activation.title');
  });

  it('never tells a configured-but-blocked user to connect a model provider', () => {
    renderChat({ ready: false, loading: false, reason: 'all-errored' });
    const card = screen.getByTestId('activation-card');
    expect(card).toHaveAttribute('data-variant', 'repair');
    expect(card.textContent).toContain('conversation.activation.unusableTitle');
    expect(card.textContent).not.toContain('conversation.activation.subtitle');
  });

  it('never tells a user whose registry read failed that they have no provider', () => {
    renderChat({ ready: false, loading: false, reason: 'registry-error' });
    expect(screen.getByTestId('activation-card')).toHaveAttribute('data-variant', 'repair');
  });

  it('shows no activation card while a provider is still being probed', () => {
    renderChat({ ready: false, loading: false, reason: 'checking' });
    // Positive control first: the chat really did mount, so a null card is a
    // decision and not an empty render.
    expect(screen.getByTestId('send-box')).toBeInTheDocument();
    expect(screen.queryByTestId('activation-card')).toBeNull();
  });

  it('shows no activation card while the registry list is in flight', () => {
    renderChat({ ready: false, loading: true });
    expect(screen.getByTestId('send-box')).toBeInTheDocument();
    expect(screen.queryByTestId('activation-card')).toBeNull();
  });

  it('shows no activation card once a provider is ready', () => {
    renderChat({ ready: true, loading: false });
    expect(screen.getByTestId('send-box')).toBeInTheDocument();
    expect(screen.queryByTestId('activation-card')).toBeNull();
  });
});
