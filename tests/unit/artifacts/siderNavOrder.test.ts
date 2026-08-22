/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WHERE ARTIFACTS SITS IN THE SIDER.
 *
 * The shelf is only findable if it is next to the thing that fills it. Sean's
 * written brief puts Artifacts DIRECTLY UNDER Chats; it lived between Teams and
 * Memory, eight entries down, which is where a feature goes to not be used.
 *
 * This pins the ADJACENCY, not an absolute index, so inserting an unrelated
 * entry lower down does not fail the test while genuinely separating the two
 * still does. It also pins that the array is what renders (`Sider/index.tsx`
 * maps SIDER_NAV_ITEMS directly) by asserting every id stays present - an
 * "order only" change that drops an entry would take a page out of Settings >
 * Navigation as well as out of the sider.
 */

import { describe, expect, it } from 'vitest';

import { SIDER_NAV_ITEMS } from '@renderer/components/layout/Sider/navItems';

describe('the sider nav order', () => {
  it('puts Artifacts directly under Chats', () => {
    const ids = SIDER_NAV_ITEMS.map((item) => item.id);
    const chats = ids.indexOf('sessions');
    const artifacts = ids.indexOf('artifacts');

    // Known positives first: a missing id would make the adjacency check below
    // pass vacuously at -1 and 0.
    expect(chats, 'the Chats entry must exist').toBeGreaterThanOrEqual(0);
    expect(artifacts, 'the Artifacts entry must exist').toBeGreaterThanOrEqual(0);

    expect(artifacts).toBe(chats + 1);
  });

  it('is order-only: every nav entry survives, exactly once', () => {
    const ids = SIDER_NAV_ITEMS.map((item) => item.id);
    // The full roster as shipped. Reordering is the change under review;
    // LOSING one would silently remove a page from the sider AND from the
    // Settings > Navigation visibility list, which is not order-only.
    expect(new Set(ids)).toEqual(
      new Set([
        'artifacts',
        'assistants',
        'memory',
        'mission-control',
        'projects',
        'scheduled',
        'search',
        'sessions',
        'teams',
        'workflows',
      ])
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});
