import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  parseRecoveryCaptureCommand,
  parseClassicRecoveryReleaseDownloadCommand,
  parseClassicRecoveryBinaryPreparationCommand,
  parseClassicRecoveryLaunchCommand,
  parseClassicRecoverySnapshotLaunchCommand,
  parseRecoveryMaterializationCommand,
  parseRecoveryVerificationCommand,
  runRecoveryVerificationCommand,
} from '@process/services/recovery/recoveryCli';

describe('Classic recovery release download command', () => {
  it('parses one explicit destination and is absent from ordinary startup', () => {
    expect(parseClassicRecoveryReleaseDownloadCommand(['Wayland'])).toBeNull();
    expect(
      parseClassicRecoveryReleaseDownloadCommand([
        'Wayland',
        '--download-classic-recovery-release',
        '/tmp/classic-release',
      ])
    ).toEqual({
      kind: 'download-classic-recovery-release',
      destinationDirectory: '/tmp/classic-release',
    });
  });

  it('fails closed on missing and duplicate destinations', () => {
    expect(() => parseClassicRecoveryReleaseDownloadCommand(['--download-classic-recovery-release'])).toThrow(
      'requires a path'
    );
    expect(() =>
      parseClassicRecoveryReleaseDownloadCommand([
        '--download-classic-recovery-release',
        '/tmp/one',
        '--download-classic-recovery-release',
        '/tmp/two',
      ])
    ).toThrow('may be provided only once');
  });
});

describe('Classic recovery binary preparation command', () => {
  it('parses an exact release asset and isolated destination parent', () => {
    const argv = [
      '--prepare-classic-recovery-binary',
      '/tmp/Wayland-0.11.8.zip',
      '--recovery-destination',
      '/tmp/classic-runtime',
    ];
    expect(parseClassicRecoveryBinaryPreparationCommand(argv)).toEqual({
      kind: 'prepare-classic-recovery-binary',
      artifactPath: '/tmp/Wayland-0.11.8.zip',
      destinationParent: '/tmp/classic-runtime',
    });
    expect(parseClassicRecoveryLaunchCommand(argv)).toBeNull();
  });

  it('fails closed without a destination parent', () => {
    expect(() =>
      parseClassicRecoveryBinaryPreparationCommand(['--prepare-classic-recovery-binary', '/tmp/Wayland-0.11.8.zip'])
    ).toThrow('--recovery-destination is required');
  });
});

describe('recovery capture command', () => {
  it('parses one explicit destination and is absent from ordinary startup', () => {
    expect(parseRecoveryCaptureCommand(['Wayland'])).toBeNull();
    expect(parseRecoveryCaptureCommand(['Wayland', '--create-recovery-snapshot', '/tmp/recovery'])).toEqual({
      kind: 'create-recovery-snapshot',
      destinationRoot: '/tmp/recovery',
    });
  });

  it('fails closed on missing and duplicate destinations', () => {
    expect(() => parseRecoveryCaptureCommand(['--create-recovery-snapshot'])).toThrow('requires a path');
    expect(() =>
      parseRecoveryCaptureCommand(['--create-recovery-snapshot', '/tmp/one', '--create-recovery-snapshot', '/tmp/two'])
    ).toThrow('may be provided only once');
  });
});

describe('external recovery materialization command', () => {
  it('parses an explicit snapshot and new destination without colliding with Classic launch parsing', () => {
    const argv = [
      'Wayland',
      '--materialize-recovery-snapshot',
      '/tmp/snapshot',
      '--recovery-destination',
      '/tmp/materialized',
    ];
    expect(parseRecoveryMaterializationCommand(argv)).toEqual({
      kind: 'materialize-recovery-snapshot',
      snapshotRoot: '/tmp/snapshot',
      destinationRoot: '/tmp/materialized',
    });
    expect(parseClassicRecoveryLaunchCommand(argv)).toBeNull();
  });

  it('fails closed when the materialization destination is absent', () => {
    expect(() => parseRecoveryMaterializationCommand(['--materialize-recovery-snapshot', '/tmp/snapshot'])).toThrow(
      '--recovery-destination is required'
    );
  });
});

