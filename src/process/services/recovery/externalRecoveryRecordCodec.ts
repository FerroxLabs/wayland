/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { constants } from 'node:fs';
import { lstat, open, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import type { ClassicAuthorityEnvelopeCodec } from './classicConstitutionPromotion';
import {
  withExternalRecoveryAuthorityKey,
  type ExternalRecoveryAuthorityOptions,
  type ExternalRecoveryVaultBackend,
} from './externalRecoveryAuthority';
import {
  openExternalRecoveryRecord,
  parseCanonicalRecoveryJson,
  RecoveryTupleRegistry,
  sealExternalRecoveryRecord,
} from './externalRecoveryCrypto';
import { syncDirectory as syncDirectoryDurably } from '@process/utils/durabilitySync';

const MAX_RECORD_BYTES = 64 * 1024 * 1024;
const KEY_ID_PATTERN = /^rk1:[A-Za-z0-9_-]{43}$/;
const SHA256_FILE = '[a-f0-9]{64}\\.sealed';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

type RecordIdentity = Readonly<{
  recordContract: string;
  domain: string;
  recordId: string;
}>;

export type ExternalRecoveryRecordCodecOptions = Readonly<{
  authorityUserDataRoot: string;
  vault: ExternalRecoveryVaultBackend;
  /** Exact Classic authority root for one preparation, never the live Desktop userData root. */
  recordRoot: string;
  /** Parent containing every retained preparation root that shares this recovery authority. */
  inventoryRoot?: string;
  /** Shared across locator and preparation records so tuple reuse is detected across the complete registry. */
  tupleRegistry?: RecoveryTupleRegistry;
  now?: () => Date;
}>;

export type ExternalRecoveryRecordInventoryOptions = Readonly<{
  authorityUserDataRoot: string;
  vault: ExternalRecoveryVaultBackend;
  inventoryRoot: string;
  tupleRegistry: RecoveryTupleRegistry;
}>;

function codeUnitCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function canonicalRelative(root: string, candidate: string): string {
  const relative = path.relative(root, path.resolve(candidate));
  if (relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Classic external recovery record path escapes its authority root.');
  }
  return relative.split(path.sep).join('/');
}

function classifyRecord(recordRoot: string, namespace: string, candidate: string): RecordIdentity {
  const relative = canonicalRelative(recordRoot, candidate);
  let recordContract: string;
  let domain: string;
  let logicalRelative = relative;
  if (relative === 'projection-authority.sealed') {
    recordContract = 'wayland-constitution-classic-projection-authority/1.0';
    domain = 'wayland.classic-recovery.projection-authority/1.0';
  } else if (new RegExp(`^promotions/${UUID}/\\d{6}-${SHA256_FILE}$`, 'i').test(relative)) {
    recordContract = 'wayland-constitution-classic-promotion/1.0';
    domain = 'wayland.classic-recovery.promotion-journal-event/1.0';
  } else if (new RegExp(`^promotions/${UUID}/(?:HEAD|\\.HEAD\\.${UUID})\\.sealed$`, 'i').test(relative)) {
    recordContract = 'wayland-constitution-classic-promotion-head/1.0';
    domain = 'wayland.classic-recovery.promotion-journal-head/1.0';
    logicalRelative = relative.replace(/\/\.HEAD\.[^.]+\.sealed$/i, '/HEAD.sealed');
  } else if (new RegExp(`^promotions/${UUID}/\\.claim-(?:genesis|[a-f0-9]{64})\\.sealed$`, 'i').test(relative)) {
    recordContract = 'wayland-constitution-classic-promotion-claim/1.0';
    domain = 'wayland.classic-recovery.promotion-journal-claim/1.0';
  } else if (new RegExp(`^rescue/${SHA256_FILE}$`).test(relative)) {
    recordContract = 'wayland-constitution-classic-rescue/1.0';
    domain = 'wayland.classic-recovery.rescue/1.0';
  } else if (new RegExp(`^promotions/${UUID}/reconciliation/${SHA256_FILE}$`, 'i').test(relative)) {
    recordContract = 'wayland-constitution-classic-reconciliation/1.0';
    domain = 'wayland.classic-recovery.reconciliation/1.0';
  } else {
    throw new Error(`Unsupported Classic external recovery record identity: ${relative}`);
  }
  return {
    recordContract,
    domain,
    recordId: `classic-recovery/${namespace}/${logicalRelative}`,
  };
}

async function readRegularNoFollow(filePath: string): Promise<Buffer> {
  const pathStat = await lstat(filePath);
  if (pathStat.isSymbolicLink() || !pathStat.isFile() || pathStat.size > MAX_RECORD_BYTES) {
    throw new Error(`Classic external recovery record is unsafe or oversized: ${filePath}`);
  }
  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  const handle = await open(filePath, constants.O_RDONLY | noFollow);
  try {
    const before = await handle.stat();
    if (
      !before.isFile() ||
      before.size > MAX_RECORD_BYTES ||
      before.dev !== pathStat.dev ||
      before.ino !== pathStat.ino
    ) {
      throw new Error(`Classic external recovery record is unsafe or oversized: ${filePath}`);
    }
    const bytes = await handle.readFile();
    const after = await handle.stat();
    if (
      bytes.length !== before.size ||
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size
    ) {
      throw new Error(`Classic external recovery record changed during read: ${filePath}`);
    }
    return bytes;
  } finally {
    await handle.close();
  }
}

/**
 * Commit the directory entry a rename/link created.
 *
 * Delegates to the shared platform rule. The previous local copy opened
 * `path.join(directory, '.')` on Windows, which fails with EPERM exactly like
 * the plain directory does, so this flow threw there instead of degrading.
 */
async function syncDirectory(directory: string): Promise<void> {
  await syncDirectoryDurably(directory);
}

async function writeExclusiveDurable(filePath: string, bytes: Uint8Array): Promise<void> {
  const requestedDirectory = path.dirname(path.resolve(filePath));
  const directory = await realpath(requestedDirectory);
  const canonicalFilePath = path.join(directory, path.basename(filePath));
  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  const handle = await open(
    canonicalFilePath,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow,
    0o600
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(directory);
}

function envelopeKeyId(bytes: Buffer): string {
  const record = exactRecord(parseCanonicalRecoveryJson(bytes), 'External recovery envelope');
  if (typeof record.keyId !== 'string' || !KEY_ID_PATTERN.test(record.keyId)) {
    throw new Error('External recovery envelope names a malformed key ID.');
  }
  return record.keyId;
}

function requirePlaintextContract(plaintext: Buffer, expected: string): void {
  const record = exactRecord(parseCanonicalRecoveryJson(plaintext), 'Classic external recovery plaintext');
  if (record.contract !== expected) {
    throw new Error('Classic external recovery plaintext contract does not match its path identity.');
  }
}

async function sealedRecords(root: string): Promise<string[]> {
  try {
    const rootStat = await lstat(root);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      throw new Error('Classic external recovery record root is not a real directory.');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const records: string[] = [];
  const visit = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => codeUnitCompare(left.name, right.name));
    for (const entry of entries) {
      const candidate = path.join(directory, entry.name);
      if (entry.isSymbolicLink())
        throw new Error(`Classic external recovery authority contains a symlink: ${candidate}`);
      if (entry.isDirectory()) {
        // Ordered traversal feeds one process-lifetime tuple registry deterministically.
        // oxlint-disable-next-line no-await-in-loop
        await visit(candidate);
      } else if (entry.isFile() && entry.name.endsWith('.sealed')) {
        records.push(candidate);
      }
    }
  };
  await visit(root);
  return records;
}

async function retainedRecordRoots(inventoryRoot: string): Promise<string[]> {
  const roots: string[] = [];
  try {
    const rootStat = await lstat(inventoryRoot);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      throw new Error('Classic external recovery inventory root is not a real directory.');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return roots;
    throw error;
  }
  const entries = await readdir(inventoryRoot, { withFileTypes: true });
  entries.sort((left, right) => codeUnitCompare(left.name, right.name));
  for (const entry of entries) {
    if (entry.isSymbolicLink() || !entry.isDirectory() || !/^[A-Za-z0-9._-]+$/.test(entry.name)) {
      throw new Error(`Classic external recovery inventory contains an unsafe entry: ${entry.name}`);
    }
    const candidate = path.join(inventoryRoot, entry.name);
    // Canonical validation is intentionally ordered before a later record is trusted.
    // oxlint-disable-next-line no-await-in-loop
    if ((await realpath(candidate)) !== candidate) {
      throw new Error('Classic external recovery preparation root is not canonical.');
    }
    roots.push(candidate);
  }
  return roots;
}

async function openInventoryEnvelope(
  options: ExternalRecoveryRecordInventoryOptions,
  sourcePath: string,
  expected: RecordIdentity
): Promise<Buffer> {
  const inventoryRoot = path.resolve(options.inventoryRoot);
  const envelope = await readRegularNoFollow(sourcePath);
  const keyId = envelopeKeyId(envelope);
  const authorityOptions: ExternalRecoveryAuthorityOptions = {
    userDataRoot: options.authorityUserDataRoot,
    vault: options.vault,
    existingRecordDigests: async () => [],
    classicTreeRoots: [inventoryRoot],
  };
  return withExternalRecoveryAuthorityKey(authorityOptions, { operation: 'open', keyId }, async ({ secret }) => {
    const opened = openExternalRecoveryRecord(envelope, secret, options.tupleRegistry);
    try {
      if (
        opened.recordContract !== expected.recordContract ||
        opened.domain !== expected.domain ||
        opened.recordId !== expected.recordId
      ) {
        throw new Error('Classic external recovery envelope AAD identity does not match its authority path.');
      }
      requirePlaintextContract(opened.plaintext, expected.recordContract);
      return opened.plaintext;
    } catch (error) {
      opened.plaintext.fill(0);
      throw error;
    }
  });
}

/** Authenticate every retained preparation in memory before sealing or exposing any recovery state. */
export async function authenticateExternalRecoveryRecordInventory(
  options: ExternalRecoveryRecordInventoryOptions
): Promise<void> {
  const inventoryRoot = path.resolve(options.inventoryRoot);
  for (const retainedRoot of await retainedRecordRoots(inventoryRoot)) {
    const retainedNamespace = path.basename(retainedRoot);
    // Root enumeration is ordered so tuple quarantine evidence is deterministic.
    // oxlint-disable-next-line no-await-in-loop
    for (const recordPath of await sealedRecords(retainedRoot)) {
      const identity = classifyRecord(retainedRoot, retainedNamespace, recordPath);
      // Ordered verification feeds one shared process-lifetime tuple registry without materializing plaintext.
      // oxlint-disable-next-line no-await-in-loop
      const plaintext = await openInventoryEnvelope(options, recordPath, identity);
      plaintext.fill(0);
    }
  }
}

export function createExternalRecoveryRecordCodec(
  options: ExternalRecoveryRecordCodecOptions
): ClassicAuthorityEnvelopeCodec {
  const recordRoot = path.resolve(options.recordRoot);
  const inventoryRoot = path.resolve(options.inventoryRoot ?? path.dirname(recordRoot));
  if (path.dirname(recordRoot) !== inventoryRoot) {
    throw new Error('Classic external recovery record root must be a direct child of its inventory root.');
  }
  const namespace = path.basename(recordRoot);
  if (!/^[A-Za-z0-9._-]+$/.test(namespace)) {
    throw new Error('Classic external recovery record namespace is unsafe.');
  }
  const tupleRegistry = options.tupleRegistry ?? new RecoveryTupleRegistry();
  const authorityOptions: ExternalRecoveryAuthorityOptions = {
    userDataRoot: options.authorityUserDataRoot,
    vault: options.vault,
    existingRecordDigests: async () => [],
    classicTreeRoots: [inventoryRoot],
  };

  const openEnvelope = async (sourcePath: string, expected: RecordIdentity): Promise<Buffer> => {
    return openInventoryEnvelope(
      {
        authorityUserDataRoot: options.authorityUserDataRoot,
        vault: options.vault,
        inventoryRoot,
        tupleRegistry,
      },
      sourcePath,
      expected
    );
  };

  const primeTupleRegistry = async (): Promise<void> => {
    await authenticateExternalRecoveryRecordInventory({
      authorityUserDataRoot: options.authorityUserDataRoot,
      vault: options.vault,
      inventoryRoot,
      tupleRegistry,
    });
  };

  return {
    securityClass: 'external-recovery-authority',
    async sealFile(sourcePath, destinationPath) {
      const identity = classifyRecord(recordRoot, namespace, destinationPath);
      const plaintext = await readRegularNoFollow(sourcePath);
      try {
        requirePlaintextContract(plaintext, identity.recordContract);
        await primeTupleRegistry();
        const envelope = await withExternalRecoveryAuthorityKey(authorityOptions, { operation: 'seal' }, ({ secret }) =>
          sealExternalRecoveryRecord(
            {
              recordContract: identity.recordContract,
              domain: identity.domain,
              recordId: identity.recordId,
              createdAt: (options.now?.() ?? new Date()).toISOString(),
              plaintext,
            },
            secret,
            tupleRegistry
          )
        );
        await writeExclusiveDurable(path.resolve(destinationPath), envelope);
      } finally {
        plaintext.fill(0);
      }
    },
    async unsealFile(sourcePath, destinationPath) {
      const identity = classifyRecord(recordRoot, namespace, sourcePath);
      const plaintext = await openEnvelope(path.resolve(sourcePath), identity);
      try {
        await writeExclusiveDurable(path.resolve(destinationPath), plaintext);
      } finally {
        plaintext.fill(0);
      }
    },
  };
}
