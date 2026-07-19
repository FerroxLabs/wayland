import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  RECOVERY_MANIFEST_FORMAT_VERSION,
  type RecoveryManifest,
  validateRecoveryManifest,
  verifyRecoverySnapshot,
} from '@process/services/recovery/recoveryManifest';

const sha256 = (value: Buffer | string): string => createHash('sha256').update(value).digest('hex');

function makeManifest(fileBytes = Buffer.from('database-copy')): RecoveryManifest {
  return {
    formatVersion: RECOVERY_MANIFEST_FORMAT_VERSION,
    snapshotId: 'snapshot-fixture-1',
    state: 'complete',
    createdAt: '2026-07-15T00:00:00.000Z',
    reason: 'recovery-test',
    sourceAppVersion: '0.11.18',
    sourceReleaseTrack: 'stable',
    targetAppVersion: '0.12.0',
    desktopSchemaVersion: 53,
    platform: process.platform,
    arch: process.arch,
    mutationEpoch: { start: 'epoch-7', end: 'epoch-7' },
    authorities: [
      {
        id: 'desktop.database',
        sourceRoot: '/source/wayland.db',
        coverage: 'encrypted-copy',
        consistency: 'sqlite-online-backup',
        requiredForRestore: true,
        sensitive: true,
        fileIds: ['desktop-db'],
      },
      {
        id: 'desktop.config',
        sourceRoot: '/source/config',
        coverage: 'encrypted-copy',
        consistency: 'quiesced-copy',
        requiredForRestore: true,
        sensitive: true,
        fileIds: ['desktop-config'],
      },
      {
        id: 'desktop.runtime-files',
        sourceRoot: '/source/runtime-files',
        coverage: 'absent',
        consistency: 'not-applicable',
        requiredForRestore: false,
        sensitive: true,
        fileIds: [],
      },
      {
        id: 'constitution.filesystem',
        sourceRoot: '/source/constitution-filesystem',
        coverage: 'absent',
        consistency: 'not-applicable',
        requiredForRestore: false,
        sensitive: true,
        fileIds: [],
      },
      {
        id: 'constitution.revision-authority',
        sourceRoot: '/source/constitution/revision-authority.enc',
        coverage: 'absent',
        consistency: 'not-applicable',
        requiredForRestore: false,
        sensitive: true,
        fileIds: [],
        credentialBinding: {
          scope: 'same-device',
          backend: 'electron-safe-storage',
          envelope: 'constitution-revision-authority/v3',
        },
      },
      {
        id: 'core.default-profile',
        sourceRoot: '/source/core-default',
        coverage: 'absent',
        consistency: 'not-applicable',
        requiredForRestore: false,
        sensitive: true,
        fileIds: [],
      },
      {
        id: 'core.named-profiles',
        sourceRoot: '/source/core-profiles',
        coverage: 'absent',
        consistency: 'not-applicable',
        requiredForRestore: false,
        sensitive: true,
        fileIds: [],
      },
      {
        id: 'credentials.key-material',
        sourceRoot: '/source/.secret-key',
        coverage: 'excluded',
        consistency: 'not-applicable',
        requiredForRestore: false,
        sensitive: true,
        fileIds: [],
      },
      {
        id: 'credentials.os-keychain',
        sourceRoot: '<os-keychain>',
        coverage: 'excluded',
        consistency: 'not-applicable',
        requiredForRestore: false,
        sensitive: true,
        fileIds: [],
      },
      {
        id: 'updater.state',
        sourceRoot: '/source/updater',
        coverage: 'absent',
        consistency: 'not-applicable',
        requiredForRestore: false,
        sensitive: false,
        fileIds: [],
      },
      {
        id: 'external.agent-configs',
        sourceRoot: '<external-agent-configs>',
        coverage: 'reference-only',
        consistency: 'reference-snapshot',
        requiredForRestore: false,
        sensitive: true,
        fileIds: [],
        referenceIds: ['codex'],
        referenceBindings: [{ id: 'codex', path: '/home/user/.codex', state: 'directory' }],
      },
      {
        id: 'external.workspaces',
        sourceRoot: '<external>',
        coverage: 'reference-only',
        consistency: 'reference-snapshot',
        requiredForRestore: false,
        sensitive: false,
        fileIds: [],
        referenceIds: ['project-1'],
        referenceBindings: [{ id: 'project-1', path: '/work/book', state: 'directory' }],
      },
    ],
    logicalState: [
      {
        id: 'desktop.chats-projects',
        status: 'accounted',
        authorityIds: ['desktop.database'],
        note: 'Database fixture.',
      },
      {
        id: 'desktop.scheduler',
        status: 'accounted',
        authorityIds: ['desktop.database'],
        note: 'Database fixture.',
      },
      {
        id: 'desktop.workflows-teams',
        status: 'accounted',
        authorityIds: ['desktop.database'],
        note: 'Database fixture.',
      },
      {
        id: 'desktop.artifacts-receipts',
        status: 'reference-only',
        authorityIds: ['desktop.database', 'desktop.runtime-files', 'external.workspaces'],
        note: 'Mixed local and external fixture.',
      },
      {
        id: 'desktop.webui',
        status: 'accounted',
        authorityIds: ['desktop.config', 'desktop.runtime-files'],
        note: 'Config fixture.',
      },
      {
        id: 'desktop.preferences',
        status: 'accounted',
        authorityIds: ['desktop.config', 'desktop.runtime-files'],
        note: 'Config fixture.',
      },
      {
        id: 'core.engine-state',
        status: 'excluded',
        authorityIds: ['constitution.filesystem', 'core.default-profile', 'core.named-profiles'],
        note: 'Core absent in fixture.',
      },
      {
        id: 'external.backend-handles',
        status: 'reference-only',
        authorityIds: ['external.agent-configs', 'desktop.runtime-files'],
        note: 'External config fixture.',
      },
      {
        id: 'credentials.secrets',
        status: 'excluded',
        authorityIds: [
          'credentials.key-material',
          'credentials.os-keychain',
          'constitution.revision-authority',
          'constitution.filesystem',
          'desktop.config',
          'desktop.database',
        ],
        note: 'Credentials require reconnection in fixture.',
      },
      {
        id: 'updater.release-channel',
        status: 'accounted',
        authorityIds: ['updater.state'],
        note: 'Stable fixture.',
      },
      {
        id: 'external.workspaces',
        status: 'reference-only',
        authorityIds: ['external.workspaces'],
        note: 'Workspace fixture.',
      },
    ],
    files: [
      {
        id: 'desktop-db',
        authority: 'desktop.database',
        logicalRole: 'desktop SQLite backup',
        sourcePath: '/source/wayland.db',
        snapshotPath: 'state/desktop/wayland.db',
        restorePath: 'desktop/database/wayland.db',
        size: fileBytes.length,
        mtimeMs: 1,
        sha256: sha256(fileBytes),
        sensitive: true,
        copyPolicy: 'encrypted-copy',
        state: 'complete',
      },
      {
        id: 'desktop-config',
        authority: 'desktop.config',
        logicalRole: 'desktop config',
        sourcePath: '/source/config/config.json',
        snapshotPath: 'state/desktop/config.json',
        restorePath: 'desktop/config/config.json',
        size: 2,
        mtimeMs: 1,
        sha256: sha256('{}'),
        sensitive: true,
        copyPolicy: 'encrypted-copy',
        state: 'complete',
      },
    ],
    externalWorkspaces: [
      { projectId: 'project-1', path: '/work/book', state: 'directory', copyPolicy: 'reference-only' },
    ],
    externalAgentConfigs: [
      { backendId: 'codex', path: '/home/user/.codex', state: 'directory', copyPolicy: 'reference-only' },
    ],
  };
}

