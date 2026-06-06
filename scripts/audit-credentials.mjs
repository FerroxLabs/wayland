#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * audit-credentials - scans Wayland's persisted config for plaintext credentials.
 *
 * Channel plugins store credentials in `wayland-config.txt` (Electron `userData`
 * dir). Sensitive fields MUST be wrapped in the `enc:v1:` ciphertext envelope
 * produced by `src/process/secrets/safeStorage.ts`. The audit runs two passes:
 *
 *   1. Value-prefix scan - searches the raw config (with enc:v1: blocks
 *      redacted) for well-known credential prefixes (xoxb-, AC..., EAA..., etc.).
 *      Catches leaks even in fields the script doesn't know by name.
 *
 *   2. Field-name scan - parses the config as JSON and walks every object,
 *      flagging any field whose name matches the canonical sensitive-field
 *      list (mirrored from src/process/secrets/fieldClassification.ts) when
 *      the value is a non-empty string NOT wrapped in `enc:v1:`. Catches
 *      leaks whose values don't have a recognizable prefix (e.g. operator-
 *      chosen webhook secrets, Discord application IDs).
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

/**
 * Canonical sensitive-field-name list. Kept in sync with
 * `src/process/secrets/fieldClassification.ts` SENSITIVE_FIELD_NAMES.
 *
 * Channel-specific additions for v0.2.0 tier-1 platforms (Discord, Slack
 * Tier 1, SMS/Twilio, WhatsApp Meta Cloud API):
 *
 *   Discord:      botToken, applicationId, publicKey
 *   Slack T1:     botToken, appToken, signingSecret  (NOT: transport)
 *   SMS Twilio:   accountSid, authToken              (NOT: fromNumber,
 *                                                          messagingServiceSid)
 *   WhatsApp:     accessToken, verifyToken           (NOT: phoneNumberId,
 *                                                          businessAccountId,
 *                                                          backend)
 *
 * Matching is case-insensitive and format-insensitive (underscores and
 * hyphens stripped) - see `isSensitiveFieldName`.
 */
const SENSITIVE_FIELD_NAMES = [
  // Generic
  'token',
  'authToken',
  'accessToken',
  'refreshToken',
  'appSecret',
  'signingSecret',
  'apiKey',
  'password',
  'channelSecret',
  'channelAccessToken',
  'verifyToken',
  'webhookSecret',
  'botToken',
  'appToken',
  'appPassword',
  // v0.2.0 channel additions (not covered by the generic list above)
  'applicationId', // Discord - leaks the bot identity
  'publicKey', // Discord - leaks the interaction-verification key
  'accountSid', // Twilio - half of the Twilio auth pair
];

/**
 * Field names that look sensitive but explicitly are NOT, per the v0.2.0
 * channel design. These are public IDs, enum selectors, or phone numbers
 * that are safe to store in plaintext. Listed here as documentation; the
 * scan simply does not match them.
 *
 *   transport (Slack),
 *   fromNumber (Twilio),
 *   messagingServiceSid (Twilio),
 *   phoneNumberId (WhatsApp Meta),
 *   businessAccountId (WhatsApp Meta),
 *   backend (WhatsApp).
 */

function isSensitiveFieldName(fieldName) {
  const normalized = fieldName.toLowerCase().replace(/[_-]/g, '');
  for (const sensitive of SENSITIVE_FIELD_NAMES) {
    if (normalized.includes(sensitive.toLowerCase())) {
      return true;
    }
  }
  return false;
}

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

/**
 * Walk a parsed JSON tree; for every string-valued field whose name is
 * sensitive AND whose value is not an `enc:v1:` envelope, record a finding.
 */
function walkForSensitiveFields(node, path, findings) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      walkForSensitiveFields(node[i], `${path}[${i}]`, findings);
    }
    return;
  }
  if (typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    const childPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string' && value.length > 0 && isSensitiveFieldName(key)) {
      if (!value.startsWith('enc:v1:')) {
        findings.push({
          kind: `Plaintext sensitive field "${key}"`,
          path: childPath,
          value: maskValue(value),
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      walkForSensitiveFields(value, childPath, findings);
    }
  }
}

function scan(configPath) {
  if (!existsSync(configPath)) {
    console.error(`[audit-credentials] Config not found at: ${configPath}`);
    console.error('Pass --config <path> if Wayland uses a non-default location.');
    return { found: 0, missing: true };
  }

  const raw = readFileSync(configPath, 'utf8');

  // Pass 1: prefix scan (value-based)
  const stripped = stripEncryptedBlocks(raw);
  const findings = [];
  for (const { pattern, name } of KNOWN_PREFIXES) {
    for (const match of stripped.matchAll(pattern)) {
      findings.push({ kind: name, value: maskValue(match[0]) });
    }
  }

  // Pass 2: field-name scan (structure-based). Best-effort JSON parse;
  // if the config isn't JSON-parseable, we just skip this pass - the
  // prefix scan still ran.
  try {
    const parsed = JSON.parse(raw);
    walkForSensitiveFields(parsed, '', findings);
  } catch {
    // Non-JSON config layout; prefix scan is the only coverage available.
  }

  return { found: findings.length, findings, missing: false };
}

const configPath = parseArgs();
const result = scan(configPath);

if (result.missing) exit(2);

if (result.found === 0) {
  console.log(`[audit-credentials] OK - no plaintext credentials detected in ${configPath}`);
  exit(0);
}

console.error(`[audit-credentials] FAIL - ${result.found} plaintext credential(s) detected in ${configPath}:`);
for (const finding of result.findings) {
  const where = finding.path ? ` @ ${finding.path}` : '';
  console.error(`  - ${finding.kind}${where}: ${finding.value}`);
}
console.error('');
console.error('Remediation:');
console.error('  - Stop the app immediately.');
console.error('  - Rotate every leaked credential at its source platform.');
console.error('  - Restart the app; the one-shot migrateCredentialsToSafeStorage_v1 will re-encrypt.');
console.error('  - Verify by re-running this script.');
exit(1);
