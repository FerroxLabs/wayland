/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ClassicRecoveryLocatorAuthority,
  resolveClassicRecoveryLocatorLayout,
} from '@process/services/recovery/classicRecoveryLocator';
import {
  loadOrCreateExternalRecoveryAuthority,
  withExternalRecoveryAuthorityKey,
  type ExternalRecoveryVaultBackend,
} from '@process/services/recovery/externalRecoveryAuthority';
import {
  canonicalizeRecoveryJson,
  RecoveryTupleRegistry,
  sealExternalRecoveryRecord,
} from '@process/services/recovery/externalRecoveryCrypto';

const CREATED_AT = new Date('2026-07-17T12:00:00.000Z');
const FIXED_SECRET = Buffer.from(Array.from({ length: 32 }, (_, index) => index + 41));
const PROJECTION_CONTRACT = 'wayland-constitution-classic-projection-authority/1.0';
const EVENT_A = '11111111-1111-4111-8111-111111111111';
const EVENT_B = '22222222-2222-4222-8222-222222222222';
const EVENT_C = '33333333-3333-4333-8333-333333333333';
const roots: string[] = [];

class TestVault implements ExternalRecoveryVaultBackend {
  readonly provider = 'test-os-vault';

  async wrap(input: { secret: Buffer; keyId: string }): Promise<{ vaultRef: string; wrappedSecret: Uint8Array }> {
    return {
      vaultRef: `test-vault:${input.keyId}`,
      wrappedSecret: Buffer.from(input.secret.map((byte) => byte ^ 0x65)),
    };
  }

  async unwrap(input: { keyId: string; vaultRef: string; wrappedSecret: Buffer }): Promise<Uint8Array> {
    if (input.vaultRef !== `test-vault:${input.keyId}`) throw new Error('test vault identity mismatch');
    return Buffer.from(input.wrappedSecret.map((byte) => byte ^ 0x65));
  }
}

type Fixture = Readonly<{
  root: string;
  userDataRoot: string;
  vault: TestVault;
}>;

function digest(bytes: Uint8Array): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

async function fixture(initializeAuthority = true): Promise<Fixture> {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-classic-locator-')));
  roots.push(root);
  const userDataRoot = path.join(root, 'Wayland');
  await mkdir(userDataRoot, { mode: 0o700 });
  const vault = new TestVault();
  if (initializeAuthority) {
    const authority = await loadOrCreateExternalRecoveryAuthority({
      userDataRoot,
      vault,
      existingRecordDigests: async () => [],
      dependencies: { now: () => CREATED_AT, randomSecret: () => Buffer.from(FIXED_SECRET) },
    });
    authority.activeSecret.fill(0);
  }
  return { root, userDataRoot, vault };
}

function locator(data: Fixture): ClassicRecoveryLocatorAuthority {
  return new ClassicRecoveryLocatorAuthority({
    liveUserDataRoot: data.userDataRoot,
    authorityUserDataRoot: data.userDataRoot,
    vault: data.vault,
    now: () => CREATED_AT,
  });
}

async function sealProjection(
  authority: ClassicRecoveryLocatorAuthority,
  data: Fixture,
  preparationId: string
): Promise<{ path: string; sha256: `sha256:${string}` }> {
  const layout = await authority.ensureWritableLayout();
  const preparationRoot = path.join(layout.recordsRoot, preparationId);
  const sourceRoot = path.join(data.root, 'sources');
  const sourcePath = path.join(sourceRoot, `${preparationId}.json`);
  const projectionPath = path.join(preparationRoot, 'projection-authority.sealed');
  await mkdir(preparationRoot, { mode: 0o700 });
  await mkdir(sourceRoot, { recursive: true, mode: 0o700 });
  await writeFile(sourcePath, canonicalizeRecoveryJson({ contract: PROJECTION_CONTRACT, preparationId }), {
    mode: 0o600,
  });
  const codec = await authority.createRecordCodec(preparationId);
  await codec.sealFile(sourcePath, projectionPath);
  return { path: projectionPath, sha256: digest(await readFile(projectionPath)) };
}

function registryFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(candidate);
      else files.push(candidate);
    }
  };
  visit(root);
  return files;
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('Classic recovery restart locator', () => {
  it('treats cold absence as empty without creating a registry or vault authority', async () => {
    const data = await fixture(false);
    const layout = await resolveClassicRecoveryLocatorLayout(data.userDataRoot);

    await expect(locator(data).snapshot()).resolves.toEqual({ events: [], active: null });
    expect(fs.existsSync(layout.registryRoot)).toBe(false);
    expect(fs.existsSync(path.join(data.userDataRoot, 'constitution', 'external-recovery-authority-v1'))).toBe(false);
  });

  it('discovers one authenticated active preparation after restart without materializing plaintext', async () => {
    const data = await fixture();
    const writer = locator(data);
    const projection = await sealProjection(writer, data, 'prep-restart');
    await writer.activate({
      preparationId: 'prep-restart',
      projectionAuthoritySha256: projection.sha256,
      eventId: EVENT_A,
    });

    const restarted = locator(data);
    const snapshot = await restarted.snapshot();
    expect(snapshot.events).toHaveLength(1);
    expect(snapshot.active).toMatchObject({
      kind: 'activated',
      eventId: EVENT_A,
      preparationId: 'prep-restart',
      projectionAuthoritySha256: projection.sha256,
    });

    const layout = await restarted.layout();
    expect(
      registryFiles(layout.registryRoot)
        .map((file) => path.extname(file))
        .toSorted()
    ).toEqual(['.sealed', '.sealed']);
  });

  it('replays terminal response loss, retains rescue bytes, and permits one later successor', async () => {
    const data = await fixture();
    const authority = locator(data);
    const first = await sealProjection(authority, data, 'prep-first');
    await authority.activate({
      preparationId: 'prep-first',
      projectionAuthoritySha256: first.sha256,
      eventId: EVENT_A,
    });
    const terminal = {
      eventId: EVENT_B,
      preparationId: 'prep-first',
      projectionAuthoritySha256: first.sha256,
      terminalState: 'committed' as const,
      operationReceiptId: 'constitution-recovery-receipt:commit:first',
    };
    const original = await authority.terminal(terminal);
    await expect(locator(data).terminal(terminal)).resolves.toEqual(original);
    expect((await locator(data).snapshot()).active).toBeNull();
    expect(fs.existsSync(first.path)).toBe(true);

    const second = await sealProjection(authority, data, 'prep-second');
    await authority.activate({
      preparationId: 'prep-second',
      projectionAuthoritySha256: second.sha256,
      eventId: EVENT_C,
    });
    await expect(locator(data).snapshot()).resolves.toMatchObject({
      events: [{ eventId: EVENT_A }, { eventId: EVENT_B }, { eventId: EVENT_C }],
      active: { preparationId: 'prep-second' },
    });
    expect(fs.existsSync(first.path)).toBe(true);
  });

  it('continues binding terminal state to the current projection digest', async () => {
    const data = await fixture();
    const authority = locator(data);
    const projection = await sealProjection(authority, data, 'prep-terminal-binding');
    await authority.activate({
      preparationId: 'prep-terminal-binding',
      projectionAuthoritySha256: projection.sha256,
      eventId: EVENT_A,
    });
    await authority.terminal({
      eventId: EVENT_B,
      preparationId: 'prep-terminal-binding',
      projectionAuthoritySha256: projection.sha256,
      terminalState: 'committed',
      operationReceiptId: 'constitution-recovery-receipt:terminal-binding',
    });

    await expect(locator(data).snapshot()).resolves.toMatchObject({ active: null });
    const layout = await authority.layout();
    const replacementPlaintext = canonicalizeRecoveryJson({
      contract: PROJECTION_CONTRACT,
      preparationId: 'prep-terminal-binding',
      replacement: true,
    });
    const replacementEnvelope = await withExternalRecoveryAuthorityKey(
      {
        userDataRoot: data.userDataRoot,
        vault: data.vault,
        existingRecordDigests: async () => [],
        classicTreeRoots: [layout.registryRoot],
      },
      { operation: 'seal' },
      ({ secret }) =>
        sealExternalRecoveryRecord(
          {
            recordContract: PROJECTION_CONTRACT,
            domain: 'wayland.classic-recovery.projection-authority/1.0',
            recordId: 'classic-recovery/prep-terminal-binding/projection-authority.sealed',
            createdAt: CREATED_AT.toISOString(),
            plaintext: replacementPlaintext,
          },
          secret,
          new RecoveryTupleRegistry()
        )
    );
    const replacementPath = `${projection.path}.replacement`;
    await writeFile(replacementPath, replacementEnvelope, { mode: 0o600 });
    await rename(replacementPath, projection.path);

    await expect(locator(data).snapshot()).rejects.toThrow(/current projection digest changed/);
  });

  it('fails closed on a locator gap, tampered event, or missing active projection', async () => {
    const data = await fixture();
    const authority = locator(data);
    const projection = await sealProjection(authority, data, 'prep-hostile');
    await authority.activate({
      preparationId: 'prep-hostile',
      projectionAuthoritySha256: projection.sha256,
      eventId: EVENT_A,
    });
    const layout = await authority.layout();
    const firstEvent = path.join(layout.eventsRoot, '000000.sealed');

    await rename(firstEvent, path.join(layout.eventsRoot, '000001.sealed'));
    await expect(locator(data).snapshot()).rejects.toThrow(/gap|noncanonical/);
    await rename(path.join(layout.eventsRoot, '000001.sealed'), firstEvent);

    fs.appendFileSync(firstEvent, '\n');
    await expect(locator(data).snapshot()).rejects.toThrow();
    fs.truncateSync(firstEvent, fs.statSync(firstEvent).size - 1);

    await unlink(projection.path);
    await expect(locator(data).snapshot()).rejects.toThrow();
  });

  it('admits at most one winner under competing activation and exposes no caller path', async () => {
    const data = await fixture();
    const setup = locator(data);
    const left = await sealProjection(setup, data, 'prep-left');
    const right = await sealProjection(setup, data, 'prep-right');
    const contenders = await Promise.allSettled([
      locator(data).activate({ preparationId: 'prep-left', projectionAuthoritySha256: left.sha256, eventId: EVENT_A }),
      locator(data).activate({
        preparationId: 'prep-right',
        projectionAuthoritySha256: right.sha256,
        eventId: EVENT_B,
      }),
    ]);

    expect(contenders.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(contenders.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const snapshot = await locator(data).snapshot();
    expect(['prep-left', 'prep-right']).toContain(snapshot.active?.preparationId);
    expect(JSON.stringify(snapshot)).not.toContain(data.root);
  });

  it('rejects path traversal and contradictory terminal receipts before publication', async () => {
    const data = await fixture();
    const authority = locator(data);
    await expect(authority.createRecordCodec('../escape')).rejects.toThrow(/unsafe/);
    const projection = await sealProjection(authority, data, 'prep-validation');
    await authority.activate({
      preparationId: 'prep-validation',
      projectionAuthoritySha256: projection.sha256,
      eventId: EVENT_A,
    });
    await expect(
      authority.terminal({
        eventId: EVENT_B,
        preparationId: 'prep-validation',
        projectionAuthoritySha256: projection.sha256,
        terminalState: 'committed',
        operationReceiptId: null,
      })
    ).rejects.toThrow(/receipt/);
    expect((await authority.snapshot()).events).toHaveLength(1);
  });
});
