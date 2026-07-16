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

  it('uses the approved seven-item primary mental model', () => {
    const primaryLabels = COCKPIT_NAVIGATION_DESTINATIONS.filter(({ zone }) => zone !== 'library').map(
      ({ label }) => label
    );

    expect(primaryLabels).toEqual(['Chats', 'Projects', 'Automations', 'Activity', 'Settings']);
    expect(['New chat', ...primaryLabels.slice(0, 2), 'Library', ...primaryLabels.slice(2)]).toEqual([
      'New chat',
      'Chats',
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
