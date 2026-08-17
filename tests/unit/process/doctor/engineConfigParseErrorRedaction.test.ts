/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * GHSA-2g2m-r86j-jg6h - the engine-config integrity check must not carry the
 * user's provider credentials into the Doctor report.
 *
 * `smol-toml` parse errors echo the offending source line AND its neighbours
 * verbatim. The engine's `config.toml` holds real `api_key` values, and the
 * Doctor panel has a "Copy report" button and exists to be shared with support,
 * so a malformed line anywhere near a credential put that credential into the
 * shared report.
 *
 * These tests run the REAL path end to end: a real corrupt file on disk, the
 * real `readConfig` (so a real `smol-toml` error), the real producer
 * (`probeEngineConfig`) and the real check. Nothing about the error text is
 * simulated.
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readConfig, resolveUserConfigPath } from '@process/agent/wcore/configBridge';
import { ProfileIsolationError, activeMarkerPath, resolveActiveConfigPath } from '@process/agent/wcore/profilePaths';
import { probeEngineConfig } from '@process/doctor/engineConfigProbe';
import { checkEngineConfigIntegrity } from '@process/doctor/checks/configChecks';
import { redactSecrets } from '@process/utils/secretRedaction';
import { summarizeTomlError, tomlErrorPosition } from '@process/utils/tomlErrorSummary';

/**
 * A BARE credential used as a profile name. `PROFILE_NAME_RE` allows 64 characters
 * of `[A-Za-z0-9._-]`, so this is a legal profile name, and nothing in any
 * scrubber can match it - no label, no assignment, no recognisable prefix.
 */
const BARE_SECRET = 'f0e9d8c7b6a5948372615041302f1e0d';

/**
 * A realistically-shaped Anthropic key. The malformed line sits IMMEDIATELY
 * BELOW it, which is what puts it inside the parser's echoed context block.
 */
const API_KEY = 'sk-ant-api03-Zx91QmT4LpVn7BdKe0RsYcHu2WjAgF6oXlP3NtEbQvMk8ZaSdCyRfGhJ';

/**
 * The matcher every "no secret survived" assertion below depends on. Checks a
 * distinctive PREFIX as well as the whole value, so a truncated or partially
 * masked leak still counts as a leak.
 */
const findsKey = (text: string): boolean => text.includes(API_KEY) || text.includes('sk-ant-api03-Zx91');

const CORRUPT_CONFIG = [
  '[providers.anthropic]',
  `api_key = "${API_KEY}"`,
  'base_url = "https://api.anthropic.com" oops',
  '',
  '[security]',
  'backend = "plaintext"',
].join('\n');

const VALID_CONFIG = ['[providers.anthropic]', `api_key = "${API_KEY}"`, ''].join('\n');

let dir: string;
let configPath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'doctor-config-leak-'));
  configPath = join(dir, 'config.toml');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

/** Run the whole production path over the file currently at `configPath`. */
async function doctorOutcome() {
  return checkEngineConfigIntegrity(() => probeEngineConfig(configPath));
}

describe('engine config parse errors (GHSA-2g2m-r86j-jg6h)', () => {
  beforeEach(async () => {
    await writeFile(configPath, CORRUPT_CONFIG, 'utf-8');
  });

  it('KNOWN POSITIVE: the raw parse error really does carry the api_key', async () => {
    let raw = '';
    try {
      await readConfig(configPath);
    } catch (error) {
      raw = error instanceof Error ? error.message : String(error);
    }
    // If this ever stops holding, every "no key found" assertion below is
    // vacuous and proves nothing.
    expect(raw).not.toBe('');
    expect(findsKey(raw)).toBe(true);
  });

  it('does not put the api_key into the Doctor detail or remediation', async () => {
    const result = await doctorOutcome();
    expect(result.status).toBe('fail');
    expect(findsKey(result.detail)).toBe(false);
    expect(findsKey(result.remediation ?? '')).toBe(false);
  });

  it('drops the echoed source block entirely, not just the credential in it', async () => {
    const result = await doctorOutcome();
    // This is the assertion that actually carries the fix, and it holds WITHOUT
    // relying on `redactSecrets`. Masking alone is not enough on two counts:
    // the echoed lines would still hand out the rest of the user's config
    // (`base_url`, the `[security]` backend, whatever else the parser quoted),
    // and the scrubber misses the prefixed label form `ANTHROPIC_API_KEY=<value>`
    // outright (#1026). The whole block goes.
    expect(result.detail).not.toContain('api_key');
    expect(result.detail).not.toContain('base_url');
    expect(result.detail).not.toContain('\n');
    expect(result.remediation ?? '').not.toContain('\n');
  });

  it('still reports an actionable position (line and column numbers)', async () => {
    const result = await doctorOutcome();
    expect(result.detail).toMatch(/line 3/);
    expect(result.detail).toMatch(/column \d+/);
    expect(result.remediation).toMatch(/line 3, column \d+/);
  });

  it('keeps the human-readable reason', async () => {
    const result = await doctorOutcome();
    expect(result.detail).toContain('Invalid TOML document');
  });
});

