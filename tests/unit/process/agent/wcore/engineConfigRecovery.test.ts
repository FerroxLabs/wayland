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
import { appendFile, mkdir, mkdtemp, readFile as realReadFile, rm, writeFile as realWriteFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { parse } from 'smol-toml';
import { describe, expect, it, vi } from 'vitest';

/**
 * Counts every TOML parse without changing what one does.
 *
 * The two halves of the repair budget - bytes and wall clock - mask each other:
 * with both live, deleting either still yields "gave up", so a result-only
 * assertion cannot tell them apart and a mutant that removes the byte cap
 * survives. Parses are the unit the byte budget is actually spent in, so
 * counting them lets the byte cap be asserted directly, with the clock frozen
 * so it cannot be what stopped the work.
 */
const parseCalls = vi.hoisted(() => ({ n: 0 }));
vi.mock('smol-toml', async (importOriginal) => {
  const actual = await importOriginal<typeof import('smol-toml')>();
  return {
    ...actual,
    parse: (...args: Parameters<typeof actual.parse>) => {
      parseCalls.n += 1;
      return actual.parse(...args);
    },
  };
});
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
  type EngineConfigRecoveryResult,
} from '@process/agent/wcore/engineConfigRecovery';
import { DesktopProfileSpliceError, spliceDesktopMcpProfile } from '@process/agent/wcore/desktopProfileSplice';
import { appendDesktopMcpProfile, WCORE_DESKTOP_MCP_PROFILE } from '@process/agent/wcore/envBuilder';

const CONFIG_PATH = '/scratch/wayland-core/config.toml';
const BACKUP_PATH = '/scratch/wayland-core/config.toml.backup-20260817-142530';

/**
 * Fold a path's separators to `/` so the POSIX fixtures above mean the same file
 * on every platform.
 *
 * The module derives the backup name as `join(dirname(configPath), ...)`, and on
 * Windows those two disagree: `dirname` PRESERVES the `/` it was handed while
 * `join` emits `\`. Executed via `path.win32` rather than assumed -
 * `dirname('/scratch/wayland-core/config.toml')` is `'/scratch/wayland-core'`,
 * and joining the backup name onto it gives
 * `'\scratch\wayland-core\config.toml.backup-20260817-142530'`. So ONE path has
 * two spellings there, which is what reddened five of these tests on the Windows
 * runner while the module itself behaved correctly.
 *
 * Only the separators fold. Every other byte is still compared exactly, including
 * the whole backup filename - its `config.toml.backup-` prefix, its stamp, and the
 * `-2` collision suffix - so the assertions keep their teeth.
 */
