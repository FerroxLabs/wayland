/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn as nodeSpawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import log from 'electron-log';
import path from 'node:path';
import { app } from 'electron';
import { pcmToWav, type WorkerChunk } from './kokoroWorker';

type Pending = {
  onChunk: (c: WorkerChunk) => void;
  resolve: () => void;
  reject: (e: Error) => void;
  timer: NodeJS.Timeout;
};

export const getPiperWorkerScriptPath = (): string =>
  app.isPackaged
    ? path.join(process.resourcesPath, 'voice-workers', 'piper_worker.py')
    : path.join(app.getAppPath(), 'resources', 'voice-workers', 'piper_worker.py');

const IDLE_SHUTDOWN_MS = 10 * 60 * 1000;

export class PiperWorkerClient {
  private child: ChildProcessWithoutNullStreams | null = null;
  private readyPromise: Promise<void> | null = null;
  private pending = new Map<string, Pending>();
  private buffer = '';
  private idleTimer: NodeJS.Timeout | null = null;
  private nextId = 0;

  constructor(
    private readonly opts: {
      spawn?: typeof nodeSpawn;
      requestTimeoutMs?: number;
    } = {},
  ) {}

  // No model/voices args: Piper's multilingual voices are separate model files,
  // so the model path rides each request and the worker caches loaded voices.
  ensureStarted(uvPath: string): Promise<void> {
    if (this.child && this.readyPromise) return this.readyPromise;
    const spawn = this.opts.spawn ?? nodeSpawn;
    // FLAG PARITY: identical flags to the one-shot synthesis path (no --prerelease for piper).
    const child = spawn(uvPath, ['run', '--with', 'piper-tts', 'python', getPiperWorkerScriptPath()], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.child = child;
    this.readyPromise = new Promise<void>((resolve, reject) => {
      const onLine = (line: string) => {
        try {
          if (JSON.parse(line).ready) resolve();
        } catch {
          /* not the ready line */
        }
      };
      this.attach(child, onLine, reject);
    });
    return this.readyPromise;
  }

  private attach(
    child: ChildProcessWithoutNullStreams,
    onReadyLine: (l: string) => void,
    onStartFail: (e: Error) => void,
  ): void {
    child.stdout.on('data', (buf: Buffer) => {
      this.buffer += buf.toString('utf8');
      let nl;
      while ((nl = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, nl).trim();
        this.buffer = this.buffer.slice(nl + 1);
        if (line) {
          onReadyLine(line);
          this.handleLine(line);
        }
      }
    });
    child.stderr.on('data', (buf: Buffer) => log.info('[piper-worker:stderr]', buf.toString('utf8').trim()));
    child.on('exit', (code, signal) => {
      log.warn('[piper-worker] exited', { code, signal });
      const err = new Error(`piper worker exited (code=${code} signal=${signal})`);
      for (const p of this.pending.values()) {
        clearTimeout(p.timer);
        p.reject(err);
      }
      this.pending.clear();
      this.child = null;
      this.readyPromise = null;
      onStartFail(err);
    });
    child.on('error', (err) => {
      log.error('[piper-worker] spawn error', { error: String(err) });
      onStartFail(err as Error);
    });
  }

  private handleLine(line: string): void {
    let msg: { id?: string; seq?: number; pcm_b64?: string; sample_rate?: number; final?: boolean; error?: string };
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    if (!msg.id) return;
    const p = this.pending.get(msg.id);
    if (!p) return;
    if (msg.error) {
      clearTimeout(p.timer);
      this.pending.delete(msg.id);
      p.reject(new Error(msg.error));
      return;
    }
    const pcm = Buffer.from(msg.pcm_b64 ?? '', 'base64');
    p.onChunk({
      data: pcmToWav(new Uint8Array(pcm), msg.sample_rate ?? 22050),
      seq: msg.seq ?? 0,
      final: Boolean(msg.final),
    });
    if (msg.final) {
      clearTimeout(p.timer);
      this.pending.delete(msg.id);
      p.resolve();
    }
    this.touchIdleTimer();
  }

  synthesize(
    modelPath: string,
    text: string,
    opts: { speed?: number },
    onChunk: (c: WorkerChunk) => void,
  ): Promise<void> {
    const child = this.child;
    if (!child) return Promise.reject(new Error('piper worker not started'));
    const id = `p${++this.nextId}`;
    const timeoutMs = this.opts.requestTimeoutMs ?? 30_000;
    const lengthScale = 1 / Math.min(2, Math.max(0.5, opts.speed ?? 1.0));
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`piper worker request timed out after ${timeoutMs}ms`));
        this.shutdown(); // a wedged worker is killed; chain runner fails over
      }, timeoutMs);
      this.pending.set(id, { onChunk, resolve, reject, timer });
      child.stdin.write(JSON.stringify({ id, model: modelPath, text, length_scale: lengthScale }) + '\n');
      this.touchIdleTimer();
    });
  }

  private touchIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.pending.size === 0) this.shutdown();
    }, IDLE_SHUTDOWN_MS);
  }

  shutdown(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.child?.kill();
    this.child = null;
    this.readyPromise = null;
  }
}

export const sharedPiperWorker = new PiperWorkerClient();
