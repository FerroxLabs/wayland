/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reachability of the Autopilot guardrail.
 *
 * The guardrail in `AcpAgentManager.handleSignalEvent` only runs on a permission
 * request that actually arrives. `PermissionResolver` short-circuits on its
 * `autoApproveAll` flag at Level 1 - before the classifier, before the cache,
 * and without invoking the UI callback - so no permission signal is emitted and
 * the guardrail is skipped entirely.
 *
 * The scheduled-task executor builds EVERY task with `yoloMode: true`, and that
 * value becomes `autoApproveAll`. Scheduled tasks are also the primary producer
 * of guarded-auto sessions (`getFullAutoMode('claude')`), so without the
 * override pinned here the guardrail would never execute on the path it exists
 * to protect.
 */

import { describe, expect, it } from 'vitest';
import { ACP_AUTO_GUARDED_MODE, getFullAutoMode, resolveBlanketAutoApprove } from '@/common/types/agentModes';
import { PermissionResolver } from '@/process/acp/session/PermissionResolver';

describe('resolveBlanketAutoApprove', () => {
  it('refuses blanket auto-approve for a guarded-auto session even when requested', () => {
    expect(resolveBlanketAutoApprove(ACP_AUTO_GUARDED_MODE, true)).toBe(false);
  });

  it("refuses it for claude's full-auto mode, which is the guarded mode", () => {
    expect(resolveBlanketAutoApprove(getFullAutoMode('claude'), true)).toBe(false);
  });

  it('passes the request through for every other mode', () => {
    for (const mode of ['bypassPermissions', 'yolo', 'default', 'acceptEdits', 'plan', undefined]) {
      expect(resolveBlanketAutoApprove(mode, true)).toBe(true);
      expect(resolveBlanketAutoApprove(mode, false)).toBe(false);
    }
  });

  it('never invents blanket approval that was not requested', () => {
    expect(resolveBlanketAutoApprove(ACP_AUTO_GUARDED_MODE, false)).toBe(false);
  });
});

describe('PermissionResolver reachability', () => {
  const request = {
    sessionId: 'session-1',
    toolCall: { toolCallId: 'call-1', kind: 'execute', title: 'Bash', rawInput: { command: 'rm -rf ~' } },
    options: [
      { optionId: 'allow_once', name: 'Allow', kind: 'allow_once' },
      { optionId: 'reject_once', name: 'Reject', kind: 'reject_once' },
    ],
  } as never;

  it('auto-approves without ever consulting the UI when the blanket flag is set', async () => {
    let uiCalls = 0;
    const resolver = new PermissionResolver({ autoApproveAll: true });
    const response = await resolver.evaluate(request, () => {
      uiCalls++;
    });
    expect(response.outcome).toEqual({ outcome: 'selected', optionId: 'allow_once' });
    expect(uiCalls).toBe(0);
  });

  it('delegates to the UI - where the guardrail runs - when the flag is clear', async () => {
    let uiCalls = 0;
    const resolver = new PermissionResolver({ autoApproveAll: false });
    void resolver.evaluate(request, () => {
      uiCalls++;
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(uiCalls).toBe(1);
    expect(resolver.hasPending).toBe(true);
  });

  it('a scheduled guarded-auto task resolves to the delegating configuration', async () => {
    // Shape of a cron-built task: the executor always passes yoloMode: true, and
    // the conversation carries sessionMode from the job's agent config.
    const autoApproveAll = resolveBlanketAutoApprove(getFullAutoMode('claude'), true);
    expect(autoApproveAll).toBe(false);

    let uiCalls = 0;
    const resolver = new PermissionResolver({ autoApproveAll });
    void resolver.evaluate(request, () => {
      uiCalls++;
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(uiCalls).toBe(1);
  });
});
