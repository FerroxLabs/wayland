/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { createHash, createHmac } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, mkdtemp, open, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  inspectClassicConstitutionRecovery,
  preserveClassicConstitutionPromotion,
  promoteClassicConstitutionChanges,
  publishClassicProjectionAuthority,
  resumeClassicConstitutionPromotion,
  type ClassicAuthorityEnvelopeCodec,
  type ClassicConstitutionPromotionService,
} from '@process/services/recovery/classicConstitutionPromotion';
import { canonicalizeRecoveryJson } from '@process/services/recovery/externalRecoveryCrypto';
import type {
  ConstitutionMutationResult,
  ConstitutionReadResult,
} from '@process/services/constitution/constitutionFsService';

const roots: string[] = [];
const vaultKey = Buffer.from('classic-promotion-test-vault-key');

function digest(value: Buffer | string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

const authenticatedCodec: ClassicAuthorityEnvelopeCodec = {
  securityClass: 'test-only',
  async sealFile(sourcePath, destinationPath) {
    const plaintext = await readFile(sourcePath);
    const envelope = JSON.stringify({
      plaintext: plaintext.toString('base64'),
      mac: createHmac('sha256', vaultKey).update(plaintext).digest('hex'),
    });
    const handle = await open(destinationPath, 'wx', 0o600);
    try {
      await handle.writeFile(envelope);
      await handle.sync();
    } finally {
      await handle.close();
    }
  },
  async unsealFile(sourcePath, destinationPath) {
    const envelope = JSON.parse(await readFile(sourcePath, 'utf8')) as { plaintext: string; mac: string };
    const plaintext = Buffer.from(envelope.plaintext, 'base64');
    const mac = createHmac('sha256', vaultKey).update(plaintext).digest('hex');
    if (mac !== envelope.mac) throw new Error('test vault authentication failed');
    const handle = await open(destinationPath, 'wx', 0o600);
    try {
      await handle.writeFile(plaintext);
      await handle.sync();
    } finally {
      await handle.close();
    }
  },
};

async function rewriteEnvelopeWithNonCanonicalJson(envelopePath: string): Promise<void> {
  const envelope = JSON.parse(await readFile(envelopePath, 'utf8')) as { plaintext: string; mac: string };
  const parsed = JSON.parse(Buffer.from(envelope.plaintext, 'base64').toString('utf8')) as unknown;
  const nonCanonical = Buffer.from(JSON.stringify(parsed, null, 2), 'utf8');
  envelope.plaintext = nonCanonical.toString('base64');
  envelope.mac = createHmac('sha256', vaultKey).update(nonCanonical).digest('hex');
  await writeFile(envelopePath, JSON.stringify(envelope));
}

async function addAuthenticatedUnknownField(envelopePath: string): Promise<void> {
  const envelope = JSON.parse(await readFile(envelopePath, 'utf8')) as { plaintext: string; mac: string };
  const parsed = JSON.parse(Buffer.from(envelope.plaintext, 'base64').toString('utf8')) as Record<string, unknown>;
  parsed.unknownAuthority = 'must-fail-closed';
  const canonical = canonicalizeRecoveryJson(parsed);
  envelope.plaintext = canonical.toString('base64');
  envelope.mac = createHmac('sha256', vaultKey).update(canonical).digest('hex');
  await writeFile(envelopePath, JSON.stringify(envelope));
}

async function readAuthenticatedTestPlaintext(envelopePath: string): Promise<Buffer> {
  const envelope = JSON.parse(await readFile(envelopePath, 'utf8')) as { plaintext: string; mac: string };
  const plaintext = Buffer.from(envelope.plaintext, 'base64');
  const mac = createHmac('sha256', vaultKey).update(plaintext).digest('hex');
  if (mac !== envelope.mac) throw new Error('test vault authentication failed');
  return plaintext;
}

async function readTerminalPromotionJournal(journalRoot: string): Promise<Record<string, unknown>> {
  const eventFile = readdirSync(journalRoot)
    .filter((name) => /^\d{6}-[a-f0-9]{64}\.sealed$/.test(name))
    .sort()
    .at(-1);
  if (!eventFile) throw new Error('promotion journal has no event');
  return JSON.parse(
    (await readAuthenticatedTestPlaintext(path.join(journalRoot, eventFile))).toString('utf8')
  ) as Record<string, unknown>;
}

type Stored = { content: string; revision: string } | null;

function fakeService(initial: Record<string, string>): ClassicConstitutionPromotionService & {
  content: (objectId: string) => string | null;
  force: (objectId: string, content: string | null) => void;
  calls: string[];
} {
  const state = new Map<string, Stored>();
  const receipts = new Map<string, ConstitutionMutationResult>();
  let sequence = 0;
  for (const [objectId, content] of Object.entries(initial))
    state.set(objectId, { content, revision: `rev:${++sequence}` });
  const read = (objectId: string): ConstitutionReadResult => {
    const value = state.get(objectId) ?? null;
    return value
      ? { status: 'present', content: value.content, revision: value.revision as never }
      : { status: 'absent', revision: `rev:absent:${objectId}` as never };
  };
  const mutate = (
    objectId: string,
    content: string | null,
    expectedRevision: string,
    requestId: string
  ): ConstitutionMutationResult => {
    const replay = receipts.get(requestId);
    if (replay) return replay;
    const current = read(objectId);
    if (current.revision !== expectedRevision) throw new Error(`CAS conflict for ${objectId}`);
    const revision = `rev:${++sequence}`;
    state.set(objectId, content === null ? null : { content, revision });
    const result: ConstitutionMutationResult = {
      status: 'committed',
      revision: revision as never,
      transactionId: requestId,
      receiptId: `${requestId}.jsonl`,
      requestFingerprint: digest(JSON.stringify({ objectId, content, expectedRevision })),
    };
    receipts.set(requestId, result);
    api.calls.push(`${objectId}:${requestId}`);
    return result;
  };
  const api = {
    readConstitution: () => read('constitution:CONSTITUTION.md'),
    writeConstitution: (content: string, expectedRevision: string, requestId: string) =>
      mutate('constitution:CONSTITUTION.md', content, expectedRevision, requestId),
    deleteConstitution: (expectedRevision: string, requestId: string) =>
      mutate('constitution:CONSTITUTION.md', null, expectedRevision, requestId),
    readSpecialist: (id: string) => read(`specialist:${id}`),
    writeSpecialist: (id: string, content: string, expectedRevision: string, requestId: string) =>
      mutate(`specialist:${id}`, content, expectedRevision, requestId),
    deleteSpecialist: (id: string, expectedRevision: string, requestId: string) =>
      mutate(`specialist:${id}`, null, expectedRevision, requestId),
    content: (objectId: string) => state.get(objectId)?.content ?? null,
    force: (objectId: string, content: string | null) =>
      state.set(objectId, content === null ? null : { content, revision: `rev:${++sequence}` }),
    calls: [] as string[],
  } satisfies ClassicConstitutionPromotionService & {
    content: (objectId: string) => string | null;
    force: (objectId: string, content: string | null) => void;
    calls: string[];
  };
  return api;
}

async function projection(primaryName: 'CONSTITUTION.md' | 'SOUL.md' = 'CONSTITUTION.md'): Promise<{
  root: string;
  authorityEnvelopePath: string;
  classicWaylandRoot: string;
}> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'classic-constitution-promotion-'));
  roots.push(root);
  const classicRoot = path.join(root, 'prepared-classic');
  const classicWaylandRoot = path.join(classicRoot, 'classic-home', '.wayland');
  await mkdir(path.join(classicWaylandRoot, 'specialists'), { recursive: true });
  const constitution = Buffer.from('# baseline\n');
  const research = Buffer.from('# research\n');
  await writeFile(path.join(classicWaylandRoot, primaryName), constitution);
  await writeFile(path.join(classicWaylandRoot, 'specialists', 'research.md'), research);
  const revisionEnvelope = Buffer.from('encrypted-v2-revision-authority');
  const authority = await publishClassicProjectionAuthority({
    recoveryAuthorityParent: path.join(root, 'external-recovery-authority'),
    preparationId: '11111111-1111-4111-8111-111111111111',
    classicRoot,
    sourceAppVersion: '0.11.18',
    candidateAppVersion: '0.12.0',
    producerCommit: 'classic-producer-commit',
    candidateCommit: 'candidate-commit',
    sourceSnapshotDigest: digest('snapshot'),
    sourceRevisionAuthorityEnvelopeSha256: digest(revisionEnvelope),
    sourceRevisionAuthorityEnvelope: revisionEnvelope,
    projectedFiles: [
      {
        restorePath: `constitution/files/${primaryName}`,
        classicPath: `classic-home/.wayland/${primaryName}`,
        size: constitution.length,
        sha256: digest(constitution),
        contentBase64: constitution.toString('base64'),
      },
      {
        restorePath: 'constitution/files/specialists/research.md',
        classicPath: 'classic-home/.wayland/specialists/research.md',
        size: research.length,
        sha256: digest(research),
        contentBase64: research.toString('base64'),
      },
    ],
    createdAt: '2026-07-16T00:00:00.000Z',
    authentication: 'test-only',
    codec: authenticatedCodec,
  });
  return { root, authorityEnvelopePath: authority.authorityEnvelopePath, classicWaylandRoot };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Classic Constitution promotion authority', () => {
  it('rejects legacy defaults and test codecs at production projection entrypoints', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-codec-boundary-'));
    roots.push(root);
    const classicRoot = path.join(root, 'classic-root');
    await mkdir(classicRoot, { recursive: true });
    const base = {
      recoveryAuthorityParent: path.join(root, 'authority'),
      preparationId: 'production-codec-boundary',
      classicRoot,
      sourceAppVersion: '0.11.18',
      candidateAppVersion: '0.12.0',
      producerCommit: 'producer',
      candidateCommit: 'candidate',
      sourceSnapshotDigest: digest('snapshot'),
      sourceRevisionAuthorityEnvelopeSha256: null,
      sourceRevisionAuthorityEnvelope: null,
      projectedFiles: [],
      createdAt: '2026-07-16T00:00:00.000Z',
      authentication: 'os-vault' as const,
    };
    await expect(publishClassicProjectionAuthority(base)).rejects.toThrow(/explicit external-recovery/);
    await expect(publishClassicProjectionAuthority({ ...base, codec: authenticatedCodec })).rejects.toThrow(
      /forbids plaintext, test-only, and legacy safeStorage/
    );
  });

  it('promotes canonical replace/create/delete changes through persisted CAS identities', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# changed\n');
    await rm(path.join(data.classicWaylandRoot, 'specialists', 'research.md'));
    await writeFile(path.join(data.classicWaylandRoot, 'specialists', 'draft.md'), '# draft\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });

    const result = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service,
      decision: { kind: 'promote' },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => '22222222-2222-4222-8222-222222222222',
        acquireQuiescence: async () => async () => undefined,
      },
    });

    expect(result.state).toBe('committed');
    expect(result.delta.items.map(({ objectId, operation }) => ({ objectId, operation }))).toEqual([
      { objectId: 'constitution:CONSTITUTION.md', operation: 'replace' },
      { objectId: 'specialist:draft', operation: 'create' },
      { objectId: 'specialist:research', operation: 'delete' },
    ]);
    expect(service.content('constitution:CONSTITUTION.md')).toBe('# changed\n');
    expect(service.content('specialist:draft')).toBe('# draft\n');
    expect(service.content('specialist:research')).toBeNull();
    expect(service.calls).toHaveLength(3);
  });

  it('maps a legacy SOUL primary to the one canonical Constitution destination', async () => {
    const data = await projection('SOUL.md');
    await writeFile(path.join(data.classicWaylandRoot, 'SOUL.md'), '# legacy changed\n');
    const service = fakeService({ 'constitution:CONSTITUTION.md': '# baseline\n' });

    const result = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service,
      decision: { kind: 'promote' },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => '23232323-2323-4323-8323-232323232323',
        acquireQuiescence: async () => async () => undefined,
      },
    });

    expect(result.state).toBe('committed');
    expect(service.content('constitution:CONSTITUTION.md')).toBe('# legacy changed\n');
    expect(service.calls).toHaveLength(1);
  });

  it('rejects simultaneous SOUL and CONSTITUTION primaries before any destination mutation', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'SOUL.md'), '# ambiguous\n');
    const service = fakeService({ 'constitution:CONSTITUTION.md': '# baseline\n' });

    await expect(
      promoteClassicConstitutionChanges({
        authorityEnvelopePath: data.authorityEnvelopePath,
        destinationAuthority: 'profile:default',
        service,
        decision: { kind: 'promote' },
        dependencies: {
          codec: authenticatedCodec,
          createId: () => '24242424-2424-4424-8424-242424242424',
          acquireQuiescence: async () => async () => undefined,
        },
      })
    ).rejects.toThrow('simultaneous primary files');
    expect(service.calls).toHaveLength(0);
  });

  it('replays a dispatched item with its persisted UUID after response loss and completes once', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# changed\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });
    let crashed = false;
    let journalRoot = '';
    try {
      await promoteClassicConstitutionChanges({
        authorityEnvelopePath: data.authorityEnvelopePath,
        destinationAuthority: 'profile:default',
        service,
        decision: { kind: 'promote' },
        dependencies: {
          codec: authenticatedCodec,
          createId: () => '33333333-3333-4333-8333-333333333333',
          acquireQuiescence: async () => async () => undefined,
          afterItemDispatch: () => {
            crashed = true;
            throw new Error('simulated process death after committed response was lost');
          },
        },
      });
    } catch (error) {
      expect(String(error)).toContain('simulated process death');
      journalRoot = path.join(
        data.root,
        'external-recovery-authority',
        '11111111-1111-4111-8111-111111111111',
        'promotions',
        '33333333-3333-4333-8333-333333333333'
      );
    }
    expect(crashed).toBe(true);
    expect(service.calls).toHaveLength(1);

    const resumed = await resumeClassicConstitutionPromotion({
      journalRoot,
      service,
      dependencies: { codec: authenticatedCodec, acquireQuiescence: async () => async () => undefined },
    });
    expect(resumed.state).toBe('committed');
    expect(service.calls).toHaveLength(1);
    expect(service.content('constitution:CONSTITUTION.md')).toBe('# changed\n');
  });

  it('records stable partial conflict evidence and resumes only the remaining pending items', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# changed\n');
    await rm(path.join(data.classicWaylandRoot, 'specialists', 'research.md'));
    await writeFile(path.join(data.classicWaylandRoot, 'specialists', 'draft.md'), '# draft\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });
    const writeDraft = service.writeSpecialist;
    let failDraft = true;
    service.writeSpecialist = (id, content, expectedRevision, requestId) => {
      if (id === 'draft' && failDraft) {
        failDraft = false;
        throw Object.assign(new Error('raw destination detail must not persist'), {
          code: 'CONSTITUTION_FS_CONFLICT',
        });
      }
      return writeDraft(id, content, expectedRevision, requestId);
    };

    const first = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service,
      decision: { kind: 'promote' },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => '12121212-1212-4212-8212-121212121212',
        acquireQuiescence: async () => async () => undefined,
      },
    });
    expect(first.state).toBe('partial');
    expect(service.content('constitution:CONSTITUTION.md')).toBe('# changed\n');
    expect(service.content('specialist:draft')).toBeNull();
    expect(service.content('specialist:research')).toBe('# research\n');
    if (!first.journalRoot) throw new Error('promotion did not publish a journal');
    const partial = await readTerminalPromotionJournal(first.journalRoot);
    expect(JSON.stringify(partial)).not.toContain('raw destination detail');
    expect(partial.state).toBe('partial');
    expect(
      (partial.items as Array<{ objectId: string; state: string; conflictCode: string | null }>).find(
        (item) => item.objectId === 'specialist:draft'
      )
    ).toMatchObject({ state: 'conflicted', conflictCode: 'STALE_DESTINATION' });

    const resumed = await resumeClassicConstitutionPromotion({
      journalRoot: first.journalRoot,
      service,
      dependencies: { codec: authenticatedCodec, acquireQuiescence: async () => async () => undefined },
    });
    expect(resumed.state).toBe('partial');
    expect(service.content('constitution:CONSTITUTION.md')).toBe('# changed\n');
    expect(service.content('specialist:draft')).toBeNull();
    expect(service.content('specialist:research')).toBeNull();
    expect(service.calls).toHaveLength(2);
  });

  it('turns a partial promotion into terminal local preservation without another destination mutation', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# changed\n');
    await writeFile(path.join(data.classicWaylandRoot, 'specialists', 'draft.md'), '# draft\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });
    service.writeSpecialist = () => {
      throw Object.assign(new Error('injected conflict'), { code: 'CONSTITUTION_FS_CONFLICT' });
    };
    const partial = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service,
      decision: { kind: 'promote' },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => '13131313-1313-4313-8313-131313131313',
        acquireQuiescence: async () => async () => undefined,
      },
    });
    expect(partial.state).toBe('partial');
    if (!partial.journalRoot) throw new Error('promotion did not publish a journal');
    const callsBeforePreservation = [...service.calls];

    const preserved = await preserveClassicConstitutionPromotion({
      journalRoot: partial.journalRoot,
      dependencies: { codec: authenticatedCodec },
    });
    expect(preserved).toMatchObject({
      state: 'rescued',
      promotionId: partial.promotionId,
      rescueEnvelopePath: partial.rescueEnvelopePath,
    });
    expect(service.calls).toEqual(callsBeforePreservation);
    expect(await readTerminalPromotionJournal(partial.journalRoot)).toMatchObject({ state: 'rescued' });

    const inspected = await inspectClassicConstitutionRecovery({
      authorityEnvelopePath: data.authorityEnvelopePath,
      codec: authenticatedCodec,
      promotionId: partial.promotionId!,
    });
    expect(inspected.journal?.state).toBe('rescued');
    expect(inspected.rescue).toMatchObject({
      rescueId: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      envelopeSha256: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
  });

  it('preserves both copies in authenticated rescue on concurrent v2 conflict', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# classic edit\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# concurrent v2 edit\n',
      'specialist:research': '# research\n',
    });
    const result = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service,
      decision: { kind: 'promote' },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => '44444444-4444-4444-8444-444444444444',
        acquireQuiescence: async () => async () => undefined,
      },
    });
    expect(result.state).toBe('conflicted');
    expect(result.rescueEnvelopePath).toMatch(/\.sealed$/);
    expect(service.content('constitution:CONSTITUTION.md')).toBe('# concurrent v2 edit\n');
    if (typeof result.rescueEnvelopePath !== 'string') {
      throw new Error(`invalid rescue path (${typeof result.rescueEnvelopePath}): ${JSON.stringify(result)}`);
    }
    expect((await readFile(result.rescueEnvelopePath)).byteLength).toBeGreaterThan(0);
  });

  it('rejects authenticated canonical projection records with unknown fields before any destination read or CAS', async () => {
    const data = await projection();
    await addAuthenticatedUnknownField(data.authorityEnvelopePath);
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });
    await expect(
      promoteClassicConstitutionChanges({
        authorityEnvelopePath: data.authorityEnvelopePath,
        destinationAuthority: 'profile:default',
        service,
        decision: { kind: 'promote' },
        dependencies: {
          codec: authenticatedCodec,
          createId: () => '34343434-3434-4434-8434-343434343434',
          acquireQuiescence: async () => async () => undefined,
        },
      })
    ).rejects.toThrow('missing or unknown fields');
    expect(service.calls).toHaveLength(0);
  });

  it('requires exact named-object confirmation before discard and retains rescue', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# classic edit\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });
    await expect(
      promoteClassicConstitutionChanges({
        authorityEnvelopePath: data.authorityEnvelopePath,
        destinationAuthority: 'profile:default',
        service,
        decision: { kind: 'confirmed-discard', confirmedObjectIds: [] },
        dependencies: {
          codec: authenticatedCodec,
          createId: () => '55555555-5555-4555-8555-555555555555',
          acquireQuiescence: async () => async () => undefined,
        },
      })
    ).rejects.toThrow('does not name the exact affected objects');

    const result = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service,
      decision: { kind: 'confirmed-discard', confirmedObjectIds: ['constitution:CONSTITUTION.md'] },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => '66666666-6666-4666-8666-666666666666',
        acquireQuiescence: async () => async () => undefined,
      },
    });
    expect(result.state).toBe('discarded');
    expect(result.rescueEnvelopePath).toMatch(/\.sealed$/);
    expect(service.content('constitution:CONSTITUTION.md')).toBe('# baseline\n');
  });

  it('keeps v2 unchanged while sealing the complete Classic delta for indefinite local recovery', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# classic edit\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# current v2\n',
      'specialist:research': '# research\n',
    });
    const result = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service,
      decision: { kind: 'keep-v2' },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => '67676767-6767-4767-8767-676767676767',
        acquireQuiescence: async () => async () => undefined,
      },
    });

    expect(result.state).toBe('rescued');
    expect(result.rescueEnvelopePath).toMatch(/\.sealed$/);
    expect(service.content('constitution:CONSTITUTION.md')).toBe('# current v2\n');
    expect(service.calls).toHaveLength(0);
  });

  it('surfaces a torn pending HEAD as authenticated reconciliation with no further CAS', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# changed\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });
    const result = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service,
      decision: { kind: 'promote' },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => '77777777-7777-4777-8777-777777777777',
        acquireQuiescence: async () => async () => undefined,
      },
    });
    if (!result.journalRoot) throw new Error('promotion did not publish a journal');
    await writeFile(path.join(result.journalRoot, `.HEAD.${'a'.repeat(36)}.sealed`), 'torn pending head');

    const reconciled = await resumeClassicConstitutionPromotion({
      journalRoot: result.journalRoot,
      service,
      dependencies: { codec: authenticatedCodec, acquireQuiescence: async () => async () => undefined },
    });
    expect(reconciled.state).toBe('reconciliation-required');
    expect(reconciled.rescueEnvelopePath).toMatch(/\.sealed$/);
    expect(service.calls).toHaveLength(1);
  });

  it('authenticates and finishes the exact claimed event after loss before HEAD publication', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# changed\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });
    const promotionId = '99999999-9999-4999-8999-999999999999';
    let failed = false;
    await expect(
      promoteClassicConstitutionChanges({
        authorityEnvelopePath: data.authorityEnvelopePath,
        destinationAuthority: 'profile:default',
        service,
        decision: { kind: 'promote' },
        dependencies: {
          codec: authenticatedCodec,
          createId: () => promotionId,
          acquireQuiescence: async () => async () => undefined,
          afterJournalEventSync: ({ sequence }) => {
            if (!failed && sequence === 0) {
              failed = true;
              throw new Error('simulated loss after event sync before HEAD publication');
            }
          },
        },
      })
    ).rejects.toThrow('simulated loss after event sync before HEAD publication');

    const journalRoot = path.join(
      data.root,
      'external-recovery-authority',
      '11111111-1111-4111-8111-111111111111',
      'promotions',
      promotionId
    );
    const resumed = await resumeClassicConstitutionPromotion({
      journalRoot,
      service,
      dependencies: { codec: authenticatedCodec, acquireQuiescence: async () => async () => undefined },
    });
    expect(resumed.state).toBe('committed');
    expect(service.content('constitution:CONSTITUTION.md')).toBe('# changed\n');
    expect(service.calls).toHaveLength(1);
  });

  it('seals the immutable rescue payload before dispatching the first destination CAS', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# changed\n');
    const base = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });
    const promotionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const rescueRoot = path.join(
      data.root,
      'external-recovery-authority',
      '11111111-1111-4111-8111-111111111111',
      'rescue'
    );
    const originalWrite = base.writeConstitution;
    base.writeConstitution = (content, expectedRevision, requestId) => {
      expect(existsSync(rescueRoot)).toBe(true);
      expect(readdirSync(rescueRoot).filter((name) => name.endsWith('.sealed'))).toHaveLength(1);
      return originalWrite(content, expectedRevision, requestId);
    };

    const result = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service: base,
      decision: { kind: 'promote' },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => promotionId,
        acquireQuiescence: async () => async () => undefined,
      },
    });
    expect(result.state).toBe('committed');
    expect(result.rescueEnvelopePath).toMatch(/\.sealed$/);
  });

  it('rejects a concurrent live journal writer before replay', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# changed\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });
    const result = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service,
      decision: { kind: 'promote' },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => '88888888-8888-4888-8888-888888888888',
        acquireQuiescence: async () => async () => undefined,
      },
    });
    if (!result.journalRoot) throw new Error('promotion did not publish a journal');
    await writeFile(
      path.join(result.journalRoot, 'writer.lock'),
      JSON.stringify({
        bootTimeMs: Date.now() - os.uptime() * 1000,
        hostname: os.hostname(),
        nonce: '99999999-9999-4999-8999-999999999999',
        pid: process.pid,
      }),
      { flag: 'wx', mode: 0o600 }
    );

    await expect(
      resumeClassicConstitutionPromotion({
        journalRoot: result.journalRoot,
        service,
        dependencies: { codec: authenticatedCodec, acquireQuiescence: async () => async () => undefined },
      })
    ).rejects.toThrow('already has an active writer');
  });

  it('rejects authenticated but noncanonical journal bytes before any replay', async () => {
    const data = await projection();
    await writeFile(path.join(data.classicWaylandRoot, 'CONSTITUTION.md'), '# changed\n');
    const service = fakeService({
      'constitution:CONSTITUTION.md': '# baseline\n',
      'specialist:research': '# research\n',
    });
    const result = await promoteClassicConstitutionChanges({
      authorityEnvelopePath: data.authorityEnvelopePath,
      destinationAuthority: 'profile:default',
      service,
      decision: { kind: 'promote' },
      dependencies: {
        codec: authenticatedCodec,
        createId: () => 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        acquireQuiescence: async () => async () => undefined,
      },
    });
    if (!result.journalRoot) throw new Error('promotion did not publish a journal');
    await rewriteEnvelopeWithNonCanonicalJson(path.join(result.journalRoot, 'HEAD.sealed'));

    const reconciled = await resumeClassicConstitutionPromotion({
      journalRoot: result.journalRoot,
      service,
      dependencies: { codec: authenticatedCodec, acquireQuiescence: async () => async () => undefined },
    });
    expect(reconciled.state).toBe('reconciliation-required');
    expect(service.calls).toHaveLength(1);
  });
});
