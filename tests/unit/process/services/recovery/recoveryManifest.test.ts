import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  type RecoveryManifest,
  validateRecoveryManifest,
  verifyRecoverySnapshot,
} from '@process/services/recovery/recoveryManifest';

const sha256 = (value: Buffer | string): string => createHash('sha256').update(value).digest('hex');

function makeManifest(fileBytes = Buffer.from('database-copy')): RecoveryManifest {
  return {
    formatVersion: 1,
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
      },
      {
        id: 'external.workspaces',
        sourceRoot: '<external>',
        coverage: 'reference-only',
        consistency: 'reference-snapshot',
        requiredForRestore: false,
        sensitive: false,
        fileIds: [],
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
        authorityIds: ['core.default-profile', 'core.named-profiles'],
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
        authorityIds: ['credentials.key-material', 'credentials.os-keychain', 'desktop.config', 'desktop.database'],
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