describe('external Classic recovery launcher command', () => {
  const binarySha256 = 'a'.repeat(64);

  it('is absent during ordinary startup and parses exactly three explicit paths', () => {
    expect(parseClassicRecoveryLaunchCommand(['Wayland'])).toBeNull();
    expect(
      parseClassicRecoveryLaunchCommand([
        'Wayland',
        '--launch-classic-recovery',
        '/tmp/materialized',
        '--classic-binary',
        '/Applications/Wayland 0.11.8.app/Contents/MacOS/Wayland',
        '--classic-binary-sha256',
        binarySha256,
        '--recovery-destination',
        '/tmp/classic-recovery',
      ])
    ).toEqual({
      kind: 'launch-classic-recovery',
      materializedRoot: '/tmp/materialized',
      classicBinaryPath: '/Applications/Wayland 0.11.8.app/Contents/MacOS/Wayland',
      classicBinarySha256: binarySha256,
      destinationRoot: '/tmp/classic-recovery',
    });
  });

  it('fails closed on partial, missing-value, and duplicate launcher options', () => {
    expect(() => parseClassicRecoveryLaunchCommand(['--classic-binary', '/tmp/classic'])).toThrow(
      '--launch-classic-recovery is required'
    );
    expect(() => parseClassicRecoveryLaunchCommand(['--launch-classic-recovery', '/tmp/materialized'])).toThrow(
      '--classic-binary is required'
    );
    expect(() =>
      parseClassicRecoveryLaunchCommand([
        '--launch-classic-recovery',
        '/tmp/materialized',
        '--classic-binary',
        '--classic-binary-sha256',
        binarySha256,
        '--recovery-destination',
        '/tmp/destination',
      ])
    ).toThrow('--classic-binary requires a path');
    expect(() =>
      parseClassicRecoveryLaunchCommand([
        '--launch-classic-recovery',
        '/tmp/one',
        '--launch-classic-recovery',
        '/tmp/two',
        '--classic-binary',
        '/tmp/classic',
        '--classic-binary-sha256',
        binarySha256,
        '--recovery-destination',
        '/tmp/destination',
      ])
    ).toThrow('--launch-classic-recovery may be provided only once');
    expect(() =>
      parseClassicRecoveryLaunchCommand([
        '--launch-classic-recovery',
        '/tmp/materialized',
        '--classic-binary',
        '/tmp/classic',
        '--classic-binary-sha256',
        'not-a-digest',
        '--recovery-destination',
        '/tmp/destination',
      ])
    ).toThrow('requires a lowercase 64-character SHA-256 digest');
  });
});

