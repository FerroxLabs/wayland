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
 * ponytail: English strings inline for this flag-gated embed; move to i18n keys
 * before it becomes a shipped, non-gated feature.
 */

import React, { useEffect, useState } from 'react';
import { Result } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import WebviewHost from '@/renderer/components/media/WebviewHost';

const TankPanel = () => {
  const [state, setState] = useState<{ url?: string; error?: string } | null>(null);

  useEffect(() => {
    ipcBridge.autopilot.tankUi
      .invoke()
      .then((r) => setState({ url: r.ok ? r.url : undefined, error: r.ok ? undefined : r.error }))
      .catch((e) => setState({ error: e instanceof Error ? e.message : String(e) }));
  }, []);

  if (!state) return null;
  if (!state.url) {
    return (
      <Result
        status='warning'
        title='Tank is not available'
        subTitle={state.error || 'Set WAYLAND_TANK_URL and WAYLAND_TANK_TOKEN to embed the Tank dashboard.'}
      />
    );
  }

  return <WebviewHost url={state.url} id='tank-ui' partition='persist:tank' showNavBar className='w-full h-full' />;
};

export default TankPanel;
