/**
 * Standalone bridge adapter - uses Node.js EventEmitter instead of ipcMain.
 * Import this module ONLY in the standalone entry point (src/server.ts).
 * Never import alongside src/common/adapter/main.ts in the same process.
 */
import { EventEmitter } from 'events';
import { bridge } from '@office-ai/platform';
import { broadcastToAll, setBridgeEmitter } from './registry';
import { isAllowedInboundName } from './bridgeAllowlist';
// Side-effect import: register all provider/emitter keys into the allowlist.
import './ipcBridge';

const internalEmitter = new EventEmitter();
internalEmitter.setMaxListeners(100);

bridge.adapter({
  emit(name, data) {
    // Broadcast to all connected WebSocket clients
    broadcastToAll(name, data);
  },
  on(bridgeEmitterRef) {
    // Persist reference so webserver/adapter.ts can route incoming WS messages
    setBridgeEmitter(bridgeEmitterRef);
    // Route messages dispatched via dispatchMessage() into the bridge handlers.
    // C1: enforce the inbound allowlist here too - `dispatchMessage` is the
    // standalone equivalent of the Electron preload IPC handler.
    internalEmitter.on('message', ({ name, data }: { name: string; data: unknown }) => {
      if (!isAllowedInboundName(name)) {
        console.error('[adapter] Rejected disallowed standalone bridge event:', name);
        return;
      }
      bridgeEmitterRef.emit(name, data);
    });
  },
});

/**
 * Called by webserver/adapter.ts for each incoming WebSocket message.
 * Routes the message through the internal EventEmitter into the bridge handlers.
 */
export function dispatchMessage(name: string, data: unknown): void {
  internalEmitter.emit('message', { name, data });
}
