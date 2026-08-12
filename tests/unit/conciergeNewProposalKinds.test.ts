/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Contract tests for the two proposal kinds added for the systems built after
 * Concierge Phase 2b: `install_agent` (managed ACP agent install) and
 * `enable_routine` (flip one seeded, disabled built-in routine on).
 *
 * These cover the SHARED contract only — the union, the runtime kinds array, the
 * field validators, and the catalogue-agreement guard. The detector arms, the
 * confirm card and the MAIN apply handlers are wired separately and are tested
 * where they live.
 */

import { describe, it, expect } from 'vitest';
import {
  CONCIERGE_PROPOSAL_KINDS,
  installAgentProposalMatchesPin,
  proposalNeedsCardSecret,
  summarizeProposal,
  validateEnableRoutineProposal,
  validateInstallAgentProposal,
  type ConciergeProposal,
} from '@/common/chat/conciergeConfig';

describe('install_agent proposal kind', () => {
  it('is in the union and in CONCIERGE_PROPOSAL_KINDS', () => {
    expect(CONCIERGE_PROPOSAL_KINDS).toContain('install_agent');
    // Type-level: this only compiles if the arm exists in the union.
    const p: ConciergeProposal = {
      kind: 'install_agent',
      agentId: 'kimi',
      npmPackage: '@moonshot-ai/kimi-code',
      version: '0.34.0',
    };
    expect(summarizeProposal(p)).toBe('Install kimi (@moonshot-ai/kimi-code@0.34.0)');
  });

  it('validates a well-formed proposal, with and without the optional label', () => {
    expect(
      validateInstallAgentProposal({
        agentId: 'codex',
        npmPackage: '@agentclientprotocol/codex-acp',
        version: '1.1.2',
        label: 'Codex',
      })
    ).toEqual({
      kind: 'install_agent',
      agentId: 'codex',
      npmPackage: '@agentclientprotocol/codex-acp',
      version: '1.1.2',
      label: 'Codex',
    });

    expect(validateInstallAgentProposal({ agentId: 'kimi', npmPackage: 'kimi-code', version: '0.34.0' })).toEqual({
      kind: 'install_agent',
      agentId: 'kimi',
      npmPackage: 'kimi-code',
      version: '0.34.0',
    });
  });

  it('rejects a malformed proposal (missing fields)', () => {
    expect(validateInstallAgentProposal({})).toBeNull();
    expect(validateInstallAgentProposal({ agentId: 'kimi' })).toBeNull();
    expect(validateInstallAgentProposal({ agentId: 'kimi', npmPackage: 'kimi-code' })).toBeNull();
    expect(validateInstallAgentProposal({ npmPackage: 'kimi-code', version: '0.34.0' })).toBeNull();
    expect(validateInstallAgentProposal({ agentId: '  ', npmPackage: 'x', version: '1.0.0' })).toBeNull();
    expect(validateInstallAgentProposal({ agentId: 42, npmPackage: 'x', version: '1.0.0' })).toBeNull();
  });

  it('rejects an agent id that could escape the install prefix', () => {
    for (const bad of ['../../Library/LaunchAgents', 'a/b', '..', '.hidden', 'C:\\x', 'a\\b', 'Kimi', 'ki mi']) {
      expect(validateInstallAgentProposal({ agentId: bad, npmPackage: 'x', version: '1.0.0' })).toBeNull();
    }
  });

  it('rejects a version that is a range or a dist-tag, not exact bytes', () => {
    for (const bad of ['^1.1.2', '~1.1', '1.x', '*', 'latest', 'next', '1.1', '']) {
      expect(validateInstallAgentProposal({ agentId: 'codex', npmPackage: 'codex-acp', version: bad })).toBeNull();
    }
    // A prerelease is still an exact published version.
    expect(
      validateInstallAgentProposal({ agentId: 'codex', npmPackage: 'codex-acp', version: '1.1.2-rc.1' })
    ).toMatchObject({ version: '1.1.2-rc.1' });
  });

  it('rejects a package name that is not a valid npm name', () => {
    for (const bad of ['../evil', 'has space', '@scope', 'UPPER', 'a/b/c', `${'x'.repeat(215)}`]) {
      expect(validateInstallAgentProposal({ agentId: 'codex', npmPackage: bad, version: '1.1.2' })).toBeNull();
    }
  });

  it('carries no credential, and needs no secret typed into the card', () => {
    const p = validateInstallAgentProposal({
      agentId: 'kimi',
      npmPackage: '@moonshot-ai/kimi-code',
      version: '0.34.0',
      apiKey: 'sk-supersecret-1234',
      token: 'npm_secrettoken',
    });
    expect(JSON.stringify(p)).not.toContain('supersecret');
    expect(JSON.stringify(p)).not.toContain('secrettoken');
    expect(proposalNeedsCardSecret('install_agent')).toBe(false);
  });

  it('installAgentProposalMatchesPin refuses a package/version the catalogue does not pin', () => {
    const pinned = { npmPackage: '@moonshot-ai/kimi-code', version: '0.34.0' };
    const good = validateInstallAgentProposal({ agentId: 'kimi', ...pinned })!;
    expect(installAgentProposalMatchesPin(good, pinned)).toBe(true);

    // A prompt-injected block naming a different package must not install it.
    const swapped = validateInstallAgentProposal({ agentId: 'kimi', npmPackage: 'evil-pkg', version: '0.34.0' })!;
    expect(installAgentProposalMatchesPin(swapped, pinned)).toBe(false);

    const wrongVersion = validateInstallAgentProposal({ agentId: 'kimi', npmPackage: pinned.npmPackage, version: '9.9.9' })!;
    expect(installAgentProposalMatchesPin(wrongVersion, pinned)).toBe(false);

    // An agent that is not catalogued at all is a refusal, not an install.
    expect(installAgentProposalMatchesPin(good, undefined)).toBe(false);
  });
});

