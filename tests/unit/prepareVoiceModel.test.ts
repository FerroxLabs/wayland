import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const prepareVoiceModel = require('../../scripts/prepareVoiceModel.js') as (
  options?: Record<string, unknown>
) => Promise<void>;
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('pinned voice model preparation', () => {
  it('replaces same-size corrupt cached bytes from the exact immutable revision, then reuses verified bytes', async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-voice-pin-'));
    roots.push(outputDir);
    const bytes = Buffer.from('authoritative voice bytes');
    const authority = {
      contract: 'wayland-voice-model-pin/1.0',
      repository: 'Xenova/whisper-tiny',
      revision: 'a'.repeat(40),
      files: {
        'config.json': {
          size: bytes.length,
          sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
        },
      },
    };
    fs.writeFileSync(path.join(outputDir, 'config.json'), Buffer.alloc(bytes.length, 0x78));
    let downloads = 0;
    const downloadImpl = async (url: string, destination: string) => {
      downloads += 1;
      expect(url).toBe(`https://huggingface.co/Xenova/whisper-tiny/resolve/${authority.revision}/config.json`);
      fs.writeFileSync(destination, bytes);
    };

    await prepareVoiceModel({ authority, outputDir, downloadImpl });
    expect(downloads).toBe(1);
    expect(fs.readFileSync(path.join(outputDir, 'config.json'))).toEqual(bytes);

    await prepareVoiceModel({ authority, outputDir, downloadImpl });
    expect(downloads).toBe(1);
  });
});
