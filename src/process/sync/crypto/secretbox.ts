/**
 * NaCl secretbox wrapper using tweetnacl.
 *
 * Wire format: [24-byte nonce || ciphertext+MAC]
 * - nonce: 24 random bytes generated per-message (xsalsa20poly1305)
 * - ciphertext includes 16-byte Poly1305 MAC appended by tweetnacl
 *
 * SECURITY NOTES
 * - tweetnacl@1.0.3 is the canonical audited NaCl port (Bernstein et al.).
 * - Nonce is randomly generated per seal() call - safe for key reuse across
 *   many sync operations (2^64 nonces at 24 bytes; birthday bound ~2^96 ops).
 * - open() returns null on any MAC failure - do not ignore null returns.
 * - Key must be exactly 32 bytes (secretbox.keyLength).
 */

import nacl from 'tweetnacl';

/** Encrypt plaintext with a 32-byte key. Returns nonce || ciphertext. */
export function seal(plaintext: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length !== nacl.secretbox.keyLength) {
    throw new Error(`Key must be ${nacl.secretbox.keyLength} bytes`);
  }
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(plaintext, nonce, key);
  const out = new Uint8Array(nonce.length + box.length);
  out.set(nonce, 0);
  out.set(box, nonce.length);
  return out;
}

/** Decrypt nonce||ciphertext with a 32-byte key. Returns plaintext or null on failure. */
export function open(sealed: Uint8Array, key: Uint8Array): Uint8Array | null {
  if (key.length !== nacl.secretbox.keyLength) return null;
  // Truncated payload: nonce shorter than required, or no MAC after nonce.
  if (sealed.length < nacl.secretbox.nonceLength + nacl.secretbox.overheadLength) return null;
  const nonce = sealed.slice(0, nacl.secretbox.nonceLength);
  const box = sealed.slice(nacl.secretbox.nonceLength);
  try {
    return nacl.secretbox.open(box, nonce, key);
  } catch {
    return null;
  }
}
