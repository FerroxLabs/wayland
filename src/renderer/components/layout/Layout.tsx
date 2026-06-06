/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { TEAM_MODE_ENABLED } from '@/common/config/constants';
import { ConfigStorage, type ICssTheme } from '@/common/config/storage';
import PwaPullToRefresh from '@/renderer/components/layout/PwaPullToRefresh';
import Titlebar from '@/renderer/components/layout/Titlebar';
import { Layout as ArcoLayout } from '@arco-design/web-react';
import classNames from 'classnames';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutContext } from '@renderer/hooks/context/LayoutContext';
import { NavigationHistoryProvider } from '@renderer/hooks/context/NavigationHistoryContext';
import { useDeepLink } from '@renderer/hooks/system/useDeepLink';
import { useNotificationClick } from '@renderer/hooks/system/useNotificationClick';
import { useDirectorySelection } from '@renderer/hooks/file/useDirectorySelection';
import { useMultiAgentDetection } from '@renderer/hooks/agent/useMultiAgentDetection';
import { processCustomCss } from '@renderer/utils/theme/customCssProcessor';
import { cleanupSiderTooltips } from '@renderer/utils/ui/siderTooltip';
import { useConversationShortcuts } from '@renderer/hooks/ui/useConversationShortcuts';
import { useGlobalKeybind } from '@renderer/hooks/settings/useGlobalKeybind';
import { CommandPalette } from '@renderer/components/cmdk';
import type {
  PaletteAssistant,
  PaletteStarterPrompt,
} from '@renderer/components/cmdk';
import { getAgentKey } from '@renderer/pages/guid/hooks/agentSelectionUtils';
import type { AcpBackend } from '@/common/types/acpTypes';
import { isElectronDesktop } from '@renderer/utils/platform';
import { computeCssSyncDecision, resolveCssByActiveTheme } from '@renderer/utils/theme/themeCssSync';
import '@renderer/styles/layout.css';

const useDebug = () => {
  const [count, setCount] = useState(0);
  const timer = useRef<any>(null);
  const onClick = () => {
    const open = () => {
      ipcBridge.application.openDevTools.invoke().catch((error) => {
        console.error('Failed to open dev tools:', error);
      });
      setCount(0);
    };
    if (count >= 3) {
      return open();
    }
    setCount((prev) => {
      if (prev >= 2) {
        open();
        return 0;
      }
      return prev + 1;
    });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      clearTimeout(timer.current);
      setCount(0);
    }, 1000);
  };

  return { onClick };
};

const UpdateModal = React.lazy(() => import('@/renderer/components/settings/UpdateModal'));

const DEFAULT_SIDER_WIDTH = 240;
const DESKTOP_COLLAPSED_WIDTH = 64;
const SIDER_DRAG_SNAP_THRESHOLD = Math.round((DEFAULT_SIDER_WIDTH + DESKTOP_COLLAPSED_WIDTH) / 2);
const SIDER_DRAG_HYSTERESIS = 6;
const MOBILE_SIDER_WIDTH_RATIO = 0.67;
const MOBILE_SIDER_MIN_WIDTH = 260;
const MOBILE_SIDER_MAX_WIDTH = 420;

const detectMobileViewportOrTouch = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (isElectronDesktop()) {
    return window.innerWidth < 768;
  }
  const width = window.innerWidth;
  const byWidth = width < 768;
  // Treat touch/coarse pointer as mobile only on smaller viewports
  const smallScreen = width < 1024;
  const byMedia = window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches;
  const byTouchPoints = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  return byWidth || (smallScreen && (byMedia || byTouchPoints));
};

