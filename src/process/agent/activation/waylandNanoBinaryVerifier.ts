import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { chmod, lstat, mkdir, open, realpath, stat, unlink, type FileHandle } from 'node:fs/promises';
import path from 'node:path';

import { enforceOwnerOnlyPath } from './waylandNanoBindingStore';

export type WaylandNanoBinaryExpectation = Readonly<{
  canonicalPath: string;
  sha256: string;
  size: number;
  sourceCommitSha: string;
  cargoLockSha256: string;
  stagingRoot: string;
}>;

type FileIdentity = Readonly<{ dev: bigint; ino: bigint; size: bigint; mtimeNs: bigint; nlink: bigint }>;
const VERIFIED_BINARY_CONSTRUCTOR = Symbol('verified-wayland-nano-binary');

/** One-use proof held until the synchronous launcher call. */
export class VerifiedWaylandNanoBinary {
  readonly canonicalPath: string;
  readonly sha256: string;
  readonly sourceCommitSha: string;
  readonly cargoLockSha256: string;
  readonly #handle: FileHandle;
  readonly #identity: FileIdentity;
  #consumed = false;
  #cleaned = false;

  constructor(
    constructorToken: symbol,
    expectation: WaylandNanoBinaryExpectation,
    stagedPath: string,
    handle: FileHandle,
    identity: FileIdentity
  ) {
    if (constructorToken !== VERIFIED_BINARY_CONSTRUCTOR) throw new Error('Wayland Nano binary token is untrusted');
    this.canonicalPath = stagedPath;
    this.sha256 = expectation.sha256;
    this.sourceCommitSha = expectation.sourceCommitSha;
    this.cargoLockSha256 = expectation.cargoLockSha256;
    for (const key of ['canonicalPath', 'sha256', 'sourceCommitSha', 'cargoLockSha256'] as const) {
      Object.defineProperty(this, key, { configurable: false, writable: false });
    }
    this.#handle = handle;
    this.#identity = identity;
    Object.freeze(this);
  }

