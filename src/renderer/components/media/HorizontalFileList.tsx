/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';

interface HorizontalFileListProps {
  children: React.ReactNode;
}

/**
 * Horizontal scrolling file list component
 * Supports left/right scrolling with auto show/hide scroll buttons
 * Used for horizontal display of the file preview list
 */
const HorizontalFileList: React.FC<HorizontalFileListProps> = ({ children }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  /**
   * Check scroll state and decide whether to show the left/right scroll buttons
   * Determines whether the container is scrollable and whether we're at the start/end
   */
  const checkScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Whether horizontal scrolling is possible
    const hasScroll = container.scrollWidth > container.clientWidth;
    // Whether at the start position (left)
    const isAtStart = container.scrollLeft <= 1;
    // Whether at the end position (right)
    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;

    const nextShowScrollButton = hasScroll;
    const nextCanScrollRight = hasScroll && !isAtEnd;
    const nextCanScrollLeft = hasScroll && !isAtStart;

    // Only update when state actually changes to avoid unnecessary re-renders
    setShowScrollButton((prev) => (prev !== nextShowScrollButton ? nextShowScrollButton : prev));
    setCanScrollRight((prev) => (prev !== nextCanScrollRight ? nextCanScrollRight : prev));
    setCanScrollLeft((prev) => (prev !== nextCanScrollLeft ? nextCanScrollLeft : prev));
  }, []);

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    const scheduleCheck = () => {
      if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(checkScroll);
      } else {
        checkScroll();
      }
    };

    // Use ResizeObserver to watch container size changes and auto-update scroll state
    // ResizeObserver already handles most layout changes well
    const resizeObserver = new ResizeObserver(scheduleCheck);
    resizeObserver.observe(container);

    // Listen to scroll events to update button visibility in real time
    container.addEventListener('scroll', checkScroll, { passive: true });

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
      container.removeEventListener('scroll', checkScroll);
    };
  }, [checkScroll]);

  // Re-check once when children change; not declared as a useEffect dependency to avoid frequent re-runs
  useEffect(() => {
    checkScroll();
  }, [children, checkScroll]);

  /**
   * Scroll right by 200px
   */
  const handleScrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: 200,
      behavior: 'smooth',
    });
  };

  /**
   * Scroll left by 200px
   */
  const handleScrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: -200,
      behavior: 'smooth',
    });
  };

  return (
    <div className='relative'>
      {/* Horizontal scroll container with hidden scrollbar */}
      <div
        ref={scrollContainerRef}
        className='flex items-center gap-8px overflow-x-auto overflow-y-hidden scrollbar-hide pt-5px pb-5px'
        style={{
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }}
      >
        {children}
      </div>
      {/* Left scroll button - shown when not at the start */}
      {showScrollButton && canScrollLeft && (
        <div
          className='absolute left-0 top-0 h-full flex items-center cursor-pointer'
          style={{
            background: 'linear-gradient(to left, transparent, var(--dialog-fill-0) 30%)', // left gradient mask
            width: '60px',
            pointerEvents: 'none', // mask layer does not respond to clicks
          }}
        >
          <button
            onClick={handleScrollLeft}
            className='ml-0px w-28px h-28px rd-50% bg-1 flex items-center justify-center hover:bg-2 transition-colors border-1 border-solid b-color-border-2'
            style={{
              pointerEvents: 'auto', // button responds to clicks
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <ChevronLeft style={{ fontSize: '14px', color: 'var(--text-t-primary)' }} />
          </button>
        </div>
      )}
      {/* Right scroll button - shown when not at the end */}
      {showScrollButton && canScrollRight && (
        <div
          className='absolute right-0 top-0 h-full flex items-center cursor-pointer'
          style={{
            background: 'linear-gradient(to right, transparent, var(--dialog-fill-0) 30%)', // right gradient mask
            width: '60px',
            pointerEvents: 'none', // mask layer does not respond to clicks
          }}
        >
          <button
            onClick={handleScrollRight}
            className='ml-auto mr-0px w-28px h-28px rd-50% bg-1 flex items-center justify-center hover:bg-2 transition-colors border-1 border-solid b-color-border-2'
            style={{
              pointerEvents: 'auto', // button responds to clicks
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <ChevronRight style={{ fontSize: '14px', color: 'var(--text-t-primary)' }} />
          </button>
        </div>
      )}
    </div>
  );
};

export default HorizontalFileList;
