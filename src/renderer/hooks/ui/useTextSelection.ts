/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

// Selection position information
export interface SelectionPosition {
  x: number; // Horizontal position
  y: number; // Vertical position
  width: number; // Selection width
  height: number; // Selection height
}

/**
 * Text selection Hook that monitors text selection events within a container
 *
 * @param containerRef - Container reference
 * @returns Selected text, position info, and clear function
 */
export const useTextSelection = (containerRef: React.RefObject<HTMLElement>, enabled = true) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<SelectionPosition | null>(null);

  // Handle selection change event
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';

    // Clear state if no text selected
    if (!text) {
      setSelectedText('');
      setSelectionPosition(null);
      return;
    }

    // Check if selected text is within the container
    if (containerRef.current && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = containerRef.current;

      if (!container.contains(range.commonAncestorContainer)) {
        setSelectedText('');
        setSelectionPosition(null);
        return;
      }

      setSelectedText(text);
      // Position is set by mouseup event
    }
  }, [containerRef]);

  // Handle mouseup to position toolbar at mouse location
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (!text || !containerRef.current || !selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        return;
      }

      // Use mouse position for toolbar
      setSelectionPosition({
        x: e.clientX,
        y: e.clientY,
        width: 0,
        height: 0,
      });
    },
    [containerRef]
  );

  // Listen to selection change events
  useEffect(() => {
    if (!enabled) {
      setSelectedText('');
      setSelectionPosition(null);
      return;
    }

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enabled, handleSelectionChange, handleMouseUp]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  return { selectedText, selectionPosition, clearSelection };
};
