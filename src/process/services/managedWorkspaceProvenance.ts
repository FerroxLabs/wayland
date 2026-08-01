/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { decryptString, encryptString } from '@process/secrets/safeStorage';
import { writeFileAtomic } from '@process/utils/atomicWrite';

export const MANAGED_WORKSPACE_PROVENANCE_FILE = 'managed-workspace-provenance.v1.enc';

export type ManagedWorkspaceProvenanceRecord = Readonly<{
  schemaVersion: 1;
  workspaceId: string;
  installationId: string;
  canonicalRoot: string;
  canonicalPath: string;
  device: number;
  inode: number;
  createdAtMs: number;
}>;

export type ManagedWorkspaceCreationIdentity = Readonly<{
  canonicalRoot: string;
  canonicalPath: string;
  device: number;
  inode: number;
}>;

type Ledger = Readonly<{
  schemaVersion: 1;
  installationId: string;
  records: ManagedWorkspaceProvenanceRecord[];
}>;

export type ManagedWorkspaceProvenanceLoad =
  | Readonly<{ state: 'complete'; records: ManagedWorkspaceProvenanceRecord[]; errors: [] }>
  | Readonly<{ state: 'unavailable' | 'error'; records: []; errors: string[] }>;

export type ManagedWorkspaceProvenanceCodec = Readonly<{
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}>;

const DEFAULT_CODEC: ManagedWorkspaceProvenanceCodec = {
  encrypt: encryptString,
  decrypt: decryptString,
};
const MAX_LEDGER_BYTES = 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const queues = new Map<string, Promise<void>>();
const compareCodeUnits = (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0);

const exactObject = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value).toSorted();
  const expected = [...keys].toSorted();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

function parseRecord(value: unknown): ManagedWorkspaceProvenanceRecord {
  if (
    !exactObject(value, [
      'schemaVersion',
      'workspaceId',
      'installationId',
      'canonicalRoot',
      'canonicalPath',
      'device',
      'inode',
      'createdAtMs',
    ]) ||
    value.schemaVersion !== 1 ||
    typeof value.workspaceId !== 'string' ||
    !UUID_PATTERN.test(value.workspaceId) ||
    typeof value.installationId !== 'string' ||
    !value.installationId ||
    typeof value.canonicalRoot !== 'string' ||
    !path.isAbsolute(value.canonicalRoot) ||
    typeof value.canonicalPath !== 'string' ||
    !path.isAbsolute(value.canonicalPath) ||
    path.dirname(value.canonicalPath) !== value.canonicalRoot ||
    !Number.isSafeInteger(value.device) ||
    Number(value.device) < 0 ||
    !Number.isSafeInteger(value.inode) ||
    Number(value.inode) < 0 ||
    !Number.isSafeInteger(value.createdAtMs) ||
    Number(value.createdAtMs) < 0
  ) {
    throw new Error('MANAGED_WORKSPACE_PROVENANCE_INVALID_RECORD');
  }
  return value as ManagedWorkspaceProvenanceRecord;
}

function parseLedger(plaintext: string, installationId: string): Ledger {
  let value: unknown;
  try {
    value = JSON.parse(plaintext) as unknown;
  } catch {
    throw new Error('MANAGED_WORKSPACE_PROVENANCE_INVALID_LEDGER');
  }
  if (
    !exactObject(value, ['schemaVersion', 'installationId', 'records']) ||
    value.schemaVersion !== 1 ||
    value.installationId !== installationId ||
    !Array.isArray(value.records)
  ) {
    throw new Error('MANAGED_WORKSPACE_PROVENANCE_INVALID_LEDGER');
  }
  const records = value.records.map(parseRecord);
  if (
    records.some((record) => record.installationId !== installationId) ||
    new Set(records.map((record) => record.workspaceId)).size !== records.length ||
    new Set(records.map((record) => record.canonicalPath)).size !== records.length
  ) {
    throw new Error('MANAGED_WORKSPACE_PROVENANCE_CONTRADICTORY_LEDGER');
  }
  return { schemaVersion: 1, installationId, records };
}

export const managedWorkspaceProvenanceLedgerPath = (authorityRoot: string): string =>
  path.join(path.resolve(authorityRoot), MANAGED_WORKSPACE_PROVENANCE_FILE);