describe('engine config integrity — non-corrupt paths', () => {
  it('passes on a config that parses, without echoing its contents', async () => {
    await writeFile(configPath, VALID_CONFIG, 'utf-8');
    const result = await doctorOutcome();
    expect(result.status).toBe('pass');
    expect(findsKey(result.detail)).toBe(false);
  });

  it('passes as a fresh install when the file is absent', async () => {
    const result = await doctorOutcome();
    expect(result.status).toBe('pass');
    expect(result.detail.toLowerCase()).toContain('fresh install');
  });
});

describe('checkEngineConfigIntegrity defence in depth', () => {
  it('scrubs a credential even when the injected producer failed to', async () => {
    // The producer sanitises, but this check is dependency-injected and every
    // future caller inherits the copy-to-support blast radius.
    const result = await checkEngineConfigIntegrity(async () => ({
      status: 'corrupt' as const,
      message: `unsanitised: api_key = "${API_KEY}"`,
      line: 7,
      column: 11,
    }));
    expect(findsKey(result.detail)).toBe(false);
    expect(result.detail).toContain('line 7, column 11');
  });
});

describe('engine config target — the ACTIVE profile, not the native config', () => {
  /**
   * With a named profile active these two paths differ, and the check used to
   * read the native one while the recovery panel mounted under the same row read
   * the active one. The user-visible result was a row that failed forever, a panel
   * beneath it reporting `ok`, and Reveal opening neither file.
   *
   * The active path is the correct side: the engine spawn sets `WAYLAND_HOME` from
   * `resolveActiveConfigDir()` (`WCoreAgent.resolveWaylandHomeForLaunch`) and Core
   * treats `$WAYLAND_HOME` as the literal config dir, so the active profile's
   * `config.toml` IS the file the engine launches against.
   */
  let profilesRootDir: string;
  const previousRoot = process.env.WAYLAND_PROFILES_ROOT;

  beforeEach(async () => {
    profilesRootDir = await mkdtemp(join(tmpdir(), 'doctor-profiles-'));
    process.env.WAYLAND_PROFILES_ROOT = profilesRootDir;
    await mkdir(join(profilesRootDir, 'work'), { recursive: true });
    await writeFile(activeMarkerPath(), 'work', 'utf-8');
  });

  afterEach(async () => {
    if (previousRoot === undefined) delete process.env.WAYLAND_PROFILES_ROOT;
    else process.env.WAYLAND_PROFILES_ROOT = previousRoot;
    await rm(profilesRootDir, { recursive: true, force: true });
  });

  it('the two paths really do diverge under a named profile (known positive)', async () => {
    // Without this, every assertion below would hold vacuously on a machine where
    // the active profile happens to be `default`.
    expect(await resolveActiveConfigPath()).not.toBe(resolveUserConfigPath());
  });

  it('probes the active profile config and reports that path', async () => {
    const activePath = await resolveActiveConfigPath();
    await writeFile(activePath, 'oops = = =', 'utf-8');

    const result = await probeEngineConfig();
    expect(result.status).toBe('corrupt');
    // The same target the recovery panel resolves through, so the row and the
    // panel cannot disagree about which file they mean.
    expect(result.status === 'corrupt' && result.path).toBe(activePath);
    expect(result.status === 'corrupt' && result.path).not.toBe(resolveUserConfigPath());
  });

  it('a clean active config passes even when the native one is corrupt', async () => {
    // The exact inversion of the shipped bug.
    await writeFile(await resolveActiveConfigPath(), 'ok = true', 'utf-8');
    const result = await probeEngineConfig();
    expect(result.status).toBe('ok');
  });

  /**
   * PREMISE CORRECTED. This test used to assert the FULL active path appeared in
   * both the detail and the remediation, and in doing so it PINNED a leak of
   * exactly the class this file exists to close: under a named profile the path's
   * own segment IS the user-authored profile name (`PROFILE_NAME_RE` accepts a
   * 32-hex key or an `sk-ant-` token whole), so "names the inspected path" and
   * "names the profile" were the same sentence. It fired on every run, not only on
   * a fault - see the healthy-config case below.
   *
   * What the check owes the user is the LOCATION, not the name: the profiles root
   * (where they look in Finder) and the line/column. Those are asserted positively
   * so this cannot pass by saying nothing.
   */
  it('withholds the profile NAME from both Doctor fields while staying actionable', async () => {
    await mkdir(join(profilesRootDir, BARE_SECRET), { recursive: true });
    await writeFile(activeMarkerPath(), BARE_SECRET, 'utf-8');
    const activePath = await resolveActiveConfigPath();
    await writeFile(activePath, 'oops = = =', 'utf-8');

    // KNOWN POSITIVE: the real path genuinely carries the name, and no scrubber
    // sees it - so a clean assertion below is the fix working, not luck.
    expect(activePath).toContain(BARE_SECRET);
    expect(redactSecrets(activePath)).toContain(BARE_SECRET);

    const outcome = await checkEngineConfigIntegrity(() => probeEngineConfig());
    expect(outcome.status).toBe('fail');
    const surfaced = `${outcome.detail}\n${outcome.remediation ?? ''}`;
    expect(surfaced).not.toContain(BARE_SECRET);
    // BOTH fields, separately: the leak lived in two places, so one assertion over
    // the join would have passed on a half-fix.
    expect(outcome.detail).not.toContain(BARE_SECRET);
    expect(outcome.remediation).not.toContain(BARE_SECRET);
    // NOT VACUOUS: each field still names where to look and what to fix.
    expect(outcome.detail).toContain(profilesRootDir);
    expect(outcome.remediation).toContain(profilesRootDir);
    expect(outcome.detail).toContain('(profile name withheld)');
    expect(outcome.remediation).toContain('(profile name withheld)');
    expect(outcome.detail).toContain('line 1, column 8');

    // And Reveal-in-Finder still gets the REAL file: withholding is a RENDERING
    // decision, so collapsing `path` into `displayPath` would break the panel.
    const probe = await probeEngineConfig();
    expect(probe.status === 'corrupt' && probe.path).toBe(activePath);
  });

  it('withholds the profile NAME on a HEALTHY config too, not just on a fault', async () => {
    // The pass branch names the path as well, so the name reached the report on
    // EVERY Doctor run [executed: `Engine config.toml (.../<name>/config.toml)
    // parses cleanly.`]. Treating this as an error-path concern was the mistake.
    await mkdir(join(profilesRootDir, BARE_SECRET), { recursive: true });
    await writeFile(activeMarkerPath(), BARE_SECRET, 'utf-8');
    await writeFile(await resolveActiveConfigPath(), 'ok = true', 'utf-8');

    const outcome = await checkEngineConfigIntegrity(() => probeEngineConfig());
    expect(outcome.status).toBe('pass');
    expect(outcome.detail).not.toContain(BARE_SECRET);
    expect(outcome.detail).toContain('(profile name withheld)');
    expect(outcome.detail).toContain('parses cleanly');
  });

  /**
   * THE OVER-FIX ORACLE. Withholding unconditionally would be the easy wrong fix:
   * the native config dir is `<config-base>/wayland-core` and carries no
   * user-authored segment at all, so withholding it costs the user the one path
   * they actually need and protects nothing. This is the assertion that reds if
   * `displayPath` is ever set without consulting the active profile.
   */
  it('OVER-FIX ORACLE: the NATIVE profile keeps its real path verbatim', async () => {
    const nativeHome = await mkdtemp(join(tmpdir(), 'doctor-native-'));
    const previousHome = process.env.WAYLAND_HOME;
    process.env.WAYLAND_HOME = nativeHome;
    try {
      // No active marker at all, so `getActiveProfile` selects `@native`.
      await rm(activeMarkerPath(), { force: true });
      await writeFile(join(nativeHome, 'config.toml'), 'ok = true', 'utf-8');

      const probe = await probeEngineConfig();
      expect(probe.status).toBe('ok');
      expect(probe.status === 'ok' && probe.displayPath).toBeUndefined();

      const outcome = await checkEngineConfigIntegrity(() => probeEngineConfig());
      expect(outcome.status).toBe('pass');
      expect(outcome.detail).toContain(join(nativeHome, 'config.toml'));
      expect(outcome.detail).not.toContain('withheld');
    } finally {
      if (previousHome === undefined) delete process.env.WAYLAND_HOME;
      else process.env.WAYLAND_HOME = previousHome;
      await rm(nativeHome, { recursive: true, force: true });
    }
  });

  it('reports an unresolvable profile as its own fault, not a parse failure', async () => {
    // A marker naming a profile whose directory does not exist is fail-closed by
    // the #278 contract.
    await writeFile(activeMarkerPath(), 'missing', 'utf-8');
    const result = await probeEngineConfig();
    expect(result.status).toBe('unresolved');

    const outcome = await checkEngineConfigIntegrity(() => probeEngineConfig());
    expect(outcome.status).toBe('fail');
    expect(outcome.detail).toContain('could not be resolved');
    expect(outcome.detail).not.toContain('could not be parsed');
  });

  it('BARE CANARY: the unresolved branch never carries the profile NAME', async () => {
    // `ProfileIsolationError` interpolates the profile name into the FIRST line of
    // its own message, so the first-line-only defence was inert here and the scrub
    // cannot see a bare value. A profile name is user-authored - PROFILE_NAME_RE
    // allows 64 characters of [A-Za-z0-9._-], which fits this exactly.
    await mkdir(join(profilesRootDir, BARE_SECRET), { recursive: true });
    await writeFile(activeMarkerPath(), BARE_SECRET, 'utf-8');
    // Make the resolved dir unusable so the isolation error is the one that throws.
    await rm(join(profilesRootDir, BARE_SECRET), { recursive: true, force: true });

    const result = await probeEngineConfig();
    expect(result.status).toBe('unresolved');
    expect(result.status === 'unresolved' && result.message).not.toContain(BARE_SECRET);

    const outcome = await checkEngineConfigIntegrity(() => probeEngineConfig());
    expect(`${outcome.detail}\n${outcome.remediation ?? ''}`).not.toContain(BARE_SECRET);
    // Not vacuous: it still says which fault this is, and stays actionable.
    expect(outcome.status).toBe('fail');
    expect(outcome.detail).toContain('could not be resolved');
    expect(outcome.remediation).toContain('default profile');
  });

  it('KNOWN POSITIVE: the raw isolation error really does carry the name on line 1', async () => {
    // Without this the assertions above could pass because nothing threw.
    const raw = new ProfileIsolationError(BARE_SECRET, 'directory does not exist').message;
    expect(raw.split('\n', 1)[0]).toContain(BARE_SECRET);
    // And no scrubber sees it, which is why the fix is a constant and not a scrub.
    expect(redactSecrets(raw)).toContain(BARE_SECRET);
  });
});

