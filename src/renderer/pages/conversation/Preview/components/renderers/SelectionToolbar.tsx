/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { usePreviewContext } from '../../context/PreviewContext';
import type { SelectionPosition } from '@/renderer/hooks/ui/useTextSelection';
import { useTranslation } from 'react-i18next';

interface SelectionToolbarProps {
  selectedText: string; // Selected text
  position: SelectionPosition | null; // Position of selected text
  onClear: () => void; // Callback to clear selection
}

/**
 * Floating toolbar component for text selection
 *
 * Displays when user selects text, providing "Add to chat" functionality
 */
const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ selectedText, position, onClear }) => {
  const { t } = useTranslation();
  const { addToSendBox } = usePreviewContext();

  // Use Floating UI to position toolbar (follow mouse position)
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start', // Display below mouse
    middleware: [
      offset(8), // Distance from mouse
      flip(), // Auto flip to avoid overflow
      shift({ padding: 8 }), // Auto shift to stay within viewport
    ],
    whileElementsMounted: autoUpdate, // Auto update position
  });

  // Update virtual reference element position
  React.useEffect(() => {
    if (position) {
      refs.setReference({
        getBoundingClientRect: () => ({
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
          top: position.y,
          left: position.x,
          right: position.x + position.width,
          bottom: position.y + position.height,
        }),
      });
    }
  }, [position, refs]);

  // Don't render if no text or position
  if (!selectedText || !position) return null;

  // Handle "Add to chat" button click
  // Use mousedown instead of click because selection may be cleared before click fires
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToSendBox(selectedText);
    onClear(); // Clear selection state
  };

  return (
    <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 99999 }}>
      <div
        className='flex items-center px-12px py-8px bg-[var(--color-bg-2)] rd-8px shadow-lg border-1 border-solid border-[var(--color-border-2)] cursor-pointer hover:opacity-80 transition-opacity'
        onMouseDown={handleMouseDown}
      >
        <span className='text-13px text-t-primary font-medium whitespace-nowrap leading-16px'>
          {t('preview.addToChat')}
        </span>
      </div>
    </div>
  );
};

export default SelectionToolbar;
