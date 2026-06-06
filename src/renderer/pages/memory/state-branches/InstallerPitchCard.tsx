/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * InstallerPitchCard -- v0.6.3 re-enable surface.
 *
 * Originally the default `not_installed` surface (Wave 4). After the v0.6.3
 * auto-install UX flip, MemoryPage routes here ONLY when the user has
 * explicitly opted out (`status.reason === 'opt_out'`). For the first-boot
 * / auto-install-pending case it now routes to AutoSettingUpCard, which is
 * the truly silent background-install surface.
 *
 * Discloses IJFW + Ferrox Labs provenance per Sean's directive and renames
 * the primary CTA from "Install Memory" to "Enable Memory" -- the user
 * already chose to disable it, so the action they're taking now is to
 * re-enable. The click handler chains BOTH the opt-out clear AND the
 * install kick so the user does not have to flip the Settings switch first.
 */

import { Button, Spin } from '@arco-design/web-react';
import { Check } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ipcBridge } from '@/common';
import styles from './InstallerPitchCard.module.css';

const InstallerPitchCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = useCallback(async () => {
    if (isInstalling) return;
    setIsInstalling(true);
    try {
      // Order matters: clear opt-out BEFORE kicking install, otherwise the
      // bootstrap path may short-circuit on the still-set skip flag. We await
      // both serially so a skipSetup failure aborts before we spawn the
      // installer.
      await ipcBridge.ijfw.skipSetup.invoke({ enabled: false });
      await ipcBridge.ijfw.triggerInstall.invoke();
    } catch {
      // If either bridge call rejects, flip the button back so the user can
      // retry. MemoryPage will route to InstallFailedCard if the lifecycle
      // status moves to `install_failed`; here we only own the local CTA
      // state.
      setIsInstalling(false);
    }
  }, [isInstalling]);

  const handleSettings = useCallback(() => {
    navigate('/settings/ijfw');
  }, [navigate]);

  return (
    <div className={styles.center} data-testid='memory-installer-pitch'>
      <div className={styles.card}>
        <h2 className='text-24px font-semibold text-t-primary leading-32px m-0'>
          {t('memory.pitch.headline')}
        </h2>
        <p className='text-14px text-t-secondary leading-22px m-0'>
          {t('memory.pitch.lede')}
        </p>
        <ul className={styles.bullets}>
          <li className={styles.bullet}>
            <Check size={18} className={styles.checkIcon} aria-hidden />
            <span className='text-14px text-t-primary leading-22px'>{t('memory.pitch.bullet1')}</span>
          </li>
          <li className={styles.bullet}>
            <Check size={18} className={styles.checkIcon} aria-hidden />
            <span className='text-14px text-t-primary leading-22px'>{t('memory.pitch.bullet2')}</span>
          </li>
          <li className={styles.bullet}>
            <Check size={18} className={styles.checkIcon} aria-hidden />
            <span className='text-14px text-t-primary leading-22px'>{t('memory.pitch.bullet3')}</span>
          </li>
        </ul>
        <div className={styles.actions}>
          <Button
            type='primary'
            size='large'
            disabled={isInstalling}
            onClick={handleInstall}
            data-testid='memory-installer-pitch-install-cta'
          >
            {isInstalling ? (
              <span className={styles.installingRow}>
                <Spin size={14} />
                {t('memory.installing.title')}
              </span>
            ) : (
              t('memory.pitch.enable_cta')
            )}
          </Button>
          <Button
            type='text'
            size='small'
            onClick={handleSettings}
            data-testid='memory-installer-pitch-settings-link'
          >
            {t('memory.pitch.settings_link')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallerPitchCard;
