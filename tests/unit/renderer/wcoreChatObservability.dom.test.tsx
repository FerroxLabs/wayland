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
 * which carries the identical thesis.
 *
 * RETARGETED A THIRD TIME, and this time the thesis INVERTS. Progress and the
 * `projection:*` Engine box have now been unpublished too: the workbench is
 * Workspace ONLY, and the spine registers NOTHING. "wcore reaches a section
 * through the spine" is therefore not a true statement about the product any
 * more, and no amount of re-pointing makes it one - the only honest subject
 * left at this site is its negation.
 *
 * That negation is worth a file, because it is exactly the guarantee an
 * accident breaks. The gate the original was written against
 * ("an inverted gate would pass CI") is still here, just the other way round:
 * one restored `useWorkbenchSection(missionSection)` line, or an `available`
 * flipped to `!visible`, and Progress is back in front of every user with a
 * green suite. So this file now pins, through the real WCoreChat -> spine ->
 * WorkbenchHost path: the spine adds no section, and the workbench shows
 * exactly what its OTHER registrants put there - Workspace.
 *
 * Workspace is registered by ChatLayout, not by anything under test here, so it
 * is stood in for below (`WorkspaceRegistrant`). That stand-in is not scenery:
 * it is what keeps every "is null" assertion in this file honest, by proving
 * the queries used to look for a section can in fact find one.
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
// have both been deleted, so a mock of either would resolve to nothing.
//
// The projections stub that sat here is gone for a sharper reason: the spine no
// longer imports that module at all. Stubbing it to `null` would have hidden a
// re-published Engine box behind a mock - the exact regression this file is
// here to catch - so the real module stays unmocked and unreached.

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
import WorkbenchHost, { useWorkbenchSection } from '@/renderer/pages/conversation/components/WorkbenchHost';
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

/**
 * Stands in for ChatLayout, the one thing that still publishes to the rail. The
 * registration mirrors ChatLayout/index.tsx:180-206 in the shape that matters
 * here - id, testId, label, and available/requestedOpen both true - so the
 * workbench under test holds the same single section the real conversation
 * gives it.
 */
const WorkspaceRegistrant: React.FC = () => {
  useWorkbenchSection({
    id: 'workspace',
    label: 'Workspace',
    priority: 30,
    available: true,
    requestedOpen: true,
    activationKey: 'c1:open',
    testId: 'workbench-workspace',
    content: <div data-testid='workspace-body'>files</div>,
  });
  return null;
};

const renderChat = (messages: TMessage[] = [toolGroup]) =>
  render(
    <MessageListProvider value={messages}>
      <WorkbenchHost conversationId='c1'>
        <WorkspaceRegistrant />
        <WCoreChat conversation_id='c1' workspace='/ws' modelSelection={{} as never} />
      </WorkbenchHost>
    </MessageListProvider>
  );

/** Every section the workbench is currently offering, in stack order. */
const sectionIds = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll('[data-testid="workbench-stack"] > [data-section-id]')).map(
    (node) => node.getAttribute('data-section-id') ?? ''
  );

/**
 * The close-handler guarantee is the one thing that survives this file's third
 * retarget unchanged: the card owns the only close button, so closing must
 * genuinely retract the surface, and "a dropped close handler would pass CI"
 * is as true of Workspace as it was of Observability.
 *
 * The `panelOpen` settings double this file used to carry has been deleted with
 * the hook it doubled: nothing writes that flag any more, so asserting on it
 * would assert on a spy that can never fire. The close guarantee is asserted
 * directly on the DOM instead, which is strictly harder to fake.
 */
describe('WCoreChat leaves the workbench to Workspace alone', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows Workspace and nothing else for a wcore turn that did tool work', () => {
    const { container } = renderChat();
    // The panel is genuinely mounted and holds exactly one section. This turn
    // did tool work - it is the input that used to open Progress.
    expect(screen.getByTestId('workbench-panel')).toBeTruthy();
    expect(screen.getByRole('separator', { name: 'Resize workbench' })).toBeTruthy();
    expect(sectionIds(container)).toEqual(['workspace']);
    expect(screen.getByTestId('workbench-workspace')).toBeVisible();

    // ...and nothing from the spine. Progress by its label, its testId, and the
    // Engine box by the prefix every projection lane registers under.
    expect(screen.queryByRole('button', { name: 'Progress' })).toBeNull();
    expect(screen.queryByTestId('workbench-mission')).toBeNull();
    expect(container.querySelectorAll('[data-testid^="workbench-projection-"]')).toHaveLength(0);
  });

  it('closing from the card dismisses the section and leaves no panel behind', () => {
    renderChat();
    expect(screen.getByTestId('workbench-workspace')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Close workbench' }));
    expect(screen.queryByTestId('workbench-panel')).toBeNull();
    expect(screen.queryByTestId('workbench-workspace')).toBeNull();
  });

  /**
   * The inverted-gate catch, stated as a DIFFERENCE.
   *
   * The spine's own `available: visible` gate used to decide whether wcore got
   * a section; now it decides nothing about the rail, so the rail must look
   * identical whether the turn did work or not. Assert one side only and a
   * republished Progress slips through on the other - `available: !visible`
   * would leave the working turn clean and put a panel on the plain one.
   */
  it('offers the same Workspace-only rail whether or not the turn did execution work', () => {
    const worked = renderChat([toolGroup]);
    expect(sectionIds(worked.container)).toEqual(['workspace']);
    worked.unmount();

    localStorage.clear();
    const idle = renderChat([plainText]);
    expect(sectionIds(idle.container)).toEqual(['workspace']);
    expect(screen.queryByRole('button', { name: 'Progress' })).toBeNull();
    expect(screen.queryByTestId('workbench-mission')).toBeNull();
    expect(idle.container.querySelectorAll('[data-testid^="workbench-projection-"]')).toHaveLength(0);
  });
});
