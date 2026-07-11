/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #787: AcpConnection must forward wayland-core's per-turn `turn_id` (stamped on
 * the ACP terminal frame, wcore PR #219) from the end_turn prompt result to
 * `onEndTurn`, so the finish signal carries turn identity for TeammateManager's
 * per-turn finalize dedup. Older engines omit the field → forward `undefined`
 * (the finish then falls back to conversation-only keying, unchanged behaviour).
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('child_process', () => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));
vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
}));
vi.mock('@process/utils/shellEnv', () => ({
  getNpxCacheDir: vi.fn(() => '/tmp/npx'),
  getWindowsShellExecutionOptions: vi.fn(() => ({})),
  resolveNpxPath: vi.fn(() => 'npx'),
}));
vi.mock('@process/agent/acp/acpConnectors', () => ({
  ACP_PERF_LOG: false,
  spawnGenericBackend: vi.fn(),
  connectClaude: vi.fn(),
  connectCodebuddy: vi.fn(),
  connectCodex: vi.fn(),
  prepareCleanEnv: vi.fn(async () => ({})),
}));

import { AcpConnection } from '../../src/process/agent/acp/AcpConnection';

type Internal = {
  pendingRequests: Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>;
  handleMessage: (m: unknown) => void;
};

/** Drive a JSON-RPC prompt RESULT through the connection's message handler. */
function deliverPromptResult(conn: AcpConnection, result: Record<string, unknown>): void {
  const internal = conn as unknown as Internal;
  internal.pendingRequests.set(1, { resolve: () => {}, reject: () => {} });
  internal.handleMessage({ id: 1, result });
}

describe('AcpConnection #787 turn_id forwarding', () => {
  let conn: AcpConnection;

  beforeEach(() => {
    vi.clearAllMocks();
    conn = new AcpConnection();
  });

  it('forwards the per-turn turn_id from an end_turn result to onEndTurn', () => {
    const onEndTurn = vi.fn();
    conn.onEndTurn = onEndTurn;

    deliverPromptResult(conn, { stopReason: 'end_turn', turn_id: 'turn-uuid-1' });

    expect(onEndTurn).toHaveBeenCalledTimes(1);
    expect(onEndTurn).toHaveBeenCalledWith('turn-uuid-1');
  });

  it('forwards undefined when an older engine omits turn_id', () => {
    const onEndTurn = vi.fn();
    conn.onEndTurn = onEndTurn;

    deliverPromptResult(conn, { stopReason: 'end_turn' });

    expect(onEndTurn).toHaveBeenCalledTimes(1);
    expect(onEndTurn).toHaveBeenCalledWith(undefined);
  });

  it('ignores a non-string turn_id (defensive) → undefined', () => {
    const onEndTurn = vi.fn();
    conn.onEndTurn = onEndTurn;

    deliverPromptResult(conn, { stopReason: 'end_turn', turn_id: 12345 });

    expect(onEndTurn).toHaveBeenCalledWith(undefined);
  });
});
