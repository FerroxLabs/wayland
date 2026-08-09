/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #252 reframe wiring guard for WCoreChat: the opt-in observability panel is
 * mounted only when the shared setting `panelOpen` is true, and closing it flips
 * that setting back to false. Both halves were previously uncovered - an
 * inverted gate or a dropped close handler would pass CI. The heavy chat deps
 * are stubbed; a reactive settings double drives the gate so we test the actual
 * wiring, not a re-mock of it.
 *
 * RETARGETED (DEFECT B). The section registration moved OUT of WCoreChat and
 * into ExecutionSpine, which all three platform chats render - previously only
 * wcore had an Observability tab at all. The subject stays WCoreChat on purpose:
 * these cases assert that wcore still reaches the panel end to end THROUGH the
 * spine. Cross-backend coverage (ACP, Gemini) lives in
 * executionSpineObservability.dom.test.tsx.
 *
 * Two things had to change with it, both because the behaviour genuinely
 * changed, not to make a failure go away:
 *   1. The list must contain an observable turn. Availability is now gated on
 *      content, so an empty conversation offers NO tab (asserted below).
 *   2. Opening goes through the workbench tab, because the Progress section
 *      (priority 60) outranks Observability (50) for auto-disclosure.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

// Reactive settings double: WCoreChat reads `panelOpen` to gate the panel and
// calls update('panelOpen', false) on close. The store lives in a module-level
// React store so the close click re-renders WCoreChat (the real store is
// localStorage-backed + seeded at import, which a static import can't reset
// between cases). `seedPanelOpen` sets the initial value per test.
let panelOpen = false;
const updateSpy = vi.fn();
const settingsListeners = new Set<() => void>();
vi.mock('@renderer/hooks/settings/useObservabilitySettings', () => {
  const React2 = require('react') as typeof import('react');
  return {
    useObservabilitySettings: () => {
      const [, force] = React2.useReducer((n: number) => n + 1, 0);
      React2.useEffect(() => {
        const l = () => force();
        settingsListeners.add(l);
        return () => {
          settingsListeners.delete(l);
        };
      }, []);
      return {
        settings: { panelOpen, showCost: false },
        update: (key: string, value: boolean) => {
          updateSpy(key, value);
          if (key === 'panelOpen') {
            panelOpen = value;
            for (const l of settingsListeners) l();
          }
        },
      };
    },
  };
});

const seedPanelOpen = (open: boolean) => {
  panelOpen = open;
};

// The relocated panel: stub the BODY so this suite measures wiring, not
// rendering. `isObservable` is the real predicate - ExecutionSpine gates tab
// availability on it, and stubbing it would make the gate untestable here.
vi.mock('@renderer/pages/conversation/Messages/components/ObservabilityPanel', async () => {
  const actual = await vi.importActual<
    typeof import('@renderer/pages/conversation/Messages/components/ObservabilityPanel')
  >('@renderer/pages/conversation/Messages/components/ObservabilityPanel');
  return {
    ...actual,
    default: () => <div data-testid='observability-panel' />,
  };
});

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

const openObservabilityTab = () => {
  fireEvent.click(screen.getByRole('tab', { name: 'Observability' }));
};

describe('WCoreChat #252 observability wiring', () => {
  beforeEach(() => {
    localStorage.clear();
    seedPanelOpen(false);
    updateSpy.mockClear();
    settingsListeners.clear();
  });

  it('does not mount the panel when panelOpen is false (default)', () => {
    renderChat();
    expect(screen.queryByTestId('observability-panel')).toBeNull();
  });

  it('mounts the panel when panelOpen is true and the section is selected', () => {
    seedPanelOpen(true);
    renderChat();
    openObservabilityTab();
    expect(screen.getByTestId('observability-panel')).toBeTruthy();
    expect(screen.getByRole('separator', { name: 'Resize workbench' })).toBeTruthy();
  });

  // The panel no longer draws its own close button - the workbench card owns
  // the only one, so that a card could not show two closes doing different
  // things. The BEHAVIOUR under test is unchanged: closing must still clear
  // panelOpen through the section's onDismiss and unmount the panel.
  it('closing the panel from the card clears panelOpen and unmounts it', () => {
    seedPanelOpen(true);
    renderChat();
    openObservabilityTab();
    fireEvent.click(screen.getByRole('button', { name: 'Close workbench' }));
    expect(updateSpy).toHaveBeenCalledWith('panelOpen', false);
    expect(screen.queryByTestId('observability-panel')).toBeNull();
  });

  /**
   * DELIBERATE wcore behaviour change. The old registration passed
   * `available: true` unconditionally, so a conversation with no tool work still
   * offered an Observability tab whose entire content was the "Activity ... will
   * appear here" hint. Availability is now gated on there being something to
   * show, matching the Progress section beside it.
   */
  it('offers no Observability tab at all when the conversation has no observable turn', () => {
    seedPanelOpen(true);
    renderChat([plainText]);
    expect(screen.queryByRole('tab', { name: 'Observability' })).toBeNull();
    expect(screen.queryByTestId('observability-panel')).toBeNull();
  });
});
