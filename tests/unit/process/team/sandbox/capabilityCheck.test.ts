/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4b - Tests for the capability-check helpers.
 *
 * Covers the four cells of the (sandboxed × granted) truth table plus the
 * `assertCapGranted` error-throwing surface.
 */

import { describe, expect, it } from 'vitest';
import { TeamSandboxedError } from '@process/team/importExport/errors';
import { assertCapGranted, isCapGranted } from '@process/team/sandbox/capabilityCheck';
import type { TTeam } from '@process/team/types';

const baseTeam: TTeam = {
  id: 'team-abc',
  userId: 'user-1',
  name: 'Imported Squad',
  workspace: '/tmp/ws',
  workspaceMode: 'shared',
  leaderAgentId: 'slot-1',
  agents: [],
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
};

describe('isCapGranted', () => {
  // W4 audit CRIT-2 fix (2026-05-19): the gate is `importedFrom`, not
  // `isSandboxed`. Non-imported teams (no importedFrom) bypass the grant
  // map; imported teams ALWAYS consult the grant map, regardless of
  // `isSandboxed` value. This defeats the "grant one cap = de-sandbox
  // all caps" attack codified by the pre-fix test suite.
  it('returns true for non-imported teams regardless of isSandboxed / grants', () => {
    // No importedFrom set → user-created team, full trust.
    expect(isCapGranted({ ...baseTeam }, 'canReadFiles')).toBe(true);
    expect(isCapGranted({ ...baseTeam, isSandboxed: false }, 'canSpawnAgents')).toBe(true);
    expect(isCapGranted({ ...baseTeam, isSandboxed: true }, 'canWriteFiles')).toBe(true);
  });

  it('returns true for an imported team with by_user: true grant (regardless of isSandboxed)', () => {
    const team: TTeam = {
      ...baseTeam,
      importedFrom: 'evil-pack.json',
      isSandboxed: true,
      importCapabilityGrants: {
        canReadFiles: { granted_at: 1700000000000, by_user: true },
      },
    };
    expect(isCapGranted(team, 'canReadFiles')).toBe(true);
    // Legacy DB rows may have isSandboxed=false but still be imported;
    // per-cap grant must still gate.
    const legacyRow: TTeam = { ...team, isSandboxed: false };
    expect(isCapGranted(legacyRow, 'canReadFiles')).toBe(true);
  });

  it('returns false for an imported team with by_user: false grant', () => {
    const team: TTeam = {
      ...baseTeam,
      importedFrom: 'pack.json',
      isSandboxed: true,
      importCapabilityGrants: {
        canReadFiles: { granted_at: 1700000000000, by_user: false },
      },
    };
    expect(isCapGranted(team, 'canReadFiles')).toBe(false);
  });

  it('returns false for an imported team with no grant entry for the capability', () => {
    const team: TTeam = {
      ...baseTeam,
      importedFrom: 'pack.json',
      isSandboxed: true,
      importCapabilityGrants: {},
    };
    expect(isCapGranted(team, 'canWriteFiles')).toBe(false);
    expect(isCapGranted({ ...team, importCapabilityGrants: undefined }, 'canSpawnAgents')).toBe(
      false
    );
  });

  // W4 audit CRIT-2 - the load-bearing regression: granting ONE cap must
  // NOT grant the OTHERS. Pre-fix behavior flipped `isSandboxed=false`
  // when any cap was granted and `isCapGranted` short-circuited on that
  // flag, effectively turning a single approval into full trust.
  it('REGRESSION: granting one cap does NOT implicitly grant the others', () => {
    const team: TTeam = {
      ...baseTeam,
      importedFrom: 'pack.json',
      // Even if a legacy code path persisted isSandboxed=false, the gate
      // is the grant map, not the flag.
      isSandboxed: false,
      importCapabilityGrants: {
        canReadFiles: { granted_at: 1700000000000, by_user: true },
      },
    };
    expect(isCapGranted(team, 'canReadFiles')).toBe(true);
    expect(isCapGranted(team, 'canSpawnAgents')).toBe(false);
    expect(isCapGranted(team, 'canWriteFiles')).toBe(false);
    expect(isCapGranted(team, 'canCrossTeamMessage')).toBe(false);
    expect(isCapGranted(team, 'canNetworkRequest')).toBe(false);
  });

  it('REGRESSION: imported team without isSandboxed (legacy DB row) still respects grant map', () => {
    const team: TTeam = {
      ...baseTeam,
      importedFrom: 'pack.json',
      // legacy persisted shape - no isSandboxed field at all
      importCapabilityGrants: {
        canReadFiles: { granted_at: 1700000000000, by_user: true },
      },
    };
    expect(isCapGranted(team, 'canReadFiles')).toBe(true);
    expect(isCapGranted(team, 'canWriteFiles')).toBe(false);
  });
});

describe('assertCapGranted', () => {
  it('does not throw for non-imported teams (full trust by definition)', () => {
    expect(() => assertCapGranted({ ...baseTeam, isSandboxed: false }, 'canReadFiles')).not.toThrow();
    expect(() => assertCapGranted({ ...baseTeam }, 'canReadFiles')).not.toThrow();
  });

  it('throws TeamSandboxedError when imported-team capability is denied; message names the capability', () => {
    const team: TTeam = {
      ...baseTeam,
      importedFrom: 'pack.json',
      isSandboxed: true,
      importCapabilityGrants: {},
    };
    let caught: unknown;
    try {
      assertCapGranted(team, 'canSpawnAgents');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(TeamSandboxedError);
    const err = caught as TeamSandboxedError;
    expect(err.message).toMatch(/canSpawnAgents/);
    expect(err.code).toBe('TEAM_SANDBOXED');
  });
});
