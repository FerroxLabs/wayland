#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * audit-credentials — scans Wayland's persisted config for plaintext credentials.
 *
 * Channel plugins store credentials in `wayland-config.txt` (Electron `userData`
 * dir). Sensitive fields MUST be wrapped in the `enc:v1:` ciphertext envelope
 * produced by `src/process/secrets/safeStorage.ts`. Anything matching a
 * well-known credential prefix in the *unwrapped* segments is a plaintext leak.
 *
 * Usage (manual):
 *   node scripts/audit-credentials.mjs --config "$HOME/Library/Application Support/Wayland/wayland-config.txt"
 *
 * Usage (CI smoke):
 *   node scripts/audit-credentials.mjs  # auto-locates default userData path per OS
 *
 * Exit codes:
 *   0  clean (no plaintext credentials found)
 *   1  plaintext credential detected
 *   2  config file missing or unreadable
 */

import { existsSync, readFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { argv, exit } from 'node:process';

/**
 * Well-known credential prefixes that must never appear in plaintext.
 * Each entry: { pattern, name }. Patterns use the `g` flag so `String.matchAll`
 * returns every occurrence.
 */
const KNOWN_PREFIXES = [
  { pattern: /xoxb-[a-zA-Z0-9-]{20,}/g, name: 'Slack bot token' },
  { pattern: /xapp-[a-zA-Z0-9-]{20,}/g, name: 'Slack app token' },
  { pattern: /xoxp-[a-zA-Z0-9-]{20,}/g, name: 'Slack user OAuth token' },
  { pattern: /AC[a-f0-9]{32}/g, name: 'Twilio Account SID + AuthToken' },
  { pattern: /am_[a-zA-Z0-9_]{16,}/g, name: 'AgentMail API key' },
  { pattern: /sk-[a-zA-Z0-9_-]{20,}/g, name: 'OpenAI/Anthropic-style API key' },
  { pattern: /ya29\.[a-zA-Z0-9_-]{20,}/g, name: 'Google OAuth access token' },
  { pattern: /1\/\/[a-zA-Z0-9_-]{20,}/g, name: 'Google OAuth refresh token' },
  { pattern: /gho_[a-zA-Z0-9_]{30,}/g, name: 'GitHub OAuth token' },
  { pattern: /github_pat_[a-zA-Z0-9_]{20,}/g, name: 'GitHub fine-grained PAT' },
  { pattern: /EAA[A-Za-z0-9]{50,}/g, name: 'Meta WhatsApp access token' },
  { pattern: /xkeysib-[a-f0-9]{40,}/g, name: 'Brevo/Sendinblue API key' },
];

function locateDefaultConfig() {
  const home = homedir();
  switch (platform()) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', 'Wayland', 'wayland-config.txt');
    case 'win32':
      return join(home, 'AppData', 'Roaming', 'Wayland', 'wayland-config.txt');
    default:
      return join(home, '.config', 'Wayland', 'wayland-config.txt');
  }
}

function parseArgs() {
  const args = argv.slice(2);
  const idx = args.indexOf('--config');
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return locateDefaultConfig();
}

/**
 * Strip every `enc:v1:<base64>` block from the input. Encrypted ciphertext is
 * statistically near-impossible to contain a real credential prefix, but we
 * exclude these segments explicitly to make the audit verdict trustworthy.
 */
function stripEncryptedBlocks(raw) {
  return raw.replace(/enc:v1:[A-Za-z0-9+/=_-]+/g, '<<enc:redacted>>');
}

function maskValue(value) {
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function scan(configPath) {
  if (!existsSync(configPath)) {
    console.error(`[audit-credentials] Config not found at: ${configPath}`);
    console.error('Pass --config <path> if Wayland uses a non-default location.');
    return { found: 0, missing: true };
  }

  const raw = readFileSync(configPath, 'utf8');
  const stripped = stripEncryptedBlocks(raw);
  const findings = [];

  for (const { pattern, name } of KNOWN_PREFIXES) {
    for (const match of stripped.matchAll(pattern)) {
      findings.push({ kind: name, value: maskValue(match[0]) });
    }
  }

  return { found: findings.length, findings, missing: false };
}

const configPath = parseArgs();
const result = scan(configPath);

if (result.missing) exit(2);

if (result.found === 0) {
  console.log(`[audit-credentials] OK — no plaintext credentials detected in ${configPath}`);
  exit(0);
}

console.error(`[audit-credentials] FAIL — ${result.found} plaintext credential(s) detected in ${configPath}:`);
for (const finding of result.findings) {
  console.error(`  - ${finding.kind}: ${finding.value}`);
}
console.error('');
console.error('Remediation:');
console.error('  - Stop the app immediately.');
console.error('  - Rotate every leaked credential at its source platform.');
console.error('  - Restart the app; the one-shot migrateCredentialsToSafeStorage_v1 will re-encrypt.');
console.error('  - Verify by re-running this script.');
exit(1);
