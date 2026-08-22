/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Tooltip } from '@arco-design/web-react';
import classNames from 'classnames';
import {
  Activity,
  Bot,
  Brain,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Library,
  MessagesSquare,
  Package,
  Plug,
  Plus,
  Search,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { COCKPIT_NAVIGATION_DESTINATIONS } from '@/common/navigation';
import { useAuth } from '@renderer/hooks/context/AuthContext';
import { useLayoutContext } from '@renderer/hooks/context/LayoutContext';
import { useThemeContext } from '@renderer/hooks/context/ThemeContext';
import { usePreviewContext } from '@renderer/pages/conversation/Preview/context/PreviewContext';
import { blurActiveElement } from '@renderer/utils/ui/focus';
import { cleanupSiderTooltips, getSiderTooltipProps } from '@renderer/utils/ui/siderTooltip';
import SiderFooter from '../Sider/SiderFooter';
import { SiderRecentChatsSection } from '../Sider/SiderAccordion/SiderRecentChatsSection';
import styles from './CockpitSider.module.css';
import { PinnedProjectsSection } from './PinnedProjectsSection';

const SettingsSider = React.lazy(() => import('@renderer/pages/settings/components/SettingsSider'));

export const OPEN_COMMAND_PALETTE_EVENT = 'wayland:open-command-palette';

type NavEntry = {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  active: (pathname: string) => boolean;
};

const destination = (id: string) => {
  const match = COCKPIT_NAVIGATION_DESTINATIONS.find((item) => item.id === id);
  if (!match) throw new Error(`Cockpit navigation destination is missing: ${id}`);
  return match;
};

const navEntry = (id: string, icon: React.ReactNode, active: NavEntry['active']): NavEntry => {
  const item = destination(id);
  return { id: item.id, label: item.label, path: item.path, icon, active };
};

const PRIMARY_ENTRIES: NavEntry[] = [
  navEntry(
    'chats',
    <MessagesSquare size={17} />,
    (pathname) => pathname.startsWith('/conversation') || pathname.startsWith('/conversations')
  ),
  navEntry('artifacts', <Package size={17} />, (pathname) => pathname.startsWith('/artifacts')),
  navEntry('projects', <FolderKanban size={17} />, (pathname) => pathname.startsWith('/project')),
  navEntry('automations', <CalendarClock size={17} />, (pathname) => pathname.startsWith('/scheduled')),
  navEntry('activity', <Activity size={17} />, (pathname) => pathname.startsWith('/mission-control')),
];

const LIBRARY_ENTRIES: NavEntry[] = [
  navEntry('assistants', <Bot size={15} />, (pathname) => pathname === '/assistants'),
  navEntry('workflows', <Workflow size={15} />, (pathname) => pathname.startsWith('/workflows')),
  navEntry('teams', <Users size={15} />, (pathname) => pathname.startsWith('/teams')),
  navEntry('skills', <Sparkles size={15} />, (pathname) => pathname === '/settings/skills'),
  navEntry(
    'connections',
    <Plug size={15} />,
    (pathname) => pathname.startsWith('/settings/mcp-library') || pathname.startsWith('/settings/channels')
  ),
  navEntry(
    'knowledge',
    <Brain size={15} />,
    (pathname) => pathname.startsWith('/memory') || pathname.startsWith('/wiki')
  ),
];

const CockpitSider: React.FC<{ onSessionClick?: () => void; collapsed?: boolean }> = ({
  onSessionClick,
  collapsed = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const layout = useLayoutContext();
  const { closePreview } = usePreviewContext();
  const { logout, status } = useAuth();
  const { theme, setTheme } = useThemeContext();
  const [libraryOpen, setLibraryOpen] = useState(() =>
    LIBRARY_ENTRIES.some((entry) => entry.active(location.pathname))
  );
  const [batchMode, setBatchMode] = useState(false);
  const lastNonSettingsPathRef = useRef('/guid');
  const isMobile = layout?.isMobile ?? false;
  const isSettings = location.pathname.startsWith('/settings');
  const tooltipProps = getSiderTooltipProps(collapsed && !isMobile);
  const showLogout =
    typeof window !== 'undefined' && !(window as { electronAPI?: unknown }).electronAPI && status === 'authenticated';

  useEffect(() => {
    if (!isSettings) lastNonSettingsPathRef.current = `${location.pathname}${location.search}${location.hash}`;
  }, [isSettings, location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (LIBRARY_ENTRIES.some((entry) => entry.active(location.pathname))) setLibraryOpen(true);
  }, [location.pathname]);

  const go = useCallback(
    (target: string) => {
      cleanupSiderTooltips();
      blurActiveElement();
      closePreview();
      setBatchMode(false);
      void navigate(target);
      onSessionClick?.();
    },
    [closePreview, navigate, onSessionClick]
  );

  const newChat = (): void => {
    cleanupSiderTooltips();
    blurActiveElement();
    closePreview();
    setBatchMode(false);
    void navigate('/guid', { state: { resetAssistant: true } });
    onSessionClick?.();
  };
  const handleSettings = (): void => go(isSettings ? lastNonSettingsPathRef.current : destination('settings').path);
  const toggleTheme = (): void => {
    void setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      onSessionClick?.();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderEntry = (entry: NavEntry, secondary = false) => (
    <Tooltip key={entry.id} {...tooltipProps} content={entry.label} position='right'>
      <button
        type='button'
        className={classNames(
          styles.row,
          secondary && styles.secondaryRow,
          entry.active(location.pathname) && styles.active
        )}
        onClick={() => go(entry.path)}
        aria-current={entry.active(location.pathname) ? 'page' : undefined}
        data-testid={`cockpit-nav-${entry.id}`}
      >
        <span className={styles.icon}>{entry.icon}</span>
        <span className={styles.label}>{entry.label}</span>
      </button>
    </Tooltip>
  );

  if (isSettings) {
    return (
      <div className={styles.shell}>
        <div className='min-h-0 overflow-hidden col-span-full row-span-2'>
          <Suspense fallback={<div className='size-full' />}>
            <SettingsSider collapsed={collapsed} tooltipEnabled={collapsed && !isMobile} />
          </Suspense>
        </div>
        <div className={styles.footer}>
          <SiderFooter
            isMobile={isMobile}
            isSettings
            collapsed={collapsed}
            theme={theme}
            siderTooltipProps={tooltipProps}
            onSettingsClick={handleSettings}
            onThemeToggle={toggleTheme}
            showLogout={showLogout}
            onLogoutClick={() => void handleLogout()}
          />
        </div>
      </div>
    );
  }

  const libraryActive = LIBRARY_ENTRIES.some((entry) => entry.active(location.pathname));

  return (
    <div className={styles.shell} data-testid='cockpit-sider'>
      <nav className={styles.primary} aria-label='Primary'>
        <Tooltip {...tooltipProps} content='New chat' position='right'>
          <button type='button' className={styles.newChat} onClick={newChat} data-testid='cockpit-new-chat'>
            <span className={styles.icon}>
              <Plus size={18} />
            </span>
            <span className={styles.label}>New chat</span>
          </button>
        </Tooltip>

        <Tooltip {...tooltipProps} content='Search and commands' position='right'>
          <button
            type='button'
            className={styles.row}
            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT))}
            data-testid='cockpit-command-palette'
          >
            <span className={styles.icon}>
              <Search size={17} />
            </span>
            <span className={styles.label}>Search</span>
            {!collapsed && <span className='text-10px text-t-tertiary'>Cmd K</span>}
          </button>
        </Tooltip>

        {PRIMARY_ENTRIES.slice(0, 2).map((entry) => renderEntry(entry))}

        <Tooltip {...tooltipProps} content='Library' position='right'>
          <button
            type='button'
            className={classNames(styles.row, libraryActive && styles.active)}
            onClick={() => (collapsed ? go('/assistants') : setLibraryOpen((open) => !open))}
            aria-expanded={libraryOpen}
            data-testid='cockpit-nav-library'
          >
            <span className={styles.icon}>
              <Library size={17} />
            </span>
            <span className={styles.label}>Library</span>
            {!collapsed && (libraryOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </button>
        </Tooltip>
        {libraryOpen && (
          <div className={styles.libraryItems}>{LIBRARY_ENTRIES.map((entry) => renderEntry(entry, true))}</div>
        )}

        {PRIMARY_ENTRIES.slice(2).map((entry) => renderEntry(entry))}
      </nav>

      <div className={styles.scroll}>
        <PinnedProjectsSection collapsed={collapsed} onNavigate={go} />
        {!collapsed && (
          <SiderRecentChatsSection
            collapsed={collapsed}
            tooltipEnabled={false}
            onSessionClick={onSessionClick}
            batchMode={batchMode}
            onBatchModeChange={setBatchMode}
          />
        )}
      </div>

      <div className={styles.footer}>
        <SiderFooter
          isMobile={isMobile}
          isSettings={false}
          collapsed={collapsed}
          theme={theme}
          siderTooltipProps={tooltipProps}
          onSettingsClick={handleSettings}
          onThemeToggle={toggleTheme}
          showLogout={showLogout}
          onLogoutClick={() => void handleLogout()}
        />
      </div>
    </div>
  );
};

export default CockpitSider;
