/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AcpAgent reconnect-error classification - unit test (bug S5)
 *
 * The auto-reconnect path used to wrap EVERY failed reconnect `start()` as a
 * generic `CONNECTION_NOT_READY` ("Failed to reconnect: ..."), discarding the
 * actionable "install the CLI" hint that buildStartupErrorMessage produces and
 * that the honest first-spawn path preserves. `classifyReconnectError` now
 * mirrors the first-spawn classification so the install/auth/timeout hints
 * survive on the reconnect path too.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockConnect, mockDisconnect } = vi.hoisted(() => ({
  mockConnect: vi.fn().mockResolvedValue(undefined),
  mockDisconnect: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/process/agent/acp/AcpConnection', () => ({
  AcpConnection: class {
    hasActiveSession = true;
    isConnected = true;
    isSessionReady = true;
    setConversationId = vi.fn();
    connect = mockConnect;
    disconnect = mockDisconnect;
    getInitializeResponse = vi.fn().mockReturnValue(null);
    getConfigOptions = vi.fn().mockReturnValue(null);
    getModels = vi.fn().mockReturnValue(null);
    getModes = vi.fn().mockReturnValue(null);
    setPromptTimeout = vi.fn();
    onSessionUpdate: unknown = undefined;
    onPermissionRequest: unknown = undefined;
  },
}));

vi.mock('../../src/process/agent/acp/AcpAdapter', () => ({
  AcpAdapter: class {
    constructor() {}
  },
}));

vi.mock('../../src/process/agent/acp/ApprovalStore', () => ({
  AcpApprovalStore: class {
    constructor() {}
  },
  createAcpApprovalKey: vi.fn(),
}));

vi.mock('../../src/process/agent/acp/utils', () => ({
  getClaudeModel: vi.fn().mockReturnValue(null),
  getClaudeModelSlot: vi.fn().mockReturnValue(null),
  killChild: vi.fn(),
  readTextFile: vi.fn(),
  writeJsonRpcMessage: vi.fn(),
  writeTextFile: vi.fn(),
}));

vi.mock('../../src/process/services/ccSwitchModelSource', () => ({
  readClaudeModelInfoFromCcSwitch: vi.fn().mockReturnValue(null),
}));

vi.mock('../../src/process/agent/acp/modelInfo', () => ({
  buildAcpModelInfo: vi.fn(),
  summarizeAcpModelInfo: vi.fn(),
}));

vi.mock('../../src/process/agent/acp/mcpSessionConfig', () => ({
  buildAcpSessionMcpServers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
}));

vi.mock('../../src/common/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/common/utils')>();
  return { ...original, uuid: vi.fn().mockReturnValue('test-uuid') };
});

vi.mock('../../src/process/utils/shellEnv', () => ({
  getEnhancedEnv: vi.fn().mockReturnValue({}),
  resolveNpxPath: vi.fn().mockReturnValue('npx'),
  getNpxCacheDir: vi.fn().mockReturnValue('/tmp/.npx-cache'),
  getWindowsShellExecutionOptions: vi.fn().mockReturnValue({}),
}));

vi.mock('../../src/process/utils/initStorage', () => ({
  ProcessConfig: { get: vi.fn().mockResolvedValue(null) },
}));

import { AcpAgent } from '../../src/process/agent/acp/index';
import { AcpErrorType } from '../../src/common/types/acpTypes';

type ClassifiableAgent = {
  classifyReconnectError: (msg: string) => { type: AcpErrorType; message: string; retryable: boolean };
};

function makeAgent(): ClassifiableAgent {
  const agent = new AcpAgent({
    id: 'test-agent',
    backend: 'gemini',
    workingDir: '/tmp',
    onStreamEvent: vi.fn(),
  });
  return agent as unknown as ClassifiableAgent;
}

describe('AcpAgent.classifyReconnectError (S5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves the "CLI not found / install it" hint instead of CONNECTION_NOT_READY generic wrap', () => {
    const agent = makeAgent();
    const msg = "'gemini' CLI not found. Please install it or update the CLI path in Settings.";

    const err = agent.classifyReconnectError(msg);

    // Original actionable message is preserved verbatim (not "Failed to reconnect: ...").
    expect(err.message).toBe(msg);
    expect(err.message).not.toContain('Failed to reconnect');
    // Installing the CLI is required, so it must not be marked retryable.
    expect(err.retryable).toBe(false);
  });

  it('preserves an ENOENT spawn failure as the original message', () => {
    const agent = makeAgent();
    const msg = 'spawn gemini ENOENT';

    const err = agent.classifyReconnectError(msg);

    expect(err.message).toBe(msg);
    expect(err.retryable).toBe(false);
  });

  it('classifies authentication failures and keeps the message', () => {
    const agent = makeAgent();
    const msg = 'authentication failed: invalid api key';

    const err = agent.classifyReconnectError(msg);

    expect(err.type).toBe(AcpErrorType.AUTHENTICATION_FAILED);
    expect(err.message).toBe(msg);
    expect(err.retryable).toBe(false);
  });

  it('classifies timeouts as retryable and keeps the message', () => {
    const agent = makeAgent();
    const msg = 'connection timed out during startup';

    const err = agent.classifyReconnectError(msg);

    expect(err.type).toBe(AcpErrorType.TIMEOUT);
    expect(err.retryable).toBe(true);
    expect(err.message).toBe(msg);
  });

  it('preserves a config-file error message (actionable, non-retryable)', () => {
    const agent = makeAgent();
    const msg = 'codex CLI failed to start due to a config file error. Please review or temporarily rename config.toml';

    const err = agent.classifyReconnectError(msg);

    expect(err.message).toBe(msg);
    expect(err.retryable).toBe(false);
  });

  it('falls back to a retryable CONNECTION_NOT_READY for unclassified failures, still surfacing the message', () => {
    const agent = makeAgent();
    const msg = 'something unexpected happened';

    const err = agent.classifyReconnectError(msg);

    expect(err.type).toBe(AcpErrorType.CONNECTION_NOT_READY);
    expect(err.retryable).toBe(true);
    expect(err.message).toContain('something unexpected happened');
  });
});
