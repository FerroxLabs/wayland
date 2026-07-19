/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { M0BCohortEventRepository } from './CohortBaselineService';
import { validateM0BCohortEvent } from './privacy';
import { M0B_DAY_MS, M0B_OBSERVATION_WINDOW_DAYS, type M0BCohortEvent } from './types';

const EVENT_SUFFIX = '.event.json';
const EVENT_FILE_PATTERN = /^([A-Za-z0-9_-]{8,128})\.event\.json$/;
const TEMP_FILE_PATTERN = /^\.[A-Za-z0-9_-]{8,128}\.event\.json\.[0-9a-f-]{36}\.tmp$/;
const DEFAULT_MAX_EVENTS = 100_000;
const DEFAULT_MAX_EVENT_BYTES = 4 * 1024;
const NO_FOLLOW = (fsConstants as { O_NOFOLLOW?: number }).O_NOFOLLOW ?? 0;

export type LocalM0BCohortEventRepositoryOptions = {
  /** Dedicated parent directory; the repository restricts it to the current OS user. */
  rootDirectory: string;
  windowStartMs: number;
  windowEndMs: number;
  maxEvents?: number;
  maxEventBytes?: number;
};

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .toSorted(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function assertPositiveLimit(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`M0B_INVALID_${label}`);
}

async function ensurePrivateDirectory(directory: string): Promise<void> {
  try {
    const current = await fs.lstat(directory);
    if (!current.isDirectory() || current.isSymbolicLink()) throw new Error('M0B_UNSAFE_STORAGE_DIRECTORY');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  }

  const current = await fs.lstat(directory);
  if (!current.isDirectory() || current.isSymbolicLink()) throw new Error('M0B_UNSAFE_STORAGE_DIRECTORY');
  if (process.platform !== 'win32') {
    await fs.chmod(directory, 0o700);
    const privateDirectory = await fs.lstat(directory);
    if ((privateDirectory.mode & 0o077) !== 0) throw new Error('M0B_STORAGE_DIRECTORY_NOT_PRIVATE');
  }
}

