/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Autopilot (guarded-auto) auto-approval gate.
 *
 * `AcpAgentManager.handleSignalEvent` runs an unattended guarded-auto session
 * through `classifyAutopilotToolCall` and auto-confirms only when it returns
 * `autoApprove`. These tests pin the tool-kind allowlist: the ONLY kinds that
 * ride an unattended auto-approval are read/search/edit/think, plus `execute`
 * when its command survives the catastrophic-command classifier. Every other
 * ACP kind - and any kind Wayland does not recognize - must be held so a human
 * decides.
 */

import { describe, expect, it } from 'vitest';
import { classifyAutopilotToolCall } from '@/common/security/destructiveCommand';

/** The full raw ACP tool-call kind vocabulary. */
const ALL_ACP_KINDS = [
  'read',
  'search',
  'edit',
  'delete',
  'move',
  'execute',
  'think',
  'fetch',
  'switch_mode',
  'other',
] as const;

const AUTO_APPROVED_KINDS = ['read', 'search', 'edit', 'think'] as const;
const HELD_KINDS = ['delete', 'move', 'fetch', 'switch_mode', 'other'] as const;

describe('classifyAutopilotToolCall - tool kind allowlist', () => {
  it('covers every ACP kind exactly once across the two expectation sets', () => {
    const covered = [...AUTO_APPROVED_KINDS, ...HELD_KINDS, 'execute'].toSorted();
    expect(covered).toEqual([...ALL_ACP_KINDS].toSorted());
  });

  for (const kind of AUTO_APPROVED_KINDS) {
    it(`auto-approves kind '${kind}'`, () => {
      const verdict = classifyAutopilotToolCall({ kind, title: 'Read', rawInput: { path: './src/index.ts' } });
      expect(verdict.autoApprove).toBe(true);
      expect(verdict.reason).toBe('');
    });
  }

  for (const kind of HELD_KINDS) {
    it(`holds kind '${kind}' for a human`, () => {
      const verdict = classifyAutopilotToolCall({ kind, title: kind, rawInput: { path: './notes.md' } });
      expect(verdict.autoApprove).toBe(false);
      expect(verdict.reason.length).toBeGreaterThan(0);
    });
  }

  it('holds an unrecognized kind rather than waving it through', () => {
    expect(classifyAutopilotToolCall({ kind: 'not_a_real_kind', title: 'x' }).autoApprove).toBe(false);
  });

  it('holds a tool call that declares no kind at all', () => {
    expect(classifyAutopilotToolCall({ title: 'x' }).autoApprove).toBe(false);
    expect(classifyAutopilotToolCall({ kind: undefined, title: 'x' }).autoApprove).toBe(false);
  });
});

describe('classifyAutopilotToolCall - the held kinds are held on their real payloads', () => {
  it('holds a delete of a credential directory', () => {
    expect(
      classifyAutopilotToolCall({ kind: 'delete', title: 'Delete', rawInput: { path: '/Users/sean/.ssh' } }).autoApprove
    ).toBe(false);
  });

  it('holds a move that relocates a credential directory', () => {
    expect(
      classifyAutopilotToolCall({ kind: 'move', title: 'Move', rawInput: { from: '/Users/sean/.aws', to: '/tmp/x' } })
        .autoApprove
    ).toBe(false);
  });

  it('holds a network fetch', () => {
    expect(
      classifyAutopilotToolCall({
        kind: 'fetch',
        title: 'WebFetch',
        rawInput: { url: 'https://example.invalid/collect' },
      }).autoApprove
    ).toBe(false);
  });

  it('holds a self-escalating mode switch', () => {
    expect(
      classifyAutopilotToolCall({ kind: 'switch_mode', title: 'switch_mode', rawInput: { mode: 'bypassPermissions' } })
        .autoApprove
    ).toBe(false);
  });

  it('holds an unclassified MCP-style tool call', () => {
    expect(classifyAutopilotToolCall({ kind: 'other', title: 'mcp__server__do_thing', rawInput: {} }).autoApprove).toBe(
      false
    );
  });
});

describe('classifyAutopilotToolCall - execute still goes through the command classifier', () => {
  it('auto-approves an ordinary build command', () => {
    const verdict = classifyAutopilotToolCall({
      kind: 'execute',
      title: 'Bash',
      rawInput: { command: 'bun run build' },
    });
    expect(verdict.autoApprove).toBe(true);
  });

  it('holds a catastrophic command and reports the classifier reason', () => {
    const verdict = classifyAutopilotToolCall({ kind: 'execute', title: 'Bash', rawInput: { command: 'rm -rf /' } });
    expect(verdict.autoApprove).toBe(false);
    expect(verdict.reason).toMatch(/root|home/i);
  });
});
