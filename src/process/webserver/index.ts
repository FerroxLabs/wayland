/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import net from 'net';
import { createServer } from 'http';
import https from 'node:https';
import { WebSocketServer } from 'ws';
import { AuthService } from '@process/webserver/auth/service/AuthService';
import { UserRepository } from '@process/webserver/auth/repository/UserRepository';
import { AUTH_CONFIG, SERVER_CONFIG } from './config/constants';
import { initWebAdapter } from './adapter';
import { setupBasicMiddleware, setupCors, setupErrorHandler, setupTrustProxy } from './setup';
import { registerAuthRoutes } from './routes/authRoutes';
import { registerApiRoutes } from './routes/apiRoutes';
import { registerStaticRoutes, resolveRendererPath, VITE_DEV_PORT } from './routes/staticRoutes';
import { generateQRLoginUrlDirect } from '@process/bridge/webuiQR';
import { getLanIP } from '@process/bridge/lanAddress';
import { mountWebhookRoutes } from '@process/channels/webhook';

// Express Request type extension is defined in src/webserver/types/express.d.ts

const DEFAULT_ADMIN_USERNAME = AUTH_CONFIG.DEFAULT_USER.USERNAME;

// Store initial password (in memory, for first-time display)
let initialAdminPassword: string | null = null;

type QRCodeTerminal = {
  generate: (text: string, options?: { small?: boolean }, cb?: (qr: string) => void) => void;
};

function loadQRCodeTerminal(): QRCodeTerminal | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require('qrcode-terminal') as QRCodeTerminal;
    return module;
  } catch {
    return null;
  }
}

/**
 * Get initial admin password (only for first-time display)
 */
export function getInitialAdminPassword(): string | null {
  return initialAdminPassword;
}

/**
 * Clear initial admin password (called after user changes password)
 */
export function clearInitialAdminPassword(): void {
  initialAdminPassword = null;
}

/**
 * Fetch a plain-text public IP from a remote endpoint over HTTPS.
 * Returns null on non-200, timeout, or network error.
 */
async function fetchPublicIp(url: string, timeoutMs = 5000): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        resolve(null);
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve(body.trim() || null));
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
  });
}

/**
 * Get public IP address (Linux headless only)
 */
async function getPublicIP(): Promise<string | null> {
  // Only try to get public IP on Linux headless environment
  const isLinuxHeadless = process.platform === 'linux' && !process.env.DISPLAY;
  if (!isLinuxHeadless) {
    return null;
  }

  const publicIP = (await fetchPublicIp('https://api.ipify.org')) ?? (await fetchPublicIp('https://ifconfig.io/ip'));

  // Validate IPv4 address format
  if (publicIP && /^(\d{1,3}\.){3}\d{1,3}$/.test(publicIP)) {
    return publicIP;
  }

  return null;
}

/**
 * Get server IP address (prefer public IP, fallback to LAN IP)
 */
async function getServerIP(): Promise<string | null> {
  // Linux headless: try to get public IP
  const publicIP = await getPublicIP();
  if (publicIP) {
    return publicIP;
  }

  // All platforms: get LAN IP (Windows/Mac/Linux)
  return getLanIP();
}

/**
 * Initialize default admin account if no users exist
 *
 * @returns Initial credentials (only on first creation)
 */
async function initializeDefaultAdmin(): Promise<{
  username: string;
  password: string;
} | null> {
  const username = DEFAULT_ADMIN_USERNAME;

  const systemUser = await UserRepository.getSystemUser();
  const existingAdmin = await UserRepository.findByUsername(username);

  const hasValidPassword = (user: typeof existingAdmin): boolean =>
    !!user && typeof user.password_hash === 'string' && user.password_hash.trim().length > 0;

  if (hasValidPassword(systemUser) || hasValidPassword(existingAdmin)) {
    return null;
  }

  const password = AuthService.generateRandomPassword();

  try {
    const hashedPassword = await AuthService.hashPassword(password);

    if (systemUser) {
      const nextUsername =
        systemUser.username && systemUser.username !== systemUser.id ? systemUser.username : username;
      await UserRepository.setSystemUserCredentials(nextUsername, hashedPassword);
      initialAdminPassword = password; // Store initial password
      return { username: nextUsername, password };
    }

    if (existingAdmin) {
      await UserRepository.updatePassword(existingAdmin.id, hashedPassword);
      initialAdminPassword = password; // Store initial password
      return { username, password };
    }

    await UserRepository.createUser(username, hashedPassword);
    initialAdminPassword = password; // Store initial password
    return { username, password };
  } catch (error) {
    console.error('❌ Failed to initialize default admin account:', error);
    return null;
  }
}

