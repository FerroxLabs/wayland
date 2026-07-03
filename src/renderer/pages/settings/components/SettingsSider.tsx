import {
  ArrowRightLeft,
  Bot,
  BookOpen,
  Brain,
  Cable,
  Cpu,
  Globe,
  Image as ImageIcon,
  Info,
  Mic,
  MessageCircle,
  Monitor,
  PanelLeft,
  Pencil,
  Puzzle,
  Radio,
  ScrollText,
  Server,
  SlashSquare,
  Sparkles,
  Stethoscope,
  Zap,
} from 'lucide-react';
import FlexFullContainer from '@/renderer/components/layout/FlexFullContainer';
import { isElectronDesktop, resolveExtensionAssetUrl } from '@/renderer/utils/platform';
import { extensions as extensionsIpc, type IExtensionSettingsTab } from '@/common/adapter/ipcBridge';
import { useExtI18n } from '@/renderer/hooks/system/useExtI18n';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tooltip } from '@arco-design/web-react';
import { getSiderTooltipProps } from '@/renderer/utils/ui/siderTooltip';

/** Builtin settings tab IDs in display order (must match router paths). */
export const BUILTIN_TAB_IDS = [
  // WORKSPACE
  'assistants',
  'skills',
  'commands',
  'constitution',
  // AI MODELS
  'models',
  'agents',
  'images',
  'voice',
  // ENGINE
  'wcore',
  // INTEGRATIONS
  'webui',
  'channels',
  'mcp-library',
  'migrate',
  // APPEARANCE
  'theme',
  'editor',
  'navigation',
  // SYSTEM
  'general',
  'notifications',
  'storage',
  'ijfw',
  'doctor',
  // ABOUT
  'about',
] as const;

/**
 * Legacy anchor IDs that have been merged into other tabs.
 * Keeps older extensions working without requiring them to update.
 */
export const LEGACY_ANCHOR_REMAP: Record<string, string> = {
  'skills-hub': 'skills',
  // Legacy `tools` and `mcp` anchors now point at the new MCP Library -
  // pre-library extensions that anchored to them still resolve.
  tools: 'mcp-library',
  mcp: 'mcp-library',
  capabilities: 'skills',
  // Legacy `providers` / `gemini` / `model` all point at the new Models page -
  // the redesigned `ModelsSettings` page replaces both the legacy Providers
  // settings and the Gemini-specific surface.
  providers: 'models',
  gemini: 'models',
  model: 'models',
  display: 'theme',
  agent: 'agents',
  system: 'general',
};

/**
 * Group headers displayed above specific builtin tabs.
 * The key is the first tab ID in the group; value is the i18n key.
 */
const GROUP_HEADER_BEFORE: Record<string, string> = {
  assistants: 'settings.sider.groupWorkspace',
  models: 'settings.sider.groupAiModels',
  wcore: 'settings.sider.groupEngine',
  webui: 'settings.sider.groupIntegrations',
  theme: 'settings.sider.groupAppearance',
  general: 'settings.sider.groupSystem',
  about: 'settings.sider.groupAbout',
};

type SiderItem = {
  id: string;
  label: string;
  icon: React.ReactElement;
  isImageIcon?: boolean;
  path: string;
};

