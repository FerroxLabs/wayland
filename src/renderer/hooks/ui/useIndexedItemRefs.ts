/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { useCallback, useEffect, useRef } from 'react';

export function useIndexedItemRefs<T>(count: number) {
  const itemRefs = useRef<Array<T | null>>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, count);
  }, [count]);

  const setItemRef = useCallback(
    (index: number) => (node: T | null) => {
      itemRefs.current[index] = node;
    },
    []
  );

  return {
    itemRefs,
    setItemRef,
  };
}
