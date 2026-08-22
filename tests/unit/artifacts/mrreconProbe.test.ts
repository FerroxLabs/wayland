/**
 * RECON PROBE (not a shipped test). Exercises the REAL production path
 * `createWCoreAgent` against a REAL filesystem, with only the app's storage
 * directories redirected, to answer one question by execution:
 *
 *   does a scheduled routine whose workspace is a durable task folder get
 *   `.wayland-core/skills/` laid down inside that folder?
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

const roots = vi.hoisted(() => {
  const fs = require('fs');
  const os2 = require('os');
  const p = require('path');
  const base = fs.mkdtempSync(p.join(os2.tmpdir(), 'mrrecon-storage-'));
  const builtin = p.join(base, 'builtin-skills');
  const auto = p.join(builtin, '_builtin');
  const user = p.join(base, 'skills');
  const system = p.join(base, 'system');
  fs.mkdirSync(auto, { recursive: true });
  fs.mkdirSync(user, { recursive: true });
  fs.mkdirSync(system, { recursive: true });
  // one auto builtin, and market-open-report as a non-auto builtin with a script
  fs.mkdirSync(p.join(auto, 'cron'), { recursive: true });
  fs.writeFileSync(p.join(auto, 'cron', 'SKILL.md'), '# cron\n');
  fs.mkdirSync(p.join(builtin, 'market-open-report', 'scripts'), { recursive: true });
  fs.writeFileSync(p.join(builtin, 'market-open-report', 'SKILL.md'), '# market-open-report\n');
  fs.writeFileSync(p.join(builtin, 'market-open-report', 'scripts', 'morning-report.mjs'), '// scanner\n');
  fs.writeFileSync(p.join(builtin, 'market-open-report', 'scripts', 'briefHtml.mjs'), '// html\n');
  return { base, builtin, auto, user, system };
});

vi.mock('@process/utils/initStorage', () => ({
  getSkillsDir: () => roots.user,
  getBuiltinSkillsCopyDir: () => roots.builtin,
  getAutoSkillsDir: () => roots.auto,
  getSystemDir: () => ({ workDir: roots.system }),
  ProcessConfig: { get: async () => null },
}));

vi.mock('@process/utils/openclawUtils', () => ({
  computeOpenClawIdentityHash: async () => 'mock-hash',
}));

let createWCoreAgent: any;

beforeEach(async () => {
  vi.resetModules();
  ({ createWCoreAgent } = await import('@process/utils/initAgent'));
});

async function exists(p: string) {
  try {
    await fsp.stat(p);
    return true;
  } catch {
    return false;
  }
}

describe('RECON: durable task workspace vs skill placement', () => {
  it('LINK 1 - scheduled routine (cron-shaped extra) gets NO .wayland-core/skills', async () => {
    const ws = await fsp.mkdtemp(path.join(os.tmpdir(), 'mrrecon-taskroot-'));
    // EXACTLY what WorkerTaskManagerJobExecutor.buildConversationForJob sends:
    // a workspace, no customWorkspace key, no projectId, no enabledSkills.
    await createWCoreAgent({
      model: {} as any,
      extra: {
        backend: 'wcore',
        agentName: 'Weekday morning report',
        cronJobId: 'cron_4d3c2198',
        cronWorkspace: ws,
        workspace: ws,
        sessionMode: 'bypassPermissions',
        excludeBuiltinSkills: ['cron'],
      },
    } as any);

    const skillsDir = path.join(ws, '.wayland-core', 'skills');
    const scanner = path.join(skillsDir, 'market-open-report', 'scripts', 'morning-report.mjs');
    console.log('[PROBE] workspace listing:', await fsp.readdir(ws));
    console.log('[PROBE] .wayland-core/skills exists:', await exists(skillsDir));
    console.log('[PROBE] scanner exists:', await exists(scanner));
    expect(await exists(skillsDir)).toBe(false);
  });

  it('CONTROL - the same call with customWorkspace:false DOES lay skills down', async () => {
    const ws = await fsp.mkdtemp(path.join(os.tmpdir(), 'mrrecon-ctl-'));
    await createWCoreAgent({
      model: {} as any,
      extra: {
        backend: 'wcore',
        workspace: ws,
        customWorkspace: false,
        enabledSkills: ['market-open-report'],
      },
    } as any);
    const skillsDir = path.join(ws, '.wayland-core', 'skills');
    const scanner = path.join(skillsDir, 'market-open-report', 'scripts', 'morning-report.mjs');
    console.log('[PROBE-CTL] .wayland-core/skills exists:', await exists(skillsDir));
    console.log('[PROBE-CTL] listing:', await fsp.readdir(skillsDir).catch(() => '<none>'));
    console.log('[PROBE-CTL] scanner exists:', await exists(scanner));
    expect(await exists(scanner)).toBe(true);
  });
});