/**
 * Display initial credentials in console
 */
function displayInitialCredentials(
  credentials: { username: string; password: string },
  localUrl: string,
  allowRemote: boolean,
  networkUrl?: string
): void {
  const port = parseInt(localUrl.split(':').pop() || '3000', 10);
  const { qrUrl } = generateQRLoginUrlDirect(port, allowRemote);

  console.log('\n' + '='.repeat(70));
  console.log('🎉 Wayland Web Server Started');
  console.log('='.repeat(70));
  console.log(`\n📍 Local URL:    ${localUrl}`);

  if (allowRemote && networkUrl && networkUrl !== localUrl) {
    console.log(`📍 Network URL:  ${networkUrl}`);
  }

  // Display QR Code
  console.log('\n📱 Scan QR Code to Login (expires in 5 mins)');
  const qrcode = loadQRCodeTerminal();
  if (qrcode) {
    qrcode.generate(qrUrl, { small: true }, (qr: string) => {
      console.log(qr);
    });
  } else {
    console.log('QRCode output disabled: qrcode-terminal is not installed.');
  }
  // M2: Do NOT print the QR URL - it contains the one-shot login token and
  // electron-log captures stdout into ~/Library/Logs/Wayland/main.log.
  console.log('   (QR URL omitted from log; scan QR code above to login)');

  // Display traditional credentials as fallback
  console.log('\n🔐 Or use the initial admin credentials:');
  console.log(`   Username: ${credentials.username}`);
  // Direct stdout - bypasses electron-log to keep credentials out of persistent logs (M3)
  process.stdout.write(`   Password: ${credentials.password}\n`);
  console.log('\n⚠️  Please change the password after first login!');

  console.log('='.repeat(70) + '\n');
}

/**
 * WebUI server instance type
 */
export interface WebServerInstance {
  server: import('http').Server;
  wss: import('ws').WebSocketServer;
  port: number;
  allowRemote: boolean;
}

/**
 * Start web server and return instance (for IPC calls)
 *
 * @param port Server port
 * @param allowRemote Allow remote access
 * @returns Server instance
 */
