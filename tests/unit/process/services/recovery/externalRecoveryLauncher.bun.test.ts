/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, mock } from 'bun:test';
import { createHash } from 'node:crypto';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createDriver } from '@process/services/database/drivers/createDriver';
import {
  classicRecoveryExtractionPlanFor,
  launchClassicRecovery,
  launchPinnedClassicRecoverySnapshot,
  parseMacClassicPublisherEvidence,
  parseWindowsClassicPublisherEvidence,
  prepareClassicRecovery,
  prepareClassicRecoverySnapshot,
  spawnPreparedClassicRecovery,
} from '@process/services/recovery/externalRecoveryLauncher';
import type {
  LaunchPinnedClassicRecoverySnapshotDependencies,
  PreparedClassicReleaseBinary,
  TestOnlyClassicBinaryTrustReceipt,
} from '@process/services/recovery/externalRecoveryLauncher';
import type { IsolatedRecoveryReceipt } from '@process/services/recovery/isolatedRecovery';
import { readDatabaseSchemaVersionStrict } from '@process/services/recovery/startupCompatibility';
import { classicRecoveryArtifactFor } from '@process/services/recovery/classicReleaseTrust';

const roots: string[] = [];
const fixtureBinaryTrust: TestOnlyClassicBinaryTrustReceipt = {
  contract: 'wayland-classic-binary-trust-test-only/1.0',
  source: 'test-only',
  fixtureId: 'external-recovery-launcher-fixture',
  authorizesClassicBinaryLaunch: false,
};
const acceptFixtureBinaryTrust = async (): Promise<TestOnlyClassicBinaryTrustReceipt> => fixtureBinaryTrust;

