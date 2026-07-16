/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { getCronSkillsDir } from '@process/utils/initStorage';
import { verifyDirectoryFiles } from '@process/utils/utils';
import type { CronJob } from './CronStore';

const ARCHIVE_KIND = 'wayland-cron-job-archive';
const ARCHIVE_VERSION = 1;

type CronArchiveRecordPayload = {
  kind: typeof ARCHIVE_KIND;
  version: typeof ARCHIVE_VERSION;
  archiveId: string;
  archivedAt: number;
  job: CronJob;
  skillPresent: boolean;
  skillTreeSha256?: string;
};

type CronArchiveRecord = CronArchiveRecordPayload & {
  recordSha256: string;
};

export type ArchivedCronJob = {
  archiveId: string;
  archivedAt: number;
  job: CronJob;
  skillPresent: boolean;
};

export type ValidatedCronArchive = ArchivedCronJob & {
  archiveDir: string;
  archivedSkillDir: string;
  skillTreeSha256?: string;
};

function assertSafeSegment(value: string, label: string): void {
  if (
    !value ||
    value.startsWith('.') ||
    value === '..' ||
    path.basename(value) !== value ||
    /[\\/]/.test(value) ||
    value.includes('\0')
  ) {
    throw new Error(`Invalid ${label}`);
  }
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function resolveArchiveRoots(cronSkillsRoot = getCronSkillsDir()): Promise<{
  cronSkillsRoot: string;
  jobsRoot: string;
  restoredRoot: string;
  abortedRoot: string;
}> {
  await fs.mkdir(cronSkillsRoot, { recursive: true });
  const realCronRoot = await fs.realpath(cronSkillsRoot);
  const archiveRoot = path.join(cronSkillsRoot, '.archive');
  const jobsRoot = path.join(archiveRoot, 'jobs');
  const restoredRoot = path.join(archiveRoot, 'restored');
  const abortedRoot = path.join(archiveRoot, 'aborted');
  for (const candidate of [archiveRoot, jobsRoot, restoredRoot, abortedRoot]) {
    await fs.mkdir(candidate, { recursive: true });
    const realCandidate = await fs.realpath(candidate);
    if (!isWithin(realCronRoot, realCandidate)) {
      throw new Error('Cron archive path escapes the cron skills directory');
    }
  }

  return { cronSkillsRoot: realCronRoot, jobsRoot, restoredRoot, abortedRoot };
}

function hashPayload(payload: CronArchiveRecordPayload): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

async function hashDirectoryTree(root: string): Promise<string> {
  const hash = createHash('sha256');

  async function visit(current: string, relative: string): Promise<void> {
    const stat = await fs.lstat(current);
    if (stat.isSymbolicLink()) {
      throw new Error(`Cron skill archive refuses symbolic links: ${relative || '.'}`);
    }
    if (stat.isDirectory()) {
      hash.update(`d\0${relative}\0`);
      const entries = await fs.readdir(current);
      entries.sort();
      for (const entry of entries) {
        await visit(path.join(current, entry), path.join(relative, entry));
      }
      return;
    }
    if (!stat.isFile()) {
      throw new Error(`Cron skill archive refuses unsupported file type: ${relative}`);
    }
    hash.update(`f\0${relative}\0${stat.mode & 0o777}\0`);
    hash.update(await fs.readFile(current));
    hash.update('\0');
  }

  await visit(root, '');
  return hash.digest('hex');
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  const tempPath = `${filePath}.tmp-${randomUUID()}`;
  try {
    await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch((): void => undefined);
    throw error;
  }
}

async function pathExists(candidate: string): Promise<boolean> {
  try {
    await fs.lstat(candidate);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export async function archiveCronJob(job: CronJob, cronSkillsRoot = getCronSkillsDir()): Promise<ArchivedCronJob> {
  assertSafeSegment(job.id, 'cron job id');
  const roots = await resolveArchiveRoots(cronSkillsRoot);
  const archiveId = randomUUID();
  const tempDir = path.join(roots.jobsRoot, `.tmp-${archiveId}`);
  const archiveDir = path.join(roots.jobsRoot, archiveId);
  const activeSkillDir = path.join(roots.cronSkillsRoot, job.id);
  const archivedSkillDir = path.join(tempDir, 'skill');

  await fs.mkdir(tempDir, { recursive: false });
  try {
    const skillPresent = await pathExists(activeSkillDir);
    let skillTreeSha256: string | undefined;
    if (skillPresent) {
      const activeStat = await fs.lstat(activeSkillDir);
      if (!activeStat.isDirectory() || activeStat.isSymbolicLink()) {
        throw new Error('Cron skill path is not a safe directory');
      }
      const realActiveSkillDir = await fs.realpath(activeSkillDir);
      if (!isWithin(roots.cronSkillsRoot, realActiveSkillDir)) {
        throw new Error('Cron skill path escapes the cron skills directory');
      }
      await fs.cp(activeSkillDir, archivedSkillDir, {
        recursive: true,
        dereference: false,
        errorOnExist: true,
        force: false,
      });
      if (!(await verifyDirectoryFiles(activeSkillDir, archivedSkillDir))) {
        throw new Error('Cron skill archive failed byte verification');
      }
      skillTreeSha256 = await hashDirectoryTree(archivedSkillDir);
    }

    const payload: CronArchiveRecordPayload = {
      kind: ARCHIVE_KIND,
      version: ARCHIVE_VERSION,
      archiveId,
      archivedAt: Date.now(),
      job,
      skillPresent,
      ...(skillTreeSha256 ? { skillTreeSha256 } : {}),
    };
    const record: CronArchiveRecord = { ...payload, recordSha256: hashPayload(payload) };
    await writeJsonAtomic(path.join(tempDir, 'record.json'), record);
    await fs.rename(tempDir, archiveDir);
    return { archiveId, archivedAt: payload.archivedAt, job, skillPresent };
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch((): void => undefined);
    throw error;
  }
}

async function readValidatedArchive(
  archiveId: string,
  cronSkillsRoot = getCronSkillsDir()
): Promise<ValidatedCronArchive> {
  assertSafeSegment(archiveId, 'cron archive id');
  const roots = await resolveArchiveRoots(cronSkillsRoot);
  const archiveDir = path.join(roots.jobsRoot, archiveId);
  const realArchiveDir = await fs.realpath(archiveDir);
  if (!isWithin(await fs.realpath(roots.jobsRoot), realArchiveDir)) {
    throw new Error('Cron archive entry escapes the archive directory');
  }

  const raw = await fs.readFile(path.join(archiveDir, 'record.json'), 'utf8');
  const record = JSON.parse(raw) as Partial<CronArchiveRecord>;
  if (
    record.kind !== ARCHIVE_KIND ||
    record.version !== ARCHIVE_VERSION ||
    record.archiveId !== archiveId ||
    typeof record.archivedAt !== 'number' ||
    !record.job ||
    typeof record.skillPresent !== 'boolean' ||
    typeof record.recordSha256 !== 'string'
  ) {
    throw new Error(`Invalid cron archive record: ${archiveId}`);
  }
  assertSafeSegment(record.job.id, 'archived cron job id');
  const payload: CronArchiveRecordPayload = {
    kind: ARCHIVE_KIND,
    version: ARCHIVE_VERSION,
    archiveId,
    archivedAt: record.archivedAt,
    job: record.job,
    skillPresent: record.skillPresent,
    ...(record.skillTreeSha256 ? { skillTreeSha256: record.skillTreeSha256 } : {}),
  };
  if (hashPayload(payload) !== record.recordSha256) {
    throw new Error(`Cron archive record hash mismatch: ${archiveId}`);
  }

  const archivedSkillDir = path.join(archiveDir, 'skill');
  if (record.skillPresent) {
    if (typeof record.skillTreeSha256 !== 'string') {
      throw new Error(`Cron archive skill hash missing: ${archiveId}`);
    }
    const archivedSkillStat = await fs.lstat(archivedSkillDir);
    if (!archivedSkillStat.isDirectory() || archivedSkillStat.isSymbolicLink()) {
      throw new Error(`Cron archive skill directory is invalid: ${archiveId}`);
    }
    if ((await hashDirectoryTree(archivedSkillDir)) !== record.skillTreeSha256) {
      throw new Error(`Cron archive skill hash mismatch: ${archiveId}`);
    }
  } else if (await pathExists(archivedSkillDir)) {
    throw new Error(`Cron archive has unexpected skill data: ${archiveId}`);
  }

  return {
    archiveId,
    archivedAt: record.archivedAt,
    job: record.job,
    skillPresent: record.skillPresent,
    archiveDir,
    archivedSkillDir,
    skillTreeSha256: record.skillTreeSha256,
  };
}

export async function listArchivedCronJobs(cronSkillsRoot = getCronSkillsDir()): Promise<ArchivedCronJob[]> {
  const { jobsRoot } = await resolveArchiveRoots(cronSkillsRoot);
  const entries = await fs.readdir(jobsRoot, { withFileTypes: true });
  const archives: ArchivedCronJob[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.tmp-')) continue;
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      throw new Error(`Invalid cron archive entry: ${entry.name}`);
    }
    const archive = await readValidatedArchive(entry.name, cronSkillsRoot);
    archives.push({
      archiveId: archive.archiveId,
      archivedAt: archive.archivedAt,
      job: archive.job,
      skillPresent: archive.skillPresent,
    });
  }
  return [...archives].sort((left, right) => right.archivedAt - left.archivedAt);
}

export async function restoreCronSkillFromArchive(
  archiveId: string,
  cronSkillsRoot = getCronSkillsDir()
): Promise<{ archive: ValidatedCronArchive; skillRestored: boolean }> {
  const archive = await readValidatedArchive(archiveId, cronSkillsRoot);
  if (!archive.skillPresent) return { archive, skillRestored: false };

  const roots = await resolveArchiveRoots(cronSkillsRoot);
  const activeSkillDir = path.join(roots.cronSkillsRoot, archive.job.id);
  if (await pathExists(activeSkillDir)) {
    const stat = await fs.lstat(activeSkillDir);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error('Cron skill restore target is not a safe directory');
    }
    if ((await hashDirectoryTree(activeSkillDir)) !== archive.skillTreeSha256) {
      throw new Error('Cron skill restore target already exists with different content');
    }
    return { archive, skillRestored: false };
  }

  const tempDir = path.join(roots.cronSkillsRoot, `.restore-${archiveId}`);
  await fs.cp(archive.archivedSkillDir, tempDir, {
    recursive: true,
    dereference: false,
    errorOnExist: true,
    force: false,
  });
  try {
    if (!(await verifyDirectoryFiles(archive.archivedSkillDir, tempDir))) {
      throw new Error('Restored cron skill failed byte verification');
    }
    if ((await hashDirectoryTree(tempDir)) !== archive.skillTreeSha256) {
      throw new Error('Restored cron skill hash mismatch');
    }
    await fs.rename(tempDir, activeSkillDir);
    return { archive, skillRestored: true };
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch((): void => undefined);
    throw error;
  }
}

export async function preserveRemovedCronSkill(
  archiveId: string,
  jobId: string,
  cronSkillsRoot = getCronSkillsDir()
): Promise<void> {
  assertSafeSegment(archiveId, 'cron archive id');
  assertSafeSegment(jobId, 'cron job id');
  const roots = await resolveArchiveRoots(cronSkillsRoot);
  const activeSkillDir = path.join(roots.cronSkillsRoot, jobId);
  if (!(await pathExists(activeSkillDir))) return;
  const archive = await readValidatedArchive(archiveId, cronSkillsRoot);
  if (archive.job.id !== jobId) throw new Error('Cron archive does not match the removed job');
  const originalSkillDir = path.join(archive.archiveDir, 'original-skill');
  if (await pathExists(originalSkillDir)) return;
  await fs.rename(activeSkillDir, originalSkillDir);
}

export async function rollbackRestoredCronSkill(
  archiveId: string,
  jobId: string,
  cronSkillsRoot = getCronSkillsDir()
): Promise<void> {
  assertSafeSegment(archiveId, 'cron archive id');
  assertSafeSegment(jobId, 'cron job id');
  const roots = await resolveArchiveRoots(cronSkillsRoot);
  const activeSkillDir = path.join(roots.cronSkillsRoot, jobId);
  if (!(await pathExists(activeSkillDir))) return;
  const archive = await readValidatedArchive(archiveId, cronSkillsRoot);
  const failedRestoreDir = path.join(archive.archiveDir, `failed-restore-${randomUUID()}`);
  await fs.rename(activeSkillDir, failedRestoreDir);
}

async function moveArchive(
  archiveId: string,
  destinationRoot: string,
  cronSkillsRoot = getCronSkillsDir()
): Promise<void> {
  const archive = await readValidatedArchive(archiveId, cronSkillsRoot);
  const destination = path.join(destinationRoot, `${archiveId}-${Date.now()}`);
  await fs.rename(archive.archiveDir, destination);
}

export async function markCronArchiveRestored(archiveId: string, cronSkillsRoot = getCronSkillsDir()): Promise<void> {
  const { restoredRoot } = await resolveArchiveRoots(cronSkillsRoot);
  await moveArchive(archiveId, restoredRoot, cronSkillsRoot);
}

export async function markCronArchiveAborted(archiveId: string, cronSkillsRoot = getCronSkillsDir()): Promise<void> {
  const { abortedRoot } = await resolveArchiveRoots(cronSkillsRoot);
  await moveArchive(archiveId, abortedRoot, cronSkillsRoot);
}
