/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #928 - "IJFW Memory throws on Windows".
 *
 * `buildChildEnv` is the env filter for EVERY IJFW child (the `npm view`
 * version probe, the `npx @ijfw/install` bootstrap, the MCP spawn-test and the
 * long-lived memory client). Its allowlist was written against a POSIX login
 * environment and contained not one Windows variable.
 *
 * The key names below are the LITERAL output of
 * `node -e "Object.keys(process.env)"` executed on Sean's Windows box, so the
 * casing is the OS's, not a guess. Two things follow from that casing:
 *
 *   1. Windows names the search path `Path`, not `PATH`. A case-SENSITIVE
 *      `Set.has('Path')` misses it, so the child was spawned with no search
 *      path at all - worse than the triaged symptom. (`safeSpawn.ts` already
 *      reads `env['PATH'] ?? env['Path']` for exactly this reason.)
 *   2. `ComSpec` and `SystemRoot` are likewise not upper-case.
 *
 * Windows env names are case-INSENSITIVE at the OS level, so matching them
 * case-insensitively on win32 widens nothing: `path` and `PATH` are the same
 * variable there. On POSIX they are different variables, so the match stays
 * exact - pinned by the darwin cases below.
 *
 * These tests run on any host: the platform is stubbed, and `buildChildEnv`
 * reads only `process.env` + `process.platform`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildChildEnv } from '@process/services/ijfw/envAllowlist';

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_PLATFORM = process.platform;

/**
 * A Windows process env, keyed exactly as Windows presents it. Trimmed from the
 * real capture to the names that matter here plus a few known-secret names.
 */
const WINDOWS_ENV: Record<string, string> = {
  ALLUSERSPROFILE: 'C:\\ProgramData',
  APPDATA: 'C:\\Users\\sean\\AppData\\Roaming',
  ComSpec: 'C:\\WINDOWS\\system32\\cmd.exe',
  HOMEDRIVE: 'C:',
  HOMEPATH: '\\Users\\sean',
  LOCALAPPDATA: 'C:\\Users\\sean\\AppData\\Local',
  PATHEXT: '.COM;.EXE;.BAT;.CMD',
  Path: 'C:\\WINDOWS\\system32;C:\\Program Files\\nodejs',
  ProgramFiles: 'C:\\Program Files',
  SystemDrive: 'C:',
  SystemRoot: 'C:\\WINDOWS',
  TEMP: 'C:\\Users\\sean\\AppData\\Local\\Temp',
  TMP: 'C:\\Users\\sean\\AppData\\Local\\Temp',
  USERNAME: 'sean',
  USERPROFILE: 'C:\\Users\\sean',
  windir: 'C:\\WINDOWS',
  // Real secrets seen in that same capture. They must never reach a child.
  ANTHROPIC_API_KEY_DIRECT: 'sk-ant-must-not-leak',
  SENDGRID_API_KEY: 'SG.must-not-leak',
  SUPERMEMORY_CC_API_KEY: 'must-not-leak',
};

function setEnv(vars: Record<string, string>): void {
  for (const k of Object.keys(process.env)) delete process.env[k];
  Object.assign(process.env, vars);
}

function setPlatform(platform: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
}