function sha256(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function encodeConfig(value: Record<string, unknown>): string {
  return Buffer.from(encodeURIComponent(JSON.stringify(value)), 'utf8').toString('base64');
}

function decodeConfig(value: string): Record<string, unknown> {
  return JSON.parse(decodeURIComponent(Buffer.from(value, 'base64').toString('utf8'))) as Record<string, unknown>;
}

async function exists(candidate: string): Promise<boolean> {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function makeDatabase(databasePath: string): Promise<void> {
  await mkdir(path.dirname(databasePath), { recursive: true });
  const driver = await createDriver(databasePath);
  try {
    driver.exec('CREATE TABLE model_registry_providers (provider_id TEXT PRIMARY KEY)');
    driver.exec(`CREATE TABLE model_registry_custom_models (
      provider_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (provider_id, model_id),
      FOREIGN KEY (provider_id) REFERENCES model_registry_providers(provider_id) ON DELETE CASCADE
    )`);
    driver.exec('CREATE TABLE cron_jobs (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1)');
    driver.exec('CREATE TABLE assistant_plugins (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0)');
    driver.exec(`CREATE TABLE workflow_sessions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'active',
      run_mode TEXT NOT NULL DEFAULT 'running'
    )`);
    driver.prepare('INSERT INTO model_registry_providers (provider_id) VALUES (?)').run('flux');
    driver
      .prepare('INSERT INTO model_registry_custom_models (provider_id, model_id, created_at) VALUES (?, ?, ?)')
      .run('flux', 'post-baseline-model', 10);
    driver.exec("INSERT INTO cron_jobs (id, enabled) VALUES ('daily', 1)");
    driver.exec("INSERT INTO assistant_plugins (id, enabled) VALUES ('slack', 1)");
    driver.exec("INSERT INTO workflow_sessions (id, status, run_mode) VALUES ('flow', 'active', 'running')");
    driver.pragma('user_version = 53');
  } finally {
    driver.close();
  }
}

async function fixture(): Promise<{
  root: string;
  materializedRoot: string;
  liveUserDataRoot: string;
  destinationRoot: string;
  binaryPath: string;
  binarySha256: string;
  sourceDatabase: string;
}> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wayland-classic-recovery-'));
  roots.push(root);
  const materializedRoot = path.join(root, 'materialized');
  const liveUserDataRoot = path.join(root, 'live-user-data');
  const destinationRoot = path.join(root, 'prepared-classic');
  const binaryPath = path.join(root, 'Wayland-0.11.8');
  await mkdir(materializedRoot, { recursive: true });
  await mkdir(liveUserDataRoot, { recursive: true });
  await writeFile(path.join(liveUserDataRoot, 'sentinel'), 'live-do-not-touch');
  await writeFile(binaryPath, '#!/bin/sh\necho 0.11.8\n', { mode: 0o700 });
  const binarySha256 = sha256(await readFile(binaryPath));

  const sourceDatabase = path.join(materializedRoot, 'desktop', 'database', 'wayland.db');
  await makeDatabase(sourceDatabase);
  const config = encodeConfig({
    'system.firstRunDefaultsApplied': false,
    'system.closeToTray': true,
    'models.autoRefresh': true,
    'ambient.enabled': true,
    'webhook.connectionTokens': [{ token: 'must-not-survive' }],
  });
  const env = encodeConfig({ 'wayland.dir': { cacheDir: path.join(root, 'live-external-cache') } });
  const files = new Map<string, string | Buffer>([
    ['desktop/config/wayland-config.txt', config],
    ['desktop/config/.wayland-env', env],
    ['desktop/runtime/analytics.json', '{"events":1}'],
    ['core/default/config.toml', 'model = "test"'],
    ['core/profiles/.active', 'research'],
    ['core/profiles/research/config.toml', 'model = "research"'],
    ['desktop/credentials/.secret-key', 'local-secret-key'],
    ['desktop/updater/pending-update.json', '{"version":"0.99.0"}'],
  ]);
  for (const [relative, contents] of files) {
    const destination = path.join(materializedRoot, ...relative.split('/'));
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, contents, { mode: 0o600 });
  }

  const authority = (restorePath: string): IsolatedRecoveryReceipt['files'][number]['authority'] => {
    if (restorePath === 'desktop/database/wayland.db') return 'desktop.database';
    if (restorePath.startsWith('desktop/config/')) return 'desktop.config';
    if (restorePath.startsWith('desktop/runtime/')) return 'desktop.runtime-files';
    if (restorePath.startsWith('core/default/')) return 'core.default-profile';
    if (restorePath.startsWith('core/profiles/')) return 'core.named-profiles';
    if (restorePath.startsWith('desktop/credentials/')) return 'credentials.key-material';
    return 'updater.state';
  };
  const restorePaths = ['desktop/database/wayland.db', ...files.keys()];
  const receiptFiles: IsolatedRecoveryReceipt['files'] = [];
  for (const restorePath of restorePaths) {
    const contents = await readFile(path.join(materializedRoot, ...restorePath.split('/')));
    receiptFiles.push({
      authority: authority(restorePath),
      restorePath,
      size: contents.length,
      sha256: sha256(contents),
    });
  }
  const receipt: IsolatedRecoveryReceipt = {
    formatVersion: 1,
    snapshotId: 'snapshot-53',
    sourceAppVersion: '0.11.18',
    desktopSchemaVersion: 53,
    materializedAt: '2026-07-16T01:00:00.000Z',
    liveStateTouched: false,
    database: { schemaVersion: 53, integrity: 'ok' },
    files: receiptFiles,
  };
  await writeFile(path.join(materializedRoot, 'isolated-recovery-receipt.json'), JSON.stringify(receipt, null, 2), {
    mode: 0o600,
  });
  return { root, materializedRoot, liveUserDataRoot, destinationRoot, binaryPath, binarySha256, sourceDatabase };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Classic external recovery launcher', () => {
  it('builds deterministic extraction plans for every release delivery type', () => {
    expect(
      classicRecoveryExtractionPlanFor({
        artifactPath: '/asset/Wayland.zip',
        runtimeRoot: '/runtime',
        platform: 'darwin',
        arch: 'arm64',
      })
    ).toEqual({
      kind: 'ditto-zip',
      binaryPath: path.join('/runtime', 'Wayland.app', 'Contents', 'MacOS', 'Wayland'),
      command: '/usr/bin/ditto',
      args: ['-x', '-k', '/asset/Wayland.zip', '/runtime'],
    });
    expect(
      classicRecoveryExtractionPlanFor({
        artifactPath: 'C:\\asset\\Wayland.exe',
        runtimeRoot: 'C:\\runtime',
        platform: 'win32',
        arch: 'x64',
        windowsExtractorPath: 'C:\\tools\\7za.exe',
      })
    ).toEqual({
      kind: 'seven-zip-nsis',
      binaryPath: 'C:\\runtime\\Wayland.exe',
      command: 'C:\\tools\\7za.exe',
      args: ['x', '-y', '-bd', '-bso0', '-bsp0', '-oC:\\runtime', 'C:\\asset\\Wayland.exe'],
    });
    expect(
      classicRecoveryExtractionPlanFor({
        artifactPath: '/asset/Wayland.AppImage',
        runtimeRoot: '/runtime',
        platform: 'linux',
        arch: 'x64',
      })
    ).toMatchObject({
      kind: 'direct-appimage',
      command: null,
      binaryPath: path.join('/runtime', 'Wayland-0.11.8-linux-x86_64.AppImage'),
    });
  });

  it('refuses a Windows extraction plan without a verified packaged extractor', () => {
    expect(() =>
      classicRecoveryExtractionPlanFor({
        artifactPath: 'Wayland.exe',
        runtimeRoot: 'runtime',
        platform: 'win32',
        arch: 'arm64',
      })
    ).toThrow('no verified NSIS extractor');
  });

  it('requires exact macOS publisher, team, bundle, and notarization evidence lines', () => {
    const descriptor = classicRecoveryArtifactFor('darwin', 'arm64');
    const exact = [
      `Authority=${descriptor.publisher.identity}`,
      `TeamIdentifier=${descriptor.publisher.teamId}`,
      `Identifier=${descriptor.publisher.bundleId}`,
      'Notarization Ticket=stapled',
    ].join('\n');

    expect(parseMacClassicPublisherEvidence(exact, descriptor).verification).toBe('verified');
    expect(() => parseMacClassicPublisherEvidence(`${exact}.lookalike`, descriptor)).toThrow(
      'does not match the pinned publisher identity'
    );
  });

  it('requires one exact Windows signer common name and valid Authenticode status', () => {
    const descriptor = classicRecoveryArtifactFor('win32', 'x64');
    const exact = JSON.stringify({ Status: 'Valid', Subject: 'CN=Ferrox Labs, O=Ferrox Labs LLC, C=US' });

    expect(parseWindowsClassicPublisherEvidence(exact, descriptor).observedIdentity).toContain('CN=Ferrox Labs');
    expect(() =>
      parseWindowsClassicPublisherEvidence(
        JSON.stringify({ Status: 'Valid', Subject: 'CN=Not Ferrox Labs, O=Ferrox Labs LLC, C=US' }),
        descriptor
      )
    ).toThrow('does not have valid Ferrox Labs Authenticode provenance');
    expect(() => parseWindowsClassicPublisherEvidence('{', descriptor)).toThrow('malformed evidence');
  });

  it('publishes a schema-52, side-effect-neutralized tree isolated from Desktop and Core live state', async () => {
    const data = await fixture();
    const prepared = await prepareClassicRecovery(
      {
        materializedRoot: data.materializedRoot,
        destinationRoot: data.destinationRoot,
        liveUserDataRoot: data.liveUserDataRoot,
        classicBinaryPath: data.binaryPath,
        classicBinarySha256: data.binarySha256,
      },
      {
        verifyClassicBinaryTrust: acceptFixtureBinaryTrust,
        now: () => new Date('2026-07-16T02:00:00.000Z'),
        createPreparationId: () => 'fixed-preparation',
      }
    );

    expect(await readFile(path.join(data.liveUserDataRoot, 'sentinel'), 'utf8')).toBe('live-do-not-touch');
    const sourceDriver = await createDriver(data.sourceDatabase, { fileMustExist: true });
    try {
      expect(readDatabaseSchemaVersionStrict(sourceDriver)).toBe(53);
      expect(sourceDriver.prepare('SELECT enabled FROM cron_jobs WHERE id = ?').get('daily')).toEqual({ enabled: 1 });
    } finally {
      sourceDriver.close();
    }

    const targetDatabase = path.join(prepared.desktopUserDataRoot, 'wayland', 'wayland.db');
    const targetDriver = await createDriver(targetDatabase, { fileMustExist: true });
    try {
      expect(readDatabaseSchemaVersionStrict(targetDriver)).toBe(52);
      expect(targetDriver.prepare('SELECT enabled FROM cron_jobs WHERE id = ?').get('daily')).toEqual({ enabled: 0 });
      expect(targetDriver.prepare('SELECT enabled FROM assistant_plugins WHERE id = ?').get('slack')).toEqual({
        enabled: 0,
      });
      expect(targetDriver.prepare('SELECT run_mode FROM workflow_sessions WHERE id = ?').get('flow')).toEqual({
        run_mode: 'awaiting_input',
      });
    } finally {
      targetDriver.close();
    }

    const hardenedConfig = decodeConfig(
      await readFile(path.join(prepared.desktopUserDataRoot, 'config', 'wayland-config.txt'), 'utf8')
    );
    expect(hardenedConfig).toMatchObject({
      'system.firstRunDefaultsApplied': true,
      'system.closeToTray': false,
      'models.autoRefresh': false,
      'ambient.enabled': false,
      'webhook.connectionTokens': [],
    });
    expect(await exists(path.join(prepared.desktopUserDataRoot, 'config', '.wayland-env'))).toBe(false);
    expect(await exists(path.join(prepared.desktopUserDataRoot, 'pending-update.json'))).toBe(false);
    expect(await readFile(path.join(prepared.desktopUserDataRoot, 'analytics.json'), 'utf8')).toBe('{"events":1}');
    expect(await readFile(path.join(prepared.coreDefaultRoot, 'config.toml'), 'utf8')).toBe('model = "test"');
    expect(await readFile(path.join(prepared.homeRoot, '.wayland', 'profiles', '.active'), 'utf8')).toBe('research');
    expect(prepared.args).toEqual([`--user-data-dir=${prepared.desktopUserDataRoot}`]);
    expect(prepared.envOverrides).toMatchObject({
      WAYLAND_DISABLE_AUTO_UPDATE: '1',
      WAYLAND_HOME: prepared.coreDefaultRoot,
      HOME: prepared.homeRoot,
    });
    expect(prepared.receipt).toMatchObject({
      recovery: 'classic-v0.11.8',
      liveStateTouched: false,
      databaseSafety: { cronJobsDisabled: 1, channelPluginsDisabled: 1, workflowSessionsParked: 1 },
      isolation: { pendingUpdateRestored: false, externalReferencesCopied: false },
      classic: {
        binaryTrust: {
          contract: 'wayland-classic-binary-trust-test-only/1.0',
          authorizesClassicBinaryLaunch: false,
        },
      },
    });
  });

  it('fails closed when a materialized file no longer matches its receipt', async () => {
    const data = await fixture();
    await writeFile(path.join(data.materializedRoot, 'desktop', 'runtime', 'analytics.json'), 'tampered');

    await expect(
      prepareClassicRecovery(
        {
          materializedRoot: data.materializedRoot,
          destinationRoot: data.destinationRoot,
          liveUserDataRoot: data.liveUserDataRoot,
          classicBinaryPath: data.binaryPath,
          classicBinarySha256: data.binarySha256,
        },
        { verifyClassicBinaryTrust: acceptFixtureBinaryTrust }
      )
    ).rejects.toThrow('does not match its receipt');
    expect(await exists(data.destinationRoot)).toBe(false);
  });

  it('never executes an untrusted binary to discover its version', async () => {
    const data = await fixture();
    const executionMarker = path.join(data.root, 'binary-was-executed');
    const script = `#!/bin/sh\ntouch ${JSON.stringify(executionMarker)}\necho 0.11.8\n`;
    await writeFile(data.binaryPath, script, { mode: 0o700 });
    const binarySha256 = sha256(script);
    await expect(
      prepareClassicRecovery({
        materializedRoot: data.materializedRoot,
        destinationRoot: data.destinationRoot,
        liveUserDataRoot: data.liveUserDataRoot,
        classicBinaryPath: data.binaryPath,
        classicBinarySha256: binarySha256,
      })
    ).rejects.toThrow('compiled v0.11.8 executable pin');
    expect(await exists(executionMarker)).toBe(false);
    expect(await exists(data.destinationRoot)).toBe(false);
  });

  it('rejects a Classic binary that does not match the caller-pinned digest', async () => {
    const data = await fixture();
    await expect(
      prepareClassicRecovery(
        {
          materializedRoot: data.materializedRoot,
          destinationRoot: data.destinationRoot,
          liveUserDataRoot: data.liveUserDataRoot,
          classicBinaryPath: data.binaryPath,
          classicBinarySha256: '0'.repeat(64),
        },
        { verifyClassicBinaryTrust: acceptFixtureBinaryTrust }
      )
    ).rejects.toThrow('does not match its required SHA-256 pin');
    expect(await exists(data.destinationRoot)).toBe(false);
  });

  it('refuses a destination inside live userData', async () => {
    const data = await fixture();
    await expect(
      prepareClassicRecovery(
        {
          materializedRoot: data.materializedRoot,
          destinationRoot: path.join(data.liveUserDataRoot, 'rollback'),
          liveUserDataRoot: data.liveUserDataRoot,
          classicBinaryPath: data.binaryPath,
          classicBinarySha256: data.binarySha256,
        },
        { verifyClassicBinaryTrust: acceptFixtureBinaryTrust }
      )
    ).rejects.toThrow('disjoint from live Wayland userData');
  });

  it('spawns Classic only with the prepared isolated arguments and environment', async () => {
    const data = await fixture();
    const unref = mock(() => undefined);
    const spawnClassic = mock(() => ({ unref }) as unknown as ReturnType<typeof import('node:child_process').spawn>);

    const prepared = await launchClassicRecovery(
      {
        materializedRoot: data.materializedRoot,
        destinationRoot: data.destinationRoot,
        liveUserDataRoot: data.liveUserDataRoot,
        classicBinaryPath: data.binaryPath,
        classicBinarySha256: data.binarySha256,
      },
      { verifyClassicBinaryTrust: acceptFixtureBinaryTrust, spawnClassic }
    );

    expect(spawnClassic).toHaveBeenCalledTimes(1);
    const [binary, args, options] = spawnClassic.mock.calls[0];
    expect(binary).toBe(prepared.binaryPath);
    expect(args).toEqual([`--user-data-dir=${prepared.desktopUserDataRoot}`]);
    expect(options).toMatchObject({
      detached: true,
      stdio: 'ignore',
      env: {
        WAYLAND_DISABLE_AUTO_UPDATE: '1',
        WAYLAND_HOME: prepared.coreDefaultRoot,
        HOME: prepared.homeRoot,
      },
    });
    expect(unref).toHaveBeenCalledTimes(1);
  });

  it('revalidates one stable binary trust identity before preparation publication and spawn', async () => {
    const data = await fixture();
    const verifyClassicBinaryTrust = mock(async () => fixtureBinaryTrust);
    const spawnClassic = mock(
      () => ({ unref: () => undefined }) as unknown as ReturnType<typeof import('node:child_process').spawn>
    );

    await launchClassicRecovery(
      {
        materializedRoot: data.materializedRoot,
        destinationRoot: data.destinationRoot,
        liveUserDataRoot: data.liveUserDataRoot,
        classicBinaryPath: data.binaryPath,
        classicBinarySha256: data.binarySha256,
      },
      { verifyClassicBinaryTrust, spawnClassic }
    );

    expect(verifyClassicBinaryTrust).toHaveBeenCalledTimes(3);
    expect(spawnClassic).toHaveBeenCalledTimes(1);
  });

  it('refuses publication when binary trust identity changes between gates', async () => {
    const data = await fixture();
    let call = 0;
    const verifyClassicBinaryTrust = async (): Promise<TestOnlyClassicBinaryTrustReceipt> => ({
      ...fixtureBinaryTrust,
      fixtureId: call++ === 0 ? fixtureBinaryTrust.fixtureId : 'changed-fixture-trust',
    });

    await expect(
      prepareClassicRecovery(
        {
          materializedRoot: data.materializedRoot,
          destinationRoot: data.destinationRoot,
          liveUserDataRoot: data.liveUserDataRoot,
          classicBinaryPath: data.binaryPath,
          classicBinarySha256: data.binarySha256,
        },
        { verifyClassicBinaryTrust }
      )
    ).rejects.toThrow('trust identity changed between recovery gates');
    expect(await exists(data.destinationRoot)).toBe(false);
  });

  it('forbids test-only trust receipts outside the test runtime', async () => {
    const data = await fixture();
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(
        prepareClassicRecovery(
          {
            materializedRoot: data.materializedRoot,
            destinationRoot: data.destinationRoot,
            liveUserDataRoot: data.liveUserDataRoot,
            classicBinaryPath: data.binaryPath,
            classicBinarySha256: data.binarySha256,
          },
          { verifyClassicBinaryTrust: acceptFixtureBinaryTrust }
        )
      ).rejects.toThrow('test-only binary trust is forbidden outside the test runtime');
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
    expect(await exists(data.destinationRoot)).toBe(false);
  });

  it('refuses launch when the pinned Classic binary changes after preparation', async () => {
    const data = await fixture();
    const prepared = await prepareClassicRecovery(
      {
        materializedRoot: data.materializedRoot,
        destinationRoot: data.destinationRoot,
        liveUserDataRoot: data.liveUserDataRoot,
        classicBinaryPath: data.binaryPath,
        classicBinarySha256: data.binarySha256,
      },
      { verifyClassicBinaryTrust: acceptFixtureBinaryTrust }
    );
    await writeFile(data.binaryPath, '#!/bin/sh\necho compromised\n', { mode: 0o700 });
    const spawnClassic = mock(() => {
      throw new Error('must not spawn');
    });

    await expect(spawnPreparedClassicRecovery(prepared, spawnClassic)).rejects.toThrow(
      'changed after recovery preparation'
    );
    expect(spawnClassic).not.toHaveBeenCalled();
  });

  it('chains snapshot materialization into preparation and removes the transient plaintext tree', async () => {
    const data = await fixture();
    const snapshotRoot = path.join(data.root, 'sealed-snapshot');
    await mkdir(snapshotRoot);
    const prepared = await prepareClassicRecoverySnapshot(
      {
        snapshotRoot,
        destinationRoot: data.destinationRoot,
        liveUserDataRoot: data.liveUserDataRoot,
        classicBinaryPath: data.binaryPath,
        classicBinarySha256: data.binarySha256,
      },
      {
        verifyClassicBinaryTrust: acceptFixtureBinaryTrust,
        materializeSnapshot: async (_snapshot, destination) =>
          cp(data.materializedRoot, destination, { recursive: true }),
      }
    );

    expect(prepared.destinationRoot).toBe(await realpath(data.destinationRoot));
    expect((await readdir(data.root)).some((name) => name.startsWith('.wayland-classic-materialized-'))).toBe(false);
  });

  it('downloads, prepares, materializes, and launches the pinned release as one action', async () => {
    const data = await fixture();
    const snapshotRoot = path.join(data.root, 'sealed-snapshot');
    const binaryRuntime = path.join(data.root, 'pinned-binary-runtime');
    await mkdir(snapshotRoot);
    await mkdir(binaryRuntime);
    const calls: string[] = [];

    const downloadReleaseArtifact: NonNullable<
      LaunchPinnedClassicRecoverySnapshotDependencies['downloadReleaseArtifact']
    > = async (input) => {
      calls.push('download');
      const artifactPath = path.join(input.destinationDirectory, 'pinned-release-asset');
      await writeFile(artifactPath, 'verified-release-fixture');
      return { artifactPath, receipt: {} as never };
    };
    const preparedBinary = {
      contract: 'wayland-classic-binary-preparation/1.0',
      runtimeRoot: binaryRuntime,
      binaryPath: data.binaryPath,
      binarySha256: data.binarySha256,
      asset: {} as never,
      binaryTrust: {} as never,
      receiptPath: path.join(binaryRuntime, 'classic-binary-preparation-receipt.json'),
      authorizesClassicRecoveryLaunch: false,
    } satisfies PreparedClassicReleaseBinary;
    const prepareReleaseBinary: NonNullable<
      LaunchPinnedClassicRecoverySnapshotDependencies['prepareReleaseBinary']
    > = async (input) => {
      calls.push('prepare-binary');
      expect(await readFile(input.artifactPath, 'utf8')).toBe('verified-release-fixture');
      return preparedBinary;
    };
    const spawnPreparedRecovery: NonNullable<
      LaunchPinnedClassicRecoverySnapshotDependencies['spawnPreparedRecovery']
    > = async () => {
      calls.push('spawn');
      return { unref: () => undefined } as never;
    };

    const launched = await launchPinnedClassicRecoverySnapshot(
      {
        snapshotRoot,
        destinationRoot: data.destinationRoot,
        liveUserDataRoot: data.liveUserDataRoot,
      },
      {
        downloadReleaseArtifact,
        prepareReleaseBinary,
        materializeSnapshot: async (_snapshot, destination) => {
          calls.push('materialize');
          await cp(data.materializedRoot, destination, { recursive: true });
        },
        verifyClassicBinaryTrust: acceptFixtureBinaryTrust,
        spawnPreparedRecovery,
      }
    );

    expect(calls).toEqual(['download', 'prepare-binary', 'materialize', 'spawn']);
    expect(launched.binary).toBe(preparedBinary);
    expect(launched.recovery.destinationRoot).toBe(await realpath(data.destinationRoot));
    expect(await exists(binaryRuntime)).toBe(true);
    expect((await readdir(data.root)).some((name) => name.startsWith('.wayland-classic-release-'))).toBe(false);
    expect(await readFile(path.join(data.liveUserDataRoot, 'sentinel'), 'utf8')).toBe('live-do-not-touch');
  });

  it('removes the acquired release and prepared binary runtime when snapshot preparation fails', async () => {
    const data = await fixture();
    const binaryRuntime = path.join(data.root, 'failed-pinned-binary-runtime');
    await mkdir(binaryRuntime);
    const preparedBinary = {
      contract: 'wayland-classic-binary-preparation/1.0',
      runtimeRoot: binaryRuntime,
      binaryPath: data.binaryPath,
      binarySha256: data.binarySha256,
      asset: {} as never,
      binaryTrust: {} as never,
      receiptPath: path.join(binaryRuntime, 'classic-binary-preparation-receipt.json'),
      authorizesClassicRecoveryLaunch: false,
    } satisfies PreparedClassicReleaseBinary;

    await expect(
      launchPinnedClassicRecoverySnapshot(
        {
          snapshotRoot: path.join(data.root, 'snapshot'),
          destinationRoot: data.destinationRoot,
          liveUserDataRoot: data.liveUserDataRoot,
        },
        {
          downloadReleaseArtifact: async (input) => {
            const artifactPath = path.join(input.destinationDirectory, 'asset');
            await writeFile(artifactPath, 'asset');
            return { artifactPath, receipt: {} as never };
          },
          prepareReleaseBinary: async () => preparedBinary,
          prepareRecoverySnapshot: async () => {
            throw new Error('materialization refused');
          },
        }
      )
    ).rejects.toThrow('materialization refused');

    expect(await exists(binaryRuntime)).toBe(false);
    expect((await readdir(data.root)).some((name) => name.startsWith('.wayland-classic-release-'))).toBe(false);
    expect(await exists(data.destinationRoot)).toBe(false);
  });
});
