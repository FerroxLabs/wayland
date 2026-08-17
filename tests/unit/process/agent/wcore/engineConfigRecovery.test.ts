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
 *  - the backup is made by RENAME and is byte-exact on a NON-UTF-8 file, compared
 *    as raw BUFFERS and sha256 over those buffers. The first version of this
 *    module copied through `readFile(path, 'utf-8')`, which substitutes U+FFFD
 *    during the decode, so its "byte-identical" check compared a mangled string
 *    to itself and always passed while the backup gained two bytes;
 *  - the original survives EVERY failure branch of both repair and regenerate;
 *  - regenerate refuses a config that parses, and requires `confirmed === true`
 *    by identity rather than truthiness;
 *  - nothing the inspection returns carries file content.
 */
import { mkdtemp, readFile as realReadFile, rm, writeFile as realWriteFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'smol-toml';
import { describe, expect, it } from 'vitest';
import {
  EngineConfigBackupError,
  createVerifiedBackup,
  decodeStrictUtf8,
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
const BACKUP_PATH = '/scratch/wayland-core/config.toml.backup-20260817-142530';

/** The reporter's file from #1024, with a live-shaped credential above the break. */
const REPORTED_CORRUPT =
  '[providers.anthropic]\n' +
  'api_key = "sk-ant-api03-EXAMPLEKEYVALUE"\n' +
  '\n' +
  '[security]\n' +
  'enabled = falseegress_allow = [ "mcp.slack.com", "mcp-9827.slack.com", "slack.com" ]\n' +
  'approval_mode = "yolo"\n';

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/**
 * NON-UTF-8 fixtures - the corruption class that broke the first implementation.
 * A lone `0xE9` is `é` in latin-1; a truncated `0xE2 0x82` is the first two bytes
 * of a three-byte sequence; the UTF-16 file has NUL bytes throughout.
 */
const LONE_E9 = Buffer.concat([
  Buffer.from('[providers.anthropic]\napi_key = "sk-ant-caf', 'utf-8'),
  Buffer.from([0xe9]),
  Buffer.from('"\n\n[security]\nenabled = falseegress_allow = [ "a" ]\n', 'utf-8'),
]);
const TRUNCATED_MULTIBYTE = Buffer.concat([
  Buffer.from('[a]\nname = "price ', 'utf-8'),
  Buffer.from([0xe2, 0x82]), // truncated EUR sign
  Buffer.from('"\n', 'utf-8'),
]);
// UTF-16 with a non-ASCII character: `é` is `E9 00`, and `E9` opens a
// three-byte UTF-8 sequence whose continuation bytes are absent. UTF-16 of PURE
// ASCII is a different case and is covered by its own test below.
const UTF16_CONFIG = Buffer.from('[a]\nname = "café"\n', 'utf16le');
const UTF16_PURE_ASCII = Buffer.from('[a]\nx = 1\n', 'utf16le');

type FakeFs = {
  files: Map<string, Buffer>;
  ops: string[];
  deps: EngineConfigRecoveryDeps;
};

/**
 * In-memory fs seam storing BUFFERS, so an encoding fault is representable at all
 * (a string-keyed fake could not have caught the original bug). `ops` is an
 * ordered journal of every mutation, which is how the backup-before-write
 * ordering claim is checked rather than asserted.
 */
function fakeFs(
  initial: Record<string, Buffer | string>,
  options: {
    failCreateWith?: NodeJS.ErrnoException;
    failRenameWith?: NodeJS.ErrnoException;
    failRepairWriteWith?: NodeJS.ErrnoException;
    mutateDuringBackup?: Buffer;
  } = {}
): FakeFs {
  const files = new Map<string, Buffer>(
    Object.entries(initial).map(([k, v]) => [k, Buffer.isBuffer(v) ? v : Buffer.from(v, 'utf-8')])
  );
  const ops: string[] = [];
  const deps: EngineConfigRecoveryDeps = {
    resolveConfigPath: async () => CONFIG_PATH,
    readFileBytes: async (path) => {
      const value = files.get(path);
      if (value === undefined) {
        const error: NodeJS.ErrnoException = new Error(`ENOENT: no such file, open '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }
      return value;
    },
    writeFileExclusive: async (path, data) => {
      // The 0-byte reservation and the repair write share this dep, exactly as
      // production does; the options let each be failed independently.
      const isReservation = data === '';
      if (isReservation && options.failCreateWith) throw options.failCreateWith;
      if (!isReservation && options.failRepairWriteWith) throw options.failRepairWriteWith;
      if (files.has(path)) {
        const error: NodeJS.ErrnoException = new Error('EEXIST: file already exists');
        error.code = 'EEXIST';
        throw error;
      }
      ops.push(`create:${path}`);
      files.set(path, Buffer.from(data, 'utf-8'));
    },
    renameFile: async (from, to) => {
      if (options.failRenameWith && from === CONFIG_PATH) throw options.failRenameWith;
      const value = files.get(from);
      if (value === undefined) {
        const error: NodeJS.ErrnoException = new Error(`ENOENT: no such file, rename '${from}'`);
        error.code = 'ENOENT';
        throw error;
      }
      ops.push(`rename:${from}->${to}`);
      files.delete(from);
      // Simulate the file changing under us between the read and the rename.
      files.set(to, options.mutateDuringBackup ?? value);
    },
    removeFile: async (path) => {
      if (!files.has(path)) {
        const error: NodeJS.ErrnoException = new Error(`ENOENT: no such file, unlink '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }
      ops.push(`unlink:${path}`);
      files.delete(path);
    },
    now: () => new Date(2026, 7, 17, 14, 25, 30),
  };
  return { files, ops, deps };
}

describe('decodeStrictUtf8', () => {
  it('decodes valid UTF-8 including multi-byte characters (known positive)', () => {
    expect(decodeStrictUtf8(Buffer.from('x = "café €"', 'utf-8'))).toBe('x = "café €"');
  });

  it('REFUSES a lone 0xE9 instead of substituting U+FFFD', () => {
    expect(decodeStrictUtf8(LONE_E9)).toBeNull();
    // The blind decode the first version used: same bytes, no error, mangled text.
    expect(LONE_E9.toString('utf-8')).toContain('�');
  });

  it('REFUSES a truncated multi-byte sequence', () => {
    expect(decodeStrictUtf8(TRUNCATED_MULTIBYTE)).toBeNull();
  });

  it('REFUSES a UTF-16 file that contains a non-ASCII character', () => {
    expect(decodeStrictUtf8(UTF16_CONFIG)).toBeNull();
  });

  it('documents the one UTF-16 case that DOES decode, and why it is still safe', () => {
    // UTF-16 of pure ASCII is a run of ASCII bytes interleaved with NUL, and NUL
    // is a valid UTF-8 code point - so a fatal decoder accepts it. That is not a
    // gap: the decoded string re-encodes to the SAME bytes, so nothing can be
    // lost by round-tripping it, and the document will not parse as TOML anyway.
    // The real guarantee does not rest on this either way - the backup is a
    // RENAME, so it is byte-exact whatever the decoder thinks.
    const decoded = decodeStrictUtf8(UTF16_PURE_ASCII);
    expect(decoded).not.toBeNull();
    expect(Buffer.from(decoded!, 'utf-8').equals(UTF16_PURE_ASCII)).toBe(true);
  });
});

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

  // ── F7: bounded cost, so a pathological line cannot stall the main thread ──

  it('still repairs a multi-break line inside the caps (known positive)', () => {
    // 5 glued assignments need 4 breaks, inside MAX_REPAIR_STEPS. This is the
    // known positive that makes the refusals below meaningful.
    const line = Array.from({ length: 5 }, (_, i) => `k${i} = 1`).join('');
    const repair = planLineBreakRepair(`[a]\n${line}\n`);
    expect(repair).not.toBeNull();
    expect(repair?.plan.lineBreaks).toBe(4);
    expect(() => parse(repair!.repaired)).not.toThrow();
  });

  it('REFUSES a line with more candidates than the cap, quickly', () => {
    // 400 glued assignments is ~1200 candidate offsets, well past the cap. Before
    // the cap this shape took 220ms here and grew super-linearly, all of it
    // synchronous on the Electron main thread.
    const line = Array.from({ length: 400 }, (_, i) => `k${i} = 1`).join('');
    const started = Date.now();
    expect(planLineBreakRepair(`[a]\n${line}\n`)).toBeNull();
    expect(Date.now() - started).toBeLessThan(100);
  });

  it('REFUSES an oversized failing line', () => {
    const filler = 'x'.repeat(5000);
    expect(planLineBreakRepair(`[a]\nk = "${filler}"y = 1\n`)).toBeNull();
  });

  it('REFUSES an oversized document without parsing it 128 times', () => {
    const bulk = Array.from({ length: 40000 }, (_, i) => `k${i} = ${i}`).join('\n');
    const started = Date.now();
    expect(planLineBreakRepair(`[a]\n${bulk}\nbroken = 1also = 2\n`)).toBeNull();
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe('backupStamp', () => {
  it('never emits a colon (illegal on NTFS - it opens an alternate data stream)', () => {
    expect(backupStamp(new Date(2026, 7, 17, 14, 25, 30))).toBe('20260817-142530');
    expect(backupStamp(new Date(2026, 7, 17, 14, 25, 30))).not.toContain(':');
  });
});

describe('createVerifiedBackup - rename, not copy', () => {
  it('reserves a name, renames the original onto it, and leaves config.toml absent', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const backupPath = await createVerifiedBackup(CONFIG_PATH, fs.files.get(CONFIG_PATH)!, fs.deps);
    expect(backupPath).toBe(BACKUP_PATH);
    expect(fs.ops).toEqual([`create:${BACKUP_PATH}`, `rename:${CONFIG_PATH}->${BACKUP_PATH}`]);
    expect(fs.files.has(CONFIG_PATH)).toBe(false);
    expect(fs.files.get(BACKUP_PATH)!.toString('utf-8')).toBe(REPORTED_CORRUPT);
  });

  it('is byte-exact on a NON-UTF-8 file (the bug the first version had)', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: LONE_E9 });
    const backupPath = await createVerifiedBackup(CONFIG_PATH, LONE_E9, fs.deps);
    const backupBytes = fs.files.get(backupPath)!;
    expect(backupBytes.length).toBe(LONE_E9.length);
    expect(sha256(backupBytes)).toBe(sha256(LONE_E9));
    expect(backupBytes.equals(LONE_E9)).toBe(true);
    expect(backupBytes.includes(Buffer.from([0xe9]))).toBe(true);
    expect(backupBytes.includes(Buffer.from([0xef, 0xbf, 0xbd]))).toBe(false);
  });

  it('refuses and restores when the file changed under it (TOCTOU)', async () => {
    const original = Buffer.from(REPORTED_CORRUPT, 'utf-8');
    const changed = Buffer.from('[security]\nenabled = true\n', 'utf-8');
    const fs = fakeFs({ [CONFIG_PATH]: original }, { mutateDuringBackup: changed });
    await expect(createVerifiedBackup(CONFIG_PATH, original, fs.deps)).rejects.toBeInstanceOf(EngineConfigBackupError);
    // Renamed back, so the user still has a config.toml and no stray backup.
    expect(fs.files.has(CONFIG_PATH)).toBe(true);
    expect(fs.files.has(BACKUP_PATH)).toBe(false);
  });

  it('picks a fresh name instead of clobbering an existing backup', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT, [BACKUP_PATH]: 'older backup' });
    const backupPath = await createVerifiedBackup(CONFIG_PATH, fs.files.get(CONFIG_PATH)!, fs.deps);
    expect(backupPath).toBe(`${BACKUP_PATH}-2`);
    expect(fs.files.get(BACKUP_PATH)!.toString('utf-8')).toBe('older backup');
  });

  it('drops its placeholder and leaves the original when the rename fails', async () => {
    const denied: NodeJS.ErrnoException = new Error('EXDEV: cross-device link');
    denied.code = 'EXDEV';
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { failRenameWith: denied });
    await expect(createVerifiedBackup(CONFIG_PATH, fs.files.get(CONFIG_PATH)!, fs.deps)).rejects.toBeInstanceOf(
      EngineConfigBackupError
    );
    expect(fs.files.has(CONFIG_PATH)).toBe(true);
    expect(fs.files.has(BACKUP_PATH)).toBe(false);
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
    expect(await inspectEngineConfig(fs.deps)).toEqual({
      status: 'invalid',
      path: CONFIG_PATH,
      problem: { line: 5, column: 11, reason: 'Invalid TOML document: invalid value' },
      repair: { lineBreaks: 1 },
    });
  });

  it('reports a NON-UTF-8 config as invalid with NO repair and NO line/column', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: LONE_E9 });
    expect(await inspectEngineConfig(fs.deps)).toEqual({
      status: 'invalid',
      path: CONFIG_PATH,
      encodingLossy: true,
      repair: null,
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

describe('repairEngineConfig - backup BEFORE write, original never lost', () => {
  it('renames the original aside FIRST, then writes, and the file on disk parses', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const result = await repairEngineConfig(fs.deps);
    expect(result.ok).toBe(true);

    // Ordering, proven by the journal: reserve, move the original, then write.
    expect(fs.ops).toEqual([`create:${BACKUP_PATH}`, `rename:${CONFIG_PATH}->${BACKUP_PATH}`, `create:${CONFIG_PATH}`]);

    expect(fs.files.get(BACKUP_PATH)!.toString('utf-8')).toBe(REPORTED_CORRUPT);
    const repaired = fs.files.get(CONFIG_PATH)!.toString('utf-8');
    expect(() => parse(repaired)).not.toThrow();
    expect(isLineBreakOnlyEdit(REPORTED_CORRUPT, repaired)).toBe(true);
  });

  it('FAILURE BRANCH: a failed backup reservation writes NOTHING', async () => {
    const denied: NodeJS.ErrnoException = new Error('EACCES: permission denied');
    denied.code = 'EACCES';
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { failCreateWith: denied });
    const result = await repairEngineConfig(fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'backup-failed' });
    expect(fs.ops).toEqual([]);
    expect(fs.files.get(CONFIG_PATH)!.toString('utf-8')).toBe(REPORTED_CORRUPT);
  });

  it('FAILURE BRANCH: a failed rename leaves the original in place', async () => {
    const denied: NodeJS.ErrnoException = new Error('EROFS: read-only file system');
    denied.code = 'EROFS';
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { failRenameWith: denied });
    const result = await repairEngineConfig(fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'backup-failed' });
    expect(fs.files.get(CONFIG_PATH)!.toString('utf-8')).toBe(REPORTED_CORRUPT);
    expect(fs.files.has(BACKUP_PATH)).toBe(false);
  });

  it('FAILURE BRANCH: a failed repair write RESTORES the original', async () => {
    const denied: NodeJS.ErrnoException = new Error('ENOSPC: no space left on device');
    denied.code = 'ENOSPC';
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { failRepairWriteWith: denied });
    const result = await repairEngineConfig(fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'write-failed' });
    // Renamed back: the user has their original config.toml and no stray backup.
    expect(fs.files.get(CONFIG_PATH)!.toString('utf-8')).toBe(REPORTED_CORRUPT);
    expect(fs.files.has(BACKUP_PATH)).toBe(false);
  });

  it('REFUSES to rewrite a NON-UTF-8 config, touching nothing', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: LONE_E9 });
    const result = await repairEngineConfig(fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'nothing-to-repair' });
    expect(fs.ops).toEqual([]);
    // The 0xE9 byte is still there, byte for byte.
    expect(fs.files.get(CONFIG_PATH)!.equals(LONE_E9)).toBe(true);
  });

  it('refuses when there is no unambiguous fix, without touching anything', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: '[a]\nx = "unterminated\n' });
    const result = await repairEngineConfig(fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'nothing-to-repair' });
    expect(fs.ops).toEqual([]);
  });
});

