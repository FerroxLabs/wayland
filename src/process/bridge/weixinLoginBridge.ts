/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserWindow, ipcMain } from 'electron';
import { WeixinLoginHandler } from '@process/channels/plugins/weixin/WeixinLoginHandler';
import { AUTH_ERROR_RATE_LIMITED, enforceRateLimit } from './webuiDirectAuth';

let handler: WeixinLoginHandler | null = null;

export function initWeixinLoginBridge(): void {
  const getWindow = () => BrowserWindow.getAllWindows()[0] ?? null;
  handler = new WeixinLoginHandler(getWindow);

  // SECURITY: gated by enforceRateLimit. The handler opens a hidden
  // BrowserWindow and aborts any in-flight login on each call - a compromised
  // renderer (XSS) could otherwise spam `weixin:login:start` to exhaust window
  // handles or repeatedly cancel the user's legitimate login. URL is
  // hardcoded internally (no renderer-supplied URL), so there's no URL
  // injection vector; the only concern is invocation frequency.
  ipcMain.handle('weixin:login:start', async () => {
    if (!enforceRateLimit('weixin:login:start')) {
      throw new Error(AUTH_ERROR_RATE_LIMITED);
    }
    try {
      return await handler!.startLogin();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message, { cause: error });
    }
  });
}
