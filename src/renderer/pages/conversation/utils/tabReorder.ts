/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { arrayMove } from '@dnd-kit/sortable';

/**
 * Move the element at `fromIndex` to `toIndex`, guarding out-of-range and no-op moves.
 * This is the pure core of the `reorderTabs` mutation in {@link ConversationTabsContext},
 * split out so the index math is unit-testable.
 */
export function reorderByIndex<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  return arrayMove(items, fromIndex, toIndex);
}