/**
 * The summarizer's own three layers, each pinned on its own.
 *
 * Layer 1 (first line only) was already pinned by the real-file tests above. These
 * cover the two line terminators layer 1 used to miss, the length cap, and the
 * `redactSecrets` backstop - which was previously unpinned entirely: removing the
 * scrub call left the whole suite green.
 */
describe('summarizeTomlError layers', () => {
  it('CR ORACLE: a bare carriage return ends the line', () => {
    const summary = summarizeTomlError(new Error(`Invalid TOML document: invalid value\rsecret ${BARE_SECRET}`));
    expect(summary).toBe('Invalid TOML document: invalid value');
    expect(summary).not.toContain(BARE_SECRET);
  });

  it('U+2028 / U+2029 ORACLE: both JavaScript line separators end the line', () => {
    for (const separator of ['\u2028', '\u2029']) {
      const summary = summarizeTomlError(new Error(`Invalid TOML document: invalid value${separator}${BARE_SECRET}`));
      expect(summary).toBe('Invalid TOML document: invalid value');
    }
  });

  it('NEVER-THROWS ORACLE: a hostile message getter is contained, not propagated', () => {
    // `probeEngineConfig` documents "Never throws". Reading `error.message` was the
    // hole: the getter threw, the throw propagated out of the probe's own catch and
    // falsified the contract [executed]. Nothing leaked today only because the
    // runner's `safeErrorMessage` happened to be downstream, which is a coincidence
    // and not a defence.
    class Hostile extends Error {
      override get message(): string {
        throw new Error(`secondary carrying ${BARE_SECRET}`);
      }
    }
    // KNOWN POSITIVE: the getter really does throw, so the assertions are real.
    expect(() => new Hostile().message).toThrow();

    const summary = summarizeTomlError(new Hostile());
    expect(summary).toBe('(the parse error could not be read)');
    expect(summary).not.toContain(BARE_SECRET);
  });

  it('NEVER-THROWS ORACLE: a hostile position getter is contained too', () => {
    // Same exposure in `tomlErrorPosition`: the DESTRUCTURE reads the properties, so
    // a throwing getter throws before any type test runs. Position is optional to
    // every caller, so `null` is the right containment.
    const hostile = {
      get line(): number {
        throw new Error('line getter exploded');
      },
    };
    expect(() => hostile.line).toThrow();
    expect(tomlErrorPosition(hostile)).toBeNull();
  });

  it('CAP ORACLE: a single-line 500,000-character message is capped at 200', () => {
    // Executed on the unfixed helper this returned all 500,032 characters.
    const summary = summarizeTomlError(new Error(`Invalid TOML document: ${'q'.repeat(500_000)}`));
    expect(summary).toHaveLength(200);
  });

  it('BACKSTOP ORACLE: a recognisable credential on the first line is scrubbed', () => {
    // The one layer that had no oracle at all. Real smol-toml never puts file
    // content on line 1, so only a synthetic producer reaches this - which is
    // exactly why it is a backstop and exactly why it still has to be pinned.
    const summary = summarizeTomlError(new Error(`Invalid TOML document: rejected ${API_KEY} on line 1`));
    expect(findsKey(summary)).toBe(false);
    expect(summary).toContain('Invalid TOML document');
  });

  it('ORDER ORACLE: a credential straddling the cap is masked, not truncated', () => {
    // Pins scrub-BEFORE-cap, and the placement is arithmetic, not a guess.
    // `redactSecrets` floors every rule at 8 characters [measured: a 7-character
    // fragment behind `api_key = "` comes back untouched, an 8-character one comes
    // back `[redacted]`], so a cap applied FIRST that leaves exactly 7 characters
    // of the value hands those 7 characters out. Scrubbing first sees the value
    // whole and masks all of it.
    const value = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
    const line = `Invalid TOML document: ${'q'.repeat(158)} api_key = "${value}"`;
    // KNOWN POSITIVE for the placement: exactly 7 characters fall before the cap.
    expect(line.indexOf(value)).toBe(193);
    const summary = summarizeTomlError(new Error(line));
    expect(summary).not.toContain(value.slice(0, 7));
    // The mask lands so close to the boundary that the cap trims its own tail,
    // which is exactly the right way round.
    expect(summary).toContain('[redact');
    expect(summary).toHaveLength(200);
  });

  it('keeps a real parser reason intact and unchanged', () => {
    // The cap must not be trimming ordinary output: the longest reason measured
    // across ten real corrupt files is 87 characters.
    const reason = 'Invalid TOML document: only letter, numbers, dashes and underscores are allowed in keys';
    expect(summarizeTomlError(new Error(`${reason}\n\n2:  api_key = "${API_KEY}"`))).toBe(reason);
  });
});
