/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
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
 * #992: two divergent copies of this function is how the WEAKER one ended up on
 * the remote-facing webserver routes. This test is the guard against a third
 * appearing - it fails the build, not a review, when someone re-implements it.
 */
describe('exactly one redaction implementation', () => {
  const srcRoot = resolve(process.cwd(), 'src');
  const canonical = resolve(srcRoot, 'process/utils/secretRedaction.ts');

  function sourceFiles(directory: string): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        found.push(...sourceFiles(full));
      } else if (/\.tsx?$/.test(entry.name)) {
        found.push(full);
      }
    }
    return found;
  }

  it('declares redactSecrets in exactly one module', () => {
    // A DECLARATION, not a call site: `function redactSecrets`, `const
    // redactSecrets =`, or a class method of that name. Imports and calls are
    // deliberately not matched - every consumer is expected to have those.
    const declaration = /(?:function\s+redactSecrets\b|(?:const|let|var)\s+redactSecrets\s*[:=])/;

    const declaring = sourceFiles(srcRoot)
      .filter((file) => declaration.test(readFileSync(file, 'utf-8')))
      .map((file) => relative(process.cwd(), file));

    expect(declaring).toEqual([relative(process.cwd(), canonical)]);
  });
});