const toPosix = (value: string) => value.split(sep).join('/');

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
    /**
     * Content something ELSE writes to `config.toml` just before the repair write,
     * so that write hits the same EEXIST production would (F2). The engine writing
     * defaults on a launch retry, or the user hand-saving the file that "Show me
     * the file" invited them to open.
     */
    foreignWriteBeforeRepair?: string;
    /** Paths `isRegularFile` reports as NOT regular - a symlink, a directory (F4). */
    irregularPaths?: string[];
  } = {}
): FakeFs {
  // Keyed on the CANONICAL spelling. A real filesystem resolves `\dir\file` and
  // `/dir/file` to the same file; a raw string-keyed Map does not, so on Windows a
  // path the module spelled with `join` missed a fixture seeded with `/` and the
  // EEXIST retry below was never reached. Canonicalising at the seam - rather than
  // at each call site - keeps every assertion comparing whole paths.
  const files = new Map<string, Buffer>(
    Object.entries(initial).map(([k, v]) => [toPosix(k), Buffer.isBuffer(v) ? v : Buffer.from(v, 'utf-8')])
  );
  const ops: string[] = [];
  const deps: EngineConfigRecoveryDeps = {
    resolveConfigPath: async () => CONFIG_PATH,
    readFileBytes: async (rawPath) => {
      const path = toPosix(rawPath);
      const value = files.get(path);
      if (value === undefined) {
        const error: NodeJS.ErrnoException = new Error(`ENOENT: no such file, open '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }
      return value;
    },
    writeFileExclusive: async (rawPath, data) => {
      const path = toPosix(rawPath);
      // The 0-byte reservation and the repair write share this dep, exactly as
      // production does; the options let each be failed independently.
      const isReservation = data === '';
      if (isReservation && options.failCreateWith) throw options.failCreateWith;
      if (!isReservation && options.failRepairWriteWith) throw options.failRepairWriteWith;
      if (!isReservation && options.foreignWriteBeforeRepair !== undefined && !files.has(path)) {
        // Not journalled in `ops`: this write is NOT one this module made.
        files.set(path, Buffer.from(options.foreignWriteBeforeRepair, 'utf-8'));
      }
      if (files.has(path)) {
        const error: NodeJS.ErrnoException = new Error('EEXIST: file already exists');
        error.code = 'EEXIST';
        throw error;
      }
      ops.push(`create:${path}`);
      files.set(path, Buffer.from(data, 'utf-8'));
    },
    renameFile: async (rawFrom, rawTo) => {
      const [from, to] = [toPosix(rawFrom), toPosix(rawTo)];
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
    removeFile: async (rawPath) => {
      const path = toPosix(rawPath);
      if (!files.has(path)) {
        const error: NodeJS.ErrnoException = new Error(`ENOENT: no such file, unlink '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }
      ops.push(`unlink:${path}`);
      files.delete(path);
    },
    isRegularFile: async (rawPath) => {
      const path = toPosix(rawPath);
      if (!files.has(path)) {
        const error: NodeJS.ErrnoException = new Error(`ENOENT: no such file, lstat '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }
      return !(options.irregularPaths ?? []).map(toPosix).includes(path);
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

  /**
   * The regression the three separate caps did NOT catch. Each of them bounds one
   * factor, but the cost is their PRODUCT, so an input can sit UNDER EVERY ONE of
   * them and still be ruinous. This shape does exactly that: 513,799 bytes (under
   * the 512 KiB source cap), 116 candidates on the failing line (under the 128
   * candidate cap), and the failing line at the END of the document so every
   * re-parse has to chew through the whole valid prefix first.
   *
   * Measured on the pre-fix planner, in-process, against this exact document: 852
   * parses totalling 417 MB. One parse of a REALISTIC config that size costs
   * ~424ms, so that is ~6 minutes of a frozen Electron main thread - every window
   * and all IPC - on a panel that auto-fires when it mounts. With the cumulative
   * budget: 4 parses, 1.96 MB.
   *
   * The filler here is comment lines, which parse ~250x cheaper per byte than a
   * real config. That is deliberate: it leaves the parse COUNT and parse BYTES
   * identical to the realistic shape while keeping this test fast. The wall-clock
   * bound below is therefore very generous and still fails loudly on a regression -
   * the pre-fix planner took 23.5s on this same document.
   */
  it('bounds the COST PRODUCT, not just the three factors (F7 regression)', () => {
    // Keys are THREE LETTERS, always. Every character of a bare key is its own
    // candidate offset, so a digit in the name silently inflates the count: an
    // earlier draft of this test used `k<letter><i>` and quietly went to 150
    // candidates, tripping MAX_BREAK_CANDIDATES and testing nothing at all.
    // 40 keys x 3 characters, less the line's own first token, is 119 - under 128.
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    const pairs = Array.from({ length: 40 }, (_, i) => `${alpha[i % 26]}${alpha[Math.floor(i / 26)]}q = "v"`);
    const commentLine = `# ${'f'.repeat(120)}\n`;
    const tail = `[tail]\n${pairs.join(' ')}\n`;
    let doc = '';
    while (Buffer.byteLength(doc, 'utf-8') + commentLine.length <= 513852 - Buffer.byteLength(tail, 'utf-8')) {
      doc += commentLine;
    }
    doc += tail;

    // Confirm the input really is under every legacy cap, or this proves nothing.
    expect(Buffer.byteLength(doc, 'utf-8')).toBeLessThan(512 * 1024);
    expect(Buffer.byteLength(tail.split('\n')[1], 'utf-8')).toBeLessThan(4096);

    const started = Date.now();
    expect(planLineBreakRepair(doc)).toBeNull();
    // Measured on this exact document with the budget disabled: 2638ms. With it:
    // 71ms, even with the machine at load 125. A 37x margin, so this is a real
    // guard rather than a coin flip under load.
    expect(Date.now() - started).toBeLessThan(500);
  });

  /** 20 KB of real tables plus a glued line needing 4 breaks - the shape a user
   *  actually has. Shared so the two clock cases below argue about the SAME
   *  document and differ only in what time does. */
  function normalSizedGluedConfig(): string {
    let doc = '';
    for (let t = 0; doc.length < 20000; t += 1) {
      doc += `[section_${t}]\nname = "value-${t}"\nnote = "padpadpadpadpadpadpadpadpadpad"\n\n`;
    }
    return doc + `[tail]\n${Array.from({ length: 5 }, (_, i) => `k${i} = 1`).join('')}\n`;
  }

  it('still repairs a normal-sized config that needs several breaks (known positive)', () => {
    // The BYTE budget must not have made the feature useless. Time is frozen so
    // the separate WALL-CLOCK bound cannot decide this case: with a real clock
    // the 250ms deadline races the test, and on a loaded machine it wins and
    // turns a statement about the byte budget into a statement about the load
    // average. The deadline gets its own test below rather than being asserted
    // here by accident.
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    try {
      const repair = planLineBreakRepair(normalSizedGluedConfig());
      expect(repair).not.toBeNull();
      expect(repair?.plan.lineBreaks).toBe(4);
      expect(() => parse(repair!.repaired)).not.toThrow();
    } finally {
      now.mockRestore();
    }
  });

  it('bounds PARSES by the byte budget alone, with the clock frozen', () => {
    // The byte half of the budget, asserted where the clock cannot reach it.
    // Same pathological document as the cost-product test above: 852 parses
    // totalling 417 MB before the budget existed, 4 parses and 1.96 MB after.
    // Frozen time means only the byte cap can stop this, and a count rather
    // than a stopwatch means a loaded machine cannot change the answer.
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    const pairs = Array.from({ length: 40 }, (_, i) => `${alpha[i % 26]}${alpha[Math.floor(i / 26)]}q = "v"`);
    const commentLine = `# ${'f'.repeat(120)}\n`;
    const tail = `[tail]\n${pairs.join(' ')}\n`;
    let doc = '';
    while (Buffer.byteLength(doc, 'utf-8') + commentLine.length <= 513852 - Buffer.byteLength(tail, 'utf-8')) {
      doc += commentLine;
    }
    doc += tail;

    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    parseCalls.n = 0;
    try {
      expect(planLineBreakRepair(doc)).toBeNull();
    } finally {
      now.mockRestore();
    }
    // 4 parses with the budget; 852 without. Anything in between still fails.
    expect(parseCalls.n).toBeLessThan(20);
  });

  it('gives up on that SAME config once the wall-clock deadline passes', () => {
    // The deadline half of the budget, which nothing covered while it was only
    // ever exercised by accident. A clock that jumps 200ms per reading passes
    // MAX_REPAIR_MILLIS partway through, so the planner must abandon a document
    // it just proved it can repair - and abandon it whole, returning null rather
    // than a partial plan.
    let t = 1_000_000;
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      const value = t;
      t += 200;
      return value;
    });
    try {
      expect(planLineBreakRepair(normalSizedGluedConfig())).toBeNull();
    } finally {
      now.mockRestore();
    }
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
    expect(toPosix(backupPath)).toBe(BACKUP_PATH);
    expect(fs.ops).toEqual([`create:${BACKUP_PATH}`, `rename:${CONFIG_PATH}->${BACKUP_PATH}`]);
    expect(fs.files.has(CONFIG_PATH)).toBe(false);
    expect(fs.files.get(BACKUP_PATH)!.toString('utf-8')).toBe(REPORTED_CORRUPT);
  });

  it('is byte-exact on a NON-UTF-8 file (the bug the first version had)', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: LONE_E9 });
    const backupPath = await createVerifiedBackup(CONFIG_PATH, LONE_E9, fs.deps);
    const backupBytes = fs.files.get(toPosix(backupPath))!;
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
    expect(toPosix(backupPath)).toBe(`${BACKUP_PATH}-2`);
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

  /**
   * F2. EEXIST means something ELSE created `config.toml` inside the recovery
   * window - the engine writing defaults on a launch retry, or the user
   * hand-saving the file that "Show me the file" just invited them to open.
   *
   * The rollback used to `unlink` that file unconditionally and rename the CORRUPT
   * original back over it, destroying a file this module never created, possibly
   * carrying a brand new credential, and reporting nothing. Executed before the
   * fix: `externalHealthySurvives=false`, `configIsOldCorrupt=true`,
   * `reportsBackupPath=false`.
   */
  it('FAILURE BRANCH: an EEXIST write keeps BOTH files and names the backup', async () => {
    const foreign = '[providers.anthropic]\napi_key = "sk-ant-BRAND-NEW-CREDENTIAL"\n';
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { foreignWriteBeforeRepair: foreign });

    const result = await repairEngineConfig(fs.deps);

    expect(result).toMatchObject({ ok: false, reason: 'restore-conflict' });
    expect(toPosix(result.backupPath!)).toBe(BACKUP_PATH);
    // The foreign file is UNTOUCHED - not replaced by the corrupt original.
    expect(fs.files.get(CONFIG_PATH)!.toString('utf-8')).toBe(foreign);
    // And the user's original bytes are still on disk, at the reported path.
    expect(fs.files.get(BACKUP_PATH)!.toString('utf-8')).toBe(REPORTED_CORRUPT);
    // Nothing was deleted at all.
    expect(fs.ops.filter((op) => op.startsWith('unlink:'))).toEqual([]);
  });

  /**
   * F4. Every write path renames the original aside then EXCLUSIVE-creates a fresh
   * file, which on a symlinked config silently converts the link into a regular
   * file: the link goes into the backup name and the real target keeps the broken
   * content forever. Executed before the guard: `configStillSymlink=false`,
   * `backupIsSymlink=true`, `targetStillOriginalBroken=true`.
   */
  it('REFUSES a config.toml that is not a regular file, touching nothing', async () => {
    const fs = fakeFs({ [CONFIG_PATH]: REPORTED_CORRUPT }, { irregularPaths: [CONFIG_PATH] });

    expect(await repairEngineConfig(fs.deps)).toMatchObject({ ok: false, reason: 'not-a-regular-file' });
    expect(await regenerateEngineConfig({ confirmed: true }, fs.deps)).toMatchObject({
      ok: false,
      reason: 'not-a-regular-file',
    });
    // Not one mutation on either path.
    expect(fs.ops).toEqual([]);
    expect(fs.files.get(CONFIG_PATH)!.toString('utf-8')).toBe(REPORTED_CORRUPT);
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
    expect(result).toMatchObject({ ok: true });
    expect(toPosix(result.backupPath!)).toBe(BACKUP_PATH);
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
    const backupBytes = fs.files.get(toPosix(result.backupPath!))!;
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

  /**
   * F4 on a REAL filesystem, with a real symlink and the real `lstat` seam. Before
   * the guard this returned `ok: true` while converting the link into a regular
   * file and leaving the actual target broken forever.
   */
  it('leaves a SYMLINKED config.toml and its target completely alone', async () => {
    const CORRUPT = '[security]\nenabled = falseegress_allow = [ "a" ]\n';
    const { lstat, symlink } = await import('node:fs/promises');
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-link-'));
    const target = join(dir, 'real-config.toml');
    const configPath = join(dir, 'config.toml');
    await realWriteFile(target, CORRUPT, 'utf-8');
    await symlink(target, configPath);

    const deps: EngineConfigRecoveryDeps = { ...defaultRecoveryDeps(), resolveConfigPath: async () => configPath };

    expect(await repairEngineConfig(deps)).toMatchObject({ ok: false, reason: 'not-a-regular-file' });
    expect(await regenerateEngineConfig({ confirmed: true }, deps)).toMatchObject({
      ok: false,
      reason: 'not-a-regular-file',
    });

    // Still a link, still pointing at the same target, and NO backup was made.
    expect((await lstat(configPath)).isSymbolicLink()).toBe(true);
    expect(await realReadFile(target, 'utf-8')).toBe(CORRUPT);
    expect(readdirSync(dir).filter((f) => f.startsWith('config.toml.backup-'))).toEqual([]);

    // The guard must not be firing on a plain file - the known positive.
    const plain = await scratch(CORRUPT);
    expect((await repairEngineConfig(plain.deps)).ok).toBe(true);

    await rm(dir, { recursive: true, force: true });
    await rm(plain.dir, { recursive: true, force: true });
  });

  /**
   * D2 on a REAL filesystem, with a real hardlink. `lstat().isFile()` is TRUE for
   * a hardlink, so the F4 guard passed it and the repair decoupled the two names:
   * executed before the link-count clause, `nlink=2 sameInode=true` going in, then
   * `ok:true`, `config.toml AFTER = repaired`, `dotfile AFTER = still the original
   * broken bytes`, `inodes now differ = true`. No bytes are lost - the original
   * inode survives, reachable from the other name - but the dotfiles copy keeps the
   * broken content forever and Wayland silently stops writing to it, which is the
   * outcome the symlink half of this guard exists to refuse.
   */
  it('leaves a HARDLINKED config.toml and its other name completely alone', async () => {
    const CORRUPT = '[security]\nenabled = falseegress_allow = [ "a" ]\n';
    const { link, lstat } = await import('node:fs/promises');
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-hardlink-'));
    const dotfile = join(dir, 'dotfiles-config.toml');
    const configPath = join(dir, 'config.toml');
    await realWriteFile(dotfile, CORRUPT, 'utf-8');
    await link(dotfile, configPath);

    // The premise: this IS a regular file by every check except the link count.
    const before = await lstat(configPath);
    expect(before.isFile()).toBe(true);
    expect(before.isSymbolicLink()).toBe(false);
    expect(before.nlink).toBe(2);

    const deps: EngineConfigRecoveryDeps = { ...defaultRecoveryDeps(), resolveConfigPath: async () => configPath };

    expect(await repairEngineConfig(deps)).toMatchObject({ ok: false, reason: 'not-a-regular-file' });
    expect(await regenerateEngineConfig({ confirmed: true }, deps)).toMatchObject({
      ok: false,
      reason: 'not-a-regular-file',
    });

    // Both names still point at the SAME inode, both still hold the user's bytes,
    // and nothing was moved aside.
    expect((await lstat(configPath)).ino).toBe((await lstat(dotfile)).ino);
    expect((await lstat(configPath)).nlink).toBe(2);
    expect(await realReadFile(configPath, 'utf-8')).toBe(CORRUPT);
    expect(await realReadFile(dotfile, 'utf-8')).toBe(CORRUPT);
    expect(readdirSync(dir).filter((f) => f.startsWith('config.toml.backup-'))).toEqual([]);

    // KNOWN POSITIVE: an ordinary single-link config in the same harness still
    // repairs, so the link-count clause is not refusing everything.
    const plain = await scratch(CORRUPT);
    expect((await lstat(plain.configPath)).nlink).toBe(1);
    expect((await repairEngineConfig(plain.deps)).ok).toBe(true);

    await rm(dir, { recursive: true, force: true });
    await rm(plain.dir, { recursive: true, force: true });
  });

  // Missing Windows primitive: POSIX mode bits. Windows does not implement them -
  // `chmod(dir, 0o500)` is a no-op there and every mode reads back 0o666 (measured
  // on the runner, same finding as sourceSigningAuthorityStore.test.ts) - so the
  // directory stays writable, the reservation SUCCEEDS, and this test asserted
  // `{ok:false}` against a genuine `{ok:true}`. There is nothing to provoke by this
  // mechanism, so it is skipped rather than relaxed.
  //
  // The INVARIANT is not skipped. The same production branch - a failed backup-name
  // reservation must report `backup-failed`, write nothing and leave the original
  // byte-intact - is asserted platform-independently by the injected `failCreateWith`
  // cases in `repairEngineConfig`/`regenerateEngineConfig` above, which DO run on
  // Windows. It was additionally provoked the Windows way by hand on the runner (a
  // real locked/read-only condition) and held.
  it.skipIf(process.platform === 'win32')(
    'FAILURE BRANCH on a real fs: an unwritable directory leaves the original intact',
    async () => {
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
    }
  );

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

/**
 * F3b (#1031 delta audit). The THIRD state in which `config.toml` is gone and the
 * user's original bytes live only at the backup: `createVerifiedBackup` completed
 * the rename, then the readback failed or the byte comparison did not match, and
 * the RESTORING rename failed as well. The error carried no path, so both callers
 * returned `backup-failed` with no `backupPath` and the panel rendered "nothing
 * was changed" over an absent config, pointing at nothing.
 *
 * Executed before the fix, on both branches and both write paths:
 * `result.backupPath=ABSENT`, `config.toml exists=false`, and the backup held the
 * original credential bytes under a timestamped name the user was never told.
 */
describe('F3b: the restoring rename fails after the move', () => {
  /**
   * Real filesystem for every operation except the ONE fault under test. The
   * restoring rename (backup -> config) is forced to fail in both modes. The
   * readback fault is an injected `EIO`; the byte MISMATCH is a REAL race - the
   * config is appended to between the read and the rename, from inside the
   * placeholder create that immediately precedes it - so no stub is reporting a
   * mismatch that did not happen.
   */
  async function brokenRestore(mode: 'readback-eio' | 'toctou') {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-f3b-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const real = defaultRecoveryDeps();
    const isBackup = (p: string) => p.startsWith(`${configPath}.backup-`);
    const deps: EngineConfigRecoveryDeps = {
      ...real,
      resolveConfigPath: async () => configPath,
      writeFileExclusive: async (path, data) => {
        await real.writeFileExclusive(path, data);
        if (mode === 'toctou' && isBackup(path)) await appendFile(configPath, '# raced\n', 'utf-8');
      },
      readFileBytes: async (path) => {
        if (mode === 'readback-eio' && isBackup(path)) {
          throw Object.assign(new Error('EIO: i/o error, read'), { code: 'EIO' });
        }
        return real.readFileBytes(path);
      },
      renameFile: async (from, to) => {
        // ONLY the restoring direction fails; the backup move itself is real.
        if (isBackup(from) && to === configPath) {
          throw Object.assign(new Error('EIO: i/o error, rename'), { code: 'EIO' });
        }
        return real.renameFile(from, to);
      },
    };
    return { dir, configPath, deps };
  }

  const writePaths: [string, (deps: EngineConfigRecoveryDeps) => Promise<EngineConfigRecoveryResult>][] = [
    ['repair', (deps) => repairEngineConfig(deps)],
    ['regenerate', (deps) => regenerateEngineConfig({ confirmed: true }, deps)],
  ];

  for (const mode of ['readback-eio', 'toctou'] as const) {
    for (const [label, run] of writePaths) {
      it(`${mode} on ${label}: config.toml is gone, so the backup MUST be named`, async () => {
        const { dir, configPath, deps } = await brokenRestore(mode);

        const result = await run(deps);
        expect(result).toMatchObject({ ok: false, reason: 'backup-failed' });

        // The premise of the "nothing was changed" line is false here.
        expect(existsSync(configPath)).toBe(false);

        // So the path the user needs has to come back with the failure.
        expect(result.backupPath).toBeTruthy();
        expect(result.backupPath.startsWith(`${configPath}.backup-`)).toBe(true);
        expect(existsSync(result.backupPath)).toBe(true);

        // And it is the user's original file, credential included.
        const kept = await realReadFile(result.backupPath, 'utf-8');
        expect(kept.startsWith(REPORTED_CORRUPT)).toBe(true);
        expect(kept).toContain('sk-ant-api03-EXAMPLEKEYVALUE');

        await rm(dir, { recursive: true, force: true });
      });
    }
  }

  it('KNOWN POSITIVE: the same scratch dir with no fault injected repairs cleanly', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-f3b-ok-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const deps: EngineConfigRecoveryDeps = { ...defaultRecoveryDeps(), resolveConfigPath: async () => configPath };

    const result = await repairEngineConfig(deps);
    expect(result.ok).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(existsSync(configPath)).toBe(true);

    await rm(dir, { recursive: true, force: true });
  });

  it('NEGATIVE CONTROL: a restore that SUCCEEDS reports no path, because the config is back', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-f3b-restored-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const real = defaultRecoveryDeps();
    const deps: EngineConfigRecoveryDeps = {
      ...real,
      resolveConfigPath: async () => configPath,
      readFileBytes: async (path) => {
        if (path.startsWith(`${configPath}.backup-`)) {
          throw Object.assign(new Error('EIO: i/o error, read'), { code: 'EIO' });
        }
        return real.readFileBytes(path);
      },
    };

    const result = await repairEngineConfig(deps);
    expect(result).toMatchObject({ ok: false, reason: 'backup-failed' });
    // "Nothing was changed" is TRUE here, so naming a backup would be the lie.
    expect(result.backupPath).toBeUndefined();
    expect(await realReadFile(configPath, 'utf-8')).toBe(REPORTED_CORRUPT);
    expect(readdirSync(dir)).toEqual(['config.toml']);

    await rm(dir, { recursive: true, force: true });
  });

  it('NEGATIVE CONTROL: a backup that fails BEFORE the move reports no path either', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-f3b-nomove-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const real = defaultRecoveryDeps();
    const deps: EngineConfigRecoveryDeps = {
      ...real,
      resolveConfigPath: async () => configPath,
      renameFile: async () => {
        throw Object.assign(new Error('EIO: i/o error, rename'), { code: 'EIO' });
      },
    };

    const result = await repairEngineConfig(deps);
    expect(result).toMatchObject({ ok: false, reason: 'backup-failed' });
    expect(result.backupPath).toBeUndefined();
    expect(await realReadFile(configPath, 'utf-8')).toBe(REPORTED_CORRUPT);
    expect(readdirSync(dir)).toEqual(['config.toml']);

    await rm(dir, { recursive: true, force: true });
  });
});

