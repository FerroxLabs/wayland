/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { ProviderId } from '../types';

/**
 * Key auto-discovery (Packet 1E).
 *
 * Scans the machine for provider API keys that are already present - in
 * environment variables and in known CLI config files - and surfaces them so
 * the Models settings page can offer a "Found N keys - Use / Ignore" strip.
 *
 * Consent model: `scan()` returns ONLY `{ providerId, source }` - never key
 * material. The actual value is re-read on demand via `readValue()` once the
 * user explicitly clicks "Use". This keeps key material out of the scan result
 * and out of memory until consent is given. `source` encodes the origin
 * precisely enough that `readValue()` can re-locate the value later.
 */

/** A provider key found on the machine. Carries no key material. */
export type DiscoveredKey = {
  providerId: ProviderId;
  /**
   * Origin of the key, precise enough to re-read the value later:
   *  - `env:<VAR_NAME>` - an environment variable.
   *  - `file:<absolute-path>#<json-field>` - a top-level string field of a
   *    JSON config file.
   */
  source: string;
};

/**
 * Well-known API-key environment variable names per provider.
 *
 * Variable names are cross-checked against the `env` field of each provider in
 * `resources/modelsdev-snapshot.json` (models.dev registry). Within a
 * provider's list, order is significant: the first env var that is set wins,
 * so a provider is reported once even when several of its variables are set.
 */
export const PROVIDER_ENV_VARS: Partial<Record<ProviderId, readonly string[]>> = {
  openai: ['OPENAI_API_KEY'],
  anthropic: ['ANTHROPIC_API_KEY'],
  // models.dev `google` provider: GOOGLE_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY,
  // GEMINI_API_KEY. GEMINI_API_KEY is listed first - it is the variable the
  // Gemini SDKs and CLI document most prominently.
  'google-gemini': ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY'],
  groq: ['GROQ_API_KEY'],
  openrouter: ['OPENROUTER_API_KEY'],
  mistral: ['MISTRAL_API_KEY'],
  deepseek: ['DEEPSEEK_API_KEY'],
  xai: ['XAI_API_KEY'],
  together: ['TOGETHER_API_KEY'],
  fireworks: ['FIREWORKS_API_KEY'],
  perplexity: ['PERPLEXITY_API_KEY'],
  cohere: ['COHERE_API_KEY'],
  cerebras: ['CEREBRAS_API_KEY'],
};

/**
 * Deterministic scan order over `PROVIDER_ENV_VARS`. Object key order is stable
 * in V8 for string keys, but pinning it explicitly makes the ordering contract
 * obvious and resistant to future reordering of the map literal.
 */
const ENV_SCAN_ORDER: readonly ProviderId[] = [
  'openai',
  'anthropic',
  'google-gemini',
  'groq',
  'openrouter',
  'mistral',
  'deepseek',
  'xai',
  'together',
  'fireworks',
  'perplexity',
  'cohere',
  'cerebras',
];

/**
 * A JSON config file written by a CLI agent that *may* hold a raw provider key.
 *
 * Research note (2026-05-22): the three CLI agents Wayland targets are largely
 * OAuth-authenticated, so most of their config files hold OAuth tokens, not an
 * extractable provider API key:
 *  - `~/.codex/auth.json` - has a top-level `OPENAI_API_KEY` string field, but
 *    it is populated ONLY when Codex is in API-key auth mode (`auth_mode:
 *    "apikey"`). In ChatGPT/OAuth mode the field is `null` and the real
 *    credential lives under `tokens` as OAuth material - NOT a usable raw key.
 *  - `~/.claude.json` - Claude Code is OAuth-authenticated; it only stores
 *    `customApiKeyResponses` (hashes of approved keys), never a raw key.
 *  - `~/.gemini/oauth_creds.json` - OAuth tokens only, no raw API key.
 *
 * Hence the only file worth scanning is `~/.codex/auth.json#OPENAI_API_KEY`,
 * and only when that field is a non-empty string. Arbitrary shell rc files are
 * never parsed.
 */
type ConfigFileSource = {
  providerId: ProviderId;
  /** Absolute path, resolved against the user's home directory. */
  filePath: string;
  /** Top-level JSON field expected to hold the raw key. */
  field: string;
};

function configFileSources(): ConfigFileSource[] {
  const home = os.homedir();
  return [
    {
      providerId: 'openai',
      filePath: path.join(home, '.codex', 'auth.json'),
      field: 'OPENAI_API_KEY',
    },
  ];
}

/** True for a non-empty, non-whitespace string. */
function isUsableKey(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Read and parse a JSON file, returning an object or null on any failure. */
function readJsonObject(filePath: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Compose a `file:` source string from a path and a JSON field name. */
function fileSource(filePath: string, field: string): string {
  return `file:${filePath}#${field}`;
}

/** Parse a `file:` source string back into its path + field components. */
function parseFileSource(source: string): { filePath: string; field: string } | null {
  if (!source.startsWith('file:')) return null;
  const body = source.slice('file:'.length);
  const hashIndex = body.lastIndexOf('#');
  if (hashIndex <= 0 || hashIndex === body.length - 1) return null;
  return { filePath: body.slice(0, hashIndex), field: body.slice(hashIndex + 1) };
}

export class KeyDiscovery {
  /**
   * Scan environment variables and known CLI config files for provider keys.
   *
   * Returns one `DiscoveredKey` per provider found. Environment-variable hits
   * take precedence over config-file hits for the same provider, and a single
   * provider is never reported twice. Never throws - an unreadable or malformed
   * config file degrades silently to "not found".
   */
  async scan(): Promise<DiscoveredKey[]> {
    const found: DiscoveredKey[] = [];
    const seen = new Set<ProviderId>();

    // --- Environment-variable scan (highest precedence) ---
    for (const providerId of ENV_SCAN_ORDER) {
      const candidates = PROVIDER_ENV_VARS[providerId];
      if (!candidates) continue;
      for (const varName of candidates) {
        if (isUsableKey(process.env[varName])) {
          found.push({ providerId, source: `env:${varName}` });
          seen.add(providerId);
          break; // first match wins - report this provider once
        }
      }
    }

    // --- CLI config-file scan (lower precedence) ---
    for (const cfg of configFileSources()) {
      if (seen.has(cfg.providerId)) continue;
      const obj = readJsonObject(cfg.filePath);
      if (obj && isUsableKey(obj[cfg.field])) {
        found.push({ providerId: cfg.providerId, source: fileSource(cfg.filePath, cfg.field) });
        seen.add(cfg.providerId);
      }
    }

    return found;
  }

  /**
   * Re-read the actual key value for a previously discovered key.
   *
   * Called by Packet 1F when the user clicks "Use" on a discovered key - this
   * is the only path that touches key material. The value is resolved fresh
   * from `source` (an env var or a JSON config file) and is never cached.
   *
   * Returns `null` - never throws - when the source is gone, the env var has
   * been unset, the file is missing/unreadable/malformed, the named field is
   * absent or empty, or the source scheme is unrecognized.
   */
  readValue(discovered: DiscoveredKey): string | null {
    const { source } = discovered;

    if (source.startsWith('env:')) {
      const value = process.env[source.slice('env:'.length)];
      return isUsableKey(value) ? value : null;
    }

    const parsed = parseFileSource(source);
    if (parsed) {
      const obj = readJsonObject(parsed.filePath);
      if (obj && isUsableKey(obj[parsed.field])) {
        return obj[parsed.field] as string;
      }
      return null;
    }

    return null;
  }
}