describe('ijfw/envAllowlist on Windows (#928)', () => {
  beforeEach(() => {
    setPlatform('win32');
    setEnv(WINDOWS_ENV);
  });

  afterEach(() => {
    setPlatform(ORIGINAL_PLATFORM);
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, ORIGINAL_ENV);
  });

  it('forwards the search path under its real Windows name `Path`', () => {
    // Without this the child has NO search path: npm/npx cannot find git,
    // node-gyp or any shim, and every spawn under it fails opaquely.
    const env = buildChildEnv();
    expect(env.Path).toBe('C:\\WINDOWS\\system32;C:\\Program Files\\nodejs');
  });

  it('forwards the npm prefix roots APPDATA and LOCALAPPDATA', () => {
    // npm derives its user-writable global prefix from APPDATA. With APPDATA
    // gone it falls back beside the node install (Program Files), where an
    // unelevated write is EPERM - the error the #928 reporter saw.
    const env = buildChildEnv();
    expect(env.APPDATA).toBe('C:\\Users\\sean\\AppData\\Roaming');
    expect(env.LOCALAPPDATA).toBe('C:\\Users\\sean\\AppData\\Local');
  });

  it('forwards SystemRoot, USERPROFILE, ComSpec and PATHEXT', () => {
    // SystemRoot: winsock/DNS resolution in a child dies without it, so the
    // npm registry fetch fails even when the prefix is writable.
    // USERPROFILE: Windows has no HOME; os.homedir() reads USERPROFILE.
    // ComSpec: any `shell: true` / .cmd shim spawn needs it.
    // PATHEXT: without it a bare `npm` never resolves to `npm.cmd`.
    const env = buildChildEnv();
    expect(env.SystemRoot).toBe('C:\\WINDOWS');
    expect(env.USERPROFILE).toBe('C:\\Users\\sean');
    expect(env.ComSpec).toBe('C:\\WINDOWS\\system32\\cmd.exe');
    expect(env.PATHEXT).toBe('.COM;.EXE;.BAT;.CMD');
  });

  it('still strips secrets on Windows (SEC-005 is not relaxed)', () => {
    const env = buildChildEnv();
    expect(env.ANTHROPIC_API_KEY_DIRECT).toBeUndefined();
    expect(env.SENDGRID_API_KEY).toBeUndefined();
    expect(env.SUPERMEMORY_CC_API_KEY).toBeUndefined();
  });

  it('case-insensitive matching admits only allowlisted NAMES, not neighbours', () => {
    setEnv({
      ...WINDOWS_ENV,
      APPDATA_TOKEN: 'must-not-leak',
      MY_APPDATA: 'must-not-leak',
      PATHOLOGY: 'must-not-leak',
    });
    const env = buildChildEnv();
    expect(env.APPDATA_TOKEN).toBeUndefined();
    expect(env.MY_APPDATA).toBeUndefined();
    expect(env.PATHOLOGY).toBeUndefined();
  });

  it('does not emit two case-variant spellings of one Windows variable', () => {
    // A Windows env block with both `Path` and `PATH` is ambiguous - which one
    // the child sees is undefined. `ijfwSystemService` passes an augmented
    // `PATH` extra while the OS gave us `Path`, so the extra must REPLACE the
    // forwarded spelling rather than sit beside it.
    const env = buildChildEnv({ PATH: 'C:\\augmented' });
    const pathish = Object.keys(env).filter((k) => k.toLowerCase() === 'path');
    expect(pathish).toHaveLength(1);
    expect(env[pathish[0]!]).toBe('C:\\augmented');
  });
});

describe('ijfw/envAllowlist stays case-SENSITIVE off Windows', () => {
  beforeEach(() => {
    setPlatform('darwin');
  });

  afterEach(() => {
    setPlatform(ORIGINAL_PLATFORM);
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, ORIGINAL_ENV);
  });

  it('does not forward a lower-cased spelling on darwin', () => {
    // On POSIX `path` and `PATH` are two different variables; only the exact
    // allowlisted name may pass.
    setEnv({ PATH: '/usr/bin', path: '/tmp/evil', Home: '/tmp/evil' });
    const env = buildChildEnv();
    expect(env.PATH).toBe('/usr/bin');
    expect(env.path).toBeUndefined();
    expect(env.Home).toBeUndefined();
  });

  it('does not forward the Windows-only additions on darwin', () => {
    setEnv({ PATH: '/usr/bin', APPDATA: '/tmp/x', LOCALAPPDATA: '/tmp/x', USERPROFILE: '/tmp/x' });
    const env = buildChildEnv();
    expect(env.PATH).toBe('/usr/bin');
    expect(env.APPDATA).toBeUndefined();
    expect(env.LOCALAPPDATA).toBeUndefined();
    expect(env.USERPROFILE).toBeUndefined();
  });
});
