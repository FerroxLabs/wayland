/**
 * Declarative registry of every settings page, action, and setting.
 * Each entry maps to a navigable path within /settings/*.
 */

export type SearchEntry = {
  /** Unique key for React rendering */
  id: string;
  /** Display title shown in palette results */
  title: string;
  /** Secondary descriptor (e.g. page name) */
  subtitle?: string;
  /** Router path segment, e.g. "providers" → /settings/providers */
  path: string;
  /** Optional anchor fragment within the page */
  anchor?: string;
};

const ENTRIES: SearchEntry[] = [
  // Pages
  { id: 'page-assistants', title: 'Assistants', subtitle: 'Page', path: 'assistants' },
  { id: 'page-agents', title: 'Agents', subtitle: 'Page', path: 'agents' },
  { id: 'page-skills', title: 'Skills & Tools', subtitle: 'Page', path: 'skills' },
  { id: 'page-constitution', title: 'Constitution', subtitle: 'Page', path: 'constitution' },
  { id: 'page-providers', title: 'Models & Providers', subtitle: 'Page', path: 'models' },
  { id: 'page-channels', title: 'Channels', subtitle: 'Page', path: 'channels' },
  {
    id: 'mcp-library-browse',
    title: 'MCP Library - Browse',
    subtitle: 'Page',
    path: 'mcp-library/browse',
  },
  {
    id: 'mcp-library-installed',
    title: 'MCP Library - Installed',
    subtitle: 'Page',
    path: 'mcp-library/installed',
  },
  {
    id: 'mcp-add-custom',
    title: 'Add custom MCP server',
    subtitle: 'MCP Library',
    path: 'mcp-library/installed?add=custom',
  },
  { id: 'page-theme', title: 'Theme & Display', subtitle: 'Page', path: 'theme' },
  { id: 'page-editor', title: 'Editor', subtitle: 'Page', path: 'editor' },
  { id: 'page-general', title: 'General', subtitle: 'Page', path: 'general' },
  { id: 'page-notifications', title: 'Notifications', subtitle: 'Page', path: 'notifications' },
  { id: 'page-storage', title: 'Storage', subtitle: 'Page', path: 'storage' },
  { id: 'page-webui', title: 'Web UI', subtitle: 'Page', path: 'webui' },
  { id: 'page-about', title: 'About', subtitle: 'Page', path: 'about' },

  // Theme & Display settings
  { id: 'setting-theme', title: 'Theme', subtitle: 'Theme & Display', path: 'theme' },
  { id: 'setting-dark-mode', title: 'Dark Mode', subtitle: 'Theme & Display', path: 'theme' },
  { id: 'setting-light-mode', title: 'Light Mode', subtitle: 'Theme & Display', path: 'theme' },
  { id: 'setting-system-theme', title: 'Match System Theme', subtitle: 'Theme & Display', path: 'theme' },
  { id: 'setting-font-size', title: 'Font Size', subtitle: 'Theme & Display', path: 'theme' },
  { id: 'setting-reduce-motion', title: 'Reduce Motion', subtitle: 'Theme & Display', path: 'theme' },
  { id: 'setting-density', title: 'Density', subtitle: 'Theme & Display', path: 'theme' },
  { id: 'setting-sidebar-width', title: 'Sidebar Width', subtitle: 'Theme & Display', path: 'theme' },

  // General settings
  { id: 'setting-language', title: 'Language', subtitle: 'General', path: 'general' },
  { id: 'setting-start-on-boot', title: 'Start on Boot', subtitle: 'General', path: 'general' },
  { id: 'setting-close-to-tray', title: 'Close to Tray', subtitle: 'General', path: 'general' },
  { id: 'setting-proxy', title: 'Proxy Configuration', subtitle: 'General', path: 'general' },

  // Notifications settings
  { id: 'setting-notifications', title: 'Notifications', subtitle: 'Notifications', path: 'notifications' },
  {
    id: 'setting-cron-notifications',
    title: 'Scheduled Task Notifications',
    subtitle: 'Notifications',
    path: 'notifications',
  },

  // Models & Providers settings
  { id: 'setting-api-key', title: 'API Key', subtitle: 'Models & Providers', path: 'models' },
  { id: 'setting-base-url', title: 'Base URL', subtitle: 'Models & Providers', path: 'models' },
  { id: 'setting-model', title: 'Model', subtitle: 'Models & Providers', path: 'models' },

  // About actions
  { id: 'action-check-updates', title: 'Check for Updates', subtitle: 'About', path: 'about' },
  { id: 'action-feedback', title: 'Send Feedback', subtitle: 'About', path: 'about' },
  { id: 'action-bug-report', title: 'Report a Bug', subtitle: 'About', path: 'about' },
];

export default ENTRIES;
