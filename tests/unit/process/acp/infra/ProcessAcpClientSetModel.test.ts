/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { RequestError } from '@agentclientprotocol/sdk';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import type { ProtocolHandlers } from '@process/acp/types';

function makeClient(connOverrides: Record<string, unknown>) {
  const handlers = {} as ProtocolHandlers;
  const client = new ProcessAcpClient(() => Promise.reject(new Error('no spawn in unit test')), {
    backend: 'opencode',
    handlers,
  });
  // Inject a fake SDK connection so the `conn` getter resolves it (bypasses spawn).
  (client as unknown as { connection: unknown }).connection = {
    unstable_setSessionModel: vi.fn(),
    ...connOverrides,
  };
  return client;
}

describe('ProcessAcpClient.setModel feature-detection (#298)', () => {
  it('stops calling session/set_model after a -32601 "Method not found" rejection', async () => {
    const setSessionModel = vi.fn().mockRejectedValue(new RequestError(-32601, 'Method not found'));
    const client = makeClient({ unstable_setSessionModel: setSessionModel });

    // First call learns the method is unsupported and swallows the error.
    await expect(client.setModel('sess-1', 'gpt-5')).resolves.toBeUndefined();
    expect(setSessionModel).toHaveBeenCalledTimes(1);

    // Subsequent calls are skipped entirely - no repeated RPC, no log flood.
    await expect(client.setModel('sess-1', 'gpt-5')).resolves.toBeUndefined();
    await expect(client.setModel('sess-1', 'claude')).resolves.toBeUndefined();
    expect(setSessionModel).toHaveBeenCalledTimes(1);
  });

  it('re-throws non-method-not-found errors (does not mark unsupported)', async () => {
    const setSessionModel = vi
      .fn()
      .mockRejectedValueOnce(new RequestError(-32603, 'Internal error'))
      .mockResolvedValue(undefined);
    const client = makeClient({ unstable_setSessionModel: setSessionModel });

    await expect(client.setModel('sess-1', 'gpt-5')).rejects.toBeInstanceOf(RequestError);
    // Not marked unsupported - a later call still goes through.
    await expect(client.setModel('sess-1', 'gpt-5')).resolves.toBeUndefined();
    expect(setSessionModel).toHaveBeenCalledTimes(2);
  });

  it('keeps sending session/set_model on the happy path', async () => {
    const setSessionModel = vi.fn().mockResolvedValue(undefined);
    const client = makeClient({ unstable_setSessionModel: setSessionModel });

    await client.setModel('sess-1', 'gpt-5');
    await client.setModel('sess-1', 'claude');
    expect(setSessionModel).toHaveBeenCalledTimes(2);
  });
});
