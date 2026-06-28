import classNames from 'classnames';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePreviewContext } from '@renderer/pages/conversation/Preview/context/PreviewContext';
import { cleanupSiderTooltips, getSiderTooltipProps } from '@renderer/utils/ui/siderTooltip';
import { useAuth } from '@renderer/hooks/context/AuthContext';
import { useLayoutContext } from '@renderer/hooks/context/LayoutContext';
import { blurActiveElement } from '@renderer/utils/ui/focus';
import { useThemeContext } from '@renderer/hooks/context/ThemeContext';
import {
  SiderAssistantsEntry,
  SiderMemoryEntry,
  SiderProjectsEntry,
  SiderScheduledEntry,
  SiderMissionControlEntry,
  SiderSearchEntry,
  SiderSessionsEntry,
  SiderTeamsEntry,
  SiderToolbar,
  SiderWorkflowsEntry,
} from './SiderNav';
import SiderFooter from './SiderFooter';
import { SiderScheduledSection } from './SiderAccordion/SiderScheduledSection';
import { SiderWorkflowsSection } from './SiderAccordion/SiderWorkflowsSection';
import { SiderTeamsSection } from './SiderAccordion/SiderTeamsSection';
import { SiderRecentChatsSection } from './SiderAccordion/SiderRecentChatsSection';
import siderStyles from './Sider.module.css';

const SettingsSider = React.lazy(() => import('@renderer/pages/settings/components/SettingsSider'));

interface SiderProps {
  onSessionClick?: () => void;
  collapsed?: boolean;
}

