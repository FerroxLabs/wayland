/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import QuickLaunchCard from './QuickLaunchCard';
import {
  QUICK_LAUNCH_ANCHORS,
  type QuickLaunchAnchor,
  type QuickLaunchAnchorId,
} from '@/renderer/pages/guid/quickLaunchAnchors';
import styles from './QuickLaunchRow.module.css';

/**
 * 6-card quick-launch grid for the launchpad cold-start page. Resolves
 * card clicks back to the full QuickLaunchAnchor object so the parent
 * (NewChatStarter) gets prefill + assistantId + telemetry id in one
 * shot. View-all link is a separate callback so the parent decides
 * where the assistant browser lives (modal / Settings / page).
 */

export type QuickLaunchRowProps = {
  onAnchorClick: (anchor: QuickLaunchAnchor) => void;
  onViewAll: () => void;
};

const QuickLaunchRow: React.FC<QuickLaunchRowProps> = ({ onAnchorClick, onViewAll }) => {
  const { t } = useTranslation();
  const handleCardClick = useCallback(
    (id: QuickLaunchAnchorId) => {
      const anchor = QUICK_LAUNCH_ANCHORS.find((a) => a.id === id);
      if (anchor) onAnchorClick(anchor);
    },
    [onAnchorClick]
  );

  return (
    <div className={styles.row}>
      <div className={styles.grid}>
        {QUICK_LAUNCH_ANCHORS.map((a) => (
          <QuickLaunchCard
            key={a.id}
            id={a.id}
            label={a.label}
            sub={a.sub}
            lucideIcon={a.lucideIcon}
            onSelect={handleCardClick}
          />
        ))}
      </div>
      <div className={styles.actions}>
        <button type='button' className={styles.viewAll} onClick={onViewAll}>
          {t('guid.launchpad.viewAll', { defaultValue: 'View all 54 →' })}
        </button>
      </div>
    </div>
  );
};

export default QuickLaunchRow;
