#!/usr/bin/env node
/**
 * Portions adapted from Hermes Agent:
 *   hermes-agent/scripts/whatsapp-bridge/bridge.js
 *   Copyright (c) 2025 Peter Steinberger / Hermes Agent contributors - MIT License
 *
 * Wayland modifications:
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Wayland WhatsApp Bridge - subprocess entrypoint.
 *
 * Speaks JSON-RPC 2.0 over stdio with the parent Electron main process.
 * No HTTP server (parent owns the WebhookReceiver for cloud-API webhooks).
 *
 * Backend selection (CLI flag):
 *   node bridge.js --backend baileys        (default - direct WhatsApp Web via @whiskeysockets/baileys)
 *   node bridge.js --backend whatsapp-web   (alternate - whatsapp-web.js library)
 *   node bridge.js --backend meta-business  (Meta WhatsApp Business Cloud API)
 *
 * RPC methods (see allowlist.js ALLOWED_RPC_METHODS for the full set):
 *   connect, disconnect, sendText, sendMedia, setPresence, react, subscribe,
 *   webhookDelivery (Meta only), health
 *
 * Upstream notifications (no id, JSON-RPC 2.0 notifications):
 *   inbound.message     - backend received a message
 *   connection.status   - connection state changed (connecting | connected | disconnected | logged_out)
 *   qr.update           - QR-code pairing required (Baileys / whatsapp-web.js only)
 *   error               - backend-level error (non-fatal)
 */

import { isMethodAllowed } from './allowlist.js';

// ---------- CLI parsing ----------
const argv = process.argv.slice(2);
function getArg(name, defaultVal) {
  const idx = argv.indexOf(`--${name}`);
  return idx !== -1 && argv[idx + 1] ? argv[idx + 1] : defaultVal;
}

const BACKEND = getArg('backend', 'baileys');
const SESSION_DIR = getArg('session', '');

// ---------- backend loader ----------
async function loadBackend(name) {
  switch (name) {
    case 'baileys':
      return await import('./backends/baileys.js');
    case 'whatsapp-web':
      return await import('./backends/whatsapp-web.js');
    case 'meta-business':
      return await import('./backends/meta-business.js');
    default:
      throw new Error(`Unknown backend: ${name}`);
  }
}

let backend = null;

// ---------- JSON-RPC framing ----------
//
// Framing: each message is a single JSON value followed by `\n`. Parent must
// emit one JSON per line. This is simpler than LSP-style Content-Length
// headers and matches the Electron child_process default line protocol.

let stdinBuf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  stdinBuf += chunk;
  let nl;
  while ((nl = stdinBuf.indexOf('\n')) !== -1) {
    const line = stdinBuf.slice(0, nl).trim();
    stdinBuf = stdinBuf.slice(nl + 1);
    if (!line) continue;
    void handleLine(line);
  }
});

process.stdin.on('end', () => {
  // Parent closed stdin - exit cleanly.
  void shutdown(0);
});

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
process.on('uncaughtException', (err) => {
  emitNotification('error', { kind: 'uncaughtException', message: String(err?.message || err) });
});
process.on('unhandledRejection', (reason) => {
  emitNotification('error', { kind: 'unhandledRejection', message: String(reason) });
});

function writeFrame(obj) {
  try {
    process.stdout.write(`${JSON.stringify(obj)}\n`);
  } catch (err) {
    // last-resort log to stderr (stderr is reserved for human logs, not RPC)
    process.stderr.write(`[bridge] writeFrame failed: ${err?.message || err}\n`);
  }
}

function emitResult(id, result) {
  writeFrame({ jsonrpc: '2.0', id, result });
}

function emitError(id, code, message, data) {
  writeFrame({ jsonrpc: '2.0', id, error: { code, message, data } });
}

/**
 * Emit an upstream JSON-RPC notification (no id). Backends call this via
 * the emit function passed to their handler.
 */
function emitNotification(method, params) {
  writeFrame({ jsonrpc: '2.0', method, params });
}

// ---------- request dispatch ----------
async function handleLine(line) {
  let req;
  try {
    req = JSON.parse(line);
  } catch (err) {
    emitError(null, -32700, 'Parse error', { line: line.slice(0, 200) });
    return;
  }

  const { id, method, params } = req || {};
  if (typeof method !== 'string') {
    emitError(id ?? null, -32600, 'Invalid request: method missing');
    return;
  }

  if (!isMethodAllowed(method)) {
    emitError(id ?? null, -32601, `Method not allowed: ${method}`);
    return;
  }

  if (method === 'health') {
    emitResult(id, {
      backend: BACKEND,
      connected: backend?.isConnected?.() ?? false,
      uptime: process.uptime(),
    });
    return;
  }

  if (!backend) {
    try {
      const mod = await loadBackend(BACKEND);
      backend = await mod.createBackend({
        emit: emitNotification,
        sessionDir: SESSION_DIR,
      });
    } catch (err) {
      emitError(id ?? null, -32000, `Failed to load backend ${BACKEND}: ${err?.message || err}`);
      return;
    }
  }

  const handler = backend?.handlers?.[method];
  if (typeof handler !== 'function') {
    emitError(id ?? null, -32601, `Backend ${BACKEND} does not implement ${method}`);
    return;
  }

  try {
    const result = await handler(params ?? {});
    if (id !== undefined && id !== null) {
      emitResult(id, result ?? null);
    }
  } catch (err) {
    if (id !== undefined && id !== null) {
      emitError(id, -32000, err?.message || String(err), {
        stack: err?.stack ? String(err.stack).split('\n').slice(0, 5).join('\n') : undefined,
      });
    } else {
      emitNotification('error', { kind: 'handler', method, message: String(err?.message || err) });
    }
  }
}

async function shutdown(code) {
  try {
    await backend?.handlers?.disconnect?.({});
  } catch {
    // best-effort
  }
  process.exit(code);
}

// Announce readiness so parent knows the bridge has loaded.
emitNotification('connection.status', { state: 'starting', backend: BACKEND });
