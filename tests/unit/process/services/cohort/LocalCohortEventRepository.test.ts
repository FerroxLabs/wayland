/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CohortBaselineService } from '@process/services/cohort/CohortBaselineService';
import { LocalM0BCohortEventRepository } from '@process/services/cohort/LocalCohortEventRepository';
import { createM0BClassicBaselineConfig } from '@process/services/cohort/policy';
import { M0B_DAY_MS, type M0BCohortEvent } from '@process/services/cohort/types';

const START = 1_800_000_000_000;
const END = START + 14 * M0B_DAY_MS;
const roots: string[] = [];

function event(overrides: Partial<M0BCohortEvent> = {}): M0BCohortEvent {
  return {
    schemaVersion: 1,
    eventId: 'event-000001',
    participantIdHash: 'a'.repeat(16),
    sessionId: 'session-0001',
    occurredAtMs: START + 1_000,
    cohort: 'novice',
    shell: 'classic',
    kind: 'session_started',
    ...overrides,
  } as M0BCohortEvent;
}

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wayland-m0b-cohort-'));
  roots.push(root);
  return root;
}

function repository(
  rootDirectory: string,
  overrides: Partial<ConstructorParameters<typeof LocalM0BCohortEventRepository>[0]> = {}
): LocalM0BCohortEventRepository {
  return new LocalM0BCohortEventRepository({
    rootDirectory,
    windowStartMs: START,
    windowEndMs: END,
    ...overrides,
  });
}

