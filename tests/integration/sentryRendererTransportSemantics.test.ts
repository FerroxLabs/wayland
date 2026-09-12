/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const rendererEntry = require.resolve('@sentry/electron/renderer');
const rendererDirectory = path.dirname(rendererEntry);
const ipcModule = require(path.join(rendererDirectory, 'ipc.js')) as {
  getIPC: () => { sendEnvelope: (body: string | Uint8Array) => void };
};
const transportModule = require(path.join(rendererDirectory, 'transport.js')) as {
  makeRendererTransport: (options: {
    recordDroppedEvent: (reason: string, category: string) => void;
    bufferSize?: number;
  }) => {
    send: (envelope: unknown) => Promise<{ statusCode?: number }>;
    flush: (timeout?: number) => Promise<boolean>;
  };
};

const originalGetIPC = ipcModule.getIPC;

afterEach(() => {
  ipcModule.getIPC = originalGetIPC;
});

describe('installed Sentry Electron renderer transport semantics', () => {
  it('returns local 200 after fire-and-forget IPC without a server delivery receipt', async () => {
    const sendEnvelope = vi.fn();
    ipcModule.getIPC = () => ({ sendEnvelope });
    const transport = transportModule.makeRendererTransport({
      bufferSize: 1,
      recordDroppedEvent: vi.fn(),
    });
    const syntheticEnvelope = [
      { event_id: 'synthetic-feedback-event' },
      [[{ type: 'event' }, { level: 'info', message: 'synthetic feedback fixture' }]],
    ];

    const response = await transport.send(syntheticEnvelope);
    const flushed = await transport.flush(1_000);

    expect(sendEnvelope).toHaveBeenCalledOnce();
    expect(response).toEqual({ statusCode: 200 });
    expect(flushed).toBe(true);
    // The fake IPC has no response channel at all. Status 200 and flush=true
    // establish only local handoff, which is why the UI says unconfirmed.
    expect(sendEnvelope.mock.results[0]?.type).toBe('return');
    expect(sendEnvelope.mock.results[0]?.value).toBeUndefined();
  });
});
