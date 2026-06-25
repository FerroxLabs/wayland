import { describe, it, expect } from 'vitest';
import { getBuiltinSettingsNavItems } from '@/renderer/pages/settings/components/SettingsPageWrapper';

const t = (key: string, options?: { defaultValue?: string }) => {
  const labels: Record<string, string> = {
    'settings.assistants': 'Assistants',
    'settings.sider.agents': 'Agents',
    'settings.sider.skills': 'Skills & Tools',
    'settings.sider.providers': 'Providers',
    'settings.sider.images': 'Image Generation',
    'settings.sider.voice': 'Voice',
    'settings.webui': 'WebUI',
    'settings.sider.channels': 'Channels',
    'settings.sider.mcp': 'MCP Servers',
    'settings.sider.theme': 'Theme & Display',
    'settings.sider.editor': 'Editor',
    'settings.sider.general': 'General',
    'settings.sider.notifications': 'Notifications',
    'settings.sider.storage': 'Storage',
    'settings.about': 'About',
  };

  return labels[key] ?? options?.defaultValue ?? key;
};

describe('getBuiltinSettingsNavItems', () => {
  it('returns mobile settings tabs in the same order as desktop sider', () => {
    const items = getBuiltinSettingsNavItems(false, t);

    expect(items.map((item) => item.id)).toEqual([
      'assistants',
      'skills',
      'commands',
      'constitution',
      'models',
      'agents',
      'images',
      'voice',
      'wcore',
      'webui',
      'channels',
      'mcp-library',
      'migrate',
      'theme',
      'editor',
      'general',
      'notifications',
      'storage',
      'ijfw',
      'doctor',
      'about',
    ]);

    expect(items.map((item) => item.label)).toEqual([
      'Assistants',
      'Skills & Tools',
      'Slash Commands',
      'Constitution',
      'Models',
      'Agents',
      'Image Generation',
      'Voice',
      'Wayland Core',
      'WebUI',
      'Channels',
      'MCP Library',
      'Migrate',
      'Theme & Display',
      'Editor',
      'General',
      'Notifications',
      'Storage',
      'IJFW Memory',
      'Doctor',
      'About',
    ]);
  });

  it('keeps the webui route stable for mobile and desktop nav variants', () => {
    expect(getBuiltinSettingsNavItems(false, t).find((item) => item.id === 'webui')?.path).toBe('webui');
    expect(getBuiltinSettingsNavItems(true, t).find((item) => item.id === 'webui')?.path).toBe('webui');
  });
});
