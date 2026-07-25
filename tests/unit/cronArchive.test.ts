import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import type { CronJob } from '@/process/services/cron/CronStore';
import {
  archiveCronJob,
  listArchivedCronJobs,
  markCronArchiveRestored,
  preserveRemovedCronSkill,
  restoreCronSkillFromArchive,
} from '@/process/services/cron/cronArchive';

const roots: string[] = [];

async function makeRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-cron-archive-'));
  roots.push(root);
  return root;
}

function makeJob(overrides: Partial<CronJob> = {}): CronJob {
  return {
    id: 'cron_job_1',
    name: 'Daily report',
    description: 'Create the daily report',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 9 * * *', description: 'Every day at 9' },
    target: { payload: { kind: 'message', text: 'Write the report' }, executionMode: 'new_conversation' },
    metadata: {
      conversationId: 'conversation-1',
      conversationTitle: 'Reports',
      agentType: 'wcore',
      createdBy: 'user',
      createdAt: 1000,
      updatedAt: 1000,
    },
    state: { runCount: 3, retryCount: 0, maxRetries: 3, nextRunAtMs: 5000 },
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('cronArchive', () => {
  it('publishes a byte-verified archive, preserves the original tree, and restores it', async () => {
    const root = await makeRoot();
    const job = makeJob();
    const skillDir = path.join(root, job.id);
    await fs.mkdir(path.join(skillDir, 'references'), { recursive: true });
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), Buffer.from([0, 1, 2, 255]));
    await fs.writeFile(path.join(skillDir, 'references', 'notes.txt'), 'customer-authored notes\n');

    const archived = await archiveCronJob(job, root);
    expect(await listArchivedCronJobs(root)).toEqual([
      expect.objectContaining({ archiveId: archived.archiveId, job, skillPresent: true }),
    ]);

    await preserveRemovedCronSkill(archived.archiveId, job.id, root);
    await expect(fs.lstat(skillDir)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(
      await fs.readFile(path.join(root, '.archive', 'jobs', archived.archiveId, 'original-skill', 'references', 'notes.txt'), 'utf8')
    ).toBe('customer-authored notes\n');

    const restored = await restoreCronSkillFromArchive(archived.archiveId, root);
    expect(restored.skillRestored).toBe(true);
    expect(await fs.readFile(path.join(skillDir, 'SKILL.md'))).toEqual(Buffer.from([0, 1, 2, 255]));
    expect(await fs.readFile(path.join(skillDir, 'references', 'notes.txt'), 'utf8')).toBe('customer-authored notes\n');

    await markCronArchiveRestored(archived.archiveId, root);
    expect(await listArchivedCronJobs(root)).toEqual([]);
    expect((await fs.readdir(path.join(root, '.archive', 'restored'))).length).toBe(1);
  });

  it('archives and restores a schedule that has no skill directory', async () => {
    const root = await makeRoot();
    const job = makeJob();
    const archived = await archiveCronJob(job, root);

    expect(archived.skillPresent).toBe(false);
    await expect(restoreCronSkillFromArchive(archived.archiveId, root)).resolves.toMatchObject({
      skillRestored: false,
    });
  });

  it('fails closed on a symlink inside the skill tree and retains the source', async () => {
    if (process.platform === 'win32') return;
    const root = await makeRoot();
    const job = makeJob();
    const skillDir = path.join(root, job.id);
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(root, 'outside.txt'), 'outside');
    await fs.symlink(path.join(root, 'outside.txt'), path.join(skillDir, 'escape'));

    await expect(archiveCronJob(job, root)).rejects.toThrow(/symbolic links|byte verification/);
    expect(await fs.readlink(path.join(skillDir, 'escape'))).toBe(path.join(root, 'outside.txt'));
    expect(await listArchivedCronJobs(root)).toEqual([]);
  });

  it('rejects a symlinked archive root before creating anything outside the cron root', async () => {
    if (process.platform === 'win32') return;
    const root = await makeRoot();
    const outside = await makeRoot();
    await fs.symlink(outside, path.join(root, '.archive'));

    await expect(archiveCronJob(makeJob(), root)).rejects.toThrow('escapes the cron skills directory');
    await expect(fs.lstat(path.join(outside, 'jobs'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('fails closed when the archive record is tampered', async () => {
    const root = await makeRoot();
    const job = makeJob();
    const archived = await archiveCronJob(job, root);
    const recordPath = path.join(root, '.archive', 'jobs', archived.archiveId, 'record.json');
    const record = JSON.parse(await fs.readFile(recordPath, 'utf8')) as { job: CronJob };
    record.job.name = 'Tampered task';
    await fs.writeFile(recordPath, JSON.stringify(record));

    await expect(listArchivedCronJobs(root)).rejects.toThrow('record hash mismatch');
    await expect(restoreCronSkillFromArchive(archived.archiveId, root)).rejects.toThrow('record hash mismatch');
  });

  it('fails closed when archived skill bytes are tampered', async () => {
    const root = await makeRoot();
    const job = makeJob();
    await fs.mkdir(path.join(root, job.id), { recursive: true });
    await fs.writeFile(path.join(root, job.id, 'SKILL.md'), 'original');
    const archived = await archiveCronJob(job, root);
    await fs.writeFile(path.join(root, '.archive', 'jobs', archived.archiveId, 'skill', 'SKILL.md'), 'changed');

    await expect(listArchivedCronJobs(root)).rejects.toThrow('skill hash mismatch');
    await expect(restoreCronSkillFromArchive(archived.archiveId, root)).rejects.toThrow('skill hash mismatch');
  });

  it('refuses traversal and reserved archive-root job ids', async () => {
    const root = await makeRoot();
    await expect(archiveCronJob(makeJob({ id: '../escape' }), root)).rejects.toThrow('Invalid cron job id');
    await expect(archiveCronJob(makeJob({ id: '.archive' }), root)).rejects.toThrow('Invalid cron job id');
  });

  it('does not overwrite a different active skill during restore', async () => {
    const root = await makeRoot();
    const job = makeJob();
    await fs.mkdir(path.join(root, job.id), { recursive: true });
    await fs.writeFile(path.join(root, job.id, 'SKILL.md'), 'archived');
    const archived = await archiveCronJob(job, root);
    await preserveRemovedCronSkill(archived.archiveId, job.id, root);
    await fs.mkdir(path.join(root, job.id), { recursive: true });
    await fs.writeFile(path.join(root, job.id, 'SKILL.md'), 'different');

    await expect(restoreCronSkillFromArchive(archived.archiveId, root)).rejects.toThrow(
      'already exists with different content'
    );
    expect(await fs.readFile(path.join(root, job.id, 'SKILL.md'), 'utf8')).toBe('different');
  });
});