/**
 * D3 (#1031 delta audit). The rollback must never destroy a `config.toml` this
 * module did not create.
 *
 * `f261e7997` guarded exactly ONE of the windows in which that can happen - the
 * EEXIST-on-exclusive-create one, tested above - and the guard the FIX itself added
 * re-opened the problem on the other branch of the same function. Between the
 * backup move and any rollback, `config.toml` DOES NOT EXIST, and that window is
 * conditioned on a live concurrent writer rather than on chance: a byte mismatch IS
 * proof one is active, and "Show me the file" has just invited the user to open the
 * file in an editor.
 *
 * Executed against a real filesystem before the fix, with a foreign `config.toml`
 * planted inside the window: on all four (readback-EIO, byte-mismatch race) x
 * (repair, regenerate) and on EDQUOT-on-write / EIO-on-verify / unparseable-verify,
 * `FOREIGN_KEY_SURVIVED=false` every time, the backup was gone from disk, and the
 * panel said either "nothing was changed" (over an absent config) or "the change
 * could not be completed" with no path named.
 */
/** An injected read/rename I/O error, the shape a failing disk actually throws. */
const eio = (op: string) => Object.assign(new Error(`EIO: i/o error, ${op}`), { code: 'EIO' });

describe('D3: the rollback keeps a config.toml it did not create', () => {
  /** What a concurrent writer put there - a BRAND NEW credential, not the old one. */
  const FOREIGN = '[providers.anthropic]\napi_key = "sk-ant-api03-FRESHKEYFROMENGINE"\n';

  type Window = 'backup-readback-eio' | 'backup-byte-mismatch' | 'write-failed' | 'verify-eio' | 'verify-unparseable';

  /**
   * Real filesystem for every operation except the ONE fault under test.
   *
   * `plant` decides whether a foreign writer wins the window, so the same harness
   * drives the guard's positive AND its negative control. The byte MISMATCH is a
   * REAL race - the config is appended to between the planning read and the rename,
   * from inside the placeholder create that immediately precedes it - so no stub is
   * reporting a mismatch that did not happen.
   */
  async function scratchWindow(window: Window, plant: boolean) {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-d3-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const real = defaultRecoveryDeps();
    const isBackup = (p: string) => p.startsWith(`${configPath}.backup-`);
    const plantForeign = async () => {
      if (plant) await realWriteFile(configPath, FOREIGN, 'utf-8');
    };
    let configReads = 0;

    const deps: EngineConfigRecoveryDeps = {
      ...real,
      resolveConfigPath: async () => configPath,
      writeFileExclusive: async (path, data) => {
        if (isBackup(path)) {
          await real.writeFileExclusive(path, data);
          if (window === 'backup-byte-mismatch') await appendFile(configPath, '# raced\n', 'utf-8');
          return;
        }
        if (window === 'write-failed') {
          await plantForeign();
          throw Object.assign(new Error('EDQUOT: disk quota exceeded, write'), { code: 'EDQUOT' });
        }
        return real.writeFileExclusive(path, data);
      },
      readFileBytes: async (path) => {
        if (isBackup(path)) {
          if (window === 'backup-readback-eio') {
            await plantForeign();
            throw eio('read');
          }
          const bytes = await real.readFileBytes(path);
          if (window === 'backup-byte-mismatch') await plantForeign();
          return bytes;
        }
        configReads += 1;
        // Read 1 is the planning read, read 2 is the post-write verification, read 3
        // is the rollback's OWN look at the path. Only read 2 carries the fault, so
        // the rollback decides from the real file rather than from the injection -
        // letting the fault bleed into read 3 fakes a conflict nothing decided.
        if (configReads === 2) {
          if (window === 'verify-eio') {
            await plantForeign();
            throw eio('read');
          }
          if (window === 'verify-unparseable') {
            await plantForeign();
            return Buffer.from('[a]\nb = ceegress = 1 x=\n', 'utf-8');
          }
        }
        return real.readFileBytes(path);
      },
    };
    return { dir, configPath, deps };
  }

  /** The two backup-verification windows are reached by BOTH write paths. */
  const BACKUP_WINDOWS: Window[] = ['backup-readback-eio', 'backup-byte-mismatch'];
  /** The repair-write windows. Regenerate never writes, so it cannot reach these. */
  const WRITE_WINDOWS: Window[] = ['write-failed', 'verify-eio', 'verify-unparseable'];

  const runners: [string, (deps: EngineConfigRecoveryDeps) => Promise<EngineConfigRecoveryResult>][] = [
    ['repair', (deps) => repairEngineConfig(deps)],
    ['regenerate', (deps) => regenerateEngineConfig({ confirmed: true }, deps)],
  ];

  for (const window of [...BACKUP_WINDOWS, ...WRITE_WINDOWS]) {
    for (const [label, run] of runners) {
      if (WRITE_WINDOWS.includes(window) && label === 'regenerate') continue;

      it(`${window} on ${label}: a foreign config.toml is KEPT and both files are reported`, async () => {
        const { dir, configPath, deps } = await scratchWindow(window, true);

        const result = await run(deps);

        // `restore-conflict` is the code F2 already spends on exactly this state.
        expect(result).toMatchObject({ ok: false, reason: 'restore-conflict' });

        // The foreign file - which can hold a brand new credential - is UNTOUCHED.
        expect(await realReadFile(configPath, 'utf-8')).toBe(FOREIGN);

        // And the user's original is still on disk, at the reported path.
        expect(result.backupPath).toBeTruthy();
        const kept = await realReadFile(result.backupPath, 'utf-8');
        expect(kept.startsWith(REPORTED_CORRUPT)).toBe(true);
        expect(kept).toContain('sk-ant-api03-EXAMPLEKEYVALUE');
        expect(readdirSync(dir).length).toBe(2);

        await rm(dir, { recursive: true, force: true });
      });

      it(`${window} on ${label}: NEGATIVE CONTROL - with no concurrent writer the rollback still runs`, async () => {
        const { dir, configPath, deps } = await scratchWindow(window, false);

        const result = await run(deps);

        // The guard must not fire on the ordinary failure: "nothing was changed" and
        // "the change could not be completed" are TRUE here, and naming a backup the
        // user does not need to go and find would be the lie in the other direction.
        expect(result.ok).toBe(false);
        expect(result.reason).not.toBe('restore-conflict');
        expect(result.backupPath).toBeUndefined();
        expect(await realReadFile(configPath, 'utf-8')).toContain('sk-ant-api03-EXAMPLEKEYVALUE');
        expect(readdirSync(dir)).toEqual(['config.toml']);

        await rm(dir, { recursive: true, force: true });
      });
    }
  }

  /**
   * NEGATIVE CONTROL for the ownership test itself.
   *
   * On a genuinely full disk `writeFile(..., 'wx')` CREATES the file and then the
   * write fails, so the rollback finds a 0-byte `config.toml` that this module did
   * create. Calling that foreign would leave a truncated config in place and report
   * a conflict that never happened, so a PREFIX of the intended text counts as ours.
   */
  it('NEGATIVE CONTROL: a `wx` write that created the file and then failed is OURS, so it is cleared', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-d3-partial-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const real = defaultRecoveryDeps();
    const deps: EngineConfigRecoveryDeps = {
      ...real,
      resolveConfigPath: async () => configPath,
      writeFileExclusive: async (path, data) => {
        if (path === configPath) {
          await real.writeFileExclusive(path, ''); // the create succeeds ...
          throw Object.assign(new Error('ENOSPC: no space left on device, write'), { code: 'ENOSPC' });
        }
        return real.writeFileExclusive(path, data);
      },
    };

    const result = await repairEngineConfig(deps);

    expect(result).toMatchObject({ ok: false, reason: 'write-failed' });
    expect(result.backupPath).toBeUndefined();
    expect(await realReadFile(configPath, 'utf-8')).toBe(REPORTED_CORRUPT);
    expect(readdirSync(dir)).toEqual(['config.toml']);

    await rm(dir, { recursive: true, force: true });
  });

  /**
   * A foreign file this module cannot even READ is still a file it did not create,
   * so it resolves to a conflict rather than to a deletion. Executed on a directory
   * planted at the config path, which is the shape a `readFileBytes` cannot decide.
   */
  it('an UNIDENTIFIABLE occupant is treated as foreign, never removed', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-d3-opaque-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const real = defaultRecoveryDeps();
    const isBackup = (p: string) => p.startsWith(`${configPath}.backup-`);
    const deps: EngineConfigRecoveryDeps = {
      ...real,
      resolveConfigPath: async () => configPath,
      readFileBytes: async (path) => {
        if (isBackup(path)) {
          await mkdir(configPath); // something opaque now occupies the path
          throw Object.assign(new Error('EIO: i/o error, read'), { code: 'EIO' });
        }
        return real.readFileBytes(path);
      },
    };

    const result = await repairEngineConfig(deps);

    expect(result).toMatchObject({ ok: false, reason: 'restore-conflict' });
    expect(result.backupPath).toBeTruthy();
    expect(await realReadFile(result.backupPath, 'utf-8')).toBe(REPORTED_CORRUPT);
    expect(statSync(configPath).isDirectory()).toBe(true);

    await rm(dir, { recursive: true, force: true });
  });
});

