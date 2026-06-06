/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// We must mock os.homedir before importing the module so the path validation
// uses the tmp dir as "home".
let tmpHome: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof os>('node:os');
  return {
    ...actual,
    homedir: () => tmpHome,
  };
});

import { readSourceContext } from '@process/services/memory/sourceReader';

function writeTmpFile(dir: string, name: string, content: string): string {
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'source-reader-test-'));
});

afterEach(() => {
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

describe('readSourceContext', () => {
  it('happy path - line in the middle returns before/anchor/after slices', async () => {
    const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);
    const filePath = writeTmpFile(path.join(tmpHome, 'proj'), 'notes.md', lines.join('\n'));

    const result = await readSourceContext({ path: filePath, line: 10, contextLines: 3 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.anchor).toBe('Line 10');
    expect(result.before).toContain('Line 7');
    expect(result.before).toContain('Line 9');
    expect(result.after).toContain('Line 11');
    expect(result.after).toContain('Line 13');
    expect(result.totalLines).toBe(20);
  });

  it('line=1 returns first line as anchor with empty before', async () => {
    const filePath = writeTmpFile(tmpHome, 'first.md', 'First\nSecond\nThird');

    const result = await readSourceContext({ path: filePath, line: 1, contextLines: 5 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.anchor).toBe('First');
    expect(result.before).toBe('');
  });

  it('line=0 returns whole file as anchor', async () => {
    const content = 'Alpha\nBeta\nGamma';
    const filePath = writeTmpFile(tmpHome, 'whole.md', content);

    const result = await readSourceContext({ path: filePath, line: 0 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.anchor).toBe(content);
    expect(result.before).toBe('');
    expect(result.after).toBe('');
  });

  it('line=lastLine returns last line as anchor with empty after', async () => {
    const lines = ['A', 'B', 'C'];
    const filePath = writeTmpFile(tmpHome, 'last.md', lines.join('\n'));

    const result = await readSourceContext({ path: filePath, line: 3, contextLines: 5 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.anchor).toBe('C');
    expect(result.after).toBe('');
  });

  it('missing file returns ok=false', async () => {
    const result = await readSourceContext({
      path: path.join(tmpHome, 'does-not-exist.md'),
      line: 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not found/i);
  });

  it('path outside home dir is rejected', async () => {
    // /tmp is not under tmpHome
    const outsidePath = path.join(os.tmpdir(), 'secret.md');
    // ensure the file would theoretically exist (mock - the validator runs first)
    const result = await readSourceContext({ path: outsidePath, line: 1 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/outside/i);
  });

  it('disallowed extension returns ok=false', async () => {
    const filePath = writeTmpFile(tmpHome, 'script.sh', '#!/bin/sh\necho hi');
    const result = await readSourceContext({ path: filePath, line: 1 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not allowed/i);
  });

  it('large file (>500KB) - writes a real large file to trigger chunked read path', async () => {
    // Build a file that exceeds MAX_BYTES (500KB).
    // Each line is ~60 bytes; 10000 lines = ~600KB.
    const lineCount = 10_000;
    const lines = Array.from({ length: lineCount }, (_, i) => `# Line ${String(i + 1).padStart(5, '0')} - some markdown content here`);
    const content = lines.join('\n');
    const filePath = writeTmpFile(path.join(tmpHome, 'bigdir'), 'huge.md', content);

    const result = await readSourceContext({ path: filePath, line: 50, contextLines: 5 });

    // File is readable - ok=true and returns slices
    expect(result.ok).toBe(true);
  });
});
