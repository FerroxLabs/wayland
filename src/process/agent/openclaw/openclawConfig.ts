/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

/**
 * OpenClaw Config Reader
 *
 * Reads OpenClaw configuration from ~/.openclaw/openclaw.json
 * to get gateway auth settings.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Config file paths
const DEFAULT_STATE_DIR = path.join(os.homedir(), '.openclaw');
const CONFIG_FILENAME = 'openclaw.json';
const LEGACY_CONFIG_FILENAMES = ['clawdbot.json', 'moltbot.json', 'moldbot.json'];

interface OpenClawGatewayAuth {
  mode?: 'none' | 'token' | 'password';
  // Upstream types these `SecretInput = string | SecretRef`: a config may hold a
  // reference ({ source: 'env', ... }) instead of a plaintext secret. Typing them
  // `string` here was a lie the compiler then enforced nowhere, so the readers
  // below must narrow before returning. `unknown` makes that narrowing mandatory.
  token?: unknown;
  password?: unknown;
}

interface OpenClawGatewayConfig {
  port?: number;
  auth?: OpenClawGatewayAuth;
}

interface OpenClawConfig {
  gateway?: OpenClawGatewayConfig;
}

/**
 * Resolve the state directory (default: ~/.openclaw)
 */
function resolveStateDir(): string {
  const override = process.env.OPENCLAW_STATE_DIR?.trim() || process.env.CLAWDBOT_STATE_DIR?.trim();
  if (override) {
    return resolveUserPath(override);
  }

  const newDir = DEFAULT_STATE_DIR;
  const legacyDirs = ['.clawdbot', '.moltbot', '.moldbot'].map((dir) => path.join(os.homedir(), dir));

  if (fs.existsSync(newDir)) {
    return newDir;
  }

  const existingLegacy = legacyDirs.find((dir) => {
    try {
      return fs.existsSync(dir);
    } catch {
      return false;
    }
  });

  if (existingLegacy) {
    return existingLegacy;
  }

  return newDir;
}

/**
 * Resolve user path (expand ~ to home directory)
 */
function resolveUserPath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed.startsWith('~')) {
    const expanded = trimmed.replace(/^~(?=$|[\\/])/, os.homedir());
    return path.resolve(expanded);
  }
  return path.resolve(trimmed);
}

/**
 * Find the config file path
 */
function findConfigPath(): string | null {
  const override = process.env.OPENCLAW_CONFIG_PATH?.trim();
  if (override) {
    return resolveUserPath(override);
  }

  const stateDir = resolveStateDir();
  const candidates = [CONFIG_FILENAME, ...LEGACY_CONFIG_FILENAMES].map((name) => path.join(stateDir, name));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Read OpenClaw config from file
 */
export function readOpenClawConfig(): OpenClawConfig | null {
  const configPath = findConfigPath();
  if (!configPath) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    try {
      return JSON.parse(content) as OpenClawConfig;
    } catch {
      // If standard parse fails, try removing comments (JSONC style)
      // Use a string-aware approach: skip // and /* */ only outside quoted strings
      const cleanContent = content.replace(/"(?:[^"\\]|\\.)*"|\/\/.*$|\/\*[\s\S]*?\*\//gm, (match) =>
        match.startsWith('"') ? match : match.startsWith('/*') ? '' : ''
      );
      return JSON.parse(cleanContent) as OpenClawConfig;
    }
  } catch (error) {
    console.warn('[OpenClawConfig] Failed to read config:', error);
    return null;
  }
}

/**
 * Get gateway auth settings from config
 */
export function getGatewayAuthFromConfig(): OpenClawGatewayAuth | null {
  const config = readOpenClawConfig();
  return config?.gateway?.auth ?? null;
}

/**
 * Get gateway auth token from config
 */
export function getGatewayAuthToken(): string | null {
  const auth = getGatewayAuthFromConfig();
  // A SecretRef is a legitimate config value we cannot resolve here; treat it as
  // absent rather than shipping an object into a field the gateway validates as
  // a string (that produces "invalid connect params" and an immediate close).
  const token = typeof auth?.token === 'string' && auth.token ? auth.token : null;
  if (!token) return null;
  if (auth?.mode === 'token') return token;
  // `mode` is optional upstream. With it unset, the one configured secret is the
  // active one — requiring the discriminator meant a valid config that omitted it
  // had its token silently ignored (#907). Stay silent when both are set: that
  // config is ambiguous here, and it is what today already does.
  if (!auth?.mode && !auth?.password) return token;
  return null;
}

/**
 * Get gateway auth password from config
 */
export function getGatewayAuthPassword(): string | null {
  const auth = getGatewayAuthFromConfig();
  const password = typeof auth?.password === 'string' && auth.password ? auth.password : null;
  if (!password) return null;
  if (auth?.mode === 'password') return password;
  // Symmetric with the token reader, so the two cannot both claim the same
  // mode-unset config.
  if (!auth?.mode && !auth?.token) return password;
  return null;
}

/**
 * Get gateway port from config
 */
export function getGatewayPort(): number {
  const config = readOpenClawConfig();
  const port = config?.gateway?.port;
  if (typeof port === 'number' && Number.isFinite(port) && port > 0) {
    return port;
  }
  return 18789; // Default port
}