function eventDirectory(root: string): string {
  return path.join(root, `${START}-${END}`);
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('LocalM0BCohortEventRepository consent and privacy boundary', () => {
  it('creates no local telemetry store before explicit service consent', async () => {
    const root = path.join(await tempRoot(), 'events');
    const service = new CohortBaselineService(
      repository(root),
      createM0BClassicBaselineConfig({
        appVersion: '0.11.18-wave0',
        windowStartMs: START,
        privacyMode: 'local-aggregate-only',
      }),
      { enabled: false, acceptedAtMs: null }
    );

    await expect(service.record(event())).resolves.toEqual({ status: 'disabled' });
    await expect(lstat(root)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('persists only the closed event shape when an object inherits a hostile serializer', async () => {
    const root = path.join(await tempRoot(), 'events');
    const input = Object.assign(
      Object.create({
        toJSON: () => ({ ...event(), prompt: 'private customer request' }),
      }) as M0BCohortEvent,
      event()
    );

    await repository(root).append(input);
    const stored = await readFile(path.join(eventDirectory(root), 'event-000001.event.json'), 'utf8');
    expect(stored).not.toContain('private customer request');
    expect(JSON.parse(stored)).toEqual(event());
  });

  it('restricts storage directories and event files to the current OS user', async () => {
    const root = path.join(await tempRoot(), 'events');
    await mkdir(root, { mode: 0o777 });
    if (process.platform !== 'win32') await chmod(root, 0o777);

    await repository(root).append(event());
    if (process.platform === 'win32') return;
    expect((await lstat(root)).mode & 0o077).toBe(0);
    expect((await lstat(eventDirectory(root))).mode & 0o077).toBe(0);
    expect((await lstat(path.join(eventDirectory(root), 'event-000001.event.json'))).mode & 0o077).toBe(0);
  });
});

describe('LocalM0BCohortEventRepository durability and authority', () => {
  it('recovers events through a new repository instance and orders them deterministically', async () => {
    const root = path.join(await tempRoot(), 'events');
    const first = repository(root);
    await first.append(event({ eventId: 'event-000002', occurredAtMs: START + 2_000 }));
    await first.append(event());

    const restarted = repository(root);
    await expect(restarted.findWindow(START, END)).resolves.toEqual([
      event(),
      event({ eventId: 'event-000002', occurredAtMs: START + 2_000 }),
    ]);
  });

  it('treats an exact duplicate as an idempotent retry', async () => {
    const root = path.join(await tempRoot(), 'events');
    const store = repository(root);
    await Promise.all([store.append(event()), store.append(event())]);

    const names = await readdir(eventDirectory(root));
    expect(names.filter((name) => name.endsWith('.event.json'))).toEqual(['event-000001.event.json']);
  });

  it('rejects a conflicting event id even when competing writers race', async () => {
    const root = path.join(await tempRoot(), 'events');
    const store = repository(root);
    const results = await Promise.allSettled([
      store.append(event()),
      store.append(event({ occurredAtMs: START + 2_000 })),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    expect(rejected?.reason).toMatchObject({ message: 'M0B_CONFLICTING_EVENT_ID' });
  });

  it('does not expose a partially written temporary event', async () => {
    const root = path.join(await tempRoot(), 'events');
    const store = repository(root);
    await store.findWindow(START, END);
    await writeFile(
      path.join(eventDirectory(root), '.event-000001.event.json.00000000-0000-4000-8000-000000000000.tmp'),
      '{',
      {
        mode: 0o600,
      }
    );

    await expect(store.findWindow(START, END)).resolves.toEqual([]);
  });
});

describe('LocalM0BCohortEventRepository hostile persisted state', () => {
  it('fails closed when an event file is corrupt', async () => {
    const root = path.join(await tempRoot(), 'events');
    const store = repository(root);
    await store.findWindow(START, END);
    await writeFile(path.join(eventDirectory(root), 'event-000001.event.json'), '{', { mode: 0o600 });

    await expect(store.findWindow(START, END)).rejects.toThrow('M0B_CORRUPT_EVENT_FILE');
  });

  it('revalidates privacy fields when reading persisted events', async () => {
    const root = path.join(await tempRoot(), 'events');
    const store = repository(root);
    await store.findWindow(START, END);
    await writeFile(
      path.join(eventDirectory(root), 'event-000001.event.json'),
      JSON.stringify({ ...event(), prompt: 'must not be collected' }),
      { mode: 0o600 }
    );

    await expect(store.findWindow(START, END)).rejects.toThrow('M0B_INVALID_STORED_EVENT:forbidden_field:prompt');
  });

  it('rejects a valid event moved outside its bound observation window', async () => {
    const root = path.join(await tempRoot(), 'events');
    const store = repository(root);
    await store.findWindow(START, END);
    await writeFile(
      path.join(eventDirectory(root), 'event-000001.event.json'),
      JSON.stringify(event({ occurredAtMs: END })),
      { mode: 0o600 }
    );

    await expect(store.findWindow(START, END)).rejects.toThrow('M0B_EVENT_OUTSIDE_OBSERVATION_WINDOW');
  });

  it('rejects a valid event whose identity does not match its immutable filename', async () => {
    const root = path.join(await tempRoot(), 'events');
    const store = repository(root);
    await store.findWindow(START, END);
    await writeFile(path.join(eventDirectory(root), 'event-000002.event.json'), JSON.stringify(event()), {
      mode: 0o600,
    });

    await expect(store.findWindow(START, END)).rejects.toThrow('M0B_EVENT_FILENAME_MISMATCH');
  });

  it('rejects unexpected files instead of silently accepting an incomplete corpus', async () => {
    const root = path.join(await tempRoot(), 'events');
    const store = repository(root);
    await store.findWindow(START, END);
    await writeFile(path.join(eventDirectory(root), '.DS_Store'), 'untrusted', { mode: 0o600 });

    await expect(store.findWindow(START, END)).rejects.toThrow('M0B_UNEXPECTED_STORAGE_ENTRY');
  });

  it.runIf(process.platform !== 'win32')('rejects symlinked event files', async () => {
    const root = path.join(await tempRoot(), 'events');
    const store = repository(root);
    await store.findWindow(START, END);
    const outside = path.join(await tempRoot(), 'outside.json');
    await writeFile(outside, JSON.stringify(event()), { mode: 0o600 });
    await symlink(outside, path.join(eventDirectory(root), 'event-000001.event.json'));

    await expect(store.findWindow(START, END)).rejects.toThrow('M0B_UNEXPECTED_STORAGE_ENTRY');
  });

  it('fails closed when stored event count exceeds the configured bound', async () => {
    const root = path.join(await tempRoot(), 'events');
    const writer = repository(root);
    await writer.append(event());
    await writer.append(event({ eventId: 'event-000002' }));

    await expect(repository(root, { maxEvents: 1 }).findWindow(START, END)).rejects.toThrow('M0B_EVENT_LIMIT_EXCEEDED');
  });
});

describe('LocalM0BCohortEventRepository observation bounds', () => {
  it('rejects direct writes outside the configured observation window', async () => {
    const root = path.join(await tempRoot(), 'events');
    await expect(repository(root).append(event({ occurredAtMs: END }))).rejects.toThrow(
      'M0B_EVENT_OUTSIDE_OBSERVATION_WINDOW'
    );
    await expect(lstat(root)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects queries that escape or invert the configured observation window', async () => {
    const root = path.join(await tempRoot(), 'events');
    const store = repository(root);
    await expect(store.findWindow(START - 1, END)).rejects.toThrow('M0B_QUERY_OUTSIDE_OBSERVATION_WINDOW');
    await expect(store.findWindow(END, START)).rejects.toThrow('M0B_QUERY_OUTSIDE_OBSERVATION_WINDOW');
  });
});
