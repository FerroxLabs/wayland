/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type CockpitNavigationZone = 'primary' | 'library' | 'footer';

export type CockpitNavigationDestination = {
  id: string;
  label: string;
  path: string;
  zone: CockpitNavigationZone;
  deliberateSteps: 1 | 2;
};

export const COCKPIT_NAVIGATION_DESTINATIONS = [
  { id: 'chats', label: 'Chats', path: '/conversations', zone: 'primary', deliberateSteps: 1 },
  // Artifacts sits directly under Chats because a deliverable belongs to the
  // conversation that produced it - that adjacency is the whole navigation story.
  { id: 'artifacts', label: 'Artifacts', path: '/artifacts', zone: 'primary', deliberateSteps: 1 },
  { id: 'projects', label: 'Projects', path: '/projects', zone: 'primary', deliberateSteps: 1 },
  { id: 'assistants', label: 'Assistants', path: '/assistants', zone: 'library', deliberateSteps: 2 },
  { id: 'workflows', label: 'Workflows', path: '/workflows', zone: 'library', deliberateSteps: 2 },
  { id: 'teams', label: 'Teams', path: '/teams', zone: 'library', deliberateSteps: 2 },
  { id: 'skills', label: 'Skills', path: '/settings/skills', zone: 'library', deliberateSteps: 2 },
  {
    id: 'connections',
    label: 'Connections',
    path: '/settings/mcp-library/browse',
    zone: 'library',
    deliberateSteps: 2,
  },
  { id: 'knowledge', label: 'Memory & wiki', path: '/memory', zone: 'library', deliberateSteps: 2 },
  { id: 'automations', label: 'Automations', path: '/scheduled', zone: 'primary', deliberateSteps: 1 },
  { id: 'activity', label: 'Activity', path: '/mission-control', zone: 'primary', deliberateSteps: 1 },
  { id: 'settings', label: 'Settings', path: '/settings/navigation', zone: 'footer', deliberateSteps: 1 },
] as const satisfies readonly CockpitNavigationDestination[];

/** v0.11.18 top-level capabilities that Cockpit must not hide beyond two actions. */
export const CLASSIC_TOP_LEVEL_CAPABILITY_IDS = [
  'chats',
  'projects',
  'assistants',
  'workflows',
  'teams',
  'knowledge',
  'automations',
  'activity',
  'settings',
] as const;
