/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WebSocketServer } from 'ws';
import { registerWebSocketBroadcaster, getBridgeEmitter } from '@/common/adapter/registry';
import { isAllowedInboundName, isAllowedForRemote, isAllowedOutboundToRemote } from '@/common/adapter/bridgeAllowlist';
import { WebSocketManager } from './websocket/WebSocketManager';

// Store unregister function for cleanup when server stops
let unregisterBroadcaster: (() => void) | null = null;
// Module-level reference so cleanupWebAdapter can destroy the heartbeat timer
let wsManagerInstance: WebSocketManager | null = null;

/**
 * Initialize Web Adapter - Bridge communication between WebSocket and platform bridge
 *
 * Note: No longer calling bridge.adapter(), instead registering with main adapter
 * This avoids overwriting the Electron IPC adapter
 */
export function initWebAdapter(wss: WebSocketServer): void {
  const wsManager = new WebSocketManager(wss);
  wsManagerInstance = wsManager;
  wsManager.initialize();

  // Register WebSocket broadcast function to main adapter.
  // #645: filter the outbound stream so a paired peer never receives a
  // local-only emitter (terminal.output/exit carry the live PTY stream).
  unregisterBroadcaster = registerWebSocketBroadcaster((name, data) => {
    if (!isAllowedOutboundToRemote(name)) return;
    wsManager.broadcast(name, data);
  });

  // Setup WebSocket message handler to forward messages to bridge emitter.
  // C1: reject any name not in the bridge allowlist before dispatching.
  wsManager.setupConnectionHandler((name, data, _ws) => {
    if (!isAllowedInboundName(name)) {
      console.error('[adapter] Rejected disallowed WebSocket bridge event:', name);
      return;
    }
    // WS-POSTAUTH-DISPATCH: the WebSocket token proves a paired browser, not the
    // local trusted user. Apply the remote-reduced allowlist on top of the
    // inbound allowlist so a token-holding remote client cannot drive
    // fs.*/shell.*/skill-mutation/mcp-mutation/hub/app write/exec providers.
    if (!isAllowedForRemote(name)) {
      console.error('[adapter] Rejected remote-forbidden WebSocket bridge event:', name);
      return;
    }
    const emitter = getBridgeEmitter();
    if (emitter) {
      emitter.emit(name, data);
    } else {
      console.warn('[adapter] Bridge emitter not set, message dropped:', name);
    }
  });
}

/**
 * Cleanup Web Adapter (called when server stops)
 */
export function cleanupWebAdapter(): void {
  if (unregisterBroadcaster) {
    unregisterBroadcaster();
    unregisterBroadcaster = null;
  }
  // Destroy the WebSocket manager to clear the heartbeat setInterval,
  // which would otherwise keep the event loop alive after shutdown.
  if (wsManagerInstance) {
    wsManagerInstance.destroy();
    wsManagerInstance = null;
  }
}
