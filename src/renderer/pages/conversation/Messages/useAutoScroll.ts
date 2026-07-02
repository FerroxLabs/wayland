/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * useAutoScroll - Auto-scroll hook with user scroll detection
 *
 * Strategy:
 * - followOutput handles auto-scroll when totalCount changes (new items).
 * - When external UI (ThoughtDisplay, CommandQueuePanel) shrinks the Virtuoso
 *   container, a ResizeObserver sets a scroll guard so the resulting scroll
 *   adjustment isn't misdetected as user scroll-up. Then atBottomStateChange
 *   fires false, and since userScrolled is still false, we scroll back to bottom
 *   via Virtuoso's own scrollToIndex API.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import type { TMessage } from '@/common/chat/chatLib';

// Ignore scroll events within this window after a programmatic scroll (ms)
const PROGRAMMATIC_SCROLL_GUARD_MS = 150;

// Minimum upward delta (px) to treat a scroll event as a deliberate user
// scroll-up. Larger than the resting jitter that Virtuoso reflow / footer
// (orbit, ThoughtDisplay) appearance can emit mid-stream, but well below the
// distance a real read-history scroll travels.
const USER_SCROLL_UP_DELTA = 24;

// How long a wheel/touch scroll-up gesture keeps onScroll exempt from the
// programmatic guard (ms). Long enough to cover the onScroll(s) a single wheel
// notch / touch drag produces, short enough that a later unrelated reflow scroll
// is still guarded. Refreshed on every gesture event so continuous scrolling
// (trackpad momentum) stays exempt for its whole duration.
const USER_SCROLL_INTENT_MS = 200;

// Lightweight streaming signature for the in-place auto-scroll effect.
// followOutput only fires on item-count change; ACP/Gemini grow the last
// message's text in place, so we additionally key on the last message's text
// length. Only string content contributes a length; never throws on other
// content shapes (arrays, objects without a string body).
function streamingSignature(messages: TMessage[]): string {
  const last = messages[messages.length - 1];
  let lastLen = 0;
  const content: unknown = last?.content;
  if (typeof content === 'string') {
    lastLen = content.length;
  } else if (content !== null && typeof content === 'object') {
    const body = (content as { content?: unknown }).content;
    if (typeof body === 'string') lastLen = body.length;
  }
  return `${messages.length}:${lastLen}`;
}

interface UseAutoScrollOptions {
  /** Message list for detecting new messages */
  messages: TMessage[];
  /** Total item count for scroll target */
  itemCount: number;
  /**
   * Active conversation id. When it changes the scroll-up latch is reset so a
   * paused auto-follow from one chat never carries into the next (the list view
   * is reused across conversation switches, it does not remount).
   */
  conversationId?: string;
}

interface UseAutoScrollReturn {
  /** Ref to attach to Virtuoso component */
  virtuosoRef: React.RefObject<VirtuosoHandle | null>;
  /** Callback to attach to Virtuoso scrollerRef for resize guard */
  handleScrollerRef: (ref: HTMLElement | Window | null) => void;
  /** Scroll event handler for Virtuoso onScroll */
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  /** Virtuoso atBottomStateChange callback */
  handleAtBottomStateChange: (atBottom: boolean) => void;
  /** Virtuoso followOutput callback for streaming auto-scroll */
  handleFollowOutput: (isAtBottom: boolean) => false | 'auto';
  /** Whether to show scroll-to-bottom button */
  showScrollButton: boolean;
  /** Manually scroll to bottom (e.g., when clicking button) */
  scrollToBottom: (behavior?: 'smooth' | 'auto') => void;
  /** Hide the scroll button */
  hideScrollButton: () => void;
}

