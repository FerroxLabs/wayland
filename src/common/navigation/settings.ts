/**
 * Canonical built-in Settings information architecture.
 *
 * Order is user-visible. Values are route fragments beneath `/settings/`.
 * Legacy redirects remain in Router; they are deliberately excluded here so
 * parity checks exercise the current product rather than retired surfaces.
 */
export const SETTINGS_ROUTE_PATHS = {
  assistants: 'assistants',
  skills: 'skills',
  commands: 'commands',
  constitution: 'constitution',
  models: 'models',
  agents: 'agents',
  images: 'images',
  voice: 'voice',
  wcore: 'wcore-config',
  webui: 'webui',
  channels: 'channels',
  'mcp-library': 'mcp-library/browse',
  extensions: 'extensions',
  migrate: 'migrate',
  theme: 'theme',
  editor: 'editor',
  navigation: 'navigation',
  general: 'general',
  notifications: 'notifications',
  storage: 'storage',
  ijfw: 'ijfw',
  doctor: 'doctor',
  about: 'about',
} as const;

export type SettingsNavigationId = keyof typeof SETTINGS_ROUTE_PATHS;

export const SETTINGS_NAVIGATION_IDS = Object.freeze(Object.keys(SETTINGS_ROUTE_PATHS) as SettingsNavigationId[]);
