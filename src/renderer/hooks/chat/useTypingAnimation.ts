/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';

interface UseTypingAnimationOptions {
  content: string; // Original content
  enabled?: boolean; // Whether to enable animation
  speed?: number; // Typing speed (characters per second)
}

/**
 * Typing animation Hook
 *
 * Used to implement character-by-character display for streaming content, commonly used for real-time AI content display
 *
 * @example
 * ```tsx
 * const { displayedContent, isAnimating } = useTypingAnimation({
 *   content: streamingText,
 *   enabled: viewMode === 'preview',
 *   speed: 50, // 50 chars/sec
 * });
 * ```
 */
export const useTypingAnimation = ({ content, enabled = true, speed = 50 }: UseTypingAnimationOptions) => {
  const [displayedContent, setDisplayedContent] = useState(content); // Currently displayed content
  const [isAnimating, setIsAnimating] = useState(false); // Whether typing animation is active
  const animationFrameRef = useRef<number | null>(null); // Animation frame ID
  const targetContentRef = useRef(content); // Target content

  useEffect(() => {
    // If animation disabled, show full content immediately
    if (!enabled) {
      setDisplayedContent(content);
      setIsAnimating(false);
      return;
    }

    targetContentRef.current = content;

    // If content unchanged, do nothing
    if (content === displayedContent) {
      return;
    }

    // If displayedContent is empty, it's the first load, show immediately
    if (displayedContent.length === 0) {
      setDisplayedContent(content);
      setIsAnimating(false);
      return;
    }

    // Calculate content change amount
    const contentDiff = content.length - displayedContent.length;

    // If content got shorter or increased by a lot (>1000 chars), show immediately - not a streaming update.
    // Only trigger typing animation for incremental updates
    if (contentDiff < 0 || contentDiff > 1000) {
      setDisplayedContent(content);
      setIsAnimating(false);
      return;
    }

    // Start typing animation
    setIsAnimating(true);
    let currentIndex = displayedContent.length;
    const targetContent = content;

    // Characters per second
    const charsPerSecond = speed;
    const msPerChar = 1000 / charsPerSecond;

    let lastTimestamp = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - lastTimestamp;

      // Show one character every msPerChar milliseconds
      if (elapsed >= msPerChar) {
        const charsToAdd = Math.floor(elapsed / msPerChar);
        currentIndex = Math.min(currentIndex + charsToAdd, targetContent.length);
        lastTimestamp = timestamp;

        setDisplayedContent(targetContent.substring(0, currentIndex));

        // If not finished, continue animation
        if (currentIndex < targetContent.length) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          animationFrameRef.current = null;
        }
      } else {
        // Keep waiting
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [content, displayedContent, enabled, speed]);

  return {
    displayedContent,
    isAnimating,
  };
};
