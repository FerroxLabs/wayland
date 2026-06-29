/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #256 - integration coverage for the drop-folder ingest path. Drives the real
 * runDropFolderProcess against temp directories and asserts the two behaviors a
 * dropped memory needs to become recall-able: (1) it is written with canonical
 * title/description frontmatter for the IJFW reader tier, and (2) its content is
 * stored through ijfw_memory_store so it lands in the FTS5 index that free-text
 * recall searches. Only the external MCP client is mocked - the file IO and
 * frontmatter assembly run for real.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();
vi.mock('@process/services/ijfw/ijfwMcpClient', () => ({
  ijfwMcpClient: { invoke: (...args: unknown[]) => invokeMock(...args) },
}));
vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { runDropFolderProcess } from '@process/services/import/dropFolderWatcher';

let baseDir: string;
let dropFolder: string;
let memDir: string;

beforeEach(() => {
  invokeMock.mockReset();
  invokeMock.mockResolvedValue({ ok: true });
  baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-drop-ingest-'));
  dropFolder = path.join(baseDir, 'drop');
  memDir = path.join(baseDir, 'mem');
  fs.mkdirSync(dropFolder, { recursive: true });
  fs.mkdirSync(memDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(baseDir, { recursive: true, force: true });
});

/** The void/fire-and-forget memory_store call resolves on the microtask queue; flush it. */
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('drop-folder ingest makes a dropped memory recall-able (#256)', () => {
  it('writes canonical frontmatter AND stores the content into the FTS5 index', async () => {
    fs.writeFileSync(
      path.join(dropFolder, 'hyperframes.md'),
      '# HyperFrames Overview\n\nHyperFrames are a modular UI concept for Wayland.'
    );

    const result = await runDropFolderProcess({ dropFolder, ijfwMemoryDir: memDir });
    await flush();

    expect(result.count).toBe(1);

    // (1) file persisted with title + description frontmatter for the reader tier
    const written = fs.readdirSync(memDir).find((n) => n.startsWith('dropped-') && n.endsWith('.md'));
    expect(written).toBeTruthy();
    const fileContent = fs.readFileSync(path.join(memDir, written as string), 'utf8');
    expect(fileContent).toMatch(/^title: HyperFrames Overview$/m);
    expect(fileContent).toMatch(/^description: HyperFrames are a modular UI concept for Wayland\.$/m);

    // (2) content indexed via ijfw_memory_store -> recall-able
    expect(invokeMock).toHaveBeenCalledWith(
      'memory_store',
      expect.objectContaining({
        content: expect.stringContaining('HyperFrames are a modular UI concept for Wayland.'),
        type: 'observation',
      })
    );
  });

  it('strips a leading UTF-8 BOM so the title, body, and stored content stay clean (#256 B1)', async () => {
    // A Windows-saved drop file carries a UTF-8 BOM before the `#` heading. Left
    // in place it defeated the heading match (title fell back to the filename),
    // landed in the written body, and corrupted the store's own derivation.
    fs.writeFileSync(
      path.join(dropFolder, 'verify431-codename.md'),
      '﻿# Verify431 Codename\n\nThe codename for the drop-recall test is NEBULA-2287.'
    );

    const result = await runDropFolderProcess({ dropFolder, ijfwMemoryDir: memDir });
    await flush();
    expect(result.count).toBe(1);

    const written = fs.readdirSync(memDir).find((n) => n.startsWith('dropped-') && n.endsWith('.md'));
    const fileContent = fs.readFileSync(path.join(memDir, written as string), 'utf8');

    // Title comes from the heading, NOT the filename fallback "verify431-codename".
    expect(fileContent).toMatch(/^title: Verify431 Codename$/m);
    expect(fileContent).toMatch(/^description: The codename for the drop-recall test is NEBULA-2287\.$/m);
    // No BOM anywhere in the persisted file (not at the start, not mid-body).
    expect(fileContent.charCodeAt(0)).not.toBe(0xfeff);
    expect(fileContent).not.toContain('﻿');

    // The content handed to the FTS5 store is BOM-free and starts at the heading.
    const storeCall = invokeMock.mock.calls.find((c) => c[0] === 'memory_store');
    if (!storeCall) throw new Error('expected a memory_store call');
    const storedContent = (storeCall[1] as { content: string }).content;
    expect(storedContent).not.toContain('﻿');
    expect(storedContent.startsWith('# Verify431 Codename')).toBe(true);
  });

  it('still ingests the file even if the FTS5 store fails (best-effort, no regression)', async () => {
    invokeMock.mockRejectedValue(new Error('mcp-server unavailable'));
    fs.writeFileSync(path.join(dropFolder, 'resilient.md'), '# Resilient\n\nIngest must not depend on the index call.');

    const result = await runDropFolderProcess({ dropFolder, ijfwMemoryDir: memDir });
    await flush();

    expect(result.count).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(fs.readdirSync(memDir).some((n) => n.startsWith('dropped-'))).toBe(true);
  });
});
