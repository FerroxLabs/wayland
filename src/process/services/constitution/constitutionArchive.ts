/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  constants as fsConstants,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import type { ConstitutionArchiveSummary } from '@/common/types/constitution';

const ARCHIVE_KIND = 'wayland-constitution-history' as const;
const ARCHIVE_VERSION = 1 as const;
const CONSTITUTION_NAME = 'CONSTITUTION.md';
const LEGACY_SOUL_NAME = 'SOUL.md';
const SPECIALISTS_DIR = 'specialists';
const MAX_CONTENT_BYTES = 256 * 1024;
const MAX_RECORD_BYTES = MAX_CONTENT_BYTES + 32 * 1024;
const ARCHIVE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SPECIALIST_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export type ConstitutionArchiveTarget =
  | { kind: 'constitution'; sourceName: typeof CONSTITUTION_NAME | typeof LEGACY_SOUL_NAME }
  | { kind: 'specialist'; specialistId: string; sourceName: string };

interface ConstitutionArchiveRecord {
  kind: typeof ARCHIVE_KIND;
  version: typeof ARCHIVE_VERSION;
  archiveId: string;
  archivedAt: number;
  target: ConstitutionArchiveTarget;
  contentDigest: `sha256:${string}`;
  content: string;
}

function digestContent(content: string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(content, 'utf8').digest('hex')}`;
}

function assertArchiveId(archiveId: string): void {
  if (!ARCHIVE_ID_PATTERN.test(archiveId)) throw new Error('Invalid Constitution history id');
}

function assertPlainRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${label}`);
}

function assertExactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).toSorted();
  const wanted = expected.toSorted();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`Invalid ${label} fields`);
  }
}

function assertTarget(value: unknown): asserts value is ConstitutionArchiveTarget {
  assertPlainRecord(value, 'Constitution history target');
  if (value.kind === 'constitution') {
    assertExactKeys(value, ['kind', 'sourceName'], 'Constitution history target');
    if (value.sourceName !== CONSTITUTION_NAME && value.sourceName !== LEGACY_SOUL_NAME) {
      throw new Error('Invalid Constitution history source');
    }
    return;
  }
  if (value.kind === 'specialist') {
    assertExactKeys(value, ['kind', 'specialistId', 'sourceName'], 'Constitution history target');
    if (
      typeof value.specialistId !== 'string' ||
      !SPECIALIST_ID_PATTERN.test(value.specialistId) ||
      value.sourceName !== `${value.specialistId}.md`
    ) {
      throw new Error('Invalid specialist history target');
    }
    return;
  }
  throw new Error('Invalid Constitution history target kind');
}

function parseRecord(raw: string): ConstitutionArchiveRecord {
  if (Buffer.byteLength(raw, 'utf8') > MAX_RECORD_BYTES) throw new Error('Constitution history record is too large');
  const parsed: unknown = JSON.parse(raw);
  assertPlainRecord(parsed, 'Constitution history record');
  assertExactKeys(
    parsed,
    ['kind', 'version', 'archiveId', 'archivedAt', 'target', 'contentDigest', 'content'],
    'Constitution history record'
  );
  if (
    parsed.kind !== ARCHIVE_KIND ||
    parsed.version !== ARCHIVE_VERSION ||
    typeof parsed.archiveId !== 'string' ||
    typeof parsed.archivedAt !== 'number' ||
    !Number.isFinite(parsed.archivedAt) ||
    typeof parsed.contentDigest !== 'string' ||
    !/^sha256:[0-9a-f]{64}$/.test(parsed.contentDigest) ||
    typeof parsed.content !== 'string' ||
    Buffer.byteLength(parsed.content, 'utf8') > MAX_CONTENT_BYTES
  ) {
    throw new Error('Invalid Constitution history metadata');
  }
  assertArchiveId(parsed.archiveId);
  assertTarget(parsed.target);
  if (digestContent(parsed.content) !== parsed.contentDigest) {
    throw new Error('Constitution history digest mismatch');
  }
  return parsed as unknown as ConstitutionArchiveRecord;
}

