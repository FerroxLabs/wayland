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

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readConfig } from '@process/agent/wcore/configBridge';
import { probeEngineConfig } from '@process/doctor/engineConfigProbe';
import { checkEngineConfigIntegrity } from '@process/doctor/checks/configChecks';

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
    // Masking the key but keeping the echoed lines would still hand out the
    // user's config: `base_url`, the `[security]` backend, whatever else the
    // parser chose to quote. The whole block goes.
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
