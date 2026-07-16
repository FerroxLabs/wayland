/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createDriver } from '@process/services/database/drivers/createDriver';
import { readDatabaseSchemaVersionStrict } from '@process/services/recovery/startupCompatibility';
import { transformDesktopState53To52 } from '@process/services/recovery/recoveryStateTransformer';

const roots: string[] = [];

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wayland-transform-test-'));
  roots.push(root);
  return root;
}

async function makeSourceDatabase(root: string, schemaVersion = 53, includeCustomTable = true): Promise<string> {
  const databasePath = path.join(root, 'source', 'wayland.db');
  await mkdir(path.dirname(databasePath), { recursive: true });
  const driver = await createDriver(databasePath);
  try {
    driver.exec(`CREATE TABLE model_registry_providers (provider_id TEXT PRIMARY KEY)`);
    driver.exec(`CREATE TABLE cron_jobs (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1)`);
    driver.exec(`CREATE TABLE assistant_plugins (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0)`);
    driver.exec(`CREATE TABLE workflow_sessions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'active',
      run_mode TEXT NOT NULL DEFAULT 'running'
    )`);
    driver.exec("INSERT INTO cron_jobs (id, enabled) VALUES ('enabled-job', 1), ('disabled-job', 0)");
    driver.exec("INSERT INTO assistant_plugins (id, enabled) VALUES ('enabled-channel', 1), ('disabled-channel', 0)");
    driver.exec(
      "INSERT INTO workflow_sessions (id, status, run_mode) VALUES ('running-flow', 'active', 'running'), ('parked-flow', 'active', 'awaiting_input'), ('complete-flow', 'complete', 'done')"
    );
    if (includeCustomTable) {
      driver.exec(`CREATE TABLE model_registry_custom_models (
        provider_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (provider_id, model_id),
        FOREIGN KEY (provider_id) REFERENCES model_registry_providers(provider_id) ON DELETE CASCADE
      )`);
      driver.prepare('INSERT INTO model_registry_providers (provider_id) VALUES (?)').run('openrouter');
      driver
        .prepare(
          'INSERT INTO model_registry_custom_models (provider_id, model_id, created_at) VALUES (?, ?, ?)'
        )
        .run('openrouter', '@preset/alpha', 10);
      driver
        .prepare(
          'INSERT INTO model_registry_custom_models (provider_id, model_id, created_at) VALUES (?, ?, ?)'
        )
        .run('openrouter', 'vendor/private-model', 20);
    }
    driver.pragma(`user_version = ${schemaVersion}`);
  } finally {
    driver.close();
  }
  return databasePath;
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

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('transformDesktopState53To52', () => {
  it('atomically creates schema 52 while preserving source and exporting post-baseline models', async () => {
    const root = await tempRoot();
    const source = await makeSourceDatabase(root);
    const destination = path.join(root, 'transformed');

    const result = await transformDesktopState53To52(source, destination, {
      now: () => new Date('2026-07-16T00:00:00.000Z'),
      createTransformId: () => 'fixed-transform',
    });

    const sourceDriver = await createDriver(source, { fileMustExist: true });
    try {
      expect(readDatabaseSchemaVersionStrict(sourceDriver)).toBe(53);
      expect(
        sourceDriver.prepare('SELECT COUNT(*) AS count FROM model_registry_custom_models').get()
      ).toEqual({ count: 2 });
    } finally {
      sourceDriver.close();
    }

    const targetDriver = await createDriver(result.databasePath, { fileMustExist: true });
    try {
      expect(readDatabaseSchemaVersionStrict(targetDriver)).toBe(52);
      expect(() => targetDriver.prepare('SELECT 1 FROM model_registry_custom_models').get()).toThrow();
      expect(targetDriver.pragma('integrity_check')).toEqual([{ integrity_check: 'ok' }]);
      expect(targetDriver.pragma('foreign_key_check')).toEqual([]);
      expect(targetDriver.prepare('SELECT id, enabled FROM cron_jobs ORDER BY id').all()).toEqual([
        { id: 'disabled-job', enabled: 0 },
        { id: 'enabled-job', enabled: 0 },
      ]);
      expect(targetDriver.prepare('SELECT id, enabled FROM assistant_plugins ORDER BY id').all()).toEqual([
        { id: 'disabled-channel', enabled: 0 },
        { id: 'enabled-channel', enabled: 0 },
      ]);
      expect(targetDriver.prepare('SELECT id, run_mode FROM workflow_sessions ORDER BY id').all()).toEqual([
        { id: 'complete-flow', run_mode: 'done' },
        { id: 'parked-flow', run_mode: 'awaiting_input' },
        { id: 'running-flow', run_mode: 'awaiting_input' },
      ]);
    } finally {
      targetDriver.close();
    }

    const exported = JSON.parse(await readFile(result.customModelExportPath, 'utf8')) as {
      reimportRequired: boolean;
      customModels: Array<{ providerId: string; modelId: string; createdAt: number }>;
    };
    expect(exported.reimportRequired).toBe(true);
    expect(exported.customModels).toEqual([
      { providerId: 'openrouter', modelId: '@preset/alpha', createdAt: 10 },
      { providerId: 'openrouter', modelId: 'vendor/private-model', createdAt: 20 },
    ]);
    expect(result.receipt).toMatchObject({
      transform: 'desktop-schema-53-to-52',
      transformedAt: '2026-07-16T00:00:00.000Z',
      liveStateTouched: false,
      source: { schemaVersion: 53 },
      target: { schemaVersion: 52, integrity: 'ok', foreignKeys: 'ok' },
      customModels: { count: 2, reimportRequired: true },
      safety: { cronJobsDisabled: 1, channelPluginsDisabled: 1, workflowSessionsParked: 1 },
    });
    expect(result.receipt.source.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.receipt.target.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.receipt.customModels.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('fails closed for a source schema other than 53 and publishes nothing', async () => {
    const root = await tempRoot();
    const source = await makeSourceDatabase(root, 52);
    const destination = path.join(root, 'transformed');

    await expect(transformDesktopState53To52(source, destination)).rejects.toThrow(
      'requires schema 53, received 52'
    );
    expect(await exists(destination)).toBe(false);
  });

  it('fails closed when the schema-53 custom-model table is missing', async () => {
    const root = await tempRoot();
    const source = await makeSourceDatabase(root, 53, false);
    const destination = path.join(root, 'transformed');

    await expect(transformDesktopState53To52(source, destination)).rejects.toThrow();
    expect(await exists(destination)).toBe(false);
  });

  it('never replaces an existing destination', async () => {
    const root = await tempRoot();
    const source = await makeSourceDatabase(root);
    const destination = path.join(root, 'transformed');
    await mkdir(destination);

    await expect(transformDesktopState53To52(source, destination)).rejects.toThrow('already exists');
  });

  it('fails closed when the source has SQLite sidecar state', async () => {
    const root = await tempRoot();
    const source = await makeSourceDatabase(root);
    const destination = path.join(root, 'transformed');
    await writeFile(`${source}-wal`, 'uncheckpointed');

    await expect(transformDesktopState53To52(source, destination)).rejects.toThrow(
      'not a quiescent single-file SQLite image'
    );
    expect(await exists(destination)).toBe(false);
  });

  it('uses a safe staging prefix when an injected transform id sanitizes to empty', async () => {
    const root = await tempRoot();
    const source = await makeSourceDatabase(root);
    const destination = path.join(root, 'transformed');

    const result = await transformDesktopState53To52(source, destination, {
      createTransformId: () => '///',
    });

    expect(result.destinationRoot).toBe(path.join(await realpath(path.dirname(destination)), path.basename(destination)));
    expect(await exists(result.databasePath)).toBe(true);
  });
});
