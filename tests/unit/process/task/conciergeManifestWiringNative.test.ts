/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Residual coverage (#10) for the Concierge capabilities manifest + diag seed.
 *
 * This file
 * pins the two remaining native assemblers (Gemini, ACP) and the initStorage
 * diag-seed with STRUCTURAL guards. The Concierge headliner already shipped one
 * silent regression where a clean merge reverted wiring without failing any
 * behavioral test — these guards make the manifest/seed wiring impossible to
 * drop unnoticed, which is exactly the failure mode that bit us.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const read = (rel: string): string => fs.readFileSync(path.resolve(__dirname, '../../../../', rel), 'utf-8');

describe('Concierge manifest wiring — native assemblers (structural)', () => {
  it('GeminiAgentManager resolves the manifest and threads it into the system-prompt assembler', () => {
    const src = read('src/process/task/GeminiAgentManager.ts');
    expect(src).toContain('resolveCapabilitiesManifest');
    // Resolved with the gemini agent key and the conversation's preset id.
    expect(src).toMatch(/capabilitiesManifest:\s*await resolveCapabilitiesManifest\(\{/);
    expect(src).toMatch(/agentKey:\s*'gemini'/);
  });

  it('AcpAgentManager resolves the manifest with the live backend key and threads it in', () => {
    const src = read('src/process/task/AcpAgentManager.ts');
    expect(src).toContain('resolveCapabilitiesManifest');
    expect(src).toMatch(/capabilitiesManifest:\s*await resolveCapabilitiesManifest\(\{/);
    expect(src).toMatch(/agentKey:\s*this\.options\.backend/);
  });
});

describe('Concierge diag MCP gate — Gemini (structural)', () => {
  it('GeminiAgentManager excludes the concierge-diag server from non-Concierge sessions', () => {
    const src = read('src/process/task/GeminiAgentManager.ts');
    // Keep-if-(not-diag)-OR-(is-Concierge), routed through the shared predicate so
    // the gate logic stays a single source of truth across backends.
    expect(src).toContain('BUILTIN_CONCIERGE_DIAG_ID');
    expect(src).toMatch(
      /server\.id\s*!==\s*BUILTIN_CONCIERGE_DIAG_ID\s*\|\|\s*isConciergeAssistant\(this\.presetAssistantId\)/
    );
  });

  it('AcpAgentManager computes allowConciergeDiag via the shared predicate', () => {
    const src = read('src/process/task/AcpAgentManager.ts');
    expect(src).toMatch(/allowConciergeDiag:\s*isConciergeAssistant\(/);
  });
});

describe('Concierge diag MCP seed — initStorage (structural)', () => {
  it('seeds the read-only concierge-diag server into mcp.config with its scoped diag env', () => {
    const src = read('src/process/utils/initStorage.ts');
    // The builtin id must be referenced for both the seed and the idempotent update path.
    expect(src).toContain('BUILTIN_CONCIERGE_DIAG_ID');
    expect(src).toContain('BUILTIN_CONCIERGE_DIAG_NAME');
    // The diag subprocess is pointed at a read-only DB copy via scoped env vars
    // (never the live store) — guard the env keys so the isolation can't silently drop.
    for (const key of ['WAYLAND_CONFIG_PATH', 'WAYLAND_CRON_DB', 'WAYLAND_PROVIDER_DB', 'WAYLAND_LOG_DIR']) {
      expect(src).toContain(key);
    }
    // Seeded as a node stdio server, enabled + flagged builtin.
    expect(src).toMatch(/id:\s*BUILTIN_CONCIERGE_DIAG_ID/);
    expect(src).toMatch(/builtin:\s*true/);
  });
});
