/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { CloudCog, Globe, Info, Monitor, Puzzle, Sparkles, Wrench } from 'lucide-react';
import WaylandModal from '@/renderer/components/base/WaylandModal';
import WaylandScrollArea from '@/renderer/components/base/WaylandScrollArea';
import { iconColors } from '@/renderer/styles/colors';
import { isElectronDesktop, resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { extensions as extensionsIpc, type IExtensionSettingsTab } from '@/common/adapter/ipcBridge';
import { useExtI18n } from '@/renderer/hooks/system/useExtI18n';
import { Tabs } from '@arco-design/web-react';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AboutModalContent from './contents/AboutModalContent';
import AgentModalContent from './contents/AgentModalContent';
import ExtensionSettingsTabContent from './contents/ExtensionSettingsTabContent';
import GeminiModalContent from './contents/GeminiModalContent';
import SystemModalContent from './contents/SystemModalContent';
import ToolsModalContent from './contents/ToolsModalContent';
import WebuiModalContent from './contents/WebuiModalContent';
import { SettingsViewModeProvider } from './settingsViewContext';

// ==================== Constants ====================

/** Mobile breakpoint (px) */
const MOBILE_BREAKPOINT = 768;

/** Sidebar width (px) */
const SIDEBAR_WIDTH = 200;

/** Modal width configuration */
const MODAL_WIDTH = {
  mobile: 560,
  desktop: 880,
} as const;

/** Modal height configuration */
const MODAL_HEIGHT = {
  mobile: '90vh',
  mobileContent: 'calc(90vh - 80px)',
  desktop: 459,
} as const;

const ExtensionMaskIcon: React.FC<{ src: string }> = ({ src }) => (
  <span
    className='block w-20px h-20px bg-current'
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

/** Resize event debounce delay (ms) */
const RESIZE_DEBOUNCE_DELAY = 150;

// ==================== Type Definitions ====================

/**
 * Built-in settings tab type
 */
export type BuiltinSettingTab = 'gemini' | 'model' | 'agent' | 'tools' | 'webui' | 'system' | 'about';

/**
 * Settings tab type (built-in + extension)
 */
export type SettingTab = BuiltinSettingTab | (string & {});

/**
 * Settings modal component props
 */
interface SettingsModalProps {
  /** Modal visibility state */
  visible: boolean;
  /** Close callback */
  onCancel: () => void;
  /** Default selected tab */
  defaultTab?: SettingTab;
}

/**
 * Secondary modal component props
 */
interface SubModalProps {
  /** Modal visibility state */
  visible: boolean;
  /** Close callback */
  onCancel: () => void;
  /** Modal title */
  title?: string;
  /** Children elements */
  children: React.ReactNode;
}

/**
 * Secondary modal component
 * Used for secondary dialogs in settings page
 *
 * @example
 * ```tsx
 * <SubModal visible={showModal} onCancel={handleClose} title="Details">
 *   <div>Modal content</div>
 * </SubModal>
 * ```
 */
export const SubModal: React.FC<SubModalProps> = ({ visible, onCancel, title, children }) => {
  return (
    <WaylandModal
      visible={visible}
      onCancel={onCancel}
      footer={null}
      className='settings-sub-modal'
      size='medium'
      title={title}
    >
      <WaylandScrollArea className='h-full px-20px pb-16px text-14px text-t-primary'>{children}</WaylandScrollArea>
    </WaylandModal>
  );
};

/**
 * Main settings modal component
 *
 * Provides global settings interface with multiple tabs including Gemini, Model, Tools, System and About
 *
 * @features
 * - Responsive design with dropdown on mobile and sidebar on desktop
 * - Debounced window resize listener
 * - Tab state management
 *
 * @example
 * ```tsx
 * const { openSettings, settingsModal } = useSettingsModal();
 * // Open settings modal and navigate to system tab
 * openSettings('system');
 * ```
 */
const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onCancel, defaultTab = 'gemini' }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingTab>(defaultTab);
  const [isMobile, setIsMobile] = useState(false);
  const resizeTimerRef = useRef<number | undefined>(undefined);
  const [extensionTabs, setExtensionTabs] = useState<IExtensionSettingsTab[]>([]);

  /**
   * Handle window resize and update mobile state
   */
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  // Listen to window resize (with debounce)
  useEffect(() => {
    // Initialize mobile state
    handleResize();

    // Debounced resize handler
    const debouncedResize = () => {
      if (resizeTimerRef.current) {
        window.clearTimeout(resizeTimerRef.current);
      }
      resizeTimerRef.current = window.setTimeout(handleResize, RESIZE_DEBOUNCE_DELAY);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimerRef.current) {
        window.clearTimeout(resizeTimerRef.current);
      }
    };
  }, [handleResize]);

  // Fetch extension-contributed settings tabs when modal opens
  useEffect(() => {
    if (!visible) return;
    void extensionsIpc.getSettingsTabs
      .invoke()
      .then((tabs) => {
        setExtensionTabs(tabs ?? []);
      })
      .catch((err) => {
        console.error('[SettingsModal] Failed to load extension settings tabs:', err);
      });
  }, [visible]);

  // Check if running in Electron desktop environment
  const isDesktop = isElectronDesktop();

  const { resolveExtTabName } = useExtI18n();

  // Extension tab lookup map for renderContent
  const extensionTabMap = useMemo(() => {
    const map = new Map<string, IExtensionSettingsTab>();
    for (const tab of extensionTabs) {
      map.set(tab.id, tab);
    }
    return map;
  }, [extensionTabs]);

  // Menu items configuration
  // Built-in Tab subset in Modal mode (excludes display, agent)
  const menuItems = useMemo((): Array<{ key: SettingTab; label: string; icon: React.ReactNode }> => {
    type MenuItem = { key: string; label: string; icon: React.ReactNode };

    // Modal built-in tabs (subset - no display/agent route pages)
    const builtinItems: MenuItem[] = [
      {
        key: 'gemini',
        label: t('settings.gemini'),
        icon: <Sparkles size={20} color={iconColors.secondary} />,
      },
      {
        key: 'model',
        label: t('settings.model'),
        icon: <CloudCog size={20} color={iconColors.secondary} />,
      },
      {
        key: 'tools',
        label: t('settings.tools'),
        icon: <Wrench size={20} color={iconColors.secondary} />,
      },
    ];

    if (isDesktop) {
      builtinItems.push({
        key: 'webui',
        label: t('settings.webui'),
        icon: <Globe size={20} color={iconColors.secondary} />,
      });
    }

    builtinItems.push(
      {
        key: 'system',
        label: t('settings.system'),
        icon: <Monitor size={20} color={iconColors.secondary} />,
      },
      { key: 'about', label: t('settings.about'), icon: <Info size={20} color={iconColors.secondary} /> }
    );

    // Extension tabs - position anchoring
    const beforeMap = new Map<string, IExtensionSettingsTab[]>();
    const afterMap = new Map<string, IExtensionSettingsTab[]>();
    const unanchored: IExtensionSettingsTab[] = [];

    for (const tab of extensionTabs) {
      if (!tab.position) {
        unanchored.push(tab);
        continue;
      }
      const { anchor, placement } = tab.position;
      const map = placement === 'before' ? beforeMap : afterMap;
      let list = map.get(anchor);
      if (!list) {
        list = [];
        map.set(anchor, list);
      }
      list.push(tab);
    }

    const toMenuItem = (tab: IExtensionSettingsTab): MenuItem => {
      const resolvedIcon = resolveExtensionAssetUrl(tab.icon) || tab.icon;
      return {
        key: tab.id,
        label: resolveExtTabName(tab),
        icon: resolvedIcon ? (
          <ExtensionMaskIcon src={resolvedIcon} />
        ) : (
          <Puzzle size={20} color={iconColors.secondary} />
        ),
      };
    };

    // Insert anchored tabs
    for (let i = builtinItems.length - 1; i >= 0; i--) {
      const id = builtinItems[i].key;
      const afters = afterMap.get(id);
      if (afters) builtinItems.splice(i + 1, 0, ...afters.map(toMenuItem));
      const befores = beforeMap.get(id);
      if (befores) builtinItems.splice(i, 0, ...befores.map(toMenuItem));
    }

    // Append unanchored before system
    if (unanchored.length > 0) {
      const sysIdx = builtinItems.findIndex((item) => item.key === 'system');
      const idx = sysIdx >= 0 ? sysIdx : builtinItems.length;
      builtinItems.splice(idx, 0, ...unanchored.map(toMenuItem));
    }

    return builtinItems;
  }, [t, isDesktop, extensionTabs, resolveExtTabName]);

  // Track which extension tabs have been visited (lazy mount + keep-alive)
  const [mountedExtTabs, setMountedExtTabs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (extensionTabMap.has(activeTab)) {
      setMountedExtTabs((prev) => {
        if (prev.has(activeTab)) return prev;
        const next = new Set(prev);
        next.add(activeTab);
        return next;
      });
    }
  }, [activeTab, extensionTabMap]);

  // Reset mounted tabs when modal closes to free memory
  useEffect(() => {
    if (!visible) {
      setMountedExtTabs(new Set());
    }
  }, [visible]);

  // Render built-in tab content (conditional)
  const renderBuiltinContent = () => {
    switch (activeTab) {
      case 'gemini':
        return <GeminiModalContent />;
      case 'agent':
        return <AgentModalContent />;
      case 'tools':
        return <ToolsModalContent />;
      case 'webui':
        return <WebuiModalContent />;
      case 'system':
        return <SystemModalContent />;
      case 'about':
        return <AboutModalContent />;
      default:
        // If no built-in match and not an extension tab, return null
        if (!extensionTabMap.has(activeTab)) return null;
        return null;
    }
  };

  // Render keep-alive extension tabs (always mounted once visited, hidden via CSS)
  const renderExtensionTabs = () => {
    return Array.from(mountedExtTabs).map((tabKey) => {
      const extTab = extensionTabMap.get(tabKey);
      if (!extTab) return null;
      const isActive = activeTab === tabKey;
      return (
        <div key={tabKey} className='w-full h-full' style={{ display: isActive ? 'block' : 'none' }}>
          <ExtensionSettingsTabContent
            tabId={extTab.id}
            entryUrl={extTab.entryUrl}
            extensionName={extTab._extensionName}
          />
        </div>
      );
    });
  };

  /**
   * Switch tab
   * @param tab - Target tab
   */
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Mobile menu (Tabs)
  const mobileMenu = (
    <div className='mt-16px mb-20px overflow-x-auto'>
      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        type='line'
        size='default'
        className='settings-mobile-tabs [&_.arco-tabs-nav]:border-b-0'
      >
        {menuItems.map((item) => (
          <Tabs.TabPane key={item.key} title={item.label} />
        ))}
      </Tabs>
    </div>
  );

  // Desktop menu (sidebar)
  const desktopMenu = (
    <WaylandScrollArea
      className='flex-shrink-0 b-color-border-2 scrollbar-hide'
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      <div className='flex flex-col gap-2px'>
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={classNames(
              'flex items-center px-14px py-10px rd-8px cursor-pointer transition-all duration-150 select-none',
              {
                'bg-aou-2 text-t-primary': activeTab === item.key,
                'text-t-secondary hover:bg-fill-1': activeTab !== item.key,
              }
            )}
            onClick={() => setActiveTab(item.key)}
          >
            <span className='mr-12px text-16px line-height-[10px]'>{item.icon}</span>
            <span className='text-14px font-500 flex-1 lh-22px'>{item.label}</span>
          </div>
        ))}
      </div>
    </WaylandScrollArea>
  );

  return (
    <SettingsViewModeProvider value='modal'>
      <WaylandModal
        visible={visible}
        onCancel={onCancel}
        footer={null}
        className='settings-modal'
        style={{
          width: isMobile
            ? `min(calc(100vw - 32px), ${MODAL_WIDTH.mobile}px)`
            : `clamp(var(--app-min-width, 360px), 100vw, ${MODAL_WIDTH.desktop}px)`,
          maxHeight: isMobile ? MODAL_HEIGHT.mobile : undefined,
          borderRadius: '16px',
        }}
        contentStyle={{ padding: isMobile ? '16px' : '24px 24px 32px' }}
        title={t('settings.title')}
      >
        <div
          className={classNames('overflow-hidden gap-0', isMobile ? 'flex flex-col min-h-0' : 'flex mt-20px')}
          style={{
            height: isMobile ? MODAL_HEIGHT.mobileContent : `${MODAL_HEIGHT.desktop}px`,
          }}
        >
          {isMobile ? mobileMenu : desktopMenu}

          <WaylandScrollArea
            className={classNames('flex-1 min-h-0', isMobile ? 'overflow-y-auto' : 'flex flex-col pl-24px gap-16px')}
          >
            {renderBuiltinContent()}
            {renderExtensionTabs()}
          </WaylandScrollArea>
        </div>
      </WaylandModal>
    </SettingsViewModeProvider>
  );
};

export default SettingsModal;
