/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PreviewTab } from './PreviewTabs';

/**
 * Context menu state
 */
export interface ContextMenuState {
  /**
   * Whether to show menu
   */
  show: boolean;

  /**
   * Menu X coordinate
   */
  x: number;

  /**
   * Menu Y coordinate
   */
  y: number;

  /**
   * Associated tab ID
   */
  tabId: string | null;
}

/**
 * PreviewContextMenu component props
 */
interface PreviewContextMenuProps {
  /**
   * Context menu state
   */
  contextMenu: ContextMenuState;

  /**
   * Tabs list
   */
  tabs: PreviewTab[];

  /**
   * Current theme
   */
  currentTheme: 'light' | 'dark';

  /**
   * Close menu callback
   */
  onClose: () => void;

  /**
   * Close tabs to the left
   */
  onCloseLeft: (tabId: string) => void;

  /**
   * Close tabs to the right
   */
  onCloseRight: (tabId: string) => void;

  /**
   * Close other tabs
   */
  onCloseOthers: (tabId: string) => void;

  /**
   * Close all tabs
   */
  onCloseAll: () => void;
}

/**
 * Preview panel context menu component
 *
 * Provides functions to close left/right/other/all tabs
 */
const PreviewContextMenu: React.FC<PreviewContextMenuProps> = ({
  contextMenu,
  tabs,
  currentTheme,
  onClose,
  onCloseLeft,
  onCloseRight,
  onCloseOthers,
  onCloseAll,
}) => {
  const { t } = useTranslation();
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!contextMenu.show) return;
      // Don't close if clicking inside menu
      if (contextMenuRef.current && contextMenuRef.current.contains(e.target as Node)) {
        return;
      }
      onClose();
    };

    // Use mousedown instead of click to avoid conflicts with context menu onClick
    document.addEventListener('mousedown', handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.show, onClose]);

  if (!contextMenu.show || !contextMenu.tabId) {
    return null;
  }

  const currentIndex = tabs.findIndex((t) => t.id === contextMenu.tabId);
  const hasLeftTabs = currentIndex > 0;
  const hasRightTabs = currentIndex >= 0 && currentIndex < tabs.length - 1;
  const hasOtherTabs = tabs.length > 1;

  return (
    <div
      ref={contextMenuRef}
      className='fixed shadow-lg rd-8px py-4px z-9999'
      style={{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`,
        backgroundColor: currentTheme === 'dark' ? '#1d1d1f' : '#ffffff',
        border: '1px solid var(--border-base, #e5e6eb)',
        minWidth: '140px',
      }}
    >
      {/* Close tabs to the left */}
      <div
        className={`px-12px py-8px text-12px transition-colors ${hasLeftTabs ? 'cursor-pointer text-t-primary hover:bg-bg-3' : 'opacity-50 cursor-not-allowed text-t-tertiary'}`}
        onClick={() => hasLeftTabs && onCloseLeft(contextMenu.tabId!)}
      >
        {t('preview.closeLeft')}
      </div>

      {/* Close tabs to the right */}
      <div
        className={`px-12px py-8px text-12px transition-colors ${hasRightTabs ? 'cursor-pointer text-t-primary hover:bg-bg-3' : 'opacity-50 cursor-not-allowed text-t-tertiary'}`}
        onClick={() => hasRightTabs && onCloseRight(contextMenu.tabId!)}
      >
        {t('preview.closeRight')}
      </div>

      {/* Close other tabs */}
      <div
        className={`px-12px py-8px text-12px transition-colors ${hasOtherTabs ? 'cursor-pointer text-t-primary hover:bg-bg-3' : 'opacity-50 cursor-not-allowed text-t-tertiary'}`}
        onClick={() => hasOtherTabs && onCloseOthers(contextMenu.tabId!)}
      >
        {t('preview.closeOthers')}
      </div>

      {/* Divider */}
      <div className='h-1px bg-border-1 my-4px mx-8px' />

      {/* Close all tabs */}
      <div
        className='px-12px py-8px text-12px text-t-primary cursor-pointer hover:bg-bg-3 transition-colors'
        onClick={onCloseAll}
      >
        {t('preview.closeAll')}
      </div>
    </div>
  );
};

export default PreviewContextMenu;
