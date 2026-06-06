import {
  BookOpen,
  Bot,
  Brain,
  Cable,
  Cpu,
  Globe,
  Image as ImageIcon,
  Info,
  MessageCircle,
  Mic,
  Monitor,
  Pencil,
  Puzzle,
  Radio,
  ScrollText,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import CommandPalette from '@/renderer/components/settings/shared/CommandPalette/CommandPalette';
import ShortcutsOverlay from '@/renderer/components/settings/shared/ShortcutsOverlay/ShortcutsOverlay';
import { useGlobalKeybind } from '@/renderer/hooks/settings/useGlobalKeybind';
import { SettingsViewModeProvider } from '@/renderer/components/settings/SettingsModal/settingsViewContext';
import { isElectronDesktop, resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { extensions as extensionsIpc, type IExtensionSettingsTab } from '@/common/adapter/ipcBridge';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useExtI18n } from '@/renderer/hooks/system/useExtI18n';
import { BUILTIN_TAB_IDS, LEGACY_ANCHOR_REMAP } from './SettingsSider';
import './settings.css';

interface SettingsPageWrapperProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

type NavItem = { label: string; icon: React.ReactElement; path: string; id: string };

type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

export function getBuiltinSettingsNavItems(isDesktop: boolean, t: TranslateFn): NavItem[] {
  const builtinMap: Record<string, NavItem> = {
    assistants: {
      id: 'assistants',
      label: t('settings.assistants', { defaultValue: 'Assistants' }),
      icon: <BookOpen size={16} />,
      path: 'assistants',
    },
    constitution: {
      id: 'constitution',
      label: t('settings.sider.constitution', { defaultValue: 'Constitution' }),
      icon: <ScrollText size={16} />,
      path: 'constitution',
    },
    agents: {
      id: 'agents',
      label: t('settings.sider.agents', { defaultValue: 'Agents' }),
      icon: <Bot size={16} />,
      path: 'agents',
    },
    skills: {
      id: 'skills',
      label: t('settings.sider.skills', { defaultValue: 'Skills & Tools' }),
      icon: <Zap size={16} />,
      path: 'skills',
    },
    models: {
      id: 'models',
      label: t('settings.sider.models', { defaultValue: 'Models' }),
      icon: <Sparkles size={16} />,
      path: 'models',
    },
    images: {
      id: 'images',
      label: t('settings.sider.images', { defaultValue: 'Image Generation' }),
      icon: <ImageIcon size={16} />,
      path: 'images',
    },
    voice: {
      id: 'voice',
      label: t('settings.sider.voice', { defaultValue: 'Voice' }),
      icon: <Mic size={16} />,
      path: 'voice',
    },
    webui: {
      id: 'webui',
      label: t('settings.webui'),
      icon: isDesktop ? <Globe size={16} /> : <MessageCircle size={16} />,
      path: 'webui',
    },
    channels: {
      id: 'channels',
      label: t('settings.sider.channels', { defaultValue: 'Channels' }),
      icon: <Radio size={16} />,
      path: 'channels',
    },
    'mcp-library': {
      id: 'mcp-library',
      label: t('settings.sider.mcpLibrary', { defaultValue: 'MCP Library' }),
      icon: <Server size={16} />,
      path: 'mcp-library/browse',
    },
    theme: {
      id: 'theme',
      label: t('settings.sider.theme', { defaultValue: 'Theme & Display' }),
      icon: <Monitor size={16} />,
      path: 'theme',
    },
    editor: {
      id: 'editor',
      label: t('settings.sider.editor', { defaultValue: 'Editor' }),
      icon: <Pencil size={16} />,
      path: 'editor',
    },
    general: {
      id: 'general',
      label: t('settings.sider.general', { defaultValue: 'General' }),
      icon: <Cpu size={16} />,
      path: 'general',
    },
    notifications: {
      id: 'notifications',
      label: t('settings.sider.notifications', { defaultValue: 'Notifications' }),
      icon: <Cable size={16} />,
      path: 'notifications',
    },
    storage: {
      id: 'storage',
      label: t('settings.sider.storage', { defaultValue: 'Storage' }),
      icon: <Globe size={16} />,
      path: 'storage',
    },
    ijfw: {
      id: 'ijfw',
      label: t('memory.settings.panel_title', { defaultValue: 'IJFW Memory' }),
      icon: <Brain size={16} />,
      path: 'ijfw',
    },
    about: { id: 'about', label: t('settings.about'), icon: <Info size={16} />, path: 'about' },
  };

  return BUILTIN_TAB_IDS.map((id) => builtinMap[id]);
}

const SettingsPageWrapper: React.FC<SettingsPageWrapperProps> = ({ children, className, contentClassName }) => {
  const layout = useLayoutContext();
  const isMobile = layout?.isMobile ?? false;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const isDesktop = isElectronDesktop();

  const [extensionTabs, setExtensionTabs] = useState<IExtensionSettingsTab[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  useGlobalKeybind('k', openPalette, { meta: true, skipInputs: false });

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);
  useGlobalKeybind('?', openShortcuts, { meta: false, skipInputs: true });

  useEffect(() => {
    void extensionsIpc.getSettingsTabs
      .invoke()
      .then((tabs) => setExtensionTabs(tabs ?? []))
      .catch((err) => console.error('[SettingsPageWrapper] Failed to load extension tabs:', err));
  }, []);

  const { resolveExtTabName } = useExtI18n();

  const menuItems = React.useMemo(() => {
    const builtins = getBuiltinSettingsNavItems(isDesktop, t);

    // Insert extension tabs before system (unanchored default) or at anchor position
    const result = [...builtins];
    const unanchored: IExtensionSettingsTab[] = [];
    const beforeMap = new Map<string, IExtensionSettingsTab[]>();
    const afterMap = new Map<string, IExtensionSettingsTab[]>();

    for (const tab of extensionTabs) {
      if (!tab.position) {
        unanchored.push(tab);
        continue;
      }
      const { anchor: rawAnchor, placement } = tab.position;
      const anchor = LEGACY_ANCHOR_REMAP[rawAnchor] ?? rawAnchor;
      const map = placement === 'before' ? beforeMap : afterMap;
      let list = map.get(anchor);
      if (!list) {
        list = [];
        map.set(anchor, list);
      }
      list.push(tab);
    }

    const toNavItem = (tab: IExtensionSettingsTab): NavItem => {
      const resolvedIcon = resolveExtensionAssetUrl(tab.icon) || tab.icon;
      return {
        id: tab.id,
        label: resolveExtTabName(tab),
        icon: resolvedIcon ? (
          <img src={resolvedIcon} alt='' className='w-16px h-16px object-contain' />
        ) : (
          <Puzzle size={16} />
        ),
        path: `ext/${tab.id}`,
      };
    };

    for (let i = result.length - 1; i >= 0; i--) {
      const id = result[i].id;
      const afters = afterMap.get(id);
      if (afters) result.splice(i + 1, 0, ...afters.map(toNavItem));
      const befores = beforeMap.get(id);
      if (befores) result.splice(i, 0, ...befores.map(toNavItem));
    }

    if (unanchored.length > 0) {
      const sysIdx = result.findIndex((item) => item.id === 'system');
      const idx = sysIdx >= 0 ? sysIdx : result.length;
      result.splice(idx, 0, ...unanchored.map(toNavItem));
    }

    return result;
  }, [isDesktop, t, extensionTabs, resolveExtTabName]);

  const containerClass = classNames(
    'settings-page-wrapper w-full min-h-full box-border overflow-y-auto',
    isMobile ? 'px-16px py-14px' : 'px-12px md:px-40px py-32px',
    className
  );

  const contentClass = classNames(
    'settings-page-content mx-auto w-full',
    contentClassName || 'md:max-w-[1120px]'
  );

  return (
    <SettingsViewModeProvider value='page'>
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <ShortcutsOverlay open={shortcutsOpen} onClose={closeShortcuts} />
      <div className={containerClass}>
        {isMobile && (
          <div className='settings-mobile-top-nav'>
            {menuItems.map((item) => {
              const active = pathname.includes(`/settings/${item.path}`);
              return (
                <button
                  key={item.path}
                  type='button'
                  className={classNames('settings-mobile-top-nav__item', {
                    'settings-mobile-top-nav__item--active': active,
                  })}
                  onClick={() => {
                    void navigate(`/settings/${item.path}`, { replace: true });
                  }}
                >
                  <span className='settings-mobile-top-nav__icon'>{item.icon}</span>
                  <span className='settings-mobile-top-nav__label'>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className={contentClass}>{children}</div>
      </div>
    </SettingsViewModeProvider>
  );
};

export default SettingsPageWrapper;
