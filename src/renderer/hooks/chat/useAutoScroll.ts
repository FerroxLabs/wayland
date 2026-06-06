/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

interface UseAutoScrollOptions {
  containerRef: React.RefObject<HTMLDivElement>; // Container ref
  content: string; // Content (for watching changes)
  enabled?: boolean; // Whether to enable auto-scroll
  threshold?: number; // Distance from bottom threshold to trigger auto-scroll (px)
  behavior?: ScrollBehavior; // Scroll behavior
}

/**
 * Smart auto-scroll Hook
 *
 * When content updates, if user is near bottom, auto-scroll to bottom
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * useAutoScroll({
 *   containerRef,
 *   content: streamingText,
 *   enabled: true,
 *   threshold: 200, // Follow when within 200px of the bottom
 * });
 * ```
 */
export const useAutoScroll = ({
  containerRef,
  content,
  enabled = true,
  threshold = 200,
  behavior = 'smooth',
}: UseAutoScrollOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Calculate distance from bottom
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    // If distance from bottom is less than threshold, auto-scroll to bottom
    if (distanceToBottom < threshold) {
      container.scrollTo({ top: scrollHeight, behavior });
    }
  }, [content, enabled, threshold, behavior, containerRef]);
};
