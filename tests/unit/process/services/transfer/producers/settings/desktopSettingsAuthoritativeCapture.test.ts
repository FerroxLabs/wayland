/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { captureDesktopSettingsSnapshot } from '@process/services/transfer/producers/settings';
import { JsonFileBuilder } from '@process/utils/initStorage';

const temporaryDirectories: string[] = [];

async function createStore() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wayland-settings-capture-'));
  temporaryDirectories.push(directory);
  return JsonFileBuilder<Record<string, unknown>>(path.join(directory, 'config.txt'));
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('authoritative Desktop settings capture', () => {
  it('holds the real storage lease across projection and releases it after capture', async () => {
    const store = await createStore();
    await store.set('theme', 'dark');

    const capture = await captureDesktopSettingsSnapshot({
      acquireConfigSnapshotLease: async () => {
        const lease = store.acquireSnapshotLease();
        return {
          epoch: lease.epoch,
          read: () => {
            expect(() => store.set('theme', 'light')).toThrow('Mutation blocked while snapshot lease is held');
            return lease.read();
          },
          release: lease.release,
        };
      },
    });

    expect(capture.authorityBindings[0].mutationEpoch).toBe('process-config:1');
    await expect(store.set('theme', 'light')).resolves.toBe('light');
  });

  it('fails capture while a real config mutation is pending', async () => {
    const store = await createStore();
    let continueMutation: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      continueMutation = resolve;
    });
    const mutation = store.update('theme', async () => {
      await gate;
      return 'dark';
    });

    const error = await captureDesktopSettingsSnapshot({
      acquireConfigSnapshotLease: async () => store.acquireSnapshotLease(),
    }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'SETTINGS_READ_FAILED' });
    continueMutation?.();
    await mutation;
  });
});
