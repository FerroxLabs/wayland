/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { open, unlink } from 'node:fs/promises';

const FORMAT_VERSION = 1;
const CIPHER = 'electron-safe-storage';
const MAX_PLAINTEXT_BYTES = 32 * 1024 * 1024;
const MAX_ENVELOPE_BYTES = 64 * 1024 * 1024;

type SafeStorageBackend = {
  isEncryptionAvailable: () => boolean;
  encryptString: (plaintext: string) => Buffer;
  decryptString: (ciphertext: Buffer) => string;
};

type RecoveryEnvelope = {
  formatVersion: 1;
  cipher: typeof CIPHER;
  plaintextEncoding: 'base64';
  plaintextSize: number;
  plaintextSha256: string;
  ciphertext: string;
};

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function requireBackend(backend: SafeStorageBackend): void {
  if (!backend.isEncryptionAvailable()) {
    throw new Error('Recovery sealing requires an available OS credential store; plaintext fallback is forbidden.');
  }
}

function decodeCanonicalBase64(value: string, label: string): Buffer {
  if (value.length === 0 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error(`${label} is not canonical base64.`);
  }
  const decoded = Buffer.from(value, 'base64');
  if (decoded.toString('base64') !== value) throw new Error(`${label} is not canonical base64.`);
  return decoded;
}

function parseEnvelope(value: unknown): RecoveryEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Recovery envelope must be an object.');
  }
  const envelope = value as Record<string, unknown>;
  if (
    envelope.formatVersion !== FORMAT_VERSION ||
    envelope.cipher !== CIPHER ||
    envelope.plaintextEncoding !== 'base64' ||
    !Number.isSafeInteger(envelope.plaintextSize) ||
    (envelope.plaintextSize as number) < 0 ||
    (envelope.plaintextSize as number) > MAX_PLAINTEXT_BYTES ||
    typeof envelope.plaintextSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(envelope.plaintextSha256) ||
    typeof envelope.ciphertext !== 'string'
  ) {
    throw new Error('Recovery envelope is malformed or unsupported.');
  }
  return envelope as unknown as RecoveryEnvelope;
}

async function readRegularFileNoFollow(filePath: string, maximumBytes: number, label: string): Promise<Buffer> {
  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  const handle = await open(filePath, constants.O_RDONLY | noFollow);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > maximumBytes) {
      throw new Error(`${label} must be a regular file no larger than ${maximumBytes} bytes.`);
    }
    const contents = await handle.readFile();
    if (contents.length !== stat.size) throw new Error(`${label} changed while it was read.`);
    return contents;
  } finally {
    await handle.close();
  }
}

async function writeExclusive(filePath: string, contents: Buffer): Promise<void> {
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(filePath, 'wx', 0o600);
    await handle.writeFile(contents);
    await handle.sync();
  } catch (error) {
    await unlink(filePath).catch((): undefined => undefined);
    throw error;
  } finally {
    await handle?.close();
  }
}

/** Build seal/unseal operations around one injected authenticated OS credential backend. */
export function createRecoveryFileSealer(backend: SafeStorageBackend): {
  sealFile: (sourcePath: string, destinationPath: string) => Promise<void>;
  unsealFile: (sourcePath: string, destinationPath: string) => Promise<void>;
} {
  return {
    async sealFile(sourcePath, destinationPath) {
      requireBackend(backend);
      const plaintext = await readRegularFileNoFollow(sourcePath, MAX_PLAINTEXT_BYTES, 'Recovery plaintext');
      const envelope: RecoveryEnvelope = {
        formatVersion: FORMAT_VERSION,
        cipher: CIPHER,
        plaintextEncoding: 'base64',
        plaintextSize: plaintext.length,
        plaintextSha256: sha256(plaintext),
        ciphertext: backend.encryptString(plaintext.toString('base64')).toString('base64'),
      };
      const serialized = Buffer.from(JSON.stringify(envelope), 'utf8');
      if (serialized.length > MAX_ENVELOPE_BYTES) throw new Error('Recovery envelope exceeds its size limit.');
      await writeExclusive(destinationPath, serialized);
    },

    async unsealFile(sourcePath, destinationPath) {
      requireBackend(backend);
      const serialized = await readRegularFileNoFollow(sourcePath, MAX_ENVELOPE_BYTES, 'Recovery envelope');
      let parsed: unknown;
      try {
        parsed = JSON.parse(serialized.toString('utf8')) as unknown;
      } catch (error) {
        throw new Error('Recovery envelope is not valid JSON.', { cause: error });
      }
      const envelope = parseEnvelope(parsed);
      const ciphertext = decodeCanonicalBase64(envelope.ciphertext, 'Recovery ciphertext');
      const plaintextBase64 = backend.decryptString(ciphertext);
      const plaintext = envelope.plaintextSize === 0 && plaintextBase64 === ''
        ? Buffer.alloc(0)
        : decodeCanonicalBase64(plaintextBase64, 'Recovery plaintext');
      if (plaintext.length !== envelope.plaintextSize || sha256(plaintext) !== envelope.plaintextSha256) {
        throw new Error('Recovery plaintext failed its size or digest check.');
      }
      await writeExclusive(destinationPath, plaintext);
    },
  };
}

async function productionSealer(): Promise<ReturnType<typeof createRecoveryFileSealer>> {
  // Keep Electron out of Bun/Node contract tests and out of verifier-only
  // startup. This import runs only for an explicit capture/materialize action.
  const { safeStorage } = await import('electron');
  return createRecoveryFileSealer(safeStorage);
}

export async function sealRecoveryFile(sourcePath: string, destinationPath: string): Promise<void> {
  return (await productionSealer()).sealFile(sourcePath, destinationPath);
}

export async function unsealRecoveryFile(sourcePath: string, destinationPath: string): Promise<void> {
  return (await productionSealer()).unsealFile(sourcePath, destinationPath);
}
