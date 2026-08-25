/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1027 - user-level Claude Code hooks are silently dropped on Flux-routed
 * turns.
 *
 * The exclusion itself is deliberate and stays: the claude binary reads the
 * WHOLE settings.json from CLAUDE_CONFIG_DIR, so seeding the user's `hooks`
 * would execute their arbitrary hook commands on every Flux turn (pinned by
 * `claudeConfig.test.ts`). SILENCE is the defect - a user who wrote a
 * PreToolUse hook to enforce their own policy gets non-enforcement with nothing
 * telling them, and the same hook works on a native turn, so the behaviour
 * looks intermittent rather than routed.
 *
 * These tests cover the reader that finds out WHICH hook events were dropped,
 * and the sentence the user is shown. Uses a real temp dir - no fs mocking.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildDroppedUserHooksNotice, readDroppedUserHookEvents } from '@process/task/claudeConfig';

describe('readDroppedUserHookEvents (#1027)', () => {
  let realClaudeDir: string;

  beforeEach(async () => {
    realClaudeDir = await mkdtemp(join(tmpdir(), 'claude-hooks-real-'));
  });
  afterEach(async () => {
    await rm(realClaudeDir, { recursive: true, force: true });
  });

  const seed = async (settings: unknown): Promise<void> => {
    await mkdir(realClaudeDir, { recursive: true });
    await writeFile(join(realClaudeDir, 'settings.json'), JSON.stringify(settings), 'utf8');
  };

  it('names every hook event configured at user level', async () => {
    await seed({
      hooks: {
        PreToolUse: [{ matcher: 'Write', hooks: [{ type: 'command', command: './policy.sh' }] }],
        Stop: [{ hooks: [{ type: 'command', command: './done.sh' }] }],
      },
    });

    expect(await readDroppedUserHookEvents(realClaudeDir)).toEqual(['PreToolUse', 'Stop']);
  });

  it('returns nothing when the user configured no hooks', async () => {
    await seed({ permissions: { defaultMode: 'acceptEdits' } });

    expect(await readDroppedUserHookEvents(realClaudeDir)).toEqual([]);
  });

  it('returns nothing for an empty hooks block, so the notice cannot spam', async () => {
    await seed({ hooks: {} });

    expect(await readDroppedUserHookEvents(realClaudeDir)).toEqual([]);
  });

  it('returns nothing when settings.json is missing or malformed', async () => {
    expect(await readDroppedUserHookEvents(join(realClaudeDir, 'nope'))).toEqual([]);
    await writeFile(join(realClaudeDir, 'settings.json'), '{ not json', 'utf8');
    expect(await readDroppedUserHookEvents(realClaudeDir)).toEqual([]);
  });

  it('ignores a hooks value that is not an object', async () => {
    await seed({ hooks: 'PreToolUse' });
    expect(await readDroppedUserHookEvents(realClaudeDir)).toEqual([]);
  });
});

describe('buildDroppedUserHooksNotice (#1027)', () => {
  it('names the dropped events and says the turn is Flux-routed', () => {
    const notice = buildDroppedUserHooksNotice(['PreToolUse', 'Stop']);

    expect(notice).toContain('PreToolUse');
    expect(notice).toContain('Stop');
    expect(notice.toLowerCase()).toContain('flux');
  });

  it('says nothing at all when no events were dropped', () => {
    expect(buildDroppedUserHooksNotice([])).toBe('');
  });
});