  /** Revalidates the pathname and invokes exactly one immediate synchronous spawn callback. */
  async consume<T>(launch: (canonicalPath: string) => T): Promise<T> {
    if (this.#consumed) throw new Error('Wayland Nano binary identity token is stale');
    this.#consumed = true;
    try {
      const [held, current] = await Promise.all([
        this.#handle.stat({ bigint: true }),
        stat(this.canonicalPath, { bigint: true }),
      ]);
      const digest = await hashHandle(this.#handle);
      const [heldAfterHash, currentAfterHash] = await Promise.all([
        this.#handle.stat({ bigint: true }),
        stat(this.canonicalPath, { bigint: true }),
      ]);
      if (
        !held.isFile() ||
        !current.isFile() ||
        held.nlink !== BigInt(1) ||
        current.nlink !== BigInt(1) ||
        !sameIdentity(identityOf(held), this.#identity) ||
        !sameIdentity(identityOf(current), this.#identity) ||
        !sameIdentity(identityOf(heldAfterHash), this.#identity) ||
        !sameIdentity(identityOf(currentAfterHash), this.#identity) ||
        digest !== this.sha256
      ) {
        throw new Error('Wayland Nano binary changed after verification');
      }
      const result = launch(this.canonicalPath);
      if (typeof result === 'object' && result !== null && 'then' in result) {
        throw new Error('Wayland Nano launcher callback must be synchronous');
      }
      return result;
    } finally {
      await this.#handle.close();
    }
  }

  async dispose(): Promise<void> {
    if (!this.#consumed) {
      this.#consumed = true;
      await this.#handle.close();
    }
    await this.cleanupAfterLaunch();
  }

  /** The activation owner may reclaim unused tokens, never a launcher's live stage. */
  async disposeIfUnconsumed(): Promise<void> {
    if (!this.#consumed) await this.dispose();
  }

  /** Launch owners call this only after the child exits or fails to spawn. */
  async cleanupAfterLaunch(): Promise<void> {
    if (!this.#consumed) throw new Error('Wayland Nano staged executable cannot be cleaned before launch');
    if (this.#cleaned) return;
    await unlinkStagedExecutable(this.canonicalPath);
    this.#cleaned = true;
  }
}

async function unlinkStagedExecutable(target: string): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      // Security cleanup retries are intentionally ordered and bounded.
      // oxlint-disable-next-line eslint(no-await-in-loop)
      await unlink(target);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return;
      if (process.platform !== 'win32' || !['EBUSY', 'EPERM'].includes(code ?? '') || attempt >= 9) throw error;
      // oxlint-disable-next-line eslint(no-await-in-loop)
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
}

export async function verifyWaylandNanoBinary(
  expectation: WaylandNanoBinaryExpectation
): Promise<VerifiedWaylandNanoBinary> {
  validateExpectation(expectation);
  const resolved = path.resolve(expectation.canonicalPath);
  if (!path.isAbsolute(expectation.canonicalPath) || !samePath(resolved, expectation.canonicalPath)) {
    throw new Error('Wayland Nano binary path must be canonical and absolute');
  }
  const linkMetadata = await lstat(expectation.canonicalPath);
  if (!linkMetadata.isFile() || linkMetadata.isSymbolicLink()) {
    throw new Error('Wayland Nano binary path is not a regular non-link file');
  }
  const canonical = await realpath(expectation.canonicalPath);
  if (!samePath(canonical, expectation.canonicalPath)) {
    throw new Error('Wayland Nano binary aliases are forbidden');
  }
  const handle = await open(canonical, constants.O_RDONLY);
  try {
    const metadata = await handle.stat({ bigint: true });
    if (!metadata.isFile() || metadata.nlink !== BigInt(1) || metadata.size !== BigInt(expectation.size)) {
      throw new Error('Wayland Nano binary size does not match the immutable artifact');
    }
    const digest = await hashHandle(handle);
    if (digest !== expectation.sha256)
      throw new Error('Wayland Nano binary digest does not match the immutable artifact');
    const after = await stat(canonical, { bigint: true });
    const identity = identityOf(metadata);
    if (!sameIdentity(identity, identityOf(after))) throw new Error('Wayland Nano binary changed during verification');
    const staged = await stageVerifiedExecutable(handle, expectation);
    await handle.close();
    return new VerifiedWaylandNanoBinary(
      VERIFIED_BINARY_CONSTRUCTOR,
      expectation,
      staged.path,
      staged.handle,
      staged.identity
    );
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function stageVerifiedExecutable(
  source: FileHandle,
  expectation: WaylandNanoBinaryExpectation
): Promise<Readonly<{ path: string; handle: FileHandle; identity: FileIdentity }>> {
  const root = await realpath(expectation.stagingRoot);
  const rootMetadata = await lstat(root);
  if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) {
    throw new Error('Wayland Nano staging root is unsafe');
  }
  const directory = path.join(root, 'wayland-nano-verified');
  let created = false;
  await mkdir(directory, { recursive: false, mode: 0o700 })
    .then(() => {
      created = true;
    })
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EEXIST') throw error;
    });
  const directoryMetadata = await lstat(directory);
  if (
    !directoryMetadata.isDirectory() ||
    directoryMetadata.isSymbolicLink() ||
    (process.platform !== 'win32' && (directoryMetadata.mode & 0o077) !== 0) ||
    path.dirname(await realpath(directory)) !== root
  ) {
    throw new Error('Wayland Nano staging directory is unsafe');
  }
  await enforceOwnerOnlyPath(directory, 'directory', 'full', !created);
  const extension = process.platform === 'win32' ? '.exe' : '';
  const stagedPath = path.join(directory, `${expectation.sha256}-${randomUUID()}${extension}`);
  const writer = await open(stagedPath, 'wx', 0o700);
  try {
    const digest = createHash('sha256');
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let position = 0;
    while (true) {
      // Security-sensitive copy must preserve a single held source identity in order.
      // oxlint-disable-next-line eslint(no-await-in-loop)
      const { bytesRead } = await source.read(buffer, 0, buffer.length, position);
      if (bytesRead === 0) break;
      const chunk = buffer.subarray(0, bytesRead);
      digest.update(chunk);
      // oxlint-disable-next-line eslint(no-await-in-loop)
      await writer.write(chunk, 0, chunk.length, position);
      position += bytesRead;
    }
    await writer.sync();
    if (position !== expectation.size || digest.digest('hex') !== expectation.sha256) {
      throw new Error('Wayland Nano source changed while staging');
    }
  } finally {
    await writer.close();
  }
  if (process.platform !== 'win32') await chmod(stagedPath, 0o500);
  await enforceOwnerOnlyPath(stagedPath, 'file', 'read-execute-delete');
  const held = await open(stagedPath, constants.O_RDONLY);
  try {
    const metadata = await held.stat({ bigint: true });
    const digest = await hashHandle(held);
    if (
      !metadata.isFile() ||
      metadata.nlink !== BigInt(1) ||
      metadata.size !== BigInt(expectation.size) ||
      digest !== expectation.sha256
    ) {
      throw new Error('Wayland Nano staged executable identity is invalid');
    }
    const current = await stat(stagedPath, { bigint: true });
    const identity = identityOf(metadata);
    if (!sameIdentity(identity, identityOf(current))) throw new Error('Wayland Nano staged executable changed');
    return Object.freeze({ path: stagedPath, handle: held, identity });
  } catch (error) {
    await held.close();
    throw error;
  }
}

async function hashHandle(handle: FileHandle): Promise<string> {
  const hash = createHash('sha256');
  const stream = handle.createReadStream({ autoClose: false, start: 0 });
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer | string) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function identityOf(metadata: {
  dev: bigint;
  ino: bigint;
  size: bigint;
  mtimeNs: bigint;
  nlink: bigint;
}): FileIdentity {
  return Object.freeze({
    dev: metadata.dev,
    ino: metadata.ino,
    size: metadata.size,
    mtimeNs: metadata.mtimeNs,
    nlink: metadata.nlink,
  });
}

function sameIdentity(left: FileIdentity, right: FileIdentity): boolean {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.nlink === right.nlink
  );
}

function samePath(left: string, right: string): boolean {
  return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right;
}

function validateExpectation(value: WaylandNanoBinaryExpectation): void {
  if (
    !Number.isSafeInteger(value.size) ||
    value.size <= 0 ||
    !/^[0-9a-f]{64}$/.test(value.sha256) ||
    !/^[0-9a-f]{40}$/.test(value.sourceCommitSha) ||
    !/^[0-9a-f]{64}$/.test(value.cargoLockSha256) ||
    typeof value.stagingRoot !== 'string' ||
    value.stagingRoot.length === 0 ||
    value.stagingRoot.includes('\0')
  ) {
    throw new Error('Wayland Nano binary expectation is invalid');
  }
}