describe('regenerateEngineConfig - confirmation, health check, verified move', () => {
  it('does NOTHING without confirmation', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const result = await regenerateEngineConfig({ confirmed: false }, fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'not-confirmed' });
    expect(fs.ops).toEqual([]);
    expect(fs.files.has(CONFIG_PATH)).toBe(true);
  });

  it('requires confirmed === true by IDENTITY, not truthiness', async () => {
    for (const truthy of ['true', 1, {}, [], 'yes'] as unknown as boolean[]) {
      const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
      const result = await regenerateEngineConfig({ confirmed: truthy }, fs.deps);
      expect(result).toMatchObject({ ok: false, reason: 'not-confirmed' });
      expect(fs.files.has(CONFIG_PATH)).toBe(true);
    }
  });

  it('survives a missing/absent options object', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const result = await regenerateEngineConfig(undefined as unknown as { confirmed: boolean }, fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'not-confirmed' });
    expect(fs.files.has(CONFIG_PATH)).toBe(true);
  });

  it('REFUSES to delete a config that parses, even when confirmed', async () => {
    const healthy = '[providers.anthropic]\napi_key = "sk-ant-REAL"\n';
    const fs = fakeFs({ [CONFIG_PATH]: healthy });
    const result = await regenerateEngineConfig({ confirmed: true }, fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'nothing-to-repair' });
    expect(fs.ops).toEqual([]);
    expect(fs.files.get(CONFIG_PATH)!.toString('utf-8')).toBe(healthy);
  });

  it('with confirmation on a BROKEN config: reserves, renames, no unlink at all', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT });
    const result = await regenerateEngineConfig({ confirmed: true }, fs.deps);
    expect(result).toMatchObject({ ok: true, backupPath: BACKUP_PATH });
    expect(fs.ops).toEqual([`create:${BACKUP_PATH}`, `rename:${CONFIG_PATH}->${BACKUP_PATH}`]);
    expect(fs.ops.some((op) => op.startsWith('unlink:'))).toBe(false);
    expect(fs.files.has(CONFIG_PATH)).toBe(false);
    // The credentials still exist - in the verified backup.
    expect(fs.files.get(BACKUP_PATH)!.toString('utf-8')).toBe(REPORTED_CORRUPT);
  });

  it('IS still available for a NON-UTF-8 config, byte-exactly', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: LONE_E9 });
    const result = await regenerateEngineConfig({ confirmed: true }, fs.deps);
    expect(result.ok).toBe(true);
    const backupBytes = fs.files.get(result.backupPath!)!;
    expect(sha256(backupBytes)).toBe(sha256(LONE_E9));
    expect(backupBytes.equals(LONE_E9)).toBe(true);
  });

  it('FAILURE BRANCH: a failed backup leaves the original in place', async () => {
    const denied: NodeJS.ErrnoException = new Error('ENOSPC: no space left on device');
    denied.code = 'ENOSPC';
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { failCreateWith: denied });
    const result = await regenerateEngineConfig({ confirmed: true }, fs.deps);
    expect(result).toMatchObject({ ok: false, reason: 'backup-failed' });
    expect(fs.ops).toEqual([]);
    expect(fs.files.get(CONFIG_PATH)!.toString('utf-8')).toBe(REPORTED_CORRUPT);
  });
});

