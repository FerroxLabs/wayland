/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request } from 'express';
import { WEBUI_DEFAULT_PORT } from '@/common/config/constants';

// CSRF token cookie/header identifiers (shared by server & WebUI)
export const CSRF_COOKIE_NAME = 'wayland-csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';
/**
 * Centralized configuration management
 */

// Auth config
export const AUTH_CONFIG = {
  // Token configuration
  TOKEN: {
    // Session JWT expiry duration
    SESSION_EXPIRY: '24h' as const,
    // WebSocket token expiry - Currently WebSocket reuses web login token, reserved for future independent token scheme
    WEBSOCKET_EXPIRY: '5m' as const,
    // Cookie max-age in milliseconds
    COOKIE_MAX_AGE: 30 * 24 * 60 * 60 * 1000,
    // WebSocket token max-age - Currently unused, reserved for future independent token scheme
    WEBSOCKET_TOKEN_MAX_AGE: 5 * 60,
  },

  // Rate limiting configuration
  RATE_LIMIT: {
    // Max login attempts
    LOGIN_MAX_ATTEMPTS: 5,
    // Max register attempts
    REGISTER_MAX_ATTEMPTS: 3,
    // Rate limit window in milliseconds
    WINDOW_MS: 15 * 60 * 1000,
  },

  // Default user configuration
  DEFAULT_USER: {
    // Default admin username
    USERNAME: 'admin' as const,
  },

  // Cookie configuration
  COOKIE: {
    // Cookie name
    NAME: 'wayland-session' as const,
    OPTIONS: {
      // httpOnly flag
      httpOnly: true,
      // secure flag, enable under HTTPS
      secure: false,
      // SameSite strategy
      sameSite: 'strict' as const,
    },
  },
} as const;

// WebSocket configuration
export const WEBSOCKET_CONFIG = {
  // Heartbeat interval in ms
  HEARTBEAT_INTERVAL: 30000,
  // Heartbeat timeout in ms
  HEARTBEAT_TIMEOUT: 60000,
  CLOSE_CODES: {
    // Policy violation close code
    POLICY_VIOLATION: 1008,
    // Normal close code
    NORMAL_CLOSURE: 1000,
  },
} as const;

// Server configuration
export const SERVER_CONFIG = {
  // Default listen host
  DEFAULT_HOST: '127.0.0.1' as const,
  // Remote mode listen host
  REMOTE_HOST: '0.0.0.0' as const,
  // Default port: 25808 for prod, 25809 for dev
  DEFAULT_PORT: WEBUI_DEFAULT_PORT,
  // Request body size limit
  BODY_LIMIT: '10mb' as const,

  /**
   * Internal state: Current server configuration
   */
  _currentConfig: {
    host: '127.0.0.1' as string,
    port: WEBUI_DEFAULT_PORT as number,
    allowRemote: false as boolean,
  },

  /**
   * Set server configuration (called when webserver starts)
   */
  setServerConfig(port: number, allowRemote: boolean): void {
    this._currentConfig.port = port;
    this._currentConfig.host = allowRemote ? '0.0.0.0' : '127.0.0.1';
    this._currentConfig.allowRemote = allowRemote;
  },

  /**
   * Check if remote access mode is enabled
   */
  get isRemoteMode(): boolean {
    return this._currentConfig.allowRemote;
  },

  /**
   * Get base URL for URL parsing
   * Priority: Environment variable > Current server config > Default
   */
  get BASE_URL(): string {
    if (process.env.SERVER_BASE_URL) {
      return process.env.SERVER_BASE_URL;
    }

    const host = this._currentConfig.host === '0.0.0.0' ? '127.0.0.1' : this._currentConfig.host;
    return `http://${host}:${this._currentConfig.port}`;
  },
} as const;

