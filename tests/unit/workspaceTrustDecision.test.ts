/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  coerceWorkspaceAccessLevel,
  DEFAULT_WORKSPACE_ACCESS_LEVEL,
  trustedWorkspaceAutoApprovesAcpKind,
  trustedWorkspaceAutoApprovesConfirmationType,
} from '@/common/security/workspaceTrust';

/**
 * #671 — the single decision the whole trust axis hangs on: what a trusted
 * trusted-edits workspace auto-approves. The contract is "auto-approve read/edit,
 * STILL prompt on exec + network" — so these tests assert the LITERAL safe set,
 * not "not X", because network + destructive kinds riding an auto-approve is the
 * exact failure mode this feature must never have.
 */
describe('trustedWorkspaceAutoApprovesAcpKind — raw ACP kind gate', () => {
  it('auto-approves exactly the non-destructive, non-network read/edit kinds', () => {
    expect(trustedWorkspaceAutoApprovesAcpKind('read')).toBe(true);
    expect(trustedWorkspaceAutoApprovesAcpKind('search')).toBe(true);
    expect(trustedWorkspaceAutoApprovesAcpKind('edit')).toBe(true);
  });

  it('PROMPTS on exec/network and every destructive/unknown kind', () => {
    // execute + network (fetch) — the "still prompt on exec + network" contract.
    expect(trustedWorkspaceAutoApprovesAcpKind('execute')).toBe(false);
    expect(trustedWorkspaceAutoApprovesAcpKind('fetch')).toBe(false);
    // destructive file ops must NOT ride the edit auto-approve.
    expect(trustedWorkspaceAutoApprovesAcpKind('delete')).toBe(false);
    expect(trustedWorkspaceAutoApprovesAcpKind('move')).toBe(false);
    // everything else prompts (MCP/other collapse here, think, mode switches).
    expect(trustedWorkspaceAutoApprovesAcpKind('think')).toBe(false);
    expect(trustedWorkspaceAutoApprovesAcpKind('switch_mode')).toBe(false);
    expect(trustedWorkspaceAutoApprovesAcpKind('other')).toBe(false);
    expect(trustedWorkspaceAutoApprovesAcpKind('mcp')).toBe(false);
  });

  it('prompts on missing/undefined/empty kind (fail-safe)', () => {
    expect(trustedWorkspaceAutoApprovesAcpKind(undefined)).toBe(false);
    expect(trustedWorkspaceAutoApprovesAcpKind(null)).toBe(false);
    expect(trustedWorkspaceAutoApprovesAcpKind('')).toBe(false);
  });
});

describe('trustedWorkspaceAutoApprovesConfirmationType — Gemini/WCore type gate', () => {
  it('auto-approves ONLY concrete edits', () => {
    expect(trustedWorkspaceAutoApprovesConfirmationType('edit')).toBe(true);
  });

  it("does NOT auto-approve the 'info' catch-all (may carry network/URL fetches)", () => {
    // This is the B1 hole: 'info' is an engine-assigned catch-all, not "read".
    expect(trustedWorkspaceAutoApprovesConfirmationType('info')).toBe(false);
  });

  it('prompts on exec/mcp/question and unknown/undefined types', () => {
    expect(trustedWorkspaceAutoApprovesConfirmationType('exec')).toBe(false);
    expect(trustedWorkspaceAutoApprovesConfirmationType('mcp')).toBe(false);
    expect(trustedWorkspaceAutoApprovesConfirmationType('question')).toBe(false);
    expect(trustedWorkspaceAutoApprovesConfirmationType(undefined)).toBe(false);
    expect(trustedWorkspaceAutoApprovesConfirmationType(null)).toBe(false);
  });
});

describe('coerceWorkspaceAccessLevel — fail-safe normalization', () => {
  it('accepts canonical access levels and maps legacy serialized values', () => {
    expect(coerceWorkspaceAccessLevel('trusted-edits')).toBe('trusted-edits');
    expect(coerceWorkspaceAccessLevel('ask')).toBe('ask');
    expect(coerceWorkspaceAccessLevel('cowork')).toBe('trusted-edits');
    expect(coerceWorkspaceAccessLevel('chat')).toBe('ask');
  });

  it('maps every unknown value to the gated default', () => {
    expect(coerceWorkspaceAccessLevel(undefined)).toBe('ask');
    expect(coerceWorkspaceAccessLevel(null)).toBe('ask');
    expect(coerceWorkspaceAccessLevel('trusted')).toBe('ask');
    expect(coerceWorkspaceAccessLevel(1)).toBe('ask');
    expect(coerceWorkspaceAccessLevel({})).toBe('ask');
    expect(DEFAULT_WORKSPACE_ACCESS_LEVEL).toBe('ask');
  });
});
