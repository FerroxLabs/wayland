/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@arco-design/web-react';
import { Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { iconColors } from '@/renderer/styles/colors';
import styles from './NoModelCtaCard.module.css';

export type NoModelCtaCardProps = {
  /**
   * Headless web server build: the Models settings page is read-only, so the
   * copy points at Flux / server-side config instead of local key entry.
   */
  isRemote: boolean;
  /** Navigates to the model setup surface (Models settings on desktop). */
  onSetup: () => void;
};

/**
 * Persistent inline call-to-action shown on the new-chat surface when no usable
 * model is configured (fresh install, or a cloud install where onboarding was
 * skipped). Sits below the greeting and above the composer. Mirrors the
 * onboarding connect-step look (read-only reuse of those styling cues) so the
 * empty state feels like a guided first run rather than a transient warning.
 */
const NoModelCtaCard: React.FC<NoModelCtaCardProps> = ({ isRemote, onSetup }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.card} data-testid='no-model-cta'>
      <div className={styles.iconWrap}>
        <Sparkles size={18} color={iconColors.brand} strokeWidth={2} />
      </div>
      <div className={styles.body}>
        <div className={styles.title}>{t('conversation.noModelCta.title')}</div>
        <div className={styles.subtitle}>
          {isRemote ? t('conversation.noModelCta.bodyRemote') : t('conversation.noModelCta.bodyDesktop')}
        </div>
      </div>
      <Button type='primary' size='small' className={styles.action} onClick={onSetup}>
        {t('conversation.noModelCta.button')}
      </Button>
    </div>
  );
};

export default NoModelCtaCard;
