/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * H6 - the rule the Create Task dialog applies when it rebuilds `agentConfig`.
 * Kept as a pure function because both directions are load-bearing and both are
 * invisible when wrong: losing the id silently disables the P2-10 mismatch
 * check, and keeping a STALE id silently makes the task refuse to run forever.
 */

import { describe, it, expect } from 'vitest';
import { preservedWorkspaceId } from '@renderer/pages/cron/cronWorkspaceIdentity';

const WS = '/Users/x/Documents/Wayland/Tasks/Morning Brief';

describe('H6 preservedWorkspaceId', () => {
  it('keeps the id when the folder is unchanged', () => {
    expect(preservedWorkspaceId({ workspace: WS, workspaceId: 'ws-1' }, WS)).toBe('ws-1');
  });

  it('drops the id when the user repoints the task at another folder', () => {
    expect(preservedWorkspaceId({ workspace: WS, workspaceId: 'ws-1' }, '/Users/x/Elsewhere')).toBeUndefined();
  });

  it('drops the id when the workspace is cleared', () => {
    expect(preservedWorkspaceId({ workspace: WS, workspaceId: 'ws-1' }, undefined)).toBeUndefined();
  });

  it('invents nothing when the job never had an id', () => {
    expect(preservedWorkspaceId({ workspace: WS }, WS)).toBeUndefined();
  });

  it('invents nothing when there is no prior config at all', () => {
    expect(preservedWorkspaceId(undefined, WS)).toBeUndefined();
  });
});
