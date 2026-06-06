/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WebSocketServer } from 'ws';
import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { TokenMiddleware } from '@process/webserver/auth/middleware/TokenMiddleware';
import { WEBSOCKET_CONFIG } from '../config/constants';
import { SHOW_OPEN_REQUEST_EVENT } from '@/common/adapter/constant';

interface ClientInfo {
  token: string;
  lastPing: number;
}

/**
 * Maximum allowed inbound WebSocket frame size in bytes (4 MiB).
 *
 * WS-POSTAUTH-DISPATCH: the `ws` default is 100 MiB/frame, parsed synchronously
 * on the main thread - a single huge frame can OOM/stall the process. We bound
 * it at the protocol layer (maxPayload, enforced by the ws receiver which closes
 * the socket with code 1009) AND with an explicit pre-parse byte-length check
 * before JSON.parse as defense-in-depth. 4 MiB comfortably covers legitimate
 * bridge payloads (the HTTP body limit is 10 MiB, but WS messages are small
 * control/RPC envelopes).
 */
const MAX_WS_FRAME_BYTES = 4 * 1024 * 1024;

/**
 * WebSocket Manager - Manages client connections, heartbeat detection, and message handling
 */
export class WebSocketManager {
  private clients: Map<WebSocket, ClientInfo> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(private wss: WebSocketServer) {}

  /**
   * Initialize WebSocket manager
   */
  initialize(): void {
    // WS-POSTAUTH-DISPATCH: bound inbound frame size at the protocol layer.
    // The WSS is created with `noServer:true`, so `options.maxPayload` is read
    // per-connection at upgrade-completion time (ws WebSocketServer.completeUpgrade).
    // initialize() runs before any upgrade completes, so setting it here applies
    // to every subsequent connection's receiver.
    this.wss.options.maxPayload = MAX_WS_FRAME_BYTES;
    this.startHeartbeat();
    console.log('[WebSocketManager] Initialized');
  }

