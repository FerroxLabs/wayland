/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { getClaudeNativeDefaultModelId } from '@process/services/ccSwitchModelSource';

/**
 * Regression coverage for B1: a fresh Claude Code chat with a native login but
 * no explicit model pin must default to the Opus slot (the "Claude Opus 4.8"
 * product default), not the literal `'default'` that the CLI silently resolves
 * to Sonnet. An explicit Sonnet pin must still be honored.
 */
describe('getClaudeNativeDefaultModelId', () => {
  let homeDir: string;

  beforeEach(() => {
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-native-default-'));
  });

  afterEach(() => {
    fs.rmSync(homeDir, { recursive: true, force: true });
  });

  function writeClaudeSettings(settings: Record<string, unknown>): void {
    const claudeDir = path.join(homeDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify(settings));
  }

  it('defaults to opus when a Claude login exists but no model is pinned', () => {
    writeClaudeSettings({});
    expect(getClaudeNativeDefaultModelId(homeDir)).toBe('opus');
  });

  it('honors an explicit Sonnet pin instead of overriding it', () => {
    writeClaudeSettings({ model: 'sonnet' });
    expect(getClaudeNativeDefaultModelId(homeDir)).toBe('sonnet');
  });

  it('maps an explicit opus[1m] pin to the opus slot', () => {
    writeClaudeSettings({ model: 'opus[1m]' });
    expect(getClaudeNativeDefaultModelId(homeDir)).toBe('opus');
  });

  it('returns null when there is no native Claude login (flux default preserved)', () => {
    expect(getClaudeNativeDefaultModelId(homeDir)).toBeNull();
  });
});
