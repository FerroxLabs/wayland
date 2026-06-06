/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure helpers for the Nostr channel plugin: key validation/encoding, NIP-04
 * encrypt/decrypt wrappers, and IUnifiedIncomingMessage construction from raw
 * Nostr events. No side-effects, no network I/O - safe to unit-test in isolation.
 */

import { randomUUID } from 'node:crypto';

import { getPublicKey, nip19 } from 'nostr-tools';
import { decrypt, encrypt } from 'nostr-tools/nip04';

import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

// ── Key helpers ───────────────────────────────────────────────────────────────
// Adapted from openclaw/extensions/nostr/src/nostr-bus.ts (MIT).

/**
 * Validate and decode a private key in nsec or 64-char hex format.
 * Throws a descriptive error on invalid input.
 */
export function validatePrivateKey(key: string): Uint8Array {
  const trimmed = key.trim();
  if (trimmed.startsWith('nsec1')) {
    const decoded = nip19.decode(trimmed);
    if (decoded.type !== 'nsec') throw new Error('Invalid nsec key: wrong type');
    return decoded.data as Uint8Array;
  }
  if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new Error('Private key must be 64 hex characters or nsec bech32 format');
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(trimmed.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Derive the hex public key from a private key (nsec or hex).
 */
export function derivePublicKey(privateKey: string): string {
  const sk = validatePrivateKey(privateKey);
  return getPublicKey(sk);
}

/**
 * Encode a hex public key as npub bech32.
 */
export function hexToNpub(hexPubkey: string): string {
  return nip19.npubEncode(hexPubkey);
}

/**
 * Decode an npub to hex. Returns the input unchanged if it is already hex.
 * Throws on invalid input.
 */
export function normalizePubkey(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('npub1')) {
    const decoded = nip19.decode(trimmed);
    if (decoded.type !== 'npub') throw new Error('Invalid npub key');
    return Array.from(decoded.data as unknown as Uint8Array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new Error('Pubkey must be 64 hex characters or npub format');
  }
  return trimmed.toLowerCase();
}

// ── NIP-04 crypto ─────────────────────────────────────────────────────────────

/**
 * NIP-04 encrypt plaintext for a recipient pubkey. sk must be a Uint8Array.
 */
export function nip04Encrypt(sk: Uint8Array, recipientPubkey: string, plaintext: string): string {
  return encrypt(sk, recipientPubkey, plaintext);
}

/**
 * NIP-04 decrypt ciphertext from a sender pubkey. sk must be a Uint8Array.
 */
export function nip04Decrypt(sk: Uint8Array, senderPubkey: string, ciphertext: string): string {
  return decrypt(sk, senderPubkey, ciphertext);
}

// ── Incoming message conversion ───────────────────────────────────────────────

/**
 * Minimal shape of a Nostr event we need from nostr-tools' Event type.
 */
export type NostrEventLike = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
};

/**
 * Convert a decrypted Nostr kind:4 DM to IUnifiedIncomingMessage.
 * chatId is the sender's pubkey (hex) - the natural "conversation" id for DMs.
 */
export function toUnifiedIncomingFromNostr(
  event: NostrEventLike,
  plaintext: string,
): IUnifiedIncomingMessage {
  const npub = hexToNpub(event.pubkey);
  return {
    id: randomUUID(),
    platform: 'nostr',
    chatId: event.pubkey,
    user: {
      id: event.pubkey,
      username: npub,
      displayName: npub,
    },
    content: {
      type: 'text',
      text: plaintext,
    },
    timestamp: event.created_at * 1000,
    raw: event,
  };
}

// ── Outgoing message formatting ───────────────────────────────────────────────

/**
 * Extract plaintext from a unified outgoing message.
 * Nostr DMs are unstructured plaintext - no chunking needed (relay accepts
 * arbitrary length; NIP-04 ciphertext size is bounded by the message itself).
 */
export function fromUnifiedOutgoingToNostr(message: IUnifiedOutgoingMessage): string {
  return (message.text ?? '').trim();
}
