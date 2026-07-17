/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, ChevronRight, Code, Download, RefreshCw } from 'lucide-react';
import { Divider, Typography, Button, Switch } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { useSettingsViewMode } from '../settingsViewContext';
import { isElectronDesktop, openExternalUrl } from '@/renderer/utils/platform';
import { runWaylandUpdaterExtensionCheck } from '@/renderer/pages/settings/utils/waylandUpdaterBridge';
import packageJson from '../../../../../../package.json';
import FeedbackReportModal from './FeedbackReportModal';

/** Inline auto-check status shown on the About page (#731). */
type AboutUpdateState = 'checking' | 'upToDate' | 'available' | 'error';

/**
 * The About tab remounts every time it's opened, and each check hits the
 * unauthenticated GitHub REST API (60 req/hr/IP). Cache the last SUCCESSFUL
 * result briefly so re-opening the tab serves the cached status instead of
 * re-spending the rate limit; an explicit retry always forces a fresh check,
 * and errors are never cached so a transient failure re-checks next time (#731).
 */
const ABOUT_CHECK_TTL_MS = 5 * 60_000;

type AboutCheckCache = {
  at: number;
  includePrerelease: boolean;
  state: Extract<AboutUpdateState, 'upToDate' | 'available'>;
  latestVersion: string;
};

let aboutCheckCache: AboutCheckCache | null = null;

/** Test-only: clear the module-level About update-check cache. */
export function __resetAboutCheckCacheForTest(): void {
  aboutCheckCache = null;
}

type LinkItem =
  | { title: string; url: string; icon: React.ReactNode; onClick?: never }
  | { title: string; onClick: () => void; icon: React.ReactNode; url?: never };

