/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import classNames from 'classnames';
import React from 'react';

/**
 * Custom scroll area component
 *
 * Provides unified scrollbar styling, supports vertical, horizontal or both directions
 *
 * @example
 * ```tsx
 * // Vertical scroll (default)
 * <WaylandScrollArea className="h-400px">
 *   <div>Content...</div>
 * </WaylandScrollArea>
 *
 * // Horizontal scroll
 * <WaylandScrollArea direction="x" className="w-400px">
 *   <div className="whitespace-nowrap">Content...</div>
 * </WaylandScrollArea>
 *
 * // Both directions
 * <WaylandScrollArea direction="both" className="h-400px w-400px">
 *   <div>Content...</div>
 * </WaylandScrollArea>
 * ```
 */
interface WaylandScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Scroll direction: y-vertical, x-horizontal, both-bidirectional */
  direction?: 'y' | 'x' | 'both';
  /** Whether to disable scrolling (used for embedded page display) */
  disableOverflow?: boolean;
}

const WaylandScrollArea: React.FC<WaylandScrollAreaProps> = ({
  children,
  className,
  direction = 'y',
  disableOverflow = false,
  ...rest
}) => {
  // Set overflow class based on direction
  const overflowClass = disableOverflow
    ? ''
    : direction === 'both'
      ? 'overflow-auto'
      : direction === 'x'
        ? 'overflow-x-auto overflow-y-hidden'
        : 'overflow-y-auto overflow-x-hidden';

  return (
    <div
      data-scroll-area=''
      className={classNames(overflowClass, disableOverflow && 'overflow-visible', className)}
      {...rest}
    >
      {children}
    </div>
  );
};

WaylandScrollArea.displayName = 'WaylandScrollArea';

export default WaylandScrollArea;
