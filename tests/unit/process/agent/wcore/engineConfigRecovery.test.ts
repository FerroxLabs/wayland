/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1024 - in-app recovery for an invalid engine `config.toml`.
 *
 * The load-bearing claims proven here by EXECUTION, not by inspection:
 *  - the exact corruption from the report (`enabled = falseegress_allow = [...]`)
 *    is repaired, and the repaired document parses;
 *  - the repair inserts ONLY line breaks - every other byte, including the
 *    `api_key`, survives verbatim;
 *  - a backup is written and proven identical BEFORE the original is touched;
 *  - when the backup FAILS, the original is not written at all;
 *  - regenerate is a no-op without an explicit confirmation, and takes the
 *    verified backup before it deletes anything;
 *  - nothing the inspection returns carries file content.
 */
import { mkdtemp, readFile as realReadFile, rm, writeFile as realWriteFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'smol-toml';
import { describe, expect, it } from 'vitest';
import {
  EngineConfigBackupError,
  createVerifiedBackup,
  findParseProblem,
  inspectEngineConfig,
  isLineBreakOnlyEdit,
  planLineBreakRepair,
  regenerateEngineConfig,
  repairEngineConfig,
  backupStamp,
  defaultRecoveryDeps,
  type EngineConfigRecoveryDeps,
} from '@process/agent/wcore/engineConfigRecovery';
import { DesktopProfileSpliceError, spliceDesktopMcpProfile } from '@process/agent/wcore/desktopProfileSplice';
import { appendDesktopMcpProfile, WCORE_DESKTOP_MCP_PROFILE } from '@process/agent/wcore/envBuilder';

const CONFIG_PATH = '/scratch/wayland-core/config.toml';

/** The reporter's file from #1024, with a live-shaped credential above the break. */
const REPORTED_CORRUPT =
  '[providers.anthropic]\n' +
  'api_key = "sk-ant-api03-EXAMPLEKEYVALUE"\n' +
  '\n' +
  '[security]\n' +
  'enabled = falseegress_allow = [ "mcp.slack.com", "mcp-9827.slack.com", "slack.com" ]\n' +
  'approval_mode = "yolo"\n';

type FakeFs = {
  files: Map<string, string>;
  writes: string[];
  deps: EngineConfigRecoveryDeps;
};

/**
 * In-memory fs seam. `failBackupWith` makes the EXCLUSIVE (backup) write fail
 * while leaving the atomic (real) write working, which is the only way to prove
 * the ordering claim: a broken backup must stop the real write from happening.
 */
function fakeFs(
  initial: Record<string, string>,
  options: { failBackupWith?: NodeJS.ErrnoException; corruptBackup?: boolean } = {}
): FakeFs {
  const files = new Map(Object.entries(initial));
  const writes: string[] = [];
  const deps: EngineConfigRecoveryDeps = {
    resolveConfigPath: async () => CONFIG_PATH,
    readFileUtf8: async (path) => {
      const value = files.get(path);
      if (value === undefined) {
        const error: NodeJS.ErrnoException = new Error(`ENOENT: no such file, open '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }
      return value;
    },
    writeFileExclusive: async (path, data) => {
      if (options.failBackupWith) throw options.failBackupWith;
      if (files.has(path)) {
        const error: NodeJS.ErrnoException = new Error('EEXIST');
        error.code = 'EEXIST';
        throw error;
      }
      writes.push(path);
      files.set(path, options.corruptBackup ? `${data}TRUNCATED` : data);
    },
    writeFileAtomic: async (path, data) => {
      writes.push(path);
      files.set(path, data);
    },
    removeFile: async (path) => {
      writes.push(`unlink:${path}`);
      files.delete(path);
    },
    now: () => new Date(2026, 7, 17, 14, 25, 30),
  };
  return { files, writes, deps };
}

describe('findParseProblem', () => {
  it('returns null for a valid document (known positive for the negative result)', () => {
    expect(findParseProblem('[security]\nenabled = false\n')).toBeNull();
  });

  it('reports the 1-based line and column of the reported corruption', () => {
    const problem = findParseProblem(REPORTED_CORRUPT);
    expect(problem).not.toBeNull();
    expect(problem?.line).toBe(5);
    expect(problem?.column).toBe(11);
  });

  it('never carries the offending source line or a credential in the reason', () => {
    const problem = findParseProblem(REPORTED_CORRUPT);
    expect(problem?.reason).toBe('Invalid TOML document: invalid value');
    expect(problem?.reason).not.toContain('sk-ant');
    expect(problem?.reason).not.toContain('egress_allow');
    expect(problem?.reason).not.toContain('\n');
  });
});

describe('isLineBreakOnlyEdit', () => {
  it('accepts a pure line-break insertion', () => {
    expect(isLineBreakOnlyEdit('a = 1b = 2', 'a = 1\nb = 2')).toBe(true);
  });

  it('rejects an edit that changes any other byte', () => {
    expect(isLineBreakOnlyEdit('a = 1b = 2', 'a = 1\nb = 3')).toBe(false);
  });

  it('rejects an edit that drops a byte', () => {
    expect(isLineBreakOnlyEdit('a = 1b = 2', 'a = 1\nb = ')).toBe(false);
  });
});

describe('planLineBreakRepair', () => {
  it('repairs the reported corruption with exactly one line break', () => {
    const repair = planLineBreakRepair(REPORTED_CORRUPT);
    expect(repair).not.toBeNull();
    expect(repair?.plan.lineBreaks).toBe(1);
    expect(() => parse(repair!.repaired)).not.toThrow();
  });

  it('preserves every byte including the api_key, inserting only a newline', () => {
    const repaired = planLineBreakRepair(REPORTED_CORRUPT)!.repaired;
    expect(isLineBreakOnlyEdit(REPORTED_CORRUPT, repaired)).toBe(true);
    expect(repaired).toContain('api_key = "sk-ant-api03-EXAMPLEKEYVALUE"');
    const parsed = parse(repaired) as { security: Record<string, unknown> };
    expect(parsed.security.enabled).toBe(false);
    expect(parsed.security.egress_allow).toEqual(['mcp.slack.com', 'mcp-9827.slack.com', 'slack.com']);
    expect(parsed.security.approval_mode).toBe('yolo');
  });

  it('repairs a value run together with a following table header', () => {
    const repair = planLineBreakRepair('[a]\nx = 1[b]\ny = 2\n');
    expect(repair?.plan.lineBreaks).toBe(1);
    expect(parse(repair!.repaired)).toEqual({ a: { x: 1 }, b: { y: 2 } });
  });

  it('repairs two separate run-together lines', () => {
    const source = '[a]\nx = 1y = 2\n\n[b]\np = 3q = 4\n';
    const repair = planLineBreakRepair(source);
    expect(repair?.plan.lineBreaks).toBe(2);
    expect(isLineBreakOnlyEdit(source, repair!.repaired)).toBe(true);
    expect(() => parse(repair!.repaired)).not.toThrow();
  });

  it('returns null for a document that already parses', () => {
    expect(planLineBreakRepair('[a]\nx = 1\n')).toBeNull();
  });

  it('returns null when the failure is not a missing line break', () => {
    // An unterminated string is not fixable by inserting a newline.
    expect(planLineBreakRepair('[a]\nx = "unterminated\n')).toBeNull();
  });

  it('refuses to touch a line that begins inside a multi-line string', () => {
    // The `k = 1` shape lives inside a `"""` block, so it is DATA. The document
    // is broken further down; no repair may be offered by rewriting the value.
    const source = '[a]\nnote = """\nk = 1junk = 2\n"""\nbad = \n';
    expect(planLineBreakRepair(source)).toBeNull();
  });
});

describe('backupStamp', () => {
  it('never emits a colon (illegal on NTFS - it opens an alternate data stream)', () => {
    expect(backupStamp(new Date(2026, 7, 17, 14, 25, 30))).toBe('20260817-142530');
    expect(backupStamp(new Date(2026, 7, 17, 14, 25, 30))).not.toContain(':');
  });
});

describe('createVerifiedBackup', () => {
  it('writes a timestamped sibling and proves it byte-identical', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const backupPath = await createVerifiedBackup(CONFIG_PATH, REPORTED_CORRUPT, fs.deps);
    expect(backupPath).toBe('/scratch/wayland-core/config.toml.backup-20260817-142530');
    expect(fs.files.get(backupPath)).toBe(REPORTED_CORRUPT);
  });

  it('throws when the backup read-back does not match', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { corruptBackup: true });
    await expect(createVerifiedBackup(CONFIG_PATH, REPORTED_CORRUPT, fs.deps)).rejects.toBeInstanceOf(
      EngineConfigBackupError
    );
  });

  it('picks a fresh name instead of overwriting an existing backup', async () => {
    const existing = '/scratch/wayland-core/config.toml.backup-20260817-142530';
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT, [existing]: 'older backup' });
    const backupPath = await createVerifiedBackup(CONFIG_PATH, REPORTED_CORRUPT, fs.deps);
    expect(backupPath).toBe(`${existing}-2`);
    expect(fs.files.get(existing)).toBe('older backup');
  });
});

describe('inspectEngineConfig', () => {
  it('reports ok for a config that parses', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: '[security]\nenabled = false\n' });
    expect(await inspectEngineConfig(fs.deps)).toEqual({ status: 'ok', path: CONFIG_PATH });
  });

  it('reports missing for a fresh install', async () => {
    const fs = fakeFs({});
    expect(await inspectEngineConfig(fs.deps)).toEqual({ status: 'missing', path: CONFIG_PATH });
  });

  it('reports line, column and a repair plan for the reported corruption', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const inspection = await inspectEngineConfig(fs.deps);
    expect(inspection).toEqual({
      status: 'invalid',
      path: CONFIG_PATH,
      problem: { line: 5, column: 11, reason: 'Invalid TOML document: invalid value' },
      repair: { lineBreaks: 1 },
    });
  });

  it('returns no file content anywhere in the payload', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const serialized = JSON.stringify(await inspectEngineConfig(fs.deps));
    expect(serialized).not.toContain('sk-ant');
    expect(serialized).not.toContain('egress_allow');
    expect(serialized).not.toContain('approval_mode');
    expect(serialized).not.toContain('enabled');
  });

  it('reports invalid with no repair when no unambiguous fix exists', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: '[a]\nx = "unterminated\n' });
    const inspection = await inspectEngineConfig(fs.deps);
    expect(inspection.status).toBe('invalid');
    expect(inspection.status === 'invalid' && inspection.repair).toBeNull();
  });
});

describe('repairEngineConfig - backup BEFORE write', () => {
  it('backs up first, then writes, and the file on disk parses', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const result = await repairEngineConfig(fs.deps);
    expect(result.ok).toBe(true);

    // Ordering, proven by the write log: the backup name is written first.
    expect(fs.writes[0]).toBe('/scratch/wayland-core/config.toml.backup-20260817-142530');
    expect(fs.writes[1]).toBe(CONFIG_PATH);

    // The backup holds the ORIGINAL bytes; the config now parses.
    expect(fs.files.get(fs.writes[0])).toBe(REPORTED_CORRUPT);
    const repaired = fs.files.get(CONFIG_PATH)!;
    expect(() => parse(repaired)).not.toThrow();
    expect(isLineBreakOnlyEdit(REPORTED_CORRUPT, repaired)).toBe(true);
  });

  it('FAILURE BRANCH: a failed backup writes NOTHING to the original', async () => {
    const denied: NodeJS.ErrnoException = new Error('EACCES: permission denied');
    denied.code = 'EACCES';
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { failBackupWith: denied });

    const result = await repairEngineConfig(fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'backup-failed' });
    // Nothing at all was written, and the original is byte-for-byte unchanged.
    expect(fs.writes).toEqual([]);
    expect(fs.files.get(CONFIG_PATH)).toBe(REPORTED_CORRUPT);
  });

  it('FAILURE BRANCH: an unverifiable backup writes NOTHING to the original', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { corruptBackup: true });
    const result = await repairEngineConfig(fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'backup-failed' });
    expect(fs.writes).toEqual(['/scratch/wayland-core/config.toml.backup-20260817-142530']);
    expect(fs.files.get(CONFIG_PATH)).toBe(REPORTED_CORRUPT);
  });

  it('refuses when there is no unambiguous fix, without touching anything', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: '[a]\nx = "unterminated\n' });
    const result = await repairEngineConfig(fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'nothing-to-repair' });
    expect(fs.writes).toEqual([]);
  });
});

describe('regenerateEngineConfig - explicit confirmation required', () => {
  it('does NOTHING without confirmation', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const result = await regenerateEngineConfig({ confirmed: false }, fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'not-confirmed' });
    expect(fs.writes).toEqual([]);
    expect(fs.files.get(CONFIG_PATH)).toBe(REPORTED_CORRUPT);
  });

  it('with confirmation: backs up first, THEN removes the original', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const result = await regenerateEngineConfig({ confirmed: true }, fs.deps);
    expect(result.ok).toBe(true);
    expect(fs.writes).toEqual([
      '/scratch/wayland-core/config.toml.backup-20260817-142530',
      `unlink:${CONFIG_PATH}`,
    ]);
    expect(fs.files.has(CONFIG_PATH)).toBe(false);
    // The credentials still exist - in the verified backup.
    expect(fs.files.get(fs.writes[0])).toBe(REPORTED_CORRUPT);
  });

  it('FAILURE BRANCH: a failed backup leaves the original in place', async () => {
    const denied: NodeJS.ErrnoException = new Error('ENOSPC: no space left on device');
    denied.code = 'ENOSPC';
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { failBackupWith: denied });
    const result = await regenerateEngineConfig({ confirmed: true }, fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'backup-failed' });
    expect(fs.writes).toEqual([]);
    expect(fs.files.get(CONFIG_PATH)).toBe(REPORTED_CORRUPT);
  });
});

/**
 * The acceptance criterion from #1024, executed against the REAL filesystem and
 * the REAL splice: before the repair, `spliceDesktopMcpProfile` refuses (so
 * Desktop cannot launch); after the repair, it succeeds (so Desktop can). The
 * backup and the atomic write are the real `fs` implementations from
 * `defaultRecoveryDeps()`; only the path resolution is redirected into a scratch
 * dir so Sean's live engine config is never a possible target.
 */
describe('repairEngineConfig against a real scratch config dir', () => {
  it('turns a launch-blocking config into one the splice accepts', async () => {
    const scratch = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-'));
    const configPath = join(scratch, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');

    const fragment = appendDesktopMcpProfile(null, ['search']);
    // BEFORE: the refusal fires. This is the #1024 dead end.
    expect(() => spliceDesktopMcpProfile(REPORTED_CORRUPT, fragment)).toThrow(DesktopProfileSpliceError);

    const deps: EngineConfigRecoveryDeps = { ...defaultRecoveryDeps(), resolveConfigPath: async () => configPath };
    const result = await repairEngineConfig(deps);
    expect(result.ok).toBe(true);

    const backupPath = result.ok ? result.backupPath : '';
    // The backup exists on disk and is byte-identical to the original.
    expect(await realReadFile(backupPath, 'utf-8')).toBe(REPORTED_CORRUPT);

    // AFTER: the splice succeeds against the file that is actually on disk.
    const repaired = await realReadFile(configPath, 'utf-8');
    expect(isLineBreakOnlyEdit(REPORTED_CORRUPT, repaired)).toBe(true);
    const spliced = spliceDesktopMcpProfile(repaired, fragment);
    expect(spliced).toContain(`[profiles.${WCORE_DESKTOP_MCP_PROFILE}]`);
    // The user's credential and their deliberate [security] edits all survive.
    const parsed = parse(spliced) as { providers: { anthropic: { api_key: string } }; security: { enabled: boolean } };
    expect(parsed.providers.anthropic.api_key).toBe('sk-ant-api03-EXAMPLEKEYVALUE');
    expect(parsed.security.enabled).toBe(false);

    await rm(scratch, { recursive: true, force: true });
  });

  it('regenerate leaves a real, readable backup behind after deleting the file', async () => {
    const scratch = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-'));
    const configPath = join(scratch, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');

    const deps: EngineConfigRecoveryDeps = { ...defaultRecoveryDeps(), resolveConfigPath: async () => configPath };
    // Unconfirmed first: the file must still be there afterwards.
    expect(await regenerateEngineConfig({ confirmed: false }, deps)).toMatchObject({ reason: 'not-confirmed' });
    expect(await realReadFile(configPath, 'utf-8')).toBe(REPORTED_CORRUPT);

    const result = await regenerateEngineConfig({ confirmed: true }, deps);
    expect(result.ok).toBe(true);
    await expect(realReadFile(configPath, 'utf-8')).rejects.toThrow();
    expect(await realReadFile(result.ok ? result.backupPath : '', 'utf-8')).toBe(REPORTED_CORRUPT);

    await rm(scratch, { recursive: true, force: true });
  });
});
