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
import { isElectronDesktop } from '@renderer/utils/platform';
import { completeFluxConnectHttp, startFluxConnectHttp } from '@renderer/services/FluxConnectService';
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
  const [connecting, setConnecting] = useState(false);

  const connected = providers.some((p) => p.providerId === 'flux-router');
  // On the desktop app the connect flow is the IPC loopback PKCE dance (driven
  // from the Models hero). In a headless WebUI (a phone) there is no loopback /
  // system browser, so we drive the SAME OAuth through the write-only HTTP route.
  const isDesktop = isElectronDesktop();

  useEffect(() => {
    ipcBridge.systemSettings.getRouteThroughFlux
      .invoke()
      .then(setRouteEnabled)
      .catch((err) => console.warn('[FluxRouterCard.getRouteThroughFlux]', err));
  }, []);

  // Begin the remote Flux connect: ask the server for a blessed-origin authorize
  // URL, then send this browser to Flux. The PKCE verifier never leaves the
  // server; we return here with ?fluxCode&fluxState for the completion effect.
  const handleRemoteConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const started = await startFluxConnectHttp();
      if (!started?.authorizeUrl) {
        Message.error(t('settings.agentsPage.flux.remoteConnectError'));
        setConnecting(false);
        return;
      }
      window.location.assign(started.authorizeUrl);
    } catch {
      Message.error(t('settings.agentsPage.flux.remoteConnectError'));
      setConnecting(false);
    }
  }, [t]);

  // Finish the remote connect when the browser returns from Flux with the code.
  useEffect(() => {
    if (isDesktop) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('fluxCode');
    const state = params.get('fluxState');
    if (!code || !state) return;

    // Strip the one-time params so a refresh can't replay the exchange.
    params.delete('fluxCode');
    params.delete('fluxState');
    const cleaned = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${cleaned ? `?${cleaned}` : ''}`);

    setConnecting(true);
    completeFluxConnectHttp(code, state)
      .then((ok) => {
        if (ok) Message.success(t('settings.agentsPage.flux.remoteConnectSuccess'));
        else Message.error(t('settings.agentsPage.flux.remoteConnectError'));
      })
      .catch(() => Message.error(t('settings.agentsPage.flux.remoteConnectError')))
      .finally(() => setConnecting(false));
  }, [isDesktop, t]);

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
            {isDesktop ? (
              <Button
                size='small'
                type='primary'
                className={styles.fluxConnectBtn}
                icon={<Right />}
                onClick={() => navigate('/settings/models')}
              >
                {t('settings.agentsPage.flux.connectCta')}
              </Button>
            ) : (
              <Button
                size='small'
                type='primary'
                className={styles.fluxConnectBtn}
                loading={connecting}
                onClick={() => void handleRemoteConnect()}
                data-testid='flux-remote-connect'
              >
                {t('settings.agentsPage.flux.remoteConnectCta')}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FluxRouterCard;