const SettingsSider: React.FC<{ collapsed?: boolean; tooltipEnabled?: boolean }> = ({
  collapsed = false,
  tooltipEnabled = false,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const isDesktop = isElectronDesktop();

  const [extensionTabs, setExtensionTabs] = useState<IExtensionSettingsTab[]>([]);
  const { resolveExtTabName } = useExtI18n();

  const loadExtensionTabs = useCallback(async (): Promise<IExtensionSettingsTab[]> => {
    const maxAttempts = 20;
    const retryDelayCapMs = 300;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const tabs = (await extensionsIpc.getSettingsTabs.invoke()) ?? [];
        if (tabs.length > 0 || attempt === maxAttempts - 1) {
          return tabs;
        }
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }

      await new Promise((resolve) => window.setTimeout(resolve, Math.min(100 * (attempt + 1), retryDelayCapMs)));
    }

    if (lastError) {
      throw lastError;
    }

    return [];
  }, []);

  useEffect(() => {
    let disposed = false;

    const syncExtensionTabs = async () => {
      try {
        const tabs = await loadExtensionTabs();
        if (!disposed) {
          setExtensionTabs(tabs);
        }
      } catch (err) {
        if (!disposed) {
          console.error('[SettingsSider] Failed to load extension settings tabs:', err);
        }
      }
    };

    void syncExtensionTabs();
    const unsubscribe = extensionsIpc.stateChanged.on(() => {
      void syncExtensionTabs();
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [loadExtensionTabs]);

  const { menus, groupHeaderAt } = useMemo(() => {
    const builtinMap: Record<string, SiderItem> = {
      assistants: {
        id: 'assistants',
        label: t('settings.assistants', { defaultValue: 'Assistants' }),
        icon: <BookOpen />,
        path: 'assistants',
      },
      constitution: {
        id: 'constitution',
        label: t('settings.sider.constitution', { defaultValue: 'Constitution' }),
        icon: <ScrollText />,
        path: 'constitution',
      },
      wcore: {
        id: 'wcore',
        label: t('settings.wcoreConfig.navLabel', { defaultValue: 'Wayland Core' }),
        icon: <Cpu />,
        path: 'wcore-config',
      },
      agents: {
        id: 'agents',
        label: t('settings.sider.agents', { defaultValue: 'Agents' }),
        icon: <Bot />,
        path: 'agents',
      },
      skills: {
        id: 'skills',
        label: t('settings.sider.skills', { defaultValue: 'Skills & Tools' }),
        icon: <Zap />,
        path: 'skills',
      },
      commands: {
        id: 'commands',
        label: t('settings.sider.commands', { defaultValue: 'Slash Commands' }),
        icon: <SlashSquare />,
        path: 'commands',
      },
      models: {
        id: 'models',
        label: t('settings.sider.models', { defaultValue: 'Models' }),
        icon: <Sparkles />,
        path: 'models',
      },
      images: {
        id: 'images',
        label: t('settings.sider.images', { defaultValue: 'Image Generation' }),
        icon: <ImageIcon />,
        path: 'images',
      },
      voice: {
        id: 'voice',
        label: t('settings.sider.voice', { defaultValue: 'Voice' }),
        icon: <Mic />,
        path: 'voice',
      },
      webui: {
        id: 'webui',
        label: t('settings.webui'),
        icon: isDesktop ? <Globe /> : <MessageCircle />,
        path: 'webui',
      },
      channels: {
        id: 'channels',
        label: t('settings.sider.channels', { defaultValue: 'Channels' }),
        icon: <Radio />,
        path: 'channels',
      },
      'mcp-library': {
        id: 'mcp-library',
        label: t('settings.sider.mcpLibrary', { defaultValue: 'MCP Library' }),
        icon: <Server />,
        path: 'mcp-library/browse',
      },
      migrate: {
        id: 'migrate',
        label: t('settings.sider.migrate', { defaultValue: 'Migrate' }),
        icon: <ArrowRightLeft />,
        path: 'migrate',
      },
      theme: {
        id: 'theme',
        label: t('settings.sider.theme', { defaultValue: 'Theme & Display' }),
        icon: <Monitor />,
        path: 'theme',
      },
      editor: {
        id: 'editor',
        label: t('settings.sider.editor', { defaultValue: 'Editor' }),
        icon: <Pencil />,
        path: 'editor',
      },
      navigation: {
        id: 'navigation',
        label: t('settings.sider.navigation', { defaultValue: 'Navigation' }),
        icon: <PanelLeft />,
        path: 'navigation',
      },
      general: {
        id: 'general',
        label: t('settings.sider.general', { defaultValue: 'General' }),
        icon: <Cpu />,
        path: 'general',
      },
      notifications: {
        id: 'notifications',
        label: t('settings.sider.notifications', { defaultValue: 'Notifications' }),
        icon: <Cable />,
        path: 'notifications',
      },
      storage: {
        id: 'storage',
        label: t('settings.sider.storage', { defaultValue: 'Storage' }),
        icon: <Globe />,
        path: 'storage',
      },
      ijfw: {
        id: 'ijfw',
        label: t('memory.settings.panel_title', { defaultValue: 'IJFW Memory' }),
        icon: <Brain />,
        path: 'ijfw',
      },
      doctor: {
        id: 'doctor',
        label: t('settings.sider.doctor', { defaultValue: 'Doctor' }),
        icon: <Stethoscope />,
        path: 'doctor',
      },
      about: {
        id: 'about',
        label: t('settings.about'),
        icon: <Info />,
        path: 'about',
      },
    };

    const result: SiderItem[] = BUILTIN_TAB_IDS.map((id) => builtinMap[id]);

    // Extension tabs with position anchoring
    const beforeMap = new Map<string, IExtensionSettingsTab[]>();
    const afterMap = new Map<string, IExtensionSettingsTab[]>();
    const unanchored: IExtensionSettingsTab[] = [];

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

    const toSiderItem = (tab: IExtensionSettingsTab): SiderItem => {
      const resolvedIcon = resolveExtensionAssetUrl(tab.icon) || tab.icon;
      return {
        id: tab.id,
        label: resolveExtTabName(tab),
        icon: resolvedIcon ? <img src={resolvedIcon} alt='' className='w-full h-full object-contain' /> : <Puzzle />,
        isImageIcon: Boolean(resolvedIcon),
        path: `ext/${tab.id}`,
      };
    };

    for (let i = result.length - 1; i >= 0; i--) {
      const builtinId = result[i].id;
      const afters = afterMap.get(builtinId);
      if (afters) {
        result.splice(i + 1, 0, ...afters.map(toSiderItem));
      }
      const befores = beforeMap.get(builtinId);
      if (befores) {
        result.splice(i, 0, ...befores.map(toSiderItem));
      }
    }

    // Append unanchored before "general" (system group)
    if (unanchored.length > 0) {
      const generalIdx = result.findIndex((item) => item.id === 'general');
      const insertIdx = generalIdx >= 0 ? generalIdx : result.length;
      result.splice(insertIdx, 0, ...unanchored.map(toSiderItem));
    }

    // Compute group header render positions
    const headerAt = new Map<number, string>();
    for (const [builtinId, headerKey] of Object.entries(GROUP_HEADER_BEFORE)) {
      const builtinIdx = result.findIndex((item) => item.id === builtinId);
      if (builtinIdx < 0) continue;
      const beforeCount = beforeMap.get(builtinId)?.length ?? 0;
      headerAt.set(builtinIdx - beforeCount, headerKey);
    }

    return { menus: result, groupHeaderAt: headerAt };
  }, [t, isDesktop, extensionTabs, resolveExtTabName]);

  const siderTooltipProps = getSiderTooltipProps(tooltipEnabled);

  return (
    <div
      className={classNames('h-full settings-sider flex flex-col gap-2px overflow-y-auto overflow-x-hidden', {
        'settings-sider--collapsed': collapsed,
      })}
    >
      {menus.map((item, index) => {
        const isSelected = pathname === `/settings/${item.path}` || pathname.startsWith(`/settings/${item.path}/`);
        const groupHeaderKey = groupHeaderAt.get(index);
        const groupHeader =
          groupHeaderKey && !collapsed ? (
            <div className='settings-sider__group-header px-8px pt-8px pb-2px text-11px font-medium text-t-tertiary uppercase tracking-wider select-none'>
              {t(groupHeaderKey)}
            </div>
          ) : null;
        return (
          <React.Fragment key={item.id}>
            {groupHeader}
            <Tooltip {...siderTooltipProps} content={item.label} position='right'>
              <div
                data-settings-id={item.id}
                data-settings-path={item.path}
                className={classNames(
                  'settings-sider__item h-26px rd-8px flex items-center gap-8px group cursor-pointer relative overflow-hidden shrink-0 conversation-item [&.conversation-item+&.conversation-item]:mt-1px transition-colors',
                  collapsed ? 'w-full justify-center px-0' : 'justify-start px-8px',
                  {
                    'hover:bg-[rgba(var(--primary-6),0.14)]': !isSelected,
                    '!bg-active': isSelected,
                  }
                )}
                onClick={() => {
                  Promise.resolve(navigate(`/settings/${item.path}`, { replace: true })).catch((error) => {
                    console.error('Navigation failed:', error);
                  });
                }}
              >
                <span className='w-20px h-20px flex items-center justify-center shrink-0'>
                  {item.isImageIcon ? (
                    <span className='w-16px h-16px flex items-center justify-center'>{item.icon}</span>
                  ) : (
                    React.cloneElement(
                      item.icon as React.ReactElement<{
                        theme?: string;
                        size?: string | number;
                        className?: string;
                        strokeWidth?: number;
                      }>,
                      {
                        theme: 'outline',
                        size: '16',
                        strokeWidth: 3,
                        className: 'block leading-none text-t-secondary',
                      }
                    )
                  )}
                </span>
                <FlexFullContainer className='h-20px collapsed-hidden'>
                  <div
                    className={classNames(
                      'settings-sider__item-label text-nowrap overflow-hidden inline-block w-full text-12px lh-20px whitespace-nowrap',
                      isSelected ? 'text-t-primary font-medium' : 'text-t-primary'
                    )}
                  >
                    {item.label}
                  </div>
                </FlexFullContainer>
              </div>
            </Tooltip>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default SettingsSider;