/**
 * The acceptance criterion from #1024, executed against the REAL filesystem and
 * the REAL splice: before the repair, `spliceDesktopMcpProfile` refuses (so
 * Desktop cannot launch); after the repair, it succeeds (so Desktop can). The
 * rename, the exclusive create and the byte reads are the real `fs`
 * implementations from `defaultRecoveryDeps()`; only the path resolution is
 * redirected into a scratch dir so the live engine config is never a target.
 */
describe('against a real scratch config dir', () => {
  async function scratch(bytes: Buffer | string) {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, bytes);
    const deps: EngineConfigRecoveryDeps = {
      ...defaultRecoveryDeps(),
      resolveConfigPath: async () => configPath,
    };
    return { dir, configPath, deps };
  }

  it('turns a launch-blocking config into one the splice accepts', async () => {
    const { dir, configPath, deps } = await scratch(REPORTED_CORRUPT);
    const fragment = appendDesktopMcpProfile(null, ['search']);
    // BEFORE: the refusal fires. This is the #1024 dead end.
    expect(() => spliceDesktopMcpProfile(REPORTED_CORRUPT, fragment)).toThrow(DesktopProfileSpliceError);

    const result = await repairEngineConfig(deps);
    expect(result.ok).toBe(true);

    // The backup is on disk and byte-identical to the original.
    const backupBytes = await realReadFile(result.backupPath!);
    expect(sha256(backupBytes)).toBe(sha256(Buffer.from(REPORTED_CORRUPT, 'utf-8')));

    // AFTER: the splice succeeds against the file that is actually on disk.
    const repaired = await realReadFile(configPath, 'utf-8');
    expect(isLineBreakOnlyEdit(REPORTED_CORRUPT, repaired)).toBe(true);
    const spliced = spliceDesktopMcpProfile(repaired, fragment);
    expect(spliced).toContain(`[profiles.${WCORE_DESKTOP_MCP_PROFILE}]`);
    const parsed = parse(spliced) as { providers: { anthropic: { api_key: string } }; security: { enabled: boolean } };
    expect(parsed.providers.anthropic.api_key).toBe('sk-ant-api03-EXAMPLEKEYVALUE');
    expect(parsed.security.enabled).toBe(false);

    await rm(dir, { recursive: true, force: true });
  });

  it.each([
    ['a lone 0xE9 byte', LONE_E9],
    ['a truncated multi-byte sequence', TRUNCATED_MULTIBYTE],
    ['a UTF-16 encoded file', UTF16_CONFIG],
  ])('keeps %s byte-exact through regenerate, and never rewrites it', async (_label, bytes) => {
    const { dir, configPath, deps } = await scratch(bytes);

    // Repair must refuse outright - the file cannot be read losslessly.
    const repair = await repairEngineConfig(deps);
    expect(repair).toMatchObject({ ok: false, reason: 'nothing-to-repair' });
    expect((await realReadFile(configPath)).equals(bytes)).toBe(true);

    // Regenerate is available, and its backup is byte-exact at the BUFFER level.
    const result = await regenerateEngineConfig({ confirmed: true }, deps);
    expect(result.ok).toBe(true);
    const backupBytes = await realReadFile(result.backupPath!);
    expect(backupBytes.length).toBe(bytes.length);
    expect(sha256(backupBytes)).toBe(sha256(bytes));
    expect(backupBytes.equals(bytes)).toBe(true);
    expect(backupBytes.includes(Buffer.from([0xef, 0xbf, 0xbd]))).toBe(bytes.includes(Buffer.from([0xef, 0xbf, 0xbd])));
    expect(existsSync(configPath)).toBe(false);
    // Exactly one artefact is left behind: the backup.
    expect(readdirSync(dir)).toEqual([`config.toml.backup-${backupStamp(new Date())}`]);

    await rm(dir, { recursive: true, force: true });
  });

  it('never follows a symlink planted at a predictable write path', async () => {
    const CORRUPT = '[security]\nenabled = falseegress_allow = [ "a" ]\n';
    const { dir, configPath, deps } = await scratch(CORRUPT);
    const victim = join(dir, 'VICTIM.txt');
    await realWriteFile(victim, 'do not clobber me', 'utf-8');

    // The old implementation wrote through `<config>.wayland-recovery-<pid>.tmp`,
    // a fully predictable name it created WITHOUT `wx`; a symlink planted there
    // redirected the repaired TOML into this victim file. There is no temp file
    // at all now, and every create is exclusive.
    const { symlink } = await import('node:fs/promises');
    await symlink(victim, `${configPath}.wayland-recovery-${process.pid}.tmp`);

    const result = await repairEngineConfig(deps);
    expect(result.ok).toBe(true);
    expect(await realReadFile(victim, 'utf-8')).toBe('do not clobber me');
    const repaired = await realReadFile(configPath, 'utf-8');
    expect(() => parse(repaired)).not.toThrow();

    await rm(dir, { recursive: true, force: true });
  });

  it('FAILURE BRANCH on a real fs: an unwritable directory leaves the original intact', async () => {
    const { chmod } = await import('node:fs/promises');
    const { dir, configPath, deps } = await scratch(REPORTED_CORRUPT);
    const originalBytes = await realReadFile(configPath);

    // Make the config DIRECTORY unwritable, so the backup-name reservation fails.
    // This is the real-filesystem version of the injected `failCreateWith` cases:
    // both repair and regenerate must report `backup-failed` and touch nothing.
    await chmod(dir, 0o500);
    try {
      expect(await repairEngineConfig(deps)).toMatchObject({ ok: false, reason: 'backup-failed' });
      expect(await regenerateEngineConfig({ confirmed: true }, deps)).toMatchObject({
        ok: false,
        reason: 'backup-failed',
      });
    } finally {
      await chmod(dir, 0o700);
    }

    // Byte-for-byte intact, and no half-made backup left lying around.
    expect((await realReadFile(configPath)).equals(originalBytes)).toBe(true);
    expect(readdirSync(dir)).toEqual(['config.toml']);

    await rm(dir, { recursive: true, force: true });
  });

  it('regenerate leaves a real, readable backup and refuses a healthy file', async () => {
    const { dir, configPath, deps } = await scratch(REPORTED_CORRUPT);

    // Unconfirmed first: the file must still be there afterwards.
    expect(await regenerateEngineConfig({ confirmed: false }, deps)).toMatchObject({ reason: 'not-confirmed' });
    expect(await realReadFile(configPath, 'utf-8')).toBe(REPORTED_CORRUPT);

    const result = await regenerateEngineConfig({ confirmed: true }, deps);
    expect(result.ok).toBe(true);
    expect(existsSync(configPath)).toBe(false);
    expect(await realReadFile(result.backupPath!, 'utf-8')).toBe(REPORTED_CORRUPT);

    // A healthy config is refused rather than deleted.
    const healthy = await scratch('[providers.anthropic]\napi_key = "sk-ant-REAL"\n');
    expect(await regenerateEngineConfig({ confirmed: true }, healthy.deps)).toMatchObject({
      ok: false,
      reason: 'nothing-to-repair',
    });
    expect(existsSync(healthy.configPath)).toBe(true);

    await rm(dir, { recursive: true, force: true });
    await rm(healthy.dir, { recursive: true, force: true });
  });
});
