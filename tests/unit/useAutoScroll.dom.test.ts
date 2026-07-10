/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoScroll } from '../../src/renderer/pages/conversation/Messages/useAutoScroll';
import type { TMessage, IMessageText } from '../../src/common/chat/chatLib';

// Mock VirtuosoHandle
const createMockVirtuosoHandle = () => ({
  scrollToIndex: vi.fn(),
  scrollTo: vi.fn(),
  scrollBy: vi.fn(),
  getState: vi.fn(),
  autoscrollToBottom: vi.fn(),
});

// ResizeObserver mock that allows triggering callbacks
type ResizeObserverCallback = (entries: ResizeObserverEntry[]) => void;
let resizeObserverCallbacks: ResizeObserverCallback[] = [];

class ResizeObserverTestMock {
  private callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObserverCallbacks.push(callback);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    resizeObserverCallbacks = resizeObserverCallbacks.filter((cb) => cb !== this.callback);
  }
}

function triggerResizeObservers() {
  for (const cb of resizeObserverCallbacks) {
    cb([] as unknown as ResizeObserverEntry[]);
  }
}

// Create a real DOM element with overridable scroll properties
function createScrollerEl(props: { clientHeight: number; scrollHeight: number; scrollTop: number }): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'clientHeight', { get: () => props.clientHeight, configurable: true });
  Object.defineProperty(el, 'scrollHeight', { get: () => props.scrollHeight, configurable: true });
  el.scrollTop = props.scrollTop;
  return el;
}

describe('useAutoScroll - scroll to bottom on message send (#977)', () => {
  let mockVirtuosoHandle: ReturnType<typeof createMockVirtuosoHandle>;

  beforeEach(() => {
    mockVirtuosoHandle = createMockVirtuosoHandle();
    resizeObserverCallbacks = [];
    global.ResizeObserver = ResizeObserverTestMock as unknown as typeof ResizeObserver;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createMessage = (position: 'left' | 'right', id: string): IMessageText => ({
    id,
    msg_id: id,
    type: 'text',
    position,
    conversation_id: 'test-conv',
    content: { content: 'test message' },
    createdAt: Date.now(),
  });

  it('should scroll to bottom when user sends a message (position=right)', async () => {
    const initialMessages: TMessage[] = [createMessage('left', '1'), createMessage('right', '2')];

    const { result, rerender } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: initialMessages, itemCount: 2 },
    });

    // Manually set the ref to mock Virtuoso
    (result.current.virtuosoRef as any).current = mockVirtuosoHandle;

    // Add a new user message (position=right)
    const newMessages: TMessage[] = [...initialMessages, createMessage('right', '3')];

    rerender({ messages: newMessages, itemCount: 3 });

    // Wait for double RAF
    await act(async () => {
      vi.runAllTimers();
    });

    // Should have called scrollToIndex with 'LAST'
    expect(mockVirtuosoHandle.scrollToIndex).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 'LAST',
        behavior: 'auto',
        align: 'end',
      })
    );
  });

  it('should NOT scroll when AI responds (position=left)', async () => {
    const initialMessages: TMessage[] = [createMessage('right', '1')];

    const { result, rerender } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: initialMessages, itemCount: 1 },
    });

    (result.current.virtuosoRef as any).current = mockVirtuosoHandle;

    // Add AI response (position=left)
    const newMessages: TMessage[] = [...initialMessages, createMessage('left', '2')];

    rerender({ messages: newMessages, itemCount: 2 });

    await act(async () => {
      vi.runAllTimers();
    });

    // Should NOT call scrollToIndex for AI messages
    expect(mockVirtuosoHandle.scrollToIndex).not.toHaveBeenCalled();
  });

  it('should reset userScrolled flag when user sends message', async () => {
    const initialMessages: TMessage[] = [createMessage('left', '1')];

    const { result, rerender } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: initialMessages, itemCount: 1 },
    });

    (result.current.virtuosoRef as any).current = mockVirtuosoHandle;

    // Simulate user scrolling up
    act(() => {
      const mockEvent = {
        target: { scrollTop: 0 },
      } as unknown as React.UIEvent<HTMLDivElement>;

      // First set a high scroll position
      result.current.handleScroll({
        target: { scrollTop: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);

      // Then scroll up (delta < -10)
      result.current.handleScroll(mockEvent);
    });

    // Add user message - should force scroll
    const newMessages: TMessage[] = [...initialMessages, createMessage('right', '2')];

    rerender({ messages: newMessages, itemCount: 2 });

    await act(async () => {
      vi.runAllTimers();
    });

    // Should still scroll because user sent a message
    expect(mockVirtuosoHandle.scrollToIndex).toHaveBeenCalled();
  });

  it('should show scroll button when not at bottom', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [], itemCount: 0 },
    });

    // Initially hidden
    expect(result.current.showScrollButton).toBe(false);

    // Simulate not at bottom
    act(() => {
      result.current.handleAtBottomStateChange(false);
    });

    expect(result.current.showScrollButton).toBe(true);

    // Back to bottom
    act(() => {
      result.current.handleAtBottomStateChange(true);
    });

    expect(result.current.showScrollButton).toBe(false);
  });

  it('should provide scrollToBottom function for manual scroll', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [], itemCount: 5 },
    });

    (result.current.virtuosoRef as any).current = mockVirtuosoHandle;

    act(() => {
      result.current.scrollToBottom('smooth');
    });

    expect(mockVirtuosoHandle.scrollToIndex).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 4, // itemCount - 1
        behavior: 'smooth',
        align: 'end',
      })
    );
  });

  it('should handle followOutput correctly based on scroll state', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [], itemCount: 0 },
    });

    // When not user-scrolled, should return 'auto' regardless of isAtBottom
    expect(result.current.handleFollowOutput(true)).toBe('auto');
    expect(result.current.handleFollowOutput(false)).toBe('auto');
  });
});

