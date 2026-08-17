/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { redactSecrets } from '@process/utils/secretRedaction';
import { CLEAN_CORPUS, SECRET_CORPUS } from '../fixtures/secretCorpus';

describe('redactSecrets (canonical)', () => {
  it.each(SECRET_CORPUS.map((entry) => [entry.label, entry] as const))('masks %s', (_label, entry) => {
    const out = redactSecrets(entry.text);
    expect(out).not.toContain(entry.secret);
    expect(out).toContain('[redacted]');
  });

  it.each(CLEAN_CORPUS)('leaves %j untouched', (line) => {
    expect(redactSecrets(line)).toBe(line);
  });

  it('tolerates empty input', () => {
    expect(redactSecrets('')).toBe('');
  });

  it('keeps the label of a masked assignment so the diagnostic still reads', () => {
    expect(redactSecrets('api_key = "hunter2hunter2"')).toContain('api_key');
  });
});

/**
 * #992 asked for a test asserting there is exactly ONE redaction implementation.
 * That premise turned out to be false, and the first version of this test
 * encoded the false premise: it matched only the NAME `redactSecrets`, so it
 * reported "exactly one" while the repo actually contained FOUR token-shape
 * scrubbers and two token-shape detection tables.
 *
 * So this is a REGISTRY, not a uniqueness claim. Every module carrying a bank of
 * token-shape patterns is listed below with the reason it is allowed to exist
 * and its masking contract. A new bank fails CI until someone adds it here and
 * states why it cannot use the shared module - which is the decision that
 * actually needed forcing, since two divergent copies is how the weaker scrubber
 * ended up on the remote-facing surface.
 */
describe('token-shape pattern banks are registered, not accidental', () => {
  const srcRoot = resolve(process.cwd(), 'src');
  const canonical = 'src/process/utils/secretRedaction.ts';

  /**
   * Every module allowed to carry its own bank, and WHY. The reason is the
   * point: each of these has a masking contract the shared module cannot serve.
   */
  const REGISTERED_BANKS: Record<string, string> = {
    [canonical]:
      'THE canonical scrubber. Error bodies, agent stderr, the feedback log bundle. Masks the whole run as [redacted].',
    'src/process/resources/builtinMcp/conciergeDiagServer.ts':
      'Diagnostics dump. Separate esbuild subprocess bundle (out/main/builtin-mcp-concierge-diag.js), and masks to the last 4 characters so a Doctor report stays diagnosable. Also carries entropy rules (bare 24+ runs, 32+ hex) that would mask commit SHAs and binary digests if applied to error text.',
    'src/common/utils/redactCommandSecrets.ts':
      'Shell command RENDER for the activity timeline. Masks to fixed bullets and is deliberately narrower: masking every long run would hide the paths and flags that are the whole point of showing the real command.',
    'src/common/chat/capability/capabilityProjection.ts':
      'Capability-reason projection. Masks to shape-naming placeholders ([redacted-jwt], [redacted-aws-access-key]) because the reason string is read to understand WHICH credential class was involved.',
    'src/process/providers/detection/providerKeyPatterns.ts':
      'DETECTION, not redaction: maps a pasted key to its provider. Never masks anything.',
    'src/renderer/pages/settings/ModelsSettings/providerCatalog.ts':
      'DETECTION, not redaction: renderer-side provider catalog with example key shapes. Never masks anything.',
  };

  function sourceFiles(directory: string): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = resolve(directory, entry.name);
      if (entry.isDirectory()) found.push(...sourceFiles(full));
      else if (/\.tsx?$/.test(entry.name)) found.push(full);
    }
    return found;
  }

  const rel = (file: string) => relative(process.cwd(), file).split(sep).join('/');

  it('declares redactSecrets in exactly one module', () => {
    // Name-scoped ON PURPOSE, and that is a real limit: it catches a fork of
    // THIS function, not a differently-named scrubber. The structural check
    // below is what covers the rest. Object-literal and class-method forms are
    // matched too, so `{ redactSecrets(text) {} }` cannot slip past.
    const declaration =
      /(?:function\s+redactSecrets\b|(?:const|let|var)\s+redactSecrets\s*[:=]|^\s*(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*redactSecrets\s*\()/m;

    const declaring = sourceFiles(srcRoot)
      .filter((file) => declaration.test(readFileSync(file, 'utf-8')))
      .map(rel);

    expect(declaring).toEqual([canonical]);
  });

  /**
   * Structural sweep: a module naming six or more distinct credential prefixes
   * is carrying a pattern bank, whatever it calls its function. This is the
   * check that would have surfaced conciergeDiagServer, redactCommandSecrets and
   * capabilityProjection, all of which the name-scoped rule above is blind to.
   */
  const PREFIX_MARKERS = [
    'sk-',
    'xox',
    'ghp_',
    'gh[posru]_',
    'github_pat_',
    'glpat-',
    'gsk_',
    'xai-',
    'r8_',
    'dop_v1_',
    'ya29',
    'AKIA',
    'ASIA',
    'AIza',
    'eyJ',
    'Bearer',
  ];
  const BANK_THRESHOLD = 6;

  it(`registers every module naming ${BANK_THRESHOLD}+ credential prefixes`, () => {
    const banks = sourceFiles(srcRoot)
      .map((file) => {
        const body = readFileSync(file, 'utf-8');
        return { file: rel(file), markers: PREFIX_MARKERS.filter((m) => body.includes(m)).length };
      })
      .filter((entry) => entry.markers >= BANK_THRESHOLD)
      .map((entry) => entry.file)
      .toSorted();

    expect(banks).toEqual(Object.keys(REGISTERED_BANKS).toSorted());
  });

  it('every registered bank still exists and carries a stated reason', () => {
    for (const [file, reason] of Object.entries(REGISTERED_BANKS)) {
      expect(existsSync(resolve(process.cwd(), file)), `${file} is registered but missing`).toBe(true);
      expect(reason.length, `${file} needs a real reason, not a placeholder`).toBeGreaterThan(40);
    }
  });
});