const Layout: React.FC<{
  sider: React.ReactNode;
  onSessionClick?: () => void;
}> = ({ sider, onSessionClick: _onSessionClick }) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window === 'undefined' ? 390 : window.innerWidth
  );
  const [customCss, setCustomCss] = useState<string>('');
  const [shouldMountUpdateModal, setShouldMountUpdateModal] = useState(false);
  const { onClick } = useDebug();
  const { contextHolder: multiAgentContextHolder } = useMultiAgentDetection();
  const { contextHolder: directorySelectionContextHolder } = useDirectorySelection();
  useDeepLink();
  useNotificationClick();
  const navigate = useNavigate();
  useConversationShortcuts({ navigate });

  // --- ⌘K command palette (global) ---
  // Owned at the layout level so the keybind works on every authenticated
  // route, and so the palette can reach `useNavigate` for launch /
  // resume / fill-prompt routing.
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Toggle the palette; cmdk auto-focuses the input on mount, so a fresh
  // open always lands with the cursor in the search field.
  const togglePalette = useCallback(() => {
    setPaletteOpen((prev) => !prev);
  }, []);

  // ⌘K on macOS / Ctrl+K on Linux+Windows. `useGlobalKeybind` already
  // skips presses inside inputs/textareas and contenteditable, which is
  // what we want - typing "k" in the chat input should not steal focus
  // into the palette.
  useGlobalKeybind('k', togglePalette, { meta: true });

  const handlePaletteClose = useCallback(() => setPaletteOpen(false), []);

  // Launch a chat with the selected preset assistant. Persists the agent
  // key to ConfigStorage under the same key `useGuidAgentSelection` reads
  // on mount (and on every locationKey change), then navigates to /guid.
  // The hook's restore-on-locationKey effect picks up the saved value and
  // selects it via the standard "custom:<id>" / "remote:<id>" / backend
  // path - which means the Phase 1 Rory rule applies automatically.
  const handleLaunchPreset = useCallback(
    (preset: PaletteAssistant) => {
      const backend = (preset.presetAgentType ?? 'gemini') as AcpBackend;
      const agentKey = getAgentKey({ backend, customAgentId: preset.id });
      ConfigStorage.set('guid.lastSelectedAgent', agentKey)
        .catch((error) => console.error('Failed to persist palette-selected agent:', error))
        .finally(() => {
          void navigate('/guid', { state: {} });
        });
    },
    [navigate]
  );

  const handleResumeChat = useCallback(
    (conversationId: string) => {
      void navigate(`/conversation/${conversationId}`);
    },
    [navigate]
  );

  const handleFillPrompt = useCallback(
    (prompt: PaletteStarterPrompt) => {
      void navigate('/guid', { state: { paletteInitialPrompt: prompt.text } });
    },
    [navigate]
  );

  const location = useLocation();
  const workspaceAvailable =
    location.pathname.startsWith('/conversation/') || (TEAM_MODE_ENABLED && location.pathname.startsWith('/team/'));
  const collapsedRef = useRef(collapsed);
  const lastCssRef = useRef('');
  const lastUiCssUpdateAtRef = useRef(0);
  const dragStateRef = useRef<{ active: boolean; startX: number; startWidth: number }>({
    active: false,
    startX: 0,
    startWidth: DEFAULT_SIDER_WIDTH,
  });

  const loadAndHealCustomCss = useCallback(async () => {
    try {
      const [savedCssRaw, activeThemeId, savedThemes] = await Promise.all([
        ConfigStorage.get('customCss'),
        ConfigStorage.get('css.activeThemeId'),
        ConfigStorage.get('css.themes'),
      ]);

      const decision = computeCssSyncDecision({
        savedCss: savedCssRaw || '',
        activeThemeId: activeThemeId || '',
        savedThemes: (savedThemes || []) as ICssTheme[],
        currentUiCss: customCss,
        lastUiCssUpdateAt: lastUiCssUpdateAtRef.current,
      });

      if (decision.shouldSkipApply) {
        return;
      }

      let effectiveCss = decision.effectiveCss;

      // If the active theme resolved to empty CSS and there IS a saved activeThemeId
      // (but it no longer matches any known theme), fall back to default and persist.
      if (!effectiveCss && activeThemeId && activeThemeId !== 'default-theme') {
        const defaultCss = resolveCssByActiveTheme('default-theme', (savedThemes || []) as ICssTheme[]);
        effectiveCss = defaultCss;
        // Persist the fallback so Layout doesn't keep retrying
        await Promise.all([
          ConfigStorage.set('css.activeThemeId', 'default-theme'),
          ConfigStorage.set('customCss', effectiveCss),
        ]).catch((error) => {
          console.warn('Failed to persist theme fallback:', error);
        });
      } else if (decision.shouldHealStorage) {
        await ConfigStorage.set('customCss', effectiveCss).catch((error) => {
          console.warn('Failed to heal custom CSS from active theme:', error);
        });
      }

      setCustomCss(effectiveCss);
      if (lastCssRef.current !== effectiveCss) {
        lastCssRef.current = effectiveCss;
        window.dispatchEvent(new CustomEvent('custom-css-updated', { detail: { customCss: effectiveCss } }));
      }
    } catch (error) {
      console.error('Failed to load or heal custom CSS:', error);
    }
  }, [customCss]);

  // Load & watch custom CSS configuration
  useEffect(() => {
    void loadAndHealCustomCss();

    const handleCssUpdate = (event: CustomEvent) => {
      if (event.detail?.customCss !== undefined) {
        const css = event.detail.customCss || '';
        lastCssRef.current = css;
        lastUiCssUpdateAtRef.current = Date.now();
        setCustomCss(css);
      }
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && (event.key.includes('customCss') || event.key.includes('css.activeThemeId'))) {
        void loadAndHealCustomCss();
      }
    };

    window.addEventListener('custom-css-updated', handleCssUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('custom-css-updated', handleCssUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadAndHealCustomCss]);

  // Re-sync theme css on route changes, because some settings pages do not mount CssThemeSettings.
  useEffect(() => {
    void loadAndHealCustomCss();
  }, [location.pathname, location.search, location.hash, loadAndHealCustomCss]);

  // Inject custom CSS into document head
  useEffect(() => {
    const styleId = 'user-defined-custom-css';

    if (!customCss) {
      document.getElementById(styleId)?.remove();
      return;
    }

    const wrappedCss = processCustomCss(customCss);

    const ensureStyleAtEnd = () => {
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

      if (styleEl && styleEl.textContent === wrappedCss && styleEl === document.head.lastElementChild) {
        return;
      }

      styleEl?.remove();
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.type = 'text/css';
      styleEl.textContent = wrappedCss;
      document.head.appendChild(styleEl);
    };

    ensureStyleAtEnd();

    const observer = new MutationObserver((mutations) => {
      const hasNewStyle = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) => node.nodeName === 'STYLE' || node.nodeName === 'LINK')
      );

      if (hasNewStyle) {
        const element = document.getElementById(styleId);
        if (element && element !== document.head.lastElementChild) {
          ensureStyleAtEnd();
        }
      }
    });

    observer.observe(document.head, { childList: true });

    return () => {
      observer.disconnect();
      document.getElementById(styleId)?.remove();
    };
  }, [customCss]);

  // Detect mobile viewport and react to window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = detectMobileViewportOrTouch();
      setIsMobile(mobile);
      setViewportWidth(window.innerWidth);
    };

    // Initial check
    checkMobile();

    // Listen for window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Collapse immediately when switching to mobile
  useEffect(() => {
    if (!isMobile || collapsedRef.current) {
      return;
    }
    setCollapsed(true);
  }, [isMobile]);

  // Clean up sider Tooltip leftovers to prevent floating panels stuck in the top-left after mobile route changes
  useEffect(() => {
    cleanupSiderTooltips();
  }, [isMobile, collapsed, location.pathname, location.search, location.hash]);

  // Bridge Main Process logs to F12 Console
  useEffect(() => {
    const unsubscribe = ipcBridge.application.logStream.on((entry) => {
      const prefix = `%c[Main:${entry.tag}]%c ${entry.message}`;
      const style = 'color:#7c3aed;font-weight:bold';
      if (entry.level === 'error') {
        console.error(prefix, style, 'color:inherit', ...(entry.data !== undefined ? [entry.data] : []));
      } else if (entry.level === 'warn') {
        console.warn(prefix, style, 'color:inherit', ...(entry.data !== undefined ? [entry.data] : []));
      } else {
        console.log(prefix, style, 'color:inherit', ...(entry.data !== undefined ? [entry.data] : []));
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle tray events from main process
  useEffect(() => {
    if (!isElectronDesktop()) return;

    // Navigate to guid page when requested from tray
    const handleNavigateToGuid = () => {
      void navigate('/guid');
    };

    // Navigate to conversation when requested from tray
    const handleNavigateToConversation = (event: CustomEvent<{ conversationId: string }>) => {
      void navigate(`/conversation/${event.detail.conversationId}`);
    };

    // Open about dialog when requested from tray
    const handleOpenAbout = () => {
      // Navigate to settings/about page
      void navigate('/settings/about');
    };

    // Handle pause all tasks request from tray
    const handlePauseAllTasks = async () => {
      const { ipcBridge } = await import('@/common');
      const result = await ipcBridge.task.stopAll.invoke();
      if (result?.success) {
        // Navigate to settings page to show task status
        void navigate('/settings/system');
      }
    };

    // Handle check update request from tray
    // 1. Navigate to about page
    // 2. Trigger update modal check
    const handleCheckUpdate = () => {
      void navigate('/settings/about');
      // Trigger update modal after a short delay to ensure page is loaded
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('wayland-open-update-modal', { detail: { source: 'tray' } }));
      }, 100);
    };

    // Listen for tray events
    window.addEventListener('tray:navigate-to-guid', handleNavigateToGuid as EventListener);
    window.addEventListener('tray:navigate-to-conversation', handleNavigateToConversation as EventListener);
    window.addEventListener('tray:open-about', handleOpenAbout as EventListener);
    window.addEventListener('tray:pause-all-tasks', handlePauseAllTasks as EventListener);
    window.addEventListener('tray:check-update', handleCheckUpdate as EventListener);

    return () => {
      window.removeEventListener('tray:navigate-to-guid', handleNavigateToGuid as EventListener);
      window.removeEventListener('tray:navigate-to-conversation', handleNavigateToConversation as EventListener);
      window.removeEventListener('tray:open-about', handleOpenAbout as EventListener);
      window.removeEventListener('tray:pause-all-tasks', handlePauseAllTasks as EventListener);
      window.removeEventListener('tray:check-update', handleCheckUpdate as EventListener);
    };
  }, [navigate]);

  const siderWidth = isMobile
    ? Math.max(
        MOBILE_SIDER_MIN_WIDTH,
        Math.min(MOBILE_SIDER_MAX_WIDTH, Math.round(viewportWidth * MOBILE_SIDER_WIDTH_RATIO))
      )
    : DEFAULT_SIDER_WIDTH;
  useEffect(() => {
    collapsedRef.current = collapsed;
  }, [collapsed]);

  const beginSiderResizeDrag = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile) return;
      event.preventDefault();
      dragStateRef.current = {
        active: true,
        startX: event.clientX,
        startWidth: collapsedRef.current ? DESKTOP_COLLAPSED_WIDTH : DEFAULT_SIDER_WIDTH,
      };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [isMobile]
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState.active) return;

      const draggedWidth = dragState.startWidth + (event.clientX - dragState.startX);
      // Add a small hysteresis zone to avoid rapid toggling near the snap threshold.
      const shouldCollapse = collapsedRef.current
        ? draggedWidth < SIDER_DRAG_SNAP_THRESHOLD + SIDER_DRAG_HYSTERESIS
        : draggedWidth <= SIDER_DRAG_SNAP_THRESHOLD - SIDER_DRAG_HYSTERESIS;
      if (shouldCollapse !== collapsedRef.current) {
        setCollapsed(shouldCollapse);
      }
    };

    const endDrag = () => {
      if (!dragStateRef.current.active) return;
      dragStateRef.current.active = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleBlur = () => endDrag();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('blur', handleBlur);
      endDrag();
    };
  }, []);

  const siderStyle = isMobile
    ? {
        position: 'fixed' as const,
        left: 0,
        zIndex: 100,
        transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'none',
        pointerEvents: collapsed ? ('none' as const) : ('auto' as const),
      }
    : {
        position: 'relative' as const,
        overflow: 'visible' as const,
      };

  return (
    <LayoutContext.Provider value={{ isMobile, siderCollapsed: collapsed, setSiderCollapsed: setCollapsed }}>
      <NavigationHistoryProvider>
        <div className='app-shell flex flex-col size-full min-h-0'>
          <Titlebar workspaceAvailable={workspaceAvailable} />
          {/* Mobile left sider backdrop */}
          {isMobile && !collapsed && (
            <div className='fixed inset-0 bg-black/30 z-90' onClick={() => setCollapsed(true)} aria-hidden='true' />
          )}

          <ArcoLayout className={'size-full layout flex-1 min-h-0'}>
            <ArcoLayout.Sider
              collapsedWidth={isMobile ? 0 : 64}
              collapsed={collapsed}
              width={siderWidth}
              className={classNames('!bg-2 layout-sider', {
                collapsed: collapsed,
              })}
              style={siderStyle}
            >
              <ArcoLayout.Header
                className={classNames(
                  'flex items-center justify-start py-8px px-16px pl-20px gap-12px layout-sider-header',
                  isMobile && 'layout-sider-header--mobile',
                  {
                    'cursor-pointer group ': collapsed,
                  }
                )}
              >
                <div
                  className={classNames('shrink-0 relative rd-8px flex items-center justify-center', {
                    'size-40px': !collapsed,
                    '!size-24px': collapsed,
                  })}
                  style={{
                    background:
                      'radial-gradient(circle at 30% 30%, rgba(255, 107, 53, 0.18), transparent 70%), var(--bg-2, #161616)',
                    border: '1px solid var(--border-mid, #353535)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  }}
                  onClick={onClick}
                >
                  <svg
                    className={classNames({
                      'w-24px h-24px': !collapsed,
                      'w-14px h-14px': collapsed,
                    })}
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
                </div>
                <div className='flex-1 flex flex-col gap-2px collapsed-hidden min-w-0'>
                  <span className='text-14px font-700 text-t-primary leading-none tracking-[0.01em]'>{t('common.brand')}</span>
                  <span className='text-10px font-500 uppercase tracking-[0.16em] text-[var(--text-dim,#555)] leading-none'>
                    {t('common.brandTagline')}
                  </span>
                </div>
                {isMobile && !collapsed && (
                  <button
                    type='button'
                    className='app-titlebar__button'
                    onClick={() => setCollapsed(true)}
                    aria-label='Collapse sidebar'
                  >
                    {collapsed ? (
                      <PanelLeftOpen size={18} />
                    ) : (
                      <PanelLeftClose size={18} />
                    )}
                  </button>
                )}
                {/* Sidebar folding handled by Titlebar toggle */}
              </ArcoLayout.Header>
              <ArcoLayout.Content className='pt-8px px-8px pb-0 layout-sider-content'>
                {React.isValidElement(sider)
                  ? React.cloneElement(sider, {
                      onSessionClick: () => {
                        cleanupSiderTooltips();
                        if (isMobile) setCollapsed(true);
                      },
                      collapsed,
                    } as any)
                  : sider}
              </ArcoLayout.Content>
              {!isMobile && (
                <div
                  className='absolute top-0 h-full w-8px z-20 cursor-col-resize group'
                  style={{ right: '-4px' }}
                  onMouseDown={beginSiderResizeDrag}
                  aria-hidden='true'
                >
                  <div className='absolute top-0 left-1/2 h-full w-1px -translate-x-1/2 bg-transparent group-hover:bg-[var(--color-border-2)] transition-colors duration-150' />
                </div>
              )}
            </ArcoLayout.Sider>

            <ArcoLayout.Content
              className={'bg-1 layout-content flex flex-col min-h-0'}
              onClick={() => {
                if (isMobile && !collapsed) setCollapsed(true);
              }}
              style={
                isMobile
                  ? {
                      width: '100%',
                    }
                  : undefined
              }
            >
              <Outlet />
              {multiAgentContextHolder}
              {directorySelectionContextHolder}
              <PwaPullToRefresh />
              <Suspense fallback={null}>
                <UpdateModal />
              </Suspense>
              <CommandPalette
                open={paletteOpen}
                onClose={handlePaletteClose}
                onLaunchPreset={handleLaunchPreset}
                onResumeChat={handleResumeChat}
                onFillPrompt={handleFillPrompt}
              />
            </ArcoLayout.Content>
          </ArcoLayout>
        </div>
      </NavigationHistoryProvider>
    </LayoutContext.Provider>
  );
};

export default Layout;