async function readLedger(
  ledgerPath: string,
  installationId: string,
  codec: ManagedWorkspaceProvenanceCodec
): Promise<Ledger | null> {
  let stat;
  try {
    stat = await fs.lstat(ledgerPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_LEDGER_BYTES) {
    throw new Error('MANAGED_WORKSPACE_PROVENANCE_UNSAFE_LEDGER');
  }
  return parseLedger(codec.decrypt(await fs.readFile(ledgerPath, 'utf8')), installationId);
}

export async function loadManagedWorkspaceProvenance(
  authorityRoot: string,
  installationId: string,
  codec: ManagedWorkspaceProvenanceCodec = DEFAULT_CODEC
): Promise<ManagedWorkspaceProvenanceLoad> {
  try {
    if (typeof installationId !== 'string' || !installationId) {
      throw new Error('MANAGED_WORKSPACE_PROVENANCE_INSTALLATION_UNAVAILABLE');
    }
    const ledger = await readLedger(managedWorkspaceProvenanceLedgerPath(authorityRoot), installationId, codec);
    if (!ledger) return { state: 'unavailable', records: [], errors: ['workspace provenance ledger is absent'] };
    return { state: 'complete', records: ledger.records, errors: [] };
  } catch (error) {
    return {
      state: 'error',
      records: [],
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

export async function recordManagedWorkspaceProvenance(
  input: Readonly<{
    authorityRoot: string;
    workRoot: string;
    workspace: string;
    installationId: string;
    creationIdentity: ManagedWorkspaceCreationIdentity;
    createdAtMs?: number;
  }>,
  codec: ManagedWorkspaceProvenanceCodec = DEFAULT_CODEC
): Promise<ManagedWorkspaceProvenanceRecord> {
  const ledgerPath = managedWorkspaceProvenanceLedgerPath(input.authorityRoot);
  let recorded!: ManagedWorkspaceProvenanceRecord;
  const previous = queues.get(ledgerPath) ?? Promise.resolve();
  const current = previous
    .catch(() => {})
    .then(async () => {
      const canonicalRoot = await fs.realpath(input.workRoot);
      const canonicalPath = await fs.realpath(input.workspace);
      const rootStat = await fs.lstat(canonicalRoot);
      const workspaceStat = await fs.lstat(canonicalPath);
      const creationIdentity = input.creationIdentity;
      if (
        rootStat.isSymbolicLink() ||
        !rootStat.isDirectory() ||
        workspaceStat.isSymbolicLink() ||
        !workspaceStat.isDirectory() ||
        path.dirname(canonicalPath) !== canonicalRoot ||
        !creationIdentity ||
        creationIdentity.canonicalRoot !== canonicalRoot ||
        creationIdentity.canonicalPath !== canonicalPath ||
        creationIdentity.device !== workspaceStat.dev ||
        creationIdentity.inode !== workspaceStat.ino ||
        !input.installationId
      ) {
        throw new Error('MANAGED_WORKSPACE_PROVENANCE_UNSAFE_TARGET');
      }
      const createdAtMs = input.createdAtMs ?? Date.now();
      if (!Number.isSafeInteger(createdAtMs) || createdAtMs < 0) {
        throw new Error('MANAGED_WORKSPACE_PROVENANCE_INVALID_TIMESTAMP');
      }
      await fs.mkdir(path.dirname(ledgerPath), { recursive: true, mode: 0o700 });
      const existing = await readLedger(ledgerPath, input.installationId, codec);
      const records = existing?.records ?? [];
      const samePath = records.find((record) => record.canonicalPath === canonicalPath);
      if (samePath) {
        if (samePath.device !== workspaceStat.dev || samePath.inode !== workspaceStat.ino) {
          throw new Error('MANAGED_WORKSPACE_PROVENANCE_PATH_REUSED');
        }
        recorded = samePath;
        return;
      }
      recorded = {
        schemaVersion: 1,
        workspaceId: randomUUID(),
        installationId: input.installationId,
        canonicalRoot,
        canonicalPath,
        device: workspaceStat.dev,
        inode: workspaceStat.ino,
        createdAtMs,
      };
      const ledger: Ledger = {
        schemaVersion: 1,
        installationId: input.installationId,
        records: [...records, recorded].toSorted((left, right) =>
          compareCodeUnits(left.canonicalPath, right.canonicalPath)
        ),
      };
      await writeFileAtomic(ledgerPath, codec.encrypt(JSON.stringify(ledger)), { mode: 0o600 });
    });
  queues.set(ledgerPath, current);
  try {
    await current;
    return recorded;
  } finally {
    if (queues.get(ledgerPath) === current) queues.delete(ledgerPath);
  }
}