const Sider: React.FC<SiderProps> = ({ onSessionClick, collapsed = false }) => {
  const layout = useLayoutContext();
  const isMobile = layout?.isMobile ?? false;
  const location = useLocation();
  const { pathname, search, hash } = location;

  const navigate = useNavigate();
  const { closePreview } = usePreviewContext();
  const { logout, status } = useAuth();
  const { theme, setTheme } = useThemeContext();
  const [isBatchMode, setIsBatchMode] = useState(false);
  const isSettings = pathname.startsWith('/settings');
  const lastNonSettingsPathRef = useRef('/guid');
  const showLogout =
    typeof window !== 'undefined' && !(window as { electronAPI?: unknown }).electronAPI && status === 'authenticated';

  useEffect(() => {
    if (!pathname.startsWith('/settings')) {
      lastNonSettingsPathRef.current = `${pathname}${search}${hash}`;
    }
  }, [pathname, search, hash]);

  const handleNewChat = () => {
    cleanupSiderTooltips();
    blurActiveElement();
    closePreview();
    setIsBatchMode(false);
    Promise.resolve(navigate('/guid', { state: { resetAssistant: true } })).catch((error) => {
      console.error('Navigation failed:', error);
    });
    if (onSessionClick) {
      onSessionClick();
    }
  };

  const handleSettingsClick = () => {
    cleanupSiderTooltips();
    blurActiveElement();
    if (isSettings) {
      const target = lastNonSettingsPathRef.current || '/guid';
      Promise.resolve(navigate(target)).catch((error) => {
        console.error('Navigation failed:', error);
      });
    } else {
      Promise.resolve(navigate('/settings/models')).catch((error) => {
        console.error('Navigation failed:', error);
      });
    }
    if (onSessionClick) {
      onSessionClick();
    }
  };

  const handleConversationSelect = () => {
    cleanupSiderTooltips();
    blurActiveElement();
    closePreview();
    setIsBatchMode(false);
  };

  const handleAssistantsClick = () => {
    cleanupSiderTooltips();
    blurActiveElement();
    closePreview();
    setIsBatchMode(false);
    Promise.resolve(navigate('/assistants')).catch((error) => {
      console.error('Navigation failed:', error);
    });
    if (onSessionClick) {
      onSessionClick();
    }
  };

  const handleTopZoneNav = useCallback(
    (target: string) => {
      cleanupSiderTooltips();
      blurActiveElement();
      closePreview();
      setIsBatchMode(false);
      Promise.resolve(navigate(target)).catch((error) => {
        console.error('Navigation failed:', error);
      });
      if (onSessionClick) {
        onSessionClick();
      }
    },
    [closePreview, navigate, onSessionClick]
  );

  const handleQuickThemeToggle = () => {
    void setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = useCallback(async () => {
    cleanupSiderTooltips();
    blurActiveElement();
    closePreview();
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      return; // skip subsequent steps when logout fails
    }
    if (onSessionClick) {
      onSessionClick();
    }
  }, [closePreview, logout, onSessionClick]);

  useEffect(() => {
    if (!showLogout) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        handleLogout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleLogout, showLogout]);

  const handleCronNavigate = (path: string) => {
    cleanupSiderTooltips();
    blurActiveElement();
    closePreview();
    Promise.resolve(navigate(path)).catch(console.error);
    if (onSessionClick) onSessionClick();
  };

  const tooltipEnabled = collapsed && !isMobile;
  const siderTooltipProps = getSiderTooltipProps(tooltipEnabled);

  const workspaceHistoryProps = {
    collapsed,
    tooltipEnabled,
    onSessionClick,
    batchMode: isBatchMode,
    onBatchModeChange: setIsBatchMode,
  };

  if (isSettings) {
    return (
      <div className='size-full flex flex-col'>
        <div className='flex-1 min-h-0 overflow-hidden'>
          <Suspense fallback={<div className='size-full' />}>
            <SettingsSider collapsed={collapsed} tooltipEnabled={tooltipEnabled} />
          </Suspense>
        </div>
        <SiderFooter
          isMobile={isMobile}
          isSettings={isSettings}
          collapsed={collapsed}
          theme={theme}
          siderTooltipProps={siderTooltipProps}
          onSettingsClick={handleSettingsClick}
          onThemeToggle={handleQuickThemeToggle}
          showLogout={showLogout}
          onLogoutClick={handleLogout}
        />
      </div>
    );
  }

  // v0.6.2 W2a - three-zone grid layout (top pinned · scroll · footer pinned).
  // W2b will replace the legacy SiderScheduled/Workflows/Teams entries with the
  // new accordion sections. W2c will dock SiderFooter quick actions into the
  // footer zone alongside Settings.
  return (
    <div className={classNames('size-full', siderStyles.gridContainer)}>
      <div className={siderStyles.topZone}>
        <SiderToolbar
          isMobile={isMobile}
          isBatchMode={isBatchMode}
          collapsed={collapsed}
          siderTooltipProps={siderTooltipProps}
          onNewChat={handleNewChat}
          onToggleBatchMode={() => setIsBatchMode((prev) => !prev)}
        />
        <SiderSessionsEntry
          isMobile={isMobile}
          isActive={pathname.startsWith('/conversations')}
          collapsed={collapsed}
          siderTooltipProps={siderTooltipProps}
          onClick={() => handleTopZoneNav('/conversations')}
        />
        <SiderSearchEntry
          isMobile={isMobile}
          collapsed={collapsed}
          siderTooltipProps={siderTooltipProps}
          onConversationSelect={handleConversationSelect}
          onSessionClick={onSessionClick}
        />
        <SiderProjectsEntry
          isMobile={isMobile}
          isActive={pathname.startsWith('/project')}
          collapsed={collapsed}
          siderTooltipProps={siderTooltipProps}
          onClick={() => handleTopZoneNav('/projects')}
        />
        <SiderAssistantsEntry
          isMobile={isMobile}
          isActive={pathname === '/assistants'}
          collapsed={collapsed}
          siderTooltipProps={siderTooltipProps}
          onClick={handleAssistantsClick}
        />
        <SiderWorkflowsEntry
          isMobile={isMobile}
          isActive={pathname.startsWith('/workflows')}
          collapsed={collapsed}
          siderTooltipProps={siderTooltipProps}
          onClick={() => handleTopZoneNav('/workflows')}
        />
        <SiderScheduledEntry
          isMobile={isMobile}
          isActive={pathname.startsWith('/scheduled')}
          collapsed={collapsed}
          siderTooltipProps={siderTooltipProps}
          onClick={() => handleTopZoneNav('/scheduled')}
        />
        <SiderTeamsEntry
          isMobile={isMobile}
          isActive={pathname.startsWith('/teams')}
          collapsed={collapsed}
          siderTooltipProps={siderTooltipProps}
          onClick={() => handleTopZoneNav('/teams')}
        />
        <SiderMemoryEntry
          isMobile={isMobile}
          isActive={pathname.startsWith('/memory') || pathname.startsWith('/wiki')}
          collapsed={collapsed}
          siderTooltipProps={siderTooltipProps}
        />
        <SiderMissionControlEntry
          isMobile={isMobile}
          isActive={pathname.startsWith('/mission-control')}
          collapsed={collapsed}
          siderTooltipProps={siderTooltipProps}
          onClick={() => handleTopZoneNav('/mission-control')}
        />
      </div>

      <div className={classNames('overflow-y-auto', siderStyles.scrollArea, siderStyles.scrollZone)}>
        {/* v0.6.2 W2b - accordion sections replace SiderScheduledEntry / SiderWorkflowsEntry /
            SiderTeamsEntry / SiderActiveTeams / TeamSiderSection / CronJobSiderSection.
            Hidden entirely when collapsed: their list content cannot render cleanly
            in the icon rail, so the rail stays icons-only (the top nav already has an
            icon entry for each destination). */}
        {!collapsed && (
          <>
            <SiderScheduledSection collapsed={collapsed} pathname={pathname} onNavigate={handleCronNavigate} />
            <SiderWorkflowsSection collapsed={collapsed} />
            <SiderTeamsSection
              collapsed={collapsed}
              pathname={pathname}
              siderTooltipProps={siderTooltipProps}
              onSessionClick={onSessionClick}
            />
            <SiderRecentChatsSection {...workspaceHistoryProps} />
          </>
        )}
      </div>

      <div className={siderStyles.footerZone}>
        <SiderFooter
          isMobile={isMobile}
          isSettings={isSettings}
          collapsed={collapsed}
          theme={theme}
          siderTooltipProps={siderTooltipProps}
          onSettingsClick={handleSettingsClick}
          onThemeToggle={handleQuickThemeToggle}
          showLogout={showLogout}
          onLogoutClick={handleLogout}
        />
      </div>
    </div>
  );
};

export default Sider;
