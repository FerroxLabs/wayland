/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ASSISTANT_PRESETS } from '@/common/config/presets/assistantPresets';

// The fail-closed assertion below used to depend on ambient machine state:
// getBundledOfficeCliDir() resolves `${cwd}/resources` outside a packaged app, so
// the test only passed on a machine that had never staged an OfficeCLI bundle.
// Running the (entirely legitimate) prepareOfficeCli step turned the suite red
// without any product change. Own the precondition instead of inheriting it.
vi.mock('@process/utils/shellEnv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@process/utils/shellEnv')>()),
  getBundledOfficeCliDir: vi.fn(),
}));

// eslint-disable-next-line import/first
import { resolveVerifiedOfficecliCommand } from '@process/bridge/officecliInstaller';
// eslint-disable-next-line import/first
import { OFFICECLI_LEDGER_PROOF } from '@process/services/capabilities/OfficeCliContractValidator';
// eslint-disable-next-line import/first
import { getBundledOfficeCliDir } from '@process/utils/shellEnv';

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
  const bridgeSources = ['src/process/bridge/pptPreviewBridge.ts', 'src/process/bridge/officeWatchBridge.ts'].map(
    (relative) => ({
      relative,
      source: fs.readFileSync(path.join(process.cwd(), relative), 'utf8'),
    })
  );

  it('binds spawn to the resolved verified executable, never a bare-PATH officecli', () => {
    for (const { relative, source } of bridgeSources) {
      // The command passed to spawn is the resolved exact executable path.
      expect(source, relative).toContain('resolveVerifiedOfficecliCommand');
      expect(source, relative).toContain("spawn(command, ['watch'");
      // A bare-PATH command string would let a hijacked PATH entry execute.
      expect(source, relative).not.toContain("spawn('officecli'");
    }
  });

  const mockedBundledDir = vi.mocked(getBundledOfficeCliDir);

  beforeEach(() => {
    mockedBundledDir.mockReset();
  });

  it('resolves no executable when the verified lockstep capability is unavailable (fail closed)', () => {
    // With no verified bundled capability registered, the authority boundary
    // yields nothing. Callers fail closed: there is no bare-PATH, npm/global,
    // or hosted fallback to reach.
    mockedBundledDir.mockReturnValue(null);

    expect(resolveVerifiedOfficecliCommand()).toBeNull();
  });

  it('fails closed when digest re-validation throws rather than surfacing a path', () => {
    // getBundledOfficeCliDir re-validates the pinned digest and can throw. A
    // throw must never fall through to an unverified executable.
    mockedBundledDir.mockImplementation(() => {
      throw new Error('digest mismatch');
    });

    expect(resolveVerifiedOfficecliCommand()).toBeNull();
  });

  it('resolves the exact binary inside the verified directory when one is registered', () => {
    // Positive control: proves the null results above come from the authority
    // boundary refusing, not from the resolver being inert.
    mockedBundledDir.mockReturnValue('/verified/bundled-officecli/darwin-arm64');
    const binary = process.platform === 'win32' ? 'officecli.exe' : 'officecli';

    expect(resolveVerifiedOfficecliCommand()).toBe(path.join('/verified/bundled-officecli/darwin-arm64', binary));
  });

  it('represents any future alternative only as an unavailable, non-executing fallback', () => {
    // The supply-chain ledger proof carries the future-alternative flag as
    // unavailable. It confers no present consent, readiness, or execution.
    expect(OFFICECLI_LEDGER_PROOF.hostedFallbackAvailable).toBe(false);
  });
});