/**
 * D4 (#1031 delta audit round 3). Invariant 8 was absolute in the prose and false
 * in the executed code, because ONE prefix test served three branches that are not
 * the same state.
 *
 * On the write-FAILURE branch a partial `wx` write is genuinely possible, so a
 * 0-byte or truncated occupant may be this module's own and a prefix counts as ours
 * - the ENOSPC control above pins that and must keep passing. On the VERIFY branches
 * `writeFileExclusive` has already RETURNED with the full text, so a short occupant
 * is PROOF of a concurrent writer, and for 0 bytes the prefix test needed no content
 * coincidence at all: an editor that truncates before saving matched it every time.
 *
 * Executed before the fix, same occupant bytes in two windows, opposite outcomes:
 * `backup-readback-eio` reported `restore-conflict` with the backup named and the
 * occupant kept, while `verify-eio` reported `write-failed` with NO path, having
 * `unlink`ed the occupant - sending the concurrent writer's remaining bytes,
 * possibly a fresh credential, to an unlinked inode.
 */
describe('D4: after a write that SUCCEEDED, a short config.toml is a concurrent writer', () => {
  /**
   * A COMPLETE, parseable provider block that is also a strict PREFIX of both the
   * original and the repair - so it passes the old prefix test on content, not by
   * being empty. 63 bytes: the table header plus the whole `api_key` line.
   */
  const PREFIX_OCCUPANT = REPORTED_CORRUPT.slice(0, 63);

  /** Both verify branches: the write returned, then the confirmation failed. */
  type VerifyWindow = 'verify-eio' | 'verify-unparseable';

  /**
   * Real filesystem for everything except the one verify fault. `occupant` is
   * written at `configPath` at the instant the fault fires, which is inside the
   * window where `config.toml` does not exist.
   */
  async function verifyWindow(window: VerifyWindow, occupant: string) {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-d4-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const real = defaultRecoveryDeps();
    const isBackup = (p: string) => p.startsWith(`${configPath}.backup-`);
    let configReads = 0;

    const deps: EngineConfigRecoveryDeps = {
      ...real,
      resolveConfigPath: async () => configPath,
      readFileBytes: async (path) => {
        if (isBackup(path)) return real.readFileBytes(path);
        configReads += 1;
        // Read 1 plans, read 2 verifies, read 3 is the rollback's own look. Only
        // read 2 carries the fault, so the rollback decides from the real file.
        if (configReads === 2) {
          await realWriteFile(configPath, occupant, 'utf-8');
          if (window === 'verify-eio') throw eio('read');
          return Buffer.from('[a]\nb = ceegress = 1 x=\n', 'utf-8');
        }
        return real.readFileBytes(path);
      },
    };
    return { dir, configPath, deps };
  }

  for (const window of ['verify-eio', 'verify-unparseable'] as VerifyWindow[]) {
    for (const [label, occupant] of [
      ['0-byte', ''],
      ['a parseable PREFIX of the repair', PREFIX_OCCUPANT],
    ] as [string, string][]) {
      it(`${window}: ${label} occupant is KEPT, not cleared, and both files are named`, async () => {
        const { dir, configPath, deps } = await verifyWindow(window, occupant);

        const result = await repairEngineConfig(deps);

        // A write still IN PROGRESS is not this module's finished write.
        expect(result).toMatchObject({ ok: false, reason: 'restore-conflict' });
        expect(result.detail).toContain('both files were kept');

        // Byte-exact: the occupant was never unlinked and never renamed over.
        expect(await realReadFile(configPath, 'utf-8')).toBe(occupant);

        // And the user's original is on disk at the reported path.
        expect(result.backupPath).toBeTruthy();
        expect(await realReadFile(result.backupPath as string, 'utf-8')).toBe(REPORTED_CORRUPT);
        expect(readdirSync(dir).length).toBe(2);

        await rm(dir, { recursive: true, force: true });
      });
    }
  }

  /**
   * The EEXIST early return is the ONLY thing keeping the most common
   * concurrent-writer case - the writer got there FIRST - out of the prefix
   * allowance, and nothing pinned it: a mutant swapping EEXIST for ENOENT survived,
   * because a DIVERGENT occupant reaches the same `restore-conflict` by
   * fall-through. A 0-byte occupant does not: fall-through would call it ours and
   * clear it. So the pin uses a 0-byte one, and the EEXIST is REAL - a genuinely
   * concurrent create, with the exclusive create reporting it, not a thrown stub.
   */
  it('a REAL EEXIST from a 0-byte concurrent create keeps both files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-d4-eexist-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const real = defaultRecoveryDeps();
    const isBackup = (p: string) => p.startsWith(`${configPath}.backup-`);
    const deps: EngineConfigRecoveryDeps = {
      ...real,
      resolveConfigPath: async () => configPath,
      readFileBytes: async (path) => {
        const bytes = await real.readFileBytes(path);
        // The backup readback sits between the move and the `wx` write, so a create
        // here is inside the window and the real `wx` below really does fail.
        if (isBackup(path)) await realWriteFile(configPath, '', 'utf-8');
        return bytes;
      },
    };

    const result = await repairEngineConfig(deps);

    expect(result).toMatchObject({ ok: false, reason: 'restore-conflict' });
    expect(result.backupPath).toBeTruthy();
    expect(await realReadFile(configPath, 'utf-8')).toBe('');
    expect(await realReadFile(result.backupPath as string, 'utf-8')).toBe(REPORTED_CORRUPT);

    await rm(dir, { recursive: true, force: true });
  });

  /**
   * F2 round 3, finding 2. The `failed` rollback branch is the ONE state in which
   * `config.toml` does not exist at all - the restoring rename threw, so the user's
   * only copy is the backup - and dropping `backupPath` from it passed the whole
   * suite. That regression is exactly the "told the change failed, never told where
   * the config went" lie, on the state where it costs the most.
   */
  it('a rollback whose restoring rename FAILS still names the backup, with config.toml gone', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-d4-exdev-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const real = defaultRecoveryDeps();
    const isBackup = (p: string) => p.startsWith(`${configPath}.backup-`);
    let configReads = 0;
    const deps: EngineConfigRecoveryDeps = {
      ...real,
      resolveConfigPath: async () => configPath,
      // Only the RESTORING direction fails, so the backup move itself is real.
      renameFile: async (from, to) => {
        if (isBackup(from) && to === configPath) {
          throw Object.assign(new Error('EXDEV: cross-device link not permitted, rename'), { code: 'EXDEV' });
        }
        return real.renameFile(from, to);
      },
      readFileBytes: async (path) => {
        if (isBackup(path)) return real.readFileBytes(path);
        configReads += 1;
        if (configReads === 2) throw eio('read');
        return real.readFileBytes(path);
      },
    };

    const result = await repairEngineConfig(deps);

    expect(result).toMatchObject({ ok: false, reason: 'write-failed' });
    // The assertion that was missing: the user is TOLD where their config went.
    expect(result.backupPath).toBeTruthy();
    expect(await realReadFile(result.backupPath as string, 'utf-8')).toBe(REPORTED_CORRUPT);
    // And it is the only copy - `config.toml` is genuinely absent here.
    expect(existsSync(configPath)).toBe(false);
    expect(readdirSync(dir).length).toBe(1);

    await rm(dir, { recursive: true, force: true });
  });

  /**
   * The own-failed-write cleanup is load-bearing only on WINDOWS, so removing it
   * survives a POSIX suite: POSIX `rename` overwrites the destination atomically,
   * while `fs.rename` on Windows fails when the destination exists. Emulating just
   * that one platform rule pins the line on every runner.
   */
  it('WINDOWS-SHAPED: the own-failed-write cleanup is what lets the restoring rename land', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wayland-configrecovery-d4-win-'));
    const configPath = join(dir, 'config.toml');
    await realWriteFile(configPath, REPORTED_CORRUPT, 'utf-8');
    const real = defaultRecoveryDeps();
    const deps: EngineConfigRecoveryDeps = {
      ...real,
      resolveConfigPath: async () => configPath,
      writeFileExclusive: async (path, data) => {
        if (path === configPath) {
          await real.writeFileExclusive(path, ''); // the `wx` create succeeds ...
          throw Object.assign(new Error('ENOSPC: no space left on device, write'), { code: 'ENOSPC' });
        }
        return real.writeFileExclusive(path, data);
      },
      // The Windows rule, on the RESTORING rename only. The backup move lands on
      // the reserved 0-byte placeholder on purpose, and that Windows gap is a
      // separate question from the one this test pins.
      renameFile: async (from, to) => {
        if (to === configPath && existsSync(to)) {
          throw Object.assign(new Error('EPERM: operation not permitted, rename'), { code: 'EPERM' });
        }
        return real.renameFile(from, to);
      },
    };

    const result = await repairEngineConfig(deps);

    // Without the cleanup this is `failed`, naming a backup the user need not find.
    expect(result).toMatchObject({ ok: false, reason: 'write-failed' });
    expect(result.backupPath).toBeUndefined();
    expect(await realReadFile(configPath, 'utf-8')).toBe(REPORTED_CORRUPT);
    expect(readdirSync(dir)).toEqual(['config.toml']);

    await rm(dir, { recursive: true, force: true });
  });
});
