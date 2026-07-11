// tests/unit/process/acp/errors/setupFailure.test.ts

import { describe, it, expect } from 'vitest';
import {
  buildAcpAdapterCorruptionGuidance,
  buildAcpSetupGuidance,
  getAcpSetupInstallCmd,
  looksLikeAdapterCorruption,
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

// #676: a bunx-spawned Node ACP adapter left half-installed (missing package.json
// / entry point) fails startup with a cryptic "Cannot find module 'zod/v4'".
describe('adapter corruption (bunx half-install) guidance', () => {
  const CORRUPT_MSG =
    'Agent exited before initialize completed (code: 1)\n' +
    "error: Cannot find module 'zod/v4' from " +
    "'/var/folders/8h/T/bunx-501-@agentclientprotocol/claude-agent-acp@0.55.0/node_modules/@agentclientprotocol/sdk/dist/schema/zod.gen.js'";

  it('detects a bunx module-resolution failure at adapter startup', () => {
    expect(looksLikeAdapterCorruption(CORRUPT_MSG)).toBe(true);
    // "before initialize completed" alone (no bunx path) also anchors it.
    expect(
      looksLikeAdapterCorruption('Agent exited before initialize completed (code: 1)\nCannot find package foo')
    ).toBe(true);
  });

  it('does NOT match the python missing-extra case (owned by setup guidance)', () => {
    // MISSING_DEPS_MSG contains "No module named 'acp'" — must route to setup, not corruption.
    expect(looksLikeAdapterCorruption(MISSING_DEPS_MSG)).toBe(false);
  });

  it('does NOT match a mid-turn error that merely mentions a module', () => {
    expect(looksLikeAdapterCorruption('Tool failed: cannot find module the user asked about')).toBe(false);
    expect(looksLikeAdapterCorruption('HTTP 500 internal error')).toBe(false);
  });

  it('builds actionable, restart-oriented guidance instead of a raw stack', () => {
    const g = buildAcpAdapterCorruptionGuidance('claude', CORRUPT_MSG);
    expect(g).not.toBeNull();
    expect(g).toContain('corrupted');
    expect(g).toContain('reinstall');
    expect(g).not.toContain('zod/v4'); // no raw module path leaks to the user
  });

  it('returns null guidance for a non-corruption error', () => {
    expect(buildAcpAdapterCorruptionGuidance('claude', 'HTTP 401 unauthorized')).toBeNull();
  });
});
