/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #729 — status-colour semantics for the WCore badge family.
 *
 * The rule: a badge reports STATE. Green = active/enabled/connected/running,
 * amber = pending, red = error. The brand accent (--wc-accent, #ff6b35) marks
 * SELECTION — nav rail, focus ring — and must never encode health, because an
 * orange "Active" pill reads as a warning. That is exactly what the reporter
 * hit: the profile was fully active, but the badge looked like a caution.
 *
 * Asserting the class name alone would be hollow — `.ok` could be repainted
 * orange tomorrow and a class-name test would still pass. So this pins the whole
 * chain: the badge takes `.ok`, `.ok` resolves to the SUCCESS token, and no
 * badge rule anywhere in the family reaches for the accent.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _k,
  }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    wcoreProfiles: {
      list: { invoke: () => mockList() },
      activate: { invoke: vi.fn() },
      create: { invoke: vi.fn() },
      remove: { invoke: vi.fn() },
    },
  },
}));

import ProfilesPane from '@/renderer/pages/settings/WCoreConfig/panes/ProfilesPane';

const PANES_CSS = join(__dirname, '../../../../src/renderer/pages/settings/WCoreConfig/panes/Panes.module.css');

/**
 * The `.badge.<x>` rule bodies, keyed SEPARATELY for the pill and its dot —
 * `ok` and `ok .bd`.
 *
 * Merging them (the obvious implementation) makes every assertion vacuous: the
 * dot's `background: var(--wc-success)` alone satisfies a "does .ok use success?"
 * check, so deleting the PILL's colour+background entirely still passes. That
 * ships a badge with default text on a transparent pill. Keep them apart.
 *
 * Scope limit, stated rather than implied: this reads the `.badge` family in
 * Panes.module.css only. Sibling status chips (.engineChip, .railOk) live in
 * WCoreConfig.module.css and are not covered here.
 */
function badgeRules(): Map<string, string> {
  const css = readFileSync(PANES_CSS, 'utf-8');
  const rules = new Map<string, string>();
  const re = /\.badge\.([A-Za-z0-9_-]+)(\s+\.bd)?\s*\{([^}]*)\}/g;
  for (let m = re.exec(css); m !== null; m = re.exec(css)) {
    const key = m[2] ? `${m[1]} .bd` : m[1];
    rules.set(key, (rules.get(key) ?? '') + m[3]);
  }
  return rules;
}

/**
 * Exact CSS-module class membership. Vite hashes the class (`ok` → `_ok_90b120`),
 * so match the un-hashed name exactly rather than substring-testing the whole
 * className — `toContain('ok')` would also pass on `notok`.
 *
 * This is backed by real CSS-module resolution, not a stub: a class that is not
 * in the stylesheet resolves to `undefined`, so these assertions cannot be
 * satisfied by the TSX alone.
 */
function hasClass(el: Element, name: string): boolean {
  return el.className
    .split(/\s+/)
    .filter(Boolean)
    .some((c) => c === name || new RegExp(`^_${name}_`).test(c));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockList.mockResolvedValue([
    { name: 'work', active: true, dir: '/Users/u/.wayland/profiles/work' },
    { name: 'personal', active: false, dir: '/Users/u/.wayland/profiles/personal' },
  ]);
});

describe('#729: an active profile is GREEN (healthy), not brand-orange (warning)', () => {
  it('paints the active profile badge with the ok/success variant', async () => {
    render(<ProfilesPane />);

    const badge = await waitFor(() => {
      const el = screen.getByText('Active').closest('span');
      if (!el) throw new Error('the Active badge never rendered');
      return el;
    });

    expect(hasClass(badge, 'ok'), `expected the ok class, got "${badge.className}"`).toBe(true);
    // The pre-fix class. Re-introducing it paints a healthy state with the brand
    // accent and turns this red.
    expect(hasClass(badge, 'activeBadge')).toBe(false);
  });

  it('shows no Active badge on a profile that is not active', async () => {
    mockList.mockResolvedValue([{ name: 'personal', active: false, dir: '/p' }]);
    render(<ProfilesPane />);
    await waitFor(() => expect(screen.getByText('personal')).toBeTruthy());
    expect(screen.queryByText('Active')).toBeNull();
  });
});

describe('#729: the badge family encodes the colour rule (not just the class name)', () => {
  it('the .ok PILL itself is painted with the success token', () => {
    // Asserted on the pill, not the dot. Delete `.badge.ok { color; background }`
    // and this fails even though `.badge.ok .bd` still paints a green dot.
    const pill = badgeRules().get('ok');
    expect(pill, '.badge.ok rule is missing from Panes.module.css').toBeDefined();
    expect(pill).toContain('color: var(--wc-success)');
    expect(pill).toContain('background: var(--wc-success-dim)');
  });

  it('the .ok DOT is painted with the success token', () => {
    expect(badgeRules().get('ok .bd')).toContain('--wc-success');
  });

  it('NO badge variant is painted with the brand accent', () => {
    // --wc-accent is selection, never health. This is the actual regression
    // guard: repaint `.ok` (or any new variant) with the accent and this fails,
    // even though the class name would still say "ok".
    const offenders = [...badgeRules().entries()]
      .filter(([, body]) => body.includes('--wc-accent'))
      .map(([variant]) => `.badge.${variant}`);

    expect(offenders, `status badges must not use the brand accent: ${offenders.join(', ')}`).toEqual([]);
  });
});
