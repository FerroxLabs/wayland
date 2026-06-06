/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { bridge, logger } from '@office-ai/platform';
import { WEBUI_DEFAULT_PORT } from '@/common/config/constants';
import type { ElectronBridgeAPI } from '@/common/types/electron';

interface CustomWindow extends Window {
  electronAPI?: ElectronBridgeAPI;
  __bridgeEmitter?: { emit: (name: string, data: unknown) => void };
  __emitBridgeCallback?: (name: string, data: unknown) => void;
  __websocketReconnect?: () => void;
}

const win = window as CustomWindow;

/**
 * Adapts the Electron API for use in the browser, establishing the communication bridge
 * between the renderer and main processes. Corresponds to the injection in preload.ts.
 */
if (win.electronAPI) {
  // Electron environment - communicate via IPC
  bridge.adapter({
    emit(name, data) {
      return win.electronAPI.emit(name, data);
    },
    on(emitter) {
      win.electronAPI?.on((event) => {
        try {
          const { value } = event;
          const { name, data } = JSON.parse(value);
          emitter.emit(name, data);
        } catch (e) {
          console.warn('JSON parsing error:', e);
        }
      });
    },
  });
} else {
  // Web environment - communicate via WebSocket; reconnect after login so the session cookie is included
  // Web runtime bridge: ensure the socket reconnects after login so session cookie can be sent
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const defaultHost = `${window.location.hostname}:${WEBUI_DEFAULT_PORT}`;
  const socketUrl = `${protocol}//${window.location.host || defaultHost}`;

  type QueuedMessage = { name: string; data: unknown };

  let socket: WebSocket | null = null;
  let emitterRef: { emit: (name: string, data: unknown) => void } | null = null;
  let reconnectTimer: number | null = null;
  let reconnectDelay = 500;
  let shouldReconnect = true; // Flag to control reconnection

  const messageQueue: QueuedMessage[] = [];

  // 1. Flush queued messages so no events are lost after the connection is re-established
  const flushQueue = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    while (messageQueue.length > 0) {
      const queued = messageQueue.shift();
      if (queued) {
        socket.send(JSON.stringify(queued));
      }
    }
  };

  // 2. Simple exponential back-off reconnect; waits for the server to accept a new connection after successful login
  const scheduleReconnect = () => {
    if (reconnectTimer !== null || !shouldReconnect) {
      return;
    }

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      reconnectDelay = Math.min(reconnectDelay * 2, 8000);
      connect();
    }, reconnectDelay);
  };

  // 3. Open a WebSocket connection (or reuse an existing OPEN/CONNECTING one)
  const connect = () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      socket = new WebSocket(socketUrl);
    } catch (error) {
      scheduleReconnect();
      return;
    }

    // Capture the socket created in this call so the close handler only
    // nulls the outer reference when it still points at THIS socket.
    // Without this guard, a late-firing close event from the OLD socket
    // could wipe the reference to a NEWLY created replacement socket.
    const currentSocket = socket;

    currentSocket.addEventListener('open', () => {
      reconnectDelay = 500;
      flushQueue();
    });

    currentSocket.addEventListener('message', (event: MessageEvent) => {
      if (!emitterRef) {
        return;
      }

      try {
        const payload = JSON.parse(event.data as string) as {
          name: string;
          data: unknown;
        };

        // Handle server heartbeat ping - respond with pong immediately to keep connection alive
        if (payload.name === 'ping') {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ name: 'pong', data: { timestamp: Date.now() } }));
          }
          return;
        }

        // Handle auth expiration - stop reconnecting and redirect to login
        if (payload.name === 'auth-expired') {
          console.warn('[WebSocket] Authentication expired, stopping reconnection');
          shouldReconnect = false;

          // Clear any pending reconnection timer
          if (reconnectTimer !== null) {
            window.clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }

          // Close the socket and redirect to login page
          socket?.close();

          // Skip redirect if already on login page to prevent infinite reload loop
          if (window.location.pathname === '/login' || window.location.hash.includes('/login')) {
            return;
          }

          // Redirect to login page after a short delay to show any UI feedback
          // Use hash navigation to stay within the SPA (HashRouter), avoiding a full
          // page reload that would land on an empty hash and cause a blank screen.
          setTimeout(() => {
            window.location.hash = '/login';
          }, 1000);

          return;
        }

        emitterRef.emit(payload.name, payload.data);
      } catch (error) {
        // Ignore malformed payloads
      }
    });

    currentSocket.addEventListener('close', (event: CloseEvent) => {
      // Only null the outer reference if it still points at this socket.
      if (socket === currentSocket) {
        socket = null;
      }

      // Detect auth failure from close code (server sends 1008 for token issues).
      // This acts as a fallback in case the auth-expired message was not received
      // (e.g., socket not yet ready for sending during initial handshake).
      if (event.code === 1008 && !shouldReconnect) {
        return; // Already handled by auth-expired message handler
      }
      if (event.code === 1008) {
        console.warn('[WebSocket] Connection rejected by server (policy violation), redirecting to login');
        shouldReconnect = false;
        if (reconnectTimer !== null) {
          window.clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
          // Skip redirect if already on login page to prevent infinite reload loop
        if (window.location.pathname === '/login' || window.location.hash.includes('/login')) {
          return;
        }
        // Use hash navigation to stay within the SPA (HashRouter)
        setTimeout(() => {
          window.location.hash = '/login';
        }, 500);
        return;
      }

      scheduleReconnect();
    });

    currentSocket.addEventListener('error', () => {
      currentSocket.close();
    });
  };

  // 4. Ensure a connection has been initiated before sending or subscribing
  const ensureSocket = () => {
    if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
      connect();
    }
  };

  bridge.adapter({
    emit(name, data) {
      const message: QueuedMessage = { name, data };

      ensureSocket();

      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify(message));
          return;
        } catch (error) {
          scheduleReconnect();
        }
      }

      messageQueue.push(message);
    },
    on(emitter) {
      emitterRef = emitter;
      win.__bridgeEmitter = emitter;

      // Expose callback emitter for bridge provider pattern
      // Used by components to send responses back through WebSocket
      win.__emitBridgeCallback = (name: string, data: unknown) => {
        emitter.emit(name, data);
      };

      ensureSocket();
    },
  });

  connect();

  // Expose reconnection control for login flow
  win.__websocketReconnect = () => {
    shouldReconnect = true;
    reconnectDelay = 500;
    connect();
  };
}

logger.provider({
  log(log) {
    console.log('process.log', log.type, ...log.logs);
  },
  path() {
    return Promise.resolve('');
  },
});
