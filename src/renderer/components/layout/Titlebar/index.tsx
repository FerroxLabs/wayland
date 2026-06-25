import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import {
  ArrowLeftCircle,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Plus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { ipcBridge } from '@/common';
import { TEAM_MODE_ENABLED } from '@/common/config/constants';
import WindowControls from '../WindowControls';
import { WORKSPACE_STATE_EVENT, dispatchWorkspaceToggleEvent } from '@renderer/utils/workspace/workspaceEvents';
import type { WorkspaceStateDetail } from '@renderer/utils/workspace/workspaceEvents';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { useNavigationHistory } from '@/renderer/hooks/context/NavigationHistoryContext';
import { isElectronDesktop, isMacOS } from '@/renderer/utils/platform';
import { useIsPopoutMode } from '@/renderer/hooks/system/useIsPopoutMode';
import UpdatePill from './UpdatePill';
// Full brand lockups (orbit mark + wordmark + ™). Dark wordmark shows on light
// theme, white wordmark on dark theme - toggled purely via CSS on [data-theme].
import lockupDark from '@renderer/assets/logos/brand/wayland-lockup-dark.png';
import lockupWhite from '@renderer/assets/logos/brand/wayland-lockup-white.png';
import './titlebar.css';

interface TitlebarProps {
  workspaceAvailable: boolean;
}

const WaylandLogoMark: React.FC = () => (
  <svg
    className='app-titlebar__brand-logo'
    viewBox='0 0 24 24'
    fill='none'
    style={{ stroke: 'var(--brand)' }}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M20.341 6.484A10 10 0 0 1 10.266 21.85' />
    <path d='M3.659 17.516A10 10 0 0 1 13.74 2.152' />
    <circle cx='12' cy='12' r='3' />
    <circle cx='19' cy='5' r='2' />
    <circle cx='5' cy='19' r='2' />
  </svg>
);

// Claude-desktop-style sidebar toggle icon: a rounded rectangle with a vertical divider
// near the left edge, indicating a collapsible side panel. Rendered as inline SVG since
// lucide-react doesn't ship this exact shape.
//
// Note: lucide-react icons use a 24-unit viewBox with a default 2px stroke.
// This icon intentionally uses a 48-unit viewBox (double scale) so its
// geometry has room to breathe at the small titlebar size; callers therefore
// pass roughly double the `strokeWidth` value they'd pass to a Lucide icon
// to produce visually equivalent stroke weight on screen.
//
// The rect spans y=10..38 (height 28), centered at y=24 to keep the sidebar
// icon on the same visual baseline as adjacent Lucide chevrons/panels.
const SidebarIcon: React.FC<{ size?: number; strokeWidth?: number }> = ({ size = 18, strokeWidth = 4 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 48 48'
    fill='none'
    stroke='currentColor'
    strokeWidth={strokeWidth}
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <rect x='6' y='10' width='36' height='28' rx='5' />
    <line x1='18' y1='10' x2='18' y2='38' />
  </svg>
);

const Titlebar: React.FC<TitlebarProps> = ({ workspaceAvailable }) => {
  const { t } = useTranslation();
  const appTitle = useMemo(() => 'Wayland', []);
  const [workspaceCollapsed, setWorkspaceCollapsed] = useState(true);
  const [mobileCenterTitle, setMobileCenterTitle] = useState(appTitle);
  const [mobileCenterOffset, setMobileCenterOffset] = useState(0);
  const layout = useLayoutContext();
  // #27 phase 2: in a pop-out window there is no sider, so the titlebar renders
  // standalone - suppress the sider toggle but preserve macOS traffic-light spacing.
  const isPopout = useIsPopoutMode();
  const navigationHistory = useNavigationHistory();
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const lastNonSettingsPathRef = useRef('/guid');

  // Sync workspace collapsed state for toggle button
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<WorkspaceStateDetail>;
      if (typeof customEvent.detail?.collapsed === 'boolean') {
        setWorkspaceCollapsed(customEvent.detail.collapsed);
      }
    };
    window.addEventListener(WORKSPACE_STATE_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(WORKSPACE_STATE_EVENT, handler as EventListener);
    };
  }, []);

  const isDesktopRuntime = isElectronDesktop();
  const isMacRuntime = isDesktopRuntime && isMacOS();
  // Windows/Linux show custom window buttons; macOS exposes a workspace toggle in the titlebar
  const showWindowControls = isDesktopRuntime && !isMacRuntime;
  // WebUI and macOS desktop both need the workspace toggle in the titlebar
  const showWorkspaceButton = workspaceAvailable && (!isDesktopRuntime || isMacRuntime);

  const workspaceTooltip = workspaceCollapsed
    ? t('common.expandMore', { defaultValue: 'Expand workspace' })
    : t('common.collapse', { defaultValue: 'Collapse workspace' });
  const newConversationTooltip = t('conversation.workspace.createNewConversation');
  const backToChatTooltip = t('common.back', { defaultValue: 'Back to Chat' });
  const isSettingsRoute = location.pathname.startsWith('/settings');
  const iconSize = layout?.isMobile ? 24 : 18;
  // Desktop uses slimmer strokes to match macOS-native chrome aesthetics;
  // mobile keeps the default weight so icons stay legible at larger sizes.
  const desktopIconStroke = layout?.isMobile ? undefined : 2.5;
  // Always expose sidebar toggle on titlebar left side - except in a pop-out
  // window, which has no sider to toggle.
  const showSiderToggle = !isPopout && Boolean(layout?.setSiderCollapsed) && !(layout?.isMobile && isSettingsRoute);
  const showBackToChatButton = Boolean(layout?.isMobile && isSettingsRoute);
  const showNewConversationButton = Boolean(layout?.isMobile && workspaceAvailable);
  const siderTooltip = layout?.siderCollapsed
    ? t('common.expandMore', { defaultValue: 'Expand sidebar' })
    : t('common.collapse', { defaultValue: 'Collapse sidebar' });
  // Show back/forward on desktop only; mobile keeps the existing back-to-chat button.
  const showHistoryNav = Boolean(navigationHistory) && !layout?.isMobile;
  const historyBackTooltip = t('common.historyBack', { defaultValue: 'Back' });
  const historyForwardTooltip = t('common.forward', { defaultValue: 'Forward' });

  const handleSiderToggle = () => {
    if (!showSiderToggle || !layout?.setSiderCollapsed) return;
    layout.setSiderCollapsed(!layout.siderCollapsed);
  };

  const handleWorkspaceToggle = () => {
    if (!workspaceAvailable) {
      return;
    }
    dispatchWorkspaceToggleEvent();
  };

  const handleCreateConversation = () => {
    void navigate('/guid');
  };

  const handleBackToChat = () => {
    const target = lastNonSettingsPathRef.current;
    if (target && !target.startsWith('/settings')) {
      void navigate(target);
      return;
    }
    void navigate(-1);
  };

  useEffect(() => {
    if (!isSettingsRoute) {
      const path = `${location.pathname}${location.search}${location.hash}`;
      lastNonSettingsPathRef.current = path;
      try {
        sessionStorage.setItem('aion:last-non-settings-path', path);
      } catch {
        // ignore
      }
      return;
    }
    try {
      const stored = sessionStorage.getItem('aion:last-non-settings-path');
      if (stored) {
        lastNonSettingsPathRef.current = stored;
      }
    } catch {
      // ignore
    }
  }, [isSettingsRoute, location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!layout?.isMobile) {
      setMobileCenterTitle(appTitle);
      return;
    }

    // Team mode: show team name
    if (TEAM_MODE_ENABLED) {
      const teamMatch = location.pathname.match(/^\/team\/([^/]+)/);
      const teamId = teamMatch?.[1];
      if (teamId) {
        let cancelled = false;
        void ipcBridge.team.get
          .invoke({ id: teamId })
          .then((team) => {
            if (cancelled) return;
            setMobileCenterTitle(team?.name || appTitle);
          })
          .catch(() => {
            if (cancelled) return;
            setMobileCenterTitle(appTitle);
          });
        return () => {
          cancelled = true;
        };
      }
    }

    // Single agent mode: show conversation name
    const match = location.pathname.match(/^\/conversation\/([^/]+)/);
    const conversationId = match?.[1];
    if (!conversationId) {
      setMobileCenterTitle(appTitle);
      return;
    }

    let cancelled = false;
    void ipcBridge.conversation.get
      .invoke({ id: conversationId })
      .then((conversation) => {
        if (cancelled) return;
        setMobileCenterTitle(conversation?.name || appTitle);
      })
      .catch(() => {
        if (cancelled) return;
        setMobileCenterTitle(appTitle);
      });

    return () => {
      cancelled = true;
    };
  }, [appTitle, layout?.isMobile, location.pathname]);

  useEffect(() => {
    if (!layout?.isMobile) {
      setMobileCenterOffset(0);
      return;
    }

    const updateOffset = () => {
      const leftWidth = menuRef.current?.offsetWidth || 0;
      const rightWidth = toolbarRef.current?.offsetWidth || 0;
      setMobileCenterOffset((leftWidth - rightWidth) / 2);
    };

    updateOffset();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateOffset);
      return () => window.removeEventListener('resize', updateOffset);
    }

    const observer = new ResizeObserver(() => updateOffset());
    if (containerRef.current) observer.observe(containerRef.current);
    if (menuRef.current) observer.observe(menuRef.current);
    if (toolbarRef.current) observer.observe(toolbarRef.current);

    return () => observer.disconnect();
  }, [layout?.isMobile, showBackToChatButton, showNewConversationButton, showWorkspaceButton, mobileCenterTitle]);

  const mobileCenterStyle = layout?.isMobile
    ? ({
        '--app-titlebar-mobile-center-offset': `${workspaceAvailable ? mobileCenterOffset : 0}px`,
      } as React.CSSProperties)
    : undefined;

  const menuStyle: React.CSSProperties = useMemo(() => {
    // Reserve room for the macOS traffic lights whenever the menu sits to their
    // right: normally that's when the sider toggle shows, but a pop-out window
    // has no sider toggle yet still has traffic lights, so reserve there too.
    if (!isMacRuntime || (!showSiderToggle && !isPopout && !showBackToChatButton)) return {};
    // macOS: sit the menu buttons right next to the traffic lights (which occupy
    // ~70px). This block only runs in the macOS desktop app, where the traffic
    // lights are present at every window width - including a narrow window that
    // trips isMobile - so always reserve the room (else the toggle overlaps them).
    return {
      marginLeft: '76px',
    };
  }, [isMacRuntime, showSiderToggle, isPopout, showBackToChatButton]);

  return (
    <div
      ref={containerRef}
      style={mobileCenterStyle}
      className={classNames('flex items-center gap-8px app-titlebar bg-2 border-b border-[var(--border-base)]', {
        'app-titlebar--mobile': layout?.isMobile,
        'app-titlebar--mobile-conversation': layout?.isMobile && workspaceAvailable,
        'app-titlebar--desktop': isDesktopRuntime,
        'app-titlebar--mac': isMacRuntime,
      })}
    >
      <div ref={menuRef} className='app-titlebar__menu' style={menuStyle}>
        {showBackToChatButton && (
          <button
            type='button'
            className={classNames('app-titlebar__button', layout?.isMobile && 'app-titlebar__button--mobile')}
            onClick={handleBackToChat}
            aria-label={backToChatTooltip}
          >
            {/* Match the sidebar toggle's compact 18px size; don't balloon to
                24px on mobile (it read as clunky against the macOS controls). */}
            <ArrowLeftCircle size={18} />
          </button>
        )}
        {showSiderToggle && (
          <button
            type='button'
            className={classNames('app-titlebar__button', layout?.isMobile && 'app-titlebar__button--mobile')}
            onClick={handleSiderToggle}
            aria-label={siderTooltip}
          >
            {/* Same sidebar glyph + size at every width - the toggle should not
                swap icon or grow on a narrow window. */}
            <SidebarIcon size={18} strokeWidth={2.5} />
          </button>
        )}
        {showHistoryNav && (
          <>
            <button
              type='button'
              className='app-titlebar__button app-titlebar__button--nav'
              onClick={() => navigationHistory?.back()}
              disabled={!navigationHistory?.canBack}
              aria-label={historyBackTooltip}
              title={historyBackTooltip}
            >
              <ChevronLeft size={iconSize} strokeWidth={desktopIconStroke} />
            </button>
            <button
              type='button'
              className='app-titlebar__button app-titlebar__button--nav'
              onClick={() => navigationHistory?.forward()}
              disabled={!navigationHistory?.canForward}
              aria-label={historyForwardTooltip}
              title={historyForwardTooltip}
            >
              <ChevronRight size={iconSize} strokeWidth={desktopIconStroke} />
            </button>
          </>
        )}
      </div>
      <UpdatePill />
      <div
        className='app-titlebar__brand'
        aria-label={layout?.isMobile ? mobileCenterTitle : appTitle}
        title={layout?.isMobile ? mobileCenterTitle : appTitle}
      >
        {layout?.isMobile ? (
          <span className='app-titlebar__brand-mobile'>
            <WaylandLogoMark />
            <span className='app-titlebar__brand-text'>{mobileCenterTitle}</span>
          </span>
        ) : (
          <span className='app-titlebar__brand-desktop'>
            <img
              src={lockupDark}
              alt={appTitle}
              className='app-titlebar__brand-lockup app-titlebar__brand-lockup--on-light'
              aria-hidden='true'
              draggable={false}
            />
            <img
              src={lockupWhite}
              alt={appTitle}
              className='app-titlebar__brand-lockup app-titlebar__brand-lockup--on-dark'
              aria-hidden='true'
              draggable={false}
            />
            <span className='app-titlebar__brand-tagline'>Perceives · Reasons · Acts · Evolves</span>
          </span>
        )}
      </div>
      <div ref={toolbarRef} className='app-titlebar__toolbar'>
        {showNewConversationButton && (
          <button
            type='button'
            className={classNames('app-titlebar__button', layout?.isMobile && 'app-titlebar__button--mobile')}
            onClick={handleCreateConversation}
            aria-label={newConversationTooltip}
          >
            <Plus size={iconSize} />
          </button>
        )}
        {showWorkspaceButton && (
          <button
            type='button'
            className={classNames('app-titlebar__button', layout?.isMobile && 'app-titlebar__button--mobile')}
            onClick={handleWorkspaceToggle}
            aria-label={workspaceTooltip}
          >
            {workspaceCollapsed ? <PanelRightOpen size={iconSize} /> : <PanelRightClose size={iconSize} />}
          </button>
        )}
        {showWindowControls && <WindowControls />}
      </div>
    </div>
  );
};

export default Titlebar;
