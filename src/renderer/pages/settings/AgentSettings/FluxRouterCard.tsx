/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Message, Spin, Switch } from '@arco-design/web-react';
import { Right } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ipcBridge } from '@/common';
import { useModelRegistry } from '@renderer/hooks/useModelRegistry';
import FluxRouterMark from '@renderer/components/icons/FluxRouterMark';
import styles from './AgentsSettings.module.css';

/**
 * Flux Router card on the Agents settings page. Replaces the old "Coming soon"
 * roadmap teaser with a live surface:
 *
 *  - Connected → a Switch that flips `system.routeThroughFlux`, the persisted
 *    flag that decides whether generic ACP backends route their requests
 *    through Flux. Turning it off returns each agent to its own connection.
 *  - Not connected → a directing CTA to the Models page, where Flux is
 *    connected (the registry context that owns the connect flow lives there).
 *
 * "Connected" is read from the same source of truth the Models page uses for
 * the Flux hero: the model registry's provider list. The Agents page is not
 * wrapped in a `ModelRegistryProvider`, so `useModelRegistry()` falls back to
 * the standalone impl, whose own mount `list()` already populates `providers`.
 * We gate on `loading` so a connected user never flashes the Connect CTA before
 * the registry resolves.
 */
const FluxRouterCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { providers, loading } = useModelRegistry();

  const [routeEnabled, setRouteEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const connected = providers.some((p) => p.providerId === 'flux-router');

  useEffect(() => {
    ipcBridge.systemSettings.getRouteThroughFlux
      .invoke()
      .then(setRouteEnabled)
      .catch((err) => console.warn('[FluxRouterCard.getRouteThroughFlux]', err));
  }, []);

  const handleRouteChange = useCallback(async (enabled: boolean) => {
    setSaving(true);
    try {
      await ipcBridge.systemSettings.setRouteThroughFlux.invoke({ enabled });
      setRouteEnabled(enabled);
    } catch (err) {
      Message.error(String(err));
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <div className={styles.flux} data-testid='flux-router-card'>
      <div className={styles.fluxIcon}>
        <FluxRouterMark size={19} color='currentColor' />
      </div>
      <div className={styles.fluxBody}>
        <div className={styles.fluxTitle}>
          {t('settings.agentsPage.flux.title')}
          {!loading && (
            <span className={connected ? styles.fluxStatusOn : styles.fluxStatusOff}>
              <span className={styles.fluxStatusDot} />
              {t(
                connected ? 'settings.agentsPage.flux.statusConnected' : 'settings.agentsPage.flux.statusDisconnected'
              )}
            </span>
          )}
        </div>
        {loading ? (
          <div className='flex justify-center py-12px'>
            <Spin />
          </div>
        ) : connected ? (
          <>
            <div className={styles.fluxToggleRow}>
              <span className={styles.fluxToggleLabel}>{t('settings.agentsPage.flux.routeToggleLabel')}</span>
              <Switch
                size='small'
                checked={routeEnabled}
                loading={saving}
                onChange={handleRouteChange}
                data-testid='flux-route-toggle'
              />
            </div>
            <div className={styles.fluxDesc}>{t('settings.agentsPage.flux.routeToggleHelp')}</div>
          </>
        ) : (
          <>
            <div className={styles.fluxDesc}>{t('settings.agentsPage.flux.desc')}</div>
            <Button
              size='small'
              type='primary'
              className={styles.fluxConnectBtn}
              icon={<Right />}
              onClick={() => navigate('/settings/models')}
            >
              {t('settings.agentsPage.flux.connectCta')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FluxRouterCard;
