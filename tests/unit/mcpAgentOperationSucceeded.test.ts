/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { mcpAgentOperationSucceeded } from '@process/services/mcpServices/McpProtocol';

/**
 * The rule that decides whether a publish/remove across agents succeeded.
 *
 * This exists as one shared function because it did not used to. The sync and
 * remove paths each carried their own copy, the non-target exclusion was
 * applied to only the sync copy, and the rollback half kept failing on every
 * machine with an unsupported backend -- while the renderer-level tests passed,
 * because they mock the IPC response and never reach this aggregation at all.
 *
 * These cases are therefore deliberately about the AGGREGATION, not the
 * renderer. Both call sites now share this function, so both are covered.
 */
describe('mcpAgentOperationSucceeded', () => {
  it('succeeds when every actionable agent succeeded', () => {
    expect(
      mcpAgentOperationSucceeded([
        { success: true },
        { success: true },
      ])
    ).toBe(true);
  });

  it('succeeds when the only unsuccessful agents are non-targets', () => {
    // The real shape: five agents that can carry an MCP server, and a dozen
    // detected backends that cannot.
    expect(
      mcpAgentOperationSucceeded([
        { success: true },
        { success: true },
        { success: false, unsupported: true },
        { success: false, unsupported: true },
        { success: false, unsupported: true },
      ])
    ).toBe(true);
  });

  it('fails when a real agent failed alongside non-targets', () => {
    expect(
      mcpAgentOperationSucceeded([
        { success: false },
        { success: false, unsupported: true },
      ])
    ).toBe(false);
  });

  it('fails when every agent is a non-target', () => {
    // Nothing could carry the server, so nothing was published. Excluding
    // non-targets must not turn "no target existed" into success.
    expect(
      mcpAgentOperationSucceeded([
        { success: false, unsupported: true },
        { success: false, unsupported: true },
      ])
    ).toBe(false);
  });

  it('fails on an empty result set', () => {
    expect(mcpAgentOperationSucceeded([])).toBe(false);
  });

  it('does not treat a successful non-target as carrying the operation', () => {
    // Guard against the exclusion being written as "unsupported counts as
    // success": a non-target contributes nothing either way, so a set with
    // only non-targets still fails even if one reports success.
    expect(mcpAgentOperationSucceeded([{ success: true, unsupported: true }])).toBe(false);
  });
});
