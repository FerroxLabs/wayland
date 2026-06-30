/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #465 - first-run chromium provisioning for the bundled Playwright MCP server.
 * The install is guarded by a presence check so the ~150MB download happens at
 * most once and never on a profile that already has chromium. These exercise
 * that guard against a real temp dir (no network, no spawn when present).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { ensurePlaywrightChromium, isChromiumInstalled } from '@process/services/mcpServices/playwrightBrowsers';

let tmp: string;

beforeAll(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'wl-465-pw-'));
});
afterAll(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('isChromiumInstalled (#465)', () => {
  it('is false for a missing dir', () => {
    expect(isChromiumInstalled(path.join(tmp, 'nope'))).toBe(false);
  });

  it('is false for an empty browsers dir', async () => {
    const dir = path.join(tmp, 'empty');
    await fs.mkdir(dir, { recursive: true });
    expect(isChromiumInstalled(dir)).toBe(false);
  });

  it('is false when only non-chromium browsers are present', async () => {
    const dir = path.join(tmp, 'ffonly');
    await fs.mkdir(path.join(dir, 'firefox-1234'), { recursive: true });
    expect(isChromiumInstalled(dir)).toBe(false);
  });

  it('is true when a chromium build is present', async () => {
    const dir = path.join(tmp, 'has-chromium');
    await fs.mkdir(path.join(dir, 'chromium-1224'), { recursive: true });
    await fs.mkdir(path.join(dir, 'ffmpeg-1011'), { recursive: true });
    expect(isChromiumInstalled(dir)).toBe(true);
  });
});

describe('ensurePlaywrightChromium (#465)', () => {
  it('short-circuits to true (no spawn, no network) when chromium already exists', async () => {
    const dir = path.join(tmp, 'cached');
    await fs.mkdir(path.join(dir, 'chromium-1224'), { recursive: true });
    // If this tried to spawn/download it would hang or fail offline; the presence
    // guard must return immediately.
    await expect(ensurePlaywrightChromium(dir)).resolves.toBe(true);
  });
});
