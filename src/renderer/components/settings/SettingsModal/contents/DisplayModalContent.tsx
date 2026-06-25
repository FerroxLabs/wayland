/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Switch, Slider, Radio, Input } from '@arco-design/web-react';
import FontSizeControl from '@/renderer/components/settings/FontSizeControl';
import { ThemeSwitcher } from '@/renderer/components/settings/ThemeSwitcher';
import WaylandScrollArea from '@/renderer/components/base/WaylandScrollArea';
import { useUserDisplayName } from '@/renderer/hooks/system/useUserDisplayName';
import { useSettingsViewMode } from '../settingsViewContext';
import LaunchpadBar from '@/renderer/pages/guid/components/newChatStarter/LaunchpadBar';
import { launchAssistant } from '@/renderer/pages/assistants/utils/launchAssistant';
import type { QuickLaunchAnchor } from '@/renderer/pages/guid/quickLaunchAnchors';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import {
  readSidebarWidth,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  writeSidebarWidth,
} from '@renderer/utils/ui/sidebarWidth';

const STORAGE_KEYS = {
  reduceMotion: 'wayland:reduce-motion',
  density: 'wayland:density',
} as const;

/** Apply reduce-motion preference to document.body */
const applyReduceMotion = (enabled: boolean) => {
  document.body.classList.toggle('reduce-motion', enabled);
};

/** Apply density preference to document.body */
const applyDensity = (compact: boolean) => {
  document.body.classList.toggle('density-compact', compact);
};

/**
 * Preference row component
 * Used for displaying labels and corresponding controls in a unified horizontal layout
 */
const PreferenceRow: React.FC<{
  /** Label text */
  label: string;
  /** Control element */
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className='flex flex-col items-stretch gap-10px py-12px md:flex-row md:items-center md:justify-between md:gap-24px'>
    <div className='text-14px text-t-primary leading-22px'>{label}</div>
    <div className='w-full flex md:flex-1 md:justify-end'>{children}</div>
  </div>
);

/**
 * Display settings content component
 *
 * Provides display-related configuration options including theme and zoom scale.
 *
 * @features
 * - Theme: light/dark/system
 * - Zoom scale control
 */
