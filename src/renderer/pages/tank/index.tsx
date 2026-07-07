/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tank page — embeds the Tank web dashboard in a <webview> so it's reachable
 * without leaving Wayland. The main process sets the `tank_token` cookie on the
 * dedicated partition first (autopilot.tankUi), then we load the URL.
 *
 * When Tank isn't configured yet, we render the shared connection form
 * (Settings > Tank uses the same one) instead of a dead-end warning — saving
 * persists the connection and loads the dashboard without a restart.
 */

import React, { useEffect, useState } from 'react';
import { Result } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import WebviewHost from '@/renderer/components/media/WebviewHost';
import TankConnectionForm from '@/renderer/components/tank/TankConnectionForm';

const TankPanel = () => {
  const [state, setState] = useState<{ url?: string; error?: string } | null>(null);

  const checkTank = () =>
    ipcBridge.autopilot.tankUi
      .invoke()
      .then((r) => setState({ url: r.ok ? r.url : undefined, error: r.ok ? undefined : r.error }))
      .catch((e) => setState({ error: e instanceof Error ? e.message : String(e) }));

  useEffect(() => {
    checkTank();
  }, []);

  if (!state) return null;

  if (!state.url) {
    return (
      <div className='w-full h-full flex items-center justify-center p-24px'>
        <div className='w-full max-w-420px'>
          <Result
            status='warning'
            title='Tank is not available'
            subTitle={state.error || 'Enter your Tank server URL and token to connect.'}
          />
          <TankConnectionForm saveLabel='Save & connect' onSaved={checkTank} />
        </div>
      </div>
    );
  }

  return <WebviewHost url={state.url} id='tank-ui' partition='persist:tank' showNavBar className='w-full h-full' />;
};

export default TankPanel;
