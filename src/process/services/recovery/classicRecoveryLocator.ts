/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { link, lstat, mkdir, open, readdir, realpath, unlink } from 'node:fs/promises';
import path from 'node:path';
import { withExternalRecoveryAuthorityKey, type ExternalRecoveryVaultBackend } from './externalRecoveryAuthority';
import {
  canonicalizeRecoveryJson,
  openExternalRecoveryRecord,
  parseCanonicalRecoveryJson,
  RecoveryTupleRegistry,
  sealExternalRecoveryRecord,
} from './externalRecoveryCrypto';
import {
  authenticateExternalRecoveryRecordInventory,
  createExternalRecoveryRecordCodec,
} from './externalRecoveryRecordCodec';
import type { ClassicAuthorityEnvelopeCodec } from './classicConstitutionPromotion';
import { syncDirectory as syncDirectoryDurably } from '@process/utils/durabilitySync';

const LOCATOR_EVENT_CONTRACT = 'wayland-constitution-classic-recovery-locator-event/1.0' as const;
const LOCATOR_EVENT_DOMAIN = 'wayland.classic-recovery.locator-event/1.0' as const;
const INSTALLATION_BINDING_CONTRACT = 'wayland-constitution-classic-recovery-installation-binding/1.0' as const;
const REGISTRY_DIRECTORY = '.wayland-classic-recovery';
const REGISTRY_VERSION = 'v1';
const EVENTS_DIRECTORY = 'events';
const RECORDS_DIRECTORY = 'records';
const LOCATOR_DIRECTORY = 'locator';
const MAX_EVENT_BYTES = 256 * 1024;
const MAX_PROJECTION_BYTES = 64 * 1024 * 1024;
const MAX_EVENTS = 1_000_000;
const EVENT_FILE_PATTERN = /^(\d{6})\.sealed$/;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;
const KEY_ID_PATTERN = /^rk1:[A-Za-z0-9_-]{43}$/;

export type ClassicRecoveryLocatorTerminalState = 'no-change' | 'committed' | 'rescued' | 'discarded';

export type ClassicRecoveryLocatorEvent = Readonly<{
  contract: typeof LOCATOR_EVENT_CONTRACT;
  sequence: number;
  previousEventSha256: `sha256:${string}` | null;
  eventId: string;
  kind: 'activated' | 'terminal';
  installationBindingSha256: `sha256:${string}`;
  preparationId: string;
  projectionAuthoritySha256: `sha256:${string}`;
  terminalState: ClassicRecoveryLocatorTerminalState | null;
  operationReceiptId: string | null;
  createdAt: string;
}>;

export type ClassicRecoveryLocatorLayout = Readonly<{
  canonicalLiveUserDataRoot: string;
  installationBindingSha256: `sha256:${string}`;
  registryRoot: string;
  recordsRoot: string;
  eventsRoot: string;
}>;

export type ClassicRecoveryLocatorSnapshot = Readonly<{
  events: readonly ClassicRecoveryLocatorEvent[];
  active: ClassicRecoveryLocatorEvent | null;
}>;

type LocatorDependencies = Readonly<{
  liveUserDataRoot: string;
  authorityUserDataRoot: string;
  vault: ExternalRecoveryVaultBackend;
  now?: () => Date;
  createId?: () => string;
}>;

function sha256(bytes: Uint8Array | string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).toSorted(compareCodeUnits);
  const expected = [...keys].toSorted(compareCodeUnits);
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} contains missing or unknown fields.`);
  }
  return record;
}

function canonicalTimestamp(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new Error(`${label} is not a canonical UTC timestamp.`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${label} is not a canonical UTC timestamp.`);
  }
  return value;
}

function canonicalPreparationId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 128 ||
    value === '.' ||
    value === '..' ||
    value.normalize('NFC') !== value ||
    !/^[A-Za-z0-9._-]+$/.test(value)
  ) {
    throw new Error('Classic recovery preparation ID is unsafe.');
  }
  return value;
}

