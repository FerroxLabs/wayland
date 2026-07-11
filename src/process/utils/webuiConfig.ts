/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { app, Notification } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { setWebServerInstance } from '../bridge/webuiBridge';
import { ProcessConfig } from './initStorage';
import { startWebServerWithInstance } from '../webserver';
import { getLanIP } from '../bridge/lanAddress';
import { SERVER_CONFIG } from '../webserver/config/constants';

const WEBUI_CONFIG_FILE = 'webui.config.json';
const DESKTOP_WEBUI_ENABLED_KEY = 'webui.desktop.enabled';
const DESKTOP_WEBUI_ALLOW_REMOTE_KEY = 'webui.desktop.allowRemote';
const DESKTOP_WEBUI_PORT_KEY = 'webui.desktop.port';

export type WebUIUserConfig = {
  port?: number | string;
  allowRemote?: boolean;
};

export const parsePortValue = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const portNumber = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (!Number.isFinite(portNumber) || portNumber < 1 || portNumber > 65535) {
    return null;
  }
  return portNumber;
};

export const parseBooleanEnv = (value?: string): boolean | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
};

export const loadUserWebUIConfig = (): { config: WebUIUserConfig; path: string | null; exists: boolean } => {
  try {
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, WEBUI_CONFIG_FILE);
    if (!fs.existsSync(configPath)) {
      return { config: {}, path: configPath, exists: false };
    }

    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { config: {}, path: configPath, exists: false };
    }
    return { config: parsed as WebUIUserConfig, path: configPath, exists: true };
  } catch {
    return { config: {}, path: null, exists: false };
  }
};

export const resolveWebUIPort = (
  config: WebUIUserConfig,
  getSwitchValue: (flag: string) => string | undefined
): number => {
  const cliPort = parsePortValue(getSwitchValue('port') ?? getSwitchValue('webui-port'));
  if (cliPort) return cliPort;

  const envPort = parsePortValue(process.env.WAYLAND_PORT ?? process.env.PORT);
  if (envPort) return envPort;

  const configPort = parsePortValue(config.port);
  if (configPort) return configPort;

  return SERVER_CONFIG.DEFAULT_PORT;
};

export const resolveRemoteAccess = (config: WebUIUserConfig, isRemoteMode: boolean): boolean => {
  const envRemote = parseBooleanEnv(process.env.WAYLAND_ALLOW_REMOTE || process.env.WAYLAND_REMOTE);
  const hostHint = process.env.WAYLAND_HOST?.trim();
  const hostRequestsRemote = hostHint ? ['0.0.0.0', '::', '::0'].includes(hostHint) : false;
  const configRemote = config.allowRemote === true;

  return isRemoteMode || hostRequestsRemote || envRemote === true || configRemote;
};

export const restoreDesktopWebUIFromPreferences = async (): Promise<void> => {
  try {
    const enabled = (await ProcessConfig.get(DESKTOP_WEBUI_ENABLED_KEY)) === true;
    if (!enabled) return;

    const [allowRemotePref, portPref] = await Promise.all([
      ProcessConfig.get(DESKTOP_WEBUI_ALLOW_REMOTE_KEY),
      ProcessConfig.get(DESKTOP_WEBUI_PORT_KEY),
    ]);
    const allowRemote = allowRemotePref === true;
    const preferredPort = typeof portPref === 'number' && portPref > 0 ? portPref : SERVER_CONFIG.DEFAULT_PORT;

    const instance = await startWebServerWithInstance(preferredPort, allowRemote);
    setWebServerInstance(instance);
    console.log(`[WebUI] Auto-restored from desktop preferences (port=${instance.port}, allowRemote=${allowRemote})`);

    // #722: a console.log is not a notice. Restoring `allowRemote` re-binds the WebUI
    // to 0.0.0.0 - reachable by every device on the LAN, login over plaintext HTTP -
    // and it happens on EVERY start, forever, from a switch the user may have flipped
    // once months ago. Tell them, with the actual URL, so an exposed listener can never
    // be running without their knowledge. Localhost-only restores say nothing.
    if (allowRemote) {
      notifyLanExposureRestored(instance.port);
    }
  } catch (error) {
    console.error('[WebUI] Failed to auto-restore from desktop preferences:', error);
  }
};

/**
 * Surface a restored LAN-exposed WebUI as a native OS notification.
 *
 * Native rather than in-app on purpose: the re-arm happens at startup, when no window
 * may be open yet, and the whole point is that the user should not have to go looking.
 * Best-effort — a platform with notifications unavailable or denied must never take the
 * app down over a notice, so every failure is swallowed after logging.
 */
function notifyLanExposureRestored(port: number): void {
  try {
    if (!Notification.isSupported()) return;
    const lanIP = getLanIP();
    const url = lanIP ? `http://${lanIP}:${port}` : `port ${port}`;
    new Notification({
      title: 'WebUI is exposed on your local network',
      body: `Reachable at ${url} by any device on this network, over unencrypted HTTP. Turn off "Allow Remote Access" in Settings → WebUI to stop this.`,
    }).show();
  } catch (error) {
    console.warn('[WebUI] Could not surface the LAN-exposure notice:', error);
  }
}
