/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { stat, mkdir, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

export type SkillQuarantineIo = {
  exists: (p: string) => Promise<boolean>;
  mkdir: (p: string) => Promise<void>;
  move: (from: string, to: string) => Promise<void>;
  /**
   * Write a string body to disk. Used by `quarantineFromMemory` when the
   * blocked skill never landed on disk to begin with (builder modal flow).
   */
  writeFile: (p: string, body: string) => Promise<void>;
};

export const QUARANTINE_DIR = path.join(homedir(), '.wayland', 'skills', '.quarantine');

export const defaultSkillQuarantineIo: SkillQuarantineIo = {
  exists: async (p) => {
    try {
      await stat(p);
      return true;
    } catch {
      return false;
    }
  },
  mkdir: async (p) => {
    await mkdir(p, { recursive: true });
  },
  move: async (from, to) => {
    await rename(from, to);
  },
  writeFile: async (p, body) => {
    await writeFile(p, body, 'utf-8');
  },
};

export class SkillQuarantine {
  static async quarantine(
    skillName: string,
    fromPath: string,
    io: SkillQuarantineIo = defaultSkillQuarantineIo,
  ): Promise<string> {
    const dest = path.join(QUARANTINE_DIR, skillName);
    await io.mkdir(path.dirname(dest));
    await io.move(fromPath, dest);
    return dest;
  }

  /**
   * Quarantine a skill body that exists only in memory (never written to the
   * user's skills directory). Used by the C3 builder-modal flow: the body
   * arrives as a string via IPC, the scanner returns `blocked`, and we route
   * it to `.quarantine/<name>/SKILL.md` instead of writing it into the live
   * skills tree. Mirrors the SkillImport quarantine layout so the rest of
   * the system treats it identically.
   *
   * Returns the destination directory path.
   */
  static async quarantineFromMemory(
    args: { name: string; body: string },
    io: SkillQuarantineIo = defaultSkillQuarantineIo,
  ): Promise<string> {
    const dest = path.join(QUARANTINE_DIR, args.name);
    await io.mkdir(dest);
    await io.writeFile(path.join(dest, 'SKILL.md'), args.body);
    return dest;
  }

  static async isQuarantined(
    skillName: string,
    io: SkillQuarantineIo = defaultSkillQuarantineIo,
  ): Promise<boolean> {
    return io.exists(path.join(QUARANTINE_DIR, skillName));
  }
}