function canonicalReceiptId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 4096 ||
    value.normalize('NFC') !== value ||
    value.includes('\0')
  ) {
    throw new Error('Classic recovery operation receipt ID is malformed.');
  }
  return value;
}

function eventRecordId(binding: string, sequence: number): string {
  return `classic-recovery-locator/${binding.slice('sha256:'.length)}/${sequence.toString().padStart(6, '0')}`;
}

function parseEvent(
  value: unknown,
  binding: `sha256:${string}`,
  expectedSequence: number
): ClassicRecoveryLocatorEvent {
  const event = exactRecord(
    value,
    [
      'contract',
      'sequence',
      'previousEventSha256',
      'eventId',
      'kind',
      'installationBindingSha256',
      'preparationId',
      'projectionAuthoritySha256',
      'terminalState',
      'operationReceiptId',
      'createdAt',
    ],
    'Classic recovery locator event'
  );
  if (
    event.contract !== LOCATOR_EVENT_CONTRACT ||
    event.sequence !== expectedSequence ||
    !UUID_V4_PATTERN.test(String(event.eventId)) ||
    (event.kind !== 'activated' && event.kind !== 'terminal') ||
    event.installationBindingSha256 !== binding ||
    !SHA256_PATTERN.test(String(event.projectionAuthoritySha256))
  ) {
    throw new Error('Classic recovery locator event identity is malformed.');
  }
  if (event.previousEventSha256 !== null && !SHA256_PATTERN.test(String(event.previousEventSha256))) {
    throw new Error('Classic recovery locator predecessor is malformed.');
  }
  if (event.kind === 'activated') {
    if (event.terminalState !== null || event.operationReceiptId !== null) {
      throw new Error('Classic recovery activation contains terminal fields.');
    }
  } else if (
    !['no-change', 'committed', 'rescued', 'discarded'].includes(String(event.terminalState)) ||
    (event.terminalState === 'no-change'
      ? event.operationReceiptId !== null
      : typeof event.operationReceiptId !== 'string')
  ) {
    throw new Error('Classic recovery terminal event fields are malformed.');
  }
  return {
    contract: LOCATOR_EVENT_CONTRACT,
    sequence: expectedSequence,
    previousEventSha256: event.previousEventSha256 as `sha256:${string}` | null,
    eventId: String(event.eventId),
    kind: event.kind,
    installationBindingSha256: binding,
    preparationId: canonicalPreparationId(event.preparationId),
    projectionAuthoritySha256: event.projectionAuthoritySha256 as `sha256:${string}`,
    terminalState: event.terminalState as ClassicRecoveryLocatorTerminalState | null,
    operationReceiptId: event.operationReceiptId === null ? null : canonicalReceiptId(event.operationReceiptId),
    createdAt: canonicalTimestamp(event.createdAt, 'Classic recovery locator event time'),
  };
}

async function realDirectory(directory: string, label: string): Promise<string> {
  const stat = await lstat(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} is not a real directory.`);
  return realpath(directory);
}

async function ensureDirectory(directory: string, parent: string, label: string): Promise<void> {
  const canonicalParent = await realDirectory(parent, `${label} parent`);
  if (path.dirname(path.resolve(directory)) !== canonicalParent) throw new Error(`${label} parent changed.`);
  try {
    const stat = await lstat(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} is not a real directory.`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    await mkdir(directory, { mode: 0o700 });
    await syncDirectory(parent);
  }
  if ((await realpath(directory)) !== directory) throw new Error(`${label} is not canonical.`);
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

async function readRegularNoFollow(
  filePath: string,
  maxBytes = MAX_EVENT_BYTES,
  label = 'Classic recovery locator event'
): Promise<Buffer> {
  const beforePath = await lstat(filePath);
  if (beforePath.isSymbolicLink() || !beforePath.isFile() || beforePath.size > maxBytes) {
    throw new Error(`${label} is unsafe or oversized.`);
  }
  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  const handle = await open(filePath, constants.O_RDONLY | noFollow);
  try {
    const before = await handle.stat();
    const bytes = await handle.readFile();
    const after = await handle.stat();
    if (
      !before.isFile() ||
      bytes.length !== before.size ||
      before.size !== after.size ||
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.dev !== beforePath.dev ||
      before.ino !== beforePath.ino
    ) {
      throw new Error(`${label} changed during read.`);
    }
    return bytes;
  } finally {
    await handle.close();
  }
}