/**
 * Determine whether the request arrived over HTTPS (reverse-proxy aware)
 *
 * Signals (by priority):
 * 1. WAYLAND_HTTPS=true / NODE_ENV=production + HTTPS=true (explicit opt-in)
 * 2. SERVER_BASE_URL starts with https:// (explicit public entrypoint, e.g. nginx TLS)
 * 3. req.secure === true (only meaningful once Express trust proxy is configured)
 *
 * X-Forwarded-Proto is intentionally NOT read directly: without trust proxy it
 * would be spoofable. Use SERVER_BASE_URL or trust proxy + req.secure instead.
 */
export function detectHttps(req?: Request): boolean {
  if (process.env.WAYLAND_HTTPS === 'true' || (process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true')) {
    return true;
  }

  if (process.env.SERVER_BASE_URL?.startsWith('https://')) {
    return true;
  }

  if (req?.secure) {
    return true;
  }

  return false;
}

/**
 * Get dynamic cookie options (secure/sameSite driven by HTTPS config + request protocol)
 *
 * When req is provided, X-Forwarded-Proto and req.secure are honoured so that
 * deployments with TLS-terminating reverse proxies (nginx) issue Secure cookies.
 *
 * When req is omitted, falls back to env-var detection for callers without a request context.
 */
export function getCookieOptions(req?: Request): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge?: number;
} {
  const isHttps = detectHttps(req);

  // HTTPS deployments use SameSite=None to support cross-origin reverse proxies (requires Secure=true)
  // Remote HTTP mode uses 'lax' to allow access from other IPs
  // Local HTTP stays on 'strict' to minimize third-party exposure
  let sameSite: 'strict' | 'lax' | 'none';
  if (isHttps) {
    sameSite = 'none';
  } else if (SERVER_CONFIG.isRemoteMode) {
    sameSite = 'lax';
  } else {
    sameSite = AUTH_CONFIG.COOKIE.OPTIONS.sameSite;
  }

  return {
    httpOnly: AUTH_CONFIG.COOKIE.OPTIONS.httpOnly,
    // In HTTP environment secure=false, allows cookies to work over non-HTTPS connections
    secure: isHttps,
    sameSite,
  };
}

// Security configuration
export const SECURITY_CONFIG = {
  HEADERS: {
    // Clickjacking protection
    FRAME_OPTIONS: 'DENY',
    // No MIME sniffing
    CONTENT_TYPE_OPTIONS: 'nosniff',
    // XSS protection header
    XSS_PROTECTION: '1; mode=block',
    // Referrer policy
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
    // Content-Security-Policy builder for development.
    // Keeps 'unsafe-eval' for Vite HMR; still nonce-gates inline scripts.
    // style-src retains 'unsafe-inline' because Arco Design injects runtime styles.
    buildCspDev(nonce: string): string {
      return (
        `default-src 'self'; ` +
        `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; ` +
        `style-src 'self' 'unsafe-inline'; ` +
        `img-src 'self' data: blob: https:; ` +
        `font-src 'self' data:; ` +
        `connect-src 'self' ws: wss: blob:; ` +
        `media-src 'self' blob:;`
      );
    },
    // Content-Security-Policy builder for production.
    // Drops 'unsafe-inline' from script-src - every inline <script> must carry
    // the per-request nonce (see cspNonceMiddleware). Renderer & QR-login HTML
    // inject the nonce server-side before responding.
    // style-src retains 'unsafe-inline' because Arco Design injects runtime styles.
    buildCspProd(nonce: string): string {
      return (
        `default-src 'self'; ` +
        `script-src 'self' 'nonce-${nonce}'; ` +
        `style-src 'self' 'unsafe-inline'; ` +
        `img-src 'self' data: blob: https:; ` +
        `font-src 'self' data:; ` +
        `connect-src 'self' ws: wss: blob:; ` +
        `media-src 'self' blob:;`
      );
    },
  },
  CSRF: {
    COOKIE_NAME: CSRF_COOKIE_NAME,
    HEADER_NAME: CSRF_HEADER_NAME,
    TOKEN_LENGTH: 32,
    COOKIE_OPTIONS: {
      httpOnly: false,
      sameSite: 'strict' as const,
      secure: false,
      path: '/',
    },
  },
} as const;
