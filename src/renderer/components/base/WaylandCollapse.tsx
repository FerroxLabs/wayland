/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import classNames from 'classnames';
import type { CSSProperties } from 'react';
import React, { useMemo, useState } from 'react';

/**
 * Collapsible panel component props
 */
export interface WaylandCollapseProps {
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Default active keys in uncontrolled mode */
  defaultActiveKey?: string | string[];
  /** Active keys in controlled mode */
  activeKey?: string | string[];
  /** Callback when panel state changes */
  onChange?: (keys: string[]) => void;
  /** Accordion mode, only one panel can be expanded at a time */
  accordion?: boolean;
  /** Custom expand icon */
  expandIcon?: (active: boolean) => React.ReactNode;
  /** Expand icon position */
  expandIconPosition?: 'left' | 'right';
  /** Whether to show border */
  bordered?: boolean;
}

/**
 * Collapsible panel item props
 */
export interface WaylandCollapseItemProps {
  /** Unique identifier */
  name: string;
  /** Panel header */
  header: React.ReactNode;
  /** Whether disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Additional header class name */
  headerClassName?: string;
  /** Additional content class name */
  contentClassName?: string;
  /** Additional content style */
  contentStyle?: CSSProperties;
  /** Children content */
  children?: React.ReactNode;
}

/**
 * Normalize keys parameter to array format
 * @param keys - Single key or array of keys
 * @returns Normalized array of keys
 */
const normalizeKeys = (keys?: string | string[]): string[] => {
  if (!keys) return [];
  return Array.isArray(keys) ? keys : [keys];
};

/**
 * Default expand/collapse icon
 */
const DefaultIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={classNames('text-xs text-t-secondary transition-transform duration-200', active && 'rotate-180')}>
    ▼
  </span>
);

/**
 * Collapse item component (used for type checking and structure only)
 */
const WaylandCollapseItem: React.FC<WaylandCollapseItemProps> = ({ children }) => <>{children}</>;
WaylandCollapseItem.displayName = 'WaylandCollapseItem';

/**
 * Collapsible panel component
 *
 * Supports controlled/uncontrolled mode, accordion mode, custom icons, etc.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <WaylandCollapse defaultActiveKey={['1']}>
 *   <WaylandCollapse.Item name="1" header="Panel 1">
 *     Content 1
 *   </WaylandCollapse.Item>
 *   <WaylandCollapse.Item name="2" header="Panel 2">
 *     Content 2
 *   </WaylandCollapse.Item>
 * </WaylandCollapse>
 *
 * // Accordion mode
 * <WaylandCollapse accordion defaultActiveKey="1">
 *   <WaylandCollapse.Item name="1" header="Panel 1">Content 1</WaylandCollapse.Item>
 *   <WaylandCollapse.Item name="2" header="Panel 2">Content 2</WaylandCollapse.Item>
 * </WaylandCollapse>
 *
 * // Custom icon
 * <WaylandCollapse
 *   expandIcon={(active) => <Icon type={active ? 'up' : 'down'} />}
 *   expandIconPosition="right"
 * >
 *   <WaylandCollapse.Item name="1" header="Panel 1">Content 1</WaylandCollapse.Item>
 * </WaylandCollapse>
 * ```
 */
const WaylandCollapseComponent: React.FC<WaylandCollapseProps> & { Item: typeof WaylandCollapseItem } = ({
  children,
  className,
  defaultActiveKey,
  activeKey,
  onChange,
  accordion,
  expandIcon,
  expandIconPosition = 'left',
  bordered = true,
}) => {
  // Determine if in controlled mode
  const isControlled = activeKey !== undefined;
  const [internalKeys, setInternalKeys] = useState<string[]>(normalizeKeys(defaultActiveKey));
  const currentKeys = isControlled ? normalizeKeys(activeKey) : internalKeys;

  // Extract and filter valid child panel items
  const items = useMemo(() => {
    return React.Children.toArray(children).filter((child): child is React.ReactElement<WaylandCollapseItemProps> => {
      return React.isValidElement(child) && child.type === WaylandCollapseItem;
    });
  }, [children]);

  /**
   * Handle panel toggle
   * @param name - Panel unique identifier
   * @param disabled - Whether disabled
   */
  const handleToggle = (name: string, disabled?: boolean) => {
    if (disabled) return;
    let nextKeys: string[];
    if (currentKeys.includes(name)) {
      // Collapse panel
      nextKeys = currentKeys.filter((key) => key !== name);
    } else {
      // Expand panel (accordion mode expands only one)
      nextKeys = accordion ? [name] : [...currentKeys, name];
    }
    if (!isControlled) {
      setInternalKeys(nextKeys);
    }
    onChange?.(nextKeys);
  };

  // Mount state for animation control
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={classNames('rounded-16px  flex flex-col gap-12px bg-2 py-18px px-[12px] md:px-[32px]', className)}>
      {items.map((child) => {
        const {
          name,
          header,
          disabled,
          className: itemClassName,
          headerClassName,
          contentClassName,
          contentStyle,
        } = child.props;
        const isActive = currentKeys.includes(name);
        const iconNode = expandIcon ? expandIcon(isActive) : <DefaultIcon active={isActive} />;
        const itemBorderClass = bordered ? 'border border-solid border-[color:var(--color-border-2)]' : '';
        const contentDividerClass = bordered ? 'border-t border-[color:var(--color-border-2)]' : '';

        return (
          <div
            key={name}
            className={classNames(
              'overflow-hidden rounded-12px',
              itemBorderClass,
              itemClassName,
              disabled && 'opacity-50'
            )}
          >
            {/* Panel header */}
            <div
              onClick={() => handleToggle(name, disabled)}
              className={classNames(
                'flex items-center gap-3 text-left transition-colors py-5px cursor-pointer',
                headerClassName
              )}
            >
              {expandIconPosition === 'left' && <span className='flex items-center'>{iconNode}</span>}
              <div className='flex-1 text-t-primary text-14px leading-22px'>{header}</div>
              {expandIconPosition === 'right' && <span className='flex items-center'>{iconNode}</span>}
            </div>
            {/* Panel content (using grid for smooth animation) */}
            <div className='transition-all duration-300 ease-in-out'>
              {isActive && (
                <div
                  className={classNames(
                    'grid overflow-hidden',
                    mounted && 'transition-all duration-300 ease-in-out',
                    contentClassName
                  )}
                  style={{ gridTemplateRows: '1fr', ...contentStyle }}
                >
                  <div className={classNames('overflow-hidden', contentDividerClass)}>{child.props.children}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

WaylandCollapseComponent.Item = WaylandCollapseItem;

export default WaylandCollapseComponent;