describe('recovery manifest validation', () => {
  const tempDirectories: string[] = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
  });

  it('accepts a complete manifest that accounts for every state authority', () => {
    const result = validateRecoveryManifest(makeManifest());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings.map((warning) => warning.code)).toContain('CREDENTIALS_NOT_RECOVERABLE');
  });

  it('rejects undeclared fields at every current-v3 manifest object boundary', () => {
    const mutations: Array<[string, (manifest: RecoveryManifest) => void]> = [
      ['unexpected', (manifest) => Object.assign(manifest, { unexpected: true })],
      ['mutationEpoch.unexpected', (manifest) => Object.assign(manifest.mutationEpoch, { unexpected: true })],
      ['files[0].unexpected', (manifest) => Object.assign(manifest.files[0], { unexpected: true })],
      ['authorities[0].unexpected', (manifest) => Object.assign(manifest.authorities[0], { unexpected: true })],
      [
        'authorities[4].credentialBinding.unexpected',
        (manifest) => Object.assign(manifest.authorities[4].credentialBinding!, { unexpected: true }),
      ],
      [
        'authorities[10].referenceBindings[0].unexpected',
        (manifest) => Object.assign(manifest.authorities[10].referenceBindings![0], { unexpected: true }),
      ],
      ['logicalState[0].unexpected', (manifest) => Object.assign(manifest.logicalState[0], { unexpected: true })],
      [
        'externalWorkspaces[0].unexpected',
        (manifest) => Object.assign(manifest.externalWorkspaces[0], { unexpected: true }),
      ],
      [
        'externalAgentConfigs[0].unexpected',
        (manifest) => Object.assign(manifest.externalAgentConfigs[0], { unexpected: true }),
      ],
    ];

    for (const [expectedPath, mutate] of mutations) {
      const manifest = makeManifest();
      mutate(manifest);
      const result = validateRecoveryManifest(manifest);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'FIELD_UNKNOWN', path: expectedPath })
      );
    }
  });

  it('accepts a legacy v1 recovery point without the later revision authority and marks migration required', () => {
    const legacy = structuredClone(makeManifest()) as unknown as {
      formatVersion: number;
      authorities: RecoveryManifest['authorities'];
      logicalState: RecoveryManifest['logicalState'];
    };
    legacy.formatVersion = 1;
    legacy.authorities = legacy.authorities.filter(
      ({ id }) => id !== 'constitution.revision-authority' && id !== 'constitution.filesystem'
    );
    const credentials = legacy.logicalState.find(({ id }) => id === 'credentials.secrets')!;
    credentials.authorityIds = credentials.authorityIds.filter(
      (id) => id !== 'constitution.revision-authority' && id !== 'constitution.filesystem'
    );
    const core = legacy.logicalState.find(({ id }) => id === 'core.engine-state')!;
    core.authorityIds = core.authorityIds.filter((id) => id !== 'constitution.filesystem');

    const result = validateRecoveryManifest(legacy);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings.map(({ code }) => code)).toContain('LEGACY_REVISION_AUTHORITY_ABSENT');
    expect(result.warnings.map(({ code }) => code)).toContain('LEGACY_CONSTITUTION_FILESYSTEM_ABSENT');
  });

  it('accepts the genuine first-writer v2 shape with neither reference IDs nor bindings', () => {
    const previous = structuredClone(makeManifest()) as unknown as {
      formatVersion: number;
      authorities: RecoveryManifest['authorities'];
    };
    previous.formatVersion = 2;
    // Commit 6fcc65fad wrote v2 before either external-authority binding field
    // existed. Preserve that exact absence rather than fabricating empty lists.
    for (const authority of previous.authorities) {
      delete authority.referenceIds;
      delete authority.referenceBindings;
    }

    const result = validateRecoveryManifest(previous);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each([
    ['referenceIds', 'referenceBindings'],
    ['referenceBindings', 'referenceIds'],
  ] as const)('rejects a v2 authority with %s but no %s', (presentField, missingField) => {
    const previous = structuredClone(makeManifest());
    previous.formatVersion = 2;
    const authority = previous.authorities.find(({ id }) => id === 'external.workspaces')!;
    delete authority[missingField];

    const result = validateRecoveryManifest(previous);

    expect(authority[presentField]).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.errors.map(({ code }) => code)).toContain(
      missingField === 'referenceIds'
        ? 'EXTERNAL_AUTHORITY_REFERENCE_IDS_INVALID'
        : 'EXTERNAL_AUTHORITY_REFERENCE_BINDING_MISMATCH'
    );
  });

  it('rejects omitted authorities and mutation during snapshot creation', () => {
    const manifest = makeManifest();
    manifest.mutationEpoch.end = 'epoch-8';
    manifest.authorities = manifest.authorities.filter((authority) => authority.id !== 'core.named-profiles');

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['MUTATION_DURING_SNAPSHOT', 'AUTHORITY_OMITTED'])
    );
  });

  it('rejects an external reference whose path or observed state no longer matches its authority evidence', () => {
    const manifest = makeManifest();
    manifest.externalWorkspaces[0] = {
      ...manifest.externalWorkspaces[0],
      path: '/work/attacker-controlled',
      state: 'file',
    };

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map(({ code }) => code)).toContain('EXTERNAL_AUTHORITY_REFERENCE_BINDING_MISMATCH');
  });

  it('rejects omitted or unaccounted logical state even when physical files validate', () => {
    const manifest = makeManifest();
    manifest.logicalState = manifest.logicalState.filter((entry) => entry.id !== 'desktop.webui');
    manifest.logicalState.find((entry) => entry.id === 'desktop.scheduler')!.status = 'missing';

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['LOGICAL_STATE_OMITTED', 'LOGICAL_STATE_MISSING'])
    );
  });

  it('rejects plaintext credential key material', () => {
    const manifest = makeManifest();
    const credentials = manifest.authorities.find((authority) => authority.id === 'credentials.key-material')!;
    credentials.coverage = 'copied';
    credentials.consistency = 'quiesced-copy';
    credentials.fileIds = ['secret-key'];
    manifest.files.push({
      id: 'secret-key',
      authority: 'credentials.key-material',
      logicalRole: 'headless credential key',
      sourcePath: '/source/.secret-key',
      snapshotPath: 'state/secrets/secret-key',
      restorePath: 'desktop/credentials/.secret-key',
      size: 32,
      mtimeMs: 1,
      sha256: 'a'.repeat(64),
      sensitive: true,
      copyPolicy: 'copied',
      state: 'complete',
    });

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['PLAINTEXT_SECRET', 'PLAINTEXT_SECRET_AUTHORITY'])
    );
  });

  it('requires the Constitution revision authority same-device OS-vault binding', () => {
    const manifest = makeManifest();
    const authority = manifest.authorities.find(({ id }) => id === 'constitution.revision-authority')!;
    delete authority.credentialBinding;

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map(({ code }) => code)).toContain('CONSTITUTION_REVISION_AUTHORITY_BINDING_INVALID');
  });

  it('rejects files with unknown authorities and orphaned evidence', () => {
    const manifest = makeManifest();
    manifest.files.push({
      id: 'orphan',
      authority: 'desktop.config',
      logicalRole: 'unowned config fragment',
      sourcePath: '/source/config/orphan.json',
      snapshotPath: 'state/desktop/orphan.json',
      restorePath: 'desktop/config/orphan.json',
      size: 2,
      mtimeMs: 1,
      sha256: sha256('{}'),
      sensitive: false,
      copyPolicy: 'copied',
      state: 'complete',
    });
    (manifest.files[0] as { authority: string }).authority = 'desktop.unknown';

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['FILE_AUTHORITY_INVALID', 'AUTHORITY_FILE_OWNERSHIP', 'FILE_UNREFERENCED'])
    );
  });

  it('rejects cross-authority and duplicate evidence references', () => {
    const manifest = makeManifest();
    const config = manifest.authorities.find((authority) => authority.id === 'desktop.config')!;
    config.fileIds.push('desktop-db');

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['AUTHORITY_FILE_OWNERSHIP', 'FILE_REFERENCED_MULTIPLE'])
    );
  });

  it('rejects traversal paths before reading snapshot files', () => {
    const manifest = makeManifest();
    manifest.files[0].snapshotPath = '../live/wayland.db';

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('SNAPSHOT_PATH_UNSAFE');
  });

  it('rejects duplicate and non-canonical snapshot artifact paths', () => {
    const manifest = makeManifest();
    const duplicate = { ...manifest.files[1], id: 'desktop-config-alias' };
    manifest.files.push(duplicate);
    manifest.authorities.find((authority) => authority.id === 'desktop.config')!.fileIds.push(duplicate.id);
    manifest.files[0].snapshotPath = 'state/desktop/./wayland.db';

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['SNAPSHOT_PATH_UNSAFE', 'SNAPSHOT_PATH_DUPLICATE'])
    );
  });

  it('rejects unsafe, duplicate, and cross-authority restore paths', () => {
    const manifest = makeManifest();
    manifest.files[0].restorePath = '../live/wayland.db';
    manifest.files[1].restorePath = 'desktop/database/config.json';

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['RESTORE_PATH_UNSAFE', 'RESTORE_PATH_NAMESPACE_INVALID'])
    );

    const duplicate = makeManifest();
    duplicate.files[1].restorePath = duplicate.files[0].restorePath;
    const duplicateResult = validateRecoveryManifest(duplicate);
    expect(duplicateResult.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['RESTORE_PATH_DUPLICATE'])
    );
  });

  it('fails closed on a structurally malformed external manifest without throwing', async () => {
    const result = await verifyRecoverySnapshot({ formatVersion: 1, files: 'not-an-array' }, '/untrusted');

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['FILES_INVALID', 'AUTHORITY_OMITTED', 'LOGICAL_STATE_OMITTED'])
    );
  });

  it('rejects logical overclaims and malformed external references', () => {
    const manifest = makeManifest();
    manifest.logicalState.find((entry) => entry.id === 'external.workspaces')!.status = 'accounted';
    manifest.externalWorkspaces.push({
      projectId: 'project-1',
      path: 'relative/book',
      state: 'absent',
      copyPolicy: 'reference-only',
    });

    const result = validateRecoveryManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        'LOGICAL_STATE_STATUS_MISMATCH',
        'EXTERNAL_REFERENCE_ID_INVALID',
        'EXTERNAL_REFERENCE_PATH_INVALID',
      ])
    );
  });

  it('binds external authority evidence one-to-one to the persisted reference identifiers', () => {
    const missing = makeManifest();
    delete missing.authorities.find(({ id }) => id === 'external.workspaces')!.referenceIds;
    expect(validateRecoveryManifest(missing).errors.map(({ code }) => code)).toContain(
      'EXTERNAL_AUTHORITY_REFERENCE_IDS_INVALID'
    );

    const reordered = makeManifest();
    reordered.externalWorkspaces.push({
      projectId: 'project-2',
      path: '/work/second',
      state: 'directory',
      copyPolicy: 'reference-only',
    });
    reordered.authorities.find(({ id }) => id === 'external.workspaces')!.referenceIds = ['project-2', 'project-1'];
    expect(validateRecoveryManifest(reordered).errors.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['EXTERNAL_AUTHORITY_REFERENCE_MISMATCH'])
    );

    const duplicate = makeManifest();
    duplicate.authorities.find(({ id }) => id === 'external.agent-configs')!.referenceIds = ['codex', 'codex'];
    expect(validateRecoveryManifest(duplicate).errors.map(({ code }) => code)).toContain(
      'EXTERNAL_AUTHORITY_REFERENCE_MISMATCH'
    );
  });

  it('verifies snapshot sizes and hashes and detects post-manifest drift', async () => {
    const databaseBytes = Buffer.from('database-copy');
    const manifest = makeManifest(databaseBytes);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-manifest-'));
    tempDirectories.push(root);
    fs.mkdirSync(path.join(root, 'state/desktop'), { recursive: true });
    fs.writeFileSync(path.join(root, 'state/desktop/wayland.db'), databaseBytes);
    fs.writeFileSync(path.join(root, 'state/desktop/config.json'), '{}');

    await expect(verifyRecoverySnapshot(manifest, root)).resolves.toMatchObject({ valid: true, errors: [] });

    fs.writeFileSync(path.join(root, 'state/desktop/wayland.db'), 'tampered-copy-longer');
    const drifted = await verifyRecoverySnapshot(manifest, root);
    expect(drifted.valid).toBe(false);
    expect(drifted.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['SNAPSHOT_SIZE_MISMATCH', 'SNAPSHOT_HASH_MISMATCH'])
    );
  });

  it('rejects an artifact that is present in the snapshot but absent from the manifest', async () => {
    const databaseBytes = Buffer.from('database-copy');
    const manifest = makeManifest(databaseBytes);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-manifest-'));
    tempDirectories.push(root);
    fs.mkdirSync(path.join(root, 'state/desktop'), { recursive: true });
    fs.writeFileSync(path.join(root, 'state/desktop/wayland.db'), databaseBytes);
    fs.writeFileSync(path.join(root, 'state/desktop/config.json'), '{}');
    fs.writeFileSync(path.join(root, 'state/desktop/unlisted.bin'), 'not authenticated by the manifest');

    const result = await verifyRecoverySnapshot(manifest, root);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'SNAPSHOT_ARTIFACT_UNLISTED',
          path: 'state/desktop/unlisted.bin',
        }),
      ])
    );
  });

  it('rejects a symlinked ancestor even when the final artifact is a regular file', async () => {
    const manifest = makeManifest();
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-manifest-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-outside-'));
    tempDirectories.push(root, outside);
    fs.mkdirSync(path.join(outside, 'desktop'), { recursive: true });
    fs.writeFileSync(path.join(outside, 'desktop/wayland.db'), 'database-copy');
    fs.writeFileSync(path.join(outside, 'desktop/config.json'), '{}');
    fs.symlinkSync(outside, path.join(root, 'state'));

    const result = await verifyRecoverySnapshot(manifest, root);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('SNAPSHOT_FILE_TYPE');
    expect(result.errors.some((error) => error.message.includes('symbolic link'))).toBe(true);
  });
});
