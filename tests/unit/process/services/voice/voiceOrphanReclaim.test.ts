/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { RECLAIMABLE_VOICE_SUBDIRS, reclaimVoiceOrphansAt } from '@process/utils/voiceOrphanReclaim';
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Every assertion here runs against a FABRICATED profile under the OS temp dir.
 * Nothing in this file may ever be pointed at a real `<userData>` - the subject
 * is a recursive delete, and a test that aims one at a live profile is not a
 * test, it is the incident.
 */

const created: string[] = [];

const fabricateProfile = async (): Promise<{ profile: string; voiceRoot: string }> => {
  const profile = await mkdtemp(path.join(tmpdir(), 'wayland-reclaim-test-'));
  created.push(profile);
  const voiceRoot = path.join(profile, 'voice');

  await mkdir(path.join(voiceRoot, 'kokoro'), { recursive: true });
  await writeFile(path.join(voiceRoot, 'kokoro', 'kokoro-v1.0.onnx'), Buffer.alloc(2048));
  await mkdir(path.join(voiceRoot, 'whisper'), { recursive: true });
  await writeFile(path.join(voiceRoot, 'whisper', 'ggml-base.bin'), Buffer.alloc(1024));
  await writeFile(path.join(voiceRoot, 'whisper', 'ggml-small.bin'), Buffer.alloc(512));

  // Decoys. Everything below must survive: a sibling inside voice/ that is not
  // a reclaim target, and a file one level up in the profile itself.
  await writeFile(path.join(voiceRoot, 'settings-note.txt'), 'keep me');
  await mkdir(path.join(profile, 'Local Storage'), { recursive: true });
  await writeFile(path.join(profile, 'Local Storage', 'leveldb.ldb'), 'keep me too');
  await writeFile(path.join(profile, 'wayland.db'), 'definitely keep me');

  return { profile, voiceRoot };
};

afterEach(async () => {
  while (created.length) {
    await rm(created.pop()!, { recursive: true, force: true });
  }
});

describe('reclaimVoiceOrphansAt', () => {
  it('removes both orphan trees and returns the reclaimed byte count', async () => {
    const { voiceRoot } = await fabricateProfile();

    const reclaimed = await reclaimVoiceOrphansAt(voiceRoot);

    expect(existsSync(path.join(voiceRoot, 'kokoro'))).toBe(false);
    expect(existsSync(path.join(voiceRoot, 'whisper'))).toBe(false);
    expect(reclaimed).toBe(2048 + 1024 + 512);
  });

  it('touches nothing outside the reclaim targets', async () => {
    const { profile, voiceRoot } = await fabricateProfile();

    await reclaimVoiceOrphansAt(voiceRoot);

    expect(existsSync(path.join(voiceRoot, 'settings-note.txt'))).toBe(true);
    expect(existsSync(path.join(profile, 'Local Storage', 'leveldb.ldb'))).toBe(true);
    expect(existsSync(path.join(profile, 'wayland.db'))).toBe(true);
    expect((await readdir(profile)).toSorted()).toEqual(['Local Storage', 'voice', 'wayland.db']);
    expect(await readdir(voiceRoot)).toEqual(['settings-note.txt']);
  });

  it('is idempotent - a second pass reclaims zero and still deletes nothing else', async () => {
    const { profile, voiceRoot } = await fabricateProfile();

    await reclaimVoiceOrphansAt(voiceRoot);
    const second = await reclaimVoiceOrphansAt(voiceRoot);

    expect(second).toBe(0);
    expect(existsSync(path.join(profile, 'wayland.db'))).toBe(true);
  });

  it('only ever targets subdirectories of the voice root', () => {
    for (const name of RECLAIMABLE_VOICE_SUBDIRS) {
      expect(path.isAbsolute(name)).toBe(false);
      expect(name).not.toContain('..');
      expect(name).not.toContain(path.sep);
    }
  });
});
