import {
  ArrowRightLeft,
  BookOpen,
  Bot,
  Brain,
  Cable,
  ChevronDown,
  Cpu,
  Globe,
  Image as ImageIcon,
  Info,
  MessageCircle,
  Mic,
  Monitor,
  PanelLeft,
  Pencil,
  Puzzle,
  Radio,
  ScrollText,
  SlashSquare,
  Stethoscope,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import CommandPalette from '@/renderer/components/settings/shared/CommandPalette/CommandPalette';
import ShortcutsOverlay from '@/renderer/components/settings/shared/ShortcutsOverlay/ShortcutsOverlay';
import { useGlobalKeybind } from '@/renderer/hooks/settings/useGlobalKeybind';
import { SettingsViewModeProvider } from '@/renderer/components/settings/SettingsModal/settingsViewContext';
import { isElectronDesktop } from '@/renderer/utils/platform';
import { Dropdown, Menu } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { BUILTIN_TAB_IDS } from './SettingsSider';
import './settings.css';

interface SettingsPageWrapperProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

type NavItem = { label: string; icon: React.ReactElement; path: string; id: string };

type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

const ExtensionMaskIcon: React.FC<{ src: string; sizeClassName?: string }> = ({
  src,
  sizeClassName = 'w-16px h-16px',
}) => (
  <span
    className={classNames('block bg-current text-t-secondary', sizeClassName)}
    style={{
      maskImage: `url(${src})`,
      maskRepeat: 'no-repeat',
      maskPosition: 'center',
      maskSize: 'contain',
      WebkitMaskImage: `url(${src})`,
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      WebkitMaskSize: 'contain',
    }}
    aria-hidden='true'
  />
);

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
    wcore: {
      id: 'wcore',
      label: t('settings.wcoreConfig.navLabel', { defaultValue: 'Wayland Core' }),
      icon: <Cpu size={16} />,
      path: 'wcore-config',
    },
    agents: {
      id: 'agents',
      label: t('settings.sider.agents', { defaultValue: 'Agents' }),
      icon: <Bot size={16} />,
      path: 'agents',
    },
    commands: {
      id: 'commands',
      label: t('settings.sider.commands', { defaultValue: 'Slash Commands' }),
      icon: <SlashSquare size={16} />,
      path: 'commands',
    },
    doctor: {
      id: 'doctor',
      label: t('settings.sider.doctor', { defaultValue: 'Doctor' }),
      icon: <Stethoscope size={16} />,
      path: 'doctor',
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
    extensions: {
      id: 'extensions',
      label: t('settings.sider.extensions', { defaultValue: 'Extensions' }),
      icon: <Puzzle size={16} />,
      path: 'extensions',
    },
    migrate: {
      id: 'migrate',
      label: t('settings.sider.migrate', { defaultValue: 'Migrate' }),
      icon: <ArrowRightLeft size={16} />,
      path: 'migrate',
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
    navigation: {
      id: 'navigation',
      label: t('settings.sider.navigation', { defaultValue: 'Navigation' }),
      icon: <PanelLeft size={16} />,
      path: 'navigation',
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
  const isMobile = (layout?.isMobile ?? false) || (typeof window !== 'undefined' && window.innerWidth < 768);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const isDesktop = isElectronDesktop();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  useGlobalKeybind('k', openPalette, { meta: true, skipInputs: false });

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);
  useGlobalKeybind('?', openShortcuts, { meta: false, skipInputs: true });

  const menuItems = React.useMemo(() => getBuiltinSettingsNavItems(isDesktop, t), [isDesktop, t]);

  const activeNavItem = React.useMemo(
    () => menuItems.find((item) => pathname.includes(`/settings/${item.path}`)),
    [menuItems, pathname]
  );

  const containerClass = classNames(
    'settings-page-wrapper w-full min-h-full box-border overflow-y-auto',
    isMobile ? 'px-16px py-14px' : 'px-12px md:px-40px py-32px',
    className
  );

  const contentClass = classNames(
    'settings-page-content w-full',
    isMobile ? 'max-w-full' : classNames('mx-auto', contentClassName || 'md:max-w-[1120px]')
  );

  return (
    <SettingsViewModeProvider value='page'>
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <ShortcutsOverlay open={shortcutsOpen} onClose={closeShortcuts} />
      <div className={containerClass}>
        {isMobile && (
          <div className='settings-mobile-top-nav-dropdown'>
            <Dropdown
              trigger='click'
              position='bl'
              droplist={
                <Menu
                  selectedKeys={activeNavItem ? [activeNavItem.path] : []}
                  onClickMenuItem={(key) => {
                    void navigate(`/settings/${key}`, { replace: true });
                  }}
                >
                  {menuItems.map((item) => (
                    <Menu.Item key={item.path}>
                      <span className='flex items-center gap-8px'>
                        <span className='flex items-center shrink-0'>{item.icon}</span>
                        <span className='truncate'>{item.label}</span>
                      </span>
                    </Menu.Item>
                  ))}
                </Menu>
              }
            >
              <div
                className='flex items-center gap-8px cursor-pointer w-full box-border'
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 8,
                  backgroundColor: 'var(--color-fill-2)',
                  border: '1px solid var(--color-border-1)',
                  color: 'var(--text-primary)',
                }}
              >
                {activeNavItem && <span className='flex items-center shrink-0'>{activeNavItem.icon}</span>}
                <span className='font-semibold text-14px truncate flex-1'>{activeNavItem?.label ?? ''}</span>
                <ChevronDown size={16} className='shrink-0 opacity-60' />
              </div>
            </Dropdown>
          </div>
        )}
        <div className={contentClass}>{children}</div>
      </div>
    </SettingsViewModeProvider>
  );
};

export default SettingsPageWrapper;
