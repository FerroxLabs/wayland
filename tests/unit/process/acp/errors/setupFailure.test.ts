// tests/unit/process/acp/errors/setupFailure.test.ts

import { describe, it, expect } from 'vitest';
import {
  buildAcpSetupGuidance,
  getAcpSetupInstallCmd,
  looksLikeSetupFailure,
} from '@process/acp/errors/setupFailure';

// Realistic AgentStartupError message: the healthy banner line is present
// because hermes prints it before failing, so the detector must not key off it.
const MISSING_DEPS_MSG =
  'Agent exited before initialize completed (code: 1)\n' +
  'Starting hermes-agent ACP adapter\n' +
  "ACP dependencies not installed.\nInstall them with:  pip install -e '.[acp]'";

const HEALTHY_MSG = 'Starting hermes-agent ACP adapter\nSession abc: mode switched to default';

describe('setupFailure', () => {
  it('detects the missing-ACP-deps signature', () => {
    expect(looksLikeSetupFailure(MISSING_DEPS_MSG)).toBe(true);
    expect(looksLikeSetupFailure("ModuleNotFoundError: No module named 'acp'")).toBe(true);
  });

  it('does NOT false-positive on a healthy "Starting ACP adapter" log', () => {
    expect(looksLikeSetupFailure(HEALTHY_MSG)).toBe(false);
    expect(buildAcpSetupGuidance('hermes', HEALTHY_MSG)).toBeNull();
  });

  it('builds actionable guidance for hermes with the correct pipx command', () => {
    const g = buildAcpSetupGuidance('hermes', MISSING_DEPS_MSG);
    expect(g).not.toBeNull();
    expect(g).toContain('Hermes');
    expect(g).toContain('pipx inject hermes-agent agent-client-protocol');
    expect(g).not.toContain("pip install -e '.[acp]'");
  });

  it('returns null guidance for a non-setup error', () => {
    expect(buildAcpSetupGuidance('hermes', 'HTTP 401 unauthorized')).toBeNull();
  });

  it("falls back to the CLI's own install hint for an unknown backend", () => {
    expect(getAcpSetupInstallCmd('someacpcli', 'Install them with: pipx inject someacpcli acp-extra.')).toBe(
      'pipx inject someacpcli acp-extra'
    );
  });

  it('returns no command when an unknown backend has no recoverable hint', () => {
    expect(getAcpSetupInstallCmd('someacpcli', 'acp dependencies not installed')).toBeUndefined();
  });
});