export function useAutoScroll({ messages, itemCount, conversationId }: UseAutoScrollOptions): UseAutoScrollReturn {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [scrollerEl, setScrollerEl] = useState<HTMLElement | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Streaming signature: cheap derived dep that changes on both item-count
  // change and in-place text growth (see streamingSignature). Drives the
  // in-place auto-scroll effect so each streamed chunk follows.
  const streamingSig = streamingSignature(messages);

  // Refs for scroll control
  const userScrolledRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const previousListLengthRef = useRef(messages.length);
  const lastProgrammaticScrollTimeRef = useRef(0);
  const scrollerElRef = useRef<HTMLElement | null>(null);
  const followOutputTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timestamp until which a real user scroll gesture (wheel / touch drag up) is
  // in flight. While inside this window, handleScroll bypasses the programmatic
  // guard so the resulting onScroll is evaluated on its true main-scroller delta.
  const userScrollIntentUntilRef = useRef(0);

  // Capture Virtuoso's scroll container
  const handleScrollerRef = useCallback((ref: HTMLElement | Window | null) => {
    const el = ref instanceof HTMLElement ? ref : null;
    scrollerElRef.current = el;
    setScrollerEl(el);
  }, []);

  // ResizeObserver: when the container resizes, set the programmatic scroll guard
  // so Virtuoso's resulting scroll adjustment won't be misdetected as user scroll-up.
  // On container grow (e.g. ThoughtDisplay disappears), also scroll to the true bottom
  // after Virtuoso finishes its internal adjustments, since the gap may fall within
  // atBottomThreshold and not trigger atBottomStateChange(false).
  useEffect(() => {
    if (!scrollerEl) return;

    let prevHeight = scrollerEl.clientHeight;
    let growTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver(() => {
      const newHeight = scrollerEl.clientHeight;
      const delta = prevHeight - newHeight;
      prevHeight = newHeight;

      if (delta !== 0 && !userScrolledRef.current) {
        lastProgrammaticScrollTimeRef.current = Date.now();

        // Container grew (e.g. ThoughtDisplay disappeared) - scroll to true bottom
        // after Virtuoso finishes its rAF-based processing (~16ms). Using 50ms
        // as first pass for fast correction, then 250ms to catch any re-layout.
        // NOTE: immediate/rAF scrolls conflict with Virtuoso's internal adjustments,
        // so we must wait until Virtuoso settles before correcting.
        if (delta < 0) {
          if (growTimer) clearTimeout(growTimer);
          const scrollToTrueBottom = () => {
            if (!userScrolledRef.current && scrollerElRef.current) {
              const el = scrollerElRef.current;
              const gap = el.scrollHeight - el.clientHeight - el.scrollTop;
              if (gap > 2) {
                lastProgrammaticScrollTimeRef.current = Date.now();
                el.scrollTop = el.scrollHeight - el.clientHeight;
              }
            }
          };
          growTimer = setTimeout(() => {
            scrollToTrueBottom();
            growTimer = setTimeout(scrollToTrueBottom, 200);
          }, 50);
        }
      }
    });

    observer.observe(scrollerEl);
    return () => {
      observer.disconnect();
      if (growTimer) clearTimeout(growTimer);
    };
  }, [scrollerEl]);

  // Mark a real user scroll-up gesture (wheel / touch drag up) as in flight.
  // Programmatic scrollTop changes NEVER emit wheel/touch events, so this is a
  // reliable "the user is driving" signal. But rather than latch here directly,
  // we only open a short intent window and let handleScroll decide from the
  // MAIN scroller's actual delta. That matters two ways:
  //   - wheel/touch events bubble, so a gesture that scrolls a nested overflow
  //     child (code block, diff, tool panel) also reaches this listener; letting
  //     the main-scroller delta decide means a child-consumed scroll (main list
  //     did not move) never falsely pauses auto-follow.
  //   - during fast streaming the programmatic guard is continuously refreshed
  //     and would otherwise swallow the user's scroll-up in handleScroll (#479);
  //     the intent window exempts the ensuing onScroll from that guard.
  useEffect(() => {
    if (!scrollerEl) return;

    const markIntent = () => {
      userScrollIntentUntilRef.current = Date.now() + USER_SCROLL_INTENT_MS;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) markIntent();
    };

    let lastTouchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? null;
      if (y === null || lastTouchY === null) {
        lastTouchY = y;
        return;
      }
      // Finger dragging down (clientY increases) reveals earlier content, i.e.
      // the content scrolls up - the user is reading back through history.
      if (y - lastTouchY > 0) markIntent();
      lastTouchY = y;
    };

    scrollerEl.addEventListener('wheel', onWheel, { passive: true });
    scrollerEl.addEventListener('touchstart', onTouchStart, { passive: true });
    scrollerEl.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      scrollerEl.removeEventListener('wheel', onWheel);
      scrollerEl.removeEventListener('touchstart', onTouchStart);
      scrollerEl.removeEventListener('touchmove', onTouchMove);
    };
  }, [scrollerEl]);

  // Scroll to bottom helper - only for user messages and button clicks
  const scrollToBottom = useCallback(
    (behavior: 'smooth' | 'auto' = 'smooth') => {
      if (!virtuosoRef.current) return;

      lastProgrammaticScrollTimeRef.current = Date.now();
      virtuosoRef.current.scrollToIndex({
        index: itemCount - 1,
        behavior,
        align: 'end',
      });
    },
    [itemCount]
  );

  // Virtuoso native followOutput - handles streaming auto-scroll internally
  // without external scrollToIndex calls that cause jitter.
  // Setting the scroll guard here prevents Virtuoso's auto-scroll adjustments
  // from being misdetected as user scroll-up during streaming.
  // A debounced timer catches residual gaps after streaming ends - Virtuoso's
  // final layout may leave a small gap with no further scroll events to trigger
  // our handleScroll snap.
  const handleFollowOutput = useCallback((_isAtBottom: boolean): false | 'auto' => {
    if (userScrolledRef.current) return false;
    lastProgrammaticScrollTimeRef.current = Date.now();
    if (followOutputTimerRef.current) clearTimeout(followOutputTimerRef.current);
    followOutputTimerRef.current = setTimeout(() => {
      if (!userScrolledRef.current && scrollerElRef.current) {
        const el = scrollerElRef.current;
        const gap = el.scrollHeight - el.clientHeight - el.scrollTop;
        if (gap > 2) {
          lastProgrammaticScrollTimeRef.current = Date.now();
          el.scrollTop = el.scrollHeight - el.clientHeight;
        }
      }
    }, 500);
    return 'auto';
  }, []);

  // Bottom state detection + container resize compensation.
  // When atBottom transitions true → false and user hasn't scrolled up,
  // this is a layout shift (ThoughtDisplay appeared) - scroll back to bottom.
  // NOTE: atBottom=true sets a SHORT guard (50ms) - enough to absorb Virtuoso's
  // internal rAF-based scroll adjustments, but short enough that real user scroll-up
  // (which takes >50ms to travel past atBottomThreshold) won't be blocked.
  // A full 150ms guard here caused jitter: user scrolls up → guard blocks detection
  // → atBottomStateChange(false) scrolls back → cycle.
  const handleAtBottomStateChange = useCallback((atBottom: boolean) => {
    // The scroll-up latch is authoritative. Once the user has scrolled up, ONLY
    // an explicit resume (the scroll-to-bottom button -> hideScrollButton, or
    // sending a message) may clear it. A transient atBottom=true from a mid-stream
    // layout shift, or from a small scroll-up still inside Virtuoso's 100px
    // atBottomThreshold, must NOT clear the latch or snap the user down - that
    // fight was the #479 bug. Keep the button visible while paused.
    if (userScrolledRef.current) {
      setShowScrollButton(true);
      return;
    }

    setShowScrollButton(!atBottom);

    if (atBottom) {
      // Short guard: expire 50ms from now (not the full PROGRAMMATIC_SCROLL_GUARD_MS)
      lastProgrammaticScrollTimeRef.current = Date.now() - (PROGRAMMATIC_SCROLL_GUARD_MS - 50);
      // Close any residual gap within atBottomThreshold (e.g. after ThoughtDisplay
      // disappears or streaming ends, gap may settle at ~50px - still "at bottom"
      // per Virtuoso but visually clipped).
      const el = scrollerElRef.current;
      if (el) {
        const gap = el.scrollHeight - el.clientHeight - el.scrollTop;
        if (gap > 2) {
          el.scrollTop = el.scrollHeight - el.clientHeight;
        }
      }
    } else {
      // Layout shift pushed us off bottom while still following - snap back.
      const el = scrollerElRef.current;
      if (el) {
        lastProgrammaticScrollTimeRef.current = Date.now();
        el.scrollTop = el.scrollHeight - el.clientHeight;
      }
    }
  }, []);

  // Detect user scrolling up
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const currentScrollTop = target.scrollTop;
    const delta = currentScrollTop - lastScrollTopRef.current;

    // Resume auto-follow when the user scrolls back to the TRUE bottom (gap ~0).
    // Runs BEFORE the programmatic guard: the guard only suppresses false
    // scroll-UP latching, it must never block a genuine return to the bottom
    // (e.g. wheeling straight back down within the guard window would otherwise
    // leave the latch stuck). Uses the true bottom, not Virtuoso's 100px
    // atBottomThreshold, so a deliberate small scroll-up is never mistaken for
    // "back at the bottom". While latched, no programmatic scroll runs (every
    // auto-scroll effect is gated on !userScrolledRef.current), so a delta > 0
    // reaching the bottom here is always user-driven.
    if (userScrolledRef.current && delta > 0) {
      const gap = target.scrollHeight - target.clientHeight - currentScrollTop;
      if (gap <= 2) {
        userScrolledRef.current = false;
        setShowScrollButton(false);
      }
    }

    // Ignore scroll events shortly after a programmatic scroll or container
    // resize - UNLESS a real user wheel/touch gesture is in flight, in which
    // case this onScroll reflects the user's own movement and must be evaluated.
    const timeSinceGuard = Date.now() - lastProgrammaticScrollTimeRef.current;
    const userGestureInFlight = Date.now() < userScrollIntentUntilRef.current;
    if (!userGestureInFlight && timeSinceGuard < PROGRAMMATIC_SCROLL_GUARD_MS) {
      lastScrollTopRef.current = currentScrollTop;
      return;
    }

    // Require a larger upward jump than the resting jitter a mid-stream layout
    // shift (orbit/ThoughtDisplay appearing, Virtuoso reflow) can emit, so a
    // spurious small negative delta doesn't permanently kill auto-follow. A
    // real read-history scroll-up travels well past this and still pauses follow.
    if (delta < -USER_SCROLL_UP_DELTA) {
      userScrolledRef.current = true;
      setShowScrollButton(true);
    }

    // When in auto-follow mode and Virtuoso is scrolling down (following content),
    // refresh the scroll guard so Virtuoso's subsequent scroll adjustments (which
    // may produce small negative deltas) won't be misdetected as user scroll-up.
    if (!userScrolledRef.current && delta > 0) {
      lastProgrammaticScrollTimeRef.current = Date.now();
    }

    lastScrollTopRef.current = currentScrollTop;
  }, []);

  // Force scroll when user sends a message
  useEffect(() => {
    const currentListLength = messages.length;
    const prevLength = previousListLengthRef.current;
    const isNewMessage = currentListLength > prevLength;

    previousListLengthRef.current = currentListLength;

    if (!isNewMessage) return;

    const lastMessage = messages[messages.length - 1];

    // User sent a message - force scroll regardless of userScrolled state
    if (lastMessage?.position === 'right') {
      userScrolledRef.current = false;
      // Use double RAF to ensure DOM is updated before scrolling (#977)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (virtuosoRef.current) {
            lastProgrammaticScrollTimeRef.current = Date.now();
            virtuosoRef.current.scrollToIndex({
              index: 'LAST',
              behavior: 'auto',
              align: 'end',
            });
          }
        });
      });
    }
  }, [messages]);

  // Scroll to bottom when streaming content updates existing messages.
  // Virtuoso's followOutput only fires when totalCount changes (new items added),
  // but during ACP/Gemini streaming the existing text message grows in-place
  // without changing the item count. Keying on streamingSignature (count + last
  // message text length) makes this fire on each streamed chunk, not just on
  // array-identity change.
  //
  // The gap-measure-and-scroll runs inside a double requestAnimationFrame so it
  // reads scrollHeight AFTER Virtuoso finishes its rAF-based re-layout (mirrors
  // the user-message scroll above). Reading synchronously here would see a stale
  // scrollHeight and undershoot, leaving the newest line below the fold.
  useEffect(() => {
    if (userScrolledRef.current) return;
    if (!scrollerElRef.current) return;

    let outerRaf = 0;
    let innerRaf = 0;
    outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        if (userScrolledRef.current) return;
        const el = scrollerElRef.current;
        if (!el) return;
        const gap = el.scrollHeight - el.clientHeight - el.scrollTop;
        if (gap > 2) {
          lastProgrammaticScrollTimeRef.current = Date.now();
          el.scrollTop = el.scrollHeight - el.clientHeight;
        }
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
    // streamingSignature changes on in-place text growth as well as count change.
  }, [streamingSig]);

  // Reset the paused-scroll latch when switching conversations. The list view is
  // reused across switches (it does not remount), so without this a scroll-up
  // paused in one chat would leave the next chat stuck not-following.
  useEffect(() => {
    userScrolledRef.current = false;
    setShowScrollButton(false);
  }, [conversationId]);

  // Hide scroll button handler
  const hideScrollButton = useCallback(() => {
    userScrolledRef.current = false;
    setShowScrollButton(false);
  }, []);

  return {
    virtuosoRef,
    handleScrollerRef,
    handleScroll,
    handleAtBottomStateChange,
    handleFollowOutput,
    showScrollButton,
    scrollToBottom,
    hideScrollButton,
  };
}
