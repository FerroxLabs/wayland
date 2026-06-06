/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveFileRefs } from '../../../src/process/extensions/resolvers/utils/fileResolver';

describe('extensions/fileResolver', () => {
  let extensionDir = '';
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    extensionDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-ext-file-resolver-'));
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    warnSpy.mockRestore();
    await fs.rm(extensionDir, { recursive: true, force: true });
  });

  it('should resolve a text file reference and strip the trailing newline', async () => {
    await fs.writeFile(path.join(extensionDir, 'prompt.txt'), 'hello world\n', 'utf-8');

    const result = await resolveFileRefs('$file:prompt.txt', extensionDir);

    expect(result).toBe('hello world');
  });

  it('should support nested $file references inside JSON/JSONC', async () => {
    await fs.mkdir(path.join(extensionDir, 'meta'), { recursive: true });
    await fs.writeFile(path.join(extensionDir, 'meta', 'title.txt'), 'My Title\n', 'utf-8');
    await fs.writeFile(path.join(extensionDir, 'meta', 'name.txt'), 'Alice\n', 'utf-8');
    await fs.writeFile(path.join(extensionDir, 'data.json'), '{"name":"$file:meta/name.txt"}', 'utf-8');
    await fs.writeFile(
      path.join(extensionDir, 'config.jsonc'),
      `{
        // with comment
        "title": "$file:meta/title.txt",
        "items": ["$file:data.json", "plain"]
      }`,
      'utf-8'
    );

    const result = await resolveFileRefs({ config: '$file:config.jsonc' }, extensionDir);

    expect(result).toEqual({
      config: {
        title: 'My Title',
        items: [{ name: 'Alice' }, 'plain'],
      },
    });
  });

  it('should block directory traversal and preserve the original reference', async () => {
    const outsideFile = path.join(path.dirname(extensionDir), 'outside.txt');
    await fs.writeFile(outsideFile, 'outside', 'utf-8');

    const result = await resolveFileRefs('$file:../outside.txt', extensionDir);

    expect(result).toBe('$file:../outside.txt');
    expect(warnSpy).toHaveBeenCalled();

    await fs.rm(outsideFile, { force: true });
  });

  it('should block reading files outside the extension directory via symlink', async () => {
    const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wayland-ext-outside-'));
    const outsideFile = path.join(outsideDir, 'secret.txt');
    const symlinkDir = path.join(extensionDir, 'linked');

    await fs.writeFile(outsideFile, 'secret', 'utf-8');
    await fs.symlink(outsideDir, symlinkDir, 'dir');

    const result = await resolveFileRefs('$file:linked/secret.txt', extensionDir);

    expect(result).toBe('$file:linked/secret.txt');
    expect(warnSpy).toHaveBeenCalled();

    await fs.rm(outsideDir, { recursive: true, force: true });
  });

  it('should fall back to the original reference string on circular references', async () => {
    await fs.writeFile(path.join(extensionDir, 'a.json'), '{"next":"$file:b.json"}', 'utf-8');
    await fs.writeFile(path.join(extensionDir, 'b.json'), '{"next":"$file:a.json"}', 'utf-8');

    const result = await resolveFileRefs('$file:a.json', extensionDir);

    expect(result).toEqual({
      next: {
        next: '$file:a.json',
      },
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should preserve the original reference when the file does not exist', async () => {
    const result = await resolveFileRefs('$file:not-exists.txt', extensionDir);

    expect(result).toBe('$file:not-exists.txt');
    expect(warnSpy).toHaveBeenCalled();
  });
});