async function syncDirectory(directory: string): Promise<void> {
  if (process.platform === 'win32') return;
  const handle = await fs.open(directory, 'r');
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

/**
 * Durable, process-local M0B event storage.
 *
 * Every event is published as an immutable owner-only file through an
 * exclusive hard link. Readers therefore see either the complete event or no
 * event, including while another app process is recording. The repository is
 * intentionally not a consent authority: all production writes must pass
 * through CohortBaselineService, which owns explicit user consent.
 */
export class LocalM0BCohortEventRepository implements M0BCohortEventRepository {
  private readonly rootDirectory: string;
  private readonly eventDirectory: string;
  private readonly windowStartMs: number;
  private readonly windowEndMs: number;
  private readonly maxEvents: number;
  private readonly maxEventBytes: number;

  constructor(options: LocalM0BCohortEventRepositoryOptions) {
    if (!path.isAbsolute(options.rootDirectory)) throw new Error('M0B_STORAGE_ROOT_MUST_BE_ABSOLUTE');
    if (
      !Number.isSafeInteger(options.windowStartMs) ||
      options.windowStartMs < 0 ||
      !Number.isSafeInteger(options.windowEndMs) ||
      options.windowEndMs - options.windowStartMs !== M0B_OBSERVATION_WINDOW_DAYS * M0B_DAY_MS
    ) {
      throw new Error('M0B_STORAGE_WINDOW_MUST_BE_14_DAYS');
    }

    this.maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
    this.maxEventBytes = options.maxEventBytes ?? DEFAULT_MAX_EVENT_BYTES;
    assertPositiveLimit(this.maxEvents, 'MAX_EVENTS');
    assertPositiveLimit(this.maxEventBytes, 'MAX_EVENT_BYTES');
    this.rootDirectory = path.resolve(options.rootDirectory);
    this.windowStartMs = options.windowStartMs;
    this.windowEndMs = options.windowEndMs;
    this.eventDirectory = path.join(this.rootDirectory, `${this.windowStartMs}-${this.windowEndMs}`);
  }

  async append(input: M0BCohortEvent): Promise<void> {
    const validation = validateM0BCohortEvent(input);
    if (validation.ok === false) {
      throw new Error(`M0B_INVALID_EVENT:${validation.code}:${validation.field ?? ''}`);
    }
    this.assertInsideObservationWindow(validation.event);

    const canonical = canonicalJson(validation.event);
    const bytes = `${canonical}\n`;
    if (Buffer.byteLength(bytes, 'utf8') > this.maxEventBytes) throw new Error('M0B_EVENT_TOO_LARGE');

    await this.ensureStore();
    const target = this.eventPath(validation.event.eventId);
    try {
      await fs.access(target, fsConstants.F_OK);
      await this.assertExistingEventMatches(target, validation.event);
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    const entries = await fs.readdir(this.eventDirectory);
    const eventCount = entries.filter((entry) => EVENT_FILE_PATTERN.test(entry)).length;
    if (eventCount >= this.maxEvents) throw new Error('M0B_EVENT_LIMIT_REACHED');

    const temporary = path.join(this.eventDirectory, `.${validation.event.eventId}${EVENT_SUFFIX}.${randomUUID()}.tmp`);
    const handle = await fs.open(temporary, 'wx', 0o600);
    let closed = false;
    try {
      await handle.writeFile(bytes, 'utf8');
      await handle.sync();
      await handle.close();
      closed = true;
      try {
        await fs.link(temporary, target);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        await this.assertExistingEventMatches(target, validation.event);
        return;
      }
      await syncDirectory(this.eventDirectory);
    } finally {
      if (!closed) {
        try {
          await handle.close();
        } catch {
          // Preserve the primary write/publication failure.
        }
      }
      await fs.unlink(temporary).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }

  async findWindow(startMs: number, endMs: number): Promise<M0BCohortEvent[]> {
    this.assertQueryWindow(startMs, endMs);
    await this.ensureStore();
    const entries = await fs.readdir(this.eventDirectory, { withFileTypes: true });
    const eventEntries = entries.filter((entry) => {
      if (TEMP_FILE_PATTERN.test(entry.name) && entry.isFile() && !entry.isSymbolicLink()) return false;
      if (!EVENT_FILE_PATTERN.test(entry.name) || !entry.isFile() || entry.isSymbolicLink()) {
        throw new Error('M0B_UNEXPECTED_STORAGE_ENTRY');
      }
      return true;
    });
    if (eventEntries.length > this.maxEvents) throw new Error('M0B_EVENT_LIMIT_EXCEEDED');

    const storedEvents = await Promise.all(
      eventEntries.map(async (entry) => {
        const match = EVENT_FILE_PATTERN.exec(entry.name);
        if (!match) throw new Error('M0B_INVALID_EVENT_FILENAME');
        return this.readEventFile(path.join(this.eventDirectory, entry.name), match[1]);
      })
    );
    const events = storedEvents.filter((event) => event.occurredAtMs >= startMs && event.occurredAtMs < endMs);

    return events.toSorted(
      (left, right) => left.occurredAtMs - right.occurredAtMs || left.eventId.localeCompare(right.eventId)
    );
  }

  private async ensureStore(): Promise<void> {
    await ensurePrivateDirectory(this.rootDirectory);
    await ensurePrivateDirectory(this.eventDirectory);
  }

  private eventPath(eventId: string): string {
    return path.join(this.eventDirectory, `${eventId}${EVENT_SUFFIX}`);
  }

  private assertInsideObservationWindow(event: M0BCohortEvent): void {
    if (event.occurredAtMs < this.windowStartMs || event.occurredAtMs >= this.windowEndMs) {
      throw new Error('M0B_EVENT_OUTSIDE_OBSERVATION_WINDOW');
    }
  }

  private assertQueryWindow(startMs: number, endMs: number): void {
    if (
      !Number.isSafeInteger(startMs) ||
      !Number.isSafeInteger(endMs) ||
      startMs < this.windowStartMs ||
      endMs > this.windowEndMs ||
      startMs >= endMs
    ) {
      throw new Error('M0B_QUERY_OUTSIDE_OBSERVATION_WINDOW');
    }
  }

  private async assertExistingEventMatches(filePath: string, expected: M0BCohortEvent): Promise<void> {
    const stored = await this.readEventFile(filePath, expected.eventId);
    if (canonicalJson(stored) !== canonicalJson(expected)) throw new Error('M0B_CONFLICTING_EVENT_ID');
  }

  private async readEventFile(filePath: string, expectedEventId: string): Promise<M0BCohortEvent> {
    const handle = await fs.open(filePath, fsConstants.O_RDONLY | NO_FOLLOW);
    try {
      const stat = await handle.stat();
      if (!stat.isFile() || stat.size <= 0 || stat.size > this.maxEventBytes) throw new Error('M0B_INVALID_EVENT_FILE');
      if (process.platform !== 'win32' && (stat.mode & 0o077) !== 0) throw new Error('M0B_EVENT_FILE_NOT_PRIVATE');
      const raw = await handle.readFile('utf8');
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('M0B_CORRUPT_EVENT_FILE');
      }
      const validation = validateM0BCohortEvent(parsed);
      if (validation.ok === false) {
        throw new Error(`M0B_INVALID_STORED_EVENT:${validation.code}:${validation.field ?? ''}`);
      }
      if (validation.event.eventId !== expectedEventId) throw new Error('M0B_EVENT_FILENAME_MISMATCH');
      this.assertInsideObservationWindow(validation.event);
      return validation.event;
    } finally {
      await handle.close();
    }
  }
}