function assertDirectory(directory: string): void {
  const stat = lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Unsafe Constitution history directory: ${directory}`);
}

function ensurePrivateChild(parent: string, child: string): string {
  assertDirectory(parent);
  const target = path.join(parent, child);
  try {
    mkdirSync(target, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  assertDirectory(target);
  return target;
}

function syncDirectory(directory: string): void {
  if (process.platform === 'win32') return;
  const fd = openSync(directory, fsConstants.O_RDONLY);
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

function toSummary(record: ConstitutionArchiveRecord): ConstitutionArchiveSummary {
  return {
    archiveId: record.archiveId,
    archivedAt: record.archivedAt,
    targetKind: record.target.kind,
    specialistId: record.target.kind === 'specialist' ? record.target.specialistId : undefined,
    sourceName: record.target.sourceName,
    bytes: Buffer.byteLength(record.content, 'utf8'),
  };
}

export class ConstitutionArchiveStore {
  constructor(private readonly waylandRoot: string) {}

  private roots(): { root: string; active: string; restored: string } {
    mkdirSync(this.waylandRoot, { recursive: true, mode: 0o700 });
    const root = realpathSync(this.waylandRoot);
    assertDirectory(root);
    const archives = ensurePrivateChild(root, 'archives');
    const history = ensurePrivateChild(archives, 'constitution-history');
    return {
      root,
      active: ensurePrivateChild(history, 'active'),
      restored: ensurePrivateChild(history, 'restored'),
    };
  }

  private publish(content: string, target: ConstitutionArchiveTarget): ConstitutionArchiveRecord {
    if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) throw new Error('Constitution history content is too large');
    assertTarget(target);
    const { active } = this.roots();
    const archiveId = randomUUID();
    const record: ConstitutionArchiveRecord = {
      kind: ARCHIVE_KIND,
      version: ARCHIVE_VERSION,
      archiveId,
      archivedAt: Date.now(),
      target,
      contentDigest: digestContent(content),
      content,
    };
    const destination = path.join(active, `${archiveId}.json`);
    const temporary = path.join(active, `.${archiveId}.tmp`);
    const fd = openSync(temporary, 'wx', 0o600);
    let published = false;
    try {
      writeFileSync(fd, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
      fsyncSync(fd);
      closeSync(fd);
      const verified = parseRecord(readFileSync(temporary, 'utf8'));
      if (verified.contentDigest !== record.contentDigest) throw new Error('Constitution history verification failed');
      renameSync(temporary, destination);
      syncDirectory(active);
      published = true;
      return record;
    } finally {
      try {
        closeSync(fd);
      } catch {
        // Already closed after the durable write.
      }
      if (!published) {
        try {
          unlinkSync(temporary);
        } catch {
          // Preserve the original publication error.
        }
      }
    }
  }

  archiveFile(filePath: string, target: ConstitutionArchiveTarget): ConstitutionArchiveSummary | null {
    if (!existsSync(filePath)) return null;
    const stat = lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Unsafe Constitution history source');
    return toSummary(this.publish(readFileSync(filePath, 'utf8'), target));
  }

  private read(archiveId: string): ConstitutionArchiveRecord {
    assertArchiveId(archiveId);
    const { active } = this.roots();
    const filePath = path.join(active, `${archiveId}.json`);
    const stat = lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_RECORD_BYTES) {
      throw new Error('Unsafe Constitution history file');
    }
    const record = parseRecord(readFileSync(filePath, 'utf8'));
    if (record.archiveId !== archiveId) throw new Error('Constitution history identity mismatch');
    return record;
  }

  list(): ConstitutionArchiveSummary[] {
    const { active } = this.roots();
    return readdirSync(active, { withFileTypes: true })
      .filter((entry) => entry.isFile() && !entry.isSymbolicLink() && entry.name.endsWith('.json'))
      .map((entry) => toSummary(this.read(entry.name.slice(0, -'.json'.length))))
      .toSorted((left, right) => right.archivedAt - left.archivedAt);
  }

  private destination(record: ConstitutionArchiveRecord): string {
    const { root } = this.roots();
    if (record.target.kind === 'constitution') return path.join(root, CONSTITUTION_NAME);
    const specialists = ensurePrivateChild(root, SPECIALISTS_DIR);
    return path.join(specialists, `${record.target.specialistId}.md`);
  }

  private atomicWrite(destination: string, content: string): void {
    if (existsSync(destination)) {
      const stat = lstatSync(destination);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Unsafe Constitution restore destination');
    }
    const temporary = `${destination}.restore-${randomUUID()}.tmp`;
    const fd = openSync(temporary, 'wx', 0o600);
    let complete = false;
    try {
      writeFileSync(fd, content, 'utf8');
      fsyncSync(fd);
      closeSync(fd);
      renameSync(temporary, destination);
      syncDirectory(path.dirname(destination));
      complete = true;
    } finally {
      try {
        closeSync(fd);
      } catch {
        // Already closed after the durable write.
      }
      if (!complete) {
        try {
          unlinkSync(temporary);
        } catch {
          // Preserve the original restore error.
        }
      }
    }
  }

  restore(archiveId: string): ConstitutionArchiveSummary {
    const record = this.read(archiveId);
    const destination = this.destination(record);
    if (existsSync(destination)) {
      const stat = lstatSync(destination);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Unsafe Constitution restore destination');
      const current = readFileSync(destination, 'utf8');
      if (digestContent(current) !== record.contentDigest) {
        const currentTarget: ConstitutionArchiveTarget =
          record.target.kind === 'constitution'
            ? { kind: 'constitution', sourceName: CONSTITUTION_NAME }
            : {
                kind: 'specialist',
                specialistId: record.target.specialistId,
                sourceName: `${record.target.specialistId}.md`,
              };
        this.publish(current, currentTarget);
      }
    }
    this.atomicWrite(destination, record.content);

    const roots = this.roots();
    renameSync(path.join(roots.active, `${archiveId}.json`), path.join(roots.restored, `${archiveId}.json`));
    syncDirectory(roots.active);
    syncDirectory(roots.restored);
    return toSummary(record);
  }
}
