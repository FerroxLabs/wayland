/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #252 reframe wiring guard for WCoreChat: a workbench section is disclosed
 * only when the run has real work behind it, and closing it retracts the
 * surface. Both halves were previously uncovered - an inverted gate or a
 * dropped close handler would pass CI. The heavy chat deps are stubbed so what
 * is measured is the wiring, not a re-mock of it.
 *
 * RETARGETED (DEFECT B). The section registration moved OUT of WCoreChat and
 * into ExecutionSpine, which all three platform chats render - previously only
 * wcore had a section at all. The subject stays WCoreChat on purpose: these
 * cases assert that wcore still reaches the section end to end THROUGH the
 * spine. Cross-backend coverage (ACP, Gemini) lives in
 * executionSpineObservability.dom.test.tsx.
 *
 * RETARGETED AGAIN (Observability removal). The Observability section, its
 * panel and the `panelOpen` setting that gated it have all been deleted; the
 * surviving section registered at that same site is `mission` / "Progress",
 * which carries the identical thesis. The list must still contain a turn that
 * did work: availability is gated on content, so an empty conversation offers
 * no section at all (asserted below).
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

// The `panelOpen` settings double and the ObservabilityPanel body stub that
// used to sit here are gone with their subjects: the hook and the panel module
// have both been deleted, so a mock of either would resolve to nothing. The
// section gate the panel stub existed to leave measurable is now
// ExecutionSpine's own `visible`, which needs no double.

// The workbench projections lane is a separate concern (and a separate packet);
// stub it so an unrelated projection change cannot move the active section here.
vi.mock('@/renderer/pages/conversation/components/WorkbenchHost/projections', () => ({
  default: () => null,
}));

// Heavy, irrelevant chat deps stubbed to no-ops.
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
vi.mock('@renderer/components/media/LocalImageView', () => ({
  default: Object.assign(() => null, {
    Provider: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useUpdateLocalImage: () => () => {},
  }),
}));
vi.mock('@renderer/hooks/useProviderReadiness', () => ({
  useProviderReadiness: () => ({ ready: true, loading: false }),
}));
vi.mock('@renderer/hooks/useFluxConnected', () => ({ useFluxConnected: () => false }));
vi.mock('@renderer/hooks/context/ConversationContext', () => ({
  ConversationProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/pages/conversation/platforms/acp/acpAuthFailure', () => ({ getAcpAuthRemedy: () => null }));
vi.mock('@renderer/pages/conversation/platforms/acp/acpFluxFailover', () => ({ routeThroughFluxAndReplay: vi.fn() }));
vi.mock('@renderer/pages/conversation/components/ConversationChatConfirm', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/pages/conversation/platforms/wcore/WCoreSendBox', () => ({
  default: () => <div data-testid='send-box' />,
}));
vi.mock('@renderer/utils/emitter', () => ({
  emitter: { emit: vi.fn() },
  useAddEventListener: () => {},
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => () => {} }));
vi.mock('@/common', () => ({ ipcBridge: {} }));

import type { TMessage } from '@/common/chat/chatLib';
import WCoreChat from '@/renderer/pages/conversation/platforms/wcore/WCoreChat';
import WorkbenchHost from '@/renderer/pages/conversation/components/WorkbenchHost';
import { MessageListProvider } from '@/renderer/pages/conversation/Messages/messageListContext';

/** One wcore tool turn - the shape wcore actually reports its tool work in. */
const toolGroup: TMessage = {
  id: 'tg1',
  msg_id: 'turn-1',
  conversation_id: 'c1',
  type: 'tool_group',
  position: 'left',
  content: [{ callId: 'a', name: 'ReadFile', description: 'Read config.ts', status: 'Success' }],
} as unknown as TMessage;

const plainText: TMessage = {
  id: 't1',
  msg_id: 'text-1',
  conversation_id: 'c1',
  type: 'text',
  position: 'left',
  content: { content: 'hello' },
} as unknown as TMessage;

const renderChat = (messages: TMessage[] = [toolGroup]) =>
  render(
    <MessageListProvider value={messages}>
      <WorkbenchHost conversationId='c1'>
        <WCoreChat conversation_id='c1' workspace='/ws' modelSelection={{} as never} />
      </WorkbenchHost>
    </MessageListProvider>
  );

/**
 * Retargeted from Observability to Progress.
 *
 * This file exists to prove that wcore reaches a workbench section END TO END
 * THROUGH THE SPINE - not through a per-platform copy - and that the close
 * handler is really wired, because "an inverted gate or a dropped close handler
 * would pass CI" (see this file's header). The Observability section it used to
 * assert on has been removed outright; `mission` / "Progress" is the surviving
 * section registered at that same site (ExecutionSpine/index.tsx:95-106), and
 * it carries the identical thesis. Every guarantee below is the one this file
 * already made, re-pointed at the surface that still exists.
 *
 * The `panelOpen` settings double this file used to carry has been deleted with
 * the hook it doubled: nothing writes that flag any more, so asserting on it
 * would assert on a spy that can never fire. The close guarantee is asserted
 * directly on the DOM instead, which is strictly harder to fake.
 */
describe('WCoreChat reaches a workbench section through the execution spine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('discloses Progress for a wcore turn that did tool work', () => {
    renderChat();
    expect(screen.getByRole('button', { name: 'Progress' })).toBeTruthy();
    expect(screen.getByTestId('workbench-mission')).toBeVisible();
    expect(screen.getByRole('separator', { name: 'Resize workbench' })).toBeTruthy();
  });

  // The card owns the only close button, so a card can never show two closes
  // doing different things. Closing must genuinely retract the surface.
  it('closing from the card dismisses the section and leaves no panel behind', () => {
    renderChat();
    expect(screen.getByTestId('workbench-mission')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Close workbench' }));
    expect(screen.queryByTestId('workbench-panel')).toBeNull();
    expect(screen.queryByTestId('workbench-mission')).toBeNull();
  });

  /**
   * The gate is on CONTENT, not on a stored preference: a section that can only
   * say "nothing here yet" is worse than no section. `available: visible`
   * (ExecutionSpine/index.tsx:98) is the structural analogue of the old
   * `hasObservable` gate, so "no work ⇒ no section" keeps a real subject.
   */
  it('offers no section at all when the conversation has no execution work', () => {
    renderChat([plainText]);
    expect(screen.queryByRole('button', { name: 'Progress' })).toBeNull();
    expect(screen.queryByTestId('workbench-mission')).toBeNull();
    expect(screen.queryByTestId('workbench-panel')).toBeNull();
  });
});
