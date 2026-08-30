import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, realpath, stat, type FileHandle } from 'node:fs/promises';
import path from 'node:path';

export type WaylandNanoBinaryExpectation = Readonly<{
  canonicalPath: string;
  sha256: string;
  size: number;
  sourceCommitSha: string;
  cargoLockSha256: string;
}>;

type FileIdentity = Readonly<{ dev: bigint; ino: bigint; size: bigint; mtimeNs: bigint }>;
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

  constructor(
    constructorToken: symbol,
    expectation: WaylandNanoBinaryExpectation,
    handle: FileHandle,
    identity: FileIdentity
  ) {
    if (constructorToken !== VERIFIED_BINARY_CONSTRUCTOR) throw new Error('Wayland Nano binary token is untrusted');
    this.canonicalPath = expectation.canonicalPath;
    this.sha256 = expectation.sha256;
    this.sourceCommitSha = expectation.sourceCommitSha;
    this.cargoLockSha256 = expectation.cargoLockSha256;
    this.#handle = handle;
    this.#identity = identity;
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
      if (!sameIdentity(identityOf(held), this.#identity) || !sameIdentity(identityOf(current), this.#identity)) {
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
    if (this.#consumed) return;
    this.#consumed = true;
    await this.#handle.close();
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
    return new VerifiedWaylandNanoBinary(VERIFIED_BINARY_CONSTRUCTOR, expectation, handle, identity);
  } catch (error) {
    await handle.close();
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

function identityOf(metadata: { dev: bigint; ino: bigint; size: bigint; mtimeNs: bigint }): FileIdentity {
  return Object.freeze({ dev: metadata.dev, ino: metadata.ino, size: metadata.size, mtimeNs: metadata.mtimeNs });
}

function sameIdentity(left: FileIdentity, right: FileIdentity): boolean {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size && left.mtimeNs === right.mtimeNs;
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
    !/^[0-9a-f]{64}$/.test(value.cargoLockSha256)
  ) {
    throw new Error('Wayland Nano binary expectation is invalid');
  }
}
