/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for listening to external scroll sync requests
 *
 * Uses MutationObserver to listen for data-target-scroll-percent attribute changes
 *
 * @param containerRef - Container ref
 * @param onTargetScroll - Target scroll percentage callback
 */
export const useScrollSyncTarget = (
  containerRef: React.RefObject<HTMLElement> | undefined,
  onTargetScroll: (targetPercent: number) => void
): void => {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-target-scroll-percent') {
          const targetPercent = parseFloat(container.dataset.targetScrollPercent || '0');
          if (!isNaN(targetPercent)) {
            onTargetScroll(targetPercent);
          }
        }
      }
    });

    observer.observe(container, { attributes: true, attributeFilter: ['data-target-scroll-percent'] });
    return () => observer.disconnect();
  }, [containerRef, onTargetScroll]);
};

/**
 * Hook for CodeMirror scroll listening and setting
 *
 * Listens to CodeMirror's internal .cm-scroller element scroll events and provides scroll position setter
 *
 * @param wrapperRef - CodeMirror wrapper element ref
 * @param onScroll - Scroll callback
 * @returns setScrollPercent - Function to set scroll percentage
 */
export const useCodeMirrorScroll = (
  wrapperRef: React.RefObject<HTMLDivElement>,
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void
): { setScrollPercent: (percent: number) => void } => {
  // Listen to CodeMirror's internal scroller scroll events
  useEffect(() => {
    if (!onScroll) return;

    // Delay getting scroller to wait for CodeMirror to render
    const timer = setTimeout(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      // CodeMirror's scroll container is the .cm-scroller element
      const scroller = wrapper.querySelector('.cm-scroller') as HTMLElement;
      if (!scroller) {
        console.warn('[useCodeMirrorScroll] Could not find .cm-scroller element');
        return;
      }

      const handleScroll = () => {
        onScroll(scroller.scrollTop, scroller.scrollHeight, scroller.clientHeight);
      };

      scroller.addEventListener('scroll', handleScroll, { passive: true });

      // Store cleanup function for effect cleanup
      (wrapperRef.current as HTMLDivElement & { __scrollCleanup?: () => void }).__scrollCleanup = () => {
        scroller.removeEventListener('scroll', handleScroll);
      };
    }, 100);

    return () => {
      clearTimeout(timer);
      const wrapper = wrapperRef.current as (HTMLDivElement & { __scrollCleanup?: () => void }) | null;
      wrapper?.__scrollCleanup?.();
    };
  }, [onScroll, wrapperRef]);

  // Set scroll percentage
  const setScrollPercent = useCallback(
    (percent: number) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const scroller = wrapper.querySelector('.cm-scroller') as HTMLElement;
      if (scroller) {
        const targetScroll = percent * (scroller.scrollHeight - scroller.clientHeight);
        scroller.scrollTop = targetScroll;
      }
    },
    [wrapperRef]
  );

  return { setScrollPercent };
};

/**
 * Hook for normal container scroll listening
 *
 * @param containerRef - Container ref
 * @param onScroll - Scroll callback
 */
export const useContainerScroll = (
  containerRef: React.RefObject<HTMLElement>,
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void
): void => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onScroll) return;

    const handleScroll = () => {
      onScroll(container.scrollTop, container.scrollHeight, container.clientHeight);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, onScroll]);
};

/**
 * Hook for normal container scroll sync target (sets scrollTop)
 *
 * @param containerRef - Container ref
 */
export const useContainerScrollTarget = (containerRef: React.RefObject<HTMLElement>): void => {
  const handleTargetScroll = useCallback(
    (targetPercent: number) => {
      const container = containerRef.current;
      if (container) {
        const targetScroll = targetPercent * (container.scrollHeight - container.clientHeight);
        container.scrollTop = targetScroll;
      }
    },
    [containerRef]
  );

  useScrollSyncTarget(containerRef, handleTargetScroll);
};