  /**
   * Setup connection handler
   */
  setupConnectionHandler(onMessage: (name: string, data: any, ws: WebSocket) => void): void {
    this.wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
      // AUDIT-05 F19: register a SINGLE message handler from the start so
      // there is no window during which messages arrive but no listener is
      // attached. Until auth completes, the handler buffers the raw payload;
      // after auth, it forwards to the real message processing path.
      // Drain happens synchronously after auth completes, before this scope
      // returns to the event loop.
      const pendingMessages: Buffer[] = [];
      let authDone = false;
      let processMessage: ((rawData: Buffer) => void) | null = null;

      const messageHandler = (rawData: Buffer) => {
        if (!authDone) {
          pendingMessages.push(rawData);
          return;
        }
        processMessage?.(rawData);
      };
      ws.on('message', messageHandler);

      const token = TokenMiddleware.extractWebSocketToken(req);

      if (!(await this.validateConnection(ws, token))) {
        ws.off('message', messageHandler);
        return;
      }

      this.addClient(ws, token!);
      processMessage = this.buildMessageProcessor(ws, onMessage);
      this.setupCloseHandler(ws);
      this.setupErrorHandler(ws);
      authDone = true;

      // Drain any messages buffered during auth validation. Synchronous so
      // the renderer never observes a "message accepted but dropped" gap.
      for (const raw of pendingMessages) {
        processMessage(raw);
      }
      pendingMessages.length = 0;

      console.log('[WebSocketManager] Client connected');
    });
  }

  /**
   * Validate connection
   */
  private async validateConnection(ws: WebSocket, token: string | null): Promise<boolean> {
    if (!token) {
      ws.close(WEBSOCKET_CONFIG.CLOSE_CODES.POLICY_VIOLATION, 'No token provided');
      return false;
    }

    if (!(await TokenMiddleware.validateWebSocketToken(token))) {
      // Send auth-expired before closing so the client can redirect to login
      // instead of entering an infinite reconnection loop.
      // This mirrors the behavior in checkClients() heartbeat check.
      try {
        ws.send(
          JSON.stringify({
            name: 'auth-expired',
            data: { message: 'Token expired, please login again' },
          })
        );
      } catch {
        // Socket may not be ready for sending yet; close will still fire on client
      }
      ws.close(WEBSOCKET_CONFIG.CLOSE_CODES.POLICY_VIOLATION, 'Invalid or expired token');
      return false;
    }

    return true;
  }

  /**
   * Add client
   */
  private addClient(ws: WebSocket, token: string): void {
    this.clients.set(ws, {
      token,
      lastPing: Date.now(),
    });
  }

  /**
   * Build the post-auth message processor used by the single message handler
   * registered in setupConnectionHandler. Kept as a builder (not a direct
   * `ws.on('message', ...)`) so the connection handler can buffer pre-auth
   * messages and replay them through the same processing path after auth.
   */
  private buildMessageProcessor(
    ws: WebSocket,
    onMessage: (name: string, data: any, ws: WebSocket) => void
  ): (rawData: Buffer) => void {
    return (rawData: Buffer) => {
      try {
        // WS-POSTAUTH-DISPATCH: defense-in-depth bound on the synchronous parse.
        // maxPayload already closes oversized frames at the ws protocol layer, but
        // guard here too so a large frame can never reach JSON.parse on the main
        // thread (the ws receiver may concatenate fragments before emitting).
        if (rawData.length > MAX_WS_FRAME_BYTES) {
          console.error('[WebSocketManager] Rejected oversized WebSocket frame:', rawData.length);
          try {
            ws.send(JSON.stringify({ error: 'Message too large' }));
          } catch {
            // Socket may be broken; ignore send failure
          }
          return;
        }

        const parsed = JSON.parse(rawData.toString());
        const { name, data } = parsed;

        // Handle pong response - update last ping time
        if (name === 'pong') {
          this.updateLastPing(ws);
          return;
        }

        // Handle file selection request - forward to client
        if (name === 'subscribe-show-open') {
          this.handleFileSelection(ws, data);
          return;
        }

        // Forward other messages to bridge system
        onMessage(name, data, ws);
      } catch {
        try {
          ws.send(
            JSON.stringify({
              error: 'Invalid message format',
              expected: '{ "name": "event-name", "data": {...} }',
            })
          );
        } catch {
          // Socket may be broken; ignore send failure
        }
      }
    };
  }

  /**
   * Handle file selection request
   */
  private handleFileSelection(ws: WebSocket, data: any): void {
    // Extract properties from nested data structure
    const actualData = data.data || data;
    const properties = actualData.properties;

    // Determine if this is file selection mode
    const isFileMode = properties && properties.includes('openFile') && !properties.includes('openDirectory');

    // Send file selection request to client with isFileMode flag
    ws.send(
      JSON.stringify({
        name: SHOW_OPEN_REQUEST_EVENT,
        data: { ...data, isFileMode },
      })
    );
  }

  /**
   * Setup close handler
   */
  private setupCloseHandler(ws: WebSocket): void {
    ws.on('close', () => {
      this.clients.delete(ws);
      console.log('[WebSocketManager] Client disconnected');
    });
  }

  /**
   * Setup error handler
   */
  private setupErrorHandler(ws: WebSocket): void {
    ws.on('error', (error) => {
      console.error('[WebSocketManager] Client error:', error);
      this.clients.delete(ws);
    });
  }

  /**
   * Update last ping time
   */
  private updateLastPing(ws: WebSocket): void {
    const clientInfo = this.clients.get(ws);
    if (clientInfo) {
      clientInfo.lastPing = Date.now();
    }
  }

  /**
   * Start heartbeat detection
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkClients();
    }, WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * Check all clients
   */
  private async checkClients(): Promise<void> {
    const now = Date.now();

    for (const [ws, clientInfo] of this.clients) {
      // Check if client timed out
      if (this.isClientTimeout(clientInfo, now)) {
        console.log('[WebSocketManager] Client heartbeat timeout, closing connection');
        try {
          ws.close(WEBSOCKET_CONFIG.CLOSE_CODES.POLICY_VIOLATION, 'Heartbeat timeout');
        } catch {
          ws.terminate();
        }
        this.clients.delete(ws);
        continue;
      }

      // Validate if WebSocket token is still valid
      if (!(await TokenMiddleware.validateWebSocketToken(clientInfo.token))) {
        console.log('[WebSocketManager] Token expired, closing connection');
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                name: 'auth-expired',
                data: { message: 'Token expired, please login again' },
              })
            );
          }
          ws.close(WEBSOCKET_CONFIG.CLOSE_CODES.POLICY_VIOLATION, 'Token expired');
        } catch {
          // Socket may already be broken (EPIPE); terminate instead
          ws.terminate();
        }
        this.clients.delete(ws);
        continue;
      }

      // Send heartbeat ping
      this.sendHeartbeat(ws);
    }
  }

  /**
   * Check if client timed out
   */
  private isClientTimeout(clientInfo: ClientInfo, now: number): boolean {
    return now - clientInfo.lastPing > WEBSOCKET_CONFIG.HEARTBEAT_TIMEOUT;
  }

  /**
   * Send heartbeat
   */
  private sendHeartbeat(ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ name: 'ping', data: { timestamp: Date.now() } }));
    }
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(name: string, data: any): void {
    const message = JSON.stringify({ name, data });

    for (const [ws, _clientInfo] of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  /**
   * Get connected client count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Close all connections
    for (const [ws] of this.clients) {
      ws.close(WEBSOCKET_CONFIG.CLOSE_CODES.NORMAL_CLOSURE, 'Server shutting down');
    }

    this.clients.clear();
    console.log('[WebSocketManager] Destroyed');
  }
}

export default WebSocketManager;