describe('useAutoScroll - streaming guard refresh (#2017)', () => {
  let mockVirtuosoHandle: ReturnType<typeof createMockVirtuosoHandle>;

  beforeEach(() => {
    mockVirtuosoHandle = createMockVirtuosoHandle();
    resizeObserverCallbacks = [];
    global.ResizeObserver = ResizeObserverTestMock as unknown as typeof ResizeObserver;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createMessage = (position: 'left' | 'right', id: string): IMessageText => ({
    id,
    msg_id: id,
    type: 'text',
    position,
    conversation_id: 'test-conv',
    content: { content: 'test message' },
    createdAt: Date.now(),
  });

  /**
   * Simulates the scroll sequence that occurs during Virtuoso auto-follow:
   * 1. Positive delta (Virtuoso scrolling down to follow content)
   * 2. Small negative delta (Virtuoso rAF adjustment)
   *
   * Before the fix: step 2 would set userScrolledRef=true, breaking auto-scroll.
   * After the fix: step 1 refreshes the guard, so step 2 is ignored.
   */
  it('should not detect Virtuoso rAF adjustments as user scroll-up during auto-follow', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    // Simulate auto-follow: positive scroll (Virtuoso scrolling down)
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 100, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // Simulate Virtuoso rAF micro-adjustment (small negative delta)
    // This happens within the guard window refreshed by the positive delta
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 85, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // followOutput should still return 'auto' (userScrolled should be false)
    expect(result.current.handleFollowOutput(false)).toBe('auto');
  });

  it('should detect real user scroll-up when guard has expired', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    // Set initial scroll position
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // Advance past guard window
    vi.advanceTimersByTime(200);

    // Real user scroll-up (large negative delta, outside guard window)
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 400, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // followOutput should return false (userScrolled is true)
    expect(result.current.handleFollowOutput(false)).toBe(false);
    // #479: a detected scroll-up now surfaces the button directly (the latch
    // drives it), rather than waiting for atBottomStateChange(false).
    expect(result.current.showScrollButton).toBe(true);
  });

  it('followOutput should set guard so subsequent scroll events are ignored', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    // followOutput fires (new message added during streaming)
    act(() => {
      result.current.handleFollowOutput(false);
    });

    // Immediate scroll event with negative delta should be ignored (within guard)
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 450, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // Still in auto-follow mode
    expect(result.current.handleFollowOutput(false)).toBe('auto');
  });

  it('followOutput should return false after user scrolled up', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    // Set initial position
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // Wait for guard to expire
    vi.advanceTimersByTime(200);

    // User scrolls up
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 300, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    expect(result.current.handleFollowOutput(false)).toBe(false);
  });

  it('#479: atBottomStateChange(true) must NOT clear the latch or snap while the user is scrolled up', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    // Register a real DOM scroller element with a gap
    const scrollerProps = { clientHeight: 504, scrollHeight: 1050, scrollTop: 500 };
    const scrollerEl = createScrollerEl(scrollerProps);
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Simulate user scrolled up
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    vi.advanceTimersByTime(200);
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 300, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    scrollerEl.scrollTop = 300;

    // User scrolled - followOutput returns false
    expect(result.current.handleFollowOutput(false)).toBe(false);

    // A spurious atBottomStateChange(true) (mid-stream layout shift / threshold
    // band) must be inert: the latch holds, the scroll position is untouched, and
    // the button stays visible.
    act(() => {
      result.current.handleAtBottomStateChange(true);
    });

    expect(scrollerEl.scrollTop).toBe(300); // NOT snapped to bottom
    expect(result.current.handleFollowOutput(false)).toBe(false); // still paused
    expect(result.current.showScrollButton).toBe(true);

    // Only the explicit resume (button -> hideScrollButton) re-enables auto-follow.
    act(() => {
      result.current.hideScrollButton();
    });
    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);
  });

  it('atBottomStateChange(false) should scroll back when not user-scrolled (layout shift)', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    // Register real DOM scroller
    const scrollerProps = { clientHeight: 462, scrollHeight: 1000, scrollTop: 490 };
    const scrollerEl = createScrollerEl(scrollerProps);
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // atBottomStateChange(false) fires due to layout shift (ThoughtDisplay appeared)
    // userScrolled is still false - should scroll back to bottom
    act(() => {
      result.current.handleAtBottomStateChange(false);
    });

    expect(scrollerEl.scrollTop).toBe(1000 - 462);
  });

  it('atBottomStateChange(false) should NOT scroll back when user scrolled up', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 462, scrollHeight: 1000, scrollTop: 400 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Simulate user scroll-up
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1000, clientHeight: 462 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    vi.advanceTimersByTime(200);
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 300, scrollHeight: 1000, clientHeight: 462 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    const scrollTopBefore = scrollerEl.scrollTop;

    // atBottomStateChange(false) - user already scrolled, should NOT auto-scroll
    act(() => {
      result.current.handleAtBottomStateChange(false);
    });

    expect(scrollerEl.scrollTop).toBe(scrollTopBefore);
  });

  it('container resize (grow) should scroll to bottom after delay', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    // Register real DOM scroller - simulate ThoughtDisplay visible (height 462)
    const scrollerProps = { clientHeight: 462, scrollHeight: 1000, scrollTop: 490 };
    const scrollerEl = createScrollerEl(scrollerProps);
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Simulate container grow: ThoughtDisplay disappears (462 → 504)
    Object.defineProperty(scrollerEl, 'clientHeight', { get: () => 504, configurable: true });
    scrollerEl.scrollTop = 490; // gap = 1000 - 504 - 490 = 6

    act(() => {
      triggerResizeObservers();
    });

    // First correction fires at 50ms
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(scrollerEl.scrollTop).toBe(1000 - 504);
  });

  it('#479: a wheel-up opens an intent window so the ensuing onScroll latches inside the guard window', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 500 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Fast streaming keeps the onScroll guard continuously fresh...
    act(() => {
      result.current.handleFollowOutput(false);
    });
    // ...and set the last-scroll baseline (this event is guarded -> early return).
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // A real wheel-up opens the intent window; the resulting onScroll (main list
    // actually moved up) is now evaluated despite the fresh guard -> latch.
    act(() => {
      scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));
    });
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 300, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    expect(result.current.handleFollowOutput(false)).toBe(false);
    expect(result.current.showScrollButton).toBe(true);
  });

  it('#479: a wheel-DOWN does not open the intent window (no latch)', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 500 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    act(() => {
      scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }));
    });

    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);
  });

  it('#479: a wheel-up consumed by a scrollable child (main list did not move) does NOT latch', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 500 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    act(() => {
      result.current.handleFollowOutput(false);
    });
    // baseline
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // Wheel bubbles from a nested overflow child; the child consumed it, so the
    // MAIN scroller did not move. onScroll fires with delta 0 -> no false latch.
    act(() => {
      scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));
    });
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);
  });

  it('#479: after a wheel-latch, scrolling back to the bottom resumes even while the guard is still fresh', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 500 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Guard freshly set by streaming, baseline established.
    act(() => {
      result.current.handleFollowOutput(false);
    });
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // Wheel-up + up-scroll latches.
    act(() => {
      scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));
    });
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 300, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    expect(result.current.handleFollowOutput(false)).toBe(false);
    expect(result.current.showScrollButton).toBe(true);

    // User scrolls straight back to the true bottom (gap 0) - no timer advance,
    // so the guard is still fresh. Resume runs before the guard, so it fires and
    // the latch clears WITHOUT needing the scroll-to-bottom button.
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 1050 - 504, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);
  });

  it('#479: scrolling back to the true bottom resumes auto-follow', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    // Latch via a real scroll-up (guard expired).
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    vi.advanceTimersByTime(200);
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 300, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    expect(result.current.handleFollowOutput(false)).toBe(false);
    expect(result.current.showScrollButton).toBe(true);

    // User scrolls back down to the true bottom (gap 0): resume.
    vi.advanceTimersByTime(200);
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);
  });

  it('#479: a small scroll-up within the atBottomThreshold still pauses (does not count as at-bottom)', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    // Establish a baseline then a decisive up-move that lands only ~40px from the
    // bottom - within Virtuoso's 100px atBottomThreshold, but gap > 2 so it is NOT
    // treated as the true bottom and the latch holds.
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    vi.advanceTimersByTime(200);
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 460, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    expect(result.current.handleFollowOutput(false)).toBe(false);
    expect(result.current.showScrollButton).toBe(true);
  });

  it('#479: switching conversation resets the paused latch', () => {
    const { result, rerender } = renderHook(
      ({ messages, itemCount, conversationId }) => useAutoScroll({ messages, itemCount, conversationId }),
      {
        initialProps: { messages: [createMessage('left', '1')], itemCount: 1, conversationId: 'conv-a' },
      }
    );

    // Pause in conversation A.
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    vi.advanceTimersByTime(200);
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 300, scrollHeight: 1000, clientHeight: 500 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    expect(result.current.handleFollowOutput(false)).toBe(false);

    // Switch to conversation B - latch must clear.
    act(() => {
      rerender({ messages: [createMessage('left', '9')], itemCount: 1, conversationId: 'conv-b' });
    });

    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);
  });

  it('#700: a SLOW wheel scroll-up (small per-event deltas) latches once cumulative travel passes the threshold', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 546 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Baseline at the true bottom.
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 546, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // Slow wheel: each notch emits a wheel event plus an onScroll whose delta
    // (-8px) is far below the single-event USER_SCROLL_UP_DELTA (24px).
    const tick = (scrollTop: number) => {
      act(() => {
        scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: -10 }));
      });
      act(() => {
        result.current.handleScroll({
          target: { scrollTop, scrollHeight: 1050, clientHeight: 504 },
        } as unknown as React.UIEvent<HTMLDivElement>);
      });
    };

    tick(538); // travel 8
    tick(530); // travel 16
    expect(result.current.handleFollowOutput(false)).toBe('auto'); // not yet past threshold

    tick(522); // travel 24
    tick(514); // travel 32 > 24 -> latch

    expect(result.current.handleFollowOutput(false)).toBe(false);
    expect(result.current.showScrollButton).toBe(true);
  });

  it('#700: a programmatic snap-down between slow upward ticks does not erase the gesture travel', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 546 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Baseline, then two slow upward ticks (travel 16).
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 546, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    for (const top of [538, 530]) {
      act(() => {
        scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: -10 }));
      });
      act(() => {
        result.current.handleScroll({
          target: { scrollTop: top, scrollHeight: 1050, clientHeight: 504 },
        } as unknown as React.UIEvent<HTMLDivElement>);
      });
    }

    // Streaming snaps the view back to the bottom (positive delta, no wheel event).
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 546, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // The user keeps slowly scrolling up - travel resumes at 16, passes 24.
    for (const top of [538, 530]) {
      act(() => {
        scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: -10 }));
      });
      act(() => {
        result.current.handleScroll({
          target: { scrollTop: top, scrollHeight: 1050, clientHeight: 504 },
        } as unknown as React.UIEvent<HTMLDivElement>);
      });
    }

    expect(result.current.handleFollowOutput(false)).toBe(false);
    expect(result.current.showScrollButton).toBe(true);
  });

  it('#700: small negative deltas WITHOUT a wheel/touch gesture never accumulate to a latch', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 546 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Baseline.
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 546, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // Repeated reflow jitter (no wheel/touch events), each below the threshold.
    for (const top of [538, 530, 522, 514, 506]) {
      vi.advanceTimersByTime(200); // guard expired - jitter is evaluated, not guarded
      act(() => {
        result.current.handleScroll({
          target: { scrollTop: top, scrollHeight: 1050, clientHeight: 504 },
        } as unknown as React.UIEvent<HTMLDivElement>);
      });
    }

    // 40px of cumulative jitter, but no user gesture -> auto-follow stays on.
    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);
  });

  it('#700: gesture travel resets when a new gesture starts after the intent window lapses', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 546 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 546, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // First gesture: 16px of travel, then the intent window lapses.
    for (const top of [538, 530]) {
      act(() => {
        scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: -10 }));
      });
      act(() => {
        result.current.handleScroll({
          target: { scrollTop: top, scrollHeight: 1050, clientHeight: 504 },
        } as unknown as React.UIEvent<HTMLDivElement>);
      });
    }
    vi.advanceTimersByTime(300);

    // Second gesture starts fresh: another 16px must NOT combine with the first.
    for (const top of [522, 514]) {
      act(() => {
        scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: -10 }));
      });
      act(() => {
        result.current.handleScroll({
          target: { scrollTop: top, scrollHeight: 1050, clientHeight: 504 },
        } as unknown as React.UIEvent<HTMLDivElement>);
      });
    }

    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);
  });

  it('#700 review: wheel bubbling from a MID-SCROLL nested child must not accumulate Virtuoso adjustments into a latch', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 546 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Nested overflow child (e.g. a code block) that is mid-scroll: it will
    // consume upward wheel gestures itself, the main list does not move.
    const child = document.createElement('div');
    Object.defineProperty(child, 'scrollHeight', { get: () => 500, configurable: true });
    Object.defineProperty(child, 'clientHeight', { get: () => 100, configurable: true });
    child.scrollTop = 50;
    scrollerEl.appendChild(child);

    // Streaming keeps the guard fresh; baseline established.
    act(() => {
      result.current.handleFollowOutput(false);
    });
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 546, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // The user wheel-reads the child; wheel events BUBBLE to the scroller.
    // Between them, Virtuoso rAF micro-adjustments emit small negative deltas
    // on the MAIN scroller (-15px each, below the 24px single-event threshold
    // but 30px combined). They must NOT sum into a latch.
    act(() => {
      child.dispatchEvent(new WheelEvent('wheel', { deltaY: -10, bubbles: true }));
    });
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 531, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    act(() => {
      child.dispatchEvent(new WheelEvent('wheel', { deltaY: -10, bubbles: true }));
    });
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 516, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);
  });

  it('#700 review: wheel over a child parked at its TOP chains to the main list and still accumulates', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 546 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Nested child already at its top: an upward wheel chains to the parent,
    // so the resulting main-scroller movement IS user-driven.
    const child = document.createElement('div');
    Object.defineProperty(child, 'scrollHeight', { get: () => 500, configurable: true });
    Object.defineProperty(child, 'clientHeight', { get: () => 100, configurable: true });
    child.scrollTop = 0;
    scrollerEl.appendChild(child);

    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 546, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    for (const top of [538, 530, 522, 514]) {
      act(() => {
        child.dispatchEvent(new WheelEvent('wheel', { deltaY: -10, bubbles: true }));
      });
      act(() => {
        result.current.handleScroll({
          target: { scrollTop: top, scrollHeight: 1050, clientHeight: 504 },
        } as unknown as React.UIEvent<HTMLDivElement>);
      });
    }

    expect(result.current.handleFollowOutput(false)).toBe(false);
    expect(result.current.showScrollButton).toBe(true);
  });

  it('#700 review: resume at the bottom clears accumulated travel - a following small tick does not re-latch', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 504, scrollHeight: 1050, scrollTop: 546 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 546, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    // Latch via slow accumulation (not one big delta).
    for (const top of [538, 530, 522, 514]) {
      act(() => {
        scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: -10 }));
      });
      act(() => {
        result.current.handleScroll({
          target: { scrollTop: top, scrollHeight: 1050, clientHeight: 504 },
        } as unknown as React.UIEvent<HTMLDivElement>);
      });
    }
    expect(result.current.handleFollowOutput(false)).toBe(false);

    // User scrolls back to the true bottom -> resume clears latch AND travel.
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 546, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);

    // A subsequent 8px tick must not instantly re-latch off stale travel.
    act(() => {
      scrollerEl.dispatchEvent(new WheelEvent('wheel', { deltaY: -10 }));
    });
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 538, scrollHeight: 1050, clientHeight: 504 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    expect(result.current.handleFollowOutput(false)).toBe('auto');
    expect(result.current.showScrollButton).toBe(false);
  });

  it('container resize should NOT correct when user has scrolled up', () => {
    const { result } = renderHook(({ messages, itemCount }) => useAutoScroll({ messages, itemCount }), {
      initialProps: { messages: [createMessage('left', '1')], itemCount: 1 },
    });

    const scrollerEl = createScrollerEl({ clientHeight: 462, scrollHeight: 1000, scrollTop: 300 });
    act(() => {
      result.current.handleScrollerRef(scrollerEl);
    });

    // Simulate user scroll-up
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 500, scrollHeight: 1000, clientHeight: 462 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    vi.advanceTimersByTime(200);
    act(() => {
      result.current.handleScroll({
        target: { scrollTop: 300, scrollHeight: 1000, clientHeight: 462 },
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    const scrollTopBefore = scrollerEl.scrollTop;

    // Container grows
    Object.defineProperty(scrollerEl, 'clientHeight', { get: () => 504, configurable: true });
    act(() => {
      triggerResizeObservers();
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should NOT have changed scrollTop
    expect(scrollerEl.scrollTop).toBe(scrollTopBefore);
  });
});
