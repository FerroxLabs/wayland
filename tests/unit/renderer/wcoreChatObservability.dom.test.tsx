/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * #252 reframe wiring guard for WCoreChat: the opt-in observability panel is
 * mounted only when the shared setting `panelOpen` is true, and the panel's
 * onClose flips that setting back to false. Both halves were previously
 * uncovered - an inverted gate or a dropped close handler would pass CI. The
 * heavy chat deps are stubbed; the real `useObservabilitySettings` store drives
 * the gate so we test the actual wiring, not a re-mock of it.
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

// Resize machinery: deterministic stub (no DOM measurement in jsdom).
vi.mock('@renderer/hooks/ui/useResizableSplit', () => ({
  useResizableSplit: () => ({
    splitRatio: 62,
    createDragHandle: () => <div data-testid='drag-handle' />,
  }),
}));

// The relocated panel: stub that surfaces the close control so we can verify the
// onClose wiring without mounting the real tree.
vi.mock('@renderer/pages/conversation/Messages/components/ObservabilityPanel', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid='observability-panel'>
      <button type='button' aria-label='close' onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

// Heavy, irrelevant chat deps stubbed to no-ops.
vi.mock('@renderer/pages/conversation/Messages/MessageList', () => ({ default: () => <div data-testid='message-list' /> }));
vi.mock('@renderer/pages/conversation/Messages/hooks', () => ({
  MessageListProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useMessageLstCache: () => {},
}));
vi.mock('@renderer/components/layout/FlexFullContainer', () => ({ default: ({ children }: React.PropsWithChildren) => <>{children}</> }));
vi.mock('@renderer/components/activation/ActivationCard', () => ({ default: () => null }));
vi.mock('@renderer/components/activation/AcpAuthFailureCard', () => ({ default: () => null }));
vi.mock('@renderer/components/media/LocalImageView', () => ({
  default: Object.assign(() => null, {
    Provider: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useUpdateLocalImage: () => () => {},
  }),
}));
vi.mock('@renderer/hooks/useProviderReadiness', () => ({ useProviderReadiness: () => ({ ready: true, loading: false }) }));
vi.mock('@renderer/hooks/useFluxConnected', () => ({ useFluxConnected: () => false }));
vi.mock('@renderer/hooks/context/ConversationContext', () => ({
  ConversationProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/pages/conversation/platforms/acp/acpAuthFailure', () => ({ getAcpAuthRemedy: () => null }));
vi.mock('@renderer/pages/conversation/platforms/acp/acpFluxFailover', () => ({ routeThroughFluxAndReplay: vi.fn() }));
vi.mock('@renderer/pages/conversation/components/ConversationChatConfirm', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@renderer/pages/conversation/platforms/wcore/WCoreSendBox', () => ({ default: () => <div data-testid='send-box' /> }));
vi.mock('@renderer/utils/emitter', () => ({
  emitter: { emit: vi.fn() },
  useAddEventListener: () => {},
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => () => {} }));
vi.mock('@/common', () => ({ ipcBridge: {} }));

import WCoreChat from '@/renderer/pages/conversation/platforms/wcore/WCoreChat';

const renderChat = () =>
  render(
    <WCoreChat
      conversation_id='c1'
      workspace='/ws'
      modelSelection={{} as never}
    />
  );

describe('WCoreChat #252 observability wiring', () => {
  beforeEach(() => {
    seedPanelOpen(false);
    updateSpy.mockClear();
    settingsListeners.clear();
  });

  it('does not mount the panel when panelOpen is false (default)', () => {
    renderChat();
    expect(screen.queryByTestId('observability-panel')).toBeNull();
  });

  it('mounts the panel when panelOpen is true', () => {
    seedPanelOpen(true);
    renderChat();
    expect(screen.getByTestId('observability-panel')).toBeTruthy();
    expect(screen.getByTestId('drag-handle')).toBeTruthy();
  });

  it('closing the panel clears panelOpen and unmounts it', () => {
    seedPanelOpen(true);
    renderChat();
    fireEvent.click(screen.getByLabelText('close'));
    expect(updateSpy).toHaveBeenCalledWith('panelOpen', false);
    expect(screen.queryByTestId('observability-panel')).toBeNull();
  });
});
