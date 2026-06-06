/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

/**
 * WeCom AI Bot / callback crypto (AES-256-CBC + SHA1 signature).
 * Matches Enterprise WeChat encrypted callback specification.
 *
 * Spec reference: https://developer.work.weixin.qq.com/document/path/90968
 */
export function sha1Sign(token: string, timestamp: string, nonce: string, encrypted: string): string {
  // Explicit ascending lexicographic comparator to (a) avoid relying on
  // Array.prototype.toSorted (Node 20+) and (b) make the ordering
  // unambiguous for non-ASCII operator tokens. Per WeCom spec all four
  // inputs are sorted ascending then concatenated and SHA1-hashed.
  const sorted = [token, String(timestamp), String(nonce), encrypted].slice().sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
  return crypto.createHash('sha1').update(sorted.join('')).digest('hex');
}

/**
 * Constant-time WeCom callback signature verification. Computes the expected
 * SHA1 signature and compares it against the provided one using
 * `crypto.timingSafeEqual` so the comparison does not leak how many leading
 * characters matched via a timing side-channel (a plain `===` short-circuits
 * on the first differing byte). Inputs are normalized to equal-length UTF-8
 * buffers before comparison - `timingSafeEqual` throws on length mismatch, and
 * a length mismatch alone (the expected SHA1 hex is always 40 chars) is enough
 * to reject without ever touching the constant-time path.
 */
export function verifySignature(
  token: string,
  timestamp: string,
  nonce: string,
  encrypted: string,
  signature: string
): boolean {
  const expected = Buffer.from(sha1Sign(token, timestamp, nonce, encrypted), 'utf8');
  const provided = Buffer.from(signature, 'utf8');
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}

function decodePkcs7(buffer: Buffer): Buffer {
  const pad = buffer[buffer.length - 1];
  if (pad < 1 || pad > 32) {
    throw new Error('Invalid PKCS7 padding');
  }
  return buffer.subarray(0, buffer.length - pad);
}

function encodePkcs7(buffer: Buffer): Buffer {
  const blockSize = 32;
  const padLen = blockSize - (buffer.length % blockSize || blockSize);
  const pad = Buffer.alloc(padLen, padLen);
  return Buffer.concat([buffer, pad]);
}

export type DecryptedPayload = {
  /** The JSON / XML payload string the server sent. */
  message: string;
  /** The trailing receiveid bytes (CorpID or AgentID) decoded as UTF-8. */
  receiveId: string;
};

/**
 * Decrypts a WeCom callback encrypted body. The plaintext layout is
 * `random(16) | msg_len(4 BE) | msg | receiveid`. We return both the message
 * AND the receiveid so the caller can enforce the CorpID match WeCom requires
 * to prevent cross-tenant replay (CRIT-2 audit fix 2026-05-18).
 */
export function decryptPayloadFull(encodingAesKey: string, encrypted: string): DecryptedPayload {
  // All failure modes (cipher error, bad padding, short buffer) collapse into a
  // single generic error so an attacker probing attacker-supplied ciphertext
  // cannot distinguish a padding failure from any other decryption failure -
  // closing the AES-CBC padding-oracle side-channel.
  try {
    const aesKey = Buffer.from(`${encodingAesKey}=`, 'base64');
    const iv = aesKey.subarray(0, 16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    decipher.setAutoPadding(false);
    const decrypted = Buffer.concat([decipher.update(encrypted, 'base64'), decipher.final()]);
    const raw = decodePkcs7(decrypted);
    const body = raw.subarray(16);
    const len = body.subarray(0, 4).readUInt32BE(0);
    const message = body.subarray(4, 4 + len).toString('utf8');
    const receiveId = body.subarray(4 + len).toString('utf8');
    return { message, receiveId };
  } catch {
    throw new Error('WeCom: decryption failed');
  }
}

/**
 * Legacy entry point - returns just the message string. New code should
 * prefer {@link decryptPayloadFull} and verify the receiveid.
 */
export function decryptPayload(encodingAesKey: string, encrypted: string): string {
  return decryptPayloadFull(encodingAesKey, encrypted).message;
}

export function encryptPayload(encodingAesKey: string, plainText: string, receiveId = ''): string {
  const aesKey = Buffer.from(`${encodingAesKey}=`, 'base64');
  const iv = aesKey.subarray(0, 16);
  const random16 = crypto.randomBytes(16);
  const message = Buffer.from(plainText);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(message.length, 0);
  const receiveIdBuf = Buffer.from(receiveId, 'utf8');
  const encoded = encodePkcs7(Buffer.concat([random16, len, message, receiveIdBuf]));
  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(encoded), cipher.final()]).toString('base64');
}
