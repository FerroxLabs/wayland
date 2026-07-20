/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';
import { resolveVerifiedOfficecliCommand } from '@process/bridge/officecliInstaller';
import { OFFICECLI_LEDGER_PROOF } from '@process/services/capabilities/OfficeCliContractValidator';

function sourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return /\.tsx?$/.test(entry.name) ? [absolute] : [];
  });
}

describe('Cowork assistant and workspace authority remain separate', () => {
  it('does not encode an access grant in the Cowork preset', () => {
    const cowork = ASSISTANT_PRESETS.find((preset) => preset.id === 'cowork');

    expect(cowork).toBeDefined();
    const serialized = JSON.stringify(cowork);
    expect(serialized).not.toContain('workspaceTrust');
    expect(serialized).not.toContain('workspace.trustLevel');
    expect(serialized).not.toContain('trusted-edits');
  });

  it('has no renderer path that silently arms workspace access', () => {
    const rendererRoot = path.join(process.cwd(), 'src/renderer');
    const offenders = sourceFiles(rendererRoot)
      .filter((file) => fs.readFileSync(file, 'utf8').includes('workspaceTrust.set'))
      .map((file) => path.relative(process.cwd(), file));

    // An explicit access-control UI may be added later, but it must update this
    // guard deliberately. Selecting an assistant, mode, or preset cannot write
    // workspace authority as a side effect.
    expect(offenders).toEqual([]);
  });
});

describe('Cowork office bridges invoke only the exact verified OfficeCLI capability', () => {
  const bridgeSources = [
    'src/process/bridge/pptPreviewBridge.ts',
    'src/process/bridge/officeWatchBridge.ts',
  ].map((relative) => ({
    relative,
    source: fs.readFileSync(path.join(process.cwd(), relative), 'utf8'),
  }));

  it('binds spawn to the resolved verified executable, never a bare-PATH officecli', () => {
    for (const { relative, source } of bridgeSources) {
      // The command passed to spawn is the resolved exact executable path.
      expect(source, relative).toContain('resolveVerifiedOfficecliCommand');
      expect(source, relative).toContain("spawn(command, ['watch'");
      // A bare-PATH command string would let a hijacked PATH entry execute.
      expect(source, relative).not.toContain("spawn('officecli'");
    }
  });

  it('resolves no executable when the verified lockstep capability is unavailable (fail closed)', () => {
    // With no verified bundled capability registered, the authority boundary
    // yields nothing. Callers fail closed: there is no bare-PATH, npm/global,
    // or hosted fallback to reach.
    expect(resolveVerifiedOfficecliCommand()).toBeNull();
  });

  it('represents any future alternative only as an unavailable, non-executing fallback', () => {
    // The supply-chain ledger proof carries the future-alternative flag as
    // unavailable. It confers no present consent, readiness, or execution.
    expect(OFFICECLI_LEDGER_PROOF.hostedFallbackAvailable).toBe(false);
  });
});
