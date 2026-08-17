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

/**
 * Settings surfaces that exist only in the Electron desktop app (#997).
 *
 * The Wayland Core page drives the local engine's `config.toml`, its profile
 * directories and the in-app engine updater. Every `wcoreConfig` WRITE and every
 * local-identity READ behind it is remote-denied in `bridgeAllowlist.ts`
 * (patchField, setBrowserPolicy, setRawEngineMode, setOutputBudget,
 * openEffectiveRuntimeFolder, getSection, getBrowserPolicy, getEffectiveRuntime,
 * plus the whole `wcoreProfiles.*` namespace and `wcoreUpdate.check/install`).
 *
 * Two reads are reachable BY DESIGN, so the page is degraded rather than inert:
 * the token-cap `wcoreConfig.getOutputBudget` (#990) and the presence-only
 * `wcoreToolKeys.list`, which populates the Services and Keys pane with
 * `{id, hasKey}` and never a key value. `bridgeAllowlistWcoreConfig.redteam.test.ts`
 * is the executable statement of that split - prefer it over this prose.
 *
 * So the gate removes attack surface and a mostly-broken destination; it is NOT
 * the security boundary. That is enforced server-side in
 * `src/process/webserver/adapter.ts`, which applies the same allowlist to every
 * remote call regardless of what the client renders.
 */
export const DESKTOP_ONLY_SETTINGS_IDS: readonly SettingsNavigationId[] = Object.freeze(['wcore']);

/** True iff `id` names a settings surface the WebUI/remote client must not reach. */
export const isDesktopOnlySettingsId = (id: string): boolean =>
  (DESKTOP_ONLY_SETTINGS_IDS as readonly string[]).includes(id);

/** The settings nav ids visible on this runtime, in canonical order. */
export const visibleSettingsNavigationIds = (isDesktop: boolean): readonly SettingsNavigationId[] =>
  isDesktop ? SETTINGS_NAVIGATION_IDS : SETTINGS_NAVIGATION_IDS.filter((id) => !isDesktopOnlySettingsId(id));