const AboutModalContent: React.FC = () => {
  const { t } = useTranslation();
  const viewMode = useSettingsViewMode();
  const isPageMode = viewMode === 'page';
  const isElectron = isElectronDesktop();

  // Read the persisted prerelease preference synchronously so the first
  // auto-check (below) runs with the correct channel and doesn't double-fire.
  const [includePrerelease, setIncludePrerelease] = useState<boolean>(
    () => localStorage.getItem('update.includePrerelease') === 'true'
  );
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // #731: auto-check for updates when the About page opens and surface the
  // status inline, so users see "up to date" / "update available" without
  // having to press a button first.
  const [updateState, setUpdateState] = useState<AboutUpdateState>('checking');
  const [latestVersion, setLatestVersion] = useState('');
  // Bumping this re-runs the check effect (manual retry) without duplicating
  // the check logic. The effect's cancelled-guard keeps a superseded in-flight
  // check from clobbering a newer result.
  const [checkNonce, setCheckNonce] = useState(0);

  const handlePrereleaseChange = (val: boolean) => {
    setIncludePrerelease(val);
    localStorage.setItem('update.includePrerelease', String(val));
  };

  useEffect(() => {
    if (!isElectron) return;

    // Serve a recent cached result on remount to avoid re-hitting the rate
    // limit. checkNonce > 0 means an explicit retry, which always re-checks.
    if (
      checkNonce === 0 &&
      aboutCheckCache &&
      aboutCheckCache.includePrerelease === includePrerelease &&
      Date.now() - aboutCheckCache.at < ABOUT_CHECK_TTL_MS
    ) {
      setLatestVersion(aboutCheckCache.latestVersion);
      setUpdateState(aboutCheckCache.state);
      return;
    }

    let cancelled = false;
    setUpdateState('checking');
    void (async () => {
      try {
        const result = await runWaylandUpdaterExtensionCheck(includePrerelease, '[AboutModalContent]');
        if (cancelled) return;
        if (!result.ok) {
          setUpdateState('error');
          return;
        }
        const data = result.manual?.data;
        // Wayland-app update only — an IJFW-only update (data.ijfw) must not flip
        // this to "available" (mirrors UpdateModal's waylandUpdateAvailable logic).
        const waylandUpdateAvailable = Boolean(data?.updateAvailable || result.autoUpdateAvailable);
        const nextState: AboutCheckCache['state'] = waylandUpdateAvailable ? 'available' : 'upToDate';
        const nextVersion = waylandUpdateAvailable ? data?.latest?.version || result.autoVersion || '' : '';
        setLatestVersion(nextVersion);
        setUpdateState(nextState);
        // Only successful checks are cached; errors fall through so the next
        // open re-checks rather than pinning a stale failure.
        aboutCheckCache = { at: Date.now(), includePrerelease, state: nextState, latestVersion: nextVersion };
      } catch {
        if (!cancelled) setUpdateState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isElectron, includePrerelease, checkNonce]);

  const openLink = async (url: string) => {
    try {
      await openExternalUrl(url);
    } catch (error) {
      console.log('Failed to open link:', error);
    }
  };

  const checkUpdate = () => {
    // Use window custom event for renderer-side communication (buildEmitter only works main->renderer)
    window.dispatchEvent(new CustomEvent('wayland-open-update-modal', { detail: { source: 'about' } }));
  };

  const linkItems: LinkItem[] = [
    {
      title: t('settings.helpDocumentation'),
      url: 'https://github.com/FerroxLabs/wayland/wiki',
      icon: <ChevronRight size={16} />,
    },
    {
      title: t('settings.updateLog'),
      url: 'https://github.com/FerroxLabs/wayland/releases',
      icon: <ChevronRight size={16} />,
    },
    {
      title: t('settings.feedback'),
      url: 'https://github.com/FerroxLabs/wayland/issues',
      icon: <ChevronRight size={16} />,
    },
    {
      title: t('settings.bugReport'),
      onClick: () => setShowFeedbackModal(true),
      icon: <ChevronRight size={16} />,
    },
    {
      title: t('settings.contactMe'),
      url: 'https://x.com/WailiVery',
      icon: <ChevronRight size={16} />,
    },
    {
      title: t('settings.officialWebsite'),
      url: 'https://getwayland.com',
      icon: <ChevronRight size={16} />,
    },
  ];

  return (
    <div className='flex flex-col h-full w-full'>
      {/* Content Area */}
      <div
        className={classNames(
          'flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-24px',
          isPageMode && 'px-0 overflow-visible'
        )}
      >
        <div className='flex flex-col max-w-500px mx-auto'>
          {/* App Info Section */}
          <div className='flex flex-col items-center pb-24px'>
            <Typography.Title heading={3} className='text-24px font-bold text-t-primary mb-8px'>
              Wayland
            </Typography.Title>
            <Typography.Text className='text-14px text-t-secondary mb-12px text-center'>
              {t('settings.appDescription')}
            </Typography.Text>
            <div className='flex items-center justify-center gap-8px mb-16px'>
              <span className='px-10px py-4px rd-6px text-13px bg-fill-2 text-t-primary font-500'>
                v{packageJson.version}
              </span>
              <div
                className='text-t-primary cursor-pointer hover:text-t-secondary transition-colors p-4px'
                onClick={() =>
                  openLink('https://github.com/FerroxLabs/wayland').catch((error) =>
                    console.error('Failed to open link:', error)
                  )
                }
              >
                <Code size={20} />
              </div>
            </div>

            {/* Check Update Section (#731: auto-checks on open, shows status inline) */}
            {isElectron && (
              <div className='flex flex-col items-center gap-12px w-full max-w-300px bg-fill-2 p-16px rounded-lg'>
                {updateState === 'checking' && (
                  <div className='flex items-center gap-8px text-13px text-t-secondary'>
                    <RefreshCw size={14} className='animate-spin' />
                    <span>{t('update.checking')}</span>
                  </div>
                )}

                {updateState === 'upToDate' && (
                  <>
                    <div className='flex items-center gap-8px text-13px text-t-primary font-500'>
                      <CheckCircle2 size={16} color='rgb(var(--success-6))' />
                      <span>{t('update.upToDateTitle')}</span>
                    </div>
                    <Button type='secondary' long onClick={() => setCheckNonce((n) => n + 1)}>
                      {t('settings.checkForUpdates')}
                    </Button>
                  </>
                )}

                {updateState === 'available' && (
                  <>
                    <Typography.Text className='text-13px text-t-primary text-center font-500'>
                      {t('update.pill.tooltip', { version: latestVersion || '' })}
                    </Typography.Text>
                    <Button type='primary' long icon={<Download size={14} />} onClick={checkUpdate}>
                      {t('update.availableTitle')}
                    </Button>
                  </>
                )}

                {updateState === 'error' && (
                  <>
                    <Typography.Text className='text-12px text-t-tertiary text-center'>
                      {t('update.checkFailed')}
                    </Typography.Text>
                    <Button
                      type='primary'
                      long
                      icon={<RefreshCw size={14} />}
                      onClick={() => setCheckNonce((n) => n + 1)}
                    >
                      {t('settings.checkForUpdates')}
                    </Button>
                  </>
                )}

                <div className='flex items-center justify-between w-full'>
                  <Typography.Text className='text-12px text-t-secondary'>
                    {t('settings.includePrereleaseUpdates')}
                  </Typography.Text>
                  <Switch size='small' checked={includePrerelease} onChange={handlePrereleaseChange} />
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <Divider className='my-16px' />

          {/* Links Section */}
          <div className='flex flex-col gap-4px pt-8px'>
            {linkItems.map((item, index) => (
              <div
                key={index}
                className='flex items-center justify-between px-16px py-12px rd-8px hover:bg-fill-2 transition-all cursor-pointer group'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if ('url' in item) {
                    openLink(item.url).catch((error) => console.error('Failed to open link:', error));
                  } else {
                    item.onClick();
                  }
                }}
              >
                <Typography.Text className='text-14px text-t-primary'>{item.title}</Typography.Text>
                <div className='text-t-secondary group-hover:text-t-primary transition-colors'>{item.icon}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <FeedbackReportModal visible={showFeedbackModal} onCancel={() => setShowFeedbackModal(false)} />
    </div>
  );
};

export default AboutModalContent;
