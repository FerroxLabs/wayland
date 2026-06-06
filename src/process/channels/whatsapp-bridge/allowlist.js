/**
 * Portions adapted from Hermes Agent:
 *   hermes-agent/scripts/whatsapp-bridge/allowlist.js
 *   Copyright (c) 2025 Peter Steinberger / Hermes Agent contributors - MIT License
 *
 * Wayland modifications:
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Purpose: defense-in-depth allowlist for which JSON-RPC methods the bridge
 * accepts from the parent process, plus WhatsApp sender-identifier matching
 * (LID ↔ phone reverse mapping) for inbound message filtering.
 */

import path from 'path';
import { existsSync, readFileSync } from 'fs';

/**
 * The complete set of JSON-RPC methods the bridge accepts from the parent.
 * Anything outside this list is rejected with method_not_allowed.
 */
export const ALLOWED_RPC_METHODS = new Set([
  'connect',
  'disconnect',
  'sendText',
  'sendMedia',
  'setPresence',
  'react',
  'subscribe',
  'webhookDelivery',
  'health',
]);

/** Returns true if the JSON-RPC method is in the allowlist. */
export function isMethodAllowed(method) {
  return typeof method === 'string' && ALLOWED_RPC_METHODS.has(method);
}

/**
 * Normalize a WhatsApp identifier to bare phone digits.
 * Strips device suffix (`:N`), JID host (`@s.whatsapp.net`, `@lid`), and leading `+`.
 */
export function normalizeWhatsAppIdentifier(value) {
  return String(value || '')
    .trim()
    .replace(/:.*@/, '@')
    .replace(/@.*/, '')
    .replace(/^\+/, '');
}

/** Parse a comma-separated allowed-users env value into a Set of normalized identifiers. */
export function parseAllowedUsers(rawValue) {
  return new Set(
    String(rawValue || '')
      .split(',')
      .map((value) => normalizeWhatsAppIdentifier(value))
      .filter(Boolean),
  );
}

function readMappingFile(sessionDir, identifier, suffix = '') {
  const filePath = path.join(sessionDir, `lid-mapping-${identifier}${suffix}.json`);
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    const normalized = normalizeWhatsAppIdentifier(parsed);
    return normalized || null;
  } catch {
    return null;
  }
}

/**
 * Walk both phone→LID and LID→phone mapping files so allowlists can use
 * either form transparently. Returns the set of equivalent identifiers.
 */
export function expandWhatsAppIdentifiers(identifier, sessionDir) {
  const normalized = normalizeWhatsAppIdentifier(identifier);
  if (!normalized) {
    return new Set();
  }

  const resolved = new Set();
  const queue = [normalized];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || resolved.has(current)) {
      continue;
    }

    resolved.add(current);

    for (const suffix of ['', '_reverse']) {
      const mapped = readMappingFile(sessionDir, current, suffix);
      if (mapped && !resolved.has(mapped)) {
        queue.push(mapped);
      }
    }
  }

  return resolved;
}

/**
 * Decide whether to accept an inbound WhatsApp message from senderId.
 * Empty allowlist = nobody allowed (secure default).
 * Allowlist containing "*" = open bot.
 */
export function matchesAllowedUser(senderId, allowedUsers, sessionDir) {
  if (!allowedUsers || allowedUsers.size === 0) {
    return false;
  }

  if (allowedUsers.has('*')) {
    return true;
  }

  const aliases = expandWhatsAppIdentifiers(senderId, sessionDir);
  for (const alias of aliases) {
    if (allowedUsers.has(alias)) {
      return true;
    }
  }

  return false;
}
