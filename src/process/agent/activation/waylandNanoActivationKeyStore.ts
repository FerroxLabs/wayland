import { createPrivateKey, generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { constants } from 'node:fs';
import { chmod, lstat, mkdir, open, realpath, rename } from 'node:fs/promises';
import path from 'node:path';

import type { WaylandNanoSigner } from './types';
import { enforceOwnerOnlyPath } from './waylandNanoBindingStore';

const KEY_REF_PREFIX = 'wayland-nano-key:v1:';
const CIPHER_PREFIX = 'enc:v1:';
const STORE_FILE = 'activation-keys.json';
const MAX_PKCS8_BYTES = 512;

export type WaylandNanoSafeStorage = Readonly<{
  isEncryptionAvailable(): boolean;
  getSelectedStorageBackend?(): 'basic_text' | 'gnome_libsecret' | 'kwallet' | 'kwallet5' | 'kwallet6' | 'unknown';
  encryptString(value: string): Buffer;
  decryptString(value: Buffer): string;
}>;

type KeyDocument = Readonly<{
  schema: 'wayland.nano.activation-keys/v1';
  keys: Readonly<Record<string, Readonly<{ keyId: string; ciphertext: string; publicKey: string }>>>;
}>;

export class WaylandNanoActivationKeyStore {
  readonly #userDataRoot: string;
  readonly #safeStorage: WaylandNanoSafeStorage;
  readonly #platform: NodeJS.Platform;

  constructor(userDataRoot: string, safeStorage: WaylandNanoSafeStorage, platform: NodeJS.Platform = process.platform) {
    if (!userDataRoot || userDataRoot.includes('\0')) throw new Error('Wayland Nano key root is invalid');
    this.#userDataRoot = userDataRoot;
    this.#safeStorage = safeStorage;
    this.#platform = platform;
  }

  async create(keyId: string): Promise<Readonly<{ keyRef: string; publicKey: string }>> {
    assertIssuerId(keyId);
    this.assertCustody();
    const document = await this.readDocument();
    const keyRef = `${KEY_REF_PREFIX}${randomUUID().replaceAll('-', '_')}`;
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    const pkcs8 = Buffer.from(privateKey.export({ type: 'pkcs8', format: 'der' }));
    let wrapped: Buffer | undefined;
    try {
      wrapped = this.#safeStorage.encryptString(pkcs8.toString('base64url'));
      if (!(wrapped instanceof Buffer) || wrapped.byteLength === 0)
        throw new Error('OS credential store returned invalid ciphertext');
      const publicDer = Buffer.from(publicKey.export({ type: 'spki', format: 'der' }));
      const publicKeyRaw = publicDer.subarray(publicDer.length - 32).toString('base64url');
      await this.writeDocument({
        schema: 'wayland.nano.activation-keys/v1',
        keys: {
          ...document.keys,
          [keyRef]: Object.freeze({
            keyId,
            ciphertext: `${CIPHER_PREFIX}${wrapped.toString('base64url')}`,
            publicKey: publicKeyRaw,
          }),
        },
      });
      return Object.freeze({ keyRef, publicKey: publicKeyRaw });
    } finally {
      pkcs8.fill(0);
      wrapped?.fill(0);
    }
  }

  async has(keyRef: string): Promise<boolean> {
    if (!keyRef.startsWith(KEY_REF_PREFIX)) return false;
    try {
      this.assertCustody();
      return Boolean((await this.readDocument()).keys[keyRef]);
    } catch {
      return false;
    }
  }

  async signer(keyRef: string): Promise<WaylandNanoSigner> {
    this.assertCustody();
    const entry = (await this.readDocument()).keys[keyRef];
    if (!entry || !entry.ciphertext.startsWith(CIPHER_PREFIX)) {
      throw new Error('Wayland Nano issuer key is unavailable');
    }
    return Object.freeze({
      keyId: entry.keyId,
      sign: async (message: Uint8Array): Promise<Uint8Array> => this.signWithEntry(entry.ciphertext, message),
    });
  }

  private signWithEntry(ciphertext: string, message: Uint8Array): Uint8Array {
    this.assertCustody();
    const encoded = ciphertext.slice(CIPHER_PREFIX.length);
    if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Wayland Nano issuer ciphertext is invalid');
    const wrapped = Buffer.from(encoded, 'base64url');
    let pkcs8: Buffer | undefined;
    try {
      const plaintext = this.#safeStorage.decryptString(wrapped);
      if (!/^[A-Za-z0-9_-]+$/.test(plaintext)) throw new Error('OS credential store returned invalid issuer key');
      pkcs8 = Buffer.from(plaintext, 'base64url');
      if (pkcs8.byteLength === 0 || pkcs8.byteLength > MAX_PKCS8_BYTES || pkcs8.toString('base64url') !== plaintext) {
        throw new Error('OS credential store returned invalid issuer key');
      }
      return sign(null, Buffer.from(message), createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' }));
    } finally {
      wrapped.fill(0);
      pkcs8?.fill(0);
    }
  }

  private assertCustody(): void {
    if (!this.#safeStorage?.isEncryptionAvailable())
      throw new Error('Wayland Nano issuer requires an OS credential store');
    if (this.#platform === 'linux') {
      const backend = this.#safeStorage.getSelectedStorageBackend?.();
      if (!backend || !['gnome_libsecret', 'kwallet', 'kwallet5', 'kwallet6'].includes(backend)) {
        throw new Error('Wayland Nano issuer rejects the selected Linux credential backend');
      }
    }
  }

  private async readDocument(): Promise<KeyDocument> {
    const file = await this.storePath(false);
    if (!file) return Object.freeze({ schema: 'wayland.nano.activation-keys/v1', keys: Object.freeze({}) });
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readPrivateFile(file, this.#platform));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return Object.freeze({ schema: 'wayland.nano.activation-keys/v1', keys: Object.freeze({}) });
      }
      throw new Error('Wayland Nano issuer key store is unreadable', { cause: error });
    }
    if (!isRecord(parsed) || parsed.schema !== 'wayland.nano.activation-keys/v1' || !isRecord(parsed.keys)) {
      throw new Error('Wayland Nano issuer key store is invalid');
    }
    const keys: Record<string, { keyId: string; ciphertext: string; publicKey: string }> = {};
    for (const [keyRef, candidate] of Object.entries(parsed.keys)) {
      if (
        !keyRef.startsWith(KEY_REF_PREFIX) ||
        !isRecord(candidate) ||
        typeof candidate.keyId !== 'string' ||
        typeof candidate.ciphertext !== 'string' ||
        !candidate.ciphertext.startsWith(CIPHER_PREFIX) ||
        typeof candidate.publicKey !== 'string'
      ) {
        throw new Error('Wayland Nano issuer key entry is invalid');
      }
      assertIssuerId(candidate.keyId);
      keys[keyRef] = { keyId: candidate.keyId, ciphertext: candidate.ciphertext, publicKey: candidate.publicKey };
    }
    return Object.freeze({ schema: 'wayland.nano.activation-keys/v1', keys: Object.freeze(keys) });
  }

  private async writeDocument(document: KeyDocument): Promise<void> {
    const target = await this.storePath(true);
    if (!target) throw new Error('Wayland Nano issuer key store is unavailable');
    const temp = `${target}.${process.pid}.${randomUUID()}.tmp`;
    const handle = await open(temp, 'wx', 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(document)}\n`, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    await chmod(temp, 0o600);
    await enforceOwnerOnlyPath(temp, 'file', 'full');
    await rename(temp, target);
    await chmod(target, 0o600);
    await enforceOwnerOnlyPath(target, 'file', 'full');
  }

  private async storePath(create: boolean): Promise<string | null> {
    const root = await realpath(this.#userDataRoot);
    const directory = path.join(root, 'wayland-nano');
    let created = false;
    if (create) {
      await mkdir(directory, { recursive: false, mode: 0o700 })
        .then(() => {
          created = true;
        })
        .catch(handleExists);
    }
    try {
      const metadata = await lstat(directory);
      if (
        !metadata.isDirectory() ||
        metadata.isSymbolicLink() ||
        (this.#platform !== 'win32' && (metadata.mode & 0o077) !== 0)
      ) {
        throw new Error('Wayland Nano issuer key directory is unsafe');
      }
    } catch (error) {
      if (!create && (error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
    const canonicalDirectory = await realpath(directory);
    if (path.dirname(canonicalDirectory) !== root)
      throw new Error('Wayland Nano issuer key directory escaped userData');
    await enforceOwnerOnlyPath(canonicalDirectory, 'directory', 'full', !created);
    return path.join(canonicalDirectory, STORE_FILE);
  }
}

function assertIssuerId(value: string): void {
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(value)) throw new Error('Wayland Nano issuer key id is invalid');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function handleExists(error: unknown): void {
  if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
}

async function readPrivateFile(file: string, platform: NodeJS.Platform): Promise<string> {
  const before = await lstat(file);
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    (platform !== 'win32' && (before.mode & 0o077) !== 0) ||
    path.dirname(await realpath(file)) !== path.dirname(file)
  ) {
    throw new Error('Wayland Nano issuer key file is unsafe');
  }
  await enforceOwnerOnlyPath(file, 'file', 'full', true);
  const handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const after = await handle.stat();
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size) {
      throw new Error('Wayland Nano issuer key file changed while opening');
    }
    return handle.readFile('utf8');
  } finally {
    await handle.close();
  }
}
