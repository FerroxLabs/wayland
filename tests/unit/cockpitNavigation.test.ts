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

  // Was a seven-item model. Artifacts was added as an eighth, directly under
  // Chats, because a deliverable belongs to the conversation that produced it
  // and Classic already carries it in that slot. The assertions stay exact and
  // stay ordered - the model grew by a deliberate decision, it was not relaxed.
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

  it('puts Artifacts directly under Chats in both shells', () => {
    const primaryIds = COCKPIT_NAVIGATION_DESTINATIONS.filter(({ zone }) => zone !== 'library').map(({ id }) => id);
    expect(primaryIds.indexOf('artifacts')).toBe(primaryIds.indexOf('chats') + 1);

    // The Cockpit rail renders from this registry, so a destination that exists
    // but is never rendered is the exact defect this covers: Classic shipped the
    // entry and Cockpit did not, and nothing caught it.
    const cockpitSource = fs.readFileSync(
      path.join(process.cwd(), 'src/renderer/components/layout/CockpitSider/index.tsx'),
      'utf8'
    );
    expect(cockpitSource).toContain("navEntry('artifacts'");
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