describe('one-step recovery-snapshot to Classic launcher command', () => {
  const binarySha256 = 'b'.repeat(64);

  it('parses the raw snapshot source and cannot collide with the materialized-tree launcher', () => {
    const argv = [
      '--launch-classic-recovery-snapshot',
      '/tmp/snapshot',
      '--classic-binary',
      '/tmp/classic',
      '--classic-binary-sha256',
      binarySha256,
      '--recovery-destination',
      '/tmp/recovered',
    ];
    expect(parseClassicRecoverySnapshotLaunchCommand(argv)).toEqual({
      kind: 'launch-classic-recovery-snapshot',
      binarySource: 'provided',
      snapshotRoot: '/tmp/snapshot',
      classicBinaryPath: '/tmp/classic',
      classicBinarySha256: binarySha256,
      destinationRoot: '/tmp/recovered',
    });
    expect(parseClassicRecoveryLaunchCommand(argv)).toBeNull();
  });

  it('selects the exact compiled release as a one-action binary source', () => {
    const argv = [
      '--launch-classic-recovery-snapshot',
      '/tmp/snapshot',
      '--use-pinned-classic-release',
      '--recovery-destination',
      '/tmp/recovered',
    ];
    expect(parseClassicRecoverySnapshotLaunchCommand(argv)).toEqual({
      kind: 'launch-classic-recovery-snapshot',
      binarySource: 'pinned-release',
      snapshotRoot: '/tmp/snapshot',
      destinationRoot: '/tmp/recovered',
    });
    expect(parseClassicRecoveryLaunchCommand(argv)).toBeNull();
  });

  it('fails closed when pinned acquisition is mixed with caller-provided binary identity', () => {
    expect(() =>
      parseClassicRecoverySnapshotLaunchCommand([
        '--launch-classic-recovery-snapshot',
        '/tmp/snapshot',
        '--use-pinned-classic-release',
        '--classic-binary',
        '/tmp/classic',
        '--classic-binary-sha256',
        binarySha256,
        '--recovery-destination',
        '/tmp/recovered',
      ])
    ).toThrow('cannot be combined');
    expect(() => parseClassicRecoverySnapshotLaunchCommand(['--use-pinned-classic-release'])).toThrow(
      '--launch-classic-recovery-snapshot is required'
    );
    expect(() =>
      parseClassicRecoverySnapshotLaunchCommand([
        '--launch-classic-recovery-snapshot',
        '/tmp/snapshot',
        '--use-pinned-classic-release',
        '--use-pinned-classic-release',
        '--recovery-destination',
        '/tmp/recovered',
      ])
    ).toThrow('may be provided only once');
  });
});

describe('external recovery verifier command', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  it('is absent during ordinary startup and parses one explicit snapshot root', () => {
    expect(parseRecoveryVerificationCommand(['Wayland'])).toBeNull();
    expect(parseRecoveryVerificationCommand(['Wayland', '--verify-recovery-snapshot', '/tmp/snapshot'])).toEqual({
      kind: 'verify-recovery-snapshot',
      snapshotRoot: '/tmp/snapshot',
    });
  });

  it('rejects a missing or duplicated root flag', () => {
    expect(() => parseRecoveryVerificationCommand(['--verify-recovery-snapshot'])).toThrow(
      'requires a snapshot directory'
    );
    expect(() =>
      parseRecoveryVerificationCommand(['--verify-recovery-snapshot', '/one', '--verify-recovery-snapshot', '/two'])
    ).toThrow('may be provided only once');
  });

  it('fails closed on malformed manifests without throwing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-cli-'));
    roots.push(root);
    fs.writeFileSync(path.join(root, 'manifest.json'), '{not-json');

    await expect(
      runRecoveryVerificationCommand({ kind: 'verify-recovery-snapshot', snapshotRoot: root })
    ).resolves.toMatchObject({ valid: false, errors: [expect.objectContaining({ code: 'MANIFEST_UNREADABLE' })] });
  });

  it('refuses snapshot-root and manifest symlinks', async () => {
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-cli-'));
    roots.push(parent);
    const realRoot = path.join(parent, 'real');
    fs.mkdirSync(realRoot);
    fs.writeFileSync(path.join(realRoot, 'manifest-target.json'), '{}');
    fs.symlinkSync('manifest-target.json', path.join(realRoot, 'manifest.json'));
    const alias = path.join(parent, 'alias');
    fs.symlinkSync(realRoot, alias, 'dir');

    await expect(
      runRecoveryVerificationCommand({ kind: 'verify-recovery-snapshot', snapshotRoot: alias })
    ).resolves.toMatchObject({ valid: false, errors: [expect.objectContaining({ code: 'SNAPSHOT_ROOT_INVALID' })] });
    await expect(
      runRecoveryVerificationCommand({ kind: 'verify-recovery-snapshot', snapshotRoot: realRoot })
    ).resolves.toMatchObject({ valid: false, errors: [expect.objectContaining({ code: 'MANIFEST_FILE_INVALID' })] });
  });
});
