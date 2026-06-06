/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AutoSettingUpCard -- v0.6.3 disclosure / auto-install UX flip.
 *
 * Default surface for `status === 'not_installed'` when there is no explicit
 * reason (first boot, auto-install pending). Communicates that setup is
 * happening silently in the background and discloses the IJFW + Ferrox Labs
 * provenance. Intentionally has NO action buttons -- auto-install runs from
 * the bootstrap path at app boot; if the user wants to opt out, they go
 * through Settings (linked at the 60s help surface).
 *
 * Progressive disclosure timers (real wall-clock):
 *   - 0s : spinner + headline + subtitle + brand line
 *   - 8s : add "still setting up" reassurance line
 *   - 60s: add help link to Settings (manual retry escape hatch)
 *
 * If the lifecycle status transitions, MemoryPage unmounts this component
 * before the timers fire again, so no cleanup of consumed visual state is
 * required beyond clearTimeout.
 */

import { Button, Spin } from '@arco-design/web-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './AutoSettingUpCard.module.css';

const TAKING_LONGER_MS = 8_000;
const HELP_LINK_MS = 60_000;

const AutoSettingUpCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showTakingLonger, setShowTakingLonger] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const takingLongerTimer = setTimeout(() => {
      setShowTakingLonger(true);
    }, TAKING_LONGER_MS);
    const helpTimer = setTimeout(() => {
      setShowHelp(true);
    }, HELP_LINK_MS);
    return () => {
      clearTimeout(takingLongerTimer);
      clearTimeout(helpTimer);
    };
  }, []);

  const handleHelpClick = useCallback(() => {
    navigate('/settings/ijfw');
  }, [navigate]);

  return (
    <div
      className={styles.center}
      data-testid='memory-auto-setting-up'
      role='status'
      aria-busy='true'
      aria-live='polite'
    >
      <div className={styles.card}>
        <div className={styles.spinnerRow}>
          <Spin size={28} />
        </div>
        <h2 className='text-20px font-semibold text-t-primary leading-28px m-0'>
          {t('memory.setting_up.title')}
        </h2>
        <p className='text-14px text-t-secondary leading-22px m-0'>
          {t('memory.setting_up.subtitle')}
        </p>
        <p
          className={`text-12px text-t-tertiary leading-18px m-0 ${styles.brandLine}`}
          data-testid='memory-auto-setting-up-brand'
        >
          {t('memory.setting_up.brand_line')}
        </p>
        {showTakingLonger ? (
          <p
            className='text-12px text-t-tertiary leading-18px m-0'
            data-testid='memory-auto-setting-up-taking-longer'
          >
            {t('memory.setting_up.taking_longer')}
          </p>
        ) : null}
        {showHelp ? (
          <Button
            type='text'
            size='small'
            onClick={handleHelpClick}
            data-testid='memory-auto-setting-up-help-link'
          >
            {t('memory.setting_up.help')}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default AutoSettingUpCard;
