/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { SkillQuarantine, QUARANTINE_DIR, type SkillQuarantineIo } from '@process/services/skills/SkillQuarantine';
import path from 'node:path';

const makeFakeIo = (overrides: Partial<SkillQuarantineIo> = {}): SkillQuarantineIo => ({
  exists: vi.fn(async () => false),
  mkdir: vi.fn(async () => {}),
  move: vi.fn(async () => {}),
  writeFile: vi.fn(async () => {}),
  ...overrides,
});

describe('SkillQuarantine', () => {
  it('quarantine() calls io.move with the correct source and destination under QUARANTINE_DIR/<name>', async () => {
    const io = makeFakeIo();
    const fromPath = '/some/skills/my-skill.md';
    await SkillQuarantine.quarantine('my-skill', fromPath, io);
    expect(io.move).toHaveBeenCalledWith(fromPath, path.join(QUARANTINE_DIR, 'my-skill'));
  });

  it('quarantine() calls io.mkdir on the parent directory of the destination first', async () => {
    const calls: string[] = [];
    const io = makeFakeIo({
      mkdir: vi.fn(async (p) => { calls.push(`mkdir:${p}`); }),
      move: vi.fn(async () => { calls.push('move'); }),
    });
    await SkillQuarantine.quarantine('my-skill', '/from/path', io);
    const mkdirIdx = calls.findIndex((c) => c.startsWith('mkdir:'));
    const moveIdx = calls.findIndex((c) => c === 'move');
    expect(mkdirIdx).toBeLessThan(moveIdx);
    expect(io.mkdir).toHaveBeenCalledWith(path.dirname(path.join(QUARANTINE_DIR, 'my-skill')));
  });

  it('quarantine() returns the destination path', async () => {
    const io = makeFakeIo();
    const result = await SkillQuarantine.quarantine('my-skill', '/from/path', io);
    expect(result).toBe(path.join(QUARANTINE_DIR, 'my-skill'));
  });

  it('isQuarantined() returns true when io.exists returns true for QUARANTINE_DIR/<name>', async () => {
    const io = makeFakeIo({ exists: vi.fn(async () => true) });
    const result = await SkillQuarantine.isQuarantined('my-skill', io);
    expect(result).toBe(true);
    expect(io.exists).toHaveBeenCalledWith(path.join(QUARANTINE_DIR, 'my-skill'));
  });

  it('isQuarantined() returns false when io.exists returns false', async () => {
    const io = makeFakeIo({ exists: vi.fn(async () => false) });
    const result = await SkillQuarantine.isQuarantined('my-skill', io);
    expect(result).toBe(false);
  });

  describe('quarantineFromMemory (C3)', () => {
    it('writes SKILL.md under QUARANTINE_DIR/<name> and returns the destination dir', async () => {
      const io = makeFakeIo();
      const dest = await SkillQuarantine.quarantineFromMemory(
        { name: 'malicious', body: '# bad skill\nrm -rf /' },
        io
      );

      const expectedDir = path.join(QUARANTINE_DIR, 'malicious');
      expect(dest).toBe(expectedDir);
      expect(io.mkdir).toHaveBeenCalledWith(expectedDir);
      expect(io.writeFile).toHaveBeenCalledWith(
        path.join(expectedDir, 'SKILL.md'),
        '# bad skill\nrm -rf /'
      );
    });

    it('never calls io.move (skill body is in-memory, not on disk)', async () => {
      const io = makeFakeIo();
      await SkillQuarantine.quarantineFromMemory({ name: 'x', body: 'y' }, io);
      expect(io.move).not.toHaveBeenCalled();
    });
  });
});
