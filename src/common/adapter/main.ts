/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BrowserWindow } from 'electron';
import { ipcMain } from 'electron';

import { bridge } from '@office-ai/platform';
import { ADAPTER_BRIDGE_EVENT_KEY } from './constant';
import { isAllowedInboundName } from './bridgeAllowlist';
// Importing ipcBridge for its side effect: every buildProvider/buildEmitter
// call records its key into the allowlist. Without this load, the allowlist
// would be empty when the IPC handler is hit and every renderer call would
// be rejected. Keep this import even though no exported symbol is used here.
import './ipcBridge';
import { registerWebSocketBroadcaster, getBridgeEmitter, setBridgeEmitter, broadcastToAll } from './registry';

/**
 * Bridge event data structure for IPC communication
 */
interface BridgeEventData {
  name: string;
  data: unknown;
}

const adapterWindowList: Array<BrowserWindow> = [];

export { registerWebSocketBroadcaster, getBridgeEmitter };

/**
 * @description Establishes a communication bridge with each BrowserWindow.
 */
/** Maximum IPC payload size (50 MB). Messages exceeding this are dropped with an error notification. */
const MAX_IPC_PAYLOAD_SIZE = 50 * 1024 * 1024;

bridge.adapter({
  emit(name, data) {
    // 1. Send to all Electron BrowserWindows (skip destroyed ones)
    let serialized: string;
    try {
      serialized = JSON.stringify({ name, data });
    } catch (error) {
      // RangeError: Invalid string length - data too large to serialize
      console.error('[adapter] Failed to serialize bridge event:', name, error);
      return;
    }

    // Guard: reject oversized payloads to prevent main-process blocking
    if (serialized.length > MAX_IPC_PAYLOAD_SIZE) {
      console.error(
        `[adapter] Bridge event "${name}" too large (${(serialized.length / 1024 / 1024).toFixed(1)}MB), skipped`
      );
      const errorPayload = JSON.stringify({
        name: 'bridge:error',
        data: { originalEvent: name, reason: 'payload_too_large', size: serialized.length },
      });
      for (let i = adapterWindowList.length - 1; i >= 0; i--) {
        const win = adapterWindowList[i];
        if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
          win.webContents.send(ADAPTER_BRIDGE_EVENT_KEY, errorPayload);
        }
      }
      return;
    }

    for (let i = adapterWindowList.length - 1; i >= 0; i--) {
      const win = adapterWindowList[i];
      if (win.isDestroyed() || win.webContents.isDestroyed()) {
        adapterWindowList.splice(i, 1);
        continue;
      }
      win.webContents.send(ADAPTER_BRIDGE_EVENT_KEY, serialized);
    }
    // 2. Also broadcast to all WebSocket clients
    broadcastToAll(name, data);
  },
  on(emitter) {
    // Save emitter reference for WebSocket handling
    setBridgeEmitter(emitter);

    ipcMain.handle(ADAPTER_BRIDGE_EVENT_KEY, (_event, info) => {
      const { name, data } = JSON.parse(info) as BridgeEventData;
      // C1: reject any name not declared via buildProvider/buildEmitter.
      // This blocks a renderer XSS from invoking dangerous providers
      // (fs.writeFile, fs.removeEntry, shell.openExternal, ...) directly
      // through the preload bridge.
      if (!isAllowedInboundName(name)) {
        console.error('[adapter] Rejected disallowed inbound bridge event:', name);
        return Promise.reject(new Error(`Bridge event not allowed: ${name}`));
      }
      return Promise.resolve(emitter.emit(name, data));
    });
  },
});

export const initMainAdapterWithWindow = (win: BrowserWindow) => {
  adapterWindowList.push(win);
  const off = () => {
    const index = adapterWindowList.indexOf(win);
    if (index > -1) adapterWindowList.splice(index, 1);
  };
  win.on('closed', off);
  return off;
};
