/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

vi.mock('electron-log', () => ({
  default: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// eslint-disable-next-line import/first
import {
  applyPreludeForStatus,
  discoverTargets,
} from '@process/services/ijfw/preludeManager';

const MARK_START = '<!-- IJFW-PRELUDE-START -->';
const MARK_END = '<!-- IJFW-PRELUDE-END -->';
const ACTIVE_LINE = 'Project memory at .ijfw/memory/. Call `ijfw_memory_prelude` for full context.';
const DISABLED_LINE = '<!-- IJFW-PRELUDE-DISABLED-BY-WAYLAND: Memory layer initializing. -->';

function mkProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ijfw-prelude-'));
}

describe('ijfw/preludeManager', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkProject();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('applyPreludeForStatus', () => {
    it('writes the active block when status is installed_current and markers exist', async () => {
      const file = path.join(dir, 'CLAUDE.md');
      fs.writeFileSync(file, `Header\n${MARK_START}\nold content\n${MARK_END}\nFooter\n`);
      await applyPreludeForStatus('installed_current', [
        { projectDir: dir, files: ['CLAUDE.md'] },
      ]);
      const updated = fs.readFileSync(file, 'utf-8');
      expect(updated).toContain(MARK_START);
      expect(updated).toContain(ACTIVE_LINE);
      expect(updated).toContain(MARK_END);
      expect(updated).toContain('Header');
      expect(updated).toContain('Footer');
      expect(updated).not.toContain('old content');
    });

    it('writes the active block when status is installed_empty', async () => {
      const file = path.join(dir, 'AGENTS.md');
      fs.writeFileSync(file, `${MARK_START}\nstale\n${MARK_END}`);
      await applyPreludeForStatus('installed_empty', [
        { projectDir: dir, files: ['AGENTS.md'] },
      ]);
      const updated = fs.readFileSync(file, 'utf-8');
      expect(updated).toContain(ACTIVE_LINE);
      expect(updated).not.toContain(DISABLED_LINE);
    });

    it('writes the disabled notice when status is uninstalled', async () => {
      const file = path.join(dir, 'CLAUDE.md');
      fs.writeFileSync(file, `Header\n${MARK_START}\nactive content\n${MARK_END}\nFooter\n`);
      await applyPreludeForStatus('uninstalled', [
        { projectDir: dir, files: ['CLAUDE.md'] },
      ]);
      const updated = fs.readFileSync(file, 'utf-8');
      expect(updated).toContain(DISABLED_LINE);
      expect(updated).not.toContain(ACTIVE_LINE);
      expect(updated).toContain('Header');
      expect(updated).toContain('Footer');
    });

    it('NEVER injects markers into a file that does not already contain them', async () => {
      const file = path.join(dir, 'CLAUDE.md');
      const original = 'No markers anywhere here.\n';
      fs.writeFileSync(file, original);
      await applyPreludeForStatus('installed_current', [
        { projectDir: dir, files: ['CLAUDE.md'] },
      ]);
      expect(fs.readFileSync(file, 'utf-8')).toBe(original);
    });

    it('silently skips files that do not exist', async () => {
      // No file written - should not throw.
      await applyPreludeForStatus('installed_current', [
        { projectDir: dir, files: ['CLAUDE.md', 'AGENTS.md'] },
      ]);
    });

    it('preserves surrounding content exactly on enable transition', async () => {
      const file = path.join(dir, 'CLAUDE.md');
      const before = '# Title\n\nSome text\n';
      const after = '\n## Section 2\nMore text';
      fs.writeFileSync(file, `${before}${MARK_START}\nold\n${MARK_END}${after}`);
      await applyPreludeForStatus('installed_current', [
        { projectDir: dir, files: ['CLAUDE.md'] },
      ]);
      const updated = fs.readFileSync(file, 'utf-8');
      expect(updated.startsWith(before)).toBe(true);
      expect(updated.endsWith(after)).toBe(true);
    });

    it('is idempotent: re-applying installed_current does not change content', async () => {
      const file = path.join(dir, 'CLAUDE.md');
      fs.writeFileSync(file, `${MARK_START}\nold\n${MARK_END}`);
      await applyPreludeForStatus('installed_current', [
        { projectDir: dir, files: ['CLAUDE.md'] },
      ]);
      const firstPass = fs.readFileSync(file, 'utf-8');
      await applyPreludeForStatus('installed_current', [
        { projectDir: dir, files: ['CLAUDE.md'] },
      ]);
      const secondPass = fs.readFileSync(file, 'utf-8');
      expect(secondPass).toBe(firstPass);
    });
  });

  describe('discoverTargets', () => {
    it('returns only files that contain IJFW-PRELUDE markers', async () => {
      fs.writeFileSync(path.join(dir, 'CLAUDE.md'), `${MARK_START}\nx\n${MARK_END}`);
      fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'no markers here');
      const targets = await discoverTargets([dir]);
      expect(targets).toHaveLength(1);
      expect(targets[0].projectDir).toBe(dir);
      expect(targets[0].files).toEqual(['CLAUDE.md']);
    });

    it('discovers multiple marker files in the same project', async () => {
      fs.writeFileSync(path.join(dir, 'CLAUDE.md'), `${MARK_START}\n${MARK_END}`);
      fs.writeFileSync(path.join(dir, 'GEMINI.md'), `${MARK_START}\n${MARK_END}`);
      fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'no');
      const targets = await discoverTargets([dir]);
      expect(targets).toHaveLength(1);
      expect(targets[0].files.sort()).toEqual(['CLAUDE.md', 'GEMINI.md']);
    });

    it('returns an empty array when no project has marker files', async () => {
      fs.writeFileSync(path.join(dir, 'CLAUDE.md'), 'just text');
      const targets = await discoverTargets([dir]);
      expect(targets).toEqual([]);
    });

    it('checks CLAUDE.md, AGENTS.md, GEMINI.md, and .cursorrules', async () => {
      fs.writeFileSync(path.join(dir, '.cursorrules'), `${MARK_START}\n${MARK_END}`);
      const targets = await discoverTargets([dir]);
      expect(targets[0]?.files).toEqual(['.cursorrules']);
    });

    it('handles non-existent project dirs gracefully', async () => {
      const ghost = path.join(dir, 'nonexistent');
      const targets = await discoverTargets([ghost]);
      expect(targets).toEqual([]);
    });
  });
});
