/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useLayoutEffect, useCallback } from 'react';

/**
 * Keep the latest reference of a value to avoid closure trap
 *
 * @example
 * ```tsx
 * const setContentRef = useLatestRef(setContent);
 * useEffect(() => {
 *   const handler = (text: string) => {
 *     setContentRef.current(text);
 *   };
 *   // ...
 * }, []); // Empty deps so handler is not re-registered when setContent changes
 * ```
 *
 * @param value - The value to keep latest reference
 * @returns A ref object containing the latest value
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);

  // Use useLayoutEffect to ensure synchronous update before render completes
  useLayoutEffect(() => {
    ref.current = value;
  });

  return ref;
}

/**
 * Return a stable function reference that always calls the latest function internally
 *
 * @example
 * ```tsx
 * const handleClick = useLatestCallback((text: string) => {
 *   setContent(text); // Always uses the latest setContent
 * });
 *
 * useEffect(() => {
 *   setSendBoxHandler(handleClick);
 * }, []); // Empty deps so handleClick reference stays stable
 * ```
 *
 * @param fn - The function to keep latest reference
 * @returns A stable function wrapper
 */
export function useLatestCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useLatestRef(fn);

  // Return a stable function reference (empty dependency array)
  return useCallback(
    ((...args: any[]) => {
      return ref.current(...args);
    }) as T,
    [] // Empty deps to ensure stable reference
  );
}
