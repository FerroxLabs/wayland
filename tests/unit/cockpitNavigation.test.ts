import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CLASSIC_TOP_LEVEL_CAPABILITY_IDS,
  COCKPIT_NAVIGATION_DESTINATIONS,
  SETTINGS_NAVIGATION_IDS,
  SETTINGS_ROUTE_PATHS,
} from '@/common/navigation';

describe('Cockpit navigation parity', () => {
  it('keeps every Classic top-level capability within two deliberate actions', () => {
    const byId = new Map(COCKPIT_NAVIGATION_DESTINATIONS.map((destination) => [destination.id, destination]));

    for (const classicId of CLASSIC_TOP_LEVEL_CAPABILITY_IDS) {
      const destination = byId.get(classicId);
      expect(destination, `${classicId} must remain reachable`).toBeDefined();
      expect(destination!.deliberateSteps).toBeLessThanOrEqual(2);
      expect(destination!.path.startsWith('/')).toBe(true);
    }
  });

  /**
   * The approved primary list, now EIGHT items.
   *
   * Artifacts was added deliberately, at the product owner's instruction, to sit
   * directly under Chats exactly as it does in the classic sider - Cockpit had
   * no route to `/artifacts` at all, so a deliverable was unreachable for anyone
   * using this shell. The assertion stays exact and ordered: the approved list
   * changed, the contract did not loosen.
   */
  it('uses the approved eight-item primary mental model', () => {
    const primaryLabels = COCKPIT_NAVIGATION_DESTINATIONS.filter(({ zone }) => zone !== 'library').map(
      ({ label }) => label
    );

    expect(primaryLabels).toEqual(['Chats', 'Artifacts', 'Projects', 'Automations', 'Activity', 'Settings']);
    expect(['New chat', ...primaryLabels.slice(0, 3), 'Library', ...primaryLabels.slice(3)]).toEqual([
      'New chat',
      'Chats',
      'Artifacts',
      'Projects',
      'Library',
      'Automations',
      'Activity',
      'Settings',
    ]);
  });

  it('backs every Cockpit destination with a real renderer route', () => {
    const routerSource = fs.readFileSync(path.join(process.cwd(), 'src/renderer/components/layout/Router.tsx'), 'utf8');

    for (const destination of COCKPIT_NAVIGATION_DESTINATIONS) {
      expect(routerSource, `${destination.id} points to ${destination.path}`).toContain(`path='${destination.path}'`);
    }
  });
});

describe('Cockpit reaches every top-level surface the classic sider does', () => {
  /**
   * ARTIFACTS WAS MISSING FROM COCKPIT ENTIRELY.
   *
   * The parity guard beside this table is `CLASSIC_TOP_LEVEL_CAPABILITY_IDS`,
   * and it is explicitly scoped to "v0.11.18 top-level capabilities". Artifacts
   * shipped after that, so it was never in the list and nothing ever noticed
   * Cockpit had no way to reach `/artifacts` - the classic sider showed it under
   * Chats while Cockpit users had no entry at all.
   *
   * This is the check that is NOT frozen at a version.
   */
  it('offers Artifacts as a primary destination, backed by a real route', () => {
    const artifacts = COCKPIT_NAVIGATION_DESTINATIONS.find((item) => item.id === 'artifacts');
    expect(artifacts, 'Cockpit has no artifacts destination').toBeDefined();
    expect(artifacts?.path).toBe('/artifacts');
    expect(artifacts?.zone).toBe('primary');

    const routerSource = fs.readFileSync(path.join(process.cwd(), 'src/renderer/components/layout/Router.tsx'), 'utf8');
    expect(routerSource).toContain("path='/artifacts'");
  });

  /** The sider has to actually render it, not merely have it in the table. */
  it('renders the Artifacts entry in the Cockpit sider itself', () => {
    const siderSource = fs.readFileSync(
      path.join(process.cwd(), 'src/renderer/components/layout/CockpitSider/index.tsx'),
      'utf8'
    );
    expect(siderSource).toContain("navEntry('artifacts'");
  });
});

describe('Settings navigation contract', () => {
  it('keeps every current Settings destination unique and backed by a real route', () => {
    const routePaths = Object.values(SETTINGS_ROUTE_PATHS);
    const routerSource = fs.readFileSync(path.join(process.cwd(), 'src/renderer/components/layout/Router.tsx'), 'utf8');

    expect(new Set(routePaths).size).toBe(routePaths.length);
    for (const routePath of routePaths) {
      expect(routerSource).toContain(`path='/settings/${routePath}'`);
    }
  });

  it('excludes retired redirect aliases from the current Settings inventory', () => {
    expect(SETTINGS_NAVIGATION_IDS).not.toEqual(
      expect.arrayContaining(['gemini', 'model', 'agent', 'tools', 'display', 'system'])
    );
  });
});
