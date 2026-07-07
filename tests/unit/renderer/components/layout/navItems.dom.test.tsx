// @vitest-environment jsdom

/**
 * #118 - the sider top-zone nav entries come from a config-driven registry.
 * These tests lock the ORDER (Mission Control last, below Memory — 0.11.15),
 * the id set, and that each
 * entry's `render` still threads the bespoke `isActive` / click wiring through
 * to its live component.
 */

import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SIDER_NAV_ITEMS, type SiderNavContext } from '@renderer/components/layout/Sider/navItems';

const makeCtx = (overrides: Partial<SiderNavContext> = {}): SiderNavContext => ({
  pathname: '/guid',
  isMobile: false,
  collapsed: false,
  siderTooltipProps: {} as SiderNavContext['siderTooltipProps'],
  onTopZoneNav: vi.fn(),
  onAssistantsClick: vi.fn(),
  onConversationSelect: vi.fn(),
  onSessionClick: vi.fn(),
  ...overrides,
});

/** Render an item to a React element and expose its props for assertions. */
const propsOf = (id: string, ctx: SiderNavContext): Record<string, unknown> => {
  const item = SIDER_NAV_ITEMS.find((entry) => entry.id === id);
  if (!item) throw new Error(`no nav item ${id}`);
  const element = item.render(ctx) as ReactElement;
  return element.props as Record<string, unknown>;
};

describe('SIDER_NAV_ITEMS registry (#118)', () => {
  it('lists Mission Control last (below Memory, 0.11.15)', () => {
    expect(SIDER_NAV_ITEMS[SIDER_NAV_ITEMS.length - 1].id).toBe('mission-control');
  });

  it('has the expected entries in order', () => {
    expect(SIDER_NAV_ITEMS.map((i) => i.id)).toEqual([
      'sessions',
      'search',
      'projects',
      'assistants',
      'workflows',
      'scheduled',
      'teams',
      'memory',
      'mission-control',
    ]);
  });

  it('every entry carries unique id + label + icon + render', () => {
    const ids = SIDER_NAV_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of SIDER_NAV_ITEMS) {
      expect(item.labelKey).toBeTruthy();
      expect(item.defaultLabel).toBeTruthy();
      expect(item.icon).toBeTruthy();
      expect(typeof item.render).toBe('function');
    }
  });
});

describe('registry render wiring preserves bespoke behavior (#118)', () => {
  it('derives isActive from pathname per entry', () => {
    expect(propsOf('mission-control', makeCtx({ pathname: '/mission-control' })).isActive).toBe(true);
    expect(propsOf('mission-control', makeCtx({ pathname: '/guid' })).isActive).toBe(false);
    expect(propsOf('sessions', makeCtx({ pathname: '/conversations/x' })).isActive).toBe(true);
    expect(propsOf('projects', makeCtx({ pathname: '/project/abc' })).isActive).toBe(true);
    // Assistants uses an exact match, not startsWith.
    expect(propsOf('assistants', makeCtx({ pathname: '/assistants' })).isActive).toBe(true);
    expect(propsOf('assistants', makeCtx({ pathname: '/assistants/settings' })).isActive).toBe(false);
    // Memory is active for both /memory and /wiki.
    expect(propsOf('memory', makeCtx({ pathname: '/wiki/page' })).isActive).toBe(true);
    expect(propsOf('memory', makeCtx({ pathname: '/memory' })).isActive).toBe(true);
  });

  it('routes top-zone clicks through onTopZoneNav with the right target', () => {
    const ctx = makeCtx();
    (propsOf('teams', ctx).onClick as () => void)();
    expect(ctx.onTopZoneNav).toHaveBeenCalledWith('/teams');
    (propsOf('workflows', ctx).onClick as () => void)();
    expect(ctx.onTopZoneNav).toHaveBeenCalledWith('/workflows');
  });

  it('wires the assistants entry to its bespoke handler', () => {
    const ctx = makeCtx();
    (propsOf('assistants', ctx).onClick as () => void)();
    expect(ctx.onAssistantsClick).toHaveBeenCalledTimes(1);
    expect(ctx.onTopZoneNav).not.toHaveBeenCalled();
  });

  it('passes search the conversation-select + session handlers, not an onClick', () => {
    const ctx = makeCtx();
    const searchProps = propsOf('search', ctx);
    expect(searchProps.onConversationSelect).toBe(ctx.onConversationSelect);
    expect(searchProps.onSessionClick).toBe(ctx.onSessionClick);
    expect(searchProps.onClick).toBeUndefined();
  });
});
