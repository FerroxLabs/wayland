/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// tests/unit/process/team/importExport/importTeam.test.ts
//
// W4 (T4.2 + T4.5 + T4.6) - preview pipeline + capability-grant helpers.
//
// We test the pure logic (preview + grant building + sandbox-flag derivation)
// without spinning up the conversation factory; full acceptTeamImport
// end-to-end coverage lands in the e2e harness in W5.2 per TRIAGE H11.

import { describe, it, expect } from 'vitest';
import {
  buildCapabilityGrants,
  isSandboxedAfterImport,
  previewImport,
} from '@process/team/importExport/importTeam';
import { TeamExportSchema } from '@process/team/importExport/TeamExportSchema';

function payload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: 'v1',
    id: 'team-1',
    name: 'Affiliate Engine',
    leader: { id: 'affiliate-site-engine', recommendBackend: 'gemini' },
    teammates: [
      { id: 'research', name: 'Scout', prompt: '', recommendBackend: 'gemini' },
      { id: 'copy', name: 'Quill', prompt: '', recommendBackend: 'gemini' },
    ],
    capabilities: {
      canReadFiles: false,
      canWriteFiles: false,
      canSpawnAgents: false,
      canNetworkRequest: false,
      canCrossTeamMessage: false,
    },
    ...overrides,
  });
}

describe('previewImport', () => {
  it('returns specialistsAvailable=false + missingSpecialists when payload references unknown skill IDs', async () => {
    const result = await previewImport(payload(), async () => new Set(['affiliate-site-engine']));
    expect(result.specialistsAvailable).toBe(false);
    expect(result.missingSpecialists).toEqual(expect.arrayContaining(['research', 'copy']));
  });

  it('returns specialistsAvailable=true when every referenced skill is in the catalog', async () => {
    const result = await previewImport(
      payload(),
      async () => new Set(['affiliate-site-engine', 'research', 'copy'])
    );
    expect(result.specialistsAvailable).toBe(true);
    expect(result.missingSpecialists).toEqual([]);
  });

  it('rejects payloads carrying `constructor` keys nested in the teammate roster', async () => {
    // `constructor` survives both JSON.stringify and JSON.parse as a real
    // own property. Zod strict would also reject it (extra field), but our
    // dedicated pollution walker runs first so we must see that code, not
    // the schema code.
    const nested = JSON.stringify({
      version: 'v1',
      id: 'team-1',
      name: 'X',
      leader: { id: 'leader' },
      teammates: [{ id: 'research', name: 'Scout', prompt: '', constructor: { polluted: true } }],
      capabilities: {
        canReadFiles: false,
        canWriteFiles: false,
        canSpawnAgents: false,
        canNetworkRequest: false,
        canCrossTeamMessage: false,
      },
    });
    await expect(previewImport(nested, async () => new Set())).rejects.toMatchObject({
      code: 'TEAM_IMPORT_PROTO_POLLUTION',
    });
  });

  it('rejects payloads carrying a real own `__proto__` key (JSON.parse-materialized)', async () => {
    // The literal `{"__proto__":...}` in raw JSON text is what an attacker
    // would actually ship. We construct the text directly so JSON.parse
    // creates an own enumerable `__proto__` key on the result.
    const text =
      '{"version":"v1","id":"team-1","name":"X","__proto__":{"polluted":true},' +
      '"leader":{"id":"leader"},"teammates":[],' +
      '"capabilities":{"canReadFiles":false,"canWriteFiles":false,"canSpawnAgents":false,' +
      '"canNetworkRequest":false,"canCrossTeamMessage":false}}';
    await expect(previewImport(text, async () => new Set())).rejects.toMatchObject({
      code: 'TEAM_IMPORT_PROTO_POLLUTION',
    });
  });

  it('throws TeamImportError when the payload fails Zod strict validation', async () => {
    const text = payload({ extraField: 'sneaky' });
    await expect(previewImport(text, async () => new Set())).rejects.toMatchObject({
      code: 'TEAM_IMPORT_SCHEMA_INVALID',
    });
  });
});

describe('buildCapabilityGrants', () => {
  it('skips capabilities the user did not grant', () => {
    const grants = buildCapabilityGrants({ canReadFiles: true, canWriteFiles: false }, 1234);
    expect(grants).toEqual({ canReadFiles: { granted_at: 1234, by_user: true } });
  });

  it('returns an empty object when no caps are granted', () => {
    const grants = buildCapabilityGrants({
      canReadFiles: false,
      canWriteFiles: false,
      canSpawnAgents: false,
      canNetworkRequest: false,
      canCrossTeamMessage: false,
    });
    expect(grants).toEqual({});
  });
});

describe('isSandboxedAfterImport - legacy helper kept for historical coverage', () => {
  // W4 audit CRIT-2 fix (2026-05-19): the production code in
  // `TeamSessionService.acceptTeamImport` no longer consults this helper.
  // Imported teams are now ALWAYS persisted with `isSandboxed: true`; the
  // security gate is the per-capability grant map consulted by
  // `isCapGranted` whenever `team.importedFrom` is set.
  //
  // Granting one cap MUST NOT de-sandbox the other caps. The full
  // invariant is verified by the `isCapGranted` regression tests in
  // tests/unit/process/team/sandbox/capabilityCheck.test.ts.
  const allFalseCaps = {
    canReadFiles: false,
    canWriteFiles: false,
    canSpawnAgents: false,
    canNetworkRequest: false,
    canCrossTeamMessage: false,
  };

  it('returns true when no caps granted (legacy semantics preserved)', () => {
    expect(isSandboxedAfterImport(allFalseCaps, {})).toBe(true);
  });

  it('returns true when the payload declares a cap that the user did NOT grant', () => {
    expect(
      isSandboxedAfterImport(
        { ...allFalseCaps, canReadFiles: true },
        { canReadFiles: false, canWriteFiles: true }
      )
    ).toBe(true);
  });
});

describe('TeamExportSchema - W5 audit HIGH-1 service-boundary re-validation', () => {
  // The accept path in `TeamSessionService.acceptTeamImport` re-runs
  // `TeamExportSchema.safeParse` on the parsed payload it receives from
  // the renderer. End-to-end coverage of `acceptTeamImport` lands in the
  // W5.2 e2e harness (see top-of-file note). Here we lock in the exact
  // failure mode the service relies on: a parsed object missing
  // `leader.id` must NOT pass `safeParse`. This is the regression test
  // that wedges open the boundary check at the service layer.
  it('safeParse rejects parsed objects missing leader.id (used by acceptTeamImport re-check)', () => {
    const result = TeamExportSchema.safeParse({
      version: 'v1',
      id: 'team-1',
      name: 'Bad',
      leader: {}, // <-- missing id
      teammates: [],
      capabilities: {
        canReadFiles: false,
        canWriteFiles: false,
        canSpawnAgents: false,
        canNetworkRequest: false,
        canCrossTeamMessage: false,
      },
    });
    expect(result.success).toBe(false);
  });
});
