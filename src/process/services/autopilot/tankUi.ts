/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Prepares an embedded Tank web UI: Tank authenticates its dashboard off a
 * `tank_token` cookie, so we set that cookie on a dedicated session partition
 * for the Tank origin, then hand the URL to a <webview> (see the Tank page).
 * Mirrors Tank's own desktop shell (desktop/main.js `applyTokenCookie`).
 */

import { session } from 'electron';
import { tankConfig, tankEnabled } from './tankClient';

/** Isolated partition so Tank's cookies never mix with Wayland's own sessions. */
export const TANK_UI_PARTITION = 'persist:tank';

export type TankUiResult = { ok: boolean; url?: string; error?: string };

export async function prepareTankUi(): Promise<TankUiResult> {
  if (!tankEnabled()) return { ok: false, error: 'Tank is not configured (set WAYLAND_TANK_TOKEN).' };
  const { baseUrl, token } = tankConfig();
  try {
    const ses = session.fromPartition(TANK_UI_PARTITION);
    const url = new URL(baseUrl);
    await ses.cookies.set({
      url: baseUrl,
      name: 'tank_token',
      value: token,
      path: '/',
      secure: url.protocol === 'https:',
    });
    return { ok: true, url: baseUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
