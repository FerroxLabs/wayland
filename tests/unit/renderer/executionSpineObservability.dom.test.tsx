/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DEFECT B - Observability had no parity across backends.
 *
 * The section was registered at exactly ONE site (WCoreChat), so Claude Code and
 * Codex (both ACP) and Gemini had no Observability tab at all. ExecutionSpine is
 * the one component all three platform chats already render, inside the same
 * MessageListProvider, so it is where a cross-backend section belongs.
 *
 * These tests drive the REAL ExecutionSpine inside the REAL WorkbenchHost and
 * assert on what the user can actually reach: is there a tab, and does the ACP
 * tool stream appear behind it. The panel is NOT mocked - a mocked panel would
 * pass with the ACP messages still filtered out.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

// The workbench projections lane is a separate concern (and a separate packet);
// stub it so this suite measures the observability wiring only.
vi.mock('@/renderer/pages/conversation/components/WorkbenchHost/projections', () => ({
  default: () => null,
}));

// Reactive settings double - the section's onActivate/onDismiss write through it
// and the panel's `showCost` reads it. Module-level so a click re-renders.
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

import type { TMessage } from '@/common/chat/chatLib';
import ExecutionSpine from '@/renderer/pages/conversation/components/ExecutionSpine';
import WorkbenchHost, { type WorkbenchSectionRegistration } from '@/renderer/pages/conversation/components/WorkbenchHost';
import { MessageListProvider } from '@/renderer/pages/conversation/Messages/messageListContext';

/**
 * A second, always-open section so the card is open and the TAB ROW renders
 * (WorkbenchHost shows a plain title instead of tabs when only one section is
 * available). Module-level constant: a fresh array each render would churn the
 * host's section memo.
 */
const ANCHOR_SECTIONS: readonly WorkbenchSectionRegistration[] = [
  { id: 'workspace', label: 'Workspace', priority: 10, requestedOpen: true, content: <div data-testid='anchor' /> },
];

const acpToolCall = (id: string, title: string, kind: string, status: string): TMessage =>
  ({
    id,
    msg_id: `m-${id}`,
    conversation_id: 'c1',
    type: 'acp_tool_call',
    position: 'left',
    content: {
      sessionId: 's1',
      update: { sessionUpdate: 'tool_call', toolCallId: id, title, kind, status },
    },
  }) as unknown as TMessage;

const toolGroup = (id: string): TMessage =>
  ({
    id,
    msg_id: `turn-${id}`,
    conversation_id: 'c1',
    type: 'tool_group',
    position: 'left',
    content: [{ callId: `${id}-a`, name: 'ReadFile', description: 'Read config.ts', status: 'Success' }],
  }) as unknown as TMessage;

const plainText = (id: string): TMessage =>
  ({
    id,
    msg_id: `text-${id}`,
    conversation_id: 'c1',
    type: 'text',
    position: 'left',
    content: { content: 'hello' },
  }) as unknown as TMessage;

const renderSpine = (backend: 'wcore' | 'acp' | 'gemini', messages: TMessage[]) =>
  render(
    <MessageListProvider value={messages}>
      <WorkbenchHost conversationId={`c-${backend}`} sections={ANCHOR_SECTIONS}>
        <ExecutionSpine backend={backend} conversationId='c1' workspaceId='/ws' agentId={backend}>
          <div data-testid='chat-body' />
        </ExecutionSpine>
      </WorkbenchHost>
    </MessageListProvider>
  );

const openObservability = () => {
  fireEvent.click(screen.getByRole('tab', { name: 'Observability' }));
};

describe('ExecutionSpine observability parity (DEFECT B)', () => {
  beforeEach(() => {
    localStorage.clear();
    panelOpen = false;
    updateSpy.mockClear();
    settingsListeners.clear();
  });

  it('offers an Observability tab on an ACP backend (Claude Code / Codex)', () => {
    renderSpine('acp', [plainText('t1'), acpToolCall('tc1', 'Read config.ts', 'read', 'completed')]);
    expect(screen.getByRole('tab', { name: 'Observability' })).toBeTruthy();
  });

  it('renders the ACP tool stream in the panel through the shared timeline projection', () => {
    renderSpine('acp', [
      plainText('t1'),
      acpToolCall('tc1', 'Read config.ts', 'read', 'completed'),
      acpToolCall('tc2', 'Search the web for kittens', 'execute', 'completed'),
    ]);
    openObservability();
    const panel = screen.getByTestId('observability-panel');
    // The SAME humanized label a wcore tool_group produces for the same
    // invocation - one projection (toolSummaryToSteps), one renderer.
    expect(panel.textContent).toContain('Reading config.ts');
    expect(panel.textContent).toContain('Search the web for kittens');
  });

  it('offers an Observability tab on a Gemini backend (tool_group)', () => {
    renderSpine('gemini', [toolGroup('tg1')]);
    expect(screen.getByRole('tab', { name: 'Observability' })).toBeTruthy();
    openObservability();
    expect(screen.getByTestId('observability-panel').textContent).toContain('Reading config.ts');
  });

  it('offers an Observability tab on the wcore backend (unchanged for a turn that has activity)', () => {
    renderSpine('wcore', [toolGroup('tg1')]);
    expect(screen.getByRole('tab', { name: 'Observability' })).toBeTruthy();
  });

  /**
   * Availability is gated on there being something to show. This is a
   * DELIBERATE change to wcore, which previously registered `available: true`
   * unconditionally and therefore showed an Observability tab whose only
   * content was the "Activity from this conversation will appear here." hint.
   */
  it('does not offer the tab when the conversation has no observable activity', () => {
    renderSpine('acp', [plainText('t1')]);
    expect(screen.queryByRole('tab', { name: 'Observability' })).toBeNull();
  });

  it('does not offer the tab on wcore either when the conversation has no observable activity', () => {
    renderSpine('wcore', [plainText('t1')]);
    expect(screen.queryByRole('tab', { name: 'Observability' })).toBeNull();
  });
});
