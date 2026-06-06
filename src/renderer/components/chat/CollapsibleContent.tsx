/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useThemeContext } from '@/renderer/hooks/context/ThemeContext';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Gradient mask constants
// mask-image mode: fade out content itself, suitable for scenarios with background color (like Alert)
const MASK_GRADIENT =
  'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 60%, rgba(0, 0, 0, 0.4) 90%, rgba(0, 0, 0, 0) 100%)';

// Background gradient mode: use fixed color mask, suitable for normal scenarios
const BG_GRADIENT_DARK =
  'linear-gradient(to bottom, rgba(30, 30, 30, 0) 0%, rgba(30, 30, 30, 0.6) 40%, rgba(30, 30, 30, 0.95) 80%, rgba(30, 30, 30, 1) 100%)';
const BG_GRADIENT_LIGHT =
  'linear-gradient(to bottom, rgba(247, 248, 250, 0) 0%, rgba(247, 248, 250, 0.6) 40%, rgba(247, 248, 250, 0.95) 80%, rgba(247, 248, 250, 1) 100%)';

interface CollapsibleContentProps {
  children: React.ReactNode;
  /**
   * Maximum height in pixels, show expand/collapse button when content exceeds this height
   * @default 240
   */
  maxHeight?: number;
  /**
   * Whether initially collapsed
   * @default true
   */
  defaultCollapsed?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Content area className
   */
  contentClassName?: string;
  /**
   * Whether to use mask mode (suitable for scenarios with background color, like Alert)
   * @default false
   */
  useMask?: boolean;
  /**
   * Allow horizontal scrolling to prevent clipping wide content
   */
  allowHorizontalScroll?: boolean;
}

/**
 * Collapsible content component with expand/collapse functionality
 *
 * Features:
 * - Auto-detect content height and show collapse button
 * - Gradient mask for natural content fade-out
 * - Support light/dark theme
 *
 * @example
 * ```tsx
 * <CollapsibleContent maxHeight={200}>
 *   <div>Very long content...</div>
 * </CollapsibleContent>
 * ```
 */
export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  children,
  maxHeight = 240,
  defaultCollapsed = true,
  className,
  contentClassName,
  useMask = false,
  allowHorizontalScroll = false,
}) => {
  const { t } = useTranslation(); // i18n
  const { theme } = useThemeContext(); // Theme context (light/dark)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed); // Collapse state
  const [needsCollapse, setNeedsCollapse] = useState(false); // Whether collapse feature is needed
  const contentRef = useRef<HTMLDivElement>(null); // Content container ref

  // Detect content height using ResizeObserver
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    // Helper function to check content height
    let rafId: number | null = null;
    const scheduleHeightCheck = () => {
      const update = () => {
        const contentHeight = element.scrollHeight;
        setNeedsCollapse(contentHeight > maxHeight);
      };

      if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        rafId = window.requestAnimationFrame(update);
      } else {
        update();
      }
    };

    // Use ResizeObserver instead of setTimeout for more accurate content change detection
    // ResizeObserver is fully supported in Electron, but add check for enhanced compatibility
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        scheduleHeightCheck();
      });

      resizeObserver.observe(element);

      // Initial check
      scheduleHeightCheck();

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        resizeObserver.disconnect();
      };
    } else {
      // Fallback: use setTimeout if ResizeObserver is unavailable (should not happen in practice)
      const timer = setTimeout(scheduleHeightCheck, 100);
      return () => {
        clearTimeout(timer);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };
    }
  }, [children, maxHeight]);

  // Toggle collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Calculate content area style
  const contentStyle = useMemo(() => {
    const style: React.CSSProperties = {
      maxHeight: isCollapsed ? `${maxHeight}px` : undefined,
      overflowX: allowHorizontalScroll ? 'auto' : 'hidden',
      overflowY: isCollapsed ? 'hidden' : 'visible',
    };

    if (!allowHorizontalScroll && !isCollapsed) {
      style.overflowX = 'visible';
    }

    // mask-image mode: fade out content itself
    if (useMask && isCollapsed) {
      style.maskImage = MASK_GRADIENT;
      style.WebkitMaskImage = MASK_GRADIENT;
    }

    return style;
  }, [allowHorizontalScroll, isCollapsed, maxHeight, useMask]);

  // Calculate background gradient color
  const bgGradient = useMemo(() => {
    return theme === 'dark' ? BG_GRADIENT_DARK : BG_GRADIENT_LIGHT;
  }, [theme]);

  return (
    <div className={classNames('relative', className)}>
      {/* Content area */}
      <div
        ref={contentRef}
        className={classNames('transition-all duration-300', contentClassName)}
        style={contentStyle}
      >
        {children}
      </div>

      {/* Gradient mask (only shown in non-mask mode when collapsed and content exceeds)
          Multi-step gradient for content fade-out effect:
          - 0%: Fully transparent, content clearly visible
          - 40%: 60% opacity, content faintly visible
          - 80%: 95% opacity, content barely visible
          - 100%: Fully opaque, blends with background */}
      {!useMask && needsCollapse && isCollapsed && (
        <div
          className='absolute bottom-0 left-0 right-0 pointer-events-none'
          style={{
            height: '80px',
            background: bgGradient,
          }}
        />
      )}

      {/* Expand/Collapse button */}
      {needsCollapse && (
        <div className='flex justify-center relative z-10'>
          <button
            onClick={toggleCollapse}
            className='flex items-center gap-1 px-3 py-1.5 text-sm text-t-primary hover:text-primary transition-colors cursor-pointer border-none bg-transparent font-medium [&_svg]:transition-colors [&_svg]:inline-block [&_svg]:align-middle'
            type='button'
          >
            {isCollapsed ? (
              <>
                {/* Expand more */}
                <span className='leading-none'>{t('common.expandMore')}</span>
                <ChevronDown size={14} className='inline-block' />
              </>
            ) : (
              <>
                {/* Collapse */}
                <span className='leading-none'>{t('common.collapse')}</span>
                <ChevronUp size={14} className='inline-block' />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CollapsibleContent;
