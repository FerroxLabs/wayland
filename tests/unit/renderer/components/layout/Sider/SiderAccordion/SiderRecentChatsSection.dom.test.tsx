/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Replace the lazy-loaded heavy history component with a stub so we can
// assert body visibility without pulling routing/dnd-kit/arco-design.
vi.mock('@renderer/pages/conversation/GroupedHistory', () => ({
  default: () => <div data-testid='wgh-stub'>history</div>,
}));

const listChangedHandlers: Array<() => void> = [];
const invokeMock = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {
    database: {
      getUserConversations: {
        invoke: (...args: unknown[]) => invokeMock(...args),
      },
    },
    conversation: {
      listChanged: {
        on: (handler: () => void) => {
          listChangedHandlers.push(handler);
          return () => {
            const idx = listChangedHandlers.indexOf(handler);
            if (idx >= 0) listChangedHandlers.splice(idx, 1);
          };
        },
      },
    },
  },
}));

import { SiderRecentChatsSection } from '@renderer/components/layout/Sider/SiderAccordion/SiderRecentChatsSection';

const flush = async () => {
  // Two macrotasks let pending promise chains settle before assertions.
  await Promise.resolve();
  await Promise.resolve();
};

const renderSection = (props: { collapsed?: boolean } = {}) =>
  render(
    <Suspense fallback={<div data-testid='outer-fallback' />}>
      <SiderRecentChatsSection collapsed={props.collapsed ?? false} />
    </Suspense>
  );

describe('SiderRecentChatsSection', () => {
  beforeEach(() => {
    listChangedHandlers.length = 0;
    invokeMock.mockReset();
    invokeMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders header label and icon', async () => {
    vi.useFakeTimers();
    renderSection();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByText('sider.accordion.recentChats')).toBeInTheDocument();
    // The lucide MessageSquare icon renders as an inline <svg>; the wrapping
    // span carries our icon class so we just assert the section root mounts.
    expect(screen.getByTestId('sider-recent-chats-section')).toBeInTheDocument();
  });

  it('hides the badge when count is 0', async () => {
    vi.useFakeTimers();
    invokeMock.mockResolvedValue([]);
    renderSection();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await flush();
    expect(screen.queryByTestId('recent-chats-badge')).not.toBeInTheDocument();
  });

  it('shows the badge with count when there is at least one conversation', async () => {
    invokeMock.mockResolvedValue([
      { id: 'c1', extra: {} },
      { id: 'c2', extra: {} },
      { id: 'c3', extra: { isHealthCheck: true } }, // filtered out
      { id: 'c4', extra: { teamId: 't1' } }, // filtered out
      { id: 'c5', extra: { projectId: 'proj-fintrakd' } }, // filtered out
    ]);
    renderSection();
    const badge = await screen.findByTestId('recent-chats-badge', undefined, { timeout: 2000 });
    expect(badge).toHaveTextContent('2');
    expect(badge.getAttribute('aria-label')).toBe('2 chats');
  });

  it('keeps the body (WorkspaceGroupedHistory stub) always visible - no collapse affordance', async () => {
    renderSection();
    await waitFor(() => {
      expect(screen.getByTestId('wgh-stub')).toBeInTheDocument();
    });
    // Header has no role=button / aria-expanded - confirms non-interactive label.
    const header = screen.getByText('sider.accordion.recentChats').parentElement;
    expect(header).not.toBeNull();
    expect(header?.getAttribute('role')).toBeNull();
    expect(header?.getAttribute('aria-expanded')).toBeNull();
  });

  it('debounces rapid listChanged fires to exactly one refetch after 500ms', async () => {
    vi.useFakeTimers();
    renderSection();
    // The initial mount already fired one debounced refresh; let it land.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await flush();
    invokeMock.mockClear();

    // 5 rapid fires within 100ms should coalesce into a single invoke.
    for (let i = 0; i < 5; i++) {
      act(() => {
        listChangedHandlers.forEach((h) => h());
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20);
      });
    }
    // Not enough elapsed yet - debounce not flushed.
    expect(invokeMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await flush();
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from listChanged on unmount', async () => {
    vi.useFakeTimers();
    const { unmount } = renderSection();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(listChangedHandlers.length).toBe(1);
    unmount();
    expect(listChangedHandlers.length).toBe(0);
  });

  it('returns null in collapsed mode', () => {
    renderSection({ collapsed: true });
    expect(screen.queryByTestId('sider-recent-chats-section')).not.toBeInTheDocument();
  });
});