describe('enable_routine proposal kind', () => {
  it('is in the union and in CONCIERGE_PROPOSAL_KINDS', () => {
    expect(CONCIERGE_PROPOSAL_KINDS).toContain('enable_routine');
    const p: ConciergeProposal = { kind: 'enable_routine', routineId: 'friday-weekly-review' };
    expect(summarizeProposal(p)).toBe('Enable routine "friday-weekly-review"');
    expect(summarizeProposal({ ...p, label: 'Friday weekly review' })).toBe('Enable routine "Friday weekly review"');
  });

  it('validates a well-formed proposal, with and without the optional label', () => {
    expect(validateEnableRoutineProposal({ routineId: 'monday-cashflow', label: 'Monday cashflow' })).toEqual({
      kind: 'enable_routine',
      routineId: 'monday-cashflow',
      label: 'Monday cashflow',
    });
    expect(validateEnableRoutineProposal({ routineId: 'month-end-review' })).toEqual({
      kind: 'enable_routine',
      routineId: 'month-end-review',
    });
  });

  it('rejects a malformed proposal', () => {
    expect(validateEnableRoutineProposal({})).toBeNull();
    expect(validateEnableRoutineProposal({ label: 'Monday cashflow' })).toBeNull();
    expect(validateEnableRoutineProposal({ routineId: '' })).toBeNull();
    expect(validateEnableRoutineProposal({ routineId: '   ' })).toBeNull();
    expect(validateEnableRoutineProposal({ routineId: 123 })).toBeNull();
    for (const bad of ['Monday Cashflow', 'a/b', '..', 'a b', 'a_b']) {
      expect(validateEnableRoutineProposal({ routineId: bad })).toBeNull();
    }
  });

  it('carries no credential, and needs no secret typed into the card', () => {
    const p = validateEnableRoutineProposal({ routineId: 'monday-cashflow', apiKey: 'sk-supersecret-1234' });
    expect(JSON.stringify(p)).not.toContain('supersecret');
    expect(proposalNeedsCardSecret('enable_routine')).toBe(false);
  });
});

describe('the kinds array still matches the union', () => {
  it('lists all seven kinds exactly once', () => {
    expect([...CONCIERGE_PROPOSAL_KINDS].sort()).toEqual([
      'add_mcp',
      'edit_assistant',
      'enable_routine',
      'file_bug_report',
      'install_agent',
      'provider_connect',
      'set_default_model',
    ]);
    expect(new Set(CONCIERGE_PROPOSAL_KINDS).size).toBe(CONCIERGE_PROPOSAL_KINDS.length);
  });
});