const DisplayModalContent: React.FC = () => {
  const { t } = useTranslation();
  const viewMode = useSettingsViewMode();
  const isPageMode = viewMode === 'page';
  const navigate = useNavigate();

  const { osName, configuredName, save: saveDisplayName, loaded: nameLoaded } = useUserDisplayName();
  const [nameDraft, setNameDraft] = useState('');

  // Seed the input once the stored override resolves.
  useEffect(() => {
    setNameDraft(configuredName);
  }, [configuredName]);

  const commitName = () => {
    if (nameDraft.trim() !== configuredName) {
      void saveDisplayName(nameDraft);
    }
  };

  // Reduce Motion defaults ON (calmer, faster-feeling UI; matches the brand's
  // "no ceremony" stance) - on unless the user has explicitly turned it off.
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem(STORAGE_KEYS.reduceMotion) !== 'false');
  const [densityCompact, setDensityCompact] = useState(() => localStorage.getItem(STORAGE_KEYS.density) === 'compact');
  const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth);

  // Apply persisted values on mount
  useEffect(() => {
    applyReduceMotion(reduceMotion);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleReduceMotion = (checked: boolean) => {
    setReduceMotion(checked);
    localStorage.setItem(STORAGE_KEYS.reduceMotion, String(checked));
    applyReduceMotion(checked);
  };

  const toggleDensity = (value: string) => {
    const compact = value === 'compact';
    setDensityCompact(compact);
    localStorage.setItem(STORAGE_KEYS.density, compact ? 'compact' : 'comfortable');
    applyDensity(compact);
  };

  const onSidebarWidthChange = (value: number) => {
    // Persist + clamp + mirror to the CSS var + fire the live-update event so
    // the main sidebar resizes immediately (#84). Reflect the clamped value back
    // into the slider so it can't drift out of range.
    setSidebarWidth(writeSidebarWidth(value));
  };

  // Display items configuration
  const displayItems = [
    { key: 'theme', label: t('settings.theme'), component: <ThemeSwitcher /> },
    { key: 'fontSize', label: t('settings.fontSize'), component: <FontSizeControl /> },
  ];

  const handleLaunchpadBarAnchor = useCallback(
    (anchor: QuickLaunchAnchor) => {
      // Clicking a card from Settings is a deliberate "launch this assistant now"
      // intent - the same cross-page navigation /assistants uses.
      const bareId = anchor.assistantId.startsWith('builtin-')
        ? anchor.assistantId.slice('builtin-'.length)
        : anchor.assistantId;
      const preset = ASSISTANT_PRESETS.find((p) => p.id === bareId);
      void launchAssistant({ id: bareId, presetAgentType: preset?.presetAgentType }, (path, options) =>
        navigate(path, options)
      );
    },
    [navigate]
  );

  return (
    <div className='flex flex-col h-full w-full'>
      {/* Content Area */}
      <WaylandScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow={isPageMode}>
        <div className='space-y-16px'>
          {/* Launchpad bar customization - same widget as /assistants and the launchpad cold-start. */}
          <div
            className='px-16px md:px-24px lg:px-28px py-14px md:py-16px bg-[var(--color-bg-2)] border-2 border-solid border-[var(--color-border-2)] rd-12px'
            data-testid='settings-launchpad-section'
          >
            <div className='mb-12px'>
              <div className='text-14px font-600 text-[var(--color-text-1)]'>
                {t('settings.displayPage.launchpadBar', { defaultValue: 'Launchpad bar' })}
              </div>
              <div className='text-12px text-[var(--color-text-3)] mt-2px'>
                {t('settings.displayPage.launchpadHint', {
                  defaultValue:
                    'Drag to reorder, click × to remove, + to add. Shared with the launchpad and /assistants.',
                })}
              </div>
            </div>
            <LaunchpadBar mode='expanded' onAnchorClick={handleLaunchpadBarAnchor} />
          </div>

          {/* Display Settings */}
          <div className='px-16px md:px-24px lg:px-28px py-14px md:py-16px bg-[var(--color-bg-2)] border-2 border-solid border-[var(--color-border-2)] rd-12px space-y-10px md:space-y-12px'>
            <div className='w-full flex flex-col divide-y divide-border-2'>
              <PreferenceRow label={t('settings.displayPage.yourName')}>
                <Input
                  className='w-full md:max-w-240px'
                  value={nameDraft}
                  placeholder={osName || t('settings.displayPage.yourNamePlaceholder')}
                  disabled={!nameLoaded}
                  allowClear
                  onChange={setNameDraft}
                  onBlur={commitName}
                  onPressEnter={commitName}
                />
              </PreferenceRow>
              {displayItems.map((item) => (
                <PreferenceRow key={item.key} label={item.label}>
                  {item.component}
                </PreferenceRow>
              ))}
              <PreferenceRow label={t('settings.displayPage.reduceMotion')}>
                <Switch checked={reduceMotion} onChange={toggleReduceMotion} />
              </PreferenceRow>
              <PreferenceRow label={t('settings.displayPage.densityComfortable')}>
                <Radio.Group
                  value={densityCompact ? 'compact' : 'comfortable'}
                  onChange={toggleDensity}
                  type='button'
                  size='small'
                >
                  <Radio value='comfortable'>{t('settings.displayPage.densityComfortable')}</Radio>
                  <Radio value='compact'>{t('settings.displayPage.densityCompact')}</Radio>
                </Radio.Group>
              </PreferenceRow>
              <PreferenceRow label={t('settings.displayPage.sidebarWidth')}>
                <div className='w-full max-w-200px'>
                  <Slider
                    min={SIDEBAR_WIDTH_MIN}
                    max={SIDEBAR_WIDTH_MAX}
                    step={4}
                    value={sidebarWidth}
                    onChange={(v) => onSidebarWidthChange(v as number)}
                  />
                </div>
              </PreferenceRow>
            </div>
          </div>
        </div>
      </WaylandScrollArea>
    </div>
  );
};

export default DisplayModalContent;
