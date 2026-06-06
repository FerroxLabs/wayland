/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

/**
 * Preview panel keyboard shortcuts configuration
 */
interface UsePreviewKeyboardShortcutsOptions {
  /**
   * Whether there are unsaved changes
   */
  isDirty?: boolean;

  /**
   * Save callback function
   */
  onSave: () => void;
}

/**
 * Handle preview panel keyboard shortcuts (Cmd/Ctrl + S to save)
 *
 * @param options - Keyboard shortcuts configuration
 */
export const usePreviewKeyboardShortcuts = ({ isDirty, onSave }: UsePreviewKeyboardShortcutsOptions): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Prevent default browser save
        if (isDirty) {
          onSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, onSave]);
};
