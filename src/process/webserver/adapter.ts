/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WebSocketServer } from 'ws';
import { registerWebSocketBroadcaster, getBridgeEmitter } from '@/common/adapter/registry';
import { isAllowedInboundName } from '@/common/adapter/bridgeAllowlist';
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

  // Register WebSocket broadcast function to main adapter
  unregisterBroadcaster = registerWebSocketBroadcaster((name, data) => {
    wsManager.broadcast(name, data);
  });

  // Setup WebSocket message handler to forward messages to bridge emitter.
  // C1: reject any name not in the bridge allowlist before dispatching.
  wsManager.setupConnectionHandler((name, data, _ws) => {
    if (!isAllowedInboundName(name)) {
      console.error('[adapter] Rejected disallowed WebSocket bridge event:', name);
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
