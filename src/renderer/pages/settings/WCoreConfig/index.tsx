/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, LayoutGrid, Wrench, Plug, Brain, ShieldCheck, Users, Server } from 'lucide-react';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import coreLockup from '@renderer/assets/logos/brand/wayland-core-lockup.png';
import type { WCoreRailKey } from './panes/types';
import OverviewPane from './panes/OverviewPane';
import ServicesKeysPane from './panes/ServicesKeysPane';
import ToolsPane from './panes/ToolsPane';
import SecurityPane from './panes/SecurityPane';
import MemoryPane from './panes/MemoryPane';
import ProfilesPane from './panes/ProfilesPane';
import RuntimePane from './panes/RuntimePane';
import styles from './WCoreConfig.module.css';

/** The pinned engine build, shown only as a fallback until the live detected
 *  version is reported by getAvailableAgents. Keep in lockstep with
 *  DEFAULT_WCORE_VERSION in scripts/prepareWaylandCore.js. */
const PINNED_VERSION = 'v0.12.8';

type RailEntry = {
  key: WCoreRailKey;
  num: number;
  icon: React.ReactElement;
  label: string;
  /** Optional mono count badge (real value or omitted, never faked). */
  count?: number;
  /** Show the green "all working" status dot (Services & Keys). */
  ok?: boolean;
};

const WCoreConfig: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [active, setActive] = useState<WCoreRailKey>('overview');
  const [engineAvailable, setEngineAvailable] = useState<boolean | null>(null);
  const [engineVersion, setEngineVersion] = useState<string | undefined>(undefined);

  useEffect(() => {
    void ipcBridge.acpConversation.getAvailableAgents.invoke().then((result) => {
      if (result.success) {
        const agent = result.data.find((a) => a.backend === 'wcore');
        setEngineAvailable(Boolean(agent));
        if (agent && 'version' in agent && typeof (agent as { version?: string }).version === 'string') {
          setEngineVersion((agent as { version?: string }).version);
        }
      }
    });
  }, []);

  const railEntries: RailEntry[] = useMemo(
    () => [
      {
        key: 'overview',
        num: 1,
        icon: <LayoutGrid size={17} />,
        label: t('settings.wcoreConfig.rail.overview', { defaultValue: 'Overview' }),
      },
      {
        key: 'services',
        num: 2,
        icon: <Plug size={17} />,
        label: t('settings.wcoreConfig.rail.services', { defaultValue: 'Services & Keys' }),
        ok: true,
      },
      {
        key: 'tools',
        num: 3,
        icon: <Wrench size={17} />,
        label: t('settings.wcoreConfig.rail.tools', { defaultValue: 'Tools' }),
      },
      {
        key: 'memory',
        num: 4,
        icon: <Brain size={17} />,
        label: t('settings.wcoreConfig.rail.memory', { defaultValue: 'Memory' }),
      },
      {
        key: 'security',
        num: 5,
        icon: <ShieldCheck size={17} />,
        label: t('settings.wcoreConfig.rail.security', { defaultValue: 'Security & Permissions' }),
      },
      {
        key: 'profiles',
        num: 6,
        icon: <Users size={17} />,
        label: t('settings.wcoreConfig.rail.profiles', { defaultValue: 'Profiles' }),
      },
      {
        key: 'runtime',
        num: 7,
        icon: <Server size={17} />,
        label: t('settings.wcoreConfig.rail.runtime', { defaultValue: 'Runtime' }),
      },
    ],
    [t]
  );

  const renderPane = (): React.ReactNode => {
    switch (active) {
      case 'overview':
        return <OverviewPane version={engineVersion ?? PINNED_VERSION} />;
      case 'services':
        return <ServicesKeysPane />;
      case 'tools':
        return <ToolsPane onGoServices={() => setActive('services')} />;
      case 'memory':
        return <MemoryPane />;
      case 'security':
        return <SecurityPane />;
      case 'profiles':
        return <ProfilesPane />;
      case 'runtime':
        return <RuntimePane />;
      default:
        return null;
    }
  };

  const goBack = (): void => {
    void navigate('/settings', { replace: true });
  };

  const versionLabel = engineVersion ?? PINNED_VERSION;

  return (
    <div className={styles.surface}>
      {/* Core header: back link + branded lockup + engine status chip */}
      <header className={styles.topbar}>
        <div
          role='button'
          tabIndex={0}
          onClick={goBack}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              goBack();
            }
          }}
          className={styles.backLink}
        >
          <ChevronLeft size={15} />
          {t('settings.wcoreConfig.back', { defaultValue: 'Settings' })}
        </div>
        <div className={styles.divider} />
        <div className={styles.brand}>
          <img
            src={coreLockup}
            alt={t('settings.wcoreConfig.title', { defaultValue: 'Wayland Core' })}
            className={styles.brandLockup}
          />
          <div className={styles.brandText}>
            <span className={styles.microtag}>
              {t('settings.wcoreConfig.tagline', { defaultValue: 'Forged to run. Hardened to last. Built to evolve.' })}
            </span>
          </div>
        </div>
        <div className={styles.topbarRight}>
          <span className={classNames(styles.engineChip, { [styles.stopped]: engineAvailable === false })}>
            <span className={styles.chipDot} />
            {engineAvailable === false
              ? t('settings.wcoreConfig.engineStopped', { defaultValue: 'engine stopped' })
              : `${t('settings.wcoreConfig.engineRunning', { defaultValue: 'engine running' })} · ${versionLabel}`}
          </span>
        </div>
      </header>

      <div className={styles.body}>
        {/* Category rail (engine-only) */}
        <nav className={styles.rail} aria-label='Wayland Core'>
          <div className={styles.railLabel}>{t('settings.wcoreConfig.railGroup', { defaultValue: 'Engine' })}</div>
          {railEntries.map((entry) => {
            const isActive = entry.key === active;
            return (
              <div
                key={entry.key}
                role='button'
                tabIndex={0}
                data-wcore-rail-id={entry.key}
                onClick={() => setActive(entry.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActive(entry.key);
                  }
                }}
                className={classNames(styles.railItem, { [styles.active]: isActive })}
              >
                <span className={styles.railNum}>{entry.num}</span>
                {entry.icon}
                <span className={styles.railLabelText}>{entry.label}</span>
                {typeof entry.count === 'number' && <span className={styles.railCount}>{entry.count}</span>}
                {entry.ok && (
                  <span
                    className={styles.railOk}
                    title={t('settings.wcoreConfig.rail.allWorking', { defaultValue: 'all working' })}
                  />
                )}
              </div>
            );
          })}
        </nav>

        {/* Center pane router */}
        <div className={styles.detail}>
          <div className={styles.detailInner}>{renderPane()}</div>
        </div>
      </div>
    </div>
  );
};

export default WCoreConfig;
