/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';

vi.mock('electron', () => ({ app: { isPackaged: false, getAppPath: () => process.cwd() } }));

import { PiperWorkerClient } from '@process/services/voice/engine/tts/piperWorker';

const fakeChild = () => {
  const child = new EventEmitter() as EventEmitter & {
    stdin: { write: ReturnType<typeof vi.fn> };
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: ReturnType<typeof vi.fn>;
    pid: number;
  };
  child.stdin = { write: vi.fn() };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn();
  child.pid = 123;
  return child;
};

describe('PiperWorkerClient', () => {
  it('resolves ready, routes chunks by request id, converts pcm to wav chunks', async () => {
    const child = fakeChild();
    const client = new PiperWorkerClient({ spawn: () => child as never, requestTimeoutMs: 1000 });
    const readyP = client.ensureStarted('/uv');
    child.stdout.emit('data', Buffer.from(JSON.stringify({ ready: true }) + '\n'));
    await readyP;

    const chunks: { seq: number; final: boolean; data: Uint8Array }[] = [];
    const doneP = client.synthesize('/model.onnx', 'hello', { speed: 1 }, (c) => chunks.push(c));
    const sent = JSON.parse(child.stdin.write.mock.calls[0][0] as string);
    expect(sent.model).toBe('/model.onnx');
    expect(sent.length_scale).toBe(1);
    child.stdout.emit(
      'data',
      Buffer.from(
        JSON.stringify({
          id: sent.id,
          seq: 0,
          pcm_b64: Buffer.from([0, 0, 1, 0]).toString('base64'),
          sample_rate: 22050,
          final: true,
        }) + '\n',
      ),
    );
    await doneP;
    expect(chunks).toHaveLength(1);
    expect(chunks[0].final).toBe(true);
    // WAV header: RIFF magic + 44-byte header + 4 pcm bytes
    expect(Array.from(chunks[0].data.slice(0, 4))).toEqual([82, 73, 70, 70]);
    expect(chunks[0].data.length).toBe(44 + 4);
  });

  it('rejects in-flight requests when the worker reports an error line', async () => {
    const child = fakeChild();
    const client = new PiperWorkerClient({ spawn: () => child as never, requestTimeoutMs: 1000 });
    const readyP = client.ensureStarted('/uv');
    child.stdout.emit('data', Buffer.from('{"ready":true}\n'));
    await readyP;
    const doneP = client.synthesize('/m.onnx', 'x', {}, () => {});
    const sent = JSON.parse(child.stdin.write.mock.calls[0][0] as string);
    child.stdout.emit('data', Buffer.from(JSON.stringify({ id: sent.id, error: 'boom', final: true }) + '\n'));
    await expect(doneP).rejects.toThrow('boom');
  });

  it('rejects all in-flight requests when the child exits', async () => {
    const child = fakeChild();
    const client = new PiperWorkerClient({ spawn: () => child as never, requestTimeoutMs: 1000 });
    const readyP = client.ensureStarted('/uv');
    child.stdout.emit('data', Buffer.from('{"ready":true}\n'));
    await readyP;
    const doneP = client.synthesize('/m.onnx', 'x', {}, () => {});
    child.emit('exit', 1, null);
    await expect(doneP).rejects.toThrow(/worker exited/);
  });
});
