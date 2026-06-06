/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef } from 'react';
import { SCROLL_SYNC_DEBOUNCE } from '../constants';

/**
 * Scroll sync hook configuration
 */
interface UseScrollSyncOptions {
  /**
   * Whether to enable scroll sync
   */
  enabled: boolean;

  /**
   * Editor container ref
   */
  editorContainerRef: React.RefObject<HTMLDivElement>;

  /**
   * Preview container ref
   */
  previewContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Scroll sync hook return value
 */
interface UseScrollSyncReturn {
  /**
   * Handle editor scroll event
   */
  handleEditorScroll: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;

  /**
   * Handle preview scroll event
   */
  handlePreviewScroll: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
}

/**
 * Scroll synchronization hook for split-screen mode
 *
 * Synchronizes scroll position between editor and preview based on scroll percentage
 *
 * Uses debounce to avoid circular triggers and performance issues; it prefers
 * requestAnimationFrame to unlock sync state, and falls back to
 * setTimeout + SCROLL_SYNC_DEBOUNCE when unavailable for compatibility and safe degradation.
 *
 * @param options - Scroll sync configuration
 * @returns Scroll event handlers
 */
export const useScrollSync = ({
  enabled,
  editorContainerRef,
  previewContainerRef,
}: UseScrollSyncOptions): UseScrollSyncReturn => {
  const isSyncingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<number | null>(null);

  const scheduleSyncUnlock = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (typeof window.requestAnimationFrame === 'function') {
      rafIdRef.current = window.requestAnimationFrame(() => {
        isSyncingRef.current = false;
        rafIdRef.current = null;
      });
      return;
    }

    timeoutIdRef.current = window.setTimeout(() => {
      isSyncingRef.current = false;
      timeoutIdRef.current = null;
    }, SCROLL_SYNC_DEBOUNCE);
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
      isSyncingRef.current = false;
    };
  }, []);

  const handleEditorScroll = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      if (!enabled || isSyncingRef.current) return;

      isSyncingRef.current = true;
      const previewContainer = previewContainerRef.current;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight || 1);
      if (previewContainer) {
        // Use data attribute to pass target scroll percentage, each component handles it
        previewContainer.dataset.targetScrollPercent = String(scrollPercentage);
        // Also try to set scrollTop directly (for components that support it)
        const targetScroll = scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
        previewContainer.scrollTop = targetScroll;
      }

      scheduleSyncUnlock();
    },
    [enabled, previewContainerRef, scheduleSyncUnlock]
  );

  const handlePreviewScroll = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      if (!enabled || isSyncingRef.current) return;

      isSyncingRef.current = true;
      const editorContainer = editorContainerRef.current;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight || 1);
      if (editorContainer) {
        // Use data attribute to pass target scroll percentage, each component handles it
        editorContainer.dataset.targetScrollPercent = String(scrollPercentage);
        // Also try to set scrollTop directly (for components that support it)
        const targetScroll = scrollPercentage * (editorContainer.scrollHeight - editorContainer.clientHeight);
        editorContainer.scrollTop = targetScroll;
      }

      scheduleSyncUnlock();
    },
    [enabled, editorContainerRef, scheduleSyncUnlock]
  );

  return {
    handleEditorScroll,
    handlePreviewScroll,
  };
};