export async function startWebServerWithInstance(port: number, allowRemote = false): Promise<WebServerInstance> {
  // Set server configuration
  SERVER_CONFIG.setServerConfig(port, allowRemote);

  // Create Express app and server
  const app = express();
  const server = createServer(app);
  // Use noServer mode so we can route WebSocket upgrades manually.
  // This lets us forward Vite HMR upgrades to the Vite dev server during
  // development, while keeping the app's own WebSocket traffic on the
  // WebSocketManager. Attaching WSS directly to `server` would make it
  // swallow every upgrade (including Vite HMR), causing the renderer to
  // enter an infinite reconnect loop and never finish loading.
  const wss = new WebSocketServer({ noServer: true });
  const isDevMode = resolveRendererPath() === null;
  server.on('upgrade', (req, socket, head) => {
    const protocolHeader = req.headers['sec-websocket-protocol'];
    const protocols = (Array.isArray(protocolHeader) ? protocolHeader.join(',') : protocolHeader || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const isViteHmr = protocols.some((p) => p === 'vite-hmr' || p === 'vite-ping');

    if (isViteHmr && isDevMode) {
      // Tunnel the HMR upgrade to the Vite dev server so the renderer's
      // @vite/client can maintain its live-reload socket.
      const vite = net.connect(VITE_DEV_PORT, 'localhost', () => {
        const headerLines = [
          `${req.method} ${req.url} HTTP/${req.httpVersion}`,
          ...Object.entries(req.headers).flatMap(([key, value]) => {
            if (value === undefined) return [];
            if (Array.isArray(value)) return value.map((v) => `${key}: ${v}`);
            return [`${key}: ${value}`];
          }),
          '',
          '',
        ];
        vite.write(headerLines.join('\r\n'));
        if (head.length > 0) vite.write(head);
        socket.pipe(vite);
        vite.pipe(socket);
      });
      const destroyBoth = () => {
        socket.destroy();
        vite.destroy();
      };
      vite.on('error', destroyBoth);
      socket.on('error', destroyBoth);
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  // Initialize default admin account
  const initialCredentials = await initializeDefaultAdmin();

  // Rehydrate the token blacklist from SQLite so logouts performed before
  // the last restart still reject the corresponding tokens.
  await AuthService.hydrateBlacklist();

  // Mount webhook receiver BEFORE basic middleware so each /webhooks/* route
  // can install its own `express.raw()` body parser (signature verification
  // requires the unparsed body) and so inbound webhooks bypass CSRF - they
  // are authenticated by per-platform signatures, not by browser cookies.
  // Trust proxy must be set BEFORE any middleware reads req.ip / req.secure, and
  // narrowly (loopback + WAYLAND_OPERATOR_CIDRS only) so XFF stays non-spoofable.
  setupTrustProxy(app);
  setupCors(app, port, allowRemote);
  mountWebhookRoutes(app, {
    getSecretForToken: async (token: string): Promise<string | null> => {
      const { getTokenStore } = await import('@process/channels/webhook');
      const record = getTokenStore().resolve(token);
      if (!record) return null;
      return record.secret || null;
    },
  });

  // Configure middleware (applies to all non-webhook routes)
  setupBasicMiddleware(app);

  // Register routes
  registerAuthRoutes(app);
  registerApiRoutes(app);
  registerStaticRoutes(app);

  // Setup error handler (must be last)
  setupErrorHandler(app);

  // Start server
  // Listen on 0.0.0.0 (all interfaces) or 127.0.0.1 (local only) based on allowRemote
  const host = allowRemote ? SERVER_CONFIG.REMOTE_HOST : SERVER_CONFIG.DEFAULT_HOST;
  return new Promise((resolve, reject) => {
    server.listen(port, host, async () => {
      const localUrl = `http://localhost:${port}`;
      const serverIP = await getServerIP();
      const displayUrl = serverIP ? `http://${serverIP}:${port}` : localUrl;

      // Display initial credentials (if first startup)
      if (initialCredentials) {
        displayInitialCredentials(initialCredentials, localUrl, allowRemote, displayUrl);
      } else {
        if (allowRemote && serverIP && serverIP !== 'localhost') {
          console.log(`\n   🚀 Local access:   ${localUrl}`);
          console.log(`   🚀 Network access: ${displayUrl}\n`);
        } else {
          console.log(`\n   🚀 WebUI started: ${localUrl}\n`);
        }
      }

      // Initialize WebSocket adapter
      initWebAdapter(wss);

      resolve({
        server,
        wss,
        port,
        allowRemote,
      });
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        const maxPort = SERVER_CONFIG.DEFAULT_PORT + 10;
        if (nextPort <= maxPort) {
          console.warn(`⚠️ Port ${port} is in use, trying ${nextPort}...`);
          server.close();
          resolve(startWebServerWithInstance(nextPort, allowRemote));
        } else {
          console.error(`❌ Ports ${SERVER_CONFIG.DEFAULT_PORT}-${maxPort} all in use`);
          reject(err);
        }
      } else {
        console.error('❌ Server error:', err);
        reject(err);
      }
    });
  });
}

/**
 * Start web server (CLI mode, auto-opens browser)
 *
 * @param port Server port
 * @param allowRemote Allow remote access
 */
export async function startWebServer(port: number, allowRemote = false): Promise<void> {
  // Reuse startWebServerWithInstance
  await startWebServerWithInstance(port, allowRemote);

  // No longer auto-open browser, user can manually visit the URL printed in console
}
