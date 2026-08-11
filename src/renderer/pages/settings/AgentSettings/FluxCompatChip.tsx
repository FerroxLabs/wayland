/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Small per-agent Flux status chip. Driven by the backend's `fluxCompat`
 * classification in the registry (single source of truth via `getFluxCompat`):
 *  - 'env'    -> "Flux ready" (positive tone)
 *  - 'setup'  -> "Flux setup" (neutral tone)
 *  - 'vendor' -> "Native only" (muted tone) with a tooltip explaining why.
 * Renders nothing when the backend has no Flux classification.
 *
 * Lives in its own module because it is shared by the detected-agent cards and
 * by the "Available to install" band: the reason to install an agent has to be
 * visible while deciding, so the chip renders on an `absent` card too.
 */

import React from 'react';
import { Button, Tooltip } from '@arco-design/web-react';
import { CheckOne } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import { getFluxCompat } from '@/common/types/acpTypes';
import FluxSetupModal from './FluxSetupModal';
import styles from './AgentsSettings.module.css';

const FluxCompatChip: React.FC<{ backend: string; interactive?: boolean }> = ({ backend, interactive = true }) => {
  const { t } = useTranslation();
  const [setupOpen, setSetupOpen] = React.useState(false);
  const compat = getFluxCompat(backend);
  if (!compat) return null;

  if (compat === 'env') {
    return (
      <span className={`${styles.fluxChip} ${styles.fluxChipReady}`}>
        <CheckOne theme='filled' size={11} />
        {t('settings.agentsPage.fluxCompat.ready')}
      </span>
    );
  }

  if (compat === 'setup') {
    // opencode, codex and kimi have live connectors (a one-time config write
    // routes them through Flux). Render their chip as a clickable button that
    // opens the setup modal for the matching backend; other `setup` backends
    // stay informational.
    //
    // `interactive` is what the "Available to install" band uses to keep the
    // chip VISIBLE on a card for software the user does not have while refusing
    // to offer routing setup for it. The setup connector writes that agent's own
    // config file; there is no config to write when the agent is not installed,
    // so the button would open a modal that can only fail.
    if (interactive && (backend === 'opencode' || backend === 'codex' || backend === 'kimi')) {
      return (
        <>
          <Button
            type='text'
            size='mini'
            className={`${styles.fluxChip} ${styles.fluxChipSetup} ${styles.fluxChipButton}`}
            onClick={() => setSetupOpen(true)}
            data-testid='flux-setup-chip'
          >
            {t('settings.agentsPage.fluxCompat.setup')}
          </Button>
          <FluxSetupModal visible={setupOpen} onClose={() => setSetupOpen(false)} backend={backend} />
        </>
      );
    }
    // Deliberately NOT `data-testid="flux-setup-chip"`: that id marks the
    // CLICKABLE affordance, and the detected-agent suite uses its absence to
    // tell an inert chip from a live one.
    return (
      <span className={`${styles.fluxChip} ${styles.fluxChipSetup}`}>{t('settings.agentsPage.fluxCompat.setup')}</span>
    );
  }

  return (
    <Tooltip content={t('settings.agentsPage.fluxCompat.nativeOnlyTooltip')}>
      <span className={`${styles.fluxChip} ${styles.fluxChipNative}`}>
        {t('settings.agentsPage.fluxCompat.nativeOnly')}
      </span>
    </Tooltip>
  );
};

export default FluxCompatChip;