function envelopeKeyId(bytes: Buffer): string {
  const envelope = exactRecord(
    parseCanonicalRecoveryJson(bytes),
    ['contract', 'recordContract', 'domain', 'keyId', 'recordId', 'createdAt', 'kdf', 'cipher', 'plaintext', 'mac'],
    'Classic recovery locator envelope'
  );
  if (typeof envelope.keyId !== 'string' || !KEY_ID_PATTERN.test(envelope.keyId)) {
    throw new Error('Classic recovery locator envelope key ID is malformed.');
  }
  return envelope.keyId;
}

async function publishNoClobber(filePath: string, bytes: Uint8Array): Promise<void> {
  const directory = path.dirname(filePath);
  if ((await realpath(directory)) !== directory) throw new Error('Classic recovery locator event directory changed.');
  const temporary = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`);
  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  const handle = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await link(temporary, filePath);
    await syncDirectory(directory);
  } finally {
    await unlink(temporary).catch((): undefined => undefined);
  }
}

export async function resolveClassicRecoveryLocatorLayout(
  liveUserDataRoot: string
): Promise<ClassicRecoveryLocatorLayout> {
  const canonicalLiveUserDataRoot = await realDirectory(path.resolve(liveUserDataRoot), 'Wayland live userData root');
  const parent = await realDirectory(path.dirname(canonicalLiveUserDataRoot), 'Wayland live userData parent');
  const stat = await lstat(canonicalLiveUserDataRoot, { bigint: true });
  const installationBindingSha256 = sha256(
    canonicalizeRecoveryJson({
      contract: INSTALLATION_BINDING_CONTRACT,
      canonicalLiveUserDataRoot,
      device: stat.dev.toString(10),
      inode: stat.ino.toString(10),
    })
  );
  const registryRoot = path.join(
    parent,
    REGISTRY_DIRECTORY,
    REGISTRY_VERSION,
    installationBindingSha256.slice('sha256:'.length)
  );
  return {
    canonicalLiveUserDataRoot,
    installationBindingSha256,
    registryRoot,
    recordsRoot: path.join(registryRoot, RECORDS_DIRECTORY),
    eventsRoot: path.join(registryRoot, LOCATOR_DIRECTORY, EVENTS_DIRECTORY),
  };
}

export class ClassicRecoveryLocatorAuthority {
  private readonly tupleRegistry = new RecoveryTupleRegistry();
  private readonly createId: () => string;

  constructor(private readonly dependencies: LocatorDependencies) {
    this.createId = dependencies.createId ?? randomUUID;
  }

  async layout(): Promise<ClassicRecoveryLocatorLayout> {
    return resolveClassicRecoveryLocatorLayout(this.dependencies.liveUserDataRoot);
  }

  async ensureWritableLayout(): Promise<ClassicRecoveryLocatorLayout> {
    const layout = await this.layout();
    const parent = path.dirname(layout.canonicalLiveUserDataRoot);
    const productRoot = path.join(parent, REGISTRY_DIRECTORY);
    const versionRoot = path.join(productRoot, REGISTRY_VERSION);
    await ensureDirectory(productRoot, parent, 'Classic recovery registry product root');
    await ensureDirectory(versionRoot, productRoot, 'Classic recovery registry version root');
    await ensureDirectory(layout.registryRoot, versionRoot, 'Classic recovery installation registry');
    await ensureDirectory(layout.recordsRoot, layout.registryRoot, 'Classic recovery records root');
    const locatorRoot = path.join(layout.registryRoot, LOCATOR_DIRECTORY);
    await ensureDirectory(locatorRoot, layout.registryRoot, 'Classic recovery locator root');
    await ensureDirectory(layout.eventsRoot, locatorRoot, 'Classic recovery locator events root');
    return layout;
  }

  async createRecordCodec(preparationId: string): Promise<ClassicAuthorityEnvelopeCodec> {
    const checkedPreparationId = canonicalPreparationId(preparationId);
    const layout = await this.ensureWritableLayout();
    return createExternalRecoveryRecordCodec({
      authorityUserDataRoot: this.dependencies.authorityUserDataRoot,
      vault: this.dependencies.vault,
      recordRoot: path.join(layout.recordsRoot, checkedPreparationId),
      inventoryRoot: layout.recordsRoot,
      tupleRegistry: this.tupleRegistry,
      now: this.dependencies.now,
    });
  }

  private async eventNames(layout: ClassicRecoveryLocatorLayout): Promise<string[]> {
    try {
      const registryStat = await lstat(layout.registryRoot);
      if (registryStat.isSymbolicLink() || !registryStat.isDirectory()) {
        throw new Error('Classic recovery locator registry is unsafe.');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const rootEntries = await readdir(layout.registryRoot, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (
        entry.isSymbolicLink() ||
        !entry.isDirectory() ||
        ![RECORDS_DIRECTORY, LOCATOR_DIRECTORY].includes(entry.name)
      ) {
        throw new Error(`Classic recovery registry contains an unsafe entry: ${entry.name}`);
      }
    }
    const rootNames = rootEntries.map((entry) => entry.name).toSorted(compareCodeUnits);
    if (rootNames.length !== 2 || rootNames[0] !== LOCATOR_DIRECTORY || rootNames[1] !== RECORDS_DIRECTORY) {
      throw new Error('Classic recovery registry layout is incomplete or contradictory.');
    }
    const locatorRoot = path.dirname(layout.eventsRoot);
    await realDirectory(locatorRoot, 'Classic recovery locator root');
    await realDirectory(layout.eventsRoot, 'Classic recovery locator events root');
    const entries = await readdir(layout.eventsRoot, { withFileTypes: true });
    const names: string[] = [];
    for (const entry of entries) {
      const match = EVENT_FILE_PATTERN.exec(entry.name);
      if (entry.isSymbolicLink() || !entry.isFile() || !match) {
        throw new Error(`Classic recovery locator contains an unsafe entry: ${entry.name}`);
      }
      names.push(entry.name);
    }
    const sortedNames = names.toSorted(compareCodeUnits);
    if (sortedNames.length > MAX_EVENTS) throw new Error('Classic recovery locator authority is full.');
    for (let sequence = 0; sequence < sortedNames.length; sequence += 1) {
      if (sortedNames[sequence] !== `${sequence.toString().padStart(6, '0')}.sealed`) {
        throw new Error('Classic recovery locator chain has a gap, duplicate, or noncanonical filename.');
      }
    }
    return sortedNames;
  }

  private authorityOptions(layout: ClassicRecoveryLocatorLayout) {
    return {
      userDataRoot: this.dependencies.authorityUserDataRoot,
      vault: this.dependencies.vault,
      existingRecordDigests: async (): Promise<readonly string[]> => [],
      classicTreeRoots: [layout.registryRoot],
    };
  }

  async snapshot(): Promise<ClassicRecoveryLocatorSnapshot> {
    const layout = await this.layout();
    const names = await this.eventNames(layout);
    const events: ClassicRecoveryLocatorEvent[] = [];
    let previousEventSha256: `sha256:${string}` | null = null;
    let active: ClassicRecoveryLocatorEvent | null = null;
    for (let sequence = 0; sequence < names.length; sequence += 1) {
      const eventPath = path.join(layout.eventsRoot, names[sequence]!);
      // Ordered authentication is the locator's sole head authority.
      // oxlint-disable-next-line no-await-in-loop
      const envelope = await readRegularNoFollow(eventPath);
      const keyId = envelopeKeyId(envelope);
      // Retired keys remain required so old locator history cannot be silently skipped.
      // oxlint-disable-next-line no-await-in-loop
      const opened = await withExternalRecoveryAuthorityKey(
        this.authorityOptions(layout),
        { operation: 'open', keyId },
        ({ secret }) => openExternalRecoveryRecord(envelope, secret, this.tupleRegistry)
      );
      try {
        if (
          opened.recordContract !== LOCATOR_EVENT_CONTRACT ||
          opened.domain !== LOCATOR_EVENT_DOMAIN ||
          opened.recordId !== eventRecordId(layout.installationBindingSha256, sequence)
        ) {
          throw new Error('Classic recovery locator envelope identity does not match its sequence.');
        }
        const event = parseEvent(
          parseCanonicalRecoveryJson(opened.plaintext),
          layout.installationBindingSha256,
          sequence
        );
        if (event.previousEventSha256 !== previousEventSha256) {
          throw new Error('Classic recovery locator event does not extend the authenticated predecessor.');
        }
        if (event.kind === 'activated') {
          if (active) throw new Error('Classic recovery locator contains multiple active preparations.');
          active = event;
        } else {
          if (
            !active ||
            active.preparationId !== event.preparationId ||
            active.projectionAuthoritySha256 !== event.projectionAuthoritySha256
          ) {
            throw new Error('Classic recovery terminal event does not bind the active preparation.');
          }
          active = null;
        }
        events.push(event);
        previousEventSha256 = opened.envelopeSha256 as `sha256:${string}`;
      } finally {
        opened.plaintext.fill(0);
      }
    }
    await authenticateExternalRecoveryRecordInventory({
      authorityUserDataRoot: this.dependencies.authorityUserDataRoot,
      vault: this.dependencies.vault,
      inventoryRoot: layout.recordsRoot,
      tupleRegistry: this.tupleRegistry,
    });
    const currentProjection = active ?? events.at(-1) ?? null;
    if (currentProjection) {
      const projectionPath = path.join(
        layout.recordsRoot,
        currentProjection.preparationId,
        'projection-authority.sealed'
      );
      if (
        sha256(
          await readRegularNoFollow(
            projectionPath,
            MAX_PROJECTION_BYTES,
            'Classic recovery current projection authority'
          )
        ) !== currentProjection.projectionAuthoritySha256
      ) {
        throw new Error('Classic recovery current projection digest changed.');
      }
    }
    return { events, active };
  }

  private async append(input: {
    eventId: string;
    kind: ClassicRecoveryLocatorEvent['kind'];
    preparationId: string;
    projectionAuthoritySha256: `sha256:${string}`;
    terminalState: ClassicRecoveryLocatorTerminalState | null;
    operationReceiptId: string | null;
  }): Promise<ClassicRecoveryLocatorEvent> {
    if (!UUID_V4_PATTERN.test(input.eventId)) throw new Error('Classic recovery locator event ID is malformed.');
    const preparationId = canonicalPreparationId(input.preparationId);
    if (!SHA256_PATTERN.test(input.projectionAuthoritySha256))
      throw new Error('Classic recovery locator event facts are malformed.');
    if (input.kind === 'activated') {
      if (input.terminalState !== null || input.operationReceiptId !== null) {
        throw new Error('Classic recovery activation contains terminal fields.');
      }
    } else {
      if (!['no-change', 'committed', 'rescued', 'discarded'].includes(String(input.terminalState))) {
        throw new Error('Classic recovery terminal state is malformed.');
      }
      if (input.terminalState === 'no-change') {
        if (input.operationReceiptId !== null) {
          throw new Error('Classic recovery no-change terminal event cannot name a receipt.');
        }
      } else {
        canonicalReceiptId(input.operationReceiptId);
      }
    }
    const layout = await this.ensureWritableLayout();
    const current = await this.snapshot();
    const replay = current.events.find((event) => event.eventId === input.eventId);
    if (replay) {
      if (
        replay.kind !== input.kind ||
        replay.preparationId !== preparationId ||
        replay.projectionAuthoritySha256 !== input.projectionAuthoritySha256 ||
        replay.terminalState !== input.terminalState ||
        replay.operationReceiptId !== input.operationReceiptId
      ) {
        throw new Error('Classic recovery locator event ID already owns different facts.');
      }
      return replay;
    }
    if (input.kind === 'activated') {
      if (current.active) {
        if (
          current.active.preparationId === preparationId &&
          current.active.projectionAuthoritySha256 === input.projectionAuthoritySha256
        ) {
          return current.active;
        }
        throw new Error('Classic recovery already has an active preparation.');
      }
    } else if (
      !current.active ||
      current.active.preparationId !== preparationId ||
      current.active.projectionAuthoritySha256 !== input.projectionAuthoritySha256
    ) {
      throw new Error('Classic recovery terminal event does not match the active preparation.');
    }
    const sequence = current.events.length;
    if (sequence >= MAX_EVENTS) throw new Error('Classic recovery locator authority is full.');
    const previousEventSha256 =
      sequence === 0
        ? null
        : sha256(
            await readRegularNoFollow(
              path.join(layout.eventsRoot, `${(sequence - 1).toString().padStart(6, '0')}.sealed`)
            )
          );
    const event: ClassicRecoveryLocatorEvent = {
      contract: LOCATOR_EVENT_CONTRACT,
      sequence,
      previousEventSha256,
      eventId: input.eventId,
      kind: input.kind,
      installationBindingSha256: layout.installationBindingSha256,
      preparationId,
      projectionAuthoritySha256: input.projectionAuthoritySha256,
      terminalState: input.terminalState,
      operationReceiptId: input.operationReceiptId,
      createdAt: (this.dependencies.now?.() ?? new Date()).toISOString(),
    };
    const plaintext = canonicalizeRecoveryJson(event);
    const envelope = await withExternalRecoveryAuthorityKey(
      this.authorityOptions(layout),
      { operation: 'seal' },
      ({ secret }) =>
        sealExternalRecoveryRecord(
          {
            recordContract: LOCATOR_EVENT_CONTRACT,
            domain: LOCATOR_EVENT_DOMAIN,
            recordId: eventRecordId(layout.installationBindingSha256, sequence),
            createdAt: event.createdAt,
            plaintext,
          },
          secret,
          this.tupleRegistry
        )
    );
    const destination = path.join(layout.eventsRoot, `${sequence.toString().padStart(6, '0')}.sealed`);
    try {
      await publishNoClobber(destination, envelope);
      return event;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      const reloaded = await this.snapshot();
      const winner = reloaded.events.find((candidate) => candidate.eventId === input.eventId);
      if (
        winner &&
        winner.kind === input.kind &&
        winner.preparationId === preparationId &&
        winner.projectionAuthoritySha256 === input.projectionAuthoritySha256 &&
        winner.terminalState === input.terminalState &&
        winner.operationReceiptId === input.operationReceiptId
      ) {
        return winner;
      }
      throw new Error('Classic recovery locator has a conflicting concurrent successor.', { cause: error });
    }
  }

  async activate(input: {
    preparationId: string;
    projectionAuthoritySha256: `sha256:${string}`;
    eventId?: string;
  }): Promise<ClassicRecoveryLocatorEvent> {
    return this.append({
      eventId: input.eventId ?? this.createId(),
      kind: 'activated',
      preparationId: input.preparationId,
      projectionAuthoritySha256: input.projectionAuthoritySha256,
      terminalState: null,
      operationReceiptId: null,
    });
  }

  async terminal(input: {
    eventId?: string;
    preparationId: string;
    projectionAuthoritySha256: `sha256:${string}`;
    terminalState: ClassicRecoveryLocatorTerminalState;
    operationReceiptId: string | null;
  }): Promise<ClassicRecoveryLocatorEvent> {
    return this.append({
      eventId: input.eventId ?? this.createId(),
      kind: 'terminal',
      preparationId: input.preparationId,
      projectionAuthoritySha256: input.projectionAuthoritySha256,
      terminalState: input.terminalState,
      operationReceiptId: input.operationReceiptId,
    });
  }
}
